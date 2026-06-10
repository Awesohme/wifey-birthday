"use client";

import { motion } from "framer-motion";

export function Butterfly({
  size = 120,
  flapDuration = 0.9,
  className = "",
}: {
  size?: number | string;
  flapDuration?: number;
  className?: string;
}) {
  const wing = {
    animate: { scaleX: [1, 0.25, 1] },
    transition: { duration: flapDuration, repeat: Infinity, ease: "easeInOut" as const },
  };

  return (
    <svg
      viewBox="-60 -55 120 110"
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: "auto",
        aspectRatio: "120 / 110",
      }}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="bf-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5d7ef0" />
          <stop offset="55%" stopColor="#2746d8" />
          <stop offset="100%" stopColor="#182768" />
        </linearGradient>
        <radialGradient id="bf-spot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ecd28a" />
          <stop offset="100%" stopColor="#d4a93c" stopOpacity="0.4" />
        </radialGradient>
      </defs>

      {/* Left wings */}
      <motion.g style={{ originX: "60px", originY: "55px" }} {...wing}>
        <path
          d="M -4 -8 C -22 -42 -52 -48 -55 -28 C -57 -12 -38 -2 -8 0 Z"
          fill="url(#bf-wing)"
          stroke="#101c4d"
          strokeWidth="1.2"
        />
        <path
          d="M -6 4 C -30 6 -46 18 -42 34 C -38 47 -16 40 -4 12 Z"
          fill="url(#bf-wing)"
          stroke="#101c4d"
          strokeWidth="1.2"
          opacity="0.92"
        />
        <circle cx="-32" cy="-24" r="6" fill="url(#bf-spot)" />
        <circle cx="-26" cy="20" r="4" fill="url(#bf-spot)" />
      </motion.g>

      {/* Right wings (mirrored) */}
      <motion.g style={{ originX: "60px", originY: "55px" }} {...wing}>
        <g transform="scale(-1,1)">
          <path
            d="M -4 -8 C -22 -42 -52 -48 -55 -28 C -57 -12 -38 -2 -8 0 Z"
            fill="url(#bf-wing)"
            stroke="#101c4d"
            strokeWidth="1.2"
          />
          <path
            d="M -6 4 C -30 6 -46 18 -42 34 C -38 47 -16 40 -4 12 Z"
            fill="url(#bf-wing)"
            stroke="#101c4d"
            strokeWidth="1.2"
            opacity="0.92"
          />
          <circle cx="-32" cy="-24" r="6" fill="url(#bf-spot)" />
          <circle cx="-26" cy="20" r="4" fill="url(#bf-spot)" />
        </g>
      </motion.g>

      {/* Body + antennae */}
      <ellipse cx="0" cy="2" rx="4" ry="17" fill="#1b1b2b" />
      <circle cx="0" cy="-17" r="4.5" fill="#1b1b2b" />
      <path d="M -2 -20 C -8 -32 -16 -36 -20 -34" fill="none" stroke="#1b1b2b" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 2 -20 C 8 -32 16 -36 20 -34" fill="none" stroke="#1b1b2b" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
