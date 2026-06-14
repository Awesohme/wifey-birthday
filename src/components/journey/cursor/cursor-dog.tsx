"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

const DOG_SIZE = 96;

export function CursorDog() {
  // Only show on devices with a real pointer — start hidden to avoid an SSR
  // hydration mismatch, then confirm on the client. Touch devices have no
  // cursor for the puppy to follow, so it just flashes on tap.
  const [pointerFine, setPointerFine] = useState(false);
  const [visible, setVisible] = useState(false);
  const [facingRight, setFacingRight] = useState(true);

  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  const x = useSpring(mouseX, { stiffness: 120, damping: 18, mass: 0.8 });
  const y = useSpring(mouseY, { stiffness: 120, damping: 18, mass: 0.8 });

  const velocityX = useVelocity(x);
  const rotate = useTransform(velocityX, [-1500, 0, 1500], [-12, 0, 12]);

  useMotionValueEvent(velocityX, "change", (v) => {
    if (Math.abs(v) > 20) setFacingRight(v > 0);
  });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setPointerFine(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!pointerFine) return;

    const onMove = (e: PointerEvent) => {
      mouseX.set(e.clientX - DOG_SIZE / 2 + 40);
      mouseY.set(e.clientY - DOG_SIZE / 2 + 40);
      setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, [mouseX, mouseY, pointerFine]);

  if (!pointerFine) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9998] pointer-events-none"
      style={{ x, y, rotate }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ opacity: { duration: 0.3 } }}
    >
      <motion.div
        style={{
          transform: facingRight ? "scaleX(-1)" : "scaleX(1)",
          width: DOG_SIZE,
          height: DOG_SIZE,
        }}
      >
        <div className="idle-bob">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static asset */}
          <img
            src="/cursor-dog.png"
            alt="A puppy following the cursor"
            width={DOG_SIZE}
            height={DOG_SIZE}
            draggable={false}
            className="pointer-events-none select-none"
            style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.18))" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
