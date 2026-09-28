import { labelFor } from '../format'
import type { Metrics } from '../types'

interface Props {
  metrics: Metrics
}

export default function MetricsSection({ metrics }: Props) {
  const best = metrics.models.find((m) => m.model === metrics.best_model)
  if (!best) return null

  const headline = [
    { label: 'R² score', value: best.r2.toFixed(3), note: 'variance explained' },
    { label: 'MAE', value: `₹${Math.round(best.mae).toLocaleString('en-IN')}`, note: 'mean abs. error' },
    { label: 'MAPE', value: `${best.mape.toFixed(2)}%`, note: 'avg. % error' },
    {
      label: 'RMSE',
      value: `₹${Math.round(best.rmse).toLocaleString('en-IN')}`,
      note: 'penalises big misses',
    },
  ]

  const maxR2 = Math.max(...metrics.models.map((m) => m.r2))
  const maxImp = Math.max(...metrics.feature_importance.map((f) => f.importance))

  return (
    <section className="section" id="model">
      <div className="section__head">
        <span className="eyebrow">Model report</span>
        <h2 className="section__title">
          Transparent <span className="grad-text">metrics</span>
        </h2>
        <p className="section__sub">
          Four regressors were trained on an 80/20 split; {metrics.best_model} won on R² with
          {` ${(best.r2 * 100).toFixed(1)}%`} of salary variance explained.
        </p>
      </div>

      <div className="metrics__grid">
        <div className="stats-row">
          {headline.map((s) => (
            <div className="card kpi" key={s.label}>
              <span className="kpi__label">{s.label}</span>
              <span className="kpi__value">{s.value}</span>
              <span className="kpi__note">{s.note}</span>
            </div>
          ))}
        </div>

        <div className="card panel">
          <div className="card__head">
            <div>
              <h3 className="card__title">Algorithm comparison</h3>
              <p className="card__sub">Test-set performance across candidate models</p>
            </div>
            <span className="tag">R²</span>
          </div>
          <div className="model-list">
            {metrics.models.map((m) => {
              const isBest = m.model === metrics.best_model
              return (
                <div className={`model-row ${isBest ? 'is-best' : ''}`} key={m.model}>
                  <div className="model-row__top">
                    <span className="model-row__name">
                      {m.model}
                      {isBest && <em className="model-row__badge">selected</em>}
                    </span>
                    <span className="model-row__nums">
                      R² {m.r2.toFixed(4)} · MAPE {m.mape.toFixed(1)}%
                    </span>
                  </div>
                  <div className="model-row__track">
                    <div
                      className={`model-row__fill ${isBest ? 'is-best' : ''}`}
                      style={{ width: `${(m.r2 / maxR2) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card panel">
          <div className="card__head">
            <div>
              <h3 className="card__title">Feature importance</h3>
              <p className="card__sub">Permutation importance on the hold-out set</p>
            </div>
            <span className="tag">PFI</span>
          </div>
          <div className="imp-list">
            {metrics.feature_importance.map((f) => (
              <div className="imp-row" key={f.feature}>
                <span className="imp-row__name">{labelFor(f.feature)}</span>
                <div className="imp-row__track">
                  <div
                    className="imp-row__fill"
                    style={{ width: `${(f.importance / maxImp) * 100}%` }}
                  />
                </div>
                <span className="imp-row__val">{f.importance.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <p className="panel__note">
            Importance = drop in R² when a feature&apos;s values are shuffled. Higher means the
            model relies on it more.
          </p>
        </div>
      </div>
    </section>
  )
}
