# Salary Predictor

> A full-stack machine-learning web app that estimates salaries across the Indian job market — with transparent accuracy metrics, live market benchmarks and a polished, responsive interface.

![Python](https://img.shields.io/badge/Python-3.14-22d3ee?style=flat-square&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.9-8b5cf6?style=flat-square&logo=scikitlearn&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-38bdf8?style=flat-square&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Vite-3178c6?style=flat-square&logo=typescript&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live_Demo-salary--predictor.onrender.com-46e3b7?style=flat-square)](https://salary-predictor-1ta9.onrender.com/)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Live Demo

### 👉 **https://salary-predictor-1ta9.onrender.com**

> First load can take ~50 s while the free-tier instance wakes from sleep — subsequent
> requests are instant.

---

## Overview

Salary Predictor answers one practical question: **"What salary should I expect for this profile?"**

You describe your profile — experience, education, job role, location, company size and
industry — and the app returns a **calibrated annual CTC estimate in INR** with:

- an **80 % confidence range** (not just a single number),
- your **monthly in-hand approximation**,
- the **market percentile** your estimate sits at,
- and a **side-by-side comparison** against the same role, the same role at your experience
  level, and the overall market average.

Everything is backed by a published accuracy report, so users can judge how much to trust
the number — the opposite of a black-box calculator.

---

## Features in detail

### 1. Salary prediction engine

The core of the app. Six inputs feed a trained regression model:

| Input             | Examples                                              | Why it matters |
| ----------------- | ----------------------------------------------------- | -------------- |
| Experience        | 0 – 30 years (0.5 steps)                              | Strongest driver of salary growth |
| Education         | Bachelor's / Master's / PhD                           | Captures qualification premium |
| Job role          | 18 roles — Software Engineer → Cloud Architect → CA   | Roles have very different base pay |
| Location          | 10 cities incl. Remote                               | City-tier cost/pay differences |
| Company size      | Startup → SMB → Mid-size → Enterprise → MNC           | Larger firms typically pay more |
| Industry          | Product, Fintech, IT Services, E-commerce, …          | Industry margins affect budgets |

The model returns the prediction in milliseconds along with every derived figure shown in
the result panel — no page reloads, no round-trip latency the user can feel.

### 2. Calibrated range, not a false-precise number

A single salary figure implies precision the model doesn't have. Instead the app shows an
**80 % confidence band** around the estimate, computed from the model's standard residual
error on the held-out test set (`±1.25 × RMSE-residual`). The marker on the range bar shows
where the point estimate falls inside that band, alongside the matching **experience
bucket** (e.g. `3-5 yrs`) so the user knows which cohort the range represents.

### 3. Monthly breakdown & market percentile

- **Monthly in-hand ≈** — the annual estimate divided by 12 for quick budgeting context.
- **Percentile** — computed by ranking the estimate against all 5,000 training profiles
  (`top 14 %` means only 14 % of profiles in the dataset earn more).
- **vs role average** — instantly shows whether you're above or below your role's mean,
  as a signed percentage.

### 4. Live market benchmarking (comparison chart)

Every prediction renders a horizontal bar chart comparing four values on one scale:

1. **Your prediction** (highlighted gradient bar)
2. **Same role + same experience band** — the fairest apples-to-apples benchmark
3. **Same role, all experience levels** — career-span average for the role
4. **Market average** — mean across the entire dataset

Each benchmark bar also shows the **signed % difference** from your prediction, so
"₹23 L vs ₹24 L" instantly reads as "−4.2 %". Below the bars sits a **quartile strip**:
the shaded box spans P25–P75 of the dataset with a median tick — a quick read of where the
middle 50 % of all salaries land.

### 5. Published model accuracy (transparency report)

Rather than claiming "AI-powered", the app shows the actual numbers:

| Metric | Meaning on this site |
| ------ | -------------------- |
| **R²** (0.947) | The model explains 94.7 % of salary variance in the test set |
| **MAE** (₹1.82 L) | Typical prediction misses by about ₹1.8 lakh |
| **RMSE** (₹2.52 L) | Penalises large misses more heavily |
| **MAPE** (9.74 %) | Average relative error under 10 % |

The report also includes:

- **Algorithm comparison** — all four candidate regressors with R² bars, so visitors see
  the selection process, not just the winner (`selected` badge on the best model).
- **Feature importance** — permutation importance (PFI) on the hold-out set: each feature's
  values are shuffled and the resulting R² drop is measured. The bar chart shows the model
  leans hardest on experience, then role and company size — exactly what you'd expect,
  which is a sanity check on the model itself.

### 6. Dataset insights explorer

A tabbed chart section aggregating the full training set, recomputed live from the data:

- **By experience** — average CTC per band (0-2, 3-5, 6-9, 10-14, 15+ yrs)
- **By education** — Bachelor's vs Master's vs PhD averages
- **By location** — all 10 cities ranked
- **By role** — all 18 roles ranked

Useful on its own as a mini "salary report" even without running a prediction.

### 7. Quick profile presets

Four one-click profiles (Fresher Dev, Data Scientist, Product Manager, Cloud Architect)
auto-fill the form for instant demos — great for showing the app in interviews or to
friends without typing anything. The active preset highlights until you edit a field.

### 8. Input validation

Every field is validated server-side against the exact categories the model was trained
on. Bad input returns a `400` with a field-by-field error map, rendered inline under the
responsible input — never a silent failure or a nonsense prediction.

### 9. Presentation & UX

- **Sci-fi glass design** — aurora gradient background, grid overlay, glassmorphism cards
  with gradient borders, cyan→violet→pink accent system.
- **Animated result reveal** — the salary figure counts up with eased motion; range bar
  and comparison bars animate in.
- **Indian number formatting** — `₹22,33,000` and `₹22.3 LPA` used consistently.
- **Fully responsive** — two-column desktop layout collapses cleanly to single-column
  mobile, with touch-friendly controls.
- **Accessible motion** — honours `prefers-reduced-motion`, semantic landmarks and labels
  throughout.
- **Sticky result panel** — on desktop the output stays in view while you adjust inputs.

### 10. REST API

The same model is exposed programmatically (see [API reference](#api-reference)) — useful
for integrations, mobile clients or further portfolio experiments.

### 11. Reproducible training pipeline

`generate_data.py` builds the dataset from domain-informed rules with a fixed seed, and
`train.py` benchmarks four algorithms and persists the winning pipeline, metrics and
benchmarks. Re-running training reproduces identical artifacts — and the production build
re-trains from scratch, so deployments never depend on stale binaries.

---

## How the model is built

### 1. Data generation (`backend/ml/generate_data.py`)

5,000 synthetic profiles are created from explicit domain rules rather than random noise:

- **Base pay per role** (e.g. Software Engineer ₹6 L, Cloud Architect ₹14 L at 0 yrs)
- **Compounding experience growth** per role (~8-11.5 %/yr) that saturates after 15 years,
  mirroring real career curves
- **Education premium** (Master's +14 %, PhD +26 %)
- **City tier multipliers** (Bangalore 1.15 → Jaipur 0.82, Remote 0.95)
- **Company size** (Startup 0.95 → MNC 1.30) and **industry** (Product 1.25 →
  Manufacturing 0.90) multipliers
- **Controlled noise** (±9 % Gaussian) + rounding to the nearest ₹1,000

The result is a dataset with realistic relationships the model can genuinely learn.

### 2. Training (`backend/ml/train.py`)

```
80 / 20 train-test split (seed 42)
        │
        ▼
ColumnTransformer
├── StandardScaler     → experience_years
└── OneHotEncoder      → education, job_title, city, company_size, industry
        │
        ▼
4 regressors benchmarked on identical splits
        │
        ▼
best by test R² (tie-break: lower MAE)
        │
        ▼
pipeline.pkl + metrics.json + benchmarks.json
```

### 3. Results

| Model              | R²      | MAPE   | MAE (₹) | RMSE (₹) |
| ------------------ | ------- | ------ | ------- | -------- |
| **Gradient Boosting** | **0.9472** | **9.74 %** | **181,574** | **251,781** |
| Linear Regression  | 0.9015  | 17.33 % | 263,574 | 344,030  |
| Ridge Regression   | 0.9014  | 17.29 % | 263,574 | 344,132  |
| Random Forest      | 0.8574  | 17.62 % | 311,011 | 413,946  |

Gradient Boosting wins because the dataset's growth curves are non-linear — tree ensembles
capture compounding and saturation effects that linear models systematically underfit.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Render (web service)                      │
│                                                                  │
│  ┌──────────────┐   HTTP/JSON   ┌────────────────────────────┐  │
│  │  React SPA   │ ────────────► │  Flask + Gunicorn          │  │
│  │  Vite + TS    │  /api/*       │  /api/predict  /api/meta   │  │
│  │  dist/ served │ ◄──────────── │  static file server (SPA)  │  │
│  └──────────────┘               └──────────────┬─────────────┘  │
│                                                │                 │
│                                 ┌──────────────▼─────────────┐  │
│                                 │  sklearn Pipeline          │  │
│                                 │  OneHot + Scale + GBR      │  │
│                                 │  (trained at build time)   │  │
│                                 └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Offline training loop:
  generate_data.py → salary_dataset.csv → train.py → pipeline.pkl
                                                 → metrics.json
                                                 → benchmarks.json
```

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Data       | NumPy, pandas (seeded synthetic generator) |
| ML         | scikit-learn (`ColumnTransformer` + `Pipeline` + `GradientBoostingRegressor`), joblib |
| Backend    | Flask, flask-cors, Gunicorn |
| Frontend   | React 19, TypeScript, Vite |
| Styling    | Hand-written CSS design system (glassmorphism, aurora gradients, motion) |
| Deploy     | Render (blueprint via `render.yaml`) |
| Quality    | oxlint, `tsc --noEmit`, endpoint tests |

---

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

### 2. Frontend (dev server with hot reload)

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173 (proxies /api → :5001)
```

### 3. Production build (single process serving SPA + API)

```bash
cd frontend && npm run build        # outputs frontend/dist
cd ../backend && python app.py      # serves everything on :5001
```

---

## API reference

| Method | Endpoint       | Description |
| ------ | -------------- | ----------- |
| `GET`  | `/api/health`  | Liveness check + selected model name |
| `GET`  | `/api/meta`    | Form options, model metrics, benchmark aggregates, defaults |
| `POST` | `/api/predict` | Salary prediction for one profile |

### `POST /api/predict`

Request body:

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

Success (`200`):

```json
{
  "ok": true,
  "salary": 3302000,
  "low": 2987000,
  "high": 3617000,
  "monthly": 275166,
  "percentile": 86.5,
  "experience_bucket": "6-9 yrs",
  "comparison": {
    "overall_avg": 1957040,
    "role_avg": 2790822,
    "role_experience_avg": 2443333
  },
  "dataset_quartiles": { "p25": 1125000, "p50": 1659000, "p75": 2523250 },
  "model": "Gradient Boosting"
}
```

| Field | Meaning |
| ----- | ------- |
| `salary` | Point estimate (INR, rounded to ₹1,000) |
| `low` / `high` | 80 % confidence band |
| `monthly` | `salary / 12` |
| `percentile` | % of training profiles earning less |
| `comparison.*` | Benchmark averages for role / role+experience / market |
| `dataset_quartiles` | P25/P50/P75 of the full dataset |

Validation failure (`400`) — field-to-message map:

```json
{ "ok": false, "errors": { "experience_years": "Experience must be a number between 0 and 30." } }
```

---

## Deploying to Render

**Option A — Blueprint (recommended)**

1. Push this repository to GitHub.
2. In the Render dashboard: **New → Blueprint** → connect the repo.
3. Render detects `render.yaml` and shows the `salary-predictor` service → **Apply**.
4. The build installs dependencies, **re-trains the model** and builds the SPA; the service
   then starts Gunicorn serving API + UI on one URL.

**Option B — Manual**

| Setting | Value |
| ------- | ----- |
| Runtime  | Python |
| Build command | `pip install -r requirements.txt && cd backend/ml && python train.py && cd ../../frontend && npm install && npm run build` |
| Start command | `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT` |
| Health check  | `/api/health` |

> Free-tier services sleep after inactivity — the first request after idle takes ~50 s.

---

## Project structure

```
├── README.md
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
        ├── presets.ts          # quick-profile presets
        ├── format.ts           # INR formatting helpers
        ├── index.css           # design system
        └── components/         # Nav · Hero · Presets · PredictorForm
                                # ResultCard · ComparisonChart
                                # MetricsSection · InsightsSection · Footer
```

---

## Roadmap

- [ ] Confidence intervals via quantile regression
- [ ] SHAP-based local explanations per prediction
- [ ] Role-specific negotiation tips
- [ ] Scheduled retraining with drift monitoring

---

## Disclaimer

This project uses **synthetic data** generated for demonstration. Figures are indicative
only and must not be used for real compensation decisions.

## License

MIT
