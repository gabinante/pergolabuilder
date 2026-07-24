import { create } from 'zustand'
import { DEFAULT_CONFIG } from '../engine/design'
import type { PergolaConfig } from '../engine/types'

interface ConfigState {
  config: PergolaConfig
  printMode: boolean
  /** PNG data URL of the 3D view, captured when entering print mode. */
  snapshot: string | null
  setConfig: (patch: Partial<PergolaConfig>) => void
  setPrintMode: (on: boolean, snapshot?: string | null) => void
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  printMode: false,
  snapshot: null,
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setPrintMode: (on, snapshot = null) => set({ printMode: on, snapshot }),
}))
