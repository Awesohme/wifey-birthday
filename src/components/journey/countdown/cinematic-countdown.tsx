"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HER_NAME, UNLOCK_AT } from "@/lib/config";

const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  size: 1 + ((index * 7) % 4) * 0.75,
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 53 + 17) % 100}%`,
}));

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

function CountdownTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="liquid-glass rounded-2xl w-20 py-4 text-center">
        <span
          className="tabular-nums text-3xl text-white block"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function CinematicCountdown() {
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    const tick = () => {
      const t = remaining();
      setTime(t);
      if (t.done) window.location.reload();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ backgroundColor: "hsl(201 100% 13%)" }}
    >
      {/* Subtle noise/particle overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(201 100% 25% / 0.4), transparent)",
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {PARTICLES.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              y: [0, -(30 + i * 8), 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: 4 + i * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xs tracking-[0.25em] uppercase text-white/40"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Something is coming
        </motion.p>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-normal text-white leading-none"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(3.5rem, 10vw, 8rem)",
            letterSpacing: "-0.03em",
          }}
        >
          {HER_NAME}
        </motion.h1>

        {/* Date label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-sm text-white/40 -mt-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Blooms at midnight on June 22
        </motion.p>

        {/* Countdown tiles */}
        {time && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4"
            aria-label="Countdown to reveal"
          >
            <CountdownTile value={time.days} label="days" />
            <CountdownTile value={time.hours} label="hrs" />
            <CountdownTile value={time.minutes} label="min" />
            <CountdownTile value={time.seconds} label="sec" />
          </motion.div>
        )}

        {/* Footer line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-white/20 max-w-xs leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Until then — go leave your wish.
          <br />
          <a
            href="/wish"
            className="underline underline-offset-2 text-white/40 hover:text-white/70 transition-colors"
          >
            Write something ✦
          </a>
        </motion.p>
      </div>
    </main>
  );
}
