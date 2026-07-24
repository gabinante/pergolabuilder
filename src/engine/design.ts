// Parametric pergola design. Pure function of PergolaConfig — the 3D view,
// cut list, hardware, cost, and print diagrams all derive from its output.

import { LUMBER, MAX_STOCK_LENGTH, type NominalSize } from './lumber'
import {
  BITE_DEPTH,
  BRACE_LEG,
  BRACE_LENGTH,
  MAX_BEAM_CLEAR_SPAN,
  MAX_BEAM_OVERHANG,
  MAX_RAFTER_SPAN,
  MAX_TILT_DROP,
  MIN_EMBEDMENT,
  MIN_TILT_CLEARANCE,
  RAFTER_SPAN_LIMITS,
  RAFTER_UPGRADE_SPAN,
} from './rules'
import { formatFeetInches, roundSixteenth } from './units'
import type { DesignResult, Member, PergolaConfig } from './types'

export const DEFAULT_CONFIG: PergolaConfig = {
  width: 144,
  depth: 144,
  height: 96,
  rafterSpacing: 16,
  slats: false,
  slatSpacing: 12,
  beamOverhang: 12,
  rafterOverhang: 12,
  postAnchor: 'base',
  tiltDrop: 0,
  rafterCap: 'square',
  rafterBite: true,
  rafterSize: 'auto',
  maxStockLength: 192,
}

/**
 * Evenly redistribute members across an extent (center-to-center) so the end
 * bays are never slivers. Returns symmetric center positions and the actual
 * on-center spacing used (always <= requested).
 */
function distribute(extent: number, spacing: number): { positions: number[]; actual: number } {
  const n = Math.max(2, Math.ceil(extent / spacing) + 1)
  const actual = extent / (n - 1)
  return {
    positions: Array.from({ length: n }, (_, i) => -extent / 2 + i * actual),
    actual,
  }
}

export function designPergola(config: PergolaConfig): DesignResult {
  const { width, depth, height } = config
  const warnings: string[] = []
  const members: Member[] = []

  const post = LUMBER['6x6']
  const beam = LUMBER['2x10']

  const beamOverhang = Math.min(config.beamOverhang, MAX_BEAM_OVERHANG, 0.15 * width)
  const rafterOverhang = config.rafterOverhang

  // Tilt: the front (+Z) beam line drops so the roof plane sheds toward it.
  const tiltDrop = Math.min(Math.max(config.tiltDrop, 0), MAX_TILT_DROP, height / 2)
  if (tiltDrop > 0 && height - tiltDrop < MIN_TILT_CLEARANCE) {
    warnings.push(
      `Front-side clearance of ${formatFeetInches(height - tiltDrop)} is below 6' 8". Raise the height or reduce the tilt.`,
    )
  }

  // Vertical stack: `height` is clearance under the beams ON THE HIGH (back)
  // side; beam tops sit flush with the post tops (standard bolted sandwich
  // detail). The front row is `tiltDrop` lower.
  const postTopY = height + beam.depth
  const rowDrop = (z: number) => (z > 0 ? tiltDrop : 0)
  const embedment = config.postAnchor === 'embedded' ? Math.max(MIN_EMBEDMENT, height / 3) : 0

  // --- Posts ---------------------------------------------------------------
  const beamZ = depth / 2 - rafterOverhang
  const beamZs: [number, number] = [-beamZ, beamZ]
  const postA = width / 2 - beamOverhang
  // Add interior posts until every clear span is within the beam limit.
  const spanBetween = 2 * postA // corner-to-corner, center to center
  const bays = Math.max(1, Math.ceil(spanBetween / (MAX_BEAM_CLEAR_SPAN + post.thickness)))
  const postXs = Array.from({ length: bays + 1 }, (_, i) => -postA + (i * spanBetween) / bays)

  let postIndex = 0
  for (const z of beamZs) {
    const top = postTopY - rowDrop(z)
    for (const x of postXs) {
      // Cut length includes embedment; the 3D model only shows above grade.
      members.push({
        id: `post-${postIndex++}`,
        role: 'post',
        size: '6x6',
        length: top + embedment,
        position: [x, top / 2, z],
        rotation: [0, 0, Math.PI / 2],
      })
    }
  }

  // --- Beams: doubled 2x10 sandwiching each post row -----------------------
  // Boards are spliced at every interior post so pieces stay within stock.
  const beamFaceOffset = post.thickness / 2 + beam.thickness / 2
  const splicePoints = [-width / 2, ...postXs.slice(1, -1), width / 2]
  let beamIndex = 0
  let longestBeamPiece = 0
  for (const z of beamZs) {
    const beamY = postTopY - rowDrop(z) - beam.depth / 2
    for (const side of [-1, 1]) {
      const bz = z + side * beamFaceOffset
      for (let i = 0; i < splicePoints.length - 1; i++) {
        const start = splicePoints[i]
        const end = splicePoints[i + 1]
        longestBeamPiece = Math.max(longestBeamPiece, end - start)
        members.push({
          id: `beam-${beamIndex++}`,
          role: 'beam',
          size: '2x10',
          length: end - start,
          position: [(start + end) / 2, beamY, bz],
          rotation: [0, 0, 0],
        })
      }
    }
  }
  if (longestBeamPiece > MAX_STOCK_LENGTH) {
    warnings.push(
      `Beam boards of ${formatFeetInches(longestBeamPiece)} exceed the longest common stock (16'). Plan a splice or special order.`,
    )
  }

  // --- Rafters: on edge, sitting on top of the beams -----------------------
  const rafterSpan = beamZ * 2 // beam line to beam line
  const autoSize: NominalSize = rafterSpan <= RAFTER_UPGRADE_SPAN ? '2x8' : '2x10'
  const rafterSize: NominalSize = config.rafterSize === 'auto' ? autoSize : config.rafterSize
  const rafter = LUMBER[rafterSize]
  if (config.rafterSize !== 'auto') {
    const limit = RAFTER_SPAN_LIMITS[config.rafterSize]
    if (rafterSpan > limit) {
      warnings.push(
        `${config.rafterSize} rafters exceed their ~${formatFeetInches(limit)} rule-of-thumb span (this design spans ${formatFeetInches(rafterSpan)}) — expect sag; consider ${autoSize}.`,
      )
    }
  }
  if (rafterSpan > MAX_RAFTER_SPAN) {
    warnings.push(
      `Rafter span of ${formatFeetInches(rafterSpan)} between beams exceeds the 16' rule of thumb for 2x10s. Consider reducing depth or adding a third beam line.`,
    )
  }
  // Slope: rafters bear on the back beam at postTopY and the front beam
  // tiltDrop lower, so they pitch by atan(drop / beam-to-beam span).
  const pitch = Math.atan2(tiltDrop, rafterSpan)
  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  // Same horizontal footprint as a level roof → cut length grows by 1/cos.
  const rafterLength = depth / cosP
  // With the bite on, the whole rafter plane drops by the seat depth and a
  // level notch is cut over each beam assembly so the rafter locks in place.
  // Never notch away more than a third of the rafter depth (shallow 2x4s).
  const bite = config.rafterBite
    ? Math.min(BITE_DEPTH, Math.floor(((rafter.depth / 3) * 16)) / 16)
    : 0
  const beamAssemblyWidth = post.thickness + 2 * beam.thickness // 8.5"
  // Rafter underside at the footprint center (z = 0), halfway down the slope.
  const rafterMidUnderside = postTopY - tiltDrop / 2 - bite
  // Member-center world coordinates shared by every rafter (x aside).
  const rafterCenterY = rafterMidUnderside + (rafter.depth / 2) * cosP
  const rafterCenterZ = (rafter.depth / 2) * sinP

  // Notch polygons in the rafter's local frame (length on X, +X = back end).
  // Seat cuts are world-level at each beam top; the notch sides are plumb.
  let notches: [number, number][][] | undefined
  if (bite > 0) {
    const yBottom = -rafter.depth / 2
    // world (y, z) → local (x, y): inverse of the member's pitch + yaw
    const toLocal = (yw: number, zw: number): [number, number] => [
      (yw - rafterCenterY) * sinP - (zw - rafterCenterZ) * cosP,
      (yw - rafterCenterY) * cosP + (zw - rafterCenterZ) * sinP,
    ]
    // local x where a plumb line (world z = zw) crosses a given local y
    const plumbX = (zw: number, yLocal: number) =>
      (rafterCenterZ - zw + yLocal * sinP) / cosP
    // seat corners can't dip below the underside at extreme slopes
    const seat = (yw: number, zw: number): [number, number] => {
      const [x, y] = toLocal(yw, zw)
      return [x, Math.max(y, yBottom)]
    }
    const notchAt = (zb: number, beamTop: number): [number, number][] => [
      [plumbX(zb + beamAssemblyWidth / 2, yBottom), yBottom],
      seat(beamTop, zb + beamAssemblyWidth / 2),
      seat(beamTop, zb - beamAssemblyWidth / 2),
      [plumbX(zb - beamAssemblyWidth / 2, yBottom), yBottom],
    ]
    // ordered by ascending local x: front (low, +Z) beam first, then back
    notches = [notchAt(beamZ, postTopY - tiltDrop), notchAt(-beamZ, postTopY)]
  }

  const rafterExtent = width - rafter.thickness // end rafters flush with beam ends
  const rafterLayout = distribute(rafterExtent, config.rafterSpacing)
  rafterLayout.positions.forEach((x, i) => {
    members.push({
      id: `rafter-${i}`,
      role: 'rafter',
      size: rafterSize,
      length: rafterLength,
      // Box center sits half the board depth above the underside, measured
      // perpendicular to the sloped axis: (0, cosP, sinP) is "up" for the board.
      position: [x, rafterCenterY, rafterCenterZ],
      // Euler XYZ: the Z pitch is applied to the geometry first, then the Y yaw
      // turns the board to run along world Z; +pitch raises the back (-Z) end.
      rotation: [0, Math.PI / 2, pitch],
      cap: config.rafterCap,
      notches,
    })
  })
  if (rafterLength > MAX_STOCK_LENGTH) {
    warnings.push(
      `Rafters of ${formatFeetInches(rafterLength)} exceed the longest common stock (16'). Reduce depth or plan a special order.`,
    )
  }

  // --- Slats: 2x4 laid flat across the rafters -----------------------------
  const slat = LUMBER['2x4']
  let slatCount = 0
  let actualSlatSpacing = 0
  if (config.slats) {
    // Top surface of the (possibly sloped) rafter plane at a given z. The
    // slope term uses tan; the vertical cut through the board depth is D/cos.
    const rafterTopAt = (z: number) =>
      rafterMidUnderside - z * (sinP / cosP) + rafter.depth / cosP
    const slatExtent = depth - slat.depth // flat: wide face spans Z
    const slatLayout = distribute(slatExtent, config.slatSpacing)
    actualSlatSpacing = slatLayout.actual
    // Split slats that outrun 16-ft stock into equal pieces spliced over rafters.
    const slatPieces = Math.max(1, Math.ceil(width / MAX_STOCK_LENGTH))
    const pieceLength = width / slatPieces
    // rotX = PI/2 lays the board flat; adding the pitch keeps it seated on the slope
    slatLayout.positions.forEach((z, i) => {
      const y = rafterTopAt(z) + (slat.thickness / 2) * cosP
      const rotation: [number, number, number] = [Math.PI / 2 + pitch, 0, 0]
      for (let k = 0; k < slatPieces; k++) {
        members.push({
          id: slatPieces > 1 ? `slat-${i}-${k}` : `slat-${i}`,
          role: 'slat',
          size: '2x4',
          length: pieceLength,
          position: [-width / 2 + (k + 0.5) * pieceLength, y, z],
          rotation,
        })
      }
    })
    slatCount = slatLayout.positions.length
  }

  // --- Knee braces: 4x4 at 45°, tucked between the doubled beams -----------
  // The 3.5" brace fits inside the 5.5" gap between the two 2x10s.
  let braceIndex = 0
  for (const z of beamZs) {
    for (const x of postXs) {
      const rowClearance = height - rowDrop(z) // beam underside for this row
      const interior = x !== postXs[0] && x !== postXs[postXs.length - 1]
      const directions = interior ? [-1, 1] : [x < 0 ? 1 : -1] // interior posts brace both ways
      for (const dir of directions) {
        // Runs from the post face (at rowClearance - BRACE_LEG) up to the beam underside.
        members.push({
          id: `brace-${braceIndex++}`,
          role: 'brace',
          size: '4x4',
          length: BRACE_LENGTH,
          position: [x + (dir * BRACE_LEG) / 2, rowClearance - BRACE_LEG / 2, z],
          rotation: [0, 0, dir * (Math.PI / 4)],
        })
      }
    }
  }

  // Highest point: top of the back rafter tail (plus slats when present).
  const totalHeight =
    rafterMidUnderside +
    (depth / 2) * (sinP / cosP) +
    rafter.depth / cosP +
    (config.slats ? slat.thickness / cosP : 0)

  members.forEach((m) => {
    m.length = roundSixteenth(m.length)
  })

  return {
    members,
    warnings,
    meta: {
      postCount: postXs.length * 2,
      rafterCount: rafterLayout.positions.length,
      slatCount,
      braceCount: braceIndex,
      rafterSize,
      postTopY,
      totalHeight,
      postXs,
      beamZs,
      actualRafterSpacing: rafterLayout.actual,
      actualSlatSpacing,
      embedment,
      tiltDrop,
      rafterPitch: pitch,
      biteDepth: bite,
      beamAssemblyWidth,
    },
  }
}
