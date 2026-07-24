import { Grid } from '@react-three/drei'

export function Ground() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#9baa8d" roughness={1} />
      </mesh>
      {/* 1 scene unit = 1 ft, so the grid doubles as a 1-ft scale cue */}
      <Grid
        position={[0, 0.002, 0]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#7d8c70"
        sectionSize={4}
        sectionThickness={0.8}
        sectionColor="#6b7a5f"
        fadeDistance={60}
        followCamera={false}
      />
    </group>
  )
}
