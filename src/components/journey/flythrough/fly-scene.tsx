"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import type { Wish } from "@/lib/config";
import { buildItems, flightDepth } from "./types";
import { FlyItemMesh } from "./fly-items";

/**
 * Camera flies forward (toward -Z) as `progressRef` (0→1, driven by the
 * page's scroll position over the section) advances.
 */
export function FlyScene({
  wishes,
  photos,
  progressRef,
}: {
  wishes: Wish[];
  photos: string[];
  progressRef: MutableRefObject<number>;
}) {
  const items = useMemo(() => buildItems(wishes, photos), [wishes, photos]);
  const depth = useMemo(() => flightDepth(items), [items]);

  const START_Z = 8;

  useFrame(({ camera }, delta) => {
    const offset = Math.min(1, Math.max(0, progressRef.current));
    const target = START_Z - offset * depth;
    // Track scroll tightly so the camera never trails far behind on fast
    // scrolls (which left the screen blank). A high catch-up factor keeps it
    // glued to the scroll position while still smoothing tiny jitter; clamped
    // to 1 so it can't overshoot.
    camera.position.z += (target - camera.position.z) * Math.min(1, delta * 12);

    // subtle drift/sway for a "walking" feel
    const t = offset * depth;
    camera.position.x = Math.sin(t * 0.12) * 0.5;
    camera.position.y = Math.cos(t * 0.09) * 0.3;
    camera.lookAt(camera.position.x * 0.4, camera.position.y * 0.4, camera.position.z - 10);
  });

  return (
    <>
      {items.map((item, i) => (
        <FlyItemMesh key={i} item={item} />
      ))}
    </>
  );
}

/** Hook to expose buildItems depth for sizing the section outside the canvas. */
export function useFlightPages(wishes: Wish[], photos: string[]) {
  return useMemo(() => {
    const items = buildItems(wishes, photos);
    const depth = flightDepth(items);
    return Math.max(4, depth / 8);
  }, [wishes, photos]);
}
