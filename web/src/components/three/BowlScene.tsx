'use client';

import { Float } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

import { pointerState, scrollState } from '@/lib/gsap';
import { MirrorFloor } from './Floor';
import { Bowl, Egg, Lemon, Tomato } from './Foods';
import { SceneFrame } from './SceneFrame';
import { Studio } from './Studio';

const damp = THREE.MathUtils.damp;

/** A steaming bowl with foods drifting around it. Scrolling spins it and tilts the camera. */
function Table() {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const viewport = useThree((st) => st.viewport);
  const fit = Math.min(1, viewport.width / 9);
  const offset = viewport.width > 7 ? viewport.width * 0.2 : 0;
  useFrame((state, dt) => {
    const p = scrollState.hero;
    if (group.current) {
      group.current.position.x = damp(group.current.position.x, offset, 3, dt);
      group.current.scale.setScalar(damp(group.current.scale.x, fit * 0.85, 3, dt));
      group.current.rotation.y = damp(group.current.rotation.y, p * Math.PI * 1.6 + pointerState.x * 0.5, 3, dt);
      group.current.rotation.x = damp(group.current.rotation.x, 0.18 - pointerState.y * 0.18, 3, dt);
    }
    if (ring.current) ring.current.rotation.y += dt * 0.35;
    state.camera.position.y = damp(state.camera.position.y, 1.4 + p * 1.2, 3, dt);
    state.camera.lookAt(0, 0.1, 0);
  });
  return (
    <group ref={group}>
      <Float speed={1.4} floatIntensity={0.5} rotationIntensity={0.1}>
        <Bowl scale={1.15} />
        <group ref={ring}>
          <Egg position={[2.2, 0.8, 0]} scale={0.38} rotation={[0.4, 0, 0.3]} />
          <Tomato position={[-1.9, 1.0, 1.1]} scale={0.34} />
          <Lemon position={[-0.4, 0.6, -2.2]} scale={0.3} />
        </group>
      </Float>
    </group>
  );
}

export default function BowlScene({ className }: { className?: string }) {
  return (
    <SceneFrame className={className}>
      {(visible) => (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 1.4, 8.2], fov: 30 }}
          gl={{ antialias: true, alpha: true }}
          frameloop={visible ? 'always' : 'never'}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
          }}
          style={{ position: 'absolute', inset: 0 }}>
          <Suspense fallback={null}>
            <Studio />
            <Table />
            <MirrorFloor y={-1.3} />
          </Suspense>
        </Canvas>
      )}
    </SceneFrame>
  );
}
