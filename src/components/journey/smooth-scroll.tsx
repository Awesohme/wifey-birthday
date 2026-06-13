"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Module-level handle so other components can drive smooth scrolling through
// the same Lenis instance.
let lenisInstance: Lenis | null = null;
let scrollLocked = false;

/** Smooth-scroll to an absolute Y (or element) via Lenis, falling back to native. */
export function smoothScrollTo(
  target: number | HTMLElement,
  opts?: { immediate?: boolean; offset?: number; onComplete?: () => void }
) {
  const absoluteTarget =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY;

  if (lenisInstance) {
    lenisInstance.scrollTo(absoluteTarget, {
      immediate: opts?.immediate,
      offset: opts?.offset ?? 0,
      duration: 1.2,
      force: true,
      lock: !opts?.immediate,
      onComplete: opts?.onComplete,
    });
  } else {
    window.scrollTo({
      top: absoluteTarget + (opts?.offset ?? 0),
      behavior: opts?.immediate ? "auto" : "smooth",
    });
    opts?.onComplete?.();
  }
}

export function smoothScrollBy(delta: number) {
  const top = window.scrollY + delta;
  smoothScrollTo(top);
}

/**
 * Lock/unlock scroll while the film overlay is active.
 */
export function setScrollLocked(locked: boolean) {
  if (typeof document === "undefined") return;
  scrollLocked = locked;
  document.documentElement.style.overflow = locked ? "hidden" : "";
  document.body.style.overflow = locked ? "hidden" : "";
  if (lenisInstance) {
    if (locked) lenisInstance.stop();
    else lenisInstance.start();
  }
}

/**
 * Hard-reset scroll to an absolute position, forcing Lenis's internal value
 * and the DOM to agree. Use this right before/after locking so the film
 * always settles exactly on the hero.
 */
export function resetScroll(y = 0) {
  if (lenisInstance) {
    lenisInstance.resize();
    // Lenis can have targetScroll at zero while animatedScroll still contains
    // an interrupted destination. Set both public positions before the native
    // write so the next element navigation cannot inherit that stale value.
    lenisInstance.targetScroll = y;
    lenisInstance.animatedScroll = y;
  }
  window.scrollTo(0, y);
  lenisInstance?.scrollTo(y, { immediate: true, force: true });
}

/**
 * Smooth-scroll provider. Lenis eases the native scroll position — it still
 * writes real window.scrollY, so position: sticky and framer-motion useScroll
 * (which the WebGL fly-through depends on) keep working. Disabled for reduced
 * motion. Exposes the instance via the module helpers above.
 */
export function SmoothScroll() {
  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      return () => {
        history.scrollRestoration = previousRestoration;
      };
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;
    if (scrollLocked) lenis.stop();

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  return null;
}
