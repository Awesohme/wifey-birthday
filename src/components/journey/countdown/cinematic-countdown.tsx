"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HER_NAME, UNLOCK_AT } from "@/lib/config";
import { WishButton } from "./wish-button";

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

/* ---------------------------------------------------------------- */
/* Living night sky: twinkling stars + rare shooting stars + drift  */
/* ---------------------------------------------------------------- */
function StarField({
  parallax,
  reduced = false,
}: {
  parallax: { x: number; y: number };
  reduced?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parallaxRef = useRef(parallax);

  useEffect(() => {
    parallaxRef.current = parallax;
  }, [parallax]);

  useEffect(() => {
    // Never run the animation loop under reduced motion.
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = {
      x: number;
      y: number;
      r: number;
      depth: number; // 0..1 — closer stars parallax more
      base: number;
      tw: number; // twinkle phase
      tws: number; // twinkle speed
      gold: boolean;
    };
    type Shooter = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      len: number;
    };

    let stars: Star[] = [];
    const shooters: Shooter[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Cap lower on small/mobile viewports to spare weak GPUs.
      const cap = w < 640 ? 90 : 220;
      const count = Math.min(cap, Math.floor((w * h) / 5200));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.4 + depth * 1.5,
          depth,
          base: 0.25 + Math.random() * 0.6,
          tw: Math.random() * Math.PI * 2,
          tws: 0.6 + Math.random() * 1.6,
          gold: Math.random() < 0.16,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    let sinceShooter = 0;
    let nextShooter = 5 + Math.random() * 9;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const { x: px, y: py } = parallaxRef.current;

      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const tw = (Math.sin(s.tw + t * s.tws) + 1) / 2;
        const alpha = Math.max(0, s.base * (0.4 + 0.6 * tw));
        const ox = s.x + px * s.depth * 26;
        const oy = s.y + py * s.depth * 26;
        ctx.beginPath();
        ctx.arc(ox, oy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(225,191,122,${alpha})`
          : `rgba(235,242,255,${alpha})`;
        ctx.shadowBlur = s.gold ? 8 : 4;
        ctx.shadowColor = s.gold
          ? "rgba(214,179,107,0.7)"
          : "rgba(180,205,255,0.6)";
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // spawn shooting stars on a relaxed random cadence
      sinceShooter += dt;
      if (sinceShooter > nextShooter) {
        sinceShooter = 0;
        nextShooter = 7 + Math.random() * 12;
        const fromLeft = Math.random() < 0.5;
        const speed = 520 + Math.random() * 260;
        const angle = (Math.PI / 7) + Math.random() * (Math.PI / 9);
        shooters.push({
          x: fromLeft ? -40 : w + 40,
          y: Math.random() * h * 0.5,
          vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          len: 120 + Math.random() * 90,
        });
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life -= dt * 0.55;
        if (
          sh.life <= 0 ||
          sh.x < -120 ||
          sh.x > w + 120 ||
          sh.y > h + 120
        ) {
          shooters.splice(i, 1);
          continue;
        }
        const mag = Math.hypot(sh.vx, sh.vy);
        const tx = sh.x - (sh.vx / mag) * sh.len;
        const ty = sh.y - (sh.vy / mag) * sh.len;
        const grad = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
        grad.addColorStop(0, `rgba(247,234,209,${0.9 * sh.life})`);
        grad.addColorStop(0.4, `rgba(214,179,107,${0.4 * sh.life})`);
        grad.addColorStop(1, "rgba(214,179,107,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(247,234,209,${sh.life})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* ---------------------------------------------------------------- */
/* Rising fireflies — slow warm motes drifting upward               */
/* ---------------------------------------------------------------- */
function Fireflies({ mounted }: { mounted: boolean }) {
  // Random positions computed once. They are only rendered after mount, so the
  // SSR markup (empty) and first client render match — no hydration mismatch.
  const [flies] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 60,
    })),
  );

  if (!mounted) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {flies.map((f) => (
        <motion.span
          key={f.id}
          className="absolute bottom-[-10px] rounded-full"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            background:
              "radial-gradient(circle, rgba(247,234,209,0.95) 0%, rgba(214,179,107,0.5) 45%, transparent 70%)",
            boxShadow: "0 0 8px rgba(214,179,107,0.8)",
          }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: "-110vh",
            x: [0, f.drift, -f.drift * 0.6, 0],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** A single large serif numeral that flips up, with a shimmer sweep + reflection. */
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
            {/* shimmer sweep that fires on each value change */}
            {!reduced && (
              <motion.span
                key={`shine-${display}`}
                aria-hidden
                className="absolute inset-0"
                initial={{ x: "-130%" }}
                animate={{ x: "130%" }}
                transition={{ duration: 0.85, ease: "easeInOut" }}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 38%, rgba(255,243,214,0.65) 50%, transparent 62%)",
                  mixBlendMode: "screen",
                }}
              />
            )}
          </motion.span>
        </AnimatePresence>
      </div>
      {/* faint reflection beneath, like still water */}
      <div
        aria-hidden
        className="relative h-[clamp(1rem,4vw,2.2rem)] w-[clamp(3rem,11vw,6rem)] overflow-hidden opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      >
        <span
          className="absolute inset-x-0 top-[-100%] flex items-start justify-center tabular-nums text-[clamp(3rem,10vw,6rem)] leading-none text-[#f7ead1]"
          style={{ fontFamily: "var(--font-serif)", transform: "scaleY(-1)" }}
        >
          {display}
        </span>
      </div>
      <span className="mt-2 text-[0.6rem] uppercase tracking-[0.4em] text-[#f7ead1]/42 sm:text-[0.65rem]">
        {label}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Zero-hour bloom: stars rush forward, golden flash, name forms    */
/* ---------------------------------------------------------------- */
function RevealBloom({ reduced }: { reduced: boolean }) {
  const router = useRouter();
  const letters = `Happy Birthday, ${HER_NAME}`.split("");

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* golden flash bloom */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(247,234,209,0.9),_rgba(214,179,107,0.35)_35%,_transparent_70%)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.5] }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      )}

      <motion.h1
        className="relative flex flex-wrap justify-center text-[clamp(2.6rem,9vw,6rem)] font-black leading-[0.88] tracking-[-0.04em] text-[#f7ead1]"
        style={{
          fontFamily: "var(--font-display)",
          textShadow: "0 0 40px rgba(214,179,107,0.5)",
        }}
      >
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, y: 26, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.5 + i * 0.045, duration: 0.6 }}
            className={ch === " " ? "w-3 sm:w-5" : ""}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        ))}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + letters.length * 0.045 + 0.4, duration: 0.8 }}
        className="mt-12"
      >
        <WishButton
          href="/"
          // Re-run the server check (isUnlocked) before navigating so a click
          // the instant the clock flips can never land back on the countdown.
          onClick={() => router.refresh()}
        >
          Open my surprise
        </WishButton>
      </motion.div>
    </motion.div>
  );
}

export function CinematicCountdown() {
  const reduced = Boolean(useReducedMotion());
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  // `time` is null on the server and set on first client tick — use it as the
  // mounted signal so client-only visuals (starfield/fireflies) hydrate cleanly.
  const mounted = time !== null;

  useEffect(() => {
    const tick = () => {
      const next = remaining();
      setTime(next);
      if (next.done) setRevealed(true);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // mouse + device-tilt parallax (skipped when reduced motion is set)
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x, y });
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      const x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
      const y = Math.max(-1, Math.min(1, ((e.beta ?? 0) - 45) / 30));
      setParallax({ x, y });
    };
    window.addEventListener("pointermove", onMove);

    // iOS 13+ gates deviceorientation behind a permission prompt that must be
    // triggered by a user gesture — attaching the listener here would just sit
    // dead. Only wire tilt where it can actually fire; pointer parallax covers
    // the rest, so the effect degrades gracefully.
    const orientationGated =
      typeof (
        DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<string>;
        }
      )?.requestPermission === "function";
    if (!orientationGated) {
      window.addEventListener("deviceorientation", onTilt);
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [reduced]);

  const drift = (depth: number) => ({
    transform: reduced
      ? undefined
      : `translate3d(${parallax.x * depth}px, ${parallax.y * depth}px, 0)`,
  });

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050d19] px-6 py-16 text-center text-[#f7ead1]">
      {/* deep night base */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,40,78,0.9)_0%,_#070f1d_46%,_#04080f_100%)]"
      />

      {/* living starfield + shooting stars */}
      {!reduced && mounted && <StarField parallax={parallax} reduced={reduced} />}

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

      {/* rising fireflies */}
      {!reduced && <Fireflies mounted={mounted} />}

      <AnimatePresence mode="wait">
        {revealed ? (
          <RevealBloom key="bloom" reduced={reduced} />
        ) : (
          <motion.div
            key="countdown"
            exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex w-full max-w-3xl flex-col items-center"
            style={drift(8)}
          >
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative text-[0.62rem] uppercase tracking-[0.5em] text-[#d6b36b]/72 sm:text-[0.7rem]"
            >
              {!reduced && (
                <motion.span
                  aria-hidden
                  className="absolute -inset-x-6 -inset-y-3 -z-10 rounded-full bg-[#d6b36b]/10 blur-xl"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              22 June · Midnight reveal
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.9 }}
              className="mt-7 flex flex-wrap justify-center text-[clamp(3.6rem,13vw,8.5rem)] font-black leading-[0.82] tracking-[-0.05em]"
              style={{ fontFamily: "var(--font-display)", ...drift(16) }}
            >
              {HER_NAME.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.7 }}
                  style={{ textShadow: "0 0 40px rgba(214,179,107,0.3)" }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.h1>

            {time && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.9 }}
                className="mt-14 flex items-start justify-center gap-4 sm:gap-9"
                style={drift(5)}
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
              <WishButton href="/wish">
                Leave {HER_NAME} a birthday wish
              </WishButton>
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[#f7ead1]/32">
                Wishes stay private until the reveal
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
