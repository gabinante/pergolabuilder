export function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null
  return (
    <div className="warnings">
      {warnings.map((w, i) => (
        <p key={i}>⚠ {w}</p>
      ))}
    </div>
  )
}
