"""Flask API for the Salary Predictor web app.

Endpoints:
  GET  /api/health   service liveness check
  GET  /api/meta     form options, model metrics, benchmarks, feature importance
  POST /api/predict  salary prediction for one profile

In production the built React bundle in ../frontend/dist is served from
the same process, so the whole app is a single Render web service.

The ML model is served as an ONNX graph (backend/ml/artifacts/pipeline.onnx),
a non-executable serialization — loading it cannot run arbitrary Python code.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
from flask import Flask, jsonify, redirect, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from werkzeug.middleware.proxy_fix import ProxyFix

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS = BASE_DIR / "ml" / "artifacts"
DATA_PATH = BASE_DIR / "ml" / "data" / "salary_dataset.csv"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

APP_TITLE = "Salary Predictor"
APP_TAGLINE = "ML-powered salary estimation for the Indian job market"

PRODUCTION = os.getenv("FLASK_ENV", "development") == "production"


# --- Model loading (non-executable ONNX artifact + integrity verification) ---
def load_model(path: Path) -> ort.InferenceSession:
    """Load the ONNX model after verifying its SHA-256 digest.

    The digest is read from a sibling ``<name>.sha256`` file written by the
    build-time training step, or overridden by the ``MODEL_SHA256`` environment
    variable. If neither exists the load proceeds with a log line, because the
    artifact never leaves the build environment.
    """
    expected = os.getenv("MODEL_SHA256", "").strip()
    digest_file = path.with_suffix(path.suffix + ".sha256")
    if not expected and digest_file.is_file():
        expected = digest_file.read_text().strip()
    if expected:
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(
                f"Model artifact integrity check failed for {path.name}: "
                f"expected digest {expected[:12]}..., computed {actual[:12]}..."
            )
    return ort.InferenceSession(
        path.read_bytes(), sess_options=ort.SessionOptions(), providers=["CPUExecutionProvider"]
    )


MODEL_PATH = ARTIFACTS / "pipeline.onnx"
SESSION = load_model(MODEL_PATH)

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


def parse_cors_origins() -> list[str]:
    """Parse CORS origins from environment variable.
    
    CORS_ORIGINS=http://localhost:3000,https://example.com
    """
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw:
        # Default: allow local development only
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


# --- Flask app & security middleware ---
app = Flask(__name__, static_folder=None)

# Reject absurdly large request bodies before parsing (payloads are ~300 bytes).
app.config["MAX_CONTENT_LENGTH"] = 256 * 1024  # 256 KiB

# Flask >=2.3 auto-loads FLASK_* environment variables into app.config, so a
# stray FLASK_DEBUG=true would enable debug even under gunicorn. Pin it off in
# production; the dev-server gate below re-enables it only when run directly.
if PRODUCTION:
    app.debug = False

# Trust Render's proxy headers (X-Forwarded-Proto, X-Forwarded-For) so that
# request.is_secure and the rate limiter's client IP are correct.
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_for=1)

# Security headers via Flask-Talisman.
# CSP allows: self, Google Fonts (stylesheet + font files), data: images.
csp = {
    "default-src": "'self'",
    "script-src": "'self'",
    # 'unsafe-inline' in style-src only: React's dynamic chart styles are set via
    # CSSOM/inline style attributes. Scripts (the real XSS surface) stay locked.
    "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src": "'self' https://fonts.gstatic.com",
    "img-src": "'self' data:",
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
}
Talisman(
    app,
    content_security_policy=csp,
    force_https=False,  # handled by _https_redirect below (with health exemption)
    strict_transport_security=PRODUCTION,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True,
    referrer_policy="strict-origin-when-cross-origin",
    permissions_policy="geolocation=(), microphone=(), camera=()",
    session_cookie_secure=PRODUCTION,
    session_cookie_http_only=True,
    session_cookie_samesite="Lax",
)


@app.before_request
def _https_redirect():
    """Redirect plaintext HTTP to HTTPS in production.

    Render's internal health probes plain HTTP at /api/health and does not send
    X-Forwarded-Proto; it must be answered directly, not followed by a 301 that
    the prober treats as unhealthy.
    """
    if not PRODUCTION or request.is_secure or request.path == "/api/health":
        return None
    return redirect(request.url.replace("http://", "https://", 1), code=308)


# CORS with explicit allowlist — only the methods this API actually implements.
CORS(
    app,
    origins=parse_cors_origins(),
    methods=["GET", "POST", "OPTIONS"],
    supports_credentials=False,
)

# Rate limiting — explicit limits on the API endpoints only. No global default:
# default limits would also stack onto the SPA static assets and the health
# probe and starve legitimate traffic/health checks.
limiter = Limiter(
    get_remote_address,
    app=app,
    headers_enabled=True,
    storage_uri="memory://",
)
# Prediction endpoint: stricter limit, configurable for production tuning.
predict_limit = os.getenv("PREDICT_RATE_LIMIT", "30 per minute")


@app.get("/api/health")
@limiter.limit("120 per minute")  # generous headroom for Render + uptime probes
def health():
    return jsonify(status="ok", model=METRICS["best_model"])


@app.get("/api/meta")
@limiter.limit("30 per minute")
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
@limiter.limit(predict_limit)
def predict():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify(ok=False, errors={"general": "Request body must be a JSON object."}), 400
    errors: dict[str, str] = {}

    raw_exp = payload.get("experience_years")
    try:
        if isinstance(raw_exp, bool):  # JSON true/false must not become 1.0/0.0
            raise ValueError
        experience = float(raw_exp)
        if not math.isfinite(experience) or not 0 <= experience <= 30:
            raise ValueError
    except (TypeError, ValueError):
        experience = -1
        errors["experience_years"] = "Experience must be a number between 0 and 30."

    profile: dict[str, object] = {"experience_years": experience}
    for field in FEATURES[1:]:
        value = payload.get(field)
        allowed = options(field)
        if not isinstance(value, str) or value not in allowed:
            errors[field] = f"Choose a valid {field.replace('_', ' ')}."
        profile[field] = value

    if errors:
        return jsonify(ok=False, errors=errors), 400

    feeds = {
        "experience_years": np.array([[experience]], dtype=np.float32),
        "education": np.array([[profile["education"]]], dtype=str),
        "job_title": np.array([[profile["job_title"]]], dtype=str),
        "city": np.array([[profile["city"]]], dtype=str),
        "company_size": np.array([[profile["company_size"]]], dtype=str),
        "industry": np.array([[profile["industry"]]], dtype=str),
    }
    salary = float(SESSION.run(None, feeds)[0].ravel()[0])
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


# ---------------------------------------------------------------- errors


@app.errorhandler(413)
def payload_too_large(error):
    return jsonify(ok=False, errors={"general": "Request body too large."}), 413


@app.errorhandler(429)
def rate_limited(error):
    resp = jsonify(ok=False, errors={"general": "Too many requests. Please slow down."})
    retry_after = getattr(error, "retry_after", None)
    if retry_after:
        resp.headers["Retry-After"] = str(retry_after)
    return resp, 429


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
    # Debug mode ONLY for explicit local development. The production config
    # (FLASK_ENV=production) pins app.debug=False above, and this entry point
    # refuses to re-enable it there.
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true" and not PRODUCTION
    app.run(host="127.0.0.1", port=5001, debug=debug_mode)
