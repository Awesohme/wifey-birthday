import { isUnlocked, type SiteMedia, type Wish } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/experience/countdown";
import { Experience } from "@/components/experience/experience";
import { Journey } from "@/components/journey/journey";
import { CinematicCountdown } from "@/components/journey/countdown/cinematic-countdown";
import { FILM_FRAMES, type FilmFrame } from "@/components/journey/intro/film-frames";
import { GALLERY_PHOTOS } from "@/components/journey/gallery/photos";

export const dynamic = "force-dynamic";

// Flip to false to restore the original 3D tree experience
const USE_JOURNEY = true;

async function fetchApprovedWishes(): Promise<Wish[]> {
  try {
    const supabase = await createClient();
    // RLS only exposes approved wishes to the anon key
    const { data } = await supabase
      .from("wishes")
      .select("*")
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    return (data ?? []) as Wish[];
  } catch {
    return [];
  }
}

async function fetchSiteMedia(): Promise<SiteMedia[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_media")
      .select("*")
      .order("section", { ascending: true })
      .order("sort_order", { ascending: true });
    return (data ?? []) as SiteMedia[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  if (!isUnlocked()) {
    return USE_JOURNEY ? <CinematicCountdown /> : <Countdown />;
  }
  const [wishes, siteMedia] = await Promise.all([
    fetchApprovedWishes(),
    fetchSiteMedia(),
  ]);
  const customFilm = siteMedia.filter((item) => item.section === "film");
  const filmFrames: FilmFrame[] =
    customFilm.length > 0
      ? customFilm.map((item, index) => ({
          src: item.url,
          year: item.year ?? 1997 + index * 4,
          caption: item.caption ?? undefined,
        }))
      : FILM_FRAMES;
  const customGallery = siteMedia
    .filter((item) => item.section === "gallery")
    .map((item) => item.url);
  const galleryPhotos =
    customGallery.length > 0
      ? customGallery
      : GALLERY_PHOTOS.map((photo) => photo.src);

  return USE_JOURNEY ? (
    <Journey
      wishes={wishes}
      filmFrames={filmFrames}
      galleryPhotos={galleryPhotos}
    />
  ) : (
    <Experience wishes={wishes} />
  );
}
