import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Shown next to price labels so users know how fresh the estimates are. */
export const PRICES_AS_OF = 'July 2026'

/**
 * Editable unit prices, persisted to localStorage. Lumber keys are
 * `${size}-${stockLengthInches}`; hardware keys match HardwareItem.key.
 *
 * Defaults are national ballpark estimates as of July 2026, triangulated from
 * a published lumber-yard PT price list (Intercity Lumber, FL) and a Lowe's
 * pricing guide — labeled as editable estimates in the UI. Regional prices
 * commonly vary ±15%.
 */
export const DEFAULT_PRICES: Record<string, number> = {
  '2x4-96': 6,
  '2x4-120': 8.5,
  '2x4-144': 10,
  '2x4-192': 14,
  '2x6-96': 9.5,
  '2x6-120': 12.5,
  '2x6-144': 14,
  '2x6-192': 19,
  '2x8-96': 13,
  '2x8-120': 17,
  '2x8-144': 19.5,
  '2x8-192': 26,
  '2x10-96': 15,
  '2x10-120': 22,
  '2x10-144': 27,
  '2x10-192': 33,
  '4x4-96': 12,
  '4x4-120': 16.5,
  '4x4-144': 18.5,
  '4x4-192': 26,
  '6x6-96': 28,
  '6x6-120': 38,
  '6x6-144': 45,
  '6x6-192': 68,
  postBase: 38, // Simpson ABU66Z-style standoff base
  carriageBolt: 3, // 1/2" x 8" HDG + nut + 2 washers
  structuralScrew: 1, // TimberLOK 6" (~$0.82-1.78/ea by pack size)
  deckScrews: 10, // 1-lb box
  concreteBag: 6.5, // 60-lb Quikrete
  gravelBag: 5,
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
