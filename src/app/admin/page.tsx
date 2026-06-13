import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { HER_NAME, type SiteMedia, type Wish } from "@/lib/config";
import { PasscodeForm } from "@/components/admin/passcode-form";
import { WishModerationCard } from "@/components/admin/wish-moderation-card";
import { SiteMediaManager } from "@/components/admin/site-media-manager";

export const metadata: Metadata = { title: "Gardener's entrance" };

export const dynamic = "force-dynamic";

async function fetchAdminData(): Promise<
  | { wishes: Wish[]; media: SiteMedia[] }
  | { setupError: string }
> {
  try {
    const admin = createAdminClient();
    const [wishesResult, mediaResult] = await Promise.all([
      admin
        .from("wishes")
        .select("*")
        .order("created_at", { ascending: false }),
      admin
        .from("site_media")
        .select("*")
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true }),
    ]);
    if (wishesResult.error)
      return { setupError: wishesResult.error.message };
    if (mediaResult.error) return { setupError: mediaResult.error.message };
    return {
      wishes: (wishesResult.data ?? []) as Wish[],
      media: (mediaResult.data ?? []) as SiteMedia[],
    };
  } catch (err) {
    return { setupError: err instanceof Error ? err.message : "Supabase is not configured yet." };
  }
}

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-royal-50 to-background px-4">
        <PasscodeForm />
      </main>
    );
  }

  const result = await fetchAdminData();
  if ("setupError" in result) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="rounded-2xl bg-amber-100/80 px-4 py-3 text-sm text-amber-700">
          Database not reachable: {result.setupError}
        </p>
      </main>
    );
  }

  const pending = result.wishes.filter((w) => w.status === "pending");
  const approved = result.wishes.filter((w) => w.status === "approved");
  const rejected = result.wishes.filter((w) => w.status === "rejected");
  const featured = approved
    .filter((wish) => wish.featured_rank !== null && wish.featured_rank !== undefined)
    .sort((a, b) => Number(a.featured_rank) - Number(b.featured_rank));
  const regular = approved.filter(
    (wish) => wish.featured_rank === null || wish.featured_rank === undefined
  );

  return (
    <main className="min-h-dvh bg-gradient-to-b from-royal-50 to-background px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <h1 className="font-display text-3xl text-leaf-900">{HER_NAME}&apos;s tree 🌳</h1>
          <p className="mt-1 text-sm text-foreground/50">
            {approved.length} on the tree · {pending.length} waiting · {rejected.length} set aside
          </p>
        </header>

        <SiteMediaManager media={result.media} />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Waiting for you ({pending.length})
          </h2>
          {pending.length === 0 && (
            <p className="text-sm text-foreground/40">Nothing waiting. Share the link! 🦋</p>
          )}
          {pending.map((w) => (
            <WishModerationCard key={w.id} wish={w} />
          ))}
        </section>

        {featured.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-royal-700">
              Shown before the rest ({featured.length})
            </h2>
            {featured.map((wish, index) => (
              <WishModerationCard
                key={wish.id}
                wish={wish}
                featuredIndex={index}
                featuredCount={featured.length}
              />
            ))}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Other approved wishes ({regular.length})
          </h2>
          {regular.map((w) => (
            <WishModerationCard key={w.id} wish={w} />
          ))}
        </section>

        {rejected.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Set aside ({rejected.length})
            </h2>
            {rejected.map((w) => (
              <WishModerationCard key={w.id} wish={w} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
