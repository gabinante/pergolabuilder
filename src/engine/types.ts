import type { NominalSize } from './lumber'

export type MemberRole = 'post' | 'beam' | 'rafter' | 'slat' | 'brace'

/** Decorative end-cut profile for rafter tails. */
export type RafterCap = 'square' | 'chamfer' | 'bullnose' | 'cove'

/**
 * One piece of lumber. Local frame: length along local X, board depth along
 * local Y, thickness along local Z. `position` is the box center in the engine
 * frame (inches, Y-up, origin at footprint center at grade); `rotation` is XYZ
 * Euler radians. Both renderer and cut list derive from this.
 */
export interface Member {
  id: string
  role: MemberRole
  size: NominalSize
  /** Cut length in inches (long-point for angled braces). */
  length: number
  position: [number, number, number]
  rotation: [number, number, number]
  /** End-cut profile (rafters only; absent means square). */
  cap?: RafterCap
  /**
   * Seat-notch polygons cut out of the member's side profile (rafters only).
   * Points are [x, y] in the member's local frame (inches, length along X,
   * depth along Y, origin at the box center), ordered left-to-right; each
   * polygon runs bottom → seat → bottom.
   */
  notches?: [number, number][][]
}

export interface PergolaConfig {
  /** Overall X extent incl. beam overhangs, inches. */
  width: number
  /** Overall Z extent incl. rafter overhangs, inches. */
  depth: number
  /** Head clearance: grade to underside of beams, inches. */
  height: number
  /** Rafter spacing on center, inches. */
  rafterSpacing: number
  slats: boolean
  /** Slat spacing on center, inches. */
  slatSpacing: number
  /** Beam overhang past posts, inches. */
  beamOverhang: number
  /** Rafter overhang past beam faces, inches. */
  rafterOverhang: number
  postAnchor: 'base' | 'embedded'
  /** Drop of the front (+Z) side relative to the back, inches. 0 = level. */
  tiltDrop: number
  /** Decorative rafter tail profile. */
  rafterCap: RafterCap
  /** Notch rafters over the beam assemblies with a level seat cut. */
  rafterBite: boolean
  /** Rafter size: 'auto' picks by span; otherwise forced (with span warnings). */
  rafterSize: 'auto' | '2x4' | '2x6' | '2x8' | '2x10'
  /** Longest board you can buy/transport, inches (96 | 120 | 144 | 192). */
  maxStockLength: number
}

export interface DesignMeta {
  postCount: number
  rafterCount: number
  slatCount: number
  braceCount: number
  rafterSize: NominalSize
  /** Y of the top of the posts (beam tops are flush with this). */
  postTopY: number
  /** Overall height to the top of the highest member. */
  totalHeight: number
  /** X positions of post centers (one row; mirrored across both beam lines). */
  postXs: number[]
  /** Z positions of the two beam lines (post row centers). */
  beamZs: [number, number]
  /** Actual rafter spacing after even redistribution, inches o.c. */
  actualRafterSpacing: number
  /** Actual slat spacing after even redistribution, inches o.c. (0 if no slats). */
  actualSlatSpacing: number
  /** Post embedment depth in inches (0 when postAnchor is 'base'). */
  embedment: number
  /** Applied front-side drop in inches (clamped; 0 when level). */
  tiltDrop: number
  /** Rafter slope angle in radians (0 when level). */
  rafterPitch: number
  /** Vertical seat-notch depth at the beam centerline (0 when bite is off). */
  biteDepth: number
  /** Width of the notch seat = full doubled-beam assembly width, inches. */
  beamAssemblyWidth: number
}

export interface DesignResult {
  members: Member[]
  warnings: string[]
  meta: DesignMeta
}

export interface CutListItem {
  size: NominalSize
  /** Cut length, inches, rounded to 1/16". */
  length: number
  qty: number
  roles: MemberRole[]
}

export interface StockBoard {
  size: NominalSize
  stockLength: number
  cuts: number[]
}

export interface Purchase {
  size: NominalSize
  stockLength: number
  qty: number
}
