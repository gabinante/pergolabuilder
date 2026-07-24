// Hardware quantities derived from the design meta (counts, not geometry).

import type { DesignResult, PergolaConfig } from './types'

export interface HardwareItem {
  key: string
  label: string
  qty: number
  unit: string
}

export function hardwareList(design: DesignResult, config: PergolaConfig): HardwareItem[] {
  const { postCount, rafterCount, slatCount, braceCount } = design.meta
  const items: HardwareItem[] = []

  if (config.postAnchor === 'base') {
    items.push({
      key: 'postBase',
      label: '6x6 standoff post base (with anchor)',
      qty: postCount,
      unit: 'ea',
    })
    // ~12" dia x 24" footing ≈ 1.6 cu ft ≈ 4 bags of 60-lb concrete per post
    items.push({ key: 'concreteBag', label: '60-lb concrete bag', qty: postCount * 4, unit: 'bags' })
  } else {
    items.push({ key: 'concreteBag', label: '60-lb concrete bag', qty: postCount * 3, unit: 'bags' })
    items.push({ key: 'gravelBag', label: 'Drainage gravel, 0.5 cu ft bag', qty: postCount, unit: 'bags' })
  }

  // Through-bolts: 2 per post through the doubled beam assembly, 2 per brace end pair.
  items.push({
    key: 'carriageBolt',
    label: '1/2" x 8" hot-dip galv. carriage bolt (nut + 2 washers)',
    qty: postCount * 2 + braceCount * 2,
    unit: 'ea',
  })

  // Rafters cross two beam lines; 2 structural screws per crossing.
  items.push({
    key: 'structuralScrew',
    label: '6" structural wood screw (rafter to beam)',
    qty: rafterCount * 2 * 2,
    unit: 'ea',
  })

  if (slatCount > 0) {
    const screws = slatCount * rafterCount // one screw per slat-rafter crossing
    items.push({
      key: 'deckScrews',
      label: '3" exterior deck screws, 1-lb box (slats)',
      qty: Math.max(1, Math.ceil(screws / 75)),
      unit: 'boxes',
    })
  }

  return items
}
