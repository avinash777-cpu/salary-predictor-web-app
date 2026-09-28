import { useEffect, useState } from 'react'
import { fetchMeta, predictSalary } from './api'
import ComparisonChart from './components/ComparisonChart'
import Footer from './components/Footer'
import Hero from './components/Hero'
import InsightsSection from './components/InsightsSection'
import MetricsSection from './components/MetricsSection'
import Nav from './components/Nav'
import Presets from './components/Presets'
import PredictorForm from './components/PredictorForm'
import ResultCard from './components/ResultCard'
import type { Meta, PredictionResult, Profile } from './types'

const EMPTY: Profile = {
  experience_years: 0,
  education: "Bachelor's",
  job_title: 'Software Engineer',
  city: 'Bangalore',
  company_size: 'Mid-size',
  industry: 'Product Company',
}

const PIPELINE = [
  { step: '01', title: 'Synthetic dataset', note: '5,000 profiles, domain-informed rules + noise' },
  { step: '02', title: 'Preprocessing', note: 'One-hot encoding + standard scaling' },
  { step: '03', title: 'Model selection', note: '4 regressors benchmarked on hold-out set' },
  { step: '04', title: 'Serve', note: 'Flask REST API + React SPA on Render' },
]

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeta()
      .then((data) => {
        setMeta(data)
        setProfile(data.defaults)
      })
      .catch(() => setLoadError('Could not reach the API. Is the Flask server running?'))
  }, [])

  const update = (patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
    setActivePreset(null)
  }

  const run = async () => {
    if (!meta) return
    setLoading(true)
    setErrors({})
    try {
      const { data, errors: errs } = await predictSalary(profile)
      if (errs) setErrors(errs)
      else if (data) setResult(data)
    } catch {
      setErrors({ general: 'Prediction request failed. Please retry.' })
    } finally {
      setLoading(false)
    }
  }

  const selectPreset = (preset: { name: string; profile: Profile }) => {
    setProfile(preset.profile)
    setActivePreset(preset.name)
    setErrors({})
  }

  if (loadError) {
    return (
      <div className="boot boot--error">
        <p>{loadError}</p>
        <button className="btn btn--primary" type="button" onClick={() => location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!meta) {
    return (
      <div className="boot">
        <div className="boot__spinner" />
        <p>Initialising model artifacts…</p>
      </div>
    )
  }

  return (
    <div className="app" id="top">
      <div className="bg" aria-hidden="true">
        <span className="bg__orb bg__orb--cyan" />
        <span className="bg__orb bg__orb--violet" />
        <span className="bg__orb bg__orb--pink" />
        <span className="bg__grid" />
      </div>

      <Nav />
      <Hero metrics={meta.metrics} benchmarks={meta.benchmarks} />

      <main>
        <section className="section" id="predict">
          <div className="section__head">
            <span className="eyebrow">Live predictor</span>
            <h2 className="section__title">
              Six inputs. One <span className="grad-text">calibrated estimate.</span>
            </h2>
          </div>

          <Presets meta={meta} active={activePreset} onSelect={selectPreset} />

          <div className="predict-grid">
            <PredictorForm
              meta={meta}
              value={profile}
              errors={errors}
              loading={loading}
              onChange={update}
              onSubmit={run}
            />
            <div className="predict-grid__side">
              <ResultCard
                result={result}
                loading={loading}
                profileSummary={[
                  `${profile.experience_years} yrs`,
                  profile.job_title,
                  profile.city,
                ]}
              />
            </div>
          </div>

          {errors.general && <p className="form__general-error">{errors.general}</p>}

          <div className="pipeline">
            {PIPELINE.map((item) => (
              <div className="pipeline__step" key={item.step}>
                <span className="pipeline__num">{item.step}</span>
                <strong>{item.title}</strong>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </section>

        {result && <ComparisonChart result={result} jobTitle={profile.job_title} />}
        <MetricsSection metrics={meta.metrics} />
        <InsightsSection benchmarks={meta.benchmarks} />
      </main>

      <Footer />
    </div>
  )
}
