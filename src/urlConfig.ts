import { DEFAULT_CONFIG } from './engine/design'
import type { PergolaConfig } from './engine/types'

interface Codec<T> {
  encode: (value: T) => string
  decode: (raw: string) => T | undefined
}

function num(min: number, max: number): Codec<number> {
  return {
    encode: String,
    decode: (raw) => {
      const n = Number(raw)
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined
    },
  }
}

const bool: Codec<boolean> = {
  encode: (v) => (v ? '1' : '0'),
  decode: (raw) => (raw === '1' ? true : raw === '0' ? false : undefined),
}

function oneOf<T extends string | number>(values: readonly T[]): Codec<T> {
  return {
    encode: String,
    decode: (raw) => values.find((v) => String(v) === raw),
  }
}

/**
 * URL param per config key. Numeric values are inches (engine units), clamped
 * to the same ranges the input panel enforces; invalid or missing params fall
 * back to the default, so any URL yields a valid config.
 */
const FIELDS: { [K in keyof PergolaConfig]: { param: string; codec: Codec<PergolaConfig[K]> } } = {
  width: { param: 'w', codec: num(72, 480) },
  depth: { param: 'd', codec: num(72, 240) },
  height: { param: 'h', codec: num(84, 144) },
  rafterSpacing: { param: 'rs', codec: num(12, 24) },
  slats: { param: 'slats', codec: bool },
  slatSpacing: { param: 'ss', codec: num(6, 24) },
  beamOverhang: { param: 'bo', codec: num(6, 18) },
  rafterOverhang: { param: 'ro', codec: num(6, 18) },
  postAnchor: { param: 'anchor', codec: oneOf(['base', 'embedded'] as const) },
  tiltDrop: { param: 'tilt', codec: num(0, 36) },
  rafterCap: { param: 'cap', codec: oneOf(['square', 'chamfer', 'bullnose', 'cove'] as const) },
  rafterBite: { param: 'bite', codec: bool },
  rafterSize: { param: 'rafter', codec: oneOf(['auto', '2x4', '2x6', '2x8', '2x10'] as const) },
  maxStockLength: { param: 'stock', codec: oneOf<number>([96, 120, 144, 192]) },
}

const KEYS = Object.keys(FIELDS) as (keyof PergolaConfig)[]

type AnyValue = PergolaConfig[keyof PergolaConfig]

/** Serialize only the values that differ from the defaults. */
export function configToSearchParams(config: PergolaConfig): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of KEYS) {
    if (config[key] === DEFAULT_CONFIG[key]) continue
    const { param, codec } = FIELDS[key]
    params.set(param, (codec as Codec<AnyValue>).encode(config[key]))
  }
  return params
}

export function configFromSearchParams(params: URLSearchParams): PergolaConfig {
  const config = { ...DEFAULT_CONFIG } as Record<keyof PergolaConfig, AnyValue>
  for (const key of KEYS) {
    const raw = params.get(FIELDS[key].param)
    if (raw === null) continue
    const value = (FIELDS[key].codec as Codec<AnyValue>).decode(raw)
    if (value !== undefined) config[key] = value
  }
  return config as PergolaConfig
}

/** Startup config: URL params layered over defaults. Safe without a DOM. */
export function initialConfig(): PergolaConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  return configFromSearchParams(new URLSearchParams(window.location.search))
}

/** Current config as a shareable absolute URL. */
export function shareUrl(config: PergolaConfig): string {
  const query = configToSearchParams(config).toString()
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`
}

/** Rewrite the address bar in place so copying it also shares the design. */
export function syncUrl(config: PergolaConfig): void {
  const query = configToSearchParams(config).toString()
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
}
