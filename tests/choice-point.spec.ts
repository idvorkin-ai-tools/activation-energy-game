import { test, expect } from "@playwright/test";

test.describe("Choice Point lesson", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons/choice-point/");
  });

  test("page loads with header and game container", async ({ page }) => {
    await expect(page.locator("#header")).toBeVisible();
    await expect(page.locator("#game")).toBeVisible();
  });

  test("about modal opens and closes", async ({ page }) => {
    await page.click("#about-link");
    await expect(page.locator("#about-modal")).not.toHaveClass(/modal-hidden/);
    await page.click("#modal-close");
    await expect(page.locator("#about-modal")).toHaveClass(/modal-hidden/);
  });

  test("intro screen shows Harris framing and a begin button", async ({ page }) => {
    await expect(page.locator(".cp-intro")).toBeVisible();
    await expect(page.locator(".cp-intro")).toContainText("Harris");
    await expect(page.locator(".cp-begin-btn")).toBeVisible();
    await expect(page.locator(".cp-begin-btn")).toContainText(/tap to begin/i);
  });

  test("arcade layout appears after tapping begin", async ({ page }) => {
    await page.click(".cp-begin-btn");
    await expect(page.locator(".cp-bin-away")).toBeVisible();
    await expect(page.locator(".cp-bin-towards")).toBeVisible();
    await expect(page.locator(".cp-bin-away")).toContainText("AWAY");
    await expect(page.locator(".cp-bin-towards")).toContainText("TOWARDS");
    await expect(page.locator(".cp-decision-line")).toBeVisible();
    // Raccoon canvas (Character class appends a canvas)
    await expect(page.locator(".cp-raccoon-layer canvas")).toBeVisible();
  });

  test("first tile appears after begin and shows scenario text", async ({ page }) => {
    await page.click(".cp-begin-btn");
    await expect(page.locator(".cp-tile")).toBeVisible({ timeout: 2000 });
    const tileText = await page.locator(".cp-tile-text").textContent();
    expect(tileText?.length ?? 0).toBeGreaterThan(5);
  });

  test("tapping right routes tile to towards bin and drops next", async ({ page }) => {
    await page.click(".cp-begin-btn");
    await expect(page.locator(".cp-tile")).toBeVisible();
    const firstText = await page.locator(".cp-tile-text").textContent();

    // Tap the right half of the stage (anywhere in the right half outside the tile)
    const stage = page.locator(".cp-stage");
    const box = (await stage.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.85);

    // Next tile should appear with different text
    await expect(page.locator(".cp-tile")).toBeVisible({ timeout: 2000 });
    await page.waitForTimeout(400);
    const secondText = await page.locator(".cp-tile-text").textContent();
    expect(secondText).not.toBe(firstText);
  });

  test("HUD updates to wave 2 after 6 tiles routed", async ({ page }) => {
    await page.click(".cp-begin-btn");
    const stage = page.locator(".cp-stage");
    const box = (await stage.boundingBox())!;
    const clickX = box.x + box.width * 0.75;
    const clickY = box.y + box.height * 0.85;

    // Route 6 tiles to finish wave 1
    for (let i = 0; i < 6; i++) {
      await expect(page.locator(".cp-tile")).toBeVisible({ timeout: 3000 });
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(400);
    }

    await expect(page.locator(".cp-hud-wave")).toContainText("WAVE 2", { timeout: 3000 });
  });
});
