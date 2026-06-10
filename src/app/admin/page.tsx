import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { HER_NAME, type Wish } from "@/lib/config";
import { PasscodeForm } from "@/components/admin/passcode-form";
import { WishModerationCard } from "@/components/admin/wish-moderation-card";

export const metadata: Metadata = { title: "Gardener's entrance" };

export const dynamic = "force-dynamic";

async function fetchWishes(): Promise<Wish[] | { setupError: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { setupError: error.message };
    return (data ?? []) as Wish[];
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

  const result = await fetchWishes();
  if (!Array.isArray(result)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="rounded-2xl bg-amber-100/80 px-4 py-3 text-sm text-amber-700">
          Database not reachable: {result.setupError}
        </p>
      </main>
    );
  }

  const pending = result.filter((w) => w.status === "pending");
  const approved = result.filter((w) => w.status === "approved");
  const rejected = result.filter((w) => w.status === "rejected");

  return (
    <main className="min-h-dvh bg-gradient-to-b from-royal-50 to-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <h1 className="font-display text-3xl text-leaf-900">{HER_NAME}&apos;s tree 🌳</h1>
          <p className="mt-1 text-sm text-foreground/50">
            {approved.length} on the tree · {pending.length} waiting · {rejected.length} set aside
          </p>
        </header>

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

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            On the tree ({approved.length})
          </h2>
          {approved.map((w) => (
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
