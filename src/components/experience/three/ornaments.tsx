"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Wish } from "@/lib/config";
import { anchorFor } from "./tree";

const ROYAL = new THREE.Color("#3a5be4");
const ROYAL_DEEP = new THREE.Color("#1f37ad");
const GOLD = new THREE.Color("#e0b54b");
const GOLD_GLOW = new THREE.Color("#ecd28a");

function Ornament({
  wish,
  index,
  opened,
  onOpen,
}: {
  wish: Wish;
  index: number;
  opened: boolean;
  onOpen: () => void;
}) {
  const [ax, ay, az] = anchorFor(index);
  const stringLen = 0.45 + (index % 5) * 0.08;
  const swing = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  const freq = 0.9 + (index % 5) * 0.17;
  const phase = (index % 7) * 0.9;
  const gold = index % 2 === 1;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (swing.current) {
      swing.current.rotation.z = Math.sin(t * freq + phase) * 0.12;
      swing.current.rotation.x = Math.cos(t * freq * 0.7 + phase) * 0.06;
    }
    if (gem.current) {
      gem.current.rotation.y = t * 0.6 + phase;
      const m = gem.current.material as THREE.MeshStandardMaterial;
      // Gentle sparkle pulse; opened charms burn brighter for the bloom pass
      const base = opened ? 1.6 : 0.35;
      m.emissiveIntensity = base + Math.sin(t * 2.2 + phase) * 0.18;
    }
  });

  return (
    <group position={[ax, ay, az]}>
      <group ref={swing}>
        {/* String */}
        <mesh position={[0, -stringLen / 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, stringLen, 4]} />
          <meshStandardMaterial color="#7a5a38" roughness={1} />
        </mesh>
        {/* Faceted charm */}
        <mesh
          ref={gem}
          position={[0, -stringLen - 0.13, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial
            color={gold ? GOLD : ROYAL}
            emissive={opened ? GOLD_GLOW : gold ? GOLD : ROYAL_DEEP}
            metalness={0.55}
            roughness={0.25}
          />
        </mesh>
        {/* Generous invisible tap target for fingers */}
        <mesh
          position={[0, -stringLen - 0.13, 0]}
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <sphereGeometry args={[0.34, 8, 8]} />
        </mesh>
        {/* Keyboard / screen-reader access at the charm's position */}
        <Html position={[0, -stringLen - 0.13, 0]} center style={{ pointerEvents: "none" }}>
          <button
            type="button"
            aria-label={`Open the wish from ${wish.name}`}
            onClick={onOpen}
            style={{
              pointerEvents: "auto",
              width: 1,
              height: 1,
              opacity: 0,
              border: 0,
              padding: 0,
              background: "transparent",
            }}
          />
        </Html>
      </group>
    </group>
  );
}

export function Ornaments({
  wishes,
  openedIds,
  onOpen,
  visible,
}: {
  wishes: Wish[];
  openedIds: Set<string>;
  onOpen: (wish: Wish) => void;
  visible: boolean;
}) {
  const items = useMemo(() => wishes, [wishes]);
  if (!visible) return null;
  return (
    <group>
      {items.map((wish, i) => (
        <Ornament
          key={wish.id}
          wish={wish}
          index={i}
          opened={openedIds.has(wish.id)}
          onOpen={() => onOpen(wish)}
        />
      ))}
    </group>
  );
}
