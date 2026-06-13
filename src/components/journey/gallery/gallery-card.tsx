"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WishCard } from "@/components/experience/wish-card";
import type { Wish } from "@/lib/config";

interface GalleryCardProps {
  wish: Wish;
  offsetY?: number;
}

export function GalleryCard({ wish, offsetY = 0 }: GalleryCardProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "start 40%"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);

  const hasImage = wish.media_type === "image" && wish.media_url;

  return (
    <>
      <motion.div
        ref={ref}
        style={{ opacity, y, marginTop: offsetY }}
        className="break-inside-avoid mb-6 cursor-pointer group"
        onClick={() => setOpen(true)}
      >
        <div className="rounded-2xl overflow-hidden bg-white border border-black/8 shadow-sm hover:shadow-lg transition-shadow duration-300">
          {hasImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={wish.media_url!}
              alt={`Shared by ${wish.name}`}
              className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              style={{ aspectRatio: "4/3" }}
            />
          )}
          {wish.media_type === "video" && wish.media_url && (
            <div className="relative aspect-video bg-black">
              <video
                src={wish.media_url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-white text-xl ml-1">▶</span>
                </div>
              </div>
            </div>
          )}
          {wish.media_type === "audio" && wish.media_url && (
            <div className="aspect-square bg-gradient-to-br from-royal-100 to-royal-200 flex items-center justify-center">
              <span className="text-5xl">🎙️</span>
            </div>
          )}

          <div className="p-5">
            {wish.message_text && (
              <p
                className="text-sm leading-relaxed text-black/70 line-clamp-4 mb-4"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                &ldquo;{wish.message_text}&rdquo;
              </p>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-royal-400 to-royal-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {wish.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-black/80">{wish.name}</p>
                {wish.relationship && (
                  <p className="text-[10px] text-black/40">{wish.relationship}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {open && <WishCard wish={wish} onClose={() => setOpen(false)} />}
    </>
  );
}
