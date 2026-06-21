"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Wish } from "@/lib/config";

export function WishCard({ wish, onClose }: { wish: Wish | null; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open so the page behind doesn't move.
  useEffect(() => {
    if (!wish) return;
    const scrollY = window.scrollY;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [wish]);

  if (typeof document === "undefined") return null;

  // Portal to <body> so the overlay escapes the wishes marquee's pointer
  // handlers + scroll context (which were trapping the modal's own scroll).
  return createPortal(
    <AnimatePresence>
      {wish && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-leaf-900/40 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Wish from ${wish.name}`}
            className="max-h-[85dvh] w-full max-w-md touch-pan-y overscroll-contain overflow-y-auto rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_24px_70px_-12px_rgba(31,55,173,0.45),0_0_40px_rgba(93,126,240,0.18)] backdrop-blur-2xl sm:p-8"
            initial={{ y: 60, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl" aria-hidden>🦋</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-full bg-leaf-900/5 text-foreground/60"
              >
                ✕
              </button>
            </div>

            {(wish.image_url ??
              (wish.media_type === "image" ? wish.media_url : null)) && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Supabase media, unknown dimensions
              <img
                src={
                  wish.image_url ??
                  (wish.media_type === "image" ? wish.media_url ?? "" : "")
                }
                alt={`A memory shared by ${wish.name}`}
                className="mb-4 w-full rounded-2xl"
              />
            )}
            {wish.together_image_url && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-royal-700">
                  Together with Cynthia
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase media, unknown dimensions */}
                <img
                  src={wish.together_image_url}
                  alt={`${wish.name} with Cynthia`}
                  className="w-full rounded-2xl"
                />
              </div>
            )}
            {(wish.video_url ??
              (wish.media_type === "video" ? wish.media_url : null)) && (
              <video
                controls
                playsInline
                src={
                  wish.video_url ??
                  (wish.media_type === "video" ? wish.media_url ?? "" : "")
                }
                className="mb-4 w-full rounded-2xl bg-black"
              />
            )}
            {(wish.voice_url ??
              (wish.media_type === "audio" ? wish.media_url : null)) && (
              <div className="mb-4 rounded-2xl bg-royal-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-royal-700">
                  A voice note for you
                </p>
                <audio
                  controls
                  src={
                    wish.voice_url ??
                    (wish.media_type === "audio" ? wish.media_url ?? "" : "")
                  }
                  className="w-full"
                />
              </div>
            )}

            {wish.message_text && (
              <p className="whitespace-pre-wrap font-display text-lg leading-relaxed text-foreground/90">
                {wish.message_text}
              </p>
            )}

            <p className="mt-5 text-right text-sm text-foreground/60">
              <span className="font-semibold text-royal-700">{wish.name}</span>
              {wish.relationship ? `, ${wish.relationship}` : ""}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
