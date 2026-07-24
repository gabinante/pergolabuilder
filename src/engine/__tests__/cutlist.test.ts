import { describe, expect, it } from 'vitest'
import { aggregateCuts, packBoards } from '../cutlist'
import { DEFAULT_CONFIG, designPergola } from '../design'
import type { CutListItem } from '../types'

describe('aggregateCuts', () => {
  it('groups the canonical design into one row per (size, length)', () => {
    const { members } = designPergola(DEFAULT_CONFIG)
    const items = aggregateCuts(members)
    const posts = items.find((i) => i.size === '6x6')!
    expect(posts).toMatchObject({ length: 105.25, qty: 4 })
    const beams = items.find((i) => i.size === '2x10')!
    expect(beams).toMatchObject({ length: 144, qty: 4 })
    const braces = items.find((i) => i.size === '4x4')!
    expect(braces).toMatchObject({ length: 34, qty: 4 })
  })

  it('rounds float noise to 1/16" so rows never split', () => {
    const members = designPergola(DEFAULT_CONFIG).members.map((m) => ({
      ...m,
      length: m.length + 1e-9,
    }))
    const items = aggregateCuts(members)
    expect(items.filter((i) => i.size === '6x6')).toHaveLength(1)
  })
})

describe('packBoards', () => {
  it('fits two 34" braces on one 8-ft 4x4', () => {
    const items: CutListItem[] = [{ size: '4x4', length: 34, qty: 2, roles: ['brace'] }]
    const { boards, purchases } = packBoards(items)
    expect(boards).toHaveLength(1)
    expect(purchases).toEqual([{ size: '4x4', stockLength: 96, qty: 1 }])
  })

  it('gives four 12-ft beams four 12-ft boards', () => {
    const items: CutListItem[] = [{ size: '2x10', length: 144, qty: 4, roles: ['beam'] }]
    const { purchases } = packBoards(items)
    expect(purchases).toEqual([{ size: '2x10', stockLength: 144, qty: 4 }])
  })

  it('respects the saw kerf when packing', () => {
    // Four 48" cuts sum to exactly 192", but three kerfs push them onto two boards.
    const items: CutListItem[] = [{ size: '2x4', length: 48, qty: 4, roles: ['slat'] }]
    const { boards } = packBoards(items)
    expect(boards).toHaveLength(2)
  })

  it('warns on cuts longer than 16-ft stock', () => {
    const items: CutListItem[] = [{ size: '2x10', length: 200, qty: 1, roles: ['beam'] }]
    const { warnings, boards } = packBoards(items)
    expect(warnings).toHaveLength(1)
    expect(boards).toHaveLength(1)
  })

  it('respects a longest-board cap and warns once for cuts that break it', () => {
    const items: CutListItem[] = [
      { size: '2x8', length: 144, qty: 10, roles: ['rafter'] },
      { size: '4x4', length: 34, qty: 4, roles: ['brace'] },
    ]
    const { boards, purchases, warnings } = packBoards(items, 0.125, 96)
    // rafters physically need 12' boards despite the 8' cap
    expect(purchases.find((p) => p.size === '2x8')).toEqual({
      size: '2x8',
      stockLength: 144,
      qty: 10,
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain("longer than your 8' limit")
    // braces still pack two-per-8-footer, never exceeding the cap
    const braceBoards = boards.filter((b) => b.size === '4x4')
    expect(braceBoards).toHaveLength(2)
    for (const b of braceBoards) expect(b.stockLength).toBeLessThanOrEqual(96)
  })

  it('never opens boards above the cap for cuts that fit it', () => {
    const items: CutListItem[] = [{ size: '2x4', length: 90, qty: 6, roles: ['slat'] }]
    const { boards } = packBoards(items, 0.125, 120)
    for (const b of boards) expect(b.stockLength).toBeLessThanOrEqual(120)
  })
})
