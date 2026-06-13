"use client";

import { useEffect } from "react";
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

  return (
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
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_24px_70px_-12px_rgba(31,55,173,0.45),0_0_40px_rgba(93,126,240,0.18)] backdrop-blur-2xl sm:p-8"
            initial={{ y: 60, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
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
              — <span className="font-semibold text-royal-700">{wish.name}</span>
              {wish.relationship ? `, ${wish.relationship}` : ""}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
