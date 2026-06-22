"use server";

import { redirect } from "next/navigation";
import { verifyViewPasscode, setViewSession } from "@/lib/auth";

export async function loginView(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!verifyViewPasscode(passcode)) {
    return { error: "Wrong password, babe." };
  }
  await setViewSession();
  redirect("/view");
}
