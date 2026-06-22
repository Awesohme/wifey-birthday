import { isViewer } from "@/lib/auth";
import { type SiteMedia, type Wish } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { Journey } from "@/components/journey/journey";
import { FILM_FRAMES, type FilmFrame } from "@/components/journey/intro/film-frames";
import { GALLERY_PHOTOS } from "@/components/journey/gallery/photos";
import { ViewLogin } from "./view-login";

export const dynamic = "force-dynamic";

async function fetchApprovedWishes(): Promise<Wish[]> {
  try {
    const supabase = await createClient();
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

export default async function ViewPage() {
  const authenticated = await isViewer();

  if (!authenticated) {
    return <ViewLogin />;
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

  const wishPhotos = Array.from(
    new Set(
      wishes.flatMap((wish) =>
        [
          wish.together_image_url,
          wish.image_url,
          wish.media_type === "image" ? wish.media_url : null,
        ].filter((url): url is string => Boolean(url))
      )
    )
  );

  const galleryPhotos =
    customGallery.length > 0
      ? customGallery
      : wishPhotos.length > 0
        ? wishPhotos
        : GALLERY_PHOTOS.map((photo) => photo.src);

  return (
    <Journey
      wishes={wishes}
      filmFrames={filmFrames}
      galleryPhotos={galleryPhotos}
    />
  );
}
