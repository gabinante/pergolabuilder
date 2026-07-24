import { useMemo } from 'react'
import { compareStockCaps } from '../engine/cost'
import { formatFeetInches } from '../engine/units'
import { usePriceStore } from '../store/priceStore'
import type { CostEstimate } from '../engine/cost'
import type { CutListItem } from '../engine/types'

const money = (n: number) => `$${n.toFixed(2)}`

export function CostTable({
  estimate,
  cutItems,
}: {
  estimate: CostEstimate
  cutItems: CutListItem[]
}) {
  const prices = usePriceStore((s) => s.prices)
  const setPrice = usePriceStore((s) => s.setPrice)
  const resetPrices = usePriceStore((s) => s.resetPrices)

  const comparison = useMemo(() => compareStockCaps(cutItems, prices), [cutItems, prices])
  const cheapest = Math.min(...comparison.map((c) => c.total))

  return (
    <div className="cost">
      <p className="hint">
        Unit prices are editable estimates (saved in your browser).{' '}
        <button className="link-button" onClick={resetPrices}>
          Reset to defaults
        </button>
      </p>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {estimate.lines.map((l) => (
            <tr key={l.key}>
              <td>{l.label}</td>
              <td>{l.qty}</td>
              <td>
                <input
                  className="price-input"
                  type="number"
                  min={0}
                  step={0.25}
                  value={l.unitPrice ?? ''}
                  placeholder="enter price"
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (Number.isFinite(v) && v >= 0) setPrice(l.key, v)
                  }}
                />
              </td>
              <td>{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Estimated total</td>
            <td>
              {money(estimate.grandTotal)}
              {estimate.missingPrices ? ' *' : ''}
            </td>
          </tr>
        </tfoot>
      </table>
      {estimate.missingPrices && <p className="hint">* some prices missing — total is incomplete</p>}

      <h3>Lumber cost by longest board</h3>
      <p className="hint">
        Shorter boards are easier to haul — this compares the same cut list packed with each limit.
      </p>
      <table>
        <thead>
          <tr>
            <th>Longest board</th>
            <th>Lumber total</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map((c) => (
            <tr key={c.cap}>
              <td>{formatFeetInches(c.cap)}</td>
              <td>
                {money(c.total)}
                {c.total === cheapest ? ' ◂ cheapest' : ''}
              </td>
              <td>
                {c.oversizeCount > 0
                  ? `needs ${c.oversizeCount} longer board${c.oversizeCount > 1 ? 's' : ''} anyway`
                  : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
