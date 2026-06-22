import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bt_admin";
const VIEW_COOKIE = "bt_view";

function sessionToken(): string {
  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) throw new Error("ADMIN_PASSCODE is not set in the environment.");
  return createHash("sha256").update(`bt:${passcode}`).digest("hex");
}

export function verifyPasscode(input: string): boolean {
  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(passcode).digest();
  return timingSafeEqual(a, b);
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSCODE) return false;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === sessionToken();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Not authorised.");
}

// ── View (Adabekee's private page) ──────────────────────────────────────────

function viewSessionToken(): string {
  const passcode = process.env.VIEW_PASSCODE;
  if (!passcode) throw new Error("VIEW_PASSCODE is not set.");
  return createHash("sha256").update(`btview:${passcode}`).digest("hex");
}

export function verifyViewPasscode(input: string): boolean {
  const passcode = process.env.VIEW_PASSCODE;
  if (!passcode) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(passcode).digest();
  return timingSafeEqual(a, b);
}

export async function setViewSession() {
  const cookieStore = await cookies();
  cookieStore.set(VIEW_COOKIE, viewSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function isViewer(): Promise<boolean> {
  if (!process.env.VIEW_PASSCODE) return false;
  const cookieStore = await cookies();
  return cookieStore.get(VIEW_COOKIE)?.value === viewSessionToken();
}
