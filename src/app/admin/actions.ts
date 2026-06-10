"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, setAdminSession, verifyPasscode } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("media_url")
    .eq("id", id)
    .single();

  if (wish?.media_url) {
    const path = wish.media_url.split("/wish-media/").pop();
    if (path) await admin.storage.from("wish-media").remove([path]);
  }
  await admin.from("wishes").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/");
}
