"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

export const TREE_HEIGHT = 7.2;

// Anchor coordinates below were authored for a 5.6-unit tree
const ANCHOR_SCALE = TREE_HEIGHT / 5.6;

/**
 * Ornament anchor points inside the canopy, in world space.
 * Mirrors the spread of the old SVG ANCHORS but in 3D — clustered
 * around the canopy volume so charms hang among the leaves.
 */
const RAW_ANCHORS: [number, number, number][] = [
  [-1.1, 4.4, 0.9],
  [0.1, 4.8, 1.2],
  [1.2, 4.4, 0.8],
  [-1.6, 3.9, 0.3],
  [-0.5, 3.8, 1.3],
  [0.6, 3.9, 1.25],
  [1.6, 3.8, 0.25],
  [-1.0, 3.3, 1.0],
  [0.15, 3.2, 1.45],
  [1.05, 3.3, 0.95],
  [-1.9, 4.1, -0.2],
  [1.9, 4.0, -0.25],
];

export const TREE_ANCHORS: [number, number, number][] = RAW_ANCHORS.map(
  ([x, y, z]) => [x * ANCHOR_SCALE, y * ANCHOR_SCALE, z * ANCHOR_SCALE]
);

export function anchorFor(i: number): [number, number, number] {
  const [x, y, z] = TREE_ANCHORS[i % TREE_ANCHORS.length];
  const round = Math.floor(i / TREE_ANCHORS.length);
  // Extra rounds nest slightly higher and deeper into the canopy
  return round === 0 ? [x, y, z] : [x * 0.8, y + 0.35 * round, z - 0.3 * round];
}

function useNormalizedTree(height: number) {
  const { scene } = useGLTF("/models/tree.glb", "/draco/");
  return useMemo(() => {
    const clone = scene.clone(true);
    // Normalize: scale to height, base on the ground, centered at origin
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = height / size.y;
    clone.scale.setScalar(scale);
    const scaled = new THREE.Box3().setFromObject(clone);
    const center = scaled.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -scaled.min.y, -center.z);
    const group = new THREE.Group();
    group.add(clone);
    return group;
  }, [scene, height]);
}

export function Tree() {
  const tree = useNormalizedTree(TREE_HEIGHT);
  return <primitive object={tree} />;
}

/**
 * Two large foreground trees near the intro camera, leaning inward so
 * their canopies form an arch the butterfly flies through (per reference).
 * They sit behind the final camera position, so they frame the intro only.
 */
export function ArchTrees() {
  const base = useNormalizedTree(10);
  const pair = useMemo(() => {
    const left = base.clone(true);
    left.position.set(-3.4, 0, 11.5);
    left.rotation.set(0, 0.5, 0.38); // lean right, toward the opening
    const right = base.clone(true);
    right.position.set(3.4, 0, 11.5);
    right.rotation.set(0, -0.5, -0.38);
    return { left, right };
  }, [base]);
  return (
    <group>
      <primitive object={pair.left} />
      <primitive object={pair.right} />
    </group>
  );
}

useGLTF.preload("/models/tree.glb", "/draco/");
