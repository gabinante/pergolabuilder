import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Editable unit prices, persisted to localStorage. Lumber keys are
 * `${size}-${stockLengthInches}`; hardware keys match HardwareItem.key.
 * Defaults are rough big-box PT prices — labeled as editable estimates in the UI.
 */
export const DEFAULT_PRICES: Record<string, number> = {
  '2x4-96': 6,
  '2x4-120': 8,
  '2x4-144': 10,
  '2x4-192': 14,
  '2x6-96': 8,
  '2x6-120': 11,
  '2x6-144': 13,
  '2x6-192': 19,
  '2x8-96': 12,
  '2x8-120': 16,
  '2x8-144': 19,
  '2x8-192': 27,
  '2x10-96': 16,
  '2x10-120': 20,
  '2x10-144': 24,
  '2x10-192': 34,
  '4x4-96': 14,
  '4x4-120': 18,
  '4x4-144': 22,
  '4x4-192': 30,
  '6x6-96': 45,
  '6x6-120': 58,
  '6x6-144': 70,
  '6x6-192': 95,
  postBase: 30,
  carriageBolt: 2.5,
  structuralScrew: 0.6,
  deckScrews: 9,
  concreteBag: 7,
  gravelBag: 5,
}

interface PriceState {
  prices: Record<string, number>
  setPrice: (key: string, value: number) => void
  resetPrices: () => void
}

export const usePriceStore = create<PriceState>()(
  persist(
    (set) => ({
      prices: DEFAULT_PRICES,
      setPrice: (key, value) => set((s) => ({ prices: { ...s.prices, [key]: value } })),
      resetPrices: () => set({ prices: DEFAULT_PRICES }),
    }),
    {
      name: 'pergola-prices',
      // Seed newly added default price keys for users with older persisted
      // data, while keeping any prices they've edited.
      merge: (persisted, current) => {
        const stored = (persisted as { prices?: Record<string, number> } | undefined)?.prices ?? {}
        return { ...current, prices: { ...DEFAULT_PRICES, ...stored } }
      },
    },
  ),
)
