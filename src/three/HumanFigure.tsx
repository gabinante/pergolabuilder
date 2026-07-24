// A 6-ft gray silhouette standing outside a corner, purely for scale.
export function HumanFigure({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.5, 0]}>
        <capsuleGeometry args={[0.55, 3.9, 6, 16]} />
        <meshStandardMaterial color="#8f959c" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 5.6, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#8f959c" roughness={0.9} />
      </mesh>
    </group>
  )
}
