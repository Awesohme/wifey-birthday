import { isUnlocked, type Wish } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/experience/countdown";
import { Experience } from "@/components/experience/experience";

export const dynamic = "force-dynamic";

async function fetchApprovedWishes(): Promise<Wish[]> {
  try {
    const supabase = await createClient();
    // RLS only exposes approved wishes to the anon key
    const { data } = await supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: true });
    return (data ?? []) as Wish[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  if (!isUnlocked()) {
    return <Countdown />;
  }
  const wishes = await fetchApprovedWishes();
  return <Experience wishes={wishes} />;
}
