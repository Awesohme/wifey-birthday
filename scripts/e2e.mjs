// Full end-to-end: submit a text wish + a recorded voice wish, approve both
// in /admin, confirm ornaments appear on the tree and open correctly.
// Requires the dev server running with REVEAL_OVERRIDE=open.
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASS = process.env.TEST_PASSCODE ?? "adabekee-gardener-2206";
const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.grantPermissions(["microphone"]);
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && errors.push(`[console] ${m.text()}`));
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

const results = {};

// 1. Text wish
await page.goto(`${BASE}/wish`, { waitUntil: "networkidle" });
await page.getByLabel("Your name").fill("E2E Text");
await page.getByLabel(/How do you know her/).fill("test robot");
await page.getByLabel("Your birthday wish").fill("Happy birthday! (e2e test wish, will be deleted)");
await page.getByRole("button", { name: /Send your wish/ }).click();
await page.getByText(/Your wish has been hung/).waitFor({ timeout: 15000 });
results.textWishSubmitted = true;
await page.screenshot({ path: `${OUT}/e2e-1-submitted.png` });

// 2. Voice wish (records 3s of fake-device audio)
await page.getByRole("button", { name: "Leave another wish" }).click();
await page.getByLabel("Your name").fill("E2E Voice");
await page.getByRole("button", { name: "Voice note" }).click();
await page.getByRole("button", { name: /Tap to start recording/ }).click();
await page.waitForTimeout(3000);
await page.getByRole("button", { name: "Stop", exact: true }).click();
await page.locator("audio").waitFor({ timeout: 5000 });
await page.getByRole("button", { name: /Send your wish/ }).click();
await page.getByText(/Your wish has been hung/).waitFor({ timeout: 30000 });
results.voiceWishSubmitted = true;

// 3. Approve both in admin
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.getByLabel("Passcode").fill(PASS);
await page.getByRole("button", { name: "Enter" }).click();
await page.getByText(/Waiting for you \(2\)/).waitFor({ timeout: 15000 });
await page.screenshot({ path: `${OUT}/e2e-2-admin-pending.png` });
for (let i = 0; i < 2; i++) {
  await page.getByRole("button", { name: "Approve" }).first().click();
  await page.waitForTimeout(1500);
}
await page.getByText(/On the tree \(2\)/).waitFor({ timeout: 15000 });
results.bothApproved = true;
await page.screenshot({ path: `${OUT}/e2e-3-admin-approved.png` });

// 4. The tree: two ornaments, open both
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(7000); // intro
await page.screenshot({ path: `${OUT}/e2e-4-tree.png` });
// force: the ornaments sway perpetually, so Playwright never sees them "stable"
const textOrnament = page.getByRole("button", { name: "Open the wish from E2E Text" });
await textOrnament.click({ force: true });
await page.getByText(/e2e test wish/).waitFor({ timeout: 5000 });
results.textWishOpens = true;
await page.screenshot({ path: `${OUT}/e2e-5-text-card.png` });
await page.getByRole("button", { name: "Close" }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Open the wish from E2E Voice" }).click({ force: true });
await page.locator("audio").waitFor({ timeout: 5000 });
const audioSrc = await page.locator("audio").getAttribute("src");
results.voiceWishHasAudio = Boolean(audioSrc?.includes("wish-media"));
await page.screenshot({ path: `${OUT}/e2e-6-voice-card.png` });
await page.getByRole("button", { name: "Close" }).click();

// 5. Cleanup: delete both test wishes (also removes uploaded media)
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
for (let attempt = 0; attempt < 6; attempt++) {
  const remaining = await page.getByRole("button", { name: "Delete" }).count();
  if (remaining === 0) break;
  await page.getByRole("button", { name: "Delete" }).first().click();
  // wait for the revalidated page before clicking again
  await page.waitForTimeout(2500);
  await page.reload({ waitUntil: "networkidle" });
}
results.cleanupComplete = (await page.getByRole("button", { name: "Delete" }).count()) === 0;

results.errors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
process.exit(errors.length || !results.cleanupComplete ? 1 : 0);
