import { useEffect, useMemo } from 'react'
import { costEstimate } from './engine/cost'
import { KERF, aggregateCuts, packBoards } from './engine/cutlist'
import { designPergola } from './engine/design'
import { hardwareList } from './engine/hardware'
import { DISCLAIMER } from './engine/rules'
import { PlanSheet } from './print/PlanSheet'
import { useConfigStore } from './store/configStore'
import { usePriceStore } from './store/priceStore'
import { Scene } from './three/Scene'
import { CostTable } from './ui/CostTable'
import { CutListTable } from './ui/CutListTable'
import { HardwareTable } from './ui/HardwareTable'
import { InputsPanel } from './ui/InputsPanel'
import { ShareButton } from './ui/ShareButton'
import { Tabs } from './ui/Tabs'
import { Warnings } from './ui/Warnings'
import { syncUrl } from './urlConfig'
import './styles.css'

export default function App() {
  const config = useConfigStore((s) => s.config)
  const printMode = useConfigStore((s) => s.printMode)
  const setPrintMode = useConfigStore((s) => s.setPrintMode)
  const prices = usePriceStore((s) => s.prices)

  const design = useMemo(() => designPergola(config), [config])
  const cutItems = useMemo(() => aggregateCuts(design.members), [design])
  const pack = useMemo(
    () => packBoards(cutItems, KERF, config.maxStockLength),
    [cutItems, config.maxStockLength],
  )
  const hardware = useMemo(() => hardwareList(design, config), [design, config])
  const estimate = useMemo(
    () => costEstimate(pack.purchases, hardware, prices),
    [pack, hardware, prices],
  )

  // Mirror the config into the address bar (debounced: sliders fire every
  // drag tick and Safari rate-limits replaceState).
  useEffect(() => {
    const timer = setTimeout(() => syncUrl(config), 200)
    return () => clearTimeout(timer)
  }, [config])

  if (printMode) {
    return (
      <PlanSheet
        design={design}
        config={config}
        cutItems={cutItems}
        pack={pack}
        hardware={hardware}
        estimate={estimate}
      />
    )
  }

  const openPlanSheet = () => {
    // Grab the r3f canvas from the DOM at click time — sturdier than a ref
    // captured in onCreated (which HMR can orphan in dev).
    const canvas = document.querySelector<HTMLCanvasElement>('.viewport canvas')
    setPrintMode(true, canvas?.toDataURL('image/png') ?? null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Pergola Builder</h1>
        <div className="topbar-actions">
          <ShareButton />
          <button className="primary" onClick={openPlanSheet}>
            Plan sheet / print
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <InputsPanel design={design} />
      </aside>

      <main className="viewport">
        <Warnings warnings={[...design.warnings, ...pack.warnings]} />
        <Scene design={design} />
      </main>

      <section className="bottom">
        <Tabs
          tabs={[
            { label: 'Cut list', content: <CutListTable items={cutItems} pack={pack} /> },
            { label: 'Cost', content: <CostTable estimate={estimate} cutItems={cutItems} /> },
            { label: 'Hardware', content: <HardwareTable items={hardware} /> },
          ]}
        />
      </section>

      <footer className="disclaimer-bar">{DISCLAIMER}</footer>
    </div>
  )
}
