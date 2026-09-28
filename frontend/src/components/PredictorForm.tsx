import type { Meta, Profile } from '../types'

interface Props {
  meta: Meta
  value: Profile
  errors: Record<string, string>
  loading: boolean
  onChange: (patch: Partial<Profile>) => void
  onSubmit: () => void
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">
        {label}
        {hint && <em>{hint}</em>}
      </span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  )
}

export default function PredictorForm({ meta, value, errors, loading, onChange, onSubmit }: Props) {
  return (
    <form className="card form" onSubmit={(e) => { e.preventDefault(); onSubmit() }} noValidate>
      <div className="card__head">
        <div>
          <h2 className="card__title">Your profile</h2>
          <p className="card__sub">Six signals feed the model — adjust any of them.</p>
        </div>
        <span className="tag">INPUT</span>
      </div>

      <div className="form__grid">
        <Field label="Experience" hint="years" error={errors.experience_years}>
          <input
            type="number"
            min={0}
            max={30}
            step={0.5}
            value={value.experience_years}
            onChange={(e) => onChange({ experience_years: Number(e.target.value) })}
          />
        </Field>

        <Field label="Education" error={errors.education}>
          <select
            value={value.education}
            onChange={(e) => onChange({ education: e.target.value })}
          >
            {meta.options.education.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Job role" error={errors.job_title}>
          <select
            value={value.job_title}
            onChange={(e) => onChange({ job_title: e.target.value })}
          >
            {meta.options.job_title.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location" error={errors.city}>
          <select value={value.city} onChange={(e) => onChange({ city: e.target.value })}>
            {meta.options.city.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Company size" error={errors.company_size}>
          <select
            value={value.company_size}
            onChange={(e) => onChange({ company_size: e.target.value })}
          >
            {meta.options.company_size.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Industry" error={errors.industry}>
          <select
            value={value.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
          >
            {meta.options.industry.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
        {loading ? 'Computing…' : 'Run prediction'}
        {!loading && <span aria-hidden="true">→</span>}
      </button>
    </form>
  )
}
