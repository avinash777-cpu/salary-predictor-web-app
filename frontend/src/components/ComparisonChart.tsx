import { compactINR, formatINR, formatLPA } from '../format'
import type { PredictionResult } from '../types'

interface Props {
  result: PredictionResult
  jobTitle: string
}

export default function ComparisonChart({ result, jobTitle }: Props) {
  const { salary, comparison, experience_bucket, dataset_quartiles } = result

  const bars = [
    { label: 'Your prediction', value: salary, accent: true },
    {
      label: `${jobTitle} · ${experience_bucket}`,
      value: comparison.role_experience_avg,
      accent: false,
    },
    { label: `${jobTitle} · all levels`, value: comparison.role_avg, accent: false },
    { label: 'Market average', value: comparison.overall_avg, accent: false },
  ]

  const max = Math.max(...bars.map((b) => b.value), salary) * 1.08

  return (
    <section className="card compare" id="compare">
      <div className="card__head">
        <div>
          <h2 className="card__title">How does this stack up?</h2>
          <p className="card__sub">Your estimate benchmarked against market aggregates.</p>
        </div>
        <span className="tag">BENCHMARK</span>
      </div>

      <div className="bars">
        {bars.map((bar) => {
          const diff = bar.accent ? 0 : ((salary - bar.value) / bar.value) * 100
          return (
            <div className="bar-row" key={bar.label}>
              <div className="bar-row__meta">
                <span className={`bar-row__label ${bar.accent ? 'is-accent' : ''}`}>
                  {bar.label}
                </span>
                <span className="bar-row__value">
                  {compactINR(bar.value)}
                  {!bar.accent && (
                    <em className={diff >= 0 ? 'up' : 'down'}>
                      {diff >= 0 ? '+' : ''}
                      {diff.toFixed(1)}%
                    </em>
                  )}
                </span>
              </div>
              <div className="bar-row__track">
                <div
                  className={`bar-row__fill ${bar.accent ? 'is-accent' : ''}`}
                  style={{ width: `${(bar.value / max) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="compare__quartiles">
        <span className="compare__q-label">Dataset quartiles</span>
        <div className="compare__q-track">
          <div
            className="compare__q-box"
            style={{
              left: `${(dataset_quartiles.p25 / max) * 100}%`,
              width: `${((dataset_quartiles.p75 - dataset_quartiles.p25) / max) * 100}%`,
            }}
          />
          <div
            className="compare__q-median"
            style={{ left: `${(dataset_quartiles.p50 / max) * 100}%` }}
          />
        </div>
        <div className="compare__q-scale">
          <span>P25 {formatINR(dataset_quartiles.p25)}</span>
          <span>median {formatLPA(dataset_quartiles.p50)}</span>
          <span>P75 {formatINR(dataset_quartiles.p75)}</span>
        </div>
      </div>
    </section>
  )
}
