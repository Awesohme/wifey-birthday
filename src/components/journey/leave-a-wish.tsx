"use client";

import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Subtle floating button so guests can keep adding wishes.
 * Hides over the hero (where the page's own CTA lives) and fades in
 * once you've scrolled past it.
 */
export function LeaveAWish() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400, 600], [0, 0, 1]);
  const scale = useTransform(scrollY, [400, 600], [0.9, 1]);

  return (
    <motion.div
      style={{ opacity, scale, position: "fixed", bottom: 24, right: 24, zIndex: 60 }}
    >
      <a
        href="/wish"
        className="liquid-glass flex items-center gap-2 rounded-full px-5 py-3 text-sm text-white shadow-lg hover:scale-[1.04] transition-transform"
      >
        <span aria-hidden>✎</span>
        <span style={{ fontFamily: "var(--font-body)" }}>Leave a wish</span>
      </a>
    </motion.div>
  );
}
