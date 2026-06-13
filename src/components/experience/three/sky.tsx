"use client";

import * as THREE from "three";
import { useMemo } from "react";

/** Gradient sky dome + soft sun, matching the old SVG palette */
export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color("#8ec3ec") },
          mid: { value: new THREE.Color("#cde7f5") },
          bottom: { value: new THREE.Color("#f6f3d8") },
        },
        vertexShader: /* glsl */ `
          varying float vY;
          void main() {
            vY = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
          varying float vY;
          void main() {
            float t = clamp(vY, -0.1, 1.0);
            vec3 c = t > 0.25 ? mix(mid, top, (t - 0.25) / 0.75) : mix(bottom, mid, (t + 0.1) / 0.35);
            gl_FragColor = vec4(c, 1.0);
          }
        `,
      }),
    []
  );

  return (
    <group>
      <mesh material={material} scale={70} renderOrder={-2}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {/* Sun — emissive disc that feeds the bloom pass */}
      <mesh position={[16, 14, -30]}>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshBasicMaterial color="#fff7d6" toneMapped={false} />
      </mesh>
    </group>
  );
}
