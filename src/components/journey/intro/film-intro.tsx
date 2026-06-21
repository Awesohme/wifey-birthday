"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FILM_FRAMES,
  yearProgress,
  BIRTH_YEAR,
  type FilmFrame,
} from "./film-frames";
import { useProjectorSound } from "./use-projector-sound";
import { HER_NAME } from "@/lib/config";
import { preloadImages } from "@/lib/preload-images";

const FRAME_MS = 1500; // time each photo holds
const BLACK_MS = 600; // initial black hold before the light blooms
const BLOOM_MS = 1400; // light bloom duration

interface FilmIntroProps {
  onComplete: () => void;
  frames?: FilmFrame[];
}

type Phase = "black" | "bloom" | "reel" | "out";

export function FilmIntro({
  onComplete,
  frames = FILM_FRAMES,
}: FilmIntroProps) {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("black");
  const [index, setIndex] = useState(0);
  const [displayYear, setDisplayYear] = useState(BIRTH_YEAR);
  const doneRef = useRef(false);
  const { muted, toggleMute, enableOnGesture } = useProjectorSound();

  const safeFrames = frames.length > 0 ? frames : FILM_FRAMES;
  const isLastFrame = index >= safeFrames.length - 1;

  // Decode every reel frame before the projector starts so none pop on advance.
  useEffect(() => {
    preloadImages(safeFrames.map((frame) => frame.src));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("out");
    setTimeout(onComplete, 700);
  };

  // Reduced motion: skip straight through
  useEffect(() => {
    if (prefersReduced) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  // Timeline driver
  useEffect(() => {
    if (prefersReduced) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("bloom"), BLACK_MS));
    timers.push(setTimeout(() => setPhase("reel"), BLACK_MS + BLOOM_MS));
    return () => timers.forEach(clearTimeout);
  }, [prefersReduced]);

  // Advance frames during the reel
  useEffect(() => {
    if (phase !== "reel") return;
    if (index >= safeFrames.length - 1) {
      // hold the final title-card frame longer before settling
      const t = setTimeout(finish, FRAME_MS + 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), FRAME_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, safeFrames.length]);

  // Tween the year counter toward the current frame's year
  useEffect(() => {
    if (phase !== "reel") return;
    const target = safeFrames[index].year;
    let raf = 0;
    const step = () => {
      setDisplayYear((y) => {
        if (y >= target) return target;
        const next = y + Math.max(1, Math.round((target - y) / 6));
        return Math.min(target, next);
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, index, safeFrames]);

  const frame = safeFrames[index];
  const p = yearProgress(frame.year);
  // B&W → colour, grain heavy → light, sepia warm → neutral
  const grade = `saturate(${(p * 100).toFixed(0)}%) sepia(${((1 - p) * 0.5).toFixed(2)}) contrast(${(1.15 - p * 0.15).toFixed(2)}) brightness(${(0.92 + p * 0.08).toFixed(2)})`;
  const grainOpacity = 0.5 - p * 0.42;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "out" ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      aria-label="An opening film of her life"
      onPointerDown={enableOnGesture}
    >
      {/* Controls: sound toggle + skip */}
      {phase !== "out" && (
        <div className="absolute top-6 right-6 z-[110] flex items-center gap-5">
          <button
            onClick={toggleMute}
            className="text-[11px] uppercase tracking-[0.25em] text-white/50 hover:text-white/90 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
            aria-label={muted ? "Unmute projector sound" : "Mute projector sound"}
          >
            {muted ? "♪ sound on" : "♪ sound off"}
          </button>
          <button
            onClick={finish}
            className="text-[11px] uppercase tracking-[0.25em] text-white/50 hover:text-white/90 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            skip ✕
          </button>
        </div>
      )}

      {phase !== "out" && muted && (
        <div
          className="pointer-events-none absolute bottom-7 left-1/2 z-[110] -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-5 py-2 text-center text-[10px] uppercase tracking-[0.24em] text-white/55 backdrop-blur"
          style={{ fontFamily: "var(--font-body)" }}
        >
          tap anywhere for projector sound
        </div>
      )}

      {/* The reel */}
      <AnimatePresence>
        {(phase === "bloom" || phase === "reel") && (
          <motion.div
            key="reel"
            className={`absolute inset-0 ${phase === "bloom" ? "light-bloom" : ""}`}
          >
            {/* photo frame — frames SLIDE UP like a reel advancing: the new
                frame rises in from below as the previous one exits upward */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-[6vw] py-[8vh]">
              <div className="relative h-full w-full max-w-5xl overflow-hidden gate-weave">
                <AnimatePresence initial={false}>
                  <motion.img
                    key={frame.src}
                    src={frame.src}
                    alt=""
                    decoding="async"
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ filter: grade }}
                    draggable={false}
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.85) 100%)",
              }}
            />

            {/* sprocket holes left & right */}
            {[0, 1].map((sideIdx) => (
              <div
                key={sideIdx}
                className={`pointer-events-none absolute top-0 bottom-0 ${sideIdx === 0 ? "left-0" : "right-0"} w-[4vw] bg-black/85 flex flex-col items-center justify-center gap-[3vh]`}
              >
                {Array.from({ length: 9 }).map((_, n) => (
                  <span
                    key={n}
                    className="block w-[1.6vw] h-[2.2vh] rounded-[3px] bg-white/15"
                  />
                ))}
              </div>
            ))}

            {/* grain */}
            <div
              className="film-grain pointer-events-none absolute inset-0"
              style={{ opacity: grainOpacity }}
            />
            {/* flicker */}
            <div className="film-flicker pointer-events-none absolute inset-0 bg-white" />

            {/* burned-in year stamp */}
            <div
              className="pointer-events-none absolute bottom-[6vh] left-[7vw] text-white/80"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 5vw, 4rem)",
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                letterSpacing: "0.05em",
              }}
            >
              {displayYear}
            </div>

            {/* caption (hidden on the final title-card frame) */}
            {frame.caption && !isLastFrame && (
              <div
                className="pointer-events-none absolute bottom-[7vh] right-[7vw] text-white/55 italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(0.9rem, 2vw, 1.4rem)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.6)",
                }}
              >
                {frame.caption}
              </div>
            )}

            {/* title card — her name draws on over the final frame */}
            {isLastFrame && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <motion.h2
                  initial={{ opacity: 0, letterSpacing: "0.4em", scale: 1.1 }}
                  animate={{ opacity: 1, letterSpacing: "0.02em", scale: 1 }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
                  className="text-white text-center"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(3rem, 9vw, 7rem)",
                    textShadow: "0 4px 28px rgba(0,0,0,0.55)",
                  }}
                >
                  {HER_NAME}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="mt-3 text-white/70 italic"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(1rem, 2.4vw, 1.6rem)",
                    textShadow: "0 2px 14px rgba(0,0,0,0.6)",
                  }}
                >
                  a life worth celebrating
                </motion.p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* the very first beat: pure black with a faint waiting glow */}
      {phase === "black" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-white"
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
