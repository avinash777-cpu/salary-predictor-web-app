import { useEffect, useRef, useState } from 'react'
import { formatINR, formatLPA } from '../format'
import type { PredictionResult } from '../types'

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

interface Props {
  result: PredictionResult | null
  loading: boolean
  profileSummary: string[]
}

export default function ResultCard({ result, loading, profileSummary }: Props) {
  const animated = useCountUp(result?.salary ?? 0)

  if (!result) {
    return (
      <div className="card result result--empty">
        <div className="card__head">
          <h2 className="card__title">Estimated salary</h2>
          <span className="tag tag--muted">OUTPUT</span>
        </div>
        <div className="result__idle">
          <div className="result__pulse" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>Fill the profile and run a prediction to see your calibrated range.</p>
        </div>
      </div>
    )
  }

  const { salary, low, high, monthly, percentile, comparison, model, experience_bucket } = result
  const span = Math.max(high - low, 1)
  const position = Math.min(Math.max((salary - low) / span, 0), 1) * 100
  const vsRole = salary - comparison.role_avg
  const vsRolePct = comparison.role_avg ? (vsRole / comparison.role_avg) * 100 : 0

  return (
    <div className={`card result ${loading ? 'result--loading' : ''}`}>
      <div className="card__head">
        <div>
          <h2 className="card__title">Estimated salary</h2>
          <p className="card__sub">{profileSummary.join(' · ')}</p>
        </div>
        <span className="tag">OUTPUT</span>
      </div>

      <div className="result__hero">
        <div className="result__value">{formatINR(animated)}</div>
        <div className="result__lpa">{formatLPA(salary)} per annum</div>
      </div>

      <div className="result__range">
        <div className="result__track">
          <div className="result__fill" style={{ left: `${position}%` }} />
          <div className="result__marker" style={{ left: `${position}%` }} />
        </div>
        <div className="result__scale">
          <span>{formatINR(low)}</span>
          <span className="result__scale-label">
            80% confidence band · {experience_bucket}
          </span>
          <span>{formatINR(high)}</span>
        </div>
      </div>

      <div className="result__grid">
        <div className="stat">
          <span className="stat__label">Monthly in-hand ≈</span>
          <span className="stat__value">{formatINR(monthly)}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Percentile</span>
          <span className="stat__value">Top {Math.max(100 - percentile, 1).toFixed(0)}%</span>
        </div>
        <div className="stat">
          <span className="stat__label">vs role average</span>
          <span className={`stat__value ${vsRole >= 0 ? 'up' : 'down'}`}>
            {vsRole >= 0 ? '+' : ''}
            {vsRolePct.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="result__foot">
        <span className="model-chip">
          <span className="dot" /> {model}
        </span>
        <span className="result__note">Synthetic training data · INR CTC</span>
      </div>
    </div>
  )
}
