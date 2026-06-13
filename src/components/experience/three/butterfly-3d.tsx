"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Stage } from "./types";

/**
 * The GLB holds two meshes (WingL / WingR) split at the body axis by
 * scripts/build-models.mjs. Wings flap by rotating around the Z axis.
 *
 * Flight: closeup → hovers near the camera; flight → follows a curve up
 * to the canopy; scene → perched on a branch, slow flap.
 */

const PERCH = new THREE.Vector3(1.45, 5.8, 0.7);
// Hover in front of the start camera, before the arch opening
const HOVER = new THREE.Vector3(0, 2.9, 16.3);

const FLIGHT_PATH = new THREE.CatmullRomCurve3([
  HOVER.clone(),
  new THREE.Vector3(-1.2, 3.1, 13.4),
  new THREE.Vector3(0, 3.0, 11.4), // through the arch opening
  new THREE.Vector3(1.9, 5.5, 5.2),
  PERCH.clone(),
]);

const FLIGHT_SECONDS = 2.8;

export function Butterfly3D({ stage, reducedMotion }: { stage: Stage; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Object3D>(null);
  const wingR = useRef<THREE.Object3D>(null);
  const flightStart = useRef<number | null>(null);
  const { scene } = useGLTF("/models/butterfly.glb", "/draco/");

  const wings = useMemo(() => {
    const clone = scene.clone(true);
    let l: THREE.Object3D | null = null;
    let r: THREE.Object3D | null = null;
    clone.traverse((o) => {
      if (o.name === "WingL") l = o;
      if (o.name === "WingR") r = o;
    });
    // Royal-blue tint matching the old SVG butterfly
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = new THREE.MeshStandardMaterial({
          color: "#3a5be4",
          emissive: "#0d1a6a",
          emissiveIntensity: 0.25,
          side: THREE.DoubleSide,
          roughness: 0.6,
        });
      }
    });
    return { clone, l, r };
  }, [scene]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;

    // Wing flap — fast while flying, lazy when perched
    const perched = stage === "scene" || reducedMotion;
    const flapSpeed = perched ? 4.5 : 14;
    const flapAmp = perched ? 0.55 : 0.9;
    const flap = Math.sin(t * flapSpeed) * flapAmp;
    const l = wingL.current ?? (wings.l as THREE.Object3D | null);
    const r = wingR.current ?? (wings.r as THREE.Object3D | null);
    if (l) l.rotation.z = flap;
    if (r) r.rotation.z = -flap;

    if (reducedMotion || stage === "scene") {
      // Perched with a gentle bob
      g.position.set(PERCH.x, PERCH.y + Math.sin(t * 1.4) * 0.04, PERCH.z);
      g.rotation.set(0, -0.6, 0);
      g.scale.setScalar(0.6);
      return;
    }

    if (stage === "closeup") {
      g.position.set(HOVER.x, HOVER.y + Math.sin(t * 1.8) * 0.08, HOVER.z);
      g.rotation.set(0.15, Math.sin(t * 0.5) * 0.2, 0);
      g.scale.setScalar(1.1);
      flightStart.current = null;
      return;
    }

    // stage === "flight": travel the curve once
    if (flightStart.current === null) flightStart.current = t;
    const p = Math.min((t - flightStart.current) / FLIGHT_SECONDS, 1);
    const eased = 1 - Math.pow(1 - p, 2.2);
    FLIGHT_PATH.getPointAt(eased, g.position);
    // Face the direction of travel
    const tangent = FLIGHT_PATH.getTangentAt(eased);
    g.rotation.y = Math.atan2(tangent.x, tangent.z);
    g.scale.setScalar(1.1 - eased * 0.65);
  });

  return (
    <group ref={group}>
      <primitive object={wings.clone} />
      {/* Refs for wing meshes, attached after clone */}
      <WingRefs clone={wings.clone} wingL={wingL} wingR={wingR} />
    </group>
  );
}

/** Bridges the cloned GLTF children to refs once mounted */
function WingRefs({
  clone,
  wingL,
  wingR,
}: {
  clone: THREE.Object3D;
  wingL: React.RefObject<THREE.Object3D | null>;
  wingR: React.RefObject<THREE.Object3D | null>;
}) {
  useMemo(() => {
    clone.traverse((o) => {
      if (o.name === "WingL") wingL.current = o;
      if (o.name === "WingR") wingR.current = o;
    });
  }, [clone, wingL, wingR]);
  return null;
}

useGLTF.preload("/models/butterfly.glb", "/draco/");
