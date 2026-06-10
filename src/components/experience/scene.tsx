"use client";

import { motion } from "framer-motion";
import type { Wish } from "@/lib/config";

/*
 * The scene lives in a 1000x1000 viewBox, rendered with
 * preserveAspectRatio="xMidYMax slice" so it always fills the screen.
 * Everything important sits in the "safe zone" (x 280-720, y 380-1000)
 * which survives both portrait-phone and wide-desktop crops.
 */

const ANCHORS: [number, number, number][] = [
  // [x, y, string length]
  [400, 480, 52],
  [500, 445, 60],
  [595, 475, 48],
  [350, 555, 56],
  [455, 545, 44],
  [555, 560, 58],
  [648, 545, 50],
  [385, 640, 46],
  [505, 645, 54],
  [615, 635, 44],
  [320, 470, 42],
  [675, 460, 46],
];

function anchorFor(i: number): [number, number, number] {
  const [x, y, len] = ANCHORS[i % ANCHORS.length];
  const round = Math.floor(i / ANCHORS.length);
  // Extra rounds nest between the originals, slightly higher with longer strings
  return round === 0 ? [x, y, len] : [x + 24 * round, y - 18 * round, len + 26 * round];
}

const CHARM_COLORS = [
  { fill: "url(#charm-royal)", rim: "#ecd28a" },
  { fill: "url(#charm-gold)", rim: "#c0d0fb" },
];

function Ornament({
  wish,
  index,
  opened,
  onOpen,
  appearDelay,
}: {
  wish: Wish;
  index: number;
  opened: boolean;
  onOpen: () => void;
  appearDelay: number;
}) {
  const [x, y, len] = anchorFor(index);
  const colors = CHARM_COLORS[index % CHARM_COLORS.length];

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: appearDelay, duration: 0.7 }}
    >
      <g transform={`translate(${x} ${y})`}>
        <g
          className="ornament-sway"
          style={{ animationDuration: `${2.6 + (index % 5) * 0.45}s`, animationDelay: `${(index % 7) * -0.6}s` }}
        >
          <line x1="0" y1="0" x2="0" y2={len} stroke="#7a5a38" strokeWidth="1.6" />
          <g
            role="button"
            tabIndex={0}
            aria-label={`Open the wish from ${wish.name}`}
            className="cursor-pointer outline-none"
            onClick={onOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }}
          >
            {/* generous invisible tap target */}
            <circle cx="0" cy={len + 16} r="30" fill="transparent" />
            {/* faceted charm */}
            <g transform={`translate(0 ${len + 16})`}>
              {opened && <circle r="24" fill="#ecd28a" opacity="0.35" />}
              <polygon
                points="0,-16 12,0 0,16 -12,0"
                fill={colors.fill}
                stroke={opened ? "#d4a93c" : colors.rim}
                strokeWidth={opened ? 2.5 : 1.5}
              />
              <polygon points="0,-16 12,0 0,2 -12,0" fill="#ffffff" opacity="0.18" />
              <circle
                className="sparkle"
                cx="-5"
                cy="-6"
                r="2.4"
                fill="#fff"
                style={{ animationDelay: `${(index % 6) * 0.4}s` }}
              />
              <circle
                className="sparkle"
                cx="6"
                cy="5"
                r="1.6"
                fill="#ecd28a"
                style={{ animationDelay: `${(index % 4) * 0.55 + 0.3}s` }}
              />
            </g>
          </g>
        </g>
      </g>
    </motion.g>
  );
}

function Flowers() {
  const flowers: React.ReactNode[] = [];
  for (let i = 0; i < 38; i++) {
    // deterministic pseudo-random scatter across the meadow
    const x = 40 + ((i * 173) % 920);
    const y = 845 + ((i * 97) % 130);
    const blue = i % 3 !== 0;
    const s = 0.7 + ((i * 31) % 10) / 14;
    flowers.push(
      <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#3e7a3e" strokeWidth="1.5" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-19"
            rx="3.2"
            ry="5"
            transform={`rotate(${a} 0 -14)`}
            fill={blue ? "#3a5be4" : "#fdfdf6"}
            opacity="0.9"
          />
        ))}
        <circle cx="0" cy="-14" r="2.6" fill="#ecd28a" />
      </g>
    );
  }
  return <>{flowers}</>;
}

export function Scene({
  wishes,
  openedIds,
  onOpen,
  revealOrnaments,
}: {
  wishes: Wish[];
  openedIds: Set<string>;
  onOpen: (wish: Wish) => void;
  revealOrnaments: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 size-full"
      aria-label="A meadow with a wish tree"
      role="img"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aed5f2" />
          <stop offset="62%" stopColor="#e6f2e3" />
          <stop offset="100%" stopColor="#f6f3d8" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ab86a" />
          <stop offset="100%" stopColor="#3f8a44" />
        </linearGradient>
        <radialGradient id="canopy-light" cx="0.38" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#8fce86" />
          <stop offset="55%" stopColor="#4d9e4f" />
          <stop offset="100%" stopColor="#2f7038" />
        </radialGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a623c" />
          <stop offset="55%" stopColor="#6e4c2c" />
          <stop offset="100%" stopColor="#56391f" />
        </linearGradient>
        <radialGradient id="charm-royal" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#5d7ef0" />
          <stop offset="100%" stopColor="#1f37ad" />
        </radialGradient>
        <radialGradient id="charm-gold" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#f3e2ae" />
          <stop offset="100%" stopColor="#c09230" />
        </radialGradient>
      </defs>

      {/* Sky + sun */}
      <rect width="1000" height="830" fill="url(#sky)" />
      <circle cx="790" cy="190" r="70" fill="#fff7d6" opacity="0.9" />
      <circle cx="790" cy="190" r="120" fill="#fff7d6" opacity="0.3" />

      {/* Distant hills */}
      <path d="M 0 760 Q 220 660 480 745 T 1000 720 V 840 H 0 Z" fill="#9ccb8a" opacity="0.7" />
      <path d="M 0 800 Q 300 715 620 790 T 1000 770 V 860 H 0 Z" fill="#86bd75" opacity="0.85" />

      {/* Meadow ground */}
      <path d="M 0 820 Q 250 790 500 812 T 1000 805 V 1000 H 0 Z" fill="url(#ground)" />

      {/* Tree */}
      <g>
        <ellipse cx="500" cy="880" rx="190" ry="26" fill="#2f6a33" opacity="0.35" />
        <path
          d="M 482 875 C 486 760 478 700 470 650 C 510 690 496 780 514 875 Z
             M 488 700 C 460 660 430 640 415 600 C 450 625 475 650 492 680 Z
             M 502 690 C 530 645 560 625 580 595 C 555 635 525 665 508 700 Z"
          fill="url(#trunk)"
        />
        <rect x="478" y="840" width="40" height="40" fill="url(#trunk)" />
        {/* Canopy: overlapping blobs for a lush look */}
        <ellipse cx="500" cy="520" rx="215" ry="165" fill="url(#canopy-light)" />
        <ellipse cx="370" cy="565" rx="120" ry="95" fill="url(#canopy-light)" />
        <ellipse cx="635" cy="555" rx="115" ry="92" fill="url(#canopy-light)" />
        <ellipse cx="445" cy="425" rx="115" ry="88" fill="url(#canopy-light)" />
        <ellipse cx="575" cy="435" rx="100" ry="80" fill="url(#canopy-light)" />
        {/* Highlights */}
        <ellipse cx="430" cy="450" rx="70" ry="48" fill="#a4dd9a" opacity="0.45" />
        <ellipse cx="585" cy="500" rx="55" ry="38" fill="#a4dd9a" opacity="0.35" />
      </g>

      <Flowers />

      {/* Grass tufts along the bottom */}
      {Array.from({ length: 24 }, (_, i) => {
        const gx = 20 + i * 42;
        return (
          <path
            key={i}
            d={`M ${gx} 1000 q 4 -28 8 0 M ${gx + 10} 1000 q 5 -36 10 0 M ${gx + 22} 1000 q 4 -24 8 0`}
            stroke="#2f7038"
            strokeWidth="3"
            fill="none"
            opacity="0.5"
          />
        );
      })}

      {/* Ornaments — one glittering charm per approved wish */}
      {revealOrnaments &&
        wishes.map((wish, i) => (
          <Ornament
            key={wish.id}
            wish={wish}
            index={i}
            opened={openedIds.has(wish.id)}
            onOpen={() => onOpen(wish)}
            appearDelay={0.4 + i * 0.18}
          />
        ))}
    </svg>
  );
}
