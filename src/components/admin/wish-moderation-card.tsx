import { deleteWish, moderateWish } from "@/app/admin/actions";
import type { Wish } from "@/lib/config";

const STATUS_CLASSES: Record<Wish["status"], string> = {
  pending: "bg-amber-100/80 text-amber-700",
  approved: "bg-emerald-100/80 text-emerald-700",
  rejected: "bg-red-100/80 text-red-700",
};

function MediaPreview({ wish }: { wish: Wish }) {
  if (!wish.media_url || !wish.media_type) return null;
  if (wish.media_type === "audio") {
     
    return <audio controls src={wish.media_url} className="w-full" preload="none" />;
  }
  if (wish.media_type === "video") {
     
    return <video controls src={wish.media_url} className="max-h-64 w-full rounded-2xl bg-black" preload="metadata" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote Supabase media, unknown dimensions
    <img src={wish.media_url} alt={`Photo from ${wish.name}`} className="max-h-64 w-full rounded-2xl object-cover" loading="lazy" />
  );
}

export function WishModerationCard({ wish }: { wish: Wish }) {
  return (
    <article className="space-y-3 rounded-3xl bg-white/80 p-5 shadow-lg shadow-leaf-900/5 backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{wish.name}</h3>
          {wish.relationship && (
            <p className="text-sm text-foreground/50">{wish.relationship}</p>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[wish.status]}`}>
          {wish.status}
        </span>
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
