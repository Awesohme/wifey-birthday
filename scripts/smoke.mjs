// Local smoke test: drives the app in headless Chromium at phone size,
// captures screenshots and console/page errors. Run with the dev server up.
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));

// 1. Home — intro closeup
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/1-intro-closeup.png` });

// 2. Home — full scene after the butterfly flight
await page.waitForTimeout(5500);
await page.screenshot({ path: `${OUT}/2-scene.png` });

// 3. Wish form
await page.goto(`${BASE}/wish`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/3-wish-form.png` });
await page.getByLabel("Your name").fill("Smoke Test");
await page.getByRole("button", { name: "Voice note" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/4-wish-voice.png` });
await page.getByRole("button", { name: "Photo / video" }).click();
await page.waitForTimeout(300);

// Submitting without a message/media should show inline validation
await page.getByRole("button", { name: "Just text" }).click();
await page.getByRole("button", { name: /Send your wish/ }).click();
await page.waitForTimeout(400);
const validation = await page.getByRole("alert").textContent().catch(() => null);

// 4. Admin — gate, wrong passcode, right passcode
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/5-admin-gate.png` });
await page.getByLabel("Passcode").fill("wrong");
await page.getByRole("button", { name: "Enter" }).click();
await page.waitForTimeout(800);
const wrongMsg = await page.getByText("Wrong passcode.").isVisible().catch(() => false);
await page.getByLabel("Passcode").fill(process.env.TEST_PASSCODE ?? "smoke-pass-123");
await page.getByRole("button", { name: "Enter" }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/6-admin-in.png` });
const adminHeading = await page.getByText(/tree 🌳/).isVisible().catch(() => false);

// 5. Desktop scene
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desktop.on("pageerror", (err) => errors.push(`[desktop pageerror] ${err.message}`));
await desktop.goto(BASE, { waitUntil: "networkidle" });
await desktop.waitForTimeout(7000);
await desktop.screenshot({ path: `${OUT}/7-scene-desktop.png` });

console.log(JSON.stringify({
  validationMessage: validation,
  wrongPasscodeShown: wrongMsg,
  adminUnlocked: adminHeading,
  errors,
}, null, 2));

await browser.close();
