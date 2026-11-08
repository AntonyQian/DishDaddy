'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

import { scrollState } from '@/lib/gsap';
import { MirrorFloor } from './Floor';
import { Bowl, Egg, Lemon, Tomato } from './Foods';
import { SceneFrame } from './SceneFrame';
import { Studio } from './Studio';

const damp = THREE.MathUtils.damp;
// The light shifts colour as the recipe progresses: cool indigo, soft violet, gold, ember, back to indigo.
const MOOD = ['#6067df', '#bfc2ff', '#fccf5a', '#ff7a59', '#6067df'].map((c) => new THREE.Color(c));

/** The cook scene. Scroll progress orbits the camera round the bowl, warms the light and draws the ingredients in. */
function Stove() {
  const bowl = useRef<THREE.Group>(null);
  const items = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const tmp = useRef(new THREE.Color());

  useFrame((state, dt) => {
    const p = scrollState.cook;
    const angle = -0.5 + p * 1.1;
    state.camera.position.x = damp(state.camera.position.x, Math.sin(angle) * 7.4, 3, dt);
    state.camera.position.z = damp(state.camera.position.z, Math.cos(angle) * 7.4, 3, dt);
    state.camera.position.y = damp(state.camera.position.y, 1.5 + Math.sin(p * Math.PI) * 0.8, 3, dt);
    state.camera.lookAt(0, 0.2, 0);
    if (bowl.current) bowl.current.rotation.y = p * Math.PI * 1.2;
    if (items.current) {
      items.current.rotation.y = p * Math.PI * 2.4 + state.clock.elapsedTime * 0.15;
      items.current.children.forEach((c, i) => {
        const pull = THREE.MathUtils.smoothstep(p, 0.15 * i, 0.55 + 0.15 * i);
        c.position.y = 1.3 + Math.sin(state.clock.elapsedTime * 0.8 + i * 2) * 0.12 - pull * 0.9;
        c.scale.setScalar(THREE.MathUtils.lerp(1, 0.001, pull));
      });
    }
    if (light.current) {
      const f = p * (MOOD.length - 1);
      const i = Math.min(MOOD.length - 2, Math.floor(f));
      tmp.current.lerpColors(MOOD[i], MOOD[i + 1], f - i);
      light.current.color.lerp(tmp.current, 0.1);
    }
  });

  return (
    <>
      <pointLight ref={light} position={[1.5, 2.4, 2.8]} intensity={130} distance={12} decay={1.5} color="#6067df" />
      <group ref={bowl}>
        <Bowl scale={1.45} steam={1.3} />
      </group>
      <group ref={items}>
        <Egg position={[3.1, 1.3, 0]} scale={0.26} />
        <Tomato position={[-1.55, 1.3, 2.7]} scale={0.23} />
        <Lemon position={[-1.55, 1.3, -2.7]} scale={0.21} />
      </group>
    </>
  );
}

export default function CookScene({ className }: { className?: string }) {
  return (
    <SceneFrame className={className}>
      {(visible) => (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [-3.5, 1.5, 6.5], fov: 32 }}
          gl={{ antialias: true, alpha: true }}
          frameloop={visible ? 'always' : 'never'}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }}
          style={{ position: 'absolute', inset: 0 }}>
          <Suspense fallback={null}>
            <Studio follow={false} />
            <Stove />
            <MirrorFloor y={-0.95} />
          </Suspense>
        </Canvas>
      )}
    </SceneFrame>
  );
}
