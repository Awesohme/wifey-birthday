"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { HER_NAME } from "@/lib/config";
import { smoothScrollTo } from "../smooth-scroll";

interface LiquidGlassNavProps {
  onReplayIntro?: () => void;
}

export function LiquidGlassNav({ onReplayIntro }: LiquidGlassNavProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 80], [1, 0]);

  return (
    <motion.nav
      style={{ opacity }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full pointer-events-none"
    >
      <span
        className="text-base italic tracking-tight text-white/80 pointer-events-auto"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        for {HER_NAME} <span className="not-italic text-xs align-super">✦</span>
      </span>

      <div className="flex items-center gap-3">
        {onReplayIntro && (
          <button
            onClick={onReplayIntro}
            className="pointer-events-auto text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white/90 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            ↺ replay
          </button>
        )}
        <button
          className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] transition-transform pointer-events-auto"
          onClick={() => {
            const gallery = document.getElementById("gallery");
            if (gallery) smoothScrollTo(gallery);
          }}
        >
          See the wishes →
        </button>
      </div>
    </motion.nav>
  );
}
