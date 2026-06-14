"use client";

import { WarpText } from "../primitives/warp-text";
import { BirthdayCandle } from "../candle/birthday-candle";
import { smoothScrollTo } from "../smooth-scroll";
import { SlidingWishes } from "@/components/ui/sliding-wishes";
import { HER_NAME } from "@/lib/config";
import type { Wish } from "@/lib/config";

interface FinaleProps {
  wishes: Wish[];
}

export function FinaleSection({ wishes }: FinaleProps) {
  const handleBlownOut = () => {
    const grid = document.getElementById("wishes-grid");
    if (grid) smoothScrollTo(grid, { offset: -20 });
  };

  return (
    <section id="gallery" style={{ backgroundColor: "#05080f" }}>
      {/* ── Candle room — one viewport tall. The candle is a MOMENT, not a
            wall: the wishes below are always reachable by scrolling, and
            blowing the candle out simply glides you down to them. ───────── */}
      <div className="relative flex h-dvh items-center justify-center">
        <BirthdayCandle onBlownOut={handleBlownOut} />
      </div>

      {/* ── The wishes — always in flow, directly below the candle room.
            Always visible/scrollable; never an invisible trap. ──────────── */}
      <div id="wishes-grid" className="px-4 pb-24 pt-16 md:px-8">
        {/* header */}
        <div className="mx-auto mb-14 max-w-7xl text-center">
          <span
            className="mb-4 block text-xs uppercase tracking-[0.3em] text-white/30"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The gallery of love
          </span>
          <WarpText
            text="Here’s some wishes for you."
            tag="h2"
            className="text-5xl text-white md:text-7xl"
            intensity={0.7}
          />
        </div>

        <SlidingWishes wishes={wishes} />

        {/* footer */}
        <footer className="mt-24 text-center">
          <p
            className="text-xs uppercase tracking-widest text-white/20"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Made with ✦ for {HER_NAME}
          </p>
        </footer>
      </div>
    </section>
  );
}
