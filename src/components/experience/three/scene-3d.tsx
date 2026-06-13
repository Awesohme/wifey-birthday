"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import type { Wish } from "@/lib/config";
import type { Stage } from "./types";
import { CameraRig } from "./camera-rig";
import { Sky } from "./sky";
import { ArchTrees, Tree } from "./tree";
import { Meadow } from "./meadow";
import { Ornaments } from "./ornaments";
import { Butterfly3D } from "./butterfly-3d";
import { Fireflies } from "./fireflies";
import { Effects } from "./effects";

export function Scene3D({
  wishes,
  openedIds,
  onOpen,
  revealOrnaments,
  stage,
  reducedMotion,
}: {
  wishes: Wish[];
  openedIds: Set<string>;
  onOpen: (wish: Wish) => void;
  revealOrnaments: boolean;
  stage: Stage;
  reducedMotion: boolean;
}) {
  const [lowQuality, setLowQuality] = useState(false);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.1, far: 160, position: [0, 2.3, 20.5] }}
      shadows={false}
      className="absolute inset-0"
      aria-label="A 3D meadow with a wish tree"
      role="img"
    >
      <color attach="background" args={["#8ec3ec"]} />
      <fog attach="fog" args={["#cfe6e0", 26, 75]} />

      <PerformanceMonitor onDecline={() => setLowQuality(true)}>
        <ambientLight intensity={0.85} color="#dcebff" />
        <directionalLight position={[8, 14, 6]} intensity={1.5} color="#fff3cf" />
        <hemisphereLight args={["#aed5f2", "#3fa14a", 0.55]} />

        <CameraRig stage={stage} reducedMotion={reducedMotion} />

        <Suspense fallback={null}>
          <Sky />
          <Meadow lowQuality={lowQuality} />
          <Tree />
          <ArchTrees />
          <Ornaments
            wishes={wishes}
            openedIds={openedIds}
            onOpen={onOpen}
            visible={revealOrnaments}
          />
          <Butterfly3D stage={stage} reducedMotion={reducedMotion} />
          {!lowQuality && !reducedMotion && <Fireflies />}
        </Suspense>

        {!lowQuality && <Effects />}
      </PerformanceMonitor>
    </Canvas>
  );
}
