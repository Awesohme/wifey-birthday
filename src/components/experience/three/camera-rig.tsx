"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Stage } from "./types";

/**
 * Drives the camera per stage:
 *  closeup — tight on the hovering butterfly
 *  flight  — pulls back and up, chasing the butterfly toward the tree
 *  scene   — settles on the full meadow + tree view
 * Reduced motion jumps straight to the final framing.
 */

const VIEWS: Record<Stage, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  // Start well behind the arch trees so their canopies frame the view
  closeup: { pos: new THREE.Vector3(0, 2.3, 20.5), target: new THREE.Vector3(0, 3.6, 0) },
  // Push forward through the arch opening, chasing the butterfly
  flight: { pos: new THREE.Vector3(-0.6, 2.9, 12.8), target: new THREE.Vector3(0, 4.2, 0) },
  // Settle close — the big tree fills the frame
  scene: { pos: new THREE.Vector3(0, 3.6, 8.8), target: new THREE.Vector3(0, 3.9, 0) },
};

export function CameraRig({ stage, reducedMotion }: { stage: Stage; reducedMotion: boolean }) {
  const { camera } = useThree();
  const target = useRef(VIEWS[reducedMotion ? "scene" : stage].target.clone());
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const view = VIEWS[reducedMotion ? "scene" : stage];

    if (!initialized.current) {
      camera.position.copy(view.pos);
      target.current.copy(view.target);
      camera.lookAt(target.current);
      initialized.current = true;
      return;
    }

    if (reducedMotion) {
      camera.position.copy(view.pos);
      target.current.copy(view.target);
    } else {
      const d = Math.min(delta, 0.05);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, view.pos.x, 1.6, d);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, view.pos.y, 1.6, d);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, view.pos.z, 1.6, d);
      target.current.x = THREE.MathUtils.damp(target.current.x, view.target.x, 1.8, d);
      target.current.y = THREE.MathUtils.damp(target.current.y, view.target.y, 1.8, d);
      target.current.z = THREE.MathUtils.damp(target.current.z, view.target.z, 1.8, d);
    }
    camera.lookAt(target.current);
  });

  return null;
}
