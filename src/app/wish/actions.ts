"use server";

import { createClient } from "@/lib/supabase/server";
import type { MediaType } from "@/lib/config";

type SubmitResult = { ok: true } | { ok: false; error: string };

const MEDIA_TYPES: MediaType[] = ["audio", "image", "video"];
const MEDIA_FIELDS = [
  "mediaUrl",
  "voiceUrl",
  "videoUrl",
  "imageUrl",
  "togetherImageUrl",
] as const;

function validMediaUrl(url: string) {
  if (!url) return true;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (
    Boolean(supabaseUrl) &&
    url.startsWith(`${supabaseUrl}/storage/v1/object/public/wish-media/`)
  );
}

export async function submitWish(formData: FormData): Promise<SubmitResult> {
  // Public action by design: anyone with the link can leave a wish.
  // RLS forces every insert to land as 'pending' for moderation.
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const relationship = String(formData.get("relationship") ?? "").trim().slice(0, 80);
  const messageText = String(formData.get("messageText") ?? "").trim().slice(0, 4000);
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim();
  const mediaType = String(formData.get("mediaType") ?? "").trim() as MediaType | "";
  const voiceUrl = String(formData.get("voiceUrl") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const togetherImageUrl = String(
    formData.get("togetherImageUrl") ?? ""
  ).trim();

  if (!name) return { ok: false, error: "Please tell us your name." };
  if (
    !messageText &&
    !mediaUrl &&
    !voiceUrl &&
    !videoUrl &&
    !imageUrl &&
    !togetherImageUrl
  ) {
    return { ok: false, error: "Add a wish or at least one memory." };
  }

  if (mediaUrl) {
    if (!validMediaUrl(mediaUrl))
      return { ok: false, error: "Media upload looks invalid. Please try again." };
    if (!MEDIA_TYPES.includes(mediaType as MediaType))
      return { ok: false, error: "Unsupported media type." };
  }
  for (const field of MEDIA_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (!validMediaUrl(value)) {
      return { ok: false, error: "Media upload looks invalid. Please try again." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("wishes").insert({
    name,
    relationship: relationship || null,
    message_text: messageText || null,
    media_url: mediaUrl || null,
    media_type: mediaUrl ? mediaType : null,
    voice_url: voiceUrl || null,
    video_url: videoUrl || null,
    image_url: imageUrl || null,
    together_image_url: togetherImageUrl || null,
  });

  if (error) return { ok: false, error: "Could not save your wish. Please try again." };
  return { ok: true };
}
