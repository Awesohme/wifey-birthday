"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Image as DreiImage, Billboard } from "@react-three/drei";
import type { Group } from "three";
import { SERIF_FONT, BODY_FONT, type FlyItem } from "./types";

/** Fade an item in as the camera nears it and out once passed. */
function useDepthFade(z: number, ref: React.RefObject<Group | null>) {
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const dist = camera.position.z - z; // positive = item is ahead
    // visible window: emerges far in the fog (~20u), fully lit by ~9u,
    // fades as it passes behind — overlaps so there's never a dead frame
    // Wider visible window (emerge ~24u out, hold until ~11u, fade as passed)
    // so consecutive items overlap and there's never an empty frame.
    let opacity = 1;
    if (dist > 11) opacity = Math.max(0, 1 - (dist - 11) / 13);
    else if (dist < 2.5) opacity = Math.max(0, dist / 2.5);
    ref.current.traverse((o) => {
      const m = (o as unknown as { material?: { opacity?: number; transparent?: boolean } })
        .material;
      if (m && typeof m.opacity === "number") {
        m.transparent = true;
        m.opacity = opacity;
      }
    });
    ref.current.visible = opacity > 0.01;
  });
}

export function LandmarkItem({ item }: { item: Extract<FlyItem, { kind: "landmark" }> }) {
  const ref = useRef<Group>(null);
  useDepthFade(item.z, ref);
  return (
    <group ref={ref} position={[item.x ?? 0, item.y ?? 0, item.z]}>
      <Text
        font={SERIF_FONT}
        fontSize={item.size}
        color={item.color}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={14}
        lineHeight={0.95}
        letterSpacing={-0.02}
      >
        {item.text}
      </Text>
      {item.subtitle && (
        <Text
          font={BODY_FONT}
          fontSize={item.size * 0.34}
          color="#15263a"
          fillOpacity={0.6}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          maxWidth={7}
          lineHeight={1.2}
          position={[0, -item.size * 0.85, 0]}
        >
          {item.subtitle}
        </Text>
      )}
    </group>
  );
}

export function WishItem({ item }: { item: Extract<FlyItem, { kind: "wish" }> }) {
  const ref = useRef<Group>(null);
  useDepthFade(item.z, ref);
  return (
    <group ref={ref} position={[item.x ?? 0, item.y ?? 0, item.z]}>
      <Text
        font={SERIF_FONT}
        fontSize={0.62}
        color="#15263a"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={7.5}
        lineHeight={1.18}
        position={[0, 0.5, 0]}
      >
        {`“${item.wish.message_text}”`}
      </Text>
      <Text
        font={BODY_FONT}
        fontSize={0.26}
        color="#9a6b7c"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={7.5}
        position={[0, -1.4, 0]}
      >
        {`${item.wish.name}${item.wish.relationship ? ", " + item.wish.relationship : ""}`}
      </Text>
    </group>
  );
}

export function PhotoItem({ item }: { item: Extract<FlyItem, { kind: "photo" }> }) {
  const ref = useRef<Group>(null);
  useDepthFade(item.z, ref);
  const s = item.scale ?? 4;
  return (
    <group ref={ref} position={[item.x ?? 0, item.y ?? 0, item.z]}>
      {/* Per-photo Suspense so one still-loading texture never blanks the whole
          flight — each image simply pops in when its texture is ready. */}
      <Suspense fallback={null}>
        <Billboard follow={false}>
          <DreiImage url={item.src} scale={[s, s * 0.72]} transparent radius={0.12} />
        </Billboard>
      </Suspense>
    </group>
  );
}

export function FlyItemMesh({ item }: { item: FlyItem }) {
  if (item.kind === "landmark") return <LandmarkItem item={item} />;
  if (item.kind === "wish") return <WishItem item={item} />;
  return <PhotoItem item={item} />;
}
