import { useMemo } from 'react'

interface EntryIntervalFieldProps {
  id?: string
  label?: string
  value: string
  onChange: (nextValue: string) => void
  min?: number
}

interface IntervalPreset {
  days: number
  label: string
  hint: string
}

const INTERVAL_PRESETS: IntervalPreset[] = [
  { days: 7, label: '7 days', hint: 'Weekly' },
  { days: 14, label: '14 days', hint: 'Bi-weekly' },
  { days: 30, label: '30 days', hint: 'Monthly' },
  { days: 60, label: '60 days', hint: 'Bimonthly' },
  { days: 90, label: '90 days', hint: 'Quarterly' },
]

function parseInterval(value: string, min: number): number | null {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < min) {
    return null
  }
  return parsed
}

function formatNextDate(days: number): string {
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function EntryIntervalField({
  id = 'entryInterval',
  label = 'Next Post Interval *',
  value,
  onChange,
  min = 1,
}: EntryIntervalFieldProps) {
  const parsedInterval = parseInterval(value, min)

  const nextDateLabel = useMemo(() => {
    if (!parsedInterval) {
      return null
    }
    return formatNextDate(parsedInterval)
  }, [parsedInterval])

  const applyPreset = (days: number) => {
    onChange(String(days))
  }

  const stepInterval = (delta: number) => {
    const baseline = parsedInterval ?? 30
    const next = Math.max(min, baseline + delta)
    onChange(String(next))
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>

      <div className="interval-field">
        <div className="interval-preset-grid">
          {INTERVAL_PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              className={`interval-preset ${parsedInterval === preset.days ? 'active' : ''}`}
              onClick={() => applyPreset(preset.days)}
            >
              <strong>{preset.label}</strong>
              <span>{preset.hint}</span>
            </button>
          ))}
        </div>

        <div className="interval-input-row">
          <button type="button" className="interval-step" onClick={() => stepInterval(-1)} aria-label="Decrease interval by one day">
            -
          </button>

          <div className="interval-input-wrap">
            <input
              type="number"
              id={id}
              required
              min={min}
              step={1}
              className="input interval-input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="interval-unit" aria-hidden="true">
              days
            </span>
          </div>

          <button type="button" className="interval-step" onClick={() => stepInterval(1)} aria-label="Increase interval by one day">
            +
          </button>
        </div>
      </div>

      <p className="field-help">
        {nextDateLabel ? `Your next post unlocks on ${nextDateLabel}.` : 'Pick a preset or enter a custom number of days.'}
      </p>
    </div>
  )
}
