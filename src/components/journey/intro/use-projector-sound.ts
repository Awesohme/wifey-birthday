"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Procedural 8mm-projector sound: a rhythmic mechanical clatter plus a soft
 * vinyl/film crackle bed, generated with the Web Audio API (no asset files).
 * Browsers block autoplay audio, so this only starts after a user gesture —
 * the intro wires `enable()` to its first click/tap and a mute toggle.
 */
export function useProjectorSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{ stop: () => void }[]>([]);
  const [muted, setMuted] = useState(true);
  const startedRef = useRef(false);
  const gestureEnabledRef = useRef(false);

  const buildCrackle = useCallback((ctx: AudioContext, master: GainNode) => {
    // Two layers: a steady warm hiss bed + frequent crackle pops, so it's
    // clearly audible (a sparse-pop-only bed reads as silence on laptops).
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const pop = Math.random() < 0.006 ? (Math.random() * 2 - 1) : 0;
      data[i] = pop * 0.9 + (Math.random() * 2 - 1) * 0.18; // hiss floor much higher
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    // gentle low-pass so it's a warm hiss, not harsh white noise
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    const g = ctx.createGain();
    g.gain.value = 0.8;
    src.connect(lp).connect(g).connect(master);
    src.start();
    return { stop: () => src.stop() };
  }, []);

  const buildClatter = useCallback((ctx: AudioContext, master: GainNode) => {
    // ~16 fps mechanical tick via a short filtered noise burst on an interval
    const g = ctx.createGain();
    g.gain.value = 1.0;
    g.connect(master);
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      const burst = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      burst.buffer = b;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100 + Math.random() * 400;
      const eg = ctx.createGain();
      eg.gain.setValueAtTime(0.0, t);
      eg.gain.linearRampToValueAtTime(1.0, t + 0.004);
      eg.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      burst.connect(lp).connect(eg).connect(g);
      burst.start(t);
      burst.stop(t + 0.08);
    };
    const id = setInterval(tick, 1000 / 16);
    return { stop: () => { stopped = true; clearInterval(id); } };
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0; // start silent (muted)
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
    nodesRef.current = [buildCrackle(ctx, master), buildClatter(ctx, master)];
  }, [buildCrackle, buildClatter]);

  const setVolume = useCallback((v: number) => {
    const m = masterRef.current;
    const ctx = ctxRef.current;
    if (m && ctx) {
      m.gain.cancelScheduledValues(ctx.currentTime);
      m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
      m.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.3);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (!startedRef.current) start();
      // resume first (returns a promise on some browsers), then set gain
      const ctx = ctxRef.current;
      const apply = () => setVolume(next ? 0 : 0.45);
      if (ctx && ctx.state === "suspended") {
        ctx.resume().then(apply).catch(apply);
      } else {
        apply();
      }
      return next;
    });
  }, [start, setVolume]);

  // ensure audio context is resumed/created on the first user gesture
  const enableOnGesture = useCallback(() => {
    if (gestureEnabledRef.current) return;
    gestureEnabledRef.current = true;
    if (!startedRef.current) start();
    setMuted(false);
    const ctx = ctxRef.current;
    const apply = () => setVolume(0.45);
    if (ctx?.state === "suspended") {
      ctx.resume().then(apply).catch(apply);
    } else {
      apply();
    }
  }, [setVolume, start]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => {
        try { n.stop(); } catch { /* already stopped */ }
      });
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { muted, toggleMute, enableOnGesture };
}
