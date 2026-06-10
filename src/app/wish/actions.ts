"use server";

import { createClient } from "@/lib/supabase/server";
import type { MediaType } from "@/lib/config";

type SubmitResult = { ok: true } | { ok: false; error: string };

const MEDIA_TYPES: MediaType[] = ["audio", "image", "video"];

export async function submitWish(formData: FormData): Promise<SubmitResult> {
  // Public action by design: anyone with the link can leave a wish.
  // RLS forces every insert to land as 'pending' for moderation.
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const relationship = String(formData.get("relationship") ?? "").trim().slice(0, 80);
  const messageText = String(formData.get("messageText") ?? "").trim().slice(0, 4000);
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim();
  const mediaType = String(formData.get("mediaType") ?? "").trim() as MediaType | "";

  if (!name) return { ok: false, error: "Please tell us your name." };
  if (!messageText && !mediaUrl)
    return { ok: false, error: "Add a message, voice note, or photo/video." };

  if (mediaUrl) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (!supabaseUrl || !mediaUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/wish-media/`))
      return { ok: false, error: "Media upload looks invalid. Please try again." };
    if (!MEDIA_TYPES.includes(mediaType as MediaType))
      return { ok: false, error: "Unsupported media type." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("wishes").insert({
    name,
    relationship: relationship || null,
    message_text: messageText || null,
    media_url: mediaUrl || null,
    media_type: mediaUrl ? mediaType : null,
  });

  if (error) return { ok: false, error: "Could not save your wish. Please try again." };
  return { ok: true };
}
