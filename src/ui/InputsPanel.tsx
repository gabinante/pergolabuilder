import { ftToIn, inToFt, formatFeetInches, formatInches } from '../engine/units'
import { useConfigStore } from '../store/configStore'
import { NumberField } from './NumberField'
import type { DesignResult, PergolaConfig } from '../engine/types'

export function InputsPanel({ design }: { design: DesignResult }) {
  const config = useConfigStore((s) => s.config)
  const setConfig = useConfigStore((s) => s.setConfig)

  return (
    <div className="inputs-panel">
      <h2>Dimensions</h2>
      <NumberField
        label="Width"
        unit="ft"
        min={6}
        max={40}
        value={inToFt(config.width)}
        onChange={(ft) => setConfig({ width: ftToIn(ft) })}
      />
      <NumberField
        label="Depth"
        unit="ft"
        min={6}
        max={20}
        value={inToFt(config.depth)}
        onChange={(ft) => setConfig({ depth: ftToIn(ft) })}
      />
      <NumberField
        label="Height (clearance)"
        unit="ft"
        min={7}
        max={12}
        step={0.25}
        value={inToFt(config.height)}
        onChange={(ft) => setConfig({ height: ftToIn(ft) })}
      />
      <NumberField
        label="Tilt (front drop)"
        unit="in"
        min={0}
        max={36}
        step={1}
        value={config.tiltDrop}
        onChange={(v) => setConfig({ tiltDrop: v })}
      />
      {design.meta.tiltDrop > 0 && (
        <p className="hint">
          Front clearance: {formatFeetInches(config.height - design.meta.tiltDrop)} · slope{' '}
          {((design.meta.rafterPitch * 180) / Math.PI).toFixed(1)}°
        </p>
      )}

      <h2>Options</h2>
      <label className="field">
        <span className="field-label">Rafter size</span>
        <select
          className="field-select"
          value={config.rafterSize}
          onChange={(e) => setConfig({ rafterSize: e.target.value as PergolaConfig['rafterSize'] })}
        >
          <option value="auto">Auto — using {design.meta.rafterSize}</option>
          <option value="2x4">2x4</option>
          <option value="2x6">2x6</option>
          <option value="2x8">2x8</option>
          <option value="2x10">2x10</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Longest board (transport limit)</span>
        <select
          className="field-select"
          value={config.maxStockLength}
          onChange={(e) => setConfig({ maxStockLength: Number(e.target.value) })}
        >
          <option value={96}>8 ft</option>
          <option value={120}>10 ft</option>
          <option value={144}>12 ft</option>
          <option value={192}>16 ft</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Rafter tails</span>
        <select
          className="field-select"
          value={config.rafterCap}
          onChange={(e) => setConfig({ rafterCap: e.target.value as PergolaConfig['rafterCap'] })}
        >
          <option value="square">Square</option>
          <option value="chamfer">Chamfered</option>
          <option value="bullnose">Bullnose (rounded)</option>
          <option value="cove">Cove (classic curve)</option>
        </select>
      </label>
      <NumberField
        label="Rafter spacing"
        unit="in o.c."
        min={12}
        max={24}
        step={1}
        value={config.rafterSpacing}
        onChange={(v) => setConfig({ rafterSpacing: v })}
      />
      <p className="hint">Actual: {formatInches(design.meta.actualRafterSpacing)} o.c.</p>
      <NumberField
        label="Beam overhang"
        unit="in"
        min={6}
        max={18}
        step={1}
        value={config.beamOverhang}
        onChange={(v) => setConfig({ beamOverhang: v })}
      />
      <NumberField
        label="Rafter overhang"
        unit="in"
        min={6}
        max={18}
        step={1}
        value={config.rafterOverhang}
        onChange={(v) => setConfig({ rafterOverhang: v })}
      />

      <label className="check">
        <input
          type="checkbox"
          checked={config.rafterBite}
          onChange={(e) => setConfig({ rafterBite: e.target.checked })}
        />
        <span>Notch rafters over beams (1-1/2" bite)</span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={config.slats}
          onChange={(e) => setConfig({ slats: e.target.checked })}
        />
        <span>Top slats (2x4)</span>
      </label>
      {config.slats && (
        <>
          <NumberField
            label="Slat spacing"
            unit="in o.c."
            min={6}
            max={24}
            step={1}
            value={config.slatSpacing}
            onChange={(v) => setConfig({ slatSpacing: v })}
          />
          <p className="hint">Actual: {formatInches(design.meta.actualSlatSpacing)} o.c.</p>
        </>
      )}

      <h2>Posts</h2>
      <label className="check">
        <input
          type="radio"
          name="postAnchor"
          checked={config.postAnchor === 'base'}
          onChange={() => setConfig({ postAnchor: 'base' })}
        />
        <span>Standoff bases on footings</span>
      </label>
      <label className="check">
        <input
          type="radio"
          name="postAnchor"
          checked={config.postAnchor === 'embedded'}
          onChange={() => setConfig({ postAnchor: 'embedded' })}
        />
        <span>Embedded in concrete</span>
      </label>
      {config.postAnchor === 'embedded' && (
        <p className="hint">Embedment: {formatInches(design.meta.embedment)} below grade</p>
      )}

      <div className="summary">
        <h2>Structure</h2>
        <p>
          {design.meta.postCount} posts (6x6) · {design.meta.rafterCount} rafters (
          {design.meta.rafterSize})
          {design.meta.slatCount > 0 ? ` · ${design.meta.slatCount} slats` : ''} ·{' '}
          {design.meta.braceCount} braces
        </p>
      </div>
    </div>
  )
}
