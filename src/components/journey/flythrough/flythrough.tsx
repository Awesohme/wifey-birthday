"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useScroll, useMotionValueEvent } from "framer-motion";
import type { Wish } from "@/lib/config";
import { FlyScene } from "./fly-scene";
import { buildItems, flightDepth } from "./types";
import { useWebGLSupport } from "@/components/experience/three/webgl-detector";
import { CanvasErrorBoundary } from "@/components/shared/canvas-guard";

interface FlythroughProps {
  wishes: Wish[];
  photos: string[];
}

/**
 * Gate: decides between the WebGL fly-through and skipping it entirely.
 *
 * The fly-through is purely decorative (names + photos flying past) — the
 * actual wishes live in the grid under the candle (FinaleSection), so there is
 * nothing to lose when WebGL is unavailable. We simply omit the section and the
 * page flows hero → candle + wishes. Keeping the scroll/canvas hooks inside
 * FlyCanvas means framer-motion's useScroll never binds to an unmounted ref.
 */
export function Flythrough({ wishes, photos }: FlythroughProps) {
  const webgl = useWebGLSupport();

  // No WebGL (older/locked-down devices) or still detecting — skip the
  // decorative flight; the wishes under the candle are unaffected.
  if (webgl !== true) {
    return null;
  }

  return (
    <CanvasErrorBoundary fallback={null}>
      <FlyCanvas wishes={wishes} photos={photos} />
    </CanvasErrorBoundary>
  );
}

function FlyCanvas({ wishes, photos }: FlythroughProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [ready, setReady] = useState(false);

  const items = buildItems(wishes, photos);
  const depth = flightDepth(items);
  // Shorter scroll track (denser flight) so there's less empty travel between
  // landmarks — the previous depth/8 made very long blank stretches.
  const pages = Math.max(4, depth / 11);

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
          // Fill the sticky container explicitly. Without this the R3F canvas
          // could get stuck at its default 300×150 (resize observer measuring a
          // not-yet-laid-out sticky parent), leaving the flight blank in a
          // corner. `offsetSize` makes R3F size from the parent's offset box.
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          resize={{ offsetSize: true }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          camera={{ fov: 62, near: 0.1, far: 120, position: [0, 0, 8] }}
          onCreated={() => setReady(true)}
        >
          <color attach="background" args={["#f4f8fb"]} />
          <fog attach="fog" args={["#f4f8fb", 16, 34]} />
          <ambientLight intensity={1} />

          {/* Text fonts suspend while Troika loads them. Keep this boundary
              around the scene, but let each photo stream in independently
              inside PhotoItem so images never block the full flight. */}
          <Suspense fallback={null}>
            <FlyScene wishes={wishes} photos={photos} progressRef={progressRef} />
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
