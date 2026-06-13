"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/** Deterministic pseudo-random in [0,1) — keeps the scatter stable across renders */
function prand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const PETAL_COLORS = ["#f48fb1", "#ffffff", "#ffd54f", "#9575cd", "#ef6c61", "#fb7fc7"].map(
  (c) => new THREE.Color(c)
);

/**
 * Dense flower carpet across the whole meadow — one InstancedMesh
 * (single draw call) of small blossom heads in mixed pastel colors.
 */
function FlowerCarpet({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = prand(i, 1) * Math.PI * 2;
      // Bias density toward the camera-facing meadow, thin out with distance
      const radius = 1.3 + Math.pow(prand(i, 2), 0.7) * 14;
      dummy.position.set(Math.cos(angle) * radius, 0.05 + prand(i, 3) * 0.08, Math.sin(angle) * radius);
      const s = 0.55 + prand(i, 4) * 0.9;
      dummy.scale.set(s, s * 0.7, s);
      dummy.rotation.y = prand(i, 5) * Math.PI;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, PETAL_COLORS[Math.floor(prand(i, 6) * PETAL_COLORS.length)]);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.07, 6, 5]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
}

/** Deterministic pseudo-random scatter, mirrors the old SVG Flowers() formula */
function scatter(count: number, seedA: number, seedB: number, rMin: number, rMax: number) {
  const spots: [number, number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = ((i * seedA) % 360) * (Math.PI / 180);
    const radius = rMin + ((i * seedB) % 100) / 100 * (rMax - rMin);
    const s = 0.7 + ((i * 31) % 10) / 14;
    spots.push([Math.cos(angle) * radius, Math.sin(angle) * radius, s, ((i * 53) % 360) * (Math.PI / 180)]);
  }
  return spots;
}

function normalized(scene: THREE.Object3D, targetHeight: number) {
  const clone = scene.clone(true);
  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const scale = targetHeight / size.y;
  clone.scale.setScalar(scale);
  const scaled = new THREE.Box3().setFromObject(clone);
  const center = scaled.getCenter(new THREE.Vector3());
  clone.position.set(-center.x, -scaled.min.y, -center.z);
  const group = new THREE.Group();
  group.add(clone);
  return group;
}

function Flora({ url, height, spots }: { url: string; height: number; spots: [number, number, number, number][] }) {
  const { scene } = useGLTF(url, "/draco/");
  const base = useMemo(() => normalized(scene, height), [scene, height]);
  const clones = useMemo(
    () =>
      spots.map(([x, z, s, rot], i) => {
        const c = base.clone(true);
        c.position.set(x, 0, z);
        c.scale.setScalar(s);
        c.rotation.y = rot;
        return <primitive key={i} object={c} />;
      }),
    [base, spots]
  );
  return <>{clones}</>;
}

export function Meadow({ lowQuality }: { lowQuality: boolean }) {
  const daffodilSpots = useMemo(() => scatter(lowQuality ? 14 : 40, 173, 97, 1.9, 10), [lowQuality]);
  const bushSpots = useMemo(() => scatter(lowQuality ? 8 : 20, 211, 61, 2.4, 11), [lowQuality]);

  return (
    <group>
      {/* Ground — lush spring green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[42, 48]} />
        <meshStandardMaterial color="#3fa14a" roughness={1} />
      </mesh>
      {/* Soft inner meadow highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#55bb55" roughness={1} />
      </mesh>

      <FlowerCarpet count={lowQuality ? 200 : 650} />

      {/* Distant rolling hills */}
      {(
        [
          [-16, 0, -22, 14, 5.5, "#6db95f"],
          [4, 0, -26, 18, 7, "#82c673"],
          [20, 0, -20, 12, 4.5, "#5fae54"],
        ] as const
      ).map(([x, y, z, r, h, color], i) => (
        <mesh key={i} position={[x, y - r + h, z]} scale={[r, h, r]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}

      <Flora url="/models/daffodil.glb" height={0.7} spots={daffodilSpots} />
      <Flora url="/models/flowerbush.glb" height={0.7} spots={bushSpots} />
    </group>
  );
}

useGLTF.preload("/models/daffodil.glb", "/draco/");
useGLTF.preload("/models/flowerbush.glb", "/draco/");
