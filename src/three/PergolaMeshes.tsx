import { MemberMesh } from './MemberMesh'
import type { DesignResult } from '../engine/types'

export function PergolaMeshes({ design }: { design: DesignResult }) {
  const { embedment } = design.meta
  return (
    <group>
      {design.members.map((m) => (
        // Embedded posts: cut length includes embedment, but only the
        // above-grade portion is rendered.
        <MemberMesh
          key={m.id}
          member={m}
          renderLength={m.role === 'post' ? m.length - embedment : undefined}
        />
      ))}
    </group>
  )
}
