// Pure unit helpers. The engine works in inches; the three.js scene uses 1 unit = 1 ft.

export const ftToIn = (ft: number): number => ft * 12

export const inToFt = (inches: number): number => inches / 12

/** Convert engine inches to scene units (feet). */
export const toScene = (inches: number): number => inches / 12

/** Round to the nearest 1/16" so float noise never splits cut-list rows. */
export const roundSixteenth = (inches: number): number => Math.round(inches * 16) / 16

/** Format inches as feet-and-inches, e.g. 137.5 -> 11' 5-1/2". */
export function formatFeetInches(inches: number): string {
  const total = roundSixteenth(inches)
  const sign = total < 0 ? '-' : ''
  // work in sixteenths to avoid float drift through the carries
  let sixteenths = Math.round(Math.abs(total) * 16)
  const ft = Math.floor(sixteenths / (12 * 16))
  sixteenths -= ft * 12 * 16
  const wholeIn = Math.floor(sixteenths / 16)
  let num = sixteenths - wholeIn * 16
  let den = 16
  while (num > 0 && num % 2 === 0) {
    num /= 2
    den /= 2
  }
  const frac = num > 0 ? `${num}/${den}` : ''
  let inchPart = ''
  if (wholeIn > 0 && frac) inchPart = `${wholeIn}-${frac}"`
  else if (wholeIn > 0) inchPart = `${wholeIn}"`
  else if (frac) inchPart = `${frac}"`
  if (ft === 0) return `${sign}${inchPart || '0"'}`
  return `${sign}${ft}'${inchPart ? ` ${inchPart}` : ''}`
}

/** Format inches as a plain inch string, e.g. 33.94 -> 34" (nearest 1/16 with fraction). */
export function formatInches(inches: number): string {
  const total = roundSixteenth(inches)
  const whole = Math.floor(total)
  let num = Math.round((total - whole) * 16)
  let den = 16
  if (num === 16) return `${whole + 1}"`
  while (num > 0 && num % 2 === 0) {
    num /= 2
    den /= 2
  }
  return num > 0 ? `${whole}-${num}/${den}"` : `${whole}"`
}
