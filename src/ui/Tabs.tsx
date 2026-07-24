import { useState, type ReactNode } from 'react'

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  return (
    <div className="tabs">
      <div className="tab-bar" role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={i === active}
            className={i === active ? 'tab active' : 'tab'}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-content">{tabs[active].content}</div>
    </div>
  )
}
