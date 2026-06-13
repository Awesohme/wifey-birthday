import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    })
);
const passcode = process.env.TEST_PASSCODE ?? env.ADMIN_PASSCODE;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
const testName = `E2E Rich ${Date.now()}`;
const testCaption = `E2E film ${Date.now()}`;
const imagePath = "/tmp/birthday-content-e2e.png";

writeFileSync(
  imagePath,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwMDAxAADCBYAG10BBdmK0c8AAAAASUVORK5CYII=",
    "base64"
  )
);

const admin = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

async function cleanup() {
  const { data: wishes } = await admin
    .from("wishes")
    .select("id, media_url, voice_url, video_url, image_url, together_image_url")
    .eq("name", testName);
  for (const wish of wishes ?? []) {
    const paths = [
      wish.media_url,
      wish.voice_url,
      wish.video_url,
      wish.image_url,
      wish.together_image_url,
    ]
      .filter(Boolean)
      .map((url) => url.split("/wish-media/").pop())
      .filter(Boolean);
    if (paths.length) {
      await admin.storage.from("wish-media").remove([...new Set(paths)]);
    }
    await admin.from("wishes").delete().eq("id", wish.id);
  }

  const { data: media } = await admin
    .from("site_media")
    .select("id, storage_path")
    .eq("caption", testCaption);
  for (const item of media ?? []) {
    await admin.storage.from("site-media").remove([item.storage_path]);
    await admin.from("site_media").delete().eq("id", item.id);
  }
}

await cleanup();

const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
await context.grantPermissions(["microphone", "camera"]);
const page = await context.newPage();

try {
  await page.goto(`${BASE_URL}/wish`, { waitUntil: "domcontentloaded" });
  await page.locator("#wish-name").fill(testName);
  await page.locator("#wish-rel").fill("automated birthday tester");
  await page
    .locator("#wish-msg")
    .fill("A rich birthday wish with every kind of memory attached.");

  const voiceSection = page
    .locator("details")
    .filter({ hasText: "Your voice, exactly as it sounds" });
  await voiceSection.locator("summary").click();
  await voiceSection.getByRole("button", { name: "Tap to start recording" }).click();
  await page.waitForTimeout(500);
  await voiceSection.getByRole("button", { name: "Stop", exact: true }).click();
  await voiceSection.locator("audio").waitFor();

  const videoSection = page
    .locator("details")
    .filter({ hasText: "A tiny film for her" });
  await videoSection.locator("summary").click();
  await videoSection.getByRole("button", { name: "Record on screen" }).click();
  await videoSection.getByText("Camera ready").waitFor();
  await videoSection.getByRole("button", { name: "Start recording" }).click();
  await page.waitForTimeout(600);
  await videoSection.getByRole("button", { name: "Stop", exact: true }).click();
  await videoSection.locator("video[controls]").waitFor();

  const imageSection = page
    .locator("details")
    .filter({ hasText: "One frame from your world" });
  await imageSection.locator("summary").click();
  await imageSection.getByLabel("Upload birthday image").setInputFiles(imagePath);
  await imageSection.getByAltText("birthday image preview").waitFor();

  const togetherSection = page
    .locator("details")
    .filter({ hasText: "Proof you and Adabekee happened" });
  await togetherSection.locator("summary").click();
  await togetherSection
    .getByLabel("Upload photo with Adabekee")
    .setInputFiles(imagePath);
  await togetherSection.getByAltText("photo with Adabekee preview").waitFor();

  await page
    .getByRole("button", { name: "Seal and send to Adabekee" })
    .click();
  await page
    .getByText("Your letter is on its way.")
    .waitFor({ timeout: 30000 });

  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
  if (await page.getByLabel("Passcode").isVisible().catch(() => false)) {
    await page.getByLabel("Passcode").fill(passcode);
    await page.getByRole("button", { name: "Enter" }).click();
  }
  await page.getByRole("heading", { name: "Build the visual story" }).waitFor();

  let wishCard = page.locator("article").filter({ hasText: testName });
  assert.equal(await wishCard.count(), 1);
  await wishCard.getByRole("button", { name: "Approve" }).click();
  await page.waitForTimeout(700);
  wishCard = page.locator("article").filter({ hasText: testName });
  await wishCard
    .getByRole("button", { name: "Show before the rest" })
    .click();
  await page.getByText("pinned first", { exact: true }).waitFor();

  await page.getByLabel("Image", { exact: true }).setInputFiles(imagePath);
  await page.getByLabel("Alt text").fill("E2E film test image");
  await page.getByLabel("Caption").fill(testCaption);
  await page.getByLabel("Year").fill("2026");
  await page.getByRole("button", { name: "Add to the site" }).click();
  await page.getByText(testCaption, { exact: true }).waitFor({ timeout: 30000 });

  await page.addInitScript(() => {
    sessionStorage.setItem("adabekee:intro-seen", "1");
  });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Begin" }).waitFor();
  assert.ok((await page.locator('a[href="/wish"]').count()) >= 3);
  await page.locator('img[src*="/site-media/"]').waitFor();

  const wishButtons = page.getByRole("button", {
    name: `Open the wish from ${testName}`,
  });
  assert.ok((await wishButtons.count()) >= 1);

  console.log("Content and admin Playwright checks passed.");
} finally {
  await browser.close();
  await cleanup();
}
