// Cost estimate: joins lumber purchases + hardware with user-editable prices.

import { KERF, packBoards } from './cutlist'
import { STOCK_LENGTHS } from './lumber'
import { formatFeetInches } from './units'
import type { HardwareItem } from './hardware'
import type { CutListItem, Purchase } from './types'

export interface CostLine {
  key: string
  label: string
  qty: number
  unitPrice: number | undefined
  total: number
}

export interface CostEstimate {
  lines: CostLine[]
  grandTotal: number
  missingPrices: boolean
}

export const lumberPriceKey = (p: Purchase): string => `${p.size}-${p.stockLength}`

export interface StockCapComparison {
  /** The longest-board cap this row was packed with, inches. */
  cap: number
  /** Lumber-only total at current prices. */
  total: number
  /** Boards that had to exceed the cap (one-piece cuts too long for it). */
  oversizeCount: number
}

/**
 * Price the same cut list under each possible longest-board cap, so shoppers
 * can see whether hauling shorter boards actually costs more.
 */
export function compareStockCaps(
  items: CutListItem[],
  prices: Record<string, number>,
): StockCapComparison[] {
  return STOCK_LENGTHS.map((cap) => {
    const { purchases } = packBoards(items, KERF, cap)
    const total = purchases.reduce((s, p) => s + (prices[lumberPriceKey(p)] ?? 0) * p.qty, 0)
    const oversizeCount = purchases
      .filter((p) => p.stockLength > cap)
      .reduce((s, p) => s + p.qty, 0)
    return { cap, total, oversizeCount }
  })
}

export function costEstimate(
  purchases: Purchase[],
  hardware: HardwareItem[],
  prices: Record<string, number>,
): CostEstimate {
  const lines: CostLine[] = []
  let missingPrices = false

  for (const p of purchases) {
    const key = lumberPriceKey(p)
    const unitPrice = prices[key]
    if (unitPrice === undefined) missingPrices = true
    lines.push({
      key,
      label: `PT ${p.size} x ${formatFeetInches(p.stockLength)}`,
      qty: p.qty,
      unitPrice,
      total: (unitPrice ?? 0) * p.qty,
    })
  }

  for (const h of hardware) {
    const unitPrice = prices[h.key]
    if (unitPrice === undefined) missingPrices = true
    lines.push({
      key: h.key,
      label: h.label,
      qty: h.qty,
      unitPrice,
      total: (unitPrice ?? 0) * h.qty,
    })
  }

  return {
    lines,
    grandTotal: lines.reduce((s, l) => s + l.total, 0),
    missingPrices,
  }
}
