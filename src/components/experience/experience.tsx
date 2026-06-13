"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { HER_NAME, type Wish } from "@/lib/config";
import { Butterfly } from "./butterfly";
import { Scene } from "./scene";
import { WishCard } from "./wish-card";
import { useWebGLSupport } from "./three/webgl-detector";
import type { Stage } from "./three/types";

const Scene3D = dynamic(() => import("./three/canvas-wrapper"), { ssr: false });

const OPENED_KEY = "bt-opened";

function loadOpened(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(OPENED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function Experience({ wishes }: { wishes: Wish[] }) {
  const [stage, setStage] = useState<Stage>("closeup");
  const [openWish, setOpenWish] = useState<Wish | null>(null);
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const webgl = useWebGLSupport();

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setOpenedIds(loadOpened());
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setReducedMotion(true);
        setStage("scene");
      }
    });
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = reduced ? undefined : setTimeout(() => setStage("flight"), 2600);
    const t2 = reduced ? undefined : setTimeout(() => setStage("scene"), 5400);
    return () => {
      cancelAnimationFrame(raf);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, []);

  const handleOpen = useCallback((wish: Wish) => {
    setOpenWish(wish);
    setOpenedIds((prev) => {
      const next = new Set(prev).add(wish.id);
      try {
        localStorage.setItem(OPENED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const seenAll = wishes.length > 0 && wishes.every((w) => openedIds.has(w.id));

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#8ec3ec]">
      {webgl === true ? (
        /* The 3D meadow — camera flight replaces the old CSS zoom */
        <Scene3D
          wishes={wishes}
          openedIds={openedIds}
          onOpen={handleOpen}
          revealOrnaments={stage === "scene"}
          stage={stage}
          reducedMotion={reducedMotion}
        />
      ) : webgl === false ? (
        /* No WebGL — the original SVG meadow, exactly as before */
        <SvgExperience
          wishes={wishes}
          openedIds={openedIds}
          onOpen={handleOpen}
          stage={stage}
        />
      ) : null}

      {/* Title */}
      {stage === "scene" && (
        <motion.header
          className="pointer-events-none absolute inset-x-0 top-[6dvh] z-10 px-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <h1 className="font-display text-4xl text-white drop-shadow-[0_2px_12px_rgba(31,55,173,0.45)] sm:text-5xl">
            Happy Birthday, {HER_NAME}
          </h1>
          <p className="mt-2 text-sm text-white/85 drop-shadow-sm sm:text-base">
            {wishes.length > 0
              ? `${wishes.length} ${wishes.length === 1 ? "wish is" : "wishes are"} glittering on your tree. Tap one. ✨`
              : "Your tree is taking root. Come back soon. 🌱"}
          </p>
          {seenAll && (
            <p className="mt-1 text-xs text-amber-200 drop-shadow-sm">
              You&apos;ve opened every single one. You are so loved. 💙
            </p>
          )}
        </motion.header>
      )}

      <WishCard wish={openWish} onClose={() => setOpenWish(null)} />
    </main>
  );
}

/** Original 2D path, kept verbatim as the no-WebGL fallback */
function SvgExperience({
  wishes,
  openedIds,
  onOpen,
  stage,
}: {
  wishes: Wish[];
  openedIds: Set<string>;
  onOpen: (wish: Wish) => void;
  stage: Stage;
}) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.7, filter: "blur(14px)" }}
        animate={
          stage === "closeup"
            ? { scale: 1.7, filter: "blur(14px)" }
            : { scale: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 2.6, ease: [0.32, 0.72, 0.25, 1] }}
      >
        <Scene
          wishes={wishes}
          openedIds={openedIds}
          onOpen={onOpen}
          revealOrnaments={stage === "scene"}
        />
      </motion.div>

      {stage !== "scene" && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-10"
          initial={{ x: "-50%", y: "-50%", scale: 1 }}
          animate={
            stage === "closeup"
              ? { x: "-50%", y: "-50%", scale: 1 }
              : {
                  x: ["-50%", "-110%", "-30%", "-50%"],
                  y: ["-50%", "-90%", "-130%", "-158%"],
                  scale: [1, 0.6, 0.32, 0.16],
                }
          }
          transition={{ duration: 2.8, ease: "easeInOut", times: [0, 0.35, 0.7, 1] }}
        >
          <div className="hover-drift">
            <Butterfly size="min(75vw, 420px)" flapDuration={stage === "closeup" ? 1.1 : 0.45} />
          </div>
        </motion.div>
      )}

      {stage === "scene" && (
        <motion.div
          className="pointer-events-none absolute left-[55%] top-[34%] z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hover-drift">
            <Butterfly size={56} flapDuration={1.6} />
          </div>
        </motion.div>
      )}
    </>
  );
}
