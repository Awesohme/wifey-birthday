"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  DotLottieReact,
  type DotLottie,
} from "@lottiefiles/dotlottie-react";

/**
 * Plays after a wish is accepted: a full-screen overlay shows a real
 * letter/envelope-sealing animation (a designer Lottie), then hands off to
 * the thank-you screen when it completes.
 *
 * The animation file lives at `public/wish-seal.json` (a Lottie JSON or
 * `.lottie` downloaded from LottieFiles). If it's missing or fails to load,
 * we skip straight to the thank-you screen so the flow never gets stuck.
 *
 * Rendered in a body portal so the fixed overlay isn't clipped by any
 * transformed/backdrop-blur ancestor on the wish page.
 */

// Where the animation asset lives. Drop a Lottie JSON (or .lottie) here.
const SEAL_SRC = "/wish-seal.json";
// Safety net: if the Lottie never reports "complete" (wrong loop settings,
// load failure, etc.), hand off anyway after this long.
const MAX_DURATION_MS = 6000;

export function SealAnimation({
  onDone,
}: {
  // `recipient`/`preview` are accepted for API compatibility but the Lottie
  // tells its own story, so they're not rendered here.
  recipient?: string;
  preview?: string;
  onDone: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const doneRef = useRef(false);

  // Single, idempotent hand-off — whichever trigger fires first wins.
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  // Reduced motion or a missing/broken asset: no theatre, hand straight off.
  useEffect(() => {
    if (reducedMotion || failed) {
      const id = window.setTimeout(finish, 200);
      return () => window.clearTimeout(id);
    }
    // Safety timeout so we never strand the user on the overlay.
    const id = window.setTimeout(finish, MAX_DURATION_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, failed]);

  if (reducedMotion || failed || typeof document === "undefined") return null;

  const handleDotLottie = (dot: DotLottie | null) => {
    if (!dot) return;
    dot.addEventListener("complete", finish);
    dot.addEventListener("loadError", () => setFailed(true));
  };

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#040c1c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-hidden
    >
      {/* soft aurora behind the animation for depth on the dark page */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#244cc5]/20 blur-[140px]" />

      <DotLottieReact
        src={SEAL_SRC}
        autoplay
        loop={false}
        dotLottieRefCallback={handleDotLottie}
        className="relative h-[min(70vh,30rem)] w-[min(90vw,30rem)]"
      />
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
