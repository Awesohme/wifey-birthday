"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { HER_NAME } from "@/lib/config";
import { preloadImages } from "@/lib/preload-images";
import { smoothScrollTo } from "../smooth-scroll";

interface HeroSectionProps {
  /** delays the name/text reveal until the film has settled */
  settled?: boolean;
  heroImage: string;
  /** optional set of photos to slowly crossfade behind the hero */
  heroImages?: string[];
}

const CROSSFADE_MS = 6500;

export function HeroSection({
  settled = true,
  heroImage,
  heroImages,
}: HeroSectionProps) {
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

  // Up to three distinct photos cycling slowly behind the hero. Falls back to
  // the single settled film frame when fewer are available.
  const photos = useMemo(() => {
    const pool = (heroImages && heroImages.length ? heroImages : [heroImage])
      .filter(Boolean)
      .filter((src, index, all) => all.indexOf(src) === index);
    return pool.slice(0, 3).length ? pool.slice(0, 3) : [heroImage];
  }, [heroImages, heroImage]);

  const reducedMotion = useReducedMotion();
  const [activePhoto, setActivePhoto] = useState(0);

  // Warm every crossfade frame up front so none pop in mid-transition.
  useEffect(() => {
    preloadImages(photos);
  }, [photos]);

  useEffect(() => {
    if (reducedMotion || photos.length < 2) return;
    const id = window.setInterval(
      () => setActivePhoto((current) => (current + 1) % photos.length),
      CROSSFADE_MS
    );
    return () => window.clearInterval(id);
  }, [photos.length, reducedMotion]);

  // the name reveals word-by-word once the film has settled
  const nameWords = HER_NAME.split(" ");

  return (
    <section ref={ref} className="relative min-h-dvh flex flex-col overflow-hidden bg-[#06222f]">
      {/* Settled film frames crossfading as the hero background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ scale: bgScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: settled ? 1 : 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        {photos.map((src, index) => (
          <motion.div
            key={src}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: index === activePhoto ? 1 : 0 }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote hero photo, unknown dims */}
            <img
              src={src}
              alt=""
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
              className="size-full object-cover"
              style={{ filter: "brightness(0.6) saturate(1.05)" }}
            />
          </motion.div>
        ))}
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

        <h1
          className="leading-[0.92] tracking-[-0.03em] text-white font-normal"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(4rem, 13vw, 11rem)",
          }}
        >
          <span className="flex flex-wrap justify-center gap-x-[0.28em]">
            {nameWords.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                className="inline-block"
                initial={{ opacity: 0, y: 44, rotate: 2 }}
                animate={settled ? { opacity: 1, y: 0, rotate: 0 } : {}}
                transition={{
                  delay: 0.5 + index * 0.18,
                  duration: 0.9,
                  ease: [0.2, 0.7, 0.2, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </span>
          <motion.em
            className="block mt-2"
            style={{
              color: "hsl(0 0% 78%)",
              fontSize: "0.42em",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={settled ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 + nameWords.length * 0.18, duration: 0.9 }}
          >
            the whole world, in one person
          </motion.em>
        </h1>

        <motion.p
          className="mt-8 text-base sm:text-lg leading-relaxed max-w-xl"
          style={{ fontFamily: "var(--font-body)", color: "hsl(0 0% 80%)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={settled ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          Everyone who loves you gathered here — across cities, time zones, and
          hearts — to say the one thing that never changes. This was made for
          you.
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
