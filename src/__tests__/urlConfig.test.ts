import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../engine/design'
import { configFromSearchParams, configToSearchParams } from '../urlConfig'
import type { PergolaConfig } from '../engine/types'

describe('configToSearchParams', () => {
  it('serializes the default config to an empty query', () => {
    expect(configToSearchParams(DEFAULT_CONFIG).toString()).toBe('')
  })

  it('serializes only non-default values', () => {
    const params = configToSearchParams({ ...DEFAULT_CONFIG, width: 168, slats: true })
    expect(params.get('w')).toBe('168')
    expect(params.get('slats')).toBe('1')
    expect([...params.keys()]).toHaveLength(2)
  })
})

describe('configFromSearchParams', () => {
  it('returns defaults for an empty query', () => {
    expect(configFromSearchParams(new URLSearchParams())).toEqual(DEFAULT_CONFIG)
  })

  it('round-trips a fully customized config', () => {
    const config: PergolaConfig = {
      width: 240,
      depth: 180,
      height: 108,
      rafterSpacing: 18,
      slats: true,
      slatSpacing: 10,
      beamOverhang: 15,
      rafterOverhang: 9,
      postAnchor: 'embedded',
      tiltDrop: 12,
      rafterCap: 'cove',
      rafterBite: false,
      rafterSize: '2x8',
      maxStockLength: 120,
    }
    expect(configFromSearchParams(configToSearchParams(config))).toEqual(config)
  })

  it('clamps out-of-range numbers to the input ranges', () => {
    const config = configFromSearchParams(new URLSearchParams('w=9999&h=1&tilt=-5'))
    expect(config.width).toBe(480)
    expect(config.height).toBe(84)
    expect(config.tiltDrop).toBe(0)
  })

  it('ignores invalid values and unknown params', () => {
    const config = configFromSearchParams(
      new URLSearchParams('w=abc&cap=fancy&stock=100&anchor=hover&bite=maybe&foo=bar'),
    )
    expect(config).toEqual(DEFAULT_CONFIG)
  })
})
