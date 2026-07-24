// Cut aggregation and first-fit-decreasing packing onto purchasable stock.
// FFD is not optimal but is deterministic and plenty at this scale.

import { MAX_STOCK_LENGTH, STOCK_LENGTHS, type NominalSize } from './lumber'
import { roundSixteenth } from './units'
import { formatFeetInches } from './units'
import type { CutListItem, Member, Purchase, StockBoard } from './types'

export const KERF = 0.125

export function aggregateCuts(members: Member[]): CutListItem[] {
  const map = new Map<string, CutListItem>()
  for (const m of members) {
    const length = roundSixteenth(m.length)
    const key = `${m.size}|${length}`
    const item = map.get(key)
    if (item) {
      item.qty += 1
      if (!item.roles.includes(m.role)) item.roles.push(m.role)
    } else {
      map.set(key, { size: m.size, length, qty: 1, roles: [m.role] })
    }
  }
  return [...map.values()].sort(
    (a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }) || b.length - a.length,
  )
}

export interface PackResult {
  boards: StockBoard[]
  purchases: Purchase[]
  warnings: string[]
}

export function packBoards(
  items: CutListItem[],
  kerf = KERF,
  maxStock = MAX_STOCK_LENGTH,
): PackResult {
  const warnings: string[] = []
  const boards: StockBoard[] = []
  const allowed = STOCK_LENGTHS.filter((len) => len <= maxStock)
  const cap = allowed[allowed.length - 1] ?? MAX_STOCK_LENGTH

  const bySize = new Map<NominalSize, number[]>()
  for (const item of items) {
    const cuts = bySize.get(item.size) ?? []
    for (let i = 0; i < item.qty; i++) cuts.push(item.length)
    bySize.set(item.size, cuts)
  }

  const oversize = new Map<string, number>() // cuts longer than any stock
  const overCap = new Map<string, number>() // cuts that fit stock but not the cap
  for (const [size, cuts] of bySize) {
    cuts.sort((a, b) => b - a)
    const open: { remaining: number; cuts: number[] }[] = []
    for (const cut of cuts) {
      if (cut > cap) {
        // Assign the smallest real stock that fits (so totals stay sane) and warn.
        const needed = STOCK_LENGTHS.find((len) => len >= cut)
        const key = `${size}|${cut}|${needed ?? 'none'}`
        const bucket = needed ? overCap : oversize
        bucket.set(key, (bucket.get(key) ?? 0) + 1)
        boards.push({ size, stockLength: needed ?? MAX_STOCK_LENGTH, cuts: [cut] })
        continue
      }
      const board = open.find((b) => b.remaining >= cut + kerf)
      if (board) {
        board.cuts.push(cut)
        board.remaining -= cut + kerf
      } else {
        open.push({ remaining: cap - cut - kerf, cuts: [cut] })
      }
    }
    // Shrink each board to the smallest allowed stock length that holds its cuts.
    for (const b of open) {
      const used = b.cuts.reduce((s, c) => s + c, 0) + kerf * (b.cuts.length - 1)
      const stockLength = allowed.find((len) => len >= used) ?? cap
      boards.push({ size, stockLength, cuts: b.cuts })
    }
  }

  for (const [key, count] of overCap) {
    const [size, cut, needed] = key.split('|')
    const subject =
      count > 1
        ? `${count} ${size} cuts of ${formatFeetInches(Number(cut))} need`
        : `A ${size} cut of ${formatFeetInches(Number(cut))} needs`
    warnings.push(
      `${subject} a ${formatFeetInches(Number(needed))} board — longer than your ${formatFeetInches(cap)} limit.`,
    )
  }
  for (const [key, count] of oversize) {
    const [size, cut] = key.split('|')
    const subject =
      count > 1
        ? `${count} ${size} cuts of ${formatFeetInches(Number(cut))} exceed`
        : `A ${size} cut of ${formatFeetInches(Number(cut))} exceeds`
    warnings.push(`${subject} the longest common stock (16').`)
  }

  const purchaseMap = new Map<string, Purchase>()
  for (const b of boards) {
    const key = `${b.size}|${b.stockLength}`
    const p = purchaseMap.get(key)
    if (p) p.qty += 1
    else purchaseMap.set(key, { size: b.size, stockLength: b.stockLength, qty: 1 })
  }
  const purchases = [...purchaseMap.values()].sort(
    (a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }) || b.stockLength - a.stockLength,
  )

  return { boards, purchases, warnings }
}
