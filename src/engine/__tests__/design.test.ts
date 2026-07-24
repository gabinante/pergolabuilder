import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, designPergola } from '../design'
import type { PergolaConfig } from '../types'

const config = (overrides: Partial<PergolaConfig> = {}): PergolaConfig => ({
  ...DEFAULT_CONFIG,
  ...overrides,
})

describe('designPergola', () => {
  it('canonical 12x12x8: 4 posts, 4 beams, 2x8 rafters, 4 braces, no warnings', () => {
    const { members, warnings, meta } = designPergola(config())

    const posts = members.filter((m) => m.role === 'post')
    expect(posts).toHaveLength(4)
    for (const p of posts) {
      expect(p.size).toBe('6x6')
      expect(p.length).toBe(105.25) // 96 clearance + 9.25 beam depth
    }

    const beams = members.filter((m) => m.role === 'beam')
    expect(beams).toHaveLength(4)
    for (const b of beams) {
      expect(b.size).toBe('2x10')
      expect(b.length).toBe(144)
    }

    // 142.5" usable width at 16" o.c. → 10 rafters, actual spacing ≤ requested
    expect(meta.rafterCount).toBe(10)
    expect(meta.actualRafterSpacing).toBeLessThanOrEqual(16)
    expect(meta.rafterSize).toBe('2x8') // 120" span ≤ 144"

    const braces = members.filter((m) => m.role === 'brace')
    expect(braces).toHaveLength(4)
    for (const br of braces) {
      expect(br.size).toBe('4x4')
      expect(br.length).toBe(34)
    }

    expect(meta.slatCount).toBe(0)
    expect(warnings).toHaveLength(0)
  })

  it('is symmetric about the origin', () => {
    const { members } = designPergola(config())
    const sumX = members.reduce((s, m) => s + m.position[0], 0)
    const sumZ = members.reduce((s, m) => s + m.position[2], 0)
    expect(sumX).toBeCloseTo(0, 6)
    expect(sumZ).toBeCloseTo(0, 6)
  })

  it('20 ft width: 6 posts, split beams (8 boards), middle posts braced both ways', () => {
    const { members, meta } = designPergola(config({ width: 240 }))
    expect(meta.postCount).toBe(6)
    expect(meta.postXs).toEqual([-108, 0, 108])

    const beams = members.filter((m) => m.role === 'beam')
    expect(beams).toHaveLength(8)
    for (const b of beams) expect(b.length).toBe(120)

    expect(members.filter((m) => m.role === 'brace')).toHaveLength(8)
  })

  it('40 ft width: 8 posts, beams spliced at every interior post, slats in 3 pieces', () => {
    const { members, meta } = designPergola(config({ width: 480, slats: true }))
    expect(meta.postCount).toBe(8) // 4 per row
    expect(meta.postXs).toHaveLength(4)

    // every clear span stays within the 14 ft beam rule
    for (let i = 1; i < meta.postXs.length; i++) {
      expect(meta.postXs[i] - meta.postXs[i - 1] - 5.5).toBeLessThanOrEqual(168)
    }

    // 3 pieces per board face x 2 faces x 2 rows, none longer than 16 ft stock
    const beams = members.filter((m) => m.role === 'beam')
    expect(beams).toHaveLength(12)
    for (const b of beams) expect(b.length).toBeLessThanOrEqual(192)

    // 480" slats → 3 x 160" pieces
    const slats = members.filter((m) => m.role === 'slat')
    expect(slats).toHaveLength(meta.slatCount * 3)
    for (const s of slats) expect(s.length).toBe(160)

    // 2 interior posts per row brace both ways: (2x1 + 2x2) x 2 rows
    expect(members.filter((m) => m.role === 'brace')).toHaveLength(12)
    expect(members.some((m) => m.role === 'beam' && m.length > 192)).toBe(false)
  })

  it('12 ft height: posts still pack onto 16-ft stock', () => {
    const { members, warnings } = designPergola(config({ height: 144 }))
    const post = members.find((m) => m.role === 'post')!
    expect(post.length).toBe(153.25) // 144 + 9.25, fits a 192" board
    expect(warnings).toHaveLength(0)
  })

  it('upgrades rafters to 2x10 beyond a 12 ft span', () => {
    const { meta } = designPergola(config({ depth: 204 })) // span 180"
    expect(meta.rafterSize).toBe('2x10')
  })

  it('warns when the rafter span exceeds 16 ft', () => {
    const { warnings } = designPergola(config({ depth: 228 })) // span 204"
    expect(warnings.some((w) => w.includes('Rafter span'))).toBe(true)
  })

  it('embedded posts add max(24", height/3) to the cut length only', () => {
    const { members, meta } = designPergola(config({ postAnchor: 'embedded' }))
    const post = members.find((m) => m.role === 'post')!
    expect(meta.embedment).toBe(32) // 96/3 > 24
    expect(post.length).toBe(105.25 + 32)
    // rendered position unchanged: center of the above-grade portion
    expect(post.position[1]).toBeCloseTo(105.25 / 2)
  })

  it('slats: full-width 2x4s evenly redistributed across the depth', () => {
    const { members, meta } = designPergola(config({ slats: true }))
    const slats = members.filter((m) => m.role === 'slat')
    expect(slats).toHaveLength(13) // 140.5" extent at 12" o.c.
    expect(meta.slatCount).toBe(13)
    expect(meta.actualSlatSpacing).toBeLessThanOrEqual(12)
    for (const s of slats) {
      expect(s.size).toBe('2x4')
      expect(s.length).toBe(144)
    }
  })

  it('splits slats longer than 16-ft stock into two spliced pieces', () => {
    const { members, meta } = designPergola(config({ width: 240, slats: true }))
    const slats = members.filter((m) => m.role === 'slat')
    expect(slats).toHaveLength(meta.slatCount * 2)
    for (const s of slats) expect(s.length).toBe(120)
  })

  it('tilt: front posts drop, rafters lengthen by 1/cos and pitch', () => {
    const drop = 12
    const { members, meta } = designPergola(config({ tiltDrop: drop }))

    const backPosts = members.filter((m) => m.role === 'post' && m.position[2] < 0)
    const frontPosts = members.filter((m) => m.role === 'post' && m.position[2] > 0)
    expect(backPosts[0].length).toBe(105.25)
    expect(frontPosts[0].length).toBe(105.25 - drop)

    const expectedPitch = Math.atan2(drop, 120) // 120" beam-to-beam span
    expect(meta.rafterPitch).toBeCloseTo(expectedPitch)
    const rafter = members.find((m) => m.role === 'rafter')!
    expect(rafter.length).toBeCloseTo(Math.round((144 / Math.cos(expectedPitch)) * 16) / 16, 4)
    expect(rafter.rotation[2]).toBeCloseTo(expectedPitch)

    // front beams sit lower than back beams
    const beamYs = new Set(members.filter((m) => m.role === 'beam').map((m) => m.position[1]))
    expect(beamYs.size).toBe(2)
  })

  it('tilt: warns when front clearance falls below 6\' 8"', () => {
    const { warnings } = designPergola(config({ height: 84, tiltDrop: 12 })) // 72" front
    expect(warnings.some((w) => w.includes('clearance'))).toBe(true)
  })

  it('tilt: slats follow the sloped rafter plane', () => {
    const { members } = designPergola(config({ slats: true, tiltDrop: 12 }))
    const slats = members.filter((m) => m.role === 'slat')
    const backSlat = slats.reduce((a, b) => (a.position[2] < b.position[2] ? a : b))
    const frontSlat = slats.reduce((a, b) => (a.position[2] > b.position[2] ? a : b))
    expect(backSlat.position[1]).toBeGreaterThan(frontSlat.position[1])
    expect(backSlat.rotation[0]).toBeCloseTo(Math.PI / 2 + Math.atan2(12, 120))
  })

  it('manual rafter size is honored, warning past its span rule', () => {
    const undersized = designPergola(config({ rafterSize: '2x6' })) // 120" span > 108" limit
    for (const r of undersized.members.filter((m) => m.role === 'rafter')) {
      expect(r.size).toBe('2x6')
    }
    expect(undersized.warnings.some((w) => w.includes('2x6 rafters exceed'))).toBe(true)
    expect(undersized.meta.rafterSize).toBe('2x6')

    const oversized = designPergola(config({ rafterSize: '2x10' }))
    expect(oversized.meta.rafterSize).toBe('2x10')
    expect(oversized.warnings).toHaveLength(0)
  })

  it('2x4 rafters get a shallower bite (max 1/3 of depth)', () => {
    const { meta } = designPergola(config({ rafterSize: '2x4', depth: 84, rafterOverhang: 6 }))
    expect(meta.biteDepth).toBe(1.125) // floor(3.5/3 to 1/16")
  })

  it('rafter caps tag members without changing cut lengths', () => {
    const square = designPergola(config())
    const cove = designPergola(config({ rafterCap: 'cove' }))
    const coveRafters = cove.members.filter((m) => m.role === 'rafter')
    for (const r of coveRafters) expect(r.cap).toBe('cove')
    expect(coveRafters.map((m) => m.length)).toEqual(
      square.members.filter((m) => m.role === 'rafter').map((m) => m.length),
    )
    for (const m of cove.members.filter((r) => r.role !== 'rafter')) expect(m.cap).toBeUndefined()
  })

  it('beam tops are flush with post tops; unnotched rafters sit on beams', () => {
    const { members, meta } = designPergola(config({ rafterBite: false }))
    const beam = members.find((m) => m.role === 'beam')!
    expect(beam.position[1] + 9.25 / 2).toBeCloseTo(meta.postTopY)
    const rafter = members.find((m) => m.role === 'rafter')!
    expect(rafter.position[1] - 7.25 / 2).toBeCloseTo(meta.postTopY)
    expect(rafter.notches).toBeUndefined()
    expect(meta.biteDepth).toBe(0)
  })

  it('bite: rafters drop by the seat depth and carry two level notches', () => {
    const { members, meta } = designPergola(config()) // bite on by default
    expect(meta.biteDepth).toBe(1.5)
    const rafter = members.find((m) => m.role === 'rafter')!
    // underside sits 1.5" below the beam tops between beams
    expect(rafter.position[1] - 7.25 / 2).toBeCloseTo(meta.postTopY - 1.5)

    const notches = rafter.notches!
    expect(notches).toHaveLength(2)
    for (const notch of notches) {
      expect(notch).toHaveLength(4)
      // level case: seat 1.5" above the underside, 8.5" wide
      expect(notch[1][1]).toBeCloseTo(-7.25 / 2 + 1.5)
      expect(notch[2][1]).toBeCloseTo(-7.25 / 2 + 1.5)
      expect(notch[3][0] - notch[0][0]).toBeCloseTo(8.5)
    }
    // notch centers land over the beam lines (±60" for the 12-ft default)
    const centers = notches.map((n) => (n[0][0] + n[3][0]) / 2)
    expect(centers[0]).toBeCloseTo(-60) // front beam (low side) at negative local x
    expect(centers[1]).toBeCloseTo(60)
  })

  it('bite + tilt: seats stay level so notch depth varies across the seat', () => {
    const { members, meta } = designPergola(config({ tiltDrop: 12 }))
    const rafter = members.find((m) => m.role === 'rafter')!
    const [front, back] = rafter.notches!
    // the seat line is world-level, so in the sloped board's frame the two
    // seat corners sit at different local depths
    expect(Math.abs(front[1][1] - front[2][1])).toBeGreaterThan(0.1)
    // deepest cut stays modest (bite ± half the seat width times the slope)
    const maxDepth = Math.max(...[...front, ...back].map(([, y]) => y + 7.25 / 2))
    expect(maxDepth).toBeLessThan(2.5)
    expect(meta.biteDepth).toBe(1.5)
  })
})
