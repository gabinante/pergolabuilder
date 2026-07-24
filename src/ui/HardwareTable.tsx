import type { HardwareItem } from '../engine/hardware'

export function HardwareTable({ items }: { items: HardwareItem[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Hardware</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        {items.map((h) => (
          <tr key={h.key}>
            <td>{h.label}</td>
            <td>
              {h.qty} {h.unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
