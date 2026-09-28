export interface Profile {
  experience_years: number
  education: string
  job_title: string
  city: string
  company_size: string
  industry: string
}

export interface ModelMetric {
  model: string
  r2: number
  mae: number
  rmse: number
  mape: number
}

export interface LabelValue {
  label: string
  value: number
}

export interface Metrics {
  best_model: string
  models: ModelMetric[]
  feature_importance: { feature: string; importance: number }[]
  residual_std: number
  target: string
  features: string[]
}

export interface Benchmarks {
  overall_avg: number
  median: number
  rows: number
  by_job_title: LabelValue[]
  by_experience: LabelValue[]
  by_education: LabelValue[]
  by_city: LabelValue[]
  by_job_experience: Record<string, Record<string, number>>
}

export interface Meta {
  title: string
  tagline: string
  currency: string
  options: {
    education: string[]
    job_title: string[]
    city: string[]
    company_size: string[]
    industry: string[]
  }
  metrics: Metrics
  benchmarks: Benchmarks
  defaults: Profile
}

export interface PredictionResult {
  ok: boolean
  salary: number
  low: number
  high: number
  monthly: number
  experience_bucket: string
  percentile: number
  comparison: {
    overall_avg: number
    role_avg: number
    role_experience_avg: number
  }
  dataset_quartiles: {
    p25: number
    p50: number
    p75: number
  }
  model: string
}

export interface PredictError {
  ok: false
  errors: Record<string, string>
}
