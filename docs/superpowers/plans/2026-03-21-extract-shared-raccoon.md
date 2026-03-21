# Extract Shared Raccoon Drawing + E2E Tests

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the raccoon drawing code into a shared module so all pages can import it, and add E2E tests verifying the raccoon renders correctly across pages.

**Architecture:** Pull the pure drawing function out of `Character.ts` into `src/characters/drawRaccoon.ts`. `Character.ts` becomes a thin wrapper (DOM element + positioning + animation) that delegates drawing to the shared function. The glow lesson converts from inline JS to a TypeScript module so it can import the shared drawing code. E2E tests use Playwright to verify raccoon canvas rendering on each page.

**Tech Stack:** TypeScript, Canvas 2D, Vite multi-page build, Playwright

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/characters/drawRaccoon.ts` | Pure drawing function: takes ctx, width, height, expression → draws raccoon |
| Modify | `src/characters/Character.ts` | Remove drawing code, import and call `drawRaccoon()` |
| Modify | `src/characters/expressions.ts` | No changes (already clean) |
| Create | `src/lessons/glow/main.ts` | TypeScript entry point for glow lesson |
| Modify | `lessons/glow/index.html` | Replace inline `<script>` with `<script type="module" src="...">` |
| Modify | `vite.config.ts` | No changes needed (glow entry already points to HTML) |
| Create | `tests/raccoon-rendering.spec.ts` | E2E tests: raccoon canvas present and non-empty on each page |
| Modify | `tests/conventions.spec.ts` | Add free-evening to PAGES array (it's missing) |

---

### Task 1: Extract `drawRaccoon` function

**Files:**
- Create: `src/characters/drawRaccoon.ts`
- Modify: `src/characters/Character.ts`

- [ ] **Step 1: Create `drawRaccoon.ts` with the pure drawing function**

Extract everything from `Character.ts` that is drawing-related: palette constants, geometry constants, blush colors, the `drawStar` helper, and the `draw()` method body. The function signature:

```typescript
import { ExpressionName, EXPRESSIONS } from "./expressions";

// All palette, geometry, and blush constants move here

export function drawRaccoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  expression: ExpressionName,
): void {
  // Full drawing code from Character.draw(), using w/h for centering
}
```

The `drawStar` helper becomes a module-level function (not a class method).

- [ ] **Step 2: Update `Character.ts` to import and use `drawRaccoon`**

`Character.ts` becomes thin — it keeps: canvas element creation, positioning, `walkTo` animation, `setExpression`, `expressionForWillpower`. The `draw()` method becomes:

```typescript
import { drawRaccoon, RACCOON_CANVAS_SIZE } from "./drawRaccoon";

// ...
private draw(expression: ExpressionName): void {
  drawRaccoon(this.ctx, CANVAS_SIZE, CANVAS_SIZE, expression);
}
```

Export `RACCOON_CANVAS_SIZE` from `drawRaccoon.ts` so Character.ts and other consumers can use it for canvas sizing.

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: No errors. No behavior change.

- [ ] **Step 4: Visually verify in browser**

Open `http://localhost:5182/lessons/energy/` and confirm the raccoon renders identically to before.

- [ ] **Step 5: Commit**

```bash
git add src/characters/drawRaccoon.ts src/characters/Character.ts
git commit -m "refactor: extract drawRaccoon into shared module"
```

---

### Task 2: Convert glow lesson to TypeScript module

**Files:**
- Create: `src/lessons/glow/main.ts`
- Modify: `lessons/glow/index.html`

- [ ] **Step 1: Read the current glow lesson inline JS**

Read `lessons/glow/index.html` to understand what the inline `<script>` block does — it's a slide-based lesson with BLOCKS array, navigation, and progress dots.

- [ ] **Step 2: Create `src/lessons/glow/main.ts`**

Move the inline JavaScript logic into this TypeScript file. Import the shared raccoon drawing:

```typescript
import { drawRaccoon } from "../../characters/drawRaccoon";
import { ExpressionName } from "../../characters/expressions";
```

Even if the current glow lesson doesn't draw a raccoon yet, this establishes the import path for when it does.

Keep the navigation logic (BLOCKS, advance, goBack, showBlock, keyboard/click/swipe handlers, progress dots). Convert to TypeScript with proper types.

- [ ] **Step 3: Update `lessons/glow/index.html`**

- Remove the inline `<script>` block
- Remove inline `<style>` that can move to a CSS import (or keep inline if it's page-specific)
- Add: `<script type="module" src="/src/lessons/glow/main.ts"></script>`
- Keep the HTML structure (header, modal, stage, progress dots)

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: No errors. Glow lesson works identically.

- [ ] **Step 5: Visually verify**

Open `http://localhost:5182/lessons/glow/` — slides, navigation, about modal all work.

- [ ] **Step 6: Commit**

```bash
git add src/lessons/glow/main.ts lessons/glow/index.html
git commit -m "refactor: convert glow lesson to TypeScript module"
```

---

### Task 3: E2E tests for raccoon rendering

**Files:**
- Create: `tests/raccoon-rendering.spec.ts`
- Modify: `tests/conventions.spec.ts`

- [ ] **Step 1: Add free-evening to conventions PAGES array**

In `tests/conventions.spec.ts`, the free-evening lesson is missing from the PAGES array. Add it:

```typescript
{ path: "/lessons/free-evening/", name: "The Free Evening", slideNav: true },
```

- [ ] **Step 2: Write raccoon rendering tests**

Create `tests/raccoon-rendering.spec.ts`:

```typescript
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
          // Check if any pixel has non-zero alpha
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
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm run test`
Expected: All tests pass — both the new raccoon tests and the existing convention tests.

- [ ] **Step 4: Commit**

```bash
git add tests/raccoon-rendering.spec.ts tests/conventions.spec.ts
git commit -m "test: add raccoon rendering E2E tests"
```

---

### Task 4: Verify everything end-to-end

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 3: Visual spot-check all pages**

Verify in browser:
- `/lessons/energy/` — raccoon renders in Ch0
- `/lessons/glow/` — slides work, navigation works
- `/playground/raccoon-styles/` — all 3 styles visible
- `/` — hub page has all cards

- [ ] **Step 4: Push to deploy**

```bash
git push
```
