import { describe, expect, it } from 'vitest'
import { formatFeetInches, formatInches, roundSixteenth } from '../units'

describe('formatFeetInches', () => {
  it('handles whole feet', () => {
    expect(formatFeetInches(144)).toBe("12'")
  })
  it('handles feet + inches', () => {
    expect(formatFeetInches(105.25)).toBe(`8' 9-1/4"`)
  })
  it('handles a bare fraction after whole feet', () => {
    expect(formatFeetInches(144.6875)).toBe(`12' 11/16"`)
  })
  it('handles inches only', () => {
    expect(formatFeetInches(34)).toBe('2\' 10"')
    expect(formatFeetInches(9.25)).toBe('9-1/4"')
    expect(formatFeetInches(0.5)).toBe('1/2"')
    expect(formatFeetInches(0)).toBe('0"')
  })
  it('carries fractions that round up to a full inch or foot', () => {
    expect(formatFeetInches(143.999)).toBe("12'")
    expect(formatFeetInches(11.999)).toBe("1'")
  })
})

describe('formatInches', () => {
  it('formats plain and fractional inches', () => {
    expect(formatInches(34)).toBe('34"')
    expect(formatInches(105.25)).toBe('105-1/4"')
  })
})

describe('roundSixteenth', () => {
  it('rounds to the nearest 1/16', () => {
    expect(roundSixteenth(1.04)).toBe(1.0625)
    expect(roundSixteenth(144.71)).toBe(144.6875)
  })
})
