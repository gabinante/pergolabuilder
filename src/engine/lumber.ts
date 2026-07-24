// Nominal-to-actual lumber dimensions (inches) and purchasable stock lengths.

export type NominalSize = '2x2' | '2x4' | '2x6' | '2x8' | '2x10' | '4x4' | '6x6'

export interface LumberSpec {
  /** Actual thickness, inches (the narrow face). */
  thickness: number
  /** Actual depth, inches (the wide face — vertical when the board is on edge). */
  depth: number
}

export const LUMBER: Record<NominalSize, LumberSpec> = {
  '2x2': { thickness: 1.5, depth: 1.5 },
  '2x4': { thickness: 1.5, depth: 3.5 },
  '2x6': { thickness: 1.5, depth: 5.5 },
  '2x8': { thickness: 1.5, depth: 7.25 },
  '2x10': { thickness: 1.5, depth: 9.25 },
  '4x4': { thickness: 3.5, depth: 3.5 },
  '6x6': { thickness: 5.5, depth: 5.5 },
}

/** Purchasable stock lengths in inches: 8, 10, 12, 16 ft. */
export const STOCK_LENGTHS = [96, 120, 144, 192]

export const MAX_STOCK_LENGTH = STOCK_LENGTHS[STOCK_LENGTHS.length - 1]
