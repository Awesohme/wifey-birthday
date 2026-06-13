"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useScroll, useMotionValueEvent } from "framer-motion";
import type { Wish } from "@/lib/config";
import { FlyScene } from "./fly-scene";
import { buildItems, flightDepth } from "./types";

interface FlythroughProps {
  wishes: Wish[];
  photos: string[];
}

/**
 * A fly-through driven by the PAGE's own scroll. A tall section holds a
 * sticky full-viewport canvas; as the section scrolls past, the camera flies
 * forward through floating wishes, name landmarks, and photos in z-space.
 * Composes naturally with the hero above and gallery below — no scroll hijack.
 */
export function Flythrough({ wishes, photos }: FlythroughProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [ready, setReady] = useState(false);

  const items = buildItems(wishes, photos);
  const depth = flightDepth(items);
  const pages = Math.max(4, depth / 8);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
  });
  // seed initial value
  useEffect(() => {
    progressRef.current = scrollYProgress.get();
  }, [scrollYProgress]);

  return (
    <section
      ref={sectionRef}
      id="story"
      aria-label="A flight through everyone's birthday wishes"
      className="relative w-full bg-[#f4f8fb]"
      style={{ height: `${pages * 100}vh` }}
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-[#f4f8fb]">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          camera={{ fov: 62, near: 0.1, far: 120, position: [0, 0, 8] }}
          onCreated={() => setReady(true)}
        >
          <color attach="background" args={["#f4f8fb"]} />
          <fog attach="fog" args={["#f4f8fb", 16, 34]} />
          <ambientLight intensity={1} />

          <Suspense fallback={null}>
            <FlyScene wishes={wishes} photos={photos} progressRef={progressRef} />
            <Preload all />
          </Suspense>
        </Canvas>

        {ready && (
          <div
            className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-[#0b3c5d]/40"
            style={{ fontFamily: "var(--font-body)" }}
          >
            keep scrolling
          </div>
        )}
      </div>
    </section>
  );
}
