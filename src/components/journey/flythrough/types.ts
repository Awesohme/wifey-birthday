import { HER_NAME, type Wish } from "@/lib/config";

export const SERIF_FONT = "/fonts/InstrumentSerif-Regular.ttf";
export const BODY_FONT = "/fonts/Inter-Variable.ttf";

/** A thing floating in the z-tunnel that the camera flies through. */
export type FlyItem =
  | {
      kind: "landmark";
      /** big standalone words, e.g. "Adabekee" / "Happy Birthday" */
      text: string;
      /** optional preview line shown under the text (e.g. a wish snippet) */
      subtitle?: string;
      z: number;
      size: number;
      color: string;
      x?: number;
      y?: number;
    }
  | {
      kind: "wish";
      wish: Wish;
      z: number;
      x?: number;
      y?: number;
      align?: "left" | "right" | "center";
    }
  | {
      kind: "photo";
      src: string;
      z: number;
      x?: number;
      y?: number;
      scale?: number;
    };

/** First ~12 words of a wish, trimmed, with an ellipsis if cut. */
function snippet(text: string | null, words = 12): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  const parts = clean.split(" ");
  if (parts.length <= words) return clean;
  return parts.slice(0, words).join(" ") + "…";
}

/**
 * Build the ordered list of items along the flight path.
 * Camera starts at z≈0 and travels toward negative Z, so deeper
 * items have more negative z and appear later in the scroll.
 */
export function buildItems(wishes: Wish[], photos: string[]): FlyItem[] {
  const items: FlyItem[] = [];
  let z = -8;

  // Opening landmark — she flies in toward her own name
  items.push({ kind: "landmark", text: HER_NAME, z, size: 3.2, color: "#0b3c5d" });
  z -= 9;

  items.push({
    kind: "landmark",
    text: "she changed\neverything",
    z,
    size: 1.5,
    color: "#11324a",
  });
  z -= 9;

  // The fly-through is a flight PAST the people who wrote wishes — their names
  // and photos float by — but the wish *text* lives only in the grid under the
  // candle, so it isn't shown twice. We keep iterating over wishes purely to
  // drive the sender-name landmarks, photos, and pacing.
  const withMessage = wishes.filter((w) => w.message_text);
  withMessage.forEach((wish, i) => {
    const side = i % 2 === 0 ? "left" : "right";

    // a floating sender name as a depth landmark you fly toward, with a short
    // preview of their wish underneath so it isn't just a bare name
    items.push({
      kind: "landmark",
      text: wish.name,
      subtitle: snippet(wish.message_text),
      z,
      size: 1.1,
      color: "#cd6b86",
      x: side === "left" ? -0.6 : 0.6,
      y: 0.4,
    });
    z -= 8;

    // drop a photo every other sender, off to the side
    if (photos.length && i % 2 === 1) {
      const p = photos[(Math.floor(i / 2)) % photos.length];
      items.push({
        kind: "photo",
        src: p,
        z,
        x: side === "left" ? 3.2 : -3.2,
        y: -0.4,
        scale: 4.5,
      });
      z -= 7;
    }
  });

  // Closing landmark
  items.push({
    kind: "landmark",
    text: "happy\nbirthday",
    z,
    size: 2.4,
    color: "#0b3c5d",
  });
  z -= 10;

  return items;
}

/** Total flight depth, used to size the scroll track. */
export function flightDepth(items: FlyItem[]): number {
  if (!items.length) return 20;
  const last = items[items.length - 1];
  return Math.abs(last.z) + 12;
}
