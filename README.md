# Salary Predictor

> A full-stack machine-learning web app that estimates salaries across the Indian job market — synthetic data generation, model training, REST API and a polished React front end, deployable to Render in one click.

![Python](https://img.shields.io/badge/Python-3.14-22d3ee?style=flat-square&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.9-8b5cf6?style=flat-square&logo=scikitlearn&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-38bdf8?style=flat-square&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Vite-3178c6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Overview

Salary Predictor answers one question: **"What salary should I expect for this profile?"**

Feed it six inputs — experience, education, job role, location, company size and industry —
and a Gradient Boosting regressor returns a calibrated annual CTC estimate with an 80%
confidence band, monthly breakdown, market percentile and live benchmark comparisons.

### Features

- **Regression model** predicting exact salary in INR (CTC), trained on a 5,000-row
  synthetic dataset built from domain-informed rules (role base pay, experience growth
  curves, education premium, city tier, company size, industry multipliers + noise).
- **Four algorithms benchmarked** (Linear, Ridge, Random Forest, Gradient Boosting) with
  the winner selected on hold-out R² / MAE.
- **Full evaluation report** on the site: R², MAE, RMSE, MAPE, algorithm comparison and
  permutation feature importance — no black box.
- **Live benchmarking** — your estimate compared against the same role, same
  role + experience band, and the overall market average, plus dataset quartiles.
- **Dataset insight explorer** — average salary by experience, education, city and role,
  computed from the training data.
- **Quick presets** — one-click sample profiles (Fresher Dev, Data Scientist, PM, Cloud
  Architect) for instant demos.
- **REST API** with input validation, error payloads and CORS support.
- **Sci-fi glass UI** — responsive, animated, built with hand-crafted CSS (no UI kit).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Render (web service)                     │
│                                                                  │
│  ┌──────────────┐   HTTP/JSON   ┌────────────────────────────┐  │
│  │  React SPA   │ ────────────► │  Flask + Gunicorn          │  │
│  │  Vite + TS   │  /api/*       │  /api/predict  /api/meta   │  │
│  │  dist/ served│ ◄──────────── │  static file server (SPA)  │  │
│  └──────────────┘               └──────────────┬─────────────┘  │
│                                                │                 │
│                                 ┌──────────────▼─────────────┐  │
│                                 │  sklearn Pipeline          │  │
│                                 │  OneHot + Scale + GBR      │  │
│                                 │  (trained at build time)   │  │
│                                 └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Offline training loop (run locally or during deploy build):
  generate_data.py  →  salary_dataset.csv  →  train.py  →  pipeline.pkl
                                                       →  metrics.json
                                                       →  benchmarks.json
```

## Model performance

Trained with an 80/20 stratified split (`random_state=42`), evaluated on the held-out test set:

| Model              | R²      | MAPE   | MAE (₹)     | RMSE (₹)    |
| ------------------ | ------- | ------ | ----------- | ----------- |
| **Gradient Boosting** | **0.9472** | **9.74%** | **181,574**  | **251,781**  |
| Linear Regression  | 0.9015  | 17.33% | 263,574     | 344,030     |
| Ridge Regression   | 0.9014  | 17.29% | 263,574     | 344,132     |
| Random Forest      | 0.8574  | 17.62% | 311,011     | 413,946     |

> The dataset is generated with compounding, saturating role-growth curves — a boosted
> tree model captures that non-linearity, while linear models underfit.

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Data       | NumPy, pandas (synthetic generator with fixed seed) |
| ML         | scikit-learn (`ColumnTransformer` + `Pipeline` + `GradientBoostingRegressor`), joblib |
| Backend    | Flask, flask-cors, Gunicorn |
| Frontend   | React 19, TypeScript, Vite |
| Styling    | Custom CSS design system (glassmorphism, aurora gradients, motion) |
| Deploy     | Render (blueprint via `render.yaml`) |

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm

### 1. Backend (API + model training)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cd ml
python generate_data.py            # writes data/salary_dataset.csv
python train.py                    # writes artifacts/{pipeline,metrics,benchmarks}
cd ..

python app.py                      # API on http://127.0.0.1:5001
```

### 2. Frontend (dev server)

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173 (proxies /api → :5001)
```

### 3. Production build (single process)

```bash
cd frontend && npm run build        # outputs frontend/dist
cd ../backend && python app.py      # serves SPA + API on :5001
```

## API reference

| Method | Endpoint       | Description |
| ------ | -------------- | ----------- |
| `GET`  | `/api/health`  | Liveness check + selected model name |
| `GET`  | `/api/meta`    | Form options, model metrics, benchmark aggregates, defaults |
| `POST` | `/api/predict` | Salary prediction for a profile |

`POST /api/predict` body:

```json
{
  "experience_years": 7,
  "education": "Master's",
  "job_title": "Machine Learning Engineer",
  "city": "Bangalore",
  "company_size": "MNC",
  "industry": "Product Company"
}
```

Response (abridged):

```json
{
  "ok": true,
  "salary": 3302000,
  "low": 2987000,
  "high": 3617000,
  "monthly": 275166,
  "percentile": 86.5,
  "comparison": { "overall_avg": 1957040, "role_avg": 2790822, "role_experience_avg": 2443333 },
  "model": "Gradient Boosting"
}
```

Invalid inputs return `400` with a field-to-message error map.

## Deployment (Render)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint** → select the repo. `render.yaml` defines the service.
3. Render runs the build: installs Python + Node deps, trains the model, builds the SPA.
4. The service starts Gunicorn, which serves the API and the built React app together.

Manual setup also works: build command
`pip install -r requirements.txt && cd backend/ml && python train.py && cd ../../frontend && npm install && npm run build`,
start command `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT`.

## Project structure

```
├── render.yaml                 # Render blueprint (build + start commands)
├── requirements.txt            # root requirements (for Render Python env)
├── backend/
│   ├── app.py                  # Flask API + static SPA server
│   ├── requirements.txt
│   └── ml/
│       ├── generate_data.py    # synthetic dataset generator
│       ├── train.py            # trains & benchmarks 4 regressors
│       ├── data/salary_dataset.csv
│       └── artifacts/          # pipeline.pkl, metrics.json, benchmarks.json
└── frontend/
    └── src/
        ├── App.tsx             # layout + state orchestration
        ├── api.ts              # typed API client
        ├── types.ts            # shared TS models
        ├── format.ts           # INR formatting helpers
        ├── index.css           # design system
        └── components/         # Nav, Hero, Presets, PredictorForm,
                                # ResultCard, ComparisonChart,
                                # MetricsSection, InsightsSection, Footer
```

## Roadmap

- [ ] Confidence interval calibrated with quantile regression
- [ ] SHAP-based local explanations per prediction
- [ ] Experience-elevation negotiation tips per role
- [ ] Model retraining job on a schedule with drift monitoring

## Disclaimer

This project uses **synthetic data** generated for demonstration purposes. Figures are
indicative only and should not be used for real compensation decisions.

## License

MIT
