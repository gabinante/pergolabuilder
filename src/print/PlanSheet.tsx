import { DISCLAIMER } from '../engine/rules'
import { formatFeetInches } from '../engine/units'
import { useConfigStore } from '../store/configStore'
import { CutListTable } from '../ui/CutListTable'
import { HardwareTable } from '../ui/HardwareTable'
import { SideViewSVG } from './SideViewSVG'
import { TopViewSVG } from './TopViewSVG'
import type { CostEstimate } from '../engine/cost'
import type { PackResult } from '../engine/cutlist'
import type { HardwareItem } from '../engine/hardware'
import type { CutListItem, DesignResult, PergolaConfig } from '../engine/types'

interface Props {
  design: DesignResult
  config: PergolaConfig
  cutItems: CutListItem[]
  pack: PackResult
  hardware: HardwareItem[]
  estimate: CostEstimate
}

const money = (n: number) => `$${n.toFixed(2)}`

export function PlanSheet({ design, config, cutItems, pack, hardware, estimate }: Props) {
  const snapshot = useConfigStore((s) => s.snapshot)
  const setPrintMode = useConfigStore((s) => s.setPrintMode)

  return (
    <div className="plan-sheet">
      <div className="no-print plan-actions">
        <button onClick={() => window.print()}>Print</button>
        <button onClick={() => setPrintMode(false)}>Back to builder</button>
      </div>

      <h1>Pergola Plan</h1>
      <p className="plan-summary">
        Freestanding pergola — {formatFeetInches(config.width)} wide ×{' '}
        {formatFeetInches(config.depth)} deep × {formatFeetInches(config.height)} clearance ·{' '}
        {design.meta.postCount} 6x6 posts, doubled 2x10 beams, {design.meta.rafterCount}{' '}
        {design.meta.rafterSize} rafters
        {design.meta.slatCount > 0 ? `, ${design.meta.slatCount} 2x4 slats` : ''}
        {design.meta.tiltDrop > 0
          ? ` · ${formatFeetInches(design.meta.tiltDrop)} front tilt (${((design.meta.rafterPitch * 180) / Math.PI).toFixed(1)}° slope)`
          : ''}
        {config.rafterCap !== 'square' ? ` · ${config.rafterCap} rafter tails` : ''} ·
        pressure-treated lumber · posts{' '}
        {config.postAnchor === 'base' ? 'on standoff bases' : 'embedded in concrete'}
      </p>

      {snapshot && <img className="plan-snapshot" src={snapshot} alt="3D rendering" />}

      <div className="plan-diagrams">
        <div>
          <h2>Plan view</h2>
          <TopViewSVG design={design} config={config} />
        </div>
        <div>
          <h2>Elevation</h2>
          <SideViewSVG design={design} config={config} />
        </div>
      </div>

      <h2>Cut list</h2>
      <CutListTable items={cutItems} pack={pack} />

      <h2>Hardware</h2>
      <HardwareTable items={hardware} />

      <h2>Cost estimate</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {estimate.lines.map((l) => (
            <tr key={l.key}>
              <td>{l.label}</td>
              <td>{l.qty}</td>
              <td>{l.unitPrice !== undefined ? money(l.unitPrice) : '—'}</td>
              <td>{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Estimated total</td>
            <td>{money(estimate.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <h2>Notes</h2>
      <ul className="plan-notes">
        <li>
          Beams are doubled 2x10s sandwiching each post, through-bolted with two 1/2" carriage
          bolts per post. Beam tops sit flush with post tops.
        </li>
        <li>
          Knee braces are 4x4s cut at 45° (long point to long point), tucked into the gap between
          the doubled beams and bolted through post and beam.
        </li>
        <li>Rafters sit on top of the beams, fastened with structural screws toe-driven at each crossing.</li>
        {design.meta.biteDepth > 0 && (
          <li>
            Each rafter gets a {formatFeetInches(design.meta.biteDepth)}-deep seat ("bite") notch
            over each beam assembly — {formatFeetInches(design.meta.beamAssemblyWidth)} wide,
            centered {formatFeetInches(config.rafterOverhang)} in from the rafter ends — so the
            rafters lock over the beams.
            {design.meta.tiltDrop > 0
              ? ' Cut the seats level (not square to the board) so the sloped rafters bear flat on the beam tops.'
              : ''}
          </li>
        )}
        {design.meta.tiltDrop > 0 && (
          <li>
            The front post row is cut {formatFeetInches(design.meta.tiltDrop)} shorter than the
            back so the roof plane slopes forward for runoff. Rafter cut lengths already include
            the extra slope length; front clearance is{' '}
            {formatFeetInches(config.height - design.meta.tiltDrop)}.
          </li>
        )}
        {config.rafterCap !== 'square' && (
          <li>
            Rafter tails get a {config.rafterCap === 'chamfer' ? '45° chamfer' : config.rafterCap === 'bullnose' ? 'rounded bullnose' : 'classic cove curve'}{' '}
            cut on both ends — trace the first one and use it as a template for the rest.
          </li>
        )}
        {config.postAnchor === 'embedded' && (
          <li>
            Post cut lengths include {formatFeetInches(design.meta.embedment)} of embedment below
            grade; set on gravel and backfill with concrete.
          </li>
        )}
      </ul>

      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  )
}
