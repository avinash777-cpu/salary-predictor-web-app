"""Flask API for the Salary Predictor web app.

Endpoints:
  GET  /api/health   service liveness check
  GET  /api/meta     form options, model metrics, benchmarks, feature importance
  POST /api/predict  salary prediction for one profile

In production the built React bundle in ../frontend/dist is served from
the same process, so the whole app is a single Render web service.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS = BASE_DIR / "ml" / "artifacts"
DATA_PATH = BASE_DIR / "ml" / "data" / "salary_dataset.csv"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

APP_TITLE = "Salary Predictor"
APP_TAGLINE = "ML-powered salary estimation for the Indian job market"

MODEL = joblib.load(ARTIFACTS / "pipeline.pkl")
METRICS = json.loads((ARTIFACTS / "metrics.json").read_text())
BENCHMARKS = json.loads((ARTIFACTS / "benchmarks.json").read_text())
DATASET = pd.read_csv(DATA_PATH)

FEATURES = ["experience_years", "education", "job_title", "city", "company_size", "industry"]
EXP_BINS = [0, 2, 5, 9, 14, 30]
EXP_LABELS = ["0-2 yrs", "3-5 yrs", "6-9 yrs", "10-14 yrs", "15+ yrs"]
ROLE_AVG = {item["label"]: item["value"] for item in BENCHMARKS["by_job_title"]}


def options(field: str) -> list[str]:
    return sorted(DATASET[field].unique().tolist())


def experience_bucket(years: float) -> str:
    for upper, label in zip(EXP_BINS[1:], EXP_LABELS):
        if years <= upper:
            return label
    return EXP_LABELS[-1]


app = Flask(__name__, static_folder=None)
CORS(app)


@app.get("/api/health")
def health():
    return jsonify(status="ok", model=METRICS["best_model"])


@app.get("/api/meta")
def meta():
    return jsonify(
        title=APP_TITLE,
        tagline=APP_TAGLINE,
        currency="INR",
        options={
            "education": options("education"),
            "job_title": options("job_title"),
            "city": options("city"),
            "company_size": options("company_size"),
            "industry": options("industry"),
        },
        metrics=METRICS,
        benchmarks=BENCHMARKS,
        defaults={
            "experience_years": 5,
            "education": "Bachelor's",
            "job_title": "Software Engineer",
            "city": "Bangalore",
            "company_size": "Mid-size",
            "industry": "Product Company",
        },
    )


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    errors: dict[str, str] = {}

    raw_exp = payload.get("experience_years")
    try:
        experience = float(raw_exp)
        if not 0 <= experience <= 30:
            raise ValueError
    except (TypeError, ValueError):
        experience = -1
        errors["experience_years"] = "Experience must be a number between 0 and 30."

    profile: dict[str, object] = {"experience_years": experience}
    for field in FEATURES[1:]:
        value = payload.get(field)
        allowed = options(field)
        if value not in allowed:
            errors[field] = f"Choose a valid {field.replace('_', ' ')}."
        profile[field] = value

    if errors:
        return jsonify(ok=False, errors=errors), 400

    row = pd.DataFrame([profile], columns=FEATURES)
    salary = float(MODEL.predict(row)[0])
    salary = max(round(salary, -3), 0)

    band = METRICS["residual_std"] * 1.25  # ~80% prediction interval
    low = max(round(salary - band, -3), 0)
    high = round(salary + band, -3)

    job = str(profile["job_title"])
    exp_label = experience_bucket(experience)
    role_avg = ROLE_AVG.get(job, BENCHMARKS["overall_avg"])
    role_exp_avg = (
        BENCHMARKS["by_job_experience"].get(job, {}).get(exp_label, role_avg)
    )

    percentiles = DATASET["salary_inr"].quantile([0.25, 0.5, 0.75]).astype(int)
    pct_above = float((DATASET["salary_inr"] < salary).mean() * 100)

    return jsonify(
        ok=True,
        salary=int(salary),
        low=int(low),
        high=int(high),
        monthly=int(salary // 12),
        experience_bucket=exp_label,
        percentile=round(pct_above, 1),
        comparison={
            "overall_avg": BENCHMARKS["overall_avg"],
            "role_avg": int(role_avg),
            "role_experience_avg": int(role_exp_avg),
        },
        dataset_quartiles={
            "p25": int(percentiles.loc[0.25]),
            "p50": int(percentiles.loc[0.5]),
            "p75": int(percentiles.loc[0.75]),
        },
        model=METRICS["best_model"],
    )


# ---------------------------------------------------------------- static SPA

if FRONTEND_DIST.exists():

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIST, "index.html")

    @app.get("/<path:path>")
    def static_assets(path: str):
        file = FRONTEND_DIST / path
        if file.is_file():
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")

else:

    @app.get("/")
    def index_placeholder():
        return (
            "<h1>Salary Predictor API</h1>"
            "<p>Frontend bundle not built yet. Run <code>npm run build</code> "
            "inside <code>frontend/</code>.</p>"
        )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
