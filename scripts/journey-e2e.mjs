import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

async function waitForSectionAtTop(page, selector, tolerance = 8) {
  await page.waitForFunction(
    ({ target, maxDistance }) => {
      const element = document.querySelector(target);
      if (!element) return false;
      return Math.abs(element.getBoundingClientRect().top) < maxDistance;
    },
    { target: selector, maxDistance: tolerance },
    { timeout: 10000 }
  );
}

async function skipReplayedIntro(page) {
  await page.locator('[aria-label="An opening film of her life"]').waitFor();
  assert.ok(Math.abs(await page.evaluate(() => window.scrollY)) < 2);
  await page.getByRole("button", { name: "skip ✕" }).click();
  await page.locator('[aria-label="An opening film of her life"]').waitFor({
    state: "detached",
  });
  await page.waitForTimeout(600);
  assert.ok(Math.abs(await page.evaluate(() => window.scrollY)) < 2);
}

async function replayFromCurrentPosition(page) {
  await page.getByRole("button", { name: "↺ replay" }).click({ force: true });
  await skipReplayedIntro(page);
}

async function waitForJourneyReady(page) {
  await page.getByRole("button", { name: "Begin" }).waitFor();
  await page.waitForFunction(() => {
    const begin = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Begin"
    );
    return (
      begin &&
      Number.parseFloat(getComputedStyle(begin).opacity) > 0.9 &&
      !document.querySelector('[aria-label="An opening film of her life"]')
    );
  });
}

async function createJourneyPage(browser, options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem("adabekee:intro-seen", "1");
    window.__microphoneRequests = 0;
    window.__audioContextStarts = 0;
    const NativeAudioContext = window.AudioContext;
    if (NativeAudioContext) {
      window.AudioContext = class extends NativeAudioContext {
        constructor(...args) {
          super(...args);
          window.__audioContextStarts += 1;
        }
      };
    }
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          window.__microphoneRequests += 1;
          throw new Error("The candle must not request a microphone.");
        },
      },
    });
  });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await waitForJourneyReady(page);
  return { context, page };
}

async function goToCandle(page) {
  await page.getByRole("button", { name: "See the wishes →" }).click();
  await waitForSectionAtTop(page, "#gallery");
  await page.getByRole("button", { name: "Blow out the birthday candle" }).waitFor();
}

async function activateCandleAndWait(
  page,
  activation = "click",
  expectConfetti = true
) {
  const candle = page.getByRole("button", {
    name: "Blow out the birthday candle",
  });
  const heldY = await page.evaluate(() => window.scrollY);
  const activatedAt = Date.now();

  if (activation === "click") {
    await candle.click();
  } else {
    await candle.focus();
    await candle.press(activation);
  }

  await page.getByText("Make it a good one.").waitFor();
  const remainingHold = Math.max(0, 1300 - (Date.now() - activatedAt));
  await page.waitForTimeout(remainingHold);
  const heldPosition = await page.evaluate(() => window.scrollY);
  assert.ok(
    Math.abs(heldPosition - heldY) < 8,
    `candle celebration moved from ${heldY} to ${heldPosition}`
  );

  if (expectConfetti) {
    const confetti = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="birthday-confetti"]');
      return {
        width: canvas instanceof HTMLCanvasElement ? canvas.width : 0,
        height: canvas instanceof HTMLCanvasElement ? canvas.height : 0,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
      };
    });
    assert.equal(confetti.width, confetti.viewportWidth);
    assert.equal(confetti.height, confetti.viewportHeight);
  }

  await waitForSectionAtTop(page, "#wishes-grid", 25);
}

async function testNavigationReplayAndDecorativeDog(browser) {
  const { context, page } = await createJourneyPage(browser, {
    viewport: { width: 1280, height: 720 },
  });

  await page.getByRole("button", { name: "Begin" }).click();
  await waitForSectionAtTop(page, "#story");
  await page.getByRole("button", { name: "↺ replay" }).click({ force: true });
  await page.locator('[aria-label="An opening film of her life"]').waitFor();
  await page.mouse.click(500, 500);
  await page
    .getByRole("button", { name: "Mute projector sound" })
    .waitFor();
  await skipReplayedIntro(page);

  await goToCandle(page);
  await replayFromCurrentPosition(page);

  await page.evaluate(() => {
    const wishes = document.querySelector("#wishes-grid");
    wishes?.scrollIntoView();
  });
  await page.waitForTimeout(100);
  assert.ok((await page.evaluate(() => window.scrollY)) > 1000);
  await replayFromCurrentPosition(page);

  await page.mouse.move(640, 360);
  const dog = page.getByAltText("A puppy following the cursor");
  await dog.waitFor();
  assert.equal(
    await dog.evaluate((element) => getComputedStyle(element).pointerEvents),
    "none"
  );

  await context.close();
}

async function testCandleClickAndVideo(browser) {
  const { context, page } = await createJourneyPage(browser, {
    viewport: { width: 1280, height: 720 },
  });
  await goToCandle(page);

  const video = page.getByTestId("birthday-candle-video");
  await video.waitFor();
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-testid="birthday-candle-video"]');
    return element instanceof HTMLVideoElement && element.readyState >= 2;
  });
  const videoState = await video.evaluate((element) => {
    const videoElement = /** @type {HTMLVideoElement} */ (element);
    const rect = videoElement.getBoundingClientRect();
    return {
      src: videoElement.currentSrc,
      autoplay: videoElement.autoplay,
      muted: videoElement.muted,
      loop: videoElement.loop,
      playsInline: videoElement.playsInline,
      width: rect.width,
      height: rect.height,
      objectFit: getComputedStyle(videoElement).objectFit,
    };
  });
  assert.match(videoState.src, /\/videos\/birthday-candle\.mp4$/);
  assert.equal(videoState.autoplay, true);
  assert.equal(videoState.muted, true);
  assert.equal(videoState.loop, true);
  assert.equal(videoState.playsInline, true);
  assert.equal(videoState.objectFit, "cover");
  assert.ok(videoState.width >= 1280);
  assert.ok(videoState.height >= 720);
  assert.equal(
    await page.getByText(/microphone/i).count(),
    0,
    "microphone controls should be absent"
  );

  await page.mouse.move(640, 360);
  await activateCandleAndWait(page, "click");
  assert.equal(await page.evaluate(() => window.__microphoneRequests), 0);
  assert.ok(await page.evaluate(() => window.__audioContextStarts > 0));

  await context.close();
}

async function testWishesSearchDragAndLoop(browser) {
  const { context, page } = await createJourneyPage(browser, {
    viewport: { width: 1280, height: 720 },
  });
  await goToCandle(page);
  await activateCandleAndWait(page, "Enter");

  await page
    .getByRole("heading", { name: "Here’s some wishes for you." })
    .waitFor();
  assert.equal(
    await page.getByText(/people took a moment|first wishes are still/i).count(),
    0
  );

  const scroller = page.getByTestId("wishes-scroller");
  const primaryCards = page.locator('[data-wish-group="primary"] button');
  assert.ok((await primaryCards.count()) > 1);

  await page.mouse.move(10, 10);
  const autoplayStart = await scroller.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(700);
  const autoplayEnd = await scroller.evaluate((element) => element.scrollLeft);
  assert.ok(
    autoplayEnd - autoplayStart > 20,
    `autoplay only moved ${autoplayEnd - autoplayStart}px`
  );

  // The second row travels the opposite direction. Sample over a short window
  // (kept under the wrap threshold) so the negative delta is observable.
  const secondRow = page.getByTestId("wishes-scroller-2");
  assert.ok((await page.locator('[data-wish-group="primary-2"] button').count()) > 1);
  await page.mouse.move(10, 10);
  const reverseStart = await secondRow.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(400);
  const reverseEnd = await secondRow.evaluate((element) => element.scrollLeft);
  assert.ok(
    reverseEnd - reverseStart < -10,
    `second row should scroll left, moved ${reverseEnd - reverseStart}px`
  );

  const box = await scroller.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
  await page.mouse.down();
  const dragStart = await scroller.evaluate((element) => element.scrollLeft);
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.5, {
    steps: 8,
  });
  await page.mouse.up();
  const dragEnd = await scroller.evaluate((element) => element.scrollLeft);
  assert.ok(Math.abs(dragEnd - dragStart) > 100);

  const wrapped = await scroller.evaluate((element) => {
    const group = document.querySelector('[data-wish-group="primary"]');
    const width = group?.scrollWidth ?? 0;
    element.scrollLeft = width * 1.7;
    element.dispatchEvent(new Event("scroll"));
    return { left: element.scrollLeft, width };
  });
  assert.ok(wrapped.left > wrapped.width * 0.5);
  assert.ok(wrapped.left < wrapped.width * 1.5);

  const search = page.getByTestId("wishes-search");
  await search.fill("Olamide");
  assert.equal(await page.locator('[data-wish-group="primary"] button').count(), 1);
  assert.ok(await page.getByText("yours", { exact: true }).isVisible());

  await search.fill("chaos department");
  assert.equal(await page.locator('[data-wish-group="primary"] button').count(), 1);
  assert.ok(await page.getByText("The group chat", { exact: true }).isVisible());

  await search.fill("words kept failing");
  assert.equal(await page.locator('[data-wish-group="primary"] button').count(), 1);

  const searchPausedAt = await scroller.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(500);
  assert.equal(
    await scroller.evaluate((element) => element.scrollLeft),
    searchPausedAt
  );

  await search.fill("definitely nobody");
  await page.getByText("No wishes match “definitely nobody”.").waitFor();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByTestId("wishes-scroller").waitFor();

  const firstCard = page.locator('[data-wish-group="primary"] button').first();
  await firstCard.focus();
  const focusPausedAt = await scroller.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(500);
  assert.equal(
    await scroller.evaluate((element) => element.scrollLeft),
    focusPausedAt
  );
  await firstCard.press("Enter");
  await page.getByRole("dialog", { name: /Wish from/ }).waitFor();
  await page.getByRole("button", { name: "Close" }).click();

  await context.close();
}

async function testMobileTouchAndSpace(browser) {
  const { context, page } = await createJourneyPage(browser, {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await goToCandle(page);

  const videoSize = await page.getByTestId("birthday-candle-video").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  assert.ok(videoSize.width >= 390);
  assert.ok(videoSize.height >= 844);

  await activateCandleAndWait(page, "Space");
  const scroller = page.getByTestId("wishes-scroller");
  const touchStyles = await scroller.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    touchAction: getComputedStyle(element).touchAction,
  }));
  assert.equal(touchStyles.overflowX, "auto");
  assert.equal(touchStyles.touchAction, "pan-x");

  const mobileCardWidth = await page
    .locator('[data-wish-group="primary"] button')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  assert.ok(mobileCardWidth <= 390 * 0.9);

  const box = await scroller.boundingBox();
  assert.ok(box);
  const beforeSwipe = await scroller.evaluate((element) => element.scrollLeft);
  const cdp = await context.newCDPSession(page);
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.82, y }],
  });
  for (const ratio of [0.68, 0.54, 0.4, 0.26]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + box.width * ratio, y }],
    });
    await page.waitForTimeout(35);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(150);
  const afterSwipe = await scroller.evaluate((element) => element.scrollLeft);
  assert.ok(Math.abs(afterSwipe - beforeSwipe) > 60);

  await context.close();
}

async function testReducedMotion(browser) {
  const { context, page } = await createJourneyPage(browser, {
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
  });
  await goToCandle(page);
  await activateCandleAndWait(page, "click", false);

  const scroller = page.getByTestId("wishes-scroller");
  // Two opposite-scrolling rows: one group each (primary + primary-2).
  assert.equal(await page.locator("[data-wish-group]").count(), 2);
  const reducedStyles = await scroller.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    maskImage: getComputedStyle(element).maskImage,
    scrollLeft: element.scrollLeft,
  }));
  assert.equal(reducedStyles.overflowX, "auto");
  assert.equal(reducedStyles.maskImage, "none");
  await page.waitForTimeout(600);
  assert.equal(
    await scroller.evaluate((element) => element.scrollLeft),
    reducedStyles.scrollLeft
  );

  await context.close();
}

const browser = await chromium.launch();

try {
  await testNavigationReplayAndDecorativeDog(browser);
  await testCandleClickAndVideo(browser);
  await testWishesSearchDragAndLoop(browser);
  await testMobileTouchAndSpace(browser);
  await testReducedMotion(browser);
  console.log("Journey Playwright checks passed.");
} finally {
  await browser.close();
}
