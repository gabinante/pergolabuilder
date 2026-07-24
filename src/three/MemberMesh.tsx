import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, MeshStandardMaterial, Shape } from 'three'
import { LUMBER } from '../engine/lumber'
import { toScene } from '../engine/units'
import type { Member, MemberRole, RafterCap } from '../engine/types'

// One shared material per role — wood tones, slightly varied so the structure reads.
const MATERIALS: Record<MemberRole, MeshStandardMaterial> = {
  post: new MeshStandardMaterial({ color: '#8a6a48', roughness: 0.85 }),
  beam: new MeshStandardMaterial({ color: '#9c7a52', roughness: 0.85 }),
  rafter: new MeshStandardMaterial({ color: '#a8875e', roughness: 0.85 }),
  slat: new MeshStandardMaterial({ color: '#b5946a', roughness: 0.85 }),
  brace: new MeshStandardMaterial({ color: '#8a6a48', roughness: 0.85 }),
}

/**
 * Side profile of a board in scene units, centered at the origin (length along
 * X, depth along Y), with decorative tail cuts on both ends and optional
 * seat-notch cutouts along the bottom edge.
 */
function boardProfile(
  length: number,
  depth: number,
  cap: RafterCap,
  notches: [number, number][][],
): Shape {
  const hl = length / 2
  const hd = depth / 2
  // size of the end treatment, and where the flat bottom edge starts/ends
  const c = cap === 'chamfer' ? depth * 0.5 : cap === 'bullnose' ? depth * 0.5 : cap === 'cove' ? depth * 0.6 : 0
  const bottomStart = -hl + c
  const bottomEnd = hl - c

  const s = new Shape()
  s.moveTo(bottomStart, -hd)

  // bottom edge left → right, detouring up into each notch
  for (const notch of notches) {
    // keep notches inside the flat run so they can't collide with the end cuts
    const pts = notch.map(([x, y]) => [Math.min(Math.max(x, bottomStart), bottomEnd), y] as const)
    if (pts[0][0] >= pts[pts.length - 1][0]) continue
    for (const [x, y] of pts) s.lineTo(x, y)
  }
  s.lineTo(bottomEnd, -hd)

  // right end, up to the top
  if (cap === 'chamfer') {
    s.lineTo(hl, -hd + c)
  } else if (cap === 'bullnose') {
    s.absarc(hl - c, -hd + c, c, -Math.PI / 2, 0, false)
  } else if (cap === 'cove') {
    s.absarc(hl, -hd, c, Math.PI, Math.PI / 2, true)
  }
  s.lineTo(hl, hd)

  // top edge, then left end back down to the start
  s.lineTo(-hl, hd)
  if (cap === 'chamfer') {
    s.lineTo(-hl, -hd + c)
  } else if (cap === 'bullnose') {
    s.lineTo(-hl, -hd + c)
    s.absarc(-hl + c, -hd + c, c, Math.PI, Math.PI * 1.5, false)
  } else if (cap === 'cove') {
    s.lineTo(-hl, -hd + c)
    s.absarc(-hl, -hd, c, Math.PI / 2, 0, true)
  }
  s.closePath()
  return s
}

export function MemberMesh({ member, renderLength }: { member: Member; renderLength?: number }) {
  const spec = LUMBER[member.size]
  const length = toScene(renderLength ?? member.length)
  const depth = toScene(spec.depth)
  const thickness = toScene(spec.thickness)
  const cap = member.cap ?? 'square'
  const notches = member.notches
  const needsProfile = cap !== 'square' || (notches?.length ?? 0) > 0

  const geometry = useMemo(() => {
    if (!needsProfile) return null
    const sceneNotches = (notches ?? []).map((n) =>
      n.map(([x, y]) => [toScene(x), toScene(y)] as [number, number]),
    )
    const geo = new ExtrudeGeometry(boardProfile(length, depth, cap, sceneNotches), {
      depth: thickness,
      bevelEnabled: false,
    })
    geo.translate(0, 0, -thickness / 2)
    return geo
  }, [needsProfile, notches, cap, length, depth, thickness])

  useEffect(() => () => geometry?.dispose(), [geometry])

  return (
    <mesh
      castShadow
      receiveShadow
      position={[toScene(member.position[0]), toScene(member.position[1]), toScene(member.position[2])]}
      rotation={member.rotation}
      material={MATERIALS[member.role]}
      geometry={geometry ?? undefined}
    >
      {!geometry && <boxGeometry args={[length, depth, thickness]} />}
    </mesh>
  )
}
