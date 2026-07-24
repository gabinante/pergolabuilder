import { LUMBER } from '../engine/lumber'
import { formatFeetInches } from '../engine/units'
import type { DesignResult, PergolaConfig } from '../engine/types'

const MARGIN = 30 // inches of drawing space reserved around the footprint for dimensions

export function TopViewSVG({ design, config }: { design: DesignResult; config: PergolaConfig }) {
  const { width, depth } = config
  const { postXs, beamZs } = design.meta
  const post = LUMBER['6x6']
  const beam = LUMBER['2x10']

  const viewW = width + 2 * MARGIN
  const viewH = depth + 2 * MARGIN
  // SVG y grows downward; engine Z maps straight onto it (plan view, symmetric)
  const x = (ex: number) => ex + viewW / 2
  const y = (ez: number) => ez + viewH / 2

  const rafters = design.members.filter((m) => m.role === 'rafter')
  const slats = design.members.filter((m) => m.role === 'slat')

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      className="diagram"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#333" />
        </marker>
      </defs>

      {/* slats (lightest, underneath everything in plan) */}
      {slats.map((s) => (
        <rect
          key={s.id}
          x={x(-s.length / 2)}
          y={y(s.position[2] - LUMBER['2x4'].depth / 2)}
          width={s.length}
          height={LUMBER['2x4'].depth}
          fill="#e8dcc8"
          stroke="#c9b89a"
          strokeWidth="0.4"
        />
      ))}

      {/* rafters run along Z */}
      {rafters.map((r) => (
        <rect
          key={r.id}
          x={x(r.position[0] - LUMBER[r.size].thickness / 2)}
          y={y(-r.length / 2)}
          width={LUMBER[r.size].thickness}
          height={r.length}
          fill="#d9c7a8"
          stroke="#8a7a5f"
          strokeWidth="0.5"
        />
      ))}

      {/* doubled beams run along X */}
      {beamZs.map((bz) =>
        [-1, 1].map((side) => (
          <rect
            key={`${bz}-${side}`}
            x={x(-width / 2)}
            y={y(bz + side * (post.thickness / 2 + beam.thickness / 2) - beam.thickness / 2)}
            width={width}
            height={beam.thickness}
            fill="#b99b6f"
            stroke="#6b5a42"
            strokeWidth="0.5"
          />
        )),
      )}

      {/* posts */}
      {beamZs.map((bz) =>
        postXs.map((px) => (
          <rect
            key={`${bz}-${px}`}
            x={x(px - post.thickness / 2)}
            y={y(bz - post.thickness / 2)}
            width={post.thickness}
            height={post.thickness}
            fill="#7a5f41"
            stroke="#3f3222"
            strokeWidth="0.75"
          />
        )),
      )}

      {/* width dimension (top) */}
      <g stroke="#333" strokeWidth="0.75" fill="none">
        <line x1={x(-width / 2)} y1={y(-depth / 2) - 14} x2={x(width / 2)} y2={y(-depth / 2) - 14} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1={x(-width / 2)} y1={y(-depth / 2) - 20} x2={x(-width / 2)} y2={y(-depth / 2) - 4} />
        <line x1={x(width / 2)} y1={y(-depth / 2) - 20} x2={x(width / 2)} y2={y(-depth / 2) - 4} />
      </g>
      <text x={x(0)} y={y(-depth / 2) - 18} textAnchor="middle" fontSize="9" fill="#333">
        {formatFeetInches(width)}
      </text>

      {/* depth dimension (left) */}
      <g stroke="#333" strokeWidth="0.75" fill="none">
        <line x1={x(-width / 2) - 14} y1={y(-depth / 2)} x2={x(-width / 2) - 14} y2={y(depth / 2)} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1={x(-width / 2) - 20} y1={y(-depth / 2)} x2={x(-width / 2) - 4} y2={y(-depth / 2)} />
        <line x1={x(-width / 2) - 20} y1={y(depth / 2)} x2={x(-width / 2) - 4} y2={y(depth / 2)} />
      </g>
      <text
        x={x(-width / 2) - 18}
        y={y(0)}
        textAnchor="middle"
        fontSize="9"
        fill="#333"
        transform={`rotate(-90 ${x(-width / 2) - 18} ${y(0)})`}
      >
        {formatFeetInches(depth)}
      </text>

      {/* post spacing dimension (bottom) */}
      <g stroke="#333" strokeWidth="0.75" fill="none">
        <line x1={x(postXs[0])} y1={y(depth / 2) + 14} x2={x(postXs[postXs.length - 1])} y2={y(depth / 2) + 14} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        {postXs.map((px) => (
          <line key={px} x1={x(px)} y1={y(beamZs[1])} x2={x(px)} y2={y(depth / 2) + 18} strokeDasharray="2,2" strokeWidth="0.4" />
        ))}
      </g>
      <text x={x(0)} y={y(depth / 2) + 24} textAnchor="middle" fontSize="9" fill="#333">
        posts {formatFeetInches(postXs[postXs.length - 1] - postXs[0])} apart (center to center)
      </text>
    </svg>
  )
}
