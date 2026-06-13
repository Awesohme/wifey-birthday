"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HER_NAME, UNLOCK_AT } from "@/lib/config";

const FLOATERS = Array.from({ length: 12 }, (_, index) => ({
  delay: index * 0.22,
  left: `${8 + (index * 7) % 84}%`,
  top: `${10 + (index * 11) % 76}%`,
  size: 40 + (index % 4) * 28,
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-w-[84px] overflow-hidden rounded-[1.7rem] border border-white/12 bg-[#08182f]/78 px-4 py-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:min-w-[108px] sm:px-5 sm:py-6"
    >
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <span
        className="block text-[2.2rem] leading-none text-[#f7ead1] sm:text-[3.1rem]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-3 block text-[0.62rem] uppercase tracking-[0.34em] text-[#f7ead1]/48">
        {label}
      </span>
    </motion.div>
  );
}

export function CinematicCountdown() {
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
    <main className="relative min-h-dvh overflow-hidden bg-[#071321] text-[#f7ead1]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(200,229,255,0.18),_transparent_38%),linear-gradient(180deg,_#0a1d38_0%,_#071321_44%,_#050d19_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18]" />
      <div className="absolute left-1/2 top-[-14rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#d6b36b]/18 blur-[120px]" />
      <div className="absolute bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[#4d79ff]/16 blur-[120px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {FLOATERS.map((floater, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full border border-white/8 bg-white/[0.03]"
            style={{
              left: floater.left,
              top: floater.top,
              width: floater.size,
              height: floater.size,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.16, 0.38, 0.16] }}
            transition={{
              duration: 6 + (index % 4),
              repeat: Infinity,
              ease: "easeInOut",
              delay: floater.delay,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-6 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.03] p-5 shadow-[0_40px_140px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8 lg:p-12"
        >
          <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.18em" }}
              animate={{ opacity: 1, letterSpacing: "0.34em" }}
              transition={{ delay: 0.15, duration: 0.8 }}
              className="text-center text-[0.72rem] uppercase text-[#f7ead1]/52"
            >
              22 June · Midnight reveal · A birthday in bloom
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="mx-auto mt-8 max-w-4xl text-center text-[clamp(3.7rem,10vw,8.8rem)] leading-[0.86] tracking-[-0.06em]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Cynthia&apos;s
              <span className="block bg-gradient-to-r from-[#f7ead1] via-[#d6b36b] to-[#7fb2ff] bg-clip-text text-transparent">
                midnight bloom
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.8 }}
              className="mx-auto mt-6 max-w-2xl text-center text-sm leading-7 text-[#f7ead1]/62 sm:text-base"
            >
              The page is locked for now, but the celebration is already
              gathering itself. When the clock turns, {HER_NAME}&apos;s story
              opens in full.
            </motion.p>

            {time && (
              <div
                className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                aria-label="Countdown to reveal"
              >
                <CountdownTile value={time.days} label="days" />
                <CountdownTile value={time.hours} label="hours" />
                <CountdownTile value={time.minutes} label="minutes" />
                <CountdownTile value={time.seconds} label="seconds" />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.8 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/wish"
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#f7ead1] px-8 py-4 text-sm font-semibold text-[#071321] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Leave Cynthia a birthday wish
              </Link>
              <p className="text-center text-xs uppercase tracking-[0.24em] text-[#f7ead1]/38">
                Wishes stay private until the reveal
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
