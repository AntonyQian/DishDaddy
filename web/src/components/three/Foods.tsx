'use client';

import { Sparkles } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

import { noiseBump } from './textures';

type GroupProps = ThreeElements['group'];

/** A solid of revolution from a profile. `shape(t)` gives [radius, height] for t from π (bottom) to 0 (top). */
function lathe(shape: (t: number) => [number, number], steps = 56, segments = 96) {
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const [r, y] = shape(Math.PI * (1 - i / steps));
    return new THREE.Vector2(Math.max(r, 0.0005), y);
  });
  return new THREE.LatheGeometry(pts, segments);
}

export function Egg(props: GroupProps) {
  const geo = useMemo(() => lathe((t) => [Math.sin(t) * (0.78 - 0.17 * Math.cos(t)), Math.cos(t)]), []);
  const bump = useMemo(() => noiseBump(256, 4, 0.8), []);
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#f1e4cf" roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} bumpMap={bump} bumpScale={0.35} sheen={0.6} sheenColor="#fff4e0" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Tomato(props: GroupProps) {
  const geo = useMemo(() => lathe((t) => [Math.sin(t) * 0.96, Math.cos(t) * 0.82 - 0.2 * Math.exp(-Math.pow(t / 0.3, 2))]), []);
  const bump = useMemo(() => noiseBump(256, 3, 0.35), []);
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#d3261b" roughness={0.3} clearcoat={1} clearcoatRoughness={0.08} bumpMap={bump} bumpScale={0.05} sheen={1} sheenColor="#ff6a4a" side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0.66, 0]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[0, (i / 6) * Math.PI * 2, 0.95]} position={[0, 0, 0]} scale={[1, 1, 0.45]}>
            <coneGeometry args={[0.1, 0.62, 12]} />
            <meshStandardMaterial color="#2f7d32" roughness={0.55} />
          </mesh>
        ))}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.3, 12]} />
          <meshStandardMaterial color="#3e7a2a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export function Lemon(props: GroupProps) {
  const geo = useMemo(() => lathe((t) => [Math.sin(t) * 0.82, Math.cos(t) * (1 + 0.16 * Math.pow(Math.abs(Math.cos(t)), 12))]), []);
  const bump = useMemo(() => noiseBump(256, 5, 1), []);
  return (
    <group {...props}>
      <mesh geometry={geo} rotation={[0, 0, Math.PI / 2]}>
        <meshPhysicalMaterial color="#f9d423" roughness={0.5} clearcoat={0.3} clearcoatRoughness={0.35} bumpMap={bump} bumpScale={0.9} sheen={0.8} sheenColor="#fff7a8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** A glossy black ceramic bowl of soup, with steam that drifts up and catches the light. */
export function Bowl({ steam = 1, soup = '#c46a22', ...props }: GroupProps & { steam?: number; soup?: string }) {
  const geo = useMemo(() => {
    const pts: [number, number][] = [
      [0.0, -0.62], [0.52, -0.62], [0.58, -0.56], [0.95, -0.15], [1.3, 0.38], [1.36, 0.46], [1.34, 0.52], [1.28, 0.52],
      [1.22, 0.47], [0.86, -0.02], [0.44, -0.44], [0.0, -0.48],
    ];
    return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 128);
  }, []);
  const soupBump = useMemo(() => noiseBump(128, 2, 0.6), []);
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#0a0a12" metalness={0.25} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} reflectivity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.12, 64]} />
        <meshPhysicalMaterial color={soup} emissive={soup} emissiveIntensity={0.22} roughness={0.28} clearcoat={0.8} bumpMap={soupBump} bumpScale={0.25} />
      </mesh>
      <Sparkles count={Math.round(44 * steam)} scale={[1.6, 2.4, 1.6]} position={[0, 1.3, 0]} size={7 * steam + 2} speed={0.35} opacity={0.55} color="#d9dbff" noise={[0.4, 1, 0.4]} />
    </group>
  );
}
