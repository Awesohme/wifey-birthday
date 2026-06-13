"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { resetScroll, setScrollLocked } from "../smooth-scroll";

interface BirthdayCandleProps {
  onBlownOut?: () => void;
}

const CELEBRATION_MS = 1500;

export function BirthdayCandle({ onBlownOut }: BirthdayCandleProps) {
  const [blownOut, setBlownOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ReturnType<typeof confetti.create> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const firedRef = useRef(false);
  const lockedRef = useRef(false);

  const fireConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const cannon =
      confettiRef.current ??
      confetti.create(canvas, {
        resize: true,
        useWorker: false,
      });
    confettiRef.current = cannon;

    const base: confetti.Options = {
      origin: { x: 0.5, y: 0.45 },
      colors: ["#ef3340", "#ffd447", "#5c7cfa", "#ff8fab", "#ffffff", "#5fd068"],
      disableForReducedMotion: true,
    };
    const fire = (ratio: number, options: confetti.Options) =>
      cannon({
        ...base,
        particleCount: Math.floor(340 * ratio),
        ...options,
      });

    fire(0.25, { spread: 28, startVelocity: 62 });
    fire(0.25, { spread: 70, startVelocity: 52 });
    fire(0.35, { spread: 110, decay: 0.91, scalar: 0.95, startVelocity: 46 });
    fire(0.15, { spread: 130, decay: 0.92, scalar: 1.2, startVelocity: 34 });

    window.setTimeout(() => {
      fire(0.18, {
        spread: 85,
        startVelocity: 50,
        origin: { x: 0.28, y: 0.52 },
      });
      fire(0.18, {
        spread: 85,
        startVelocity: 50,
        origin: { x: 0.72, y: 0.52 },
      });
    }, 250);
  }, []);

  const playCelebrationSound = useCallback(() => {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    audioContextRef.current = context;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.42, context.currentTime + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.35);
    master.connect(context.destination);

    const noiseBuffer = context.createBuffer(
      1,
      context.sampleRate * 0.45,
      context.sampleRate
    );
    const noise = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noise.length; index += 1) {
      noise[index] =
        (Math.random() * 2 - 1) * Math.pow(1 - index / noise.length, 2.4);
    }
    const breath = context.createBufferSource();
    const breathFilter = context.createBiquadFilter();
    breath.buffer = noiseBuffer;
    breathFilter.type = "lowpass";
    breathFilter.frequency.value = 1100;
    breath.connect(breathFilter).connect(master);
    breath.start();

    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + 0.18 + index * 0.1;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.58);
      oscillator.connect(gain).connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.62);
    });

    window.setTimeout(() => {
      context.close().catch(() => {});
      if (audioContextRef.current === context) audioContextRef.current = null;
    }, 1500);
  }, []);

  const blowOut = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const heldScrollY = window.scrollY;
    setScrollLocked(true);
    lockedRef.current = true;
    resetScroll(heldScrollY);

    videoRef.current?.pause();
    setBlownOut(true);
    playCelebrationSound();
    fireConfetti();

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setScrollLocked(false);
      lockedRef.current = false;
      onBlownOut?.();
    }, CELEBRATION_MS);
  }, [fireConfetti, onBlownOut, playCelebrationSound]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lockedRef.current) setScrollLocked(false);
      confettiRef.current?.reset();
      audioContextRef.current?.close().catch(() => {});
    },
    []
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas
        ref={confettiCanvasRef}
        data-testid="birthday-confetti"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9999] size-full"
      />

      <button
        type="button"
        aria-label="Blow out the birthday candle"
        aria-pressed={blownOut}
        onClick={blowOut}
        className="group relative block h-full w-full cursor-pointer overflow-hidden bg-black text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200"
      >
        <video
          ref={videoRef}
          data-testid="birthday-candle-video"
          src="/videos/birthday-candle.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className={`absolute inset-0 h-full w-full scale-[1.16] object-cover transition duration-700 ${
            blownOut ? "opacity-40 saturate-50" : "opacity-100"
          }`}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, transparent 12%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.78) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%]"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(0,0,0,0.92) 72%, #000 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-[28%] w-[38%]"
          style={{
            background:
              "radial-gradient(ellipse at 100% 100%, #000 0%, rgba(0,0,0,0.98) 38%, transparent 76%)",
          }}
        />

        <div className="absolute inset-x-0 bottom-[8%] z-10 flex flex-col items-center px-6 text-white">
          <AnimatePresence mode="wait">
            {!blownOut ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <span
                  className="text-xs uppercase tracking-[0.38em] text-amber-100/60"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Make a wish
                </span>
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-3 rounded-full border border-white/20 bg-black/30 px-6 py-3 text-sm text-white/90 backdrop-blur-sm transition-colors group-hover:bg-black/50"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Tap the candle
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <span
                  className="text-xs uppercase tracking-[0.38em] text-white/55"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Candle out
                </span>
                <span
                  className="mt-3 text-2xl text-white md:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Make it a good one.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {blownOut && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0.35, y: 20, scaleY: 0.3 }}
              animate={{ opacity: 0, y: -170, scaleY: 2.3, x: 18 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-[37%] z-10 h-24 w-3 -translate-x-1/2 rounded-full bg-gradient-to-t from-white/35 to-transparent blur-sm"
            />
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
