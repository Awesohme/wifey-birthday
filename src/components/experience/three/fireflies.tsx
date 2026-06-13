"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/** Drifting, blinking gold particles around the meadow + canopy */
export function Fireflies({ count = 110 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 8.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.3 + Math.random() * 5.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.2 + Math.random() * 0.5;
      seeds[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const geo = points.current?.geometry;
    if (geo) {
      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += Math.sin(t * seeds[i * 3 + 1] + seeds[i * 3]) * 0.0035;
        pos[i * 3 + 1] += Math.cos(t * seeds[i * 3 + 1] * 0.8 + seeds[i * 3 + 2]) * 0.002;
        pos[i * 3 + 2] += Math.cos(t * seeds[i * 3 + 1] + seeds[i * 3]) * 0.0035;
      }
      geo.attributes.position.needsUpdate = true;
    }
    if (material.current) {
      material.current.opacity = 0.55 + Math.sin(t * 1.7) * 0.3;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        color="#ecd28a"
        size={0.07}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
