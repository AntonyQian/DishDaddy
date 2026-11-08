'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import { pointerState } from '@/lib/gsap';

/**
 * The lighting rig. Soft panels (Lightformers) give glass and glossy skins something to reflect,
 * and one indigo light follows the pointer so every highlight moves as you do.
 */
export function Studio({ accent = '#6067df', follow = true }: { accent?: string; follow?: boolean }) {
  const chase = useRef<THREE.PointLight>(null);
  const target = useRef(new THREE.Vector3());

  useFrame(({ viewport }) => {
    if (!chase.current || !follow) return;
    target.current.set((pointerState.x * viewport.width) / 2, (pointerState.y * viewport.height) / 2, 3.2);
    chase.current.position.lerp(target.current, 0.08);
  });

  return (
    <>
      <ambientLight intensity={0.12} />
      <spotLight position={[4, 8, 5]} angle={0.4} penumbra={1} intensity={120} color="#ffffff" />
      <pointLight ref={chase} color={accent} intensity={70} distance={14} decay={1.6} position={[0, 0, 3]} />
      <pointLight position={[-6, 2, -3]} color="#474dc5" intensity={90} distance={16} decay={1.6} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} position={[0, 6, -6]} scale={[16, 3, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#6067df" position={[-7, 1, 2]} rotation-y={Math.PI / 2} scale={[9, 7, 1]} />
        <Lightformer form="ring" intensity={4} color="#bfc2ff" position={[5, 3, -3]} scale={4.5} />
        <Lightformer form="rect" intensity={2} position={[7, 0, 2]} rotation-y={-Math.PI / 2} scale={[7, 5, 1]} />
        <Lightformer form="circle" intensity={2} color="#ffd9a8" position={[0, -3, 5]} scale={5} />
      </Environment>
    </>
  );
}
