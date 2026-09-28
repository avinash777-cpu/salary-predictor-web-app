import { PRESETS, type Preset } from '../presets'
import type { Meta } from '../types'

interface Props {
  active: string | null
  onSelect: (preset: Preset) => void
  meta: Meta
}

export default function Presets({ active, onSelect, meta }: Props) {
  return (
    <div className="presets">
      <span className="presets__label">Quick profiles</span>
      <div className="presets__row">
        {PRESETS.map((preset) => {
          const valid =
            meta.options.job_title.includes(preset.profile.job_title) &&
            meta.options.city.includes(preset.profile.city)
          if (!valid) return null
          return (
            <button
              key={preset.name}
              type="button"
              className={`preset ${active === preset.name ? 'preset--active' : ''}`}
              onClick={() => onSelect(preset)}
            >
              <strong>{preset.name}</strong>
              <small>{preset.hint}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}
