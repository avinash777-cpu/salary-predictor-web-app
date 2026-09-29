"""Train and evaluate salary regression models.

Selects the best model on the held-out test set and persists:
  - artifacts/pipeline.onnx      best pipeline exported as ONNX (non-executable format)
  - artifacts/pipeline.onnx.sha256  integrity digest of the ONNX artifact
  - artifacts/metrics.json       per-model metrics + feature importances
  - artifacts/benchmarks.json    dataset aggregates used by the comparison chart

The model is served as an ONNX graph instead of a pickle so that loading it
cannot execute arbitrary Python code.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
from skl2onnx import to_onnx
from skl2onnx.common.data_types import FloatTensorType, StringTensorType
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

import generate_data

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "salary_dataset.csv"
ARTIFACTS = BASE_DIR / "artifacts"

TARGET = "salary_inr"
NUMERIC = ["experience_years"]
CATEGORICAL = ["education", "job_title", "city", "company_size", "industry"]

MODELS = {
    "Linear Regression": LinearRegression(),
    "Ridge Regression": Ridge(alpha=1.0),
    "Random Forest": RandomForestRegressor(
        n_estimators=300, max_depth=14, min_samples_leaf=3, random_state=42, n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=400, max_depth=4, learning_rate=0.06, subsample=0.9, random_state=42
    ),
}


def ensure_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        print("Dataset not found -> generating synthetic data ...")
        cwd = Path.cwd()
        try:
            import os

            os.chdir(BASE_DIR)
            generate_data.main()
        finally:
            os.chdir(cwd)
    return pd.read_csv(DATA_PATH)


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
        ]
    )


def evaluate(name: str, model, X_tr, y_tr, X_te, y_te) -> tuple[dict, Pipeline]:
    pipe = Pipeline([("prep", build_preprocessor()), ("model", model)])
    pipe.fit(X_tr, y_tr)
    preds = pipe.predict(X_te)

    metrics = {
        "model": name,
        "r2": round(float(r2_score(y_te, preds)), 4),
        "mae": round(float(mean_absolute_error(y_te, preds)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(y_te, preds))), 2),
        "mape": round(
            float(np.mean(np.abs((y_te - preds) / np.where(y_te == 0, 1, y_te))) * 100), 2
        ),
    }
    print(f"  {name:22s} R2={metrics['r2']:.4f}  MAE=₹{metrics['mae']:,.0f}  "
          f"RMSE=₹{metrics['rmse']:,.0f}  MAPE={metrics['mape']:.2f}%")
    return metrics, pipe


def feature_importance(pipe: Pipeline, X_te: pd.DataFrame, y_te: pd.Series) -> list[dict]:
    result = permutation_importance(
        pipe, X_te, y_te, n_repeats=8, random_state=42, n_jobs=-1
    )
    names = list(X_te.columns)
    order = np.argsort(result.importances_mean)[::-1]
    return [
        {"feature": names[i], "importance": round(float(result.importances_mean[i]), 4)}
        for i in order
    ]


def build_benchmarks(df: pd.DataFrame) -> dict:
    def series_to_list(s: pd.Series) -> list[dict]:
        return [
            {"label": str(idx), "value": int(round(float(val)))}
            for idx, val in s.items()
        ]

    exp_bins = [0, 2, 5, 9, 14, 30]
    exp_labels = ["0-2 yrs", "3-5 yrs", "6-9 yrs", "10-14 yrs", "15+ yrs"]
    exp_bucket = pd.cut(
        df["experience_years"], bins=exp_bins, labels=exp_labels, right=True, include_lowest=True
    )

    return {
        "overall_avg": int(round(float(df[TARGET].mean()))),
        "median": int(round(float(df[TARGET].median()))),
        "by_job_title": series_to_list(
            df.groupby("job_title", observed=True)[TARGET].mean().sort_values(ascending=False)
        ),
        "by_experience": series_to_list(
            df.groupby(exp_bucket, observed=True)[TARGET].mean()
        ),
        "by_education": series_to_list(
            df.groupby("education", observed=True)[TARGET].mean()
        ),
        "by_city": series_to_list(
            df.groupby("city", observed=True)[TARGET].mean().sort_values(ascending=False)
        ),
        "by_job_experience": {
            str(job): {
                str(b): int(round(float(v)))
                for b, v in grp.groupby(exp_bucket, observed=True)[TARGET].mean().items()
            }
            for job, grp in df.groupby("job_title", observed=True)
        },
        "rows": int(len(df)),
    }


def main() -> None:
    df = ensure_data()
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    X = df[CATEGORICAL + NUMERIC]
    y = df[TARGET]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training models ...")
    all_metrics = []
    best_key: tuple[float, float] = (-1e18, -1e18)
    best_pipe: Pipeline | None = None
    best_name = ""
    for name, model in MODELS.items():
        metrics, pipe = evaluate(name, model, X_tr, y_tr, X_te, y_te)
        all_metrics.append(metrics)
        # rank by R2, break ties with lower MAE
        key = (metrics["r2"], -metrics["mae"])
        if key > best_key:
            best_key, best_pipe, best_name = key, pipe, name

    print(f"\nBest model: {best_name}")
    importances = feature_importance(best_pipe, X_te, y_te)

    # hold-out residuals give a practical prediction band
    best_preds = best_pipe.predict(X_te)
    residual_std = float(np.std(y_te.to_numpy() - best_preds))

    payload = {
        "best_model": best_name,
        "models": all_metrics,
        "feature_importance": importances,
        "residual_std": round(residual_std, 2),
        "target": TARGET,
        "features": NUMERIC + CATEGORICAL,
    }

    onnx_model = to_onnx(
        best_pipe,
        initial_types=[
            (name, FloatTensorType([None, 1])) if name in NUMERIC
            else (name, StringTensorType([None, 1]))
            for name in CATEGORICAL + NUMERIC
        ],
    )
    onnx_bytes = onnx_model.SerializeToString()
    (ARTIFACTS / "pipeline.onnx").write_bytes(onnx_bytes)
    (ARTIFACTS / "pipeline.onnx.sha256").write_text(
        hashlib.sha256(onnx_bytes).hexdigest()
    )
    (ARTIFACTS / "metrics.json").write_text(json.dumps(payload, indent=2))
    (ARTIFACTS / "benchmarks.json").write_text(
        json.dumps(build_benchmarks(df), indent=2)
    )
    print(f"Saved ONNX pipeline, metrics and benchmarks to {ARTIFACTS}")


if __name__ == "__main__":
    main()
