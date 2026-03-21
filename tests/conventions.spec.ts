import { test, expect } from "@playwright/test";

/**
 * Convention audit tests.
 * Every lesson/playground page must follow the conventions in CLAUDE.md.
 */

// All non-hub pages that must follow conventions
const PAGES = [
  { path: "/lessons/energy/", name: "Activation Energy", slideNav: false },
  { path: "/lessons/glow/", name: "Energy, Not Time", slideNav: true },
  { path: "/lessons/free-evening/", name: "The Free Evening", slideNav: true },
  {
    path: "/playground/raccoon-styles/",
    name: "Raccoon Styles",
    slideNav: false,
  },
];

// Convention 1-3: Header, hub link, about modal
for (const page of PAGES) {
  test.describe(`${page.name} (${page.path})`, () => {
    test("has standard header with hub link", async ({ page: p }) => {
      await p.goto(page.path);
      const header = p.locator("#header");
      await expect(header).toBeVisible();

      // Hub link in breadcrumb
      const hubLink = header.locator('a[href="/"]');
      await expect(hubLink).toBeVisible();
      await expect(hubLink).toContainText("Explorable Explanations");
    });

    test("has working about modal", async ({ page: p }) => {
      await p.goto(page.path);

      // About link exists
      const aboutLink = p.locator("#about-link");
      await expect(aboutLink).toBeVisible();

      // Modal starts hidden
      const modal = p.locator("#about-modal");
      await expect(modal).toHaveClass(/modal-hidden/);

      // Click about opens modal
      await aboutLink.click();
      await expect(modal).not.toHaveClass(/modal-hidden/);

      // Close button works
      await p.locator("#modal-close").click();
      await expect(modal).toHaveClass(/modal-hidden/);
    });
  });
}

// Convention 4: Hub page has cards for all pages
test.describe("Hub page", () => {
  test("has card links to all pages", async ({ page }) => {
    await page.goto("/");
    for (const p of PAGES) {
      const card = page.locator(`a.card[href="${p.path}"]`);
      await expect(card).toBeVisible();
    }
  });
});

// Convention 6: Slide-based navigation
for (const page of PAGES.filter((p) => p.slideNav)) {
  test.describe(`${page.name} navigation`, () => {
    test("arrow right advances, arrow left goes back", async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForTimeout(1500);

      // Focus the page
      await p.locator("#stage").click({ position: { x: 1, y: 1 } });
      await p.waitForTimeout(1500);

      // After first click, we're on block 1 (click advanced from 0)
      const afterClickText = await p.locator(".block.visible").textContent();

      // Arrow right advances to block 2
      await p.keyboard.press("ArrowRight");
      await p.waitForTimeout(1500);
      const nextText = await p.locator(".block.visible").textContent();
      expect(nextText).not.toBe(afterClickText);

      // Arrow left goes back to block 1
      await p.keyboard.press("ArrowLeft");
      await p.waitForTimeout(1500);
      const backText = await p.locator(".block.visible").textContent();
      expect(backText).toBe(afterClickText);
    });

    test("space bar advances", async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForTimeout(1500);

      // Focus and advance once via click
      await p.locator("#stage").click({ position: { x: 1, y: 1 } });
      await p.waitForTimeout(1500);
      const firstText = await p.locator(".block.visible").textContent();

      await p.keyboard.press("Space");
      await p.waitForTimeout(1500);

      const secondText = await p.locator(".block.visible").textContent();
      expect(secondText).not.toBe(firstText);
    });
  });
}
