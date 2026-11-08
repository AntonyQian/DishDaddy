'use client';

import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

import { pointerState, scrollState } from '@/lib/gsap';
import { Egg, Lemon, Tomato } from './Foods';
import { MirrorFloor } from './Floor';
import { SceneFrame } from './SceneFrame';
import { Studio } from './Studio';

const damp = THREE.MathUtils.damp;

/** The glass pantry: a transmissive orb holding three foods that orbit inside it. Scrolling turns it, lifts it and spreads the foods apart. */
function Pantry() {
  const group = useRef<THREE.Group>(null);
  const pivots = useRef<(THREE.Group | null)[]>([]);
  const radii = [0.78, 0.62, 0.7];
  const viewport = useThree((st) => st.viewport);
  // Wide screens: the orb sits to the right of the headline. Narrow ones: smaller and centred.
  const fit = Math.min(1, viewport.width / 8);
  const offset = viewport.width > 7 ? viewport.width * 0.17 : 0;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = scrollState.hero;
    g.rotation.y = damp(g.rotation.y, p * Math.PI * 1.4 + pointerState.x * 0.5, 3, dt);
    g.rotation.x = damp(g.rotation.x, -pointerState.y * 0.22, 3, dt);
    g.position.x = damp(g.position.x, offset, 3, dt);
    g.position.y = damp(g.position.y, -p * 1.2, 3, dt);
    g.scale.setScalar(damp(g.scale.x, fit * (1 + p * 0.22), 3, dt));
    state.camera.position.z = damp(state.camera.position.z, 8.6 - p * 2.4, 3, dt);
    pivots.current.forEach((pv, i) => {
      if (!pv) return;
      pv.rotation.y += dt * (0.45 + i * 0.18);
      pv.rotation.z = Math.sin(state.clock.elapsedTime * 0.6 + i) * 0.35;
      pv.children[0].position.x = radii[i] * (1 + p * 1.5);
    });
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.7}>
        <mesh>
          <sphereGeometry args={[1.62, 96, 96]} />
          <MeshTransmissionMaterial
            samples={8}
            resolution={768}
            thickness={0.6}
            roughness={0}
            chromaticAberration={0.035}
            anisotropicBlur={0.06}
            distortion={0.05}
            distortionScale={0.25}
            temporalDistortion={0.02}
            ior={1.42}
            backside
            backsideThickness={0.5}
            color="#e8e9ff"
          />
        </mesh>
        <group ref={(el) => void (pivots.current[0] = el)}>
          <Egg position={[radii[0], 0.05, 0]} scale={0.52} rotation={[0.3, 0, 0.5]} />
        </group>
        <group ref={(el) => void (pivots.current[1] = el)} rotation={[0, 2.1, 0]}>
          <Tomato position={[radii[1], -0.15, 0]} scale={0.42} />
        </group>
        <group ref={(el) => void (pivots.current[2] = el)} rotation={[0, 4.2, 0]}>
          <Lemon position={[radii[2], 0.2, 0]} scale={0.4} />
        </group>
      </Float>
    </group>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  return (
    <SceneFrame className={className}>
      {(visible) => (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.5, 8.6], fov: 30 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          frameloop={visible ? 'always' : 'never'}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }}
          style={{ position: 'absolute', inset: 0 }}>
          <Suspense fallback={null}>
            <Studio />
            <Pantry />
            <MirrorFloor y={-2.35} />
          </Suspense>
        </Canvas>
      )}
    </SceneFrame>
  );
}
