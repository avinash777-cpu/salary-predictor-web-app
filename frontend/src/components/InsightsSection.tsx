import { useState } from 'react'
import { compactINR, formatINR } from '../format'
import type { Benchmarks, LabelValue } from '../types'

interface Props {
  benchmarks: Benchmarks
}

const TABS: { key: string; label: string; field: keyof Benchmarks; unitNote: string }[] = [
  { key: 'experience', label: 'By experience', field: 'by_experience', unitNote: 'average CTC per experience band' },
  { key: 'education', label: 'By education', field: 'by_education', unitNote: 'average CTC per qualification' },
  { key: 'city', label: 'By location', field: 'by_city', unitNote: 'average CTC across cities' },
  { key: 'role', label: 'By role', field: 'by_job_title', unitNote: 'average CTC across 18 roles' },
]

export default function InsightsSection({ benchmarks }: Props) {
  const [active, setActive] = useState('experience')
  const tab = TABS.find((t) => t.key === active) ?? TABS[0]
  const rows = (benchmarks[tab.field] as LabelValue[] | undefined) ?? []
  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <section className="section" id="insights">
      <div className="section__head">
        <span className="eyebrow">Dataset insights</span>
        <h2 className="section__title">
          The market at a <span className="grad-text">glance</span>
        </h2>
        <p className="section__sub">
          Aggregates computed live from the {benchmarks.rows.toLocaleString('en-IN')}-row training
          set — the same data the model learned from.
        </p>
      </div>

      <div className="card panel">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              className={`tab ${active === t.key ? 'tab--active' : ''}`}
              onClick={() => setActive(t.key)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="panel__note">{tab.unitNote}</p>

        <div className="bars bars--dense">
          {rows.map((row) => (
            <div className="bar-row" key={row.label}>
              <div className="bar-row__meta">
                <span className="bar-row__label">{row.label}</span>
                <span className="bar-row__value">{formatINR(row.value)}</span>
              </div>
              <div className="bar-row__track">
                <div className="bar-row__fill" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel__foot">
          <span>
            Overall average <strong>{compactINR(benchmarks.overall_avg)}</strong>
          </span>
          <span>
            Median <strong>{compactINR(benchmarks.median)}</strong>
          </span>
        </div>
      </div>
    </section>
  )
}
