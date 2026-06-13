"use client";

import {
  motion,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  useAnimationFrame,
  type MotionValue,
} from "framer-motion";

interface WarpCharProps {
  char: string;
  index: number;
  skewX: MotionValue<number>;
  scaleY: MotionValue<number>;
  time: MotionValue<number>;
  intensity: number;
}

function WarpChar({ char, index, skewX, scaleY, time, intensity }: WarpCharProps) {
  const charSkewX = useTransform(skewX, (v) => v * (1 + (index % 4) * 0.12));
  const charScaleY = useTransform(scaleY, (v) => v - (index % 3 === 0 ? 0.02 : 0));
  // Gentle idle undulation, phase-offset per character.
  // Amplitude ramps from 0 so SSR (t=0) and client agree exactly.
  const y = useTransform(time, (t) => {
    const ramp = Math.min(t, 1);
    return Math.sin(t * 1.6 + index * 0.55) * 3 * intensity * ramp;
  });

  if (char === " ") return <span> </span>;

  return (
    <motion.span
      className="inline-block will-change-transform"
      style={{ skewX: charSkewX, scaleY: charScaleY, y }}
    >
      {char}
    </motion.span>
  );
}

interface WarpTextProps {
  text: string;
  className?: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  intensity?: number;
  serif?: boolean;
}

export function WarpText({
  text,
  className = "",
  tag = "p",
  intensity = 1,
  serif = true,
}: WarpTextProps) {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);

  const smoothVelocity = useSpring(rawVelocity, { stiffness: 400, damping: 90 });

  const skewX = useTransform(
    smoothVelocity,
    [-2500, 0, 2500],
    [-16 * intensity, 0, 16 * intensity]
  );

  const scaleY = useTransform(
    smoothVelocity,
    [-2500, 0, 2500],
    [0.85, 1, 0.85]
  );

  const time = useMotionValue(0);
  useAnimationFrame((t) => {
    if (!prefersReduced) time.set(t / 1000);
  });

  const Tag = tag;
  const fontStyle = serif ? { fontFamily: "var(--font-serif)" } : undefined;

  if (prefersReduced) {
    return (
      <Tag className={className} style={fontStyle}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={className} style={fontStyle}>
      <span aria-hidden>
        {text.split("").map((char, i) => (
          <WarpChar
            key={i}
            char={char}
            index={i}
            skewX={skewX}
            scaleY={scaleY}
            time={time}
            intensity={intensity}
          />
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
