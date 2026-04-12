import { test, expect, Page } from "@playwright/test";

/**
 * Advances past the three-slide glow-style intro by pressing Space.
 * Each slide fades out over 400ms before the next advances.
 */
async function skipIntro(page: Page): Promise<void> {
  await page.waitForSelector(".dtr-intro.dtr-intro-visible");
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
  }
}

test.describe("Drop the Rope lesson", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
  });

  test("page loads with header and game container", async ({ page }) => {
    await expect(page.locator("#header")).toBeVisible();
    await expect(page.locator("#game-container")).toBeVisible();
  });

  test("about modal opens and closes", async ({ page }) => {
    await page.click("#about-link");
    await expect(page.locator("#about-modal")).not.toHaveClass(/modal-hidden/);
    await page.click("#modal-close");
    await expect(page.locator("#about-modal")).toHaveClass(/modal-hidden/);
  });

  test("intro shows the first line", async ({ page }) => {
    await expect(page.locator(".dtr-intro")).toBeVisible();
    await expect(page.locator(".dtr-intro")).toContainText("Every hard feeling");
  });

  test("advances through all 3 intro slides via Space key", async ({ page }) => {
    await page.waitForSelector(".dtr-intro.dtr-intro-visible");
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await expect(page.locator(".dtr-intro")).toContainText("Fighting it is the trap");
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await expect(page.locator(".dtr-intro")).toContainText("Here. Try.");
    await page.keyboard.press("Space");
    // Intro is gone; canvas is rendering round 1
    await expect(page.locator(".dtr-intro")).toHaveCount(0);
    await expect(page.locator("canvas").first()).toBeVisible();
  });

  test("drop button appears and advances the round into the valued scene", async ({ page }) => {
    // Round 1 uses a 12s drop timer (tuned from 18s by playtest agent) plus a
    // ~1.2s fade-in. Per-test budget is bumped so the test has headroom.
    test.setTimeout(60000);
    await skipIntro(page);
    const dropBtn = page.locator(".dtr-drop-button");
    // Initially hidden
    await expect(dropBtn).toBeHidden();
    // Eventually visible within 18s (12s timer + fade + fudge)
    await expect(dropBtn).toBeVisible({ timeout: 18000 });
    await dropBtn.click();
    // After drop + walk-past + crossfade + walk-to-spot + 2s caption wait, caption should appear.
    await expect(page.locator(".dtr-caption-visible")).toBeVisible({ timeout: 12000 });
    await expect(page.locator(".dtr-caption")).toContainText("coffee");
  });

  test("restart link returns to intro", async ({ page }) => {
    await page.waitForTimeout(400);
    await page.click("#restart-link");
    await expect(page.locator(".dtr-intro")).toContainText("Every hard feeling");
  });

  test("hub link is reachable from header", async ({ page }) => {
    const hubLink = page.locator("#header a", { hasText: /Explorable Explanations|EE/ }).first();
    await expect(hubLink).toHaveAttribute("href", "/");
  });
});
