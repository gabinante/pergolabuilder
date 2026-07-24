import { formatFeetInches, formatInches } from '../engine/units'
import type { PackResult } from '../engine/cutlist'
import type { CutListItem, StockBoard } from '../engine/types'

/** Collapse identical boards (same size, stock length, and cuts) into one line. */
function groupBoards(boards: StockBoard[]) {
  const groups = new Map<string, { board: StockBoard; count: number }>()
  for (const b of boards) {
    const key = `${b.size}|${b.stockLength}|${b.cuts.join(',')}`
    const g = groups.get(key)
    if (g) g.count += 1
    else groups.set(key, { board: b, count: 1 })
  }
  return [...groups.entries()].map(([key, { board, count }]) => ({
    key,
    count,
    size: board.size,
    stockLength: board.stockLength,
    isFullLength: board.cuts.length === 1 && board.cuts[0] === board.stockLength,
    cutLabels: board.cuts.map((c) => (c % 12 === 0 ? formatFeetInches(c) : formatInches(c))).join(', '),
  }))
}

export function CutListTable({ items, pack }: { items: CutListItem[]; pack: PackResult }) {
  return (
    <div className="cutlist">
      <h3>Cuts</h3>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Cut length</th>
            <th>Qty</th>
            <th>Used for</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={`${i.size}-${i.length}`}>
              <td>PT {i.size}</td>
              <td>{formatFeetInches(i.length)}</td>
              <td>{i.qty}</td>
              <td>{i.roles.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Boards to buy</h3>
      <table>
        <thead>
          <tr>
            <th>Board</th>
            <th>Length</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {pack.purchases.map((p) => (
            <tr key={`${p.size}-${p.stockLength}`}>
              <td>PT {p.size}</td>
              <td>{formatFeetInches(p.stockLength)}</td>
              <td>{p.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Cutting plan</h3>
      <ul className="board-plan">
        {groupBoards(pack.boards).map((g) => (
          <li key={g.key}>
            {g.count} × PT {g.size} × {formatFeetInches(g.stockLength)}:{' '}
            {g.isFullLength ? 'use full length' : `cut ${g.cutLabels}`}
          </li>
        ))}
      </ul>
    </div>
  )
}
