import {
  deleteWish,
  moderateWish,
  updateWishFeature,
} from "@/app/admin/actions";
import type { Wish } from "@/lib/config";

const STATUS_CLASSES: Record<Wish["status"], string> = {
  pending: "bg-amber-100/80 text-amber-700",
  approved: "bg-emerald-100/80 text-emerald-700",
  rejected: "bg-red-100/80 text-red-700",
};

function MediaPreview({ wish }: { wish: Wish }) {
  const voiceUrl =
    wish.voice_url ??
    (wish.media_type === "audio" ? wish.media_url : null);
  const videoUrl =
    wish.video_url ??
    (wish.media_type === "video" ? wish.media_url : null);
  const imageUrl =
    wish.image_url ??
    (wish.media_type === "image" ? wish.media_url : null);

  return (
    <div className="grid gap-3">
      {voiceUrl && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/40">
            Voice note
          </p>
          <audio controls src={voiceUrl} className="w-full" preload="none" />
        </div>
      )}
      {videoUrl && (
        <video
          controls
          playsInline
          src={videoUrl}
          className="max-h-64 w-full rounded-2xl bg-black"
          preload="metadata"
        />
      )}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase media, unknown dimensions
        <img
          src={imageUrl}
          alt={`Photo from ${wish.name}`}
          className="max-h-64 w-full rounded-2xl object-cover"
          loading="lazy"
        />
      )}
      {wish.together_image_url && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/40">
            Photo with Cynthia
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase media, unknown dimensions */}
          <img
            src={wish.together_image_url}
            alt={`${wish.name} with Cynthia`}
            className="max-h-64 w-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

export function WishModerationCard({
  wish,
  featuredIndex,
  featuredCount,
}: {
  wish: Wish;
  featuredIndex?: number;
  featuredCount?: number;
}) {
  const isFeatured = wish.featured_rank !== null && wish.featured_rank !== undefined;

  return (
    <article className="space-y-3 rounded-3xl bg-white/80 p-5 shadow-lg shadow-leaf-900/5 backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{wish.name}</h3>
          {wish.relationship && (
            <p className="text-sm text-foreground/50">{wish.relationship}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFeatured && (
            <span className="rounded-full bg-royal-100 px-2.5 py-1 text-xs font-medium text-royal-700">
              pinned first
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[wish.status]}`}>
            {wish.status}
          </span>
        </div>
      </header>

      {wish.message_text && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {wish.message_text}
        </p>
      )}

      <MediaPreview wish={wish} />

      <footer className="flex flex-wrap items-center gap-2 pt-1">
        {wish.status !== "approved" && (
          <form action={moderateWish}>
            <input type="hidden" name="id" value={wish.id} />
            <input type="hidden" name="decision" value="approved" />
            <button className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
              Approve
            </button>
          </form>
        )}
        {wish.status !== "rejected" && (
          <form action={moderateWish}>
            <input type="hidden" name="id" value={wish.id} />
            <input type="hidden" name="decision" value="rejected" />
            <button className="rounded-full bg-leaf-900/5 px-4 py-2 text-xs font-semibold text-foreground/70">
              Reject
            </button>
          </form>
        )}
        {wish.status === "approved" && (
          <>
            <form action={updateWishFeature}>
              <input type="hidden" name="id" value={wish.id} />
              <input
                type="hidden"
                name="command"
                value={isFeatured ? "unpin" : "pin"}
              />
              <button className="rounded-full bg-royal-100 px-4 py-2 text-xs font-semibold text-royal-700">
                {isFeatured ? "Unpin" : "Show before the rest"}
              </button>
            </form>
            {isFeatured && (
              <>
                <form action={updateWishFeature}>
                  <input type="hidden" name="id" value={wish.id} />
                  <input type="hidden" name="command" value="up" />
                  <button
                    disabled={featuredIndex === 0}
                    className="rounded-full px-3 py-2 text-xs text-foreground/55 disabled:opacity-25"
                  >
                    Earlier
                  </button>
                </form>
                <form action={updateWishFeature}>
                  <input type="hidden" name="id" value={wish.id} />
                  <input type="hidden" name="command" value="down" />
                  <button
                    disabled={
                      featuredIndex === undefined ||
                      featuredIndex === (featuredCount ?? 0) - 1
                    }
                    className="rounded-full px-3 py-2 text-xs text-foreground/55 disabled:opacity-25"
                  >
                    Later
                  </button>
                </form>
              </>
            )}
          </>
        )}
        <form action={deleteWish} className="ml-auto">
          <input type="hidden" name="id" value={wish.id} />
          <button className="rounded-full px-3 py-2 text-xs font-medium text-red-600">
            Delete
          </button>
        </form>
      </footer>
    </article>
  );
}
