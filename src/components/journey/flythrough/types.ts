import type { Wish } from "@/lib/config";

export const SERIF_FONT = "/fonts/InstrumentSerif-Regular.ttf";
export const BODY_FONT = "/fonts/Inter-Variable.ttf";

/** A thing floating in the z-tunnel that the camera flies through. */
export type FlyItem =
  | {
      kind: "landmark";
      /** big standalone words, e.g. "Adabekee" / "Happy Birthday" */
      text: string;
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

/**
 * Build the ordered list of items along the flight path.
 * Camera starts at z≈0 and travels toward negative Z, so deeper
 * items have more negative z and appear later in the scroll.
 */
export function buildItems(wishes: Wish[], photos: string[]): FlyItem[] {
  const items: FlyItem[] = [];
  let z = -8;

  // Opening landmark — she flies in toward her own name
  items.push({ kind: "landmark", text: "Adabekee", z, size: 3.2, color: "#0b3c5d" });
  z -= 11;

  items.push({
    kind: "landmark",
    text: "she changed\neverything",
    z,
    size: 1.5,
    color: "#11324a",
  });
  z -= 11;

  // Interleave wishes with the occasional sender landmark + photo
  const withMessage = wishes.filter((w) => w.message_text);
  withMessage.forEach((wish, i) => {
    const side = i % 2 === 0 ? "left" : "right";
    // wishes sit roughly centered so the camera flies straight through them
    items.push({
      kind: "wish",
      wish,
      z,
      x: side === "left" ? -0.8 : 0.8,
      align: "center",
    });
    z -= 12;

    // a floating sender name as an off-axis depth landmark you pass beside
    items.push({
      kind: "landmark",
      text: wish.name,
      z,
      size: 1.0,
      color: "#cd6b86",
      x: side === "left" ? 3.0 : -3.0,
      y: 1.6,
    });
    z -= 7;

    // drop a photo every other wish, off to the side
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
      z -= 10;
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
  z -= 12;

  return items;
}

/** Total flight depth, used to size the scroll track. */
export function flightDepth(items: FlyItem[]): number {
  if (!items.length) return 20;
  const last = items[items.length - 1];
  return Math.abs(last.z) + 12;
}
