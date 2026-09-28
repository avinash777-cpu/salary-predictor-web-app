import { compactINR } from '../format'
import type { Benchmarks, Metrics } from '../types'

interface Props {
  metrics: Metrics
  benchmarks: Benchmarks
}

export default function Hero({ metrics, benchmarks }: Props) {
  const best = metrics.models.find((m) => m.model === metrics.best_model)
  const chips = [
    { label: 'Model', value: metrics.best_model },
    { label: 'R² score', value: best ? best.r2.toFixed(3) : '—' },
    { label: 'MAPE', value: best ? `${best.mape.toFixed(1)}%` : '—' },
    { label: 'Training rows', value: benchmarks.rows.toLocaleString('en-IN') },
  ]

  return (
    <section className="hero" id="top">
      <div className="hero__inner">
        <div className="hero__badge reveal">
          <span className="dot" />
          5,000 salary profiles · 18 roles · 10 cities
        </div>

        <h1 className="hero__title reveal reveal--1">
          Estimate what you&apos;re
          <span className="grad-text"> truly worth.</span>
        </h1>

        <p className="hero__sub reveal reveal--2">
          A production-grade salary estimator trained on {benchmarks.rows.toLocaleString('en-IN')}{' '}
          profiles across the Indian job market. Pick your experience, role and location — get a
          calibrated salary range in milliseconds.
        </p>

        <div className="hero__actions reveal reveal--3">
          <a className="btn btn--primary" href="#predict">
            Predict my salary
            <span aria-hidden="true">→</span>
          </a>
          <a className="btn btn--ghost" href="#model">
            View model report
          </a>
        </div>

        <div className="hero__stats reveal reveal--4">
          {chips.map((chip) => (
            <div className="chip" key={chip.label}>
              <span className="chip__label">{chip.label}</span>
              <span className="chip__value">{chip.value}</span>
            </div>
          ))}
          <div className="chip chip--accent">
            <span className="chip__label">Market median</span>
            <span className="chip__value">{compactINR(benchmarks.median)}</span>
          </div>
        </div>
      </div>

      <div className="hero__orb hero__orb--1" aria-hidden="true" />
      <div className="hero__orb hero__orb--2" aria-hidden="true" />
    </section>
  )
}
