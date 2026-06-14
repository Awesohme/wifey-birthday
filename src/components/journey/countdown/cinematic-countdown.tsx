"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HER_NAME, UNLOCK_AT } from "@/lib/config";

function remaining() {
  const ms = Math.max(0, UNLOCK_AT.getTime() - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

/** A single large serif numeral that flips up to the next value each tick. */
function FlipUnit({
  value,
  label,
  reduced,
}: {
  value: number;
  label: string;
  reduced: boolean;
}) {
  const display = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[clamp(3.6rem,12vw,7rem)] w-[clamp(3rem,11vw,6rem)] overflow-hidden">
        {/* glow pooled behind the numeral */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle,_rgba(214,179,107,0.22),_transparent_68%)] blur-xl"
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={reduced ? false : { rotateX: -88, opacity: 0, y: "35%" }}
            animate={{ rotateX: 0, opacity: 1, y: "0%" }}
            exit={reduced ? { opacity: 0 } : { rotateX: 88, opacity: 0, y: "-35%" }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center tabular-nums text-[clamp(3rem,10vw,6rem)] leading-none text-[#f7ead1]"
            style={{
              fontFamily: "var(--font-serif)",
              transformOrigin: "center",
              textShadow:
                "0 0 26px rgba(214,179,107,0.35), 0 0 60px rgba(77,121,255,0.18)",
            }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-3 text-[0.6rem] uppercase tracking-[0.4em] text-[#f7ead1]/42 sm:text-[0.65rem]">
        {label}
      </span>
    </div>
  );
}

export function CinematicCountdown() {
  const reduced = Boolean(useReducedMotion());
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = remaining();
      setTime(next);
      if (next.done) window.location.reload();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050d19] px-6 py-16 text-center text-[#f7ead1]">
      {/* deep night base */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,40,78,0.9)_0%,_#070f1d_46%,_#04080f_100%)]"
      />

      {/* slow drifting aurora ribbons */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[44rem] -translate-x-1/2 rounded-full bg-[#d6b36b]/14 blur-[150px]"
        animate={reduced ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[-16rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#4d79ff]/16 blur-[150px]"
        animate={reduced ? undefined : { opacity: [0.4, 0.75, 0.4], scale: [1, 1.12, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[#244cc5]/14 blur-[140px]"
        animate={reduced ? undefined : { opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[0.62rem] uppercase tracking-[0.5em] text-[#d6b36b]/72 sm:text-[0.7rem]"
        >
          22 June · Midnight reveal
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.9 }}
          className="mt-7 text-[clamp(3.4rem,12vw,7.5rem)] font-light leading-[0.84] tracking-[-0.04em]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {HER_NAME}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32, duration: 0.9 }}
          className="mt-4 max-w-md text-sm leading-7 text-[#f7ead1]/52"
        >
          The celebration is gathering itself. When the clock turns, her story
          opens in full.
        </motion.p>

        {time && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.9 }}
            className="mt-14 flex items-start justify-center gap-4 sm:gap-9"
            aria-label="Countdown to reveal"
          >
            <FlipUnit value={time.days} label="days" reduced={reduced} />
            <span className="mt-[clamp(0.8rem,4vw,2.2rem)] text-[clamp(2rem,7vw,4rem)] leading-none text-[#f7ead1]/22">
              :
            </span>
            <FlipUnit value={time.hours} label="hours" reduced={reduced} />
            <span className="mt-[clamp(0.8rem,4vw,2.2rem)] text-[clamp(2rem,7vw,4rem)] leading-none text-[#f7ead1]/22">
              :
            </span>
            <FlipUnit value={time.minutes} label="minutes" reduced={reduced} />
            <span className="mt-[clamp(0.8rem,4vw,2.2rem)] text-[clamp(2rem,7vw,4rem)] leading-none text-[#f7ead1]/22">
              :
            </span>
            <FlipUnit value={time.seconds} label="seconds" reduced={reduced} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9 }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <Link
            href="/wish"
            className="group inline-flex min-h-13 items-center gap-2 rounded-full border border-[#d6b36b]/40 bg-[#f7ead1]/[0.04] px-8 py-4 text-sm font-medium text-[#f7ead1] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#d6b36b]/70 hover:bg-[#f7ead1]/[0.08]"
          >
            Leave {HER_NAME} a birthday wish
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[#f7ead1]/32">
            Wishes stay private until the reveal
          </p>
        </motion.div>
      </div>
    </main>
  );
}
