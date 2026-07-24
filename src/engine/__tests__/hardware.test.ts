import { describe, expect, it } from 'vitest'
import { compareStockCaps, costEstimate } from '../cost'
import type { CutListItem } from '../types'
import { DEFAULT_CONFIG, designPergola } from '../design'
import { hardwareList } from '../hardware'

const byKey = (items: { key: string; qty: number }[], key: string) =>
  items.find((i) => i.key === key)?.qty

describe('hardwareList', () => {
  it('canonical 12x12x8 on post bases', () => {
    const design = designPergola(DEFAULT_CONFIG)
    const items = hardwareList(design, DEFAULT_CONFIG)
    expect(byKey(items, 'postBase')).toBe(4)
    expect(byKey(items, 'concreteBag')).toBe(16)
    expect(byKey(items, 'carriageBolt')).toBe(16) // 2/post + 2/brace
    expect(byKey(items, 'structuralScrew')).toBe(40) // 10 rafters x 2 beams x 2
    expect(byKey(items, 'deckScrews')).toBeUndefined()
  })

  it('embedded posts swap bases for extra concrete and gravel', () => {
    const config = { ...DEFAULT_CONFIG, postAnchor: 'embedded' as const }
    const items = hardwareList(designPergola(config), config)
    expect(byKey(items, 'postBase')).toBeUndefined()
    expect(byKey(items, 'concreteBag')).toBe(12)
    expect(byKey(items, 'gravelBag')).toBe(4)
  })
})

describe('compareStockCaps', () => {
  it('prices the cut list under every cap and counts forced-longer boards', () => {
    const items: CutListItem[] = [
      { size: '2x8', length: 144, qty: 2, roles: ['rafter'] }, // needs 12'
      { size: '4x4', length: 34, qty: 4, roles: ['brace'] }, // packs 2 per 8'
    ]
    const prices = {
      '2x8-144': 19,
      '4x4-96': 14,
      '4x4-120': 18,
      '4x4-144': 22,
      '4x4-192': 30,
    }
    const rows = compareStockCaps(items, prices)
    expect(rows.map((r) => r.cap)).toEqual([96, 120, 144, 192])

    const at96 = rows[0]
    expect(at96.oversizeCount).toBe(2) // both rafters break the 8' cap
    expect(at96.total).toBe(2 * 19 + 2 * 14)

    const at144 = rows[2]
    expect(at144.oversizeCount).toBe(0)
    expect(at144.total).toBe(2 * 19 + 22) // all four braces fit one 12-footer
  })
})

describe('costEstimate', () => {
  it('multiplies quantities by prices and flags missing ones', () => {
    const estimate = costEstimate(
      [{ size: '4x4', stockLength: 96, qty: 2 }],
      [{ key: 'postBase', label: 'base', qty: 4, unit: 'ea' }],
      { '4x4-96': 14 },
    )
    expect(estimate.lines[0].total).toBe(28)
    expect(estimate.missingPrices).toBe(true) // no postBase price given
    expect(estimate.grandTotal).toBe(28)
  })
})
