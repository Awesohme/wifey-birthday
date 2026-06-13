"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HER_NAME } from "@/lib/config";
import { smoothScrollTo } from "../smooth-scroll";

interface HeroSectionProps {
  /** delays the name/text reveal until the film has settled */
  settled?: boolean;
  heroImage: string;
}

export function HeroSection({ settled = true, heroImage }: HeroSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  // gentle Ken Burns on the settled film frame
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);

  return (
    <section ref={ref} className="relative min-h-dvh flex flex-col overflow-hidden bg-[#06222f]">
      {/* Settled film frame as hero background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ scale: bgScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: settled ? 1 : 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote hero photo, unknown dims */}
        <img
          src={heroImage}
          alt=""
          className="size-full object-cover"
          style={{ filter: "brightness(0.6) saturate(1.05)" }}
        />
      </motion.div>

      {/* Ken Burns drift + grade overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,34,47,0.35) 0%, rgba(6,34,47,0.1) 40%, rgba(6,34,47,0.9) 100%)",
        }}
      />

      {/* Hero content */}
      <motion.div
        style={{ y: contentY, scale: contentScale, opacity: contentOpacity }}
        className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 pt-32 pb-40"
      >
        <motion.p
          className="text-xs tracking-[0.25em] uppercase text-white/50 mb-6"
          style={{ fontFamily: "var(--font-body)" }}
          initial={{ opacity: 0, y: 18 }}
          animate={settled ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          June 22, 2026
        </motion.p>

        <motion.h1
          className="leading-[0.92] tracking-[-0.03em] text-white font-normal"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(4rem, 13vw, 11rem)",
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={settled ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {HER_NAME}
          <em
            className="block mt-2"
            style={{
              color: "hsl(0 0% 78%)",
              fontSize: "0.42em",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
            }}
          >
            the whole world, in one person
          </em>
        </motion.h1>

        <motion.p
          className="mt-8 text-base sm:text-lg leading-relaxed max-w-xl"
          style={{ fontFamily: "var(--font-body)", color: "hsl(0 0% 80%)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={settled ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          The people who love her most gathered here — across cities, time
          zones, and hearts — to say the one thing that never changes.
        </motion.p>

        <motion.button
          className="liquid-glass rounded-full mt-12 px-14 py-5 text-base text-white cursor-pointer"
          whileHover={{ scale: 1.03 }}
          initial={{ opacity: 0, y: 20 }}
          animate={settled ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.8 }}
          onClick={() => {
            const story = document.getElementById("story");
            if (story) smoothScrollTo(story);
          }}
        >
          Begin
        </motion.button>
        <motion.a
          href="/wish"
          className="mt-5 text-xs uppercase tracking-[0.24em] text-white/50 underline decoration-white/20 underline-offset-8 transition hover:text-white"
          initial={{ opacity: 0 }}
          animate={settled ? { opacity: 1 } : {}}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          Leave her a wish
        </motion.a>
      </motion.div>

      <div className="relative z-10 flex justify-center pb-8">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/30 text-2xl select-none"
          aria-hidden
        >
          ↓
        </motion.div>
      </div>
    </section>
  );
}
