import { useEffect, useState } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

/** Numeric input with clamping on blur; also renders a matching range slider. */
export function NumberField({ label, value, min, max, step = 0.5, unit, onChange }: Props) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = (raw: string) => {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed))
      onChange(clamped)
      setText(String(clamped))
    } else {
      setText(String(value))
    }
  }

  return (
    <label className="field">
      <span className="field-label">
        {label}
        {unit ? <span className="field-unit"> ({unit})</span> : null}
      </span>
      <div className="field-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          className="field-number"
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          }}
        />
      </div>
    </label>
  )
}
