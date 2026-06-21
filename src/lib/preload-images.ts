/**
 * Warm the browser's image cache so a set of images is fetched + decoded once,
 * up front, instead of popping/re-fetching mid-animation (film reel advance,
 * hero crossfade, etc.). Safe to call repeatedly — the browser dedupes by URL.
 */
export function preloadImages(srcs: (string | null | undefined)[]): void {
  if (typeof window === "undefined") return;
  for (const src of srcs) {
    if (!src) continue;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}
