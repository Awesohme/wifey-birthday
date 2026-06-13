/* Drives the local app (hosted Supabase backend) to verify the 3D experience.
 * Usage: node scripts/verify-3d.mjs [baseURL]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3231";
mkdirSync("scripts/shots", { recursive: true });

const errors = [];
function track(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${label}] console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${label}] pageerror: ${err.message}`));
}

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});

// ---------- 1. Desktop, WebGL path ----------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  track(page, "desktop-3d");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "scripts/shots/3d-1-closeup.png" });
  await page.waitForTimeout(5500); // through flight → scene
  await page.screenshot({ path: "scripts/shots/3d-2-scene.png" });

  const hasCanvas = await page.locator("canvas").count();
  console.log("canvas elements:", hasCanvas);
  console.log("title visible:", await page.getByText("Happy Birthday").isVisible());

  // Open a wish via the accessible ornament button (proves raycast targets exist too)
  const ornaments = page.locator('button[aria-label^="Open the wish from"]');
  const n = await ornaments.count();
  console.log("ornament buttons:", n);
  if (n > 0) {
    await ornaments.first().click({ force: true });
    await page.waitForTimeout(900);
    const dialogVisible = await page.locator('[role="dialog"]').isVisible();
    console.log("wish card opened:", dialogVisible);
    await page.screenshot({ path: "scripts/shots/3d-3-wishcard.png" });
    if (dialogVisible) {
      await page.locator('button[aria-label="Close"]').click();
      await page.waitForTimeout(1500); // let the exit spring finish
      console.log("wish card closed:", !(await page.locator('[role="dialog"]').isVisible()));
    }
  }
  await page.close();
}

// ---------- 2. Mobile viewport ----------
{
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  track(page, "mobile-3d");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(7500);
  await page.screenshot({ path: "scripts/shots/3d-4-mobile.png" });
  console.log("mobile canvas:", await page.locator("canvas").count());
  await page.close();
}

await browser.close();

// ---------- 3. No-WebGL fallback (SVG scene) ----------
{
  const b2 = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] });
  const page = await b2.newPage({ viewport: { width: 1280, height: 800 } });
  track(page, "fallback-svg");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(7000);
  const svg = await page.locator('svg[aria-label="A meadow with a wish tree"]').count();
  console.log("svg fallback rendered:", svg > 0);
  await page.screenshot({ path: "scripts/shots/3d-5-fallback.png" });
  await page.close();
  await b2.close();
}

if (errors.length) {
  console.log("\nERRORS:");
  for (const e of errors) console.log(" -", e);
  process.exit(1);
}
console.log("\nNo console/page errors. ✅");
