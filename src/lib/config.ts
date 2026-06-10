export const HER_NAME = "Adabekee";

// 12:00am June 22, 2026 in West Africa Time (UTC+1)
export const UNLOCK_AT = new Date("2026-06-21T23:00:00Z");

export function isUnlocked(): boolean {
  const override = process.env.REVEAL_OVERRIDE;
  if (override === "open") return true;
  if (override === "locked") return false;
  return Date.now() >= UNLOCK_AT.getTime();
}

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

export type MediaType = "audio" | "image" | "video";

export type Wish = {
  id: string;
  name: string;
  relationship: string | null;
  message_text: string | null;
  media_url: string | null;
  media_type: MediaType | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
