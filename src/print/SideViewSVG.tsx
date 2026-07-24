import { LUMBER } from '../engine/lumber'
import { formatFeetInches } from '../engine/units'
import type { DesignResult, PergolaConfig } from '../engine/types'

const MARGIN = 42

/** Elevation looking along Z: the front (low, when tilted) row is drawn solid,
 * with the taller back row ghosted behind it. */
export function SideViewSVG({ design, config }: { design: DesignResult; config: PergolaConfig }) {
  const { width, height } = config
  const { postXs, postTopY, totalHeight, rafterSize, tiltDrop, biteDepth } = design.meta
  const post = LUMBER['6x6']
  const beam = LUMBER['2x10']
  const rafter = LUMBER[rafterSize]
  const postTopFront = postTopY - tiltDrop
  const heightFront = height - tiltDrop

  const viewW = width + 2 * MARGIN
  const viewH = totalHeight + MARGIN + 14
  const x = (ex: number) => ex + viewW / 2
  // engine Y up → SVG y down, grade at the bottom margin line
  const y = (ey: number) => viewH - 14 - ey

  const rafters = design.members.filter((m) => m.role === 'rafter')
  const braces = design.members.filter((m) => m.role === 'brace' && m.position[2] > 0)

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className="diagram" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#333" />
        </marker>
      </defs>

      {/* grade line */}
      <line x1={4} y1={y(0)} x2={viewW - 4} y2={y(0)} stroke="#555" strokeWidth="1" />

      {/* back row ghosted behind when the pergola is tilted */}
      {tiltDrop > 0 && (
        <g opacity="0.35">
          {postXs.map((px) => (
            <rect
              key={px}
              x={x(px - post.thickness / 2)}
              y={y(postTopY)}
              width={post.thickness}
              height={postTopY}
              fill="#7a5f41"
            />
          ))}
          <rect
            x={x(-width / 2)}
            y={y(postTopY)}
            width={width}
            height={beam.depth}
            fill="#b99b6f"
          />
        </g>
      )}

      {/* posts (front row) */}
      {postXs.map((px) => (
        <rect
          key={px}
          x={x(px - post.thickness / 2)}
          y={y(postTopFront)}
          width={post.thickness}
          height={postTopFront}
          fill="#7a5f41"
          stroke="#3f3222"
          strokeWidth="0.75"
        />
      ))}

      {/* braces on the near beam line */}
      {braces.map((b) => {
        const dir = b.rotation[2] > 0 ? 1 : -1
        const px = b.position[0] - (dir * 24) / 2
        return (
          <line
            key={b.id}
            x1={x(px)}
            y1={y(heightFront - 24)}
            x2={x(px + dir * 24)}
            y2={y(heightFront)}
            stroke="#7a5f41"
            strokeWidth={post.thickness}
            opacity="0.85"
          />
        )
      })}

      {/* beam (front board of the doubled pair) */}
      <rect
        x={x(-width / 2)}
        y={y(postTopFront)}
        width={width}
        height={beam.depth}
        fill="#b99b6f"
        stroke="#6b5a42"
        strokeWidth="0.75"
      />

      {/* rafter ends above the beam (dropped by the seat notch when notched) */}
      {rafters.map((r) => (
        <rect
          key={r.id}
          x={x(r.position[0] - rafter.thickness / 2)}
          y={y(postTopFront - biteDepth + rafter.depth)}
          width={rafter.thickness}
          height={rafter.depth}
          fill="#d9c7a8"
          stroke="#8a7a5f"
          strokeWidth="0.5"
        />
      ))}

      {/* clearance dimension (front / low side) */}
      <g stroke="#333" strokeWidth="0.75" fill="none">
        <line x1={x(width / 2) + 14} y1={y(0)} x2={x(width / 2) + 14} y2={y(heightFront)} markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />
      </g>
      <text
        x={x(width / 2) + 22}
        y={y(heightFront / 2)}
        textAnchor="middle"
        fontSize="9"
        fill="#333"
        transform={`rotate(90 ${x(width / 2) + 22} ${y(heightFront / 2)})`}
      >
        clearance {tiltDrop > 0 ? 'front ' : ''}{formatFeetInches(heightFront)}
        {tiltDrop > 0 ? ` / back ${formatFeetInches(height)}` : ''}
      </text>

      {/* total height dimension */}
      <g stroke="#333" strokeWidth="0.75" fill="none">
        <line x1={x(-width / 2) - 14} y1={y(0)} x2={x(-width / 2) - 14} y2={y(totalHeight)} markerStart="url(#arrow2)" markerEnd="url(#arrow2)" />
      </g>
      <text
        x={x(-width / 2) - 20}
        y={y(totalHeight / 2)}
        textAnchor="middle"
        fontSize="9"
        fill="#333"
        transform={`rotate(-90 ${x(-width / 2) - 20} ${y(totalHeight / 2)})`}
      >
        overall {formatFeetInches(totalHeight)}
      </text>
    </svg>
  )
}
