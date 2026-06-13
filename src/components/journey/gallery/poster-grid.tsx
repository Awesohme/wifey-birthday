"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WishCard } from "@/components/experience/wish-card";
import { GALLERY_PHOTOS } from "./photos";
import type { Wish } from "@/lib/config";

interface PosterGridProps {
  wishes: Wish[];
}

// soft accent glows cycled across the tiles
const GLOWS = [
  "rgba(58,91,228,0.55)", // royal
  "rgba(205,107,134,0.55)", // rose
  "rgba(212,169,60,0.55)", // gold
  "rgba(77,158,79,0.5)", // leaf
  "rgba(124,170,255,0.5)", // sky
];

/** A wish rendered as a Netflix-style poster tile with a glowy liquid-glass face. */
function WishPoster({ wish, glow, onOpen }: { wish: Wish; glow: string; onOpen: () => void }) {
  const initial = wish.name[0]?.toUpperCase() ?? "♥";
  const hasImage = wish.media_type === "image" && wish.media_url;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ scale: 1.06, zIndex: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative aspect-[2/3] overflow-hidden rounded-xl text-left"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06)` }}
    >
      {/* background: photo or rich gradient */}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={wish.media_url!}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${glow}, transparent 60%), linear-gradient(160deg, #16223f 0%, #0b1428 100%)`,
          }}
        />
      )}

      {/* glow ring on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `0 0 28px 4px ${glow}, inset 0 0 30px ${glow}` }}
      />

      {/* liquid-glass content panel */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="liquid-glass rounded-xl p-3">
          {wish.message_text && (
            <p
              className="mb-2 line-clamp-4 text-[13px] leading-snug text-white/90"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              “{wish.message_text}”
            </p>
          )}
          <div className="flex items-center gap-2">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: glow }}
            >
              {initial}
            </span>
            <span className="truncate text-xs font-medium text-white/80" style={{ fontFamily: "var(--font-body)" }}>
              {wish.name}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/** A photo poster tile. */
function PhotoPoster({ src, glow }: { src: string; glow: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.06, zIndex: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative aspect-[2/3] overflow-hidden rounded-xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `0 0 28px 4px ${glow}, inset 0 0 30px ${glow}` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
    </motion.div>
  );
}

export function PosterGrid({ wishes }: PosterGridProps) {
  const [active, setActive] = useState<Wish | null>(null);

  // interleave photos through the wishes for a richer wall
  const tiles: { type: "wish" | "photo"; data: Wish | string; key: string }[] = [];
  let photoIdx = 0;
  wishes.forEach((w, i) => {
    tiles.push({ type: "wish", data: w, key: w.id });
    if ((i + 1) % 4 === 0 && photoIdx < GALLERY_PHOTOS.length) {
      tiles.push({ type: "photo", data: GALLERY_PHOTOS[photoIdx].src, key: `photo-${photoIdx}` });
      photoIdx++;
    }
  });

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {tiles.map((tile, i) => {
          const glow = GLOWS[i % GLOWS.length];
          return tile.type === "wish" ? (
            <WishPoster
              key={tile.key}
              wish={tile.data as Wish}
              glow={glow}
              onOpen={() => setActive(tile.data as Wish)}
            />
          ) : (
            <PhotoPoster key={tile.key} src={tile.data as string} glow={glow} />
          );
        })}
      </div>

      <WishCard wish={active} onClose={() => setActive(null)} />
    </>
  );
}
