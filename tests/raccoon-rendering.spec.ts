import { test, expect } from "@playwright/test";

/**
 * Raccoon rendering tests.
 * Verify the raccoon character canvas is present and non-empty
 * on pages that use the Character class.
 */

// Pages that render a Character (raccoon on canvas)
const RACCOON_PAGES = [
  { path: "/lessons/energy/", name: "Activation Energy" },
];

for (const page of RACCOON_PAGES) {
  test.describe(`${page.name} raccoon rendering`, () => {
    test("raccoon canvas is present and has drawn content", async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForTimeout(2000); // wait for character to appear

      // Find canvas elements (Character creates <canvas> elements)
      const canvases = p.locator("canvas");
      const count = await canvases.count();
      expect(count).toBeGreaterThan(0);

      // Check that at least one canvas has non-transparent pixels
      const hasContent = await p.evaluate(() => {
        const canvasEls = document.querySelectorAll("canvas");
        for (const c of canvasEls) {
          const ctx = c.getContext("2d");
          if (!ctx) continue;
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) return true;
          }
        }
        return false;
      });
      expect(hasContent).toBe(true);
    });

    test("raccoon canvas dimensions are 100x100", async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForTimeout(2000);

      const dimensions = await p.evaluate(() => {
        const canvasEls = document.querySelectorAll("canvas");
        for (const c of canvasEls) {
          if (c.width === 100 && c.height === 100) {
            return { width: c.width, height: c.height };
          }
        }
        return null;
      });
      expect(dimensions).not.toBeNull();
      expect(dimensions!.width).toBe(100);
      expect(dimensions!.height).toBe(100);
    });
  });
}

// Playground shows raccoon styles
test.describe("Raccoon Styles playground", () => {
  test("renders multiple raccoon canvases", async ({ page }) => {
    await page.goto("/playground/raccoon-styles/");
    await page.waitForTimeout(1000);

    const canvases = page.locator("canvas");
    const count = await canvases.count();
    // Playground shows 3 styles × 6 expressions + 3 walk demos = 21 canvases
    expect(count).toBeGreaterThanOrEqual(18);
  });
});
