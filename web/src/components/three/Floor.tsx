'use client';

import { MeshReflectorMaterial } from '@react-three/drei';

/** A dark polished floor that mirrors whatever stands on it, blurred with distance. */
export function MirrorFloor({ y = -2.1 }: { y?: number }) {
  return (
    <>
      {/* fog the colour of the page, so the floor fades into the black instead of ending in a line */}
      <fog attach="fog" args={['#050507', 9, 24]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        blur={[320, 90]}
        resolution={512}
        mixBlur={1}
        mixStrength={9}
        mixContrast={1.1}
        mirror={0.5}
        roughness={1}
        depthScale={1.3}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.5}
        color="#030306"
        metalness={0.6}
      />
    </mesh>
    </>
  );
}
