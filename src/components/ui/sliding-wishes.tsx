"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import { WishCard } from "@/components/experience/wish-card";
import type { Wish } from "@/lib/config";

interface SlidingWishesProps {
  wishes: Wish[];
}

type Direction = "ltr" | "rtl";

const AUTOPLAY_SPEED = 55;

function mediaLabel(wish: Wish) {
  const labels = [
    wish.voice_url || wish.media_type === "audio" ? "Voice" : null,
    wish.video_url || wish.media_type === "video" ? "Video" : null,
    wish.image_url || wish.media_type === "image" ? "Photo" : null,
    wish.together_image_url ? "Together" : null,
  ].filter(Boolean);
  if (labels.length > 1) return `${labels.length} memories`;
  if (labels.length === 1) return labels[0];
  if (!wish.media_url) return null;
  if (wish.media_type === "audio") return "Voice note";
  if (wish.media_type === "video") return "Video";
  if (wish.media_type === "image") return "Photo";
  return null;
}

function WishSlide({
  wish,
  duplicate = false,
  onOpen,
}: {
  wish: Wish;
  duplicate?: boolean;
  onOpen: (wish: Wish) => void;
}) {
  const initial = wish.name[0]?.toUpperCase() ?? "W";
  const attachment = mediaLabel(wish);

  return (
    <button
      type="button"
      tabIndex={duplicate ? -1 : 0}
      onClick={() => onOpen(wish)}
      aria-label={`Open the wish from ${wish.name}`}
      className="group flex min-h-72 w-[min(82vw,36rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(145deg,rgba(35,48,78,0.96),rgba(10,15,29,0.98))] text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/30 focus-visible:-translate-y-1 focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400"
    >
      <div className="flex flex-1 items-center px-6 py-8 sm:px-8">
        <p
          className="text-pretty text-2xl leading-tight tracking-[-0.025em] text-white/90 sm:text-3xl"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          &ldquo;{wish.message_text ?? "A birthday wish made with love."}&rdquo;
        </p>
      </div>

      <div className="flex min-h-20 items-center border-t border-white/15">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-royal-500/80 text-sm font-semibold text-white ring-1 ring-white/20">
            {initial}
          </span>
          <span className="min-w-0">
            <span
              className="block truncate text-base font-medium text-white"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {wish.name}
            </span>
            <span
              className="block truncate text-sm text-white/45"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {wish.relationship || "with love"}
            </span>
          </span>
        </div>

        {attachment && (
          <span
            className="mx-5 shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/55"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {attachment}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * One horizontal marquee row. Owns its own scroll viewport so two rows can
 * travel independently in opposite directions. `looping` (passed from the
 * parent) decides whether the autoplay + 3-copy track is active; `paused`
 * (also from the parent, aggregated across both rows + search + modal) freezes
 * the autoplay without tearing down the loop.
 */
function WishRow({
  wishes,
  direction,
  looping,
  paused,
  reducedMotion,
  onOpen,
  testId,
  groupName,
}: {
  wishes: Wish[];
  direction: Direction;
  looping: boolean;
  paused: boolean;
  reducedMotion: boolean;
  onOpen: (wish: Wish) => void;
  testId: string;
  groupName: string;
}) {
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const primaryGroupRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef({ x: 0, scrollLeft: 0, time: 0 });
  const lastPointerRef = useRef({ x: 0, time: 0 });
  const velocityRef = useRef(0);
  const mousePressedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const momentumFrameRef = useRef<number | null>(null);

  const directionSign = direction === "rtl" ? -1 : 1;

  const normalizeScroll = useCallback(() => {
    if (!looping) return;
    const viewport = viewportRef.current;
    const groupWidth = primaryGroupRef.current?.scrollWidth ?? 0;
    if (!viewport || groupWidth === 0) return;

    if (viewport.scrollLeft <= groupWidth * 0.5) {
      viewport.scrollLeft += groupWidth;
    } else if (viewport.scrollLeft >= groupWidth * 1.5) {
      viewport.scrollLeft -= groupWidth;
    }
  }, [looping]);

  // Reset to the middle copy whenever the list/looping state changes so the
  // row has room to travel either direction without immediately wrapping.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.scrollLeft = looping
        ? primaryGroupRef.current?.scrollWidth ?? 0
        : 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [wishes, looping]);

  useEffect(() => {
    if (!looping || paused) return;

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const elapsed = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      viewport.scrollLeft += directionSign * AUTOPLAY_SPEED * elapsed;
      normalizeScroll();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [looping, normalizeScroll, paused, directionSign]);

  useEffect(
    () => () => {
      if (momentumFrameRef.current)
        cancelAnimationFrame(momentumFrameRef.current);
    },
    []
  );

  const stopMomentum = () => {
    if (momentumFrameRef.current) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopMomentum();

    if (event.pointerType !== "mouse" || event.button !== 0) return;
    mousePressedRef.current = true;
    pointerStartRef.current = {
      x: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      time: performance.now(),
    };
    lastPointerRef.current = { x: event.clientX, time: performance.now() };
    velocityRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mousePressedRef.current || event.pointerType !== "mouse") return;

    const movement = event.clientX - pointerStartRef.current.x;
    if (!dragging && Math.abs(movement) > 4) {
      setDragging(true);
      suppressClickRef.current = true;
    }
    if (Math.abs(movement) <= 4 && !dragging) return;

    const viewport = event.currentTarget;
    viewport.scrollLeft = pointerStartRef.current.scrollLeft - movement * 1.25;
    const now = performance.now();
    const elapsed = Math.max(now - lastPointerRef.current.time, 1);
    velocityRef.current = (event.clientX - lastPointerRef.current.x) / elapsed;
    lastPointerRef.current = { x: event.clientX, time: now };
    normalizeScroll();
    event.preventDefault();
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;

    mousePressedRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!dragging) return;
    let velocity = velocityRef.current;
    let previous = performance.now();
    const coast = (now: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const elapsed = Math.min(now - previous, 32);
      previous = now;
      viewport.scrollLeft -= velocity * elapsed;
      velocity *= 0.94;
      normalizeScroll();

      if (Math.abs(velocity) > 0.02) {
        momentumFrameRef.current = requestAnimationFrame(coast);
      } else {
        momentumFrameRef.current = null;
        setDragging(false);
      }
    };

    momentumFrameRef.current = requestAnimationFrame(coast);
    requestAnimationFrame(() => {
      suppressClickRef.current = false;
    });
  };

  const handleOpen = (wish: Wish) => {
    if (suppressClickRef.current) return;
    onOpen(wish);
  };

  const copies = looping
    ? (["before", groupName, "after"] as const)
    : ([groupName] as const);

  return (
    <div
      ref={viewportRef}
      data-testid={testId}
      onScroll={normalizeScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      className={`wishes-slider-viewport overflow-x-auto ${
        dragging ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
      style={{
        touchAction: "pan-x",
        overscrollBehaviorX: "contain",
        maskImage: reducedMotion
          ? "none"
          : "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
        WebkitMaskImage: reducedMotion
          ? "none"
          : "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
      }}
    >
      <div className="flex w-max">
        {copies.map((copy) => {
          const duplicate = copy !== groupName;
          return (
            <div
              key={copy}
              ref={copy === groupName ? primaryGroupRef : undefined}
              aria-hidden={duplicate || undefined}
              data-wish-group={copy}
              className="wishes-slider-group flex gap-5 pr-5"
            >
              {wishes.map((wish) => (
                <WishSlide
                  key={`${copy}-${wish.id}`}
                  wish={wish}
                  duplicate={duplicate}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SlidingWishes({ wishes }: SlidingWishesProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [activeWish, setActiveWish] = useState<Wish | null>(null);
  const [query, setQuery] = useState("");
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredWishes = useMemo(() => {
    if (!normalizedQuery) return wishes;

    return wishes.filter((wish) =>
      [wish.name, wish.relationship, wish.message_text]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery, wishes]);

  // Second row shows the same wishes rotated to its midpoint so the two rows
  // don't drift past identical, vertically aligned cards.
  const secondRowWishes = useMemo(() => {
    if (filteredWishes.length < 2) return filteredWishes;
    const offset = Math.floor(filteredWishes.length / 2);
    return [...filteredWishes.slice(offset), ...filteredWishes.slice(0, offset)];
  }, [filteredWishes]);

  const searching = normalizedQuery.length > 0;
  const looping = !reducedMotion && !searching && filteredWishes.length > 1;
  const paused = hovering || focusWithin || Boolean(activeWish) || searching;

  const openWish = useCallback((wish: Wish) => {
    setActiveWish(wish);
  }, []);

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusWithin(false);
    }
  };

  if (wishes.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={handleBlur}
    >
      <div className="mx-auto mb-8 flex w-full max-w-xl items-center gap-2 px-1">
        <label htmlFor="wish-search" className="sr-only">
          Search wishes
        </label>
        <div className="relative min-w-0 flex-1">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/35"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <input
            id="wish-search"
            data-testid="wishes-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, relationship, or message"
            autoComplete="off"
            className="h-12 w-full rounded-full border border-white/15 bg-white/[0.06] pl-12 pr-4 text-sm text-white outline-none backdrop-blur placeholder:text-white/30 focus:border-white/35 focus:ring-2 focus:ring-royal-400/50"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="h-12 shrink-0 rounded-full border border-white/15 px-5 text-sm text-white/65 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Clear
          </button>
        )}
      </div>

      {filteredWishes.length === 0 ? (
        <div
          className="mx-auto flex min-h-72 max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center"
          role="status"
        >
          <p
            className="text-xl text-white/75"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            No wishes match “{query.trim()}”.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-5 rounded-full border border-white/20 px-5 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <WishRow
            wishes={filteredWishes}
            direction="ltr"
            looping={looping}
            paused={paused}
            reducedMotion={reducedMotion}
            onOpen={openWish}
            testId="wishes-scroller"
            groupName="primary"
          />
          <WishRow
            wishes={secondRowWishes}
            direction="rtl"
            looping={looping}
            paused={paused}
            reducedMotion={reducedMotion}
            onOpen={openWish}
            testId="wishes-scroller-2"
            groupName="primary-2"
          />
        </div>
      )}

      <WishCard wish={activeWish} onClose={() => setActiveWish(null)} />
    </div>
  );
}
