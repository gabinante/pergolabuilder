import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Shown next to price labels so users know how fresh the estimates are. */
export const PRICES_AS_OF = 'July 2026, California'

/**
 * Editable unit prices, persisted to localStorage. Lumber keys are
 * `${size}-${stockLengthInches}`; hardware keys match HardwareItem.key.
 *
 * Defaults are California ballpark estimates as of July 2026: national prices
 * triangulated from a published lumber-yard PT price list (Intercity Lumber,
 * FL) and a Lowe's pricing guide, then scaled ~+20% for the documented West
 * Coast premium (regional guides put it at 15-25%). Hardware is priced
 * nationally (chain pricing is fairly uniform); concrete is bumped for CA.
 */
export const DEFAULT_PRICES: Record<string, number> = {
  '2x4-96': 7,
  '2x4-120': 10,
  '2x4-144': 12,
  '2x4-192': 17,
  '2x6-96': 11.5,
  '2x6-120': 15,
  '2x6-144': 17,
  '2x6-192': 23,
  '2x8-96': 15.5,
  '2x8-120': 20.5,
  '2x8-144': 23.5,
  '2x8-192': 31,
  '2x10-96': 18,
  '2x10-120': 26.5,
  '2x10-144': 32.5,
  '2x10-192': 40,
  '4x4-96': 14.5,
  '4x4-120': 20,
  '4x4-144': 22,
  '4x4-192': 31,
  '6x6-96': 34,
  '6x6-120': 46,
  '6x6-144': 54,
  '6x6-192': 82,
  postBase: 38, // Simpson ABU66Z-style standoff base
  carriageBolt: 3, // 1/2" x 8" HDG + nut + 2 washers
  structuralScrew: 1, // TimberLOK 6" (~$0.82-1.78/ea by pack size)
  deckScrews: 10, // 1-lb box
  concreteBag: 8, // 60-lb Quikrete, CA pricing
  gravelBag: 6,
}

interface PriceState {
  prices: Record<string, number>
  /** Show the cost estimate on the printable plan sheet (off = quote worksheet). */
  includePricing: boolean
  setPrice: (key: string, value: number) => void
  setIncludePricing: (on: boolean) => void
  resetPrices: () => void
}

export const usePriceStore = create<PriceState>()(
  persist(
    (set) => ({
      prices: DEFAULT_PRICES,
      includePricing: true,
      setPrice: (key, value) => set((s) => ({ prices: { ...s.prices, [key]: value } })),
      setIncludePricing: (on) => set({ includePricing: on }),
      resetPrices: () => set({ prices: DEFAULT_PRICES }),
    }),
    {
      name: 'pergola-prices',
      // Seed newly added default price keys for users with older persisted
      // data, while keeping any prices they've edited.
      merge: (persisted, current) => {
        const stored = (persisted as Partial<PriceState> | undefined) ?? {}
        return {
          ...current,
          ...stored,
          prices: { ...DEFAULT_PRICES, ...stored.prices },
        }
      },
    },
  ),
)
