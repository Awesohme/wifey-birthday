"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Wish } from "@/lib/config";
import { LiquidGlassNav } from "./nav/liquid-glass-nav";
import { HeroSection } from "./sections/hero";
import { FinaleSection } from "./sections/finale";
import { CursorDog } from "./cursor/cursor-dog";
import { SmoothScroll, setScrollLocked, resetScroll } from "./smooth-scroll";
import { FilmIntro } from "./intro/film-intro";
import { LeaveAWish } from "./leave-a-wish";
import { GALLERY_PHOTOS } from "./gallery/photos";
import { FILM_FRAMES, type FilmFrame } from "./intro/film-frames";

// WebGL fly-through — client only
const Flythrough = dynamic(
  () => import("./flythrough/flythrough").then((m) => m.Flythrough),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-full items-center justify-center bg-[#f4f8fb]">
        <span
          className="text-sm uppercase tracking-[0.3em] text-[#0b3c5d]/40"
          style={{ fontFamily: "var(--font-body)" }}
        >
          gathering the wishes…
        </span>
      </div>
    ),
  }
);

interface JourneyProps {
  wishes: Wish[];
  filmFrames?: FilmFrame[];
  galleryPhotos?: string[];
}

// Shown only while no real wishes are approved yet, so the
// experience is never hollow. Replaced automatically once
// approved wishes exist in Supabase.
const FALLBACK_WISHES: Wish[] = [
  {
    id: "fallback-1",
    name: "Mom",
    relationship: "your number one fan",
    message_text:
      "Watching you become the woman you are has been the greatest joy of my life. Happy birthday, my darling.",
    media_url: null,
    media_type: null,
    status: "approved",
    created_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "fallback-2",
    name: "Your best friend",
    relationship: "partner in everything",
    message_text:
      "Another year of you being the brightest person in every room. Never change. Okay, change a little — answer your phone.",
    media_url: null,
    media_type: null,
    status: "approved",
    created_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "fallback-3",
    name: "Olamide",
    relationship: "yours",
    message_text:
      "Every good thing in my year traces back to you. This whole page exists because words kept failing me in person.",
    media_url: null,
    media_type: null,
    status: "approved",
    created_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "fallback-4",
    name: "Your sister",
    relationship: "the favourite one",
    message_text:
      "You taught me what kindness looks like when nobody is watching. Happiest of birthdays.",
    media_url: null,
    media_type: null,
    status: "approved",
    created_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "fallback-5",
    name: "The group chat",
    relationship: "chaos department",
    message_text:
      "May your year be as loud, warm and unhinged as our voice notes. We love you endlessly.",
    media_url: null,
    media_type: null,
    status: "approved",
    created_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "fallback-6",
    name: "Grandma",
    relationship: "with all her love",
    message_text:
      "God's light has followed you since the day you were born. It always will. Happy birthday, my child.",
    media_url: null,
    media_type: null,
    status: "approved",
    created_at: "2026-06-01T00:00:00.000Z",
  },
];

const INTRO_SEEN_KEY = "adabekee:intro-seen";

export function Journey({
  wishes,
  filmFrames = FILM_FRAMES,
  galleryPhotos = GALLERY_PHOTOS.map((photo) => photo.src),
}: JourneyProps) {
  const usingFallback = wishes.length === 0;
  const displayWishes = usingFallback ? FALLBACK_WISHES : wishes;

  // Intro plays once per session. Start hidden to avoid SSR/client flash;
  // decide on mount.
  const [introState, setIntroState] = useState<"pending" | "playing" | "done">(
    "pending"
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const seen = sessionStorage.getItem(INTRO_SEEN_KEY);
      if (seen) {
        setIntroState("done");
      } else {
        setScrollLocked(true);
        resetScroll(0);
        setIntroState("playing");
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      setScrollLocked(false);
    };
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    resetScroll(0);
    setIntroState("done");
    requestAnimationFrame(() => {
      resetScroll(0);
      setScrollLocked(false);
      requestAnimationFrame(() => resetScroll(0));
    });
  };

  const replayIntro = () => {
    setScrollLocked(true);
    resetScroll(0);
    setIntroState("pending");
    requestAnimationFrame(() => {
      resetScroll(0);
      setIntroState("playing");
    });
  };

  const settled = introState === "done";

  return (
    <>
      {/* Smooth scroll (Lenis) — disabled under reduced motion */}
      <SmoothScroll />

      {/* Opening 8mm film of her life */}
      {introState === "playing" && (
        <FilmIntro onComplete={handleIntroComplete} frames={filmFrames} />
      )}

      {/* Decorative cursor companion */}
      <CursorDog />

      {/* Persistent "leave a wish" button */}
      <LeaveAWish />

      {/* Glass nav — fades out as you scroll */}
      <LiquidGlassNav onReplayIntro={replayIntro} />

      {/* 1. Hero — the film settles here */}
      <HeroSection
        settled={settled}
        heroImage={filmFrames[filmFrames.length - 1]?.src ?? FILM_FRAMES[FILM_FRAMES.length - 1].src}
      />

      {/* 2. WebGL fly-through — she walks through the wishes in z-space */}
      <Flythrough wishes={displayWishes} photos={galleryPhotos} />

      {/* 3. Gallery finale */}
      <FinaleSection wishes={displayWishes} />
    </>
  );
}
