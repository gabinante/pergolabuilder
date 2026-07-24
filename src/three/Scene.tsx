import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { toScene } from '../engine/units'
import { Ground } from './Ground'
import { HumanFigure } from './HumanFigure'
import { PergolaMeshes } from './PergolaMeshes'
import type { DesignResult } from '../engine/types'

export function Scene({ design }: { design: DesignResult }) {
  const w = toScene(design.meta.postXs[design.meta.postXs.length - 1] * 2 + 48)
  const targetY = toScene(design.meta.postTopY) / 2

  return (
    <Canvas
      shadows="percentage" /* PCFShadowMap — 'soft' is deprecated in current three */
      camera={{ position: [22, 14, 22], fov: 45 }}
      // preserveDrawingBuffer is required or the print snapshot comes back blank
      gl={{ preserveDrawingBuffer: true }}
    >
      <hemisphereLight args={['#e8f0ff', '#5a5343', 0.9]} />
      <directionalLight
        castShadow
        position={[15, 25, 10]}
        intensity={1.6}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-w}
        shadow-camera-right={w}
        shadow-camera-top={w}
        shadow-camera-bottom={-w}
        shadow-camera-far={80}
      />
      <Ground />
      <PergolaMeshes design={design} />
      <HumanFigure
        position={[toScene(design.meta.postXs[0]) - 3, 0, toScene(design.meta.beamZs[1]) + 3]}
      />
      <OrbitControls makeDefault target={[0, targetY, 0]} maxPolarAngle={Math.PI / 2 - 0.02} />
    </Canvas>
  )
}
