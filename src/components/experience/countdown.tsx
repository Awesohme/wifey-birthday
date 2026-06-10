"use client";

import { useEffect, useState } from "react";
import { HER_NAME, UNLOCK_AT } from "@/lib/config";
import { Butterfly } from "./butterfly";

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

export function Countdown() {
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    const tick = () => {
      const t = remaining();
      setTime(t);
      // The server decides the real unlock; reload to let it switch views
      if (t.done) window.location.reload();
    };
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-royal-900 via-royal-700 to-leaf-900 px-6 text-center text-white">
      <div className="hover-drift opacity-90">
        <Butterfly size={150} flapDuration={1.4} />
      </div>
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">
          Something is growing for you, {HER_NAME}…
        </h1>
        <p className="mt-3 text-sm text-white/60">It blooms at midnight on June 22.</p>
      </div>
      {time && (
        <div className="flex gap-3 sm:gap-4" aria-label="Countdown to the reveal">
          {(
            [
              [time.days, "days"],
              [time.hours, "hrs"],
              [time.minutes, "min"],
              [time.seconds, "sec"],
            ] as const
          ).map(([value, label]) => (
            <div
              key={label}
              className="w-16 rounded-2xl bg-white/10 py-3 backdrop-blur sm:w-20"
            >
              <div className="font-display text-2xl tabular-nums sm:text-3xl">
                {String(value).padStart(2, "0")}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="max-w-xs text-xs leading-relaxed text-white/40">
        Patience, butterfly. The meadow isn&apos;t ready to be seen just yet. 🦋
      </p>
    </main>
  );
}
