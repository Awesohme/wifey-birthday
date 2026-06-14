"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Plays after a wish is accepted: the written letter folds in thirds, drops
 * into an envelope, the flap seals with a wax "A" stamp, and the whole thing
 * zooms toward the viewer before handing off to the thank-you screen.
 *
 * Rendered in a body portal so the fixed overlay isn't clipped by any
 * transformed/backdrop-blur ancestor on the wish page.
 */
export function SealAnimation({
  recipient,
  preview,
  onDone,
}: {
  recipient: string;
  preview?: string;
  onDone: () => void;
}) {
  const reducedMotion = useReducedMotion();

  // Reduced motion: no theatre — hand straight to the thank-you screen.
  useEffect(() => {
    if (reducedMotion) {
      const id = window.setTimeout(onDone, 200);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [reducedMotion, onDone]);

  if (reducedMotion || typeof document === "undefined") return null;

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#040c1c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-hidden
    >
      {/* soft aurora behind the envelope */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#244cc5]/20 blur-[140px]" />

      {/* zoom container: the whole scene scales toward the viewer at the end */}
      <motion.div
        className="relative"
        initial={{ scale: 0.86, y: 8 }}
        animate={{ scale: [0.86, 1, 1, 6.5], opacity: [1, 1, 1, 0] }}
        transition={{
          duration: 3.4,
          times: [0, 0.18, 0.74, 1],
          ease: ["easeOut", "linear", "easeIn"],
        }}
        onAnimationComplete={onDone}
      >
        {/* ── The letter (folds in thirds, then drops into the envelope) ── */}
        <motion.div
          className="absolute left-1/2 z-20 w-56 -translate-x-1/2 [transform-style:preserve-3d]"
          initial={{ top: -150, opacity: 1, rotateX: 0 }}
          animate={{
            // fold (rotateX collapse) → slide down into the envelope → tuck away
            rotateX: [0, 0, -82, -82],
            top: [-150, -150, -150, 30],
            scaleY: [1, 1, 0.42, 0.34],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 2.1,
            times: [0, 0.28, 0.62, 1],
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "center top" }}
        >
          <div className="rounded-sm bg-[#f7f0df] px-4 py-5 text-[#173b73] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="h-1.5 w-10 rounded-full bg-[#244cc5]/40" />
            <p className="mt-3 font-serif text-sm italic leading-snug text-[#173b73]/80">
              Dear {recipient},
            </p>
            <p className="mt-2 line-clamp-3 font-serif text-xs leading-relaxed text-[#173b73]/60">
              {preview?.trim()
                ? preview
                : "A birthday wish, sealed with love."}
            </p>
            <p className="mt-3 text-right font-serif text-xs italic text-[#173b73]/55">
              With love
            </p>
          </div>
        </motion.div>

        {/* ── The envelope ── */}
        <div className="relative h-44 w-72">
          {/* body */}
          <div className="absolute inset-0 rounded-md bg-[#102f5d] shadow-[0_30px_90px_rgba(0,0,0,0.55)]" />
          {/* inner pocket lines */}
          <div className="absolute inset-x-0 bottom-0 h-28 rounded-b-md bg-[linear-gradient(160deg,#173b73,#0c2348)]" />
          <div className="absolute bottom-0 left-0 h-28 w-1/2 origin-bottom-left skew-x-[36deg] bg-[#0e2950]/70" />
          <div className="absolute bottom-0 right-0 h-28 w-1/2 origin-bottom-right -skew-x-[36deg] bg-[#0e2950]/70" />

          {/* flap — closes over the top after the letter is in */}
          <motion.div
            className="absolute left-0 top-0 h-24 w-72 origin-top [backface-visibility:hidden]"
            initial={{ rotateX: 0 }}
            animate={{ rotateX: [0, 0, 180] }}
            transition={{
              duration: 2.4,
              times: [0, 0.7, 0.95],
              ease: "easeInOut",
            }}
            style={{ transformStyle: "preserve-3d", perspective: 800 }}
          >
            <div
              className="size-full bg-[#1b4488]"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
              }}
            />
          </motion.div>

          {/* wax seal — presses on as the flap finishes closing */}
          <motion.div
            className="absolute left-1/2 top-[52%] z-30 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#b03a34] shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 0, 1.25, 1], opacity: [0, 0, 1, 1] }}
            transition={{ duration: 2.7, times: [0, 0.86, 0.94, 1] }}
          >
            <span className="font-serif text-lg italic text-[#f7e7c8]">A</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
