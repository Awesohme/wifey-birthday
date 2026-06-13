"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface PhotoCardProps {
  src: string;
  alt?: string;
  offsetY?: number;
}

export function PhotoCard({ src, alt = "", offsetY = 0 }: PhotoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 45%"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, marginTop: offsetY }}
      className="break-inside-avoid mb-6 group"
    >
      <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote/static gallery media, unknown dimensions */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full object-cover grayscale-[0.35] group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-700 ease-out"
        />
      </div>
    </motion.div>
  );
}
