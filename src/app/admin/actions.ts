"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, setAdminSession, verifyPasscode } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SiteMediaSection } from "@/lib/config";

export async function loginAdmin(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!verifyPasscode(passcode)) {
    return { error: "Wrong passcode." };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function moderateWish(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["approved", "rejected", "pending"].includes(decision)) return;

  const admin = createAdminClient();
  await admin.from("wishes").update({ status: decision }).eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteWish(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  const { data: wish } = await admin
    .from("wishes")
    .select(
      "media_url, voice_url, video_url, image_url, together_image_url"
    )
    .eq("id", id)
    .single();

  if (wish) {
    const paths = [
      wish.media_url,
      wish.voice_url,
      wish.video_url,
      wish.image_url,
      wish.together_image_url,
    ]
      .filter((url): url is string => Boolean(url))
      .map((url) => url.split("/wish-media/").pop())
      .filter((path): path is string => Boolean(path));
    if (paths.length) {
      await admin.storage.from("wish-media").remove([...new Set(paths)]);
    }
  }
  await admin.from("wishes").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateWishFeature(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const command = String(formData.get("command") ?? "");
  if (!id || !["pin", "unpin", "up", "down"].includes(command)) return;

  const admin = createAdminClient();
  const { data: featured } = await admin
    .from("wishes")
    .select("id, featured_rank")
    .not("featured_rank", "is", null)
    .order("featured_rank", { ascending: true });

  const ordered = featured ?? [];
  const currentIndex = ordered.findIndex((wish) => wish.id === id);

  if (command === "pin" && currentIndex === -1) {
    const lastRank =
      ordered.length > 0
        ? Number(ordered[ordered.length - 1].featured_rank ?? ordered.length - 1)
        : -1;
    await admin
      .from("wishes")
      .update({ featured_rank: lastRank + 1 })
      .eq("id", id);
  } else if (command === "unpin") {
    await admin.from("wishes").update({ featured_rank: null }).eq("id", id);
  } else if (currentIndex !== -1) {
    const targetIndex =
      command === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = ordered[targetIndex];
    const current = ordered[currentIndex];
    if (target && current) {
      const currentRank = Number(current.featured_rank ?? currentIndex);
      const targetRank = Number(target.featured_rank ?? targetIndex);
      await admin
        .from("wishes")
        .update({ featured_rank: targetRank })
        .eq("id", current.id);
      await admin
        .from("wishes")
        .update({ featured_rank: currentRank })
        .eq("id", target.id);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

export async function createSiteMediaUpload(
  fileName: string,
  contentType: string
): Promise<
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string }
> {
  await requireAdmin();
  if (!IMAGE_TYPES.includes(contentType)) {
    return { ok: false, error: "Choose a JPEG, PNG, WebP, GIF, or HEIC image." };
  }

  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase()
    : contentType.split("/")[1];
  const path = `uploads/${crypto.randomUUID()}.${extension || "jpg"}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("site-media")
    .createSignedUploadUrl(path);
  if (error || !data?.token) {
    return { ok: false, error: "Could not prepare the upload." };
  }
  const publicUrl = admin.storage.from("site-media").getPublicUrl(path).data
    .publicUrl;
  return { ok: true, path, token: data.token, publicUrl };
}

export async function saveSiteMedia(
  input: {
    section: SiteMediaSection;
    url: string;
    storagePath: string;
    altText: string;
    caption: string;
    year: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!["film", "gallery"].includes(input.section)) {
    return { ok: false, error: "Choose a valid site section." };
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/site-media/`;
  if (
    !input.url.startsWith(expectedPrefix) ||
    !input.storagePath.startsWith("uploads/")
  ) {
    return { ok: false, error: "The uploaded image URL is invalid." };
  }

  const parsedYear = input.year ? Number(input.year) : null;
  if (
    parsedYear !== null &&
    (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100)
  ) {
    return { ok: false, error: "Enter a valid four-digit year." };
  }

  const admin = createAdminClient();
  const { data: last } = await admin
    .from("site_media")
    .select("sort_order")
    .eq("section", input.section)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("site_media").insert({
    section: input.section,
    url: input.url,
    storage_path: input.storagePath,
    alt_text: input.altText.trim().slice(0, 180),
    caption: input.caption.trim().slice(0, 180) || null,
    year: parsedYear,
    sort_order: Number(last?.sort_order ?? -1) + 1,
  });
  if (error) return { ok: false, error: "Could not save this site image." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSiteMedia(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  const { data } = await admin
    .from("site_media")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (data?.storage_path) {
    await admin.storage.from("site-media").remove([data.storage_path]);
  }
  await admin.from("site_media").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function moveSiteMedia(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const section = String(formData.get("section") ?? "");
  if (
    !id ||
    !["up", "down"].includes(direction) ||
    !["film", "gallery"].includes(section)
  ) {
    return;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("site_media")
    .select("id, sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: true });
  const ordered = data ?? [];
  const currentIndex = ordered.findIndex((item) => item.id === id);
  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const current = ordered[currentIndex];
  const target = ordered[targetIndex];
  if (!current || !target) return;

  await admin
    .from("site_media")
    .update({ sort_order: target.sort_order })
    .eq("id", current.id);
  await admin
    .from("site_media")
    .update({ sort_order: current.sort_order })
    .eq("id", target.id);
  revalidatePath("/admin");
  revalidatePath("/");
}
