// Her life in film — one entry per beat of the intro.
// Replace these placeholder images with her real photos over time
// (drop them in public/film/ and point `src` at e.g. "/film/1997.jpg").
// `year` drives the burned-in corner stamp and the B&W→colour grade:
// 1997 = fully desaturated + heavy grain, 2026 = full colour + clean.
export interface FilmFrame {
  year: number;
  src: string;
  /** optional short caption burned under the frame */
  caption?: string;
}

export const BIRTH_YEAR = 1997;
export const NOW_YEAR = 2026;

// Warm, person-centric placeholders arranged as a life-arc (baby → child →
// youth → young woman → present). They read well desaturated early and warm
// into full colour toward 2026. Swap for her real photos in public/film/.
export const FILM_FRAMES: FilmFrame[] = [
  { year: 1997, src: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=900&q=80", caption: "the beginning" },
  { year: 2002, src: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=900&q=80", caption: "little wonder" },
  { year: 2007, src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=900&q=80", caption: "growing up" },
  { year: 2012, src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&q=80", caption: "becoming her" },
  { year: 2017, src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900&q=80", caption: "finding the way" },
  { year: 2021, src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80", caption: "in full bloom" },
  { year: 2024, src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=80", caption: "radiant" },
  { year: 2026, src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&q=80", caption: "today" },
];

/** 0 at birth year, 1 at now — drives colour & grain across the reel. */
export function yearProgress(year: number): number {
  const span = NOW_YEAR - BIRTH_YEAR;
  return Math.min(1, Math.max(0, (year - BIRTH_YEAR) / span));
}
