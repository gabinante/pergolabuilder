// Rules of thumb driving the parametric design. This is a visualization tool,
// not engineering advice — spans must be verified against local code.

/** Max clear span post-to-post for a doubled 2x10 beam before adding middle posts. */
export const MAX_BEAM_CLEAR_SPAN = 168 // 14 ft

/** Rafter size upgrades from 2x8 to 2x10 beyond this beam-to-beam span. */
export const RAFTER_UPGRADE_SPAN = 144 // 12 ft

/** Warn when the beam-to-beam rafter span exceeds this. */
export const MAX_RAFTER_SPAN = 192 // 16 ft

/** Rule-of-thumb maximum beam-to-beam span per rafter size, inches. */
export const RAFTER_SPAN_LIMITS = {
  '2x4': 72, // 6 ft
  '2x6': 108, // 9 ft
  '2x8': 144, // 12 ft
  '2x10': 192, // 16 ft
} as const

/** Beam overhang past posts is clamped to min(this, 0.15 * width). */
export const MAX_BEAM_OVERHANG = 18

/** Knee brace: 4x4 at 45 degrees with 24" legs; long-point length rounded to 34". */
export const BRACE_LEG = 24
export const BRACE_LENGTH = 34

/** Minimum post embedment depth for the 'embedded' anchor option. */
export const MIN_EMBEDMENT = 24

/** Maximum front-side tilt drop. */
export const MAX_TILT_DROP = 36

/**
 * Depth of the seat ("bite") notch cut into rafters over each beam assembly,
 * measured vertically at the beam centerline. The seat is cut level even on a
 * tilted roof so the sloped rafter bears flat on the beam tops.
 */
export const BITE_DEPTH = 1.5

/** Warn when tilt pushes the low-side clearance below this. */
export const MIN_TILT_CLEARANCE = 80 // 6'8"

export const DISCLAIMER =
  'Visualization tool only — not engineering advice. Verify spans, footings, and code requirements locally.'
