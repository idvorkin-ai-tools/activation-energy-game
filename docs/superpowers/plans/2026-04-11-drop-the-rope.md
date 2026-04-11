# Drop the Rope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `Drop the Rope` lesson — a wordless 5-round ACT defusion exercise where the raccoon faces five emotion-monsters in a warm dawn world, learning that letting go is the same move every time.

**Architecture:** Self-contained state machine (like `morning-choice`). Top-level game runs `intro → round(1..5) → gallery`. Each round is its own async state machine: `arriving → struggling → buttonVisible → dropping → walking → valued`. Rendering is procedural Canvas 2D (warm dawn background + silhouette monsters + rope) with the raccoon as a separate DOM canvas overlay via `Character`. No shared willpower bar.

**Tech Stack:** TypeScript (strict), Vite MPA, Canvas 2D, existing `Character` / `drawRaccoon` / `raccoonComposite` modules, Playwright E2E.

**Design doc:** `docs/plans/2026-04-11-drop-the-rope-monster-gallery-design.md` (rev 3 — all 11 open questions locked).

**Prerequisite:** PR #8 (mismatched Crocs) must merge before Task 3. That PR extends `drawRaccoon` to draw left-blue / right-yellow Crocs so the in-game raccoon matches the canonical style.

---

## File structure

**New files:**

```
src/lessons/drop-the-rope/
  index.html             # entry HTML: header, about modal, container div
  main.ts                # bootstrap: new DropTheRopeGame(container)
  game.ts                # top-level state machine (intro → rounds → gallery)
  types.ts               # Monster, RoundState, GameState interfaces
  monsters.ts            # MONSTERS data + drawMonster(ctx, monster, phase)
  rope.ts                # drawRope(ctx, from, to, tension, flashFrame)
  warm-dawn.ts           # drawWarmDawn(ctx, w, h) — the shared background
  exhaustion-bar.ts      # ExhaustionBar class (top thin bar, un-labeled)
  drop-button.ts         # DropButton: HTML button with aria-live + keyboard
  taunt-bubble.ts        # TauntBubble: fade-in/out speech bubble
  round-loop.ts          # runRound(n, ctx): Promise<void>
  valued-scenes.ts       # drawValued1..5 functions
  gallery.ts             # drawGallery(ctx, w, h) + ending links
  intro.ts               # 3-slide glow-style intro
  a11y.ts                # announce(msg), prefersReducedMotion()
  style.css              # lesson page styles
tests/
  drop-the-rope.spec.ts  # Playwright E2E walkthrough
```

**Modified files:**

```
src/scenes/utils.ts                 # ADD canvasAspect() (extracted from morning-choice/room.ts)
src/lessons/morning-choice/room.ts  # REMOVE canvasAspect, import from ../../scenes/utils
vite.config.ts                      # ADD drop-the-rope entry
index.html                          # ADD hub card in Lessons section
```

---

## Task 0: Verify Crocs prereq has merged

**Files:** none (gate check)

- [ ] **Step 1: Verify PR #8 is merged**

Run: `gh pr view 8 --json state --jq .state`
Expected output: `MERGED`

If `OPEN`, stop and wait. Do not proceed until Crocs are on main.

- [ ] **Step 2: Sync main**

Run: `git checkout main && git pull origin main`
Expected: Up to date with origin/main.

---

## Task 1: Extract `canvasAspect()` into shared utils

**Files:**
- Modify: `src/scenes/utils.ts`
- Modify: `src/lessons/morning-choice/room.ts`

- [ ] **Step 1: Create the new branch**

```bash
git checkout -b drop-the-rope-01-canvas-aspect
```

- [ ] **Step 2: Add `canvasAspect` to `src/scenes/utils.ts`**

Append to the bottom of `src/scenes/utils.ts`:

```typescript
/**
 * Aspect ratio for scene canvases: taller on narrow screens so scenes
 * aren't squished, wider on desktop so horizontal compositions (e.g. the
 * drop-the-rope tug-of-war) read as horizontal tension rather than sag.
 */
export function canvasAspect(width: number): number {
  if (width <= 500) return 0.9;   // mobile — nearly square
  if (width <= 700) return 0.75;  // tablet
  return 0.6;                     // desktop
}
```

- [ ] **Step 3: Remove `canvasAspect` from `morning-choice/room.ts`**

In `src/lessons/morning-choice/room.ts`, delete lines 38-43 (the `canvasAspect` function and its comment). Update the existing import at line 4 from:

```typescript
import { roundRect, lerpColor } from "../../scenes/utils";
```

to:

```typescript
import { roundRect, lerpColor, canvasAspect } from "../../scenes/utils";
```

- [ ] **Step 4: Update the re-export in `morning-choice/game.ts`**

In `src/lessons/morning-choice/game.ts` line 3, `canvasAspect` is imported from `./room`. After step 3, `room.ts` no longer exports it. Change the import to bring `canvasAspect` from utils:

```typescript
import { createRoomCanvas, renderRoom, stopRoomAnimation } from "./room";
import { canvasAspect } from "../../scenes/utils";
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0, no output.

- [ ] **Step 6: Verify morning-choice still renders correctly**

Start dev server bound to Tailscale so the user can preview if needed:

```bash
npm run dev -- --host 0.0.0.0 &
sleep 3
```

Write a throw-away playwright check:

```javascript
// tmp-morning-check.mjs
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
await page.goto('http://localhost:5180/lessons/morning-choice/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/mc-regression.png', fullPage: true });
await browser.close();
```

Run: `node tmp-morning-check.mjs && rm tmp-morning-check.mjs`
Read `/tmp/mc-regression.png` with the Read tool — verify the bedroom scene renders (dark walls, alarm clock, raccoon, BEEP text). Kill the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/utils.ts src/lessons/morning-choice/room.ts src/lessons/morning-choice/game.ts
git commit -m "refactor: extract canvasAspect() to src/scenes/utils.ts

Shared by morning-choice and the upcoming drop-the-rope lesson per the
design doc §9 small-refactor note."
```

- [ ] **Step 8: Push and open PR**

```bash
git push -u origin drop-the-rope-01-canvas-aspect
gh pr create --title "refactor: extract canvasAspect() to scenes/utils" --body "Small refactor prepping for drop-the-rope lesson. Verified morning-choice still renders correctly."
```

---

## Task 2: Scaffold `/lessons/drop-the-rope/` directory and register in vite

**Files:**
- Create: `src/lessons/drop-the-rope/index.html`
- Create: `src/lessons/drop-the-rope/main.ts`
- Create: `src/lessons/drop-the-rope/style.css`
- Modify: `vite.config.ts`
- Modify: `index.html` (root hub)

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull
git checkout -b drop-the-rope-02-scaffold
```

- [ ] **Step 2: Write `src/lessons/drop-the-rope/index.html`**

Copy the structure from `src/lessons/glow/index.html` and adapt. The page must have:
- The standard 48px header with breadcrumb and About link (per CLAUDE.md page conventions)
- The restart-link pattern on the lesson title
- The About modal with a short description and GitHub link
- A `<div id="game-container"></div>` mount point

Minimal working HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>Drop the Rope</title>
<link rel="stylesheet" href="./style.css" />
</head>
<body>
  <header id="header">
    <span class="header-title">
      <a href="/">Explorable Explanations</a> /
      <a id="restart-link" href="#">Drop the Rope</a>
    </span>
    <a id="about-link" href="#">About</a>
  </header>

  <div id="game-container"></div>

  <div id="about-modal" class="modal-overlay" hidden>
    <div class="modal">
      <button id="about-close" class="modal-close" aria-label="Close about">×</button>
      <h2>Drop the Rope</h2>
      <p>A wordless five-round defusion exercise from Russ Harris's <em>Acceptance and Commitment Therapy</em>.</p>
      <p>A raccoon plays tug-of-war with five feelings. There's one move, and it's the same every time.</p>
      <p class="tech-note">Tech: TypeScript, Canvas 2D, procedural silhouettes — no images.</p>
      <p><a href="https://github.com/idvorkin-ai-tools/activation-energy-game" target="_blank" rel="noopener">Source on GitHub</a></p>
    </div>
  </div>

  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 3: Write `src/lessons/drop-the-rope/style.css`**

Copy from `src/lessons/glow/` or `src/lessons/morning-choice/` and adapt. At minimum include: `#header`, `.header-title`, `#about-link`, `.modal-overlay`, `.modal`, `#game-container` (full-bleed, black background, min-height 80vh). Reference `src/lessons/morning-choice/` CSS for the exact classes used by the About modal pattern.

- [ ] **Step 4: Write `src/lessons/drop-the-rope/main.ts`** (minimal bootstrap)

```typescript
import "./style.css";

const container = document.getElementById("game-container");
if (!container) throw new Error("#game-container not found");

// About modal wiring (standard pattern — see glow/main.ts for reference)
const aboutLink = document.getElementById("about-link")!;
const aboutModal = document.getElementById("about-modal")!;
const aboutClose = document.getElementById("about-close")!;
aboutLink.addEventListener("click", (e) => { e.preventDefault(); aboutModal.removeAttribute("hidden"); });
aboutClose.addEventListener("click", () => aboutModal.setAttribute("hidden", ""));
aboutModal.addEventListener("click", (e) => { if (e.target === aboutModal) aboutModal.setAttribute("hidden", ""); });

// Placeholder: game will be wired in Task 22
container.innerHTML = `<div style="padding: 48px; text-align: center; color: #aaa;">
  Drop the Rope — scaffolding in progress. Come back after Task 22.
</div>`;

// Restart link (placeholder — will call game.restart() after Task 22)
document.getElementById("restart-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  location.reload();
});
```

- [ ] **Step 5: Register the page in `vite.config.ts`**

Open `vite.config.ts`, find `build.rollupOptions.input`, add:

```typescript
"drop-the-rope": resolve(__dirname, "src/lessons/drop-the-rope/index.html"),
```

- [ ] **Step 6: Add hub card in root `index.html`**

In the root `index.html`, find the Lessons section (look for where morning-choice and glow cards are defined) and add:

```html
<a class="card" href="/lessons/drop-the-rope/">
  <div class="card-title">Drop the Rope</div>
  <div class="card-subtitle">a wordless defusion exercise</div>
</a>
```

- [ ] **Step 7: Typecheck, lint, and build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

All three must exit 0. The build step verifies Vite picks up the new entry.

- [ ] **Step 8: Visual check — dev server**

```bash
npm run dev -- --host 0.0.0.0 &
sleep 3
```

Screenshot the hub and the scaffolded page:

```javascript
// tmp-scaffold-check.mjs
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/hub-with-card.png', fullPage: true });
await page.goto('http://localhost:5180/lessons/drop-the-rope/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/drop-scaffold.png', fullPage: true });
await browser.close();
```

`node tmp-scaffold-check.mjs && rm tmp-scaffold-check.mjs` then Read both screenshots with vision. Verify: (a) hub shows the new Drop the Rope card, (b) the scaffold page has the standard header + the placeholder message. Kill dev server.

- [ ] **Step 9: Commit, push, PR**

```bash
git add src/lessons/drop-the-rope/ vite.config.ts index.html
git commit -m "feat: scaffold drop-the-rope lesson directory and hub card"
git push -u origin drop-the-rope-02-scaffold
gh pr create --title "feat: drop-the-rope scaffolding" --body "Empty page, registered in vite, hub card added. No game logic yet."
```

---

## Task 3: Write `types.ts`

**Files:**
- Create: `src/lessons/drop-the-rope/types.ts`

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull
git checkout -b drop-the-rope-03-types
```

- [ ] **Step 2: Write `src/lessons/drop-the-rope/types.ts`**

```typescript
/** Canonical monster identifiers — index into MONSTERS data */
export type MonsterId = "anxiety" | "self-criticism" | "shame" | "doubt" | "anger";

/** Static config for a single monster (data, not rendering) */
export interface Monster {
  id: MonsterId;
  displayName: string;
  taunt: string;
  accentColor: string;  // e.g. "#93C5FD"
  round: 1 | 2 | 3 | 4 | 5;
}

/** Static per-round timing config */
export interface RoundConfig {
  monster: MonsterId;
  dropTimerMs: number;       // time from rope-taut to drop-button-appearing
  tauntHoldMs: number;       // how long the taunt bubble stays fully visible
  tauntFadeMs: number;       // how long the fade-in + fade-out each take
  monsterWalkInMs: number;   // arrival animation duration
  captionText: string;       // one-word caption shown 2s after raccoon arrives at valued scene
}

/** State machine phase of a single round */
export type RoundPhase =
  | "arriving"       // monster walks in + taunt fades up
  | "struggling"     // rope taut, player taps, desaturation fading in
  | "buttonVisible"  // same as struggling + button is now fadeable
  | "dropping"       // button clicked; rope goes slack
  | "walking"        // raccoon walks past monster
  | "valued";        // arrived at post-drop scene

/** State machine phase of the whole game */
export type GamePhase =
  | "intro"
  | "round"
  | "gallery"
  | "done";

/** Live state */
export interface GameState {
  phase: GamePhase;
  currentRound: 1 | 2 | 3 | 4 | 5 | null;
  roundPhase: RoundPhase | null;
}
```

- [ ] **Step 3: Typecheck**

`npx tsc --noEmit` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/drop-the-rope/types.ts
git commit -m "feat: drop-the-rope types — Monster, RoundConfig, GameState"
```

---

## Task 4: Write `monsters.ts` data + unit test

**Files:**
- Create: `src/lessons/drop-the-rope/monsters.ts`
- Create: `src/lessons/drop-the-rope/monsters.test.ts`

- [ ] **Step 1: Write the failing unit test**

Create `src/lessons/drop-the-rope/monsters.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { MONSTERS, ROUND_CONFIGS, getMonster, getRoundConfig } from "./monsters";
import type { MonsterId } from "./types";

describe("MONSTERS", () => {
  it("has exactly 5 monsters", () => {
    expect(MONSTERS).toHaveLength(5);
  });

  it("has the expected ids in order", () => {
    const expected: MonsterId[] = ["anxiety", "self-criticism", "shame", "doubt", "anger"];
    expect(MONSTERS.map(m => m.id)).toEqual(expected);
  });

  it("anxiety is round 1", () => {
    expect(getMonster("anxiety").round).toBe(1);
  });

  it("doubt has the revised teal accent color #5EA5B5", () => {
    // Revised during Q1 brainstorm: grey would vanish against amber dawn
    expect(getMonster("doubt").accentColor).toBe("#5EA5B5");
  });
});

describe("ROUND_CONFIGS", () => {
  it("has 5 entries", () => {
    expect(ROUND_CONFIGS).toHaveLength(5);
  });

  it("round 1 drop timer is 18 seconds", () => {
    expect(getRoundConfig(1).dropTimerMs).toBe(18000);
  });

  it("round 5 drop timer is 0.5 seconds", () => {
    expect(getRoundConfig(5).dropTimerMs).toBe(500);
  });

  it("round 5 has a compressed monster walk-in (0.5s)", () => {
    // Q4 decision: the whole round 5 is compressed, not just the button
    expect(getRoundConfig(5).monsterWalkInMs).toBe(500);
  });

  it("drop timers are strictly decreasing", () => {
    for (let i = 0; i < ROUND_CONFIGS.length - 1; i++) {
      expect(ROUND_CONFIGS[i].dropTimerMs).toBeGreaterThan(ROUND_CONFIGS[i + 1].dropTimerMs);
    }
  });

  it("taunt hold duration is longest on round 1 and shortest on round 5", () => {
    // Q2 decision: graduated taunt durations stack a second learning curve
    expect(ROUND_CONFIGS[0].tauntHoldMs).toBeGreaterThan(ROUND_CONFIGS[1].tauntHoldMs);
    expect(ROUND_CONFIGS[4].tauntHoldMs).toBeLessThan(ROUND_CONFIGS[3].tauntHoldMs);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npx vitest run src/lessons/drop-the-rope/monsters.test.ts`
Expected: FAIL — "Cannot find module './monsters'".

(If the project doesn't have vitest installed yet, add it: `npm install --save-dev vitest` and ensure `vitest` is in the npm scripts. If the project uses a different test runner for unit tests, adapt accordingly. Check `package.json` first.)

- [ ] **Step 3: Write `src/lessons/drop-the-rope/monsters.ts`**

```typescript
import type { Monster, MonsterId, RoundConfig } from "./types";

export const MONSTERS: readonly Monster[] = [
  {
    id: "anxiety",
    displayName: "Anxiety",
    taunt: "What if it all falls apart today?",
    accentColor: "#93C5FD", // cold blue
    round: 1,
  },
  {
    id: "self-criticism",
    displayName: "Self-Criticism",
    taunt: "You're still not good enough. You know it.",
    accentColor: "#E8A0A0", // pink
    round: 2,
  },
  {
    id: "shame",
    displayName: "Shame",
    taunt: "Don't let them see what you really are.",
    accentColor: "#8B5CF6", // violet
    round: 3,
  },
  {
    id: "doubt",
    displayName: "Doubt",
    taunt: "Are you sure? Really sure?",
    accentColor: "#5EA5B5", // muted teal (revised from grey in rev 2)
    round: 4,
  },
  {
    id: "anger",
    displayName: "Anger",
    taunt: "They don't get to do this to you.",
    accentColor: "#EF4444", // red
    round: 5,
  },
];

export const ROUND_CONFIGS: readonly RoundConfig[] = [
  { monster: "anxiety",        dropTimerMs: 18000, tauntHoldMs: 2000, tauntFadeMs: 1000, monsterWalkInMs: 1500, captionText: "coffee" },
  { monster: "self-criticism", dropTimerMs: 10000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a swing" },
  { monster: "shame",          dropTimerMs:  6000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a friend" },
  { monster: "doubt",          dropTimerMs:  3000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a page" },
  { monster: "anger",          dropTimerMs:   500, tauntHoldMs:    0, tauntFadeMs:  300, monsterWalkInMs:  500, captionText: "her"      },
];

export function getMonster(id: MonsterId): Monster {
  const m = MONSTERS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown monster: ${id}`);
  return m;
}

export function getRoundConfig(round: 1 | 2 | 3 | 4 | 5): RoundConfig {
  return ROUND_CONFIGS[round - 1];
}
```

- [ ] **Step 4: Run the test — should pass**

Run: `npx vitest run src/lessons/drop-the-rope/monsters.test.ts`
Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lessons/drop-the-rope/monsters.ts src/lessons/drop-the-rope/monsters.test.ts
git commit -m "feat: drop-the-rope monster data and round configs"
```

---

## Task 5: Write `warm-dawn.ts` (background drawing) and screenshot verify

**Files:**
- Create: `src/lessons/drop-the-rope/warm-dawn.ts`

- [ ] **Step 1: Write the function**

```typescript
import { lerpColor } from "../../scenes/utils";

/**
 * Draw the warm dawn earth world — amber sky, warm brown ground.
 * Palette is continuous with `morning-choice`. Drain-able via saturation parameter.
 *
 * @param ctx canvas context
 * @param w logical width
 * @param h logical height
 * @param saturation 1.0 = full warm dawn, 0.0 = near-grey (for the greying-during-struggle mechanic)
 */
export function drawWarmDawn(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  saturation: number = 1,
): void {
  const horizonY = h * 0.65;

  // Sky: amber at horizon → dusty rose-purple at top
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  const skyTop = lerpColor("#5a5a5a", "#5a3a4a", saturation);
  const skyMid = lerpColor("#7a7070", "#c0855f", saturation);
  const skyBot = lerpColor("#888080", "#f0c060", saturation);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(0.6, skyMid);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  // Golden glow at horizon (only when saturated)
  if (saturation > 0.1) {
    const glow = ctx.createRadialGradient(w / 2, horizonY, 0, w / 2, horizonY, w * 0.6);
    glow.addColorStop(0, `rgba(255, 200, 100, ${0.35 * saturation})`);
    glow.addColorStop(1, "rgba(255, 200, 100, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, horizonY);
  }

  // Ground: warm brown gradient
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  const groundTop = lerpColor("#555", "#3a2a1a", saturation);
  const groundBot = lerpColor("#333", "#2a1a0a", saturation);
  groundGrad.addColorStop(0, groundTop);
  groundGrad.addColorStop(1, groundBot);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);
}
```

- [ ] **Step 2: Typecheck**

`npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Visual verification via a throw-away harness**

Create a temporary test harness `src/lessons/drop-the-rope/_viz-warm-dawn.ts`:

```typescript
import { drawWarmDawn } from "./warm-dawn";

const c = document.createElement("canvas");
c.width = 1200; c.height = 720;
document.body.appendChild(c);
const ctx = c.getContext("2d")!;
drawWarmDawn(ctx, 1200, 720, 1.0);

const c2 = document.createElement("canvas");
c2.width = 1200; c2.height = 720;
c2.style.marginTop = "20px";
document.body.appendChild(c2);
drawWarmDawn(c2.getContext("2d")!, 1200, 720, 0.15); // during struggle
```

Temporarily wire this into `main.ts` (or write a new ad-hoc HTML loader) and screenshot it. Alternative: use a minimal standalone HTML file that imports the TS file via vite.

- [ ] **Step 4: Screenshot at both saturation levels**

Start dev server, take playwright screenshot, read it with vision. Verify the full-saturation version shows amber horizon + warm brown ground + dusty rose top; verify the 0.15 version looks nearly-greyscale with only a hint of warmth remaining.

Expected: full saturation matches `monster-a2-warm.png` background palette.

- [ ] **Step 5: Delete the viz harness**

```bash
rm src/lessons/drop-the-rope/_viz-warm-dawn.ts
```

Revert any temporary main.ts changes.

- [ ] **Step 6: Commit**

```bash
git add src/lessons/drop-the-rope/warm-dawn.ts
git commit -m "feat: drop-the-rope warm dawn background with saturation param"
```

---

## Task 6: Write `monsters.ts` drawMonster() function for all 5 silhouettes

**Files:**
- Modify: `src/lessons/drop-the-rope/monsters.ts`

Each monster is a silhouette body with one accent color and one defining feature. The spec (§2 roster table) describes each. Implementation is a switch statement that dispatches per monster id.

- [ ] **Step 1: Add drawMonster() to monsters.ts**

Append to `src/lessons/drop-the-rope/monsters.ts`:

```typescript
export interface MonsterDrawOptions {
  /** Center x of the monster's body in logical pixels */
  cx: number;
  /** Center y of the monster's body */
  cy: number;
  /** Monster's rendered height in logical pixels (body will be drawn ~1.8x the raccoon size by caller) */
  height: number;
  /** 0..1 breath pulse phase for y-axis scale modulation */
  breathPhase: number;
  /** 0..1 rope pull strength — leans backward slightly */
  pullLean: number;
}

export function drawMonster(
  ctx: CanvasRenderingContext2D,
  id: MonsterId,
  opts: MonsterDrawOptions,
): void {
  const m = getMonster(id);
  const breathScale = 1 + Math.sin(opts.breathPhase * Math.PI * 2) * 0.02;
  ctx.save();
  ctx.translate(opts.cx, opts.cy);
  ctx.scale(1, breathScale);
  ctx.rotate(opts.pullLean * -0.08);

  switch (id) {
    case "anxiety":        drawAnxiety(ctx, opts.height, m.accentColor); break;
    case "self-criticism": drawSelfCriticism(ctx, opts.height, m.accentColor); break;
    case "shame":          drawShame(ctx, opts.height, m.accentColor); break;
    case "doubt":          drawDoubt(ctx, opts.height, m.accentColor); break;
    case "anger":          drawAnger(ctx, opts.height, m.accentColor); break;
  }

  ctx.restore();
}

const BODY_BLACK = "#1a1a22";

function drawAnxiety(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Tall thin smoke-wisp tapered at top. Body ~h tall, ~h*0.35 wide.
  const w = h * 0.35;
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);                          // bottom center
  ctx.bezierCurveTo(-w * 0.7, h * 0.3, -w * 0.5, -h * 0.2, -w * 0.15, -h * 0.4);
  ctx.quadraticCurveTo(0, -h * 0.55, w * 0.15, -h * 0.4);
  ctx.bezierCurveTo(w * 0.5, -h * 0.2, w * 0.7, h * 0.3, 0, h * 0.5);
  ctx.fill();

  // Cold blue inner glow (lower half of body)
  const glow = ctx.createRadialGradient(0, h * 0.1, 0, 0, h * 0.1, w);
  glow.addColorStop(0, accent);
  glow.addColorStop(0.4, `${accent}99`);
  glow.addColorStop(1, "transparent");
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = glow;
  ctx.fillRect(-w, -h * 0.5, w * 2, h);
  ctx.globalCompositeOperation = "source-over";

  // Two jittering pinprick white eyes
  const jitterX = (Math.random() - 0.5) * 1;
  const jitterY = (Math.random() - 0.5) * 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(-w * 0.2 + jitterX, -h * 0.35 + jitterY, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( w * 0.2 + jitterX, -h * 0.35 + jitterY, 2, 0, Math.PI * 2); ctx.fill();
}

function drawSelfCriticism(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Short squat wide blob. Approximately as wide as tall.
  const w = h * 0.9;
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // One giant white cyclops eye
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(0, -h * 0.15, h * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath(); ctx.arc(h * 0.02, -h * 0.15, h * 0.08, 0, Math.PI * 2); ctx.fill();

  // Wide hanging jaw with jagged teeth glowing pink
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-w * 0.35, h * 0.05);
  ctx.lineTo( w * 0.35, h * 0.05);
  ctx.lineTo( w * 0.3,  h * 0.28);
  ctx.lineTo(-w * 0.3,  h * 0.28);
  ctx.closePath();
  ctx.fill();
  // Teeth (rectangular)
  ctx.fillStyle = "#ffffff";
  for (let i = -3; i <= 3; i++) {
    ctx.fillRect(i * w * 0.08 - 2, h * 0.06, 4, 7);
  }
}

function drawShame(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Sphere body with arms wrapped around itself.
  const r = h * 0.4;
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // Wrapped arms (two crescents crossing the body)
  ctx.strokeStyle = BODY_BLACK;
  ctx.lineWidth = r * 0.45;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.1, r * 0.8, Math.PI * 0.2, Math.PI * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.arc( r * 0.3, r * 0.1, r * 0.8, Math.PI * 0.1, Math.PI * 0.8); ctx.stroke();

  // Violet inner glow through the arms (peeking downcast eyes)
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.05, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.15, -r * 0.05, 2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDoubt(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Two heads on one body, facing OPPOSITE directions (rev 2 decision)
  const neckW = h * 0.15;
  const headR = h * 0.15;
  const bodyW = h * 0.3;

  // Body
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath();
  ctx.moveTo(-bodyW, h * 0.5);
  ctx.lineTo( bodyW, h * 0.5);
  ctx.lineTo( neckW, -h * 0.1);
  ctx.lineTo(-neckW, -h * 0.1);
  ctx.closePath();
  ctx.fill();

  // Two heads — left head faces left, right head faces right
  ctx.beginPath(); ctx.arc(-headR * 1.2, -h * 0.25, headR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( headR * 1.2, -h * 0.25, headR, 0, Math.PI * 2); ctx.fill();

  // Eyes — each head has its own pair, both looking outward
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(-headR * 1.6, -h * 0.27, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-headR * 1.2, -h * 0.27, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( headR * 1.2, -h * 0.27, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( headR * 1.6, -h * 0.27, 2, 0, Math.PI * 2); ctx.fill();

  // Open mouths (both speaking)
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.ellipse(-headR * 1.3, -h * 0.2, headR * 0.3, headR * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( headR * 1.3, -h * 0.2, headR * 0.3, headR * 0.18, 0, 0, Math.PI * 2); ctx.fill();
}

function drawAnger(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Broad shoulders, hunched forward, horns, large fists.
  const w = h * 0.95;
  ctx.fillStyle = BODY_BLACK;
  // Body trapezoid (wider at top)
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.1);
  ctx.lineTo( w * 0.5, -h * 0.1);
  ctx.lineTo( w * 0.35, h * 0.5);
  ctx.lineTo(-w * 0.35, h * 0.5);
  ctx.closePath();
  ctx.fill();

  // Head on top (hunched forward = lower than the body top)
  ctx.beginPath();
  ctx.arc(0, -h * 0.25, h * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Two small horns (THE ONLY HARD EDGES in the roster)
  ctx.beginPath();
  ctx.moveTo(-h * 0.12, -h * 0.4);
  ctx.lineTo(-h * 0.06, -h * 0.28);
  ctx.lineTo(-h * 0.18, -h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo( h * 0.12, -h * 0.4);
  ctx.lineTo( h * 0.06, -h * 0.28);
  ctx.lineTo( h * 0.18, -h * 0.32);
  ctx.closePath();
  ctx.fill();

  // Red visor-bar eye
  ctx.fillStyle = accent;
  ctx.fillRect(-h * 0.12, -h * 0.27, h * 0.24, h * 0.04);

  // Downward rectangle mouth
  ctx.fillStyle = BODY_BLACK;
  ctx.fillRect(-h * 0.07, -h * 0.16, h * 0.14, h * 0.04);

  // Fists the size of the head (head radius is h*0.18)
  ctx.beginPath(); ctx.arc(-w * 0.45, h * 0.25, h * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( w * 0.45, h * 0.25, h * 0.18, 0, Math.PI * 2); ctx.fill();
}
```

- [ ] **Step 2: Typecheck**

`npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Visual verification — one screenshot per monster**

Create a throw-away harness `src/lessons/drop-the-rope/_viz-monsters.ts`:

```typescript
import { drawWarmDawn } from "./warm-dawn";
import { drawMonster } from "./monsters";
import type { MonsterId } from "./types";

const ids: MonsterId[] = ["anxiety", "self-criticism", "shame", "doubt", "anger"];
for (const id of ids) {
  const c = document.createElement("canvas");
  c.width = 600; c.height = 360;
  c.style.display = "block";
  c.style.marginBottom = "20px";
  c.dataset.monster = id;
  document.body.appendChild(c);
  const ctx = c.getContext("2d")!;
  drawWarmDawn(ctx, 600, 360, 1);
  drawMonster(ctx, id, { cx: 450, cy: 200, height: 180, breathPhase: 0.2, pullLean: 0.5 });
}
```

Wire into main.ts temporarily, `npm run dev -- --host 0.0.0.0`, take 5 screenshots (one per canvas element) via a playwright script that iterates over `[data-monster]` elements and screenshots each.

**Verify visually:** each monster matches its corresponding `lineup-N-*.png` reference in `.superpowers/brainstorm/229782-1775934718/content/`. Key checks:
- Anxiety: tall smoke-wisp shape, blue glow from within, pinprick eyes
- Self-Criticism: squat, one big cyclops eye, jagged teeth
- Shame: curled ball with wrapped arms, violet peeks through
- Doubt: two heads facing opposite directions, teal accent
- Anger: broad trapezoid, horns, red visor eye, fists

If anything doesn't match, refine the draw function and re-screenshot. Don't commit until all 5 visually match the reference.

- [ ] **Step 4: Delete the viz harness**

```bash
rm src/lessons/drop-the-rope/_viz-monsters.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lessons/drop-the-rope/monsters.ts
git commit -m "feat: drop-the-rope drawMonster for all 5 silhouettes"
```

---

## Task 7: Write `rope.ts`

**Files:**
- Create: `src/lessons/drop-the-rope/rope.ts`
- Create: `src/lessons/drop-the-rope/rope.test.ts`

- [ ] **Step 1: Write the failing unit test**

```typescript
import { describe, it, expect } from "vitest";
import { ropeMidpoint } from "./rope";

describe("ropeMidpoint", () => {
  it("balanced tension (0) returns center point", () => {
    const mid = ropeMidpoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 0);
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(0);
  });

  it("player-winning tension (-1) bows toward raccoon", () => {
    const mid = ropeMidpoint({ x: 0, y: 0 }, { x: 100, y: 0 }, -1);
    expect(mid.x).toBeLessThan(50);
  });

  it("monster-winning tension (+1) bows toward monster", () => {
    const mid = ropeMidpoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 1);
    expect(mid.x).toBeGreaterThan(50);
  });
});
```

Run: `npx vitest run src/lessons/drop-the-rope/rope.test.ts` → FAIL.

- [ ] **Step 2: Write rope.ts**

```typescript
export interface Point { x: number; y: number; }

export type RopeState = "taut" | "sagging" | "flat";

/** Compute the midpoint of a bowed rope. tension in [-1, 1]: negative = raccoon winning, positive = monster winning. */
export function ropeMidpoint(from: Point, to: Point, tension: number): Point {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  // Shift the midpoint toward the winning side (30% of the span max)
  const shift = tension * dx * 0.15;
  return { x: cx + shift, y: cy };
}

/**
 * Draw the rope as a quadratic bezier with per-frame jitter during struggle,
 * or as a sagging/flat line after drop.
 */
export function drawRope(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  tension: number,
  state: RopeState,
  flashFrame: boolean = false,
): void {
  ctx.strokeStyle = flashFrame ? "#ffffff" : "#6b5d4f";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  if (state === "taut") {
    const mid = ropeMidpoint(from, to, tension);
    // Subtle vertical jitter for strain feel
    const jitter = (Math.random() - 0.5) * 4;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(mid.x, mid.y + jitter, to.x, to.y);
    ctx.stroke();
  } else if (state === "sagging") {
    // Drooping catenary-ish: midpoint drops halfway to the ground
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + 60 };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
    ctx.stroke();
  } else {
    // Flat on ground — straight line at the lower of the two y values + offset
    const groundY = Math.max(from.y, to.y) + 80;
    ctx.beginPath();
    ctx.moveTo(from.x, groundY);
    ctx.lineTo(to.x, groundY);
    ctx.stroke();
  }
}
```

- [ ] **Step 3: Run tests — pass**

`npx vitest run src/lessons/drop-the-rope/rope.test.ts` → pass.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/drop-the-rope/rope.ts src/lessons/drop-the-rope/rope.test.ts
git commit -m "feat: drop-the-rope rope rendering with tension + states"
```

---

## Task 8: Write `exhaustion-bar.ts`

**Files:**
- Create: `src/lessons/drop-the-rope/exhaustion-bar.ts`

- [ ] **Step 1: Write the class**

```typescript
/**
 * Thin horizontal bar at the top of the screen that darkens/lengthens as
 * the struggle continues. NOT a willpower bar — no label, no number, just
 * a silent line that gets darker and longer. The rising line is fatigue.
 */
export class ExhaustionBar {
  el: HTMLDivElement;
  private fill: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "dtr-exhaustion";
    this.fill = document.createElement("div");
    this.fill.className = "dtr-exhaustion-fill";
    this.el.appendChild(this.fill);
    this.setLevel(0);
  }

  /** level in [0, 1] */
  setLevel(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));
    this.fill.style.width = `${clamped * 100}%`;
    // Darken with level — from #4a4a4a to #0a0a0a
    const dark = Math.round(74 - clamped * 64);
    this.fill.style.background = `rgb(${dark},${dark},${dark})`;
  }

  reset(): void { this.setLevel(0); }
}
```

And add to `style.css`:

```css
.dtr-exhaustion {
  width: 100%;
  height: 6px;
  background: #1a1a1a;
  margin-top: 8px;
}
.dtr-exhaustion-fill {
  height: 100%;
  background: #4a4a4a;
  transition: width 0.1s linear, background 0.3s linear;
}
```

- [ ] **Step 2: Typecheck + lint**

`npx tsc --noEmit && npm run lint` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lessons/drop-the-rope/exhaustion-bar.ts src/lessons/drop-the-rope/style.css
git commit -m "feat: drop-the-rope exhaustion bar"
```

---

## Task 9: Write `a11y.ts` and `drop-button.ts`

**Files:**
- Create: `src/lessons/drop-the-rope/a11y.ts`
- Create: `src/lessons/drop-the-rope/drop-button.ts`

- [ ] **Step 1: Write a11y helper**

```typescript
// src/lessons/drop-the-rope/a11y.ts

let liveRegion: HTMLDivElement | null = null;

export function initA11y(): void {
  if (liveRegion) return;
  liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("role", "status");
  liveRegion.style.position = "absolute";
  liveRegion.style.left = "-10000px";
  liveRegion.style.width = "1px";
  liveRegion.style.height = "1px";
  liveRegion.style.overflow = "hidden";
  document.body.appendChild(liveRegion);
}

export function announce(message: string): void {
  if (!liveRegion) initA11y();
  // Clear then set to force screen readers to re-announce
  liveRegion!.textContent = "";
  requestAnimationFrame(() => { liveRegion!.textContent = message; });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 2: Write drop-button.ts**

```typescript
import { announce } from "./a11y";

export class DropButton {
  el: HTMLButtonElement;
  private onClickCallback: (() => void) | null = null;

  constructor() {
    this.el = document.createElement("button");
    this.el.className = "dtr-drop-button";
    this.el.textContent = "Drop the rope";
    this.el.setAttribute("aria-label", "Drop the rope");
    this.el.hidden = true;
    this.el.addEventListener("click", () => this.onClickCallback?.());
    // Enter key triggers the button when focused (default browser behavior)
  }

  onClick(cb: () => void): void { this.onClickCallback = cb; }

  /** Fade in over 1.2s, deliberately low-contrast */
  async fadeIn(): Promise<void> {
    this.el.hidden = false;
    this.el.style.opacity = "0";
    // Force reflow
    void this.el.offsetHeight;
    this.el.style.transition = "opacity 1.2s linear";
    this.el.style.opacity = "1";
    // Announce to screen readers per Q10
    announce("Drop the rope button is now available");
    // Focus so keyboard users can press Enter
    this.el.focus();
    await new Promise((r) => setTimeout(r, 1200));
  }

  hide(): void {
    this.el.hidden = true;
    this.el.style.opacity = "0";
  }
}
```

Append CSS to `style.css`:

```css
.dtr-drop-button {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 28px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: rgba(20, 20, 30, 0.7);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  max-width: 400px;
}
.dtr-drop-button:focus {
  border-color: rgba(255, 255, 255, 0.5);
  outline: none;
}
```

- [ ] **Step 3: Typecheck + lint + commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lessons/drop-the-rope/a11y.ts src/lessons/drop-the-rope/drop-button.ts src/lessons/drop-the-rope/style.css
git commit -m "feat: drop-the-rope drop button + a11y live region"
```

---

## Task 10: Write `taunt-bubble.ts`

**Files:**
- Create: `src/lessons/drop-the-rope/taunt-bubble.ts`

- [ ] **Step 1: Write the class**

```typescript
import { announce } from "./a11y";

/**
 * Speech-bubble DOM element that fades up over the monster for a configurable duration.
 * Per Q2, duration is graduated per round: R1 3s, R2-R4 1.5s, R5 ~0.3s (interrupted).
 */
export class TauntBubble {
  el: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "dtr-taunt";
    this.el.hidden = true;
  }

  /** Fade in, hold, fade out. Announces via aria-live so screen readers get the taunt. */
  async show(text: string, holdMs: number, fadeMs: number): Promise<void> {
    this.el.textContent = text;
    this.el.hidden = false;
    this.el.style.opacity = "0";
    void this.el.offsetHeight;
    this.el.style.transition = `opacity ${fadeMs}ms ease-out`;
    this.el.style.opacity = "1";
    announce(text);
    await new Promise((r) => setTimeout(r, fadeMs + holdMs));
    this.el.style.transition = `opacity ${fadeMs}ms ease-in`;
    this.el.style.opacity = "0";
    await new Promise((r) => setTimeout(r, fadeMs));
    this.el.hidden = true;
  }

  /** Abruptly cut off the taunt (for round 5 when the player drops before it completes) */
  cancel(): void {
    this.el.style.transition = "opacity 100ms linear";
    this.el.style.opacity = "0";
    setTimeout(() => { this.el.hidden = true; }, 100);
  }
}
```

Append CSS:

```css
.dtr-taunt {
  position: absolute;
  top: 20%;
  right: 15%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a22;
  border-radius: 12px;
  max-width: 240px;
  font-style: italic;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
.dtr-taunt::before {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 40%;
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.95);
}
```

- [ ] **Step 2: Typecheck + lint + commit**

```bash
git add src/lessons/drop-the-rope/taunt-bubble.ts src/lessons/drop-the-rope/style.css
git commit -m "feat: drop-the-rope taunt bubble with graduated duration support"
```

---

## Task 11: Write `round-loop.ts` — the single-round state machine

**Files:**
- Create: `src/lessons/drop-the-rope/round-loop.ts`
- Create: `src/lessons/drop-the-rope/round-loop.test.ts`

This is the heart of the lesson. It's a state machine that runs one round start to finish, and resolves when the valued scene is complete.

- [ ] **Step 1: Write unit tests for pure timing logic**

```typescript
// round-loop.test.ts
import { describe, it, expect } from "vitest";
import { computeDesaturation, computeExhaustion } from "./round-loop";

describe("computeDesaturation", () => {
  it("is 1.0 (full color) before t=2000ms", () => {
    expect(computeDesaturation(0, 18000)).toBe(1);
    expect(computeDesaturation(1999, 18000)).toBe(1);
  });

  it("fades to 0.15 by t=6000ms", () => {
    expect(computeDesaturation(6000, 18000)).toBeCloseTo(0.15, 2);
  });

  it("stays at 0.15 after t=6000ms", () => {
    expect(computeDesaturation(10000, 18000)).toBeCloseTo(0.15, 2);
  });
});

describe("computeExhaustion", () => {
  it("is 0 at t=0", () => { expect(computeExhaustion(0, 18000)).toBe(0); });
  it("is 1 at t=dropTimer", () => { expect(computeExhaustion(18000, 18000)).toBeCloseTo(1); });
  it("is monotonic", () => {
    const a = computeExhaustion(5000, 18000);
    const b = computeExhaustion(10000, 18000);
    expect(b).toBeGreaterThan(a);
  });
});
```

Run: FAIL (module not found).

- [ ] **Step 2: Write round-loop.ts** (partial — only the pure helpers for now)

```typescript
import type { RoundConfig, RoundPhase } from "./types";
import type { Character } from "../../characters/Character";
import { drawWarmDawn } from "./warm-dawn";
import { drawMonster } from "./monsters";
import { drawRope, type Point, type RopeState } from "./rope";
import { getMonster } from "./monsters";
import { ExhaustionBar } from "./exhaustion-bar";
import { DropButton } from "./drop-button";
import { TauntBubble } from "./taunt-bubble";
import { announce, prefersReducedMotion } from "./a11y";

const GREY_AT_COMPLETE = 0.15;

/** Returns a saturation multiplier in [GREY_AT_COMPLETE, 1] for the greying effect */
export function computeDesaturation(elapsedMs: number, _dropTimerMs: number): number {
  if (elapsedMs < 2000) return 1;
  if (elapsedMs >= 6000) return GREY_AT_COMPLETE;
  const t = (elapsedMs - 2000) / 4000;  // 0..1 between t=2s and t=6s
  return 1 - (1 - GREY_AT_COMPLETE) * t;
}

/** Returns exhaustion bar level in [0, 1] */
export function computeExhaustion(elapsedMs: number, dropTimerMs: number): number {
  return Math.max(0, Math.min(1, elapsedMs / dropTimerMs));
}

export interface RoundDeps {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  character: Character;
  exhaustionBar: ExhaustionBar;
  dropButton: DropButton;
  tauntBubble: TauntBubble;
}

// Implementation of runRound() follows in Task 12.
```

Run tests: PASS.

- [ ] **Step 3: Commit the helpers and tests**

```bash
git add src/lessons/drop-the-rope/round-loop.ts src/lessons/drop-the-rope/round-loop.test.ts
git commit -m "feat: drop-the-rope round-loop pure helpers with tests"
```

---

## Task 12: Integrate round-loop — `runRound()`

**Files:**
- Modify: `src/lessons/drop-the-rope/round-loop.ts`

- [ ] **Step 1: Add runRound()**

Append to `round-loop.ts`:

```typescript
/** Run one full round. Resolves when the raccoon has been in the valued scene for ~4s. */
export async function runRound(
  config: RoundConfig,
  roundNum: 1 | 2 | 3 | 4 | 5,
  deps: RoundDeps,
  onPhaseChange?: (phase: RoundPhase) => void,
): Promise<void> {
  const { ctx, canvas, character, exhaustionBar, dropButton, tauntBubble } = deps;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // ===== ARRIVING =====
  onPhaseChange?.("arriving");
  announce(`${getMonster(config.monster).displayName} approaches`);
  character.setExpression("neutral");
  character.setPosition(w * 0.3, h * 0.6);

  // Render arrival: warm dawn bg with monster walking in
  const arrivalStart = performance.now();
  await animateArrival(deps, config, w, h, arrivalStart);

  // ===== TAUNT =====
  if (config.tauntHoldMs > 0 && roundNum !== 5) {
    tauntBubble.show(getMonster(config.monster).taunt, config.tauntHoldMs, config.tauntFadeMs);
    // Don't await — taunt plays in parallel with the struggle starting
  } else if (roundNum === 5) {
    // R5: taunt begins but player will drop first
    tauntBubble.show(getMonster(config.monster).taunt, 0, config.tauntFadeMs);
  }

  // ===== STRUGGLING + BUTTON VISIBLE =====
  onPhaseChange?.("struggling");
  character.setExpression("stressed");
  const struggleStart = performance.now();
  let playerTension = 0;
  let tapCount = 0;
  let flashFrame = false;

  const onTap = () => {
    tapCount++;
    playerTension = Math.max(-1, playerTension - 0.08);
    flashFrame = true;
    setTimeout(() => { flashFrame = false; }, 50);
  };
  canvas.addEventListener("click", onTap);
  canvas.addEventListener("touchstart", onTap, { passive: true });
  const onKey = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); onTap(); } };
  window.addEventListener("keydown", onKey);

  let dropButtonShown = false;
  let dropped = false;
  dropButton.onClick(() => { dropped = true; });

  // Main loop
  await new Promise<void>((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - struggleStart;

      // Monster pull decays player tension
      playerTension = Math.min(1, playerTension + (0.6 / 60));

      // Exhaustion bar
      exhaustionBar.setLevel(computeExhaustion(elapsed, config.dropTimerMs));

      // Update raccoon expression based on progress
      if (elapsed > 2000 && character.getExpression() !== "desperate") {
        character.setExpression("desperate");
      }

      // Render frame
      const saturation = computeDesaturation(elapsed, config.dropTimerMs);
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, saturation);

      const monsterX = w * 0.75;
      const monsterY = h * 0.55;
      drawMonster(ctx, config.monster, {
        cx: monsterX, cy: monsterY, height: 180,
        breathPhase: (elapsed / 500) % 1,
        pullLean: playerTension,
      });

      const ropeFrom: Point = { x: w * 0.3 + 20, y: h * 0.6 };
      const ropeTo: Point = { x: monsterX - 30, y: monsterY + 10 };
      drawRope(ctx, ropeFrom, ropeTo, playerTension, "taut", flashFrame);

      // Q9: Round 1 only, at t≈4000ms, tension flash + snap back
      if (roundNum === 1 && elapsed >= 4000 && elapsed < 4200 && tapCount > 10) {
        // Redraw rope in near-white with a small vibrate — snap back visually
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(ropeFrom.x, ropeFrom.y + (Math.random() - 0.5) * 6);
        ctx.lineTo(ropeTo.x,   ropeTo.y   + (Math.random() - 0.5) * 6);
        ctx.stroke();
        ctx.restore();
      }

      // Show drop button
      if (!dropButtonShown && elapsed >= config.dropTimerMs) {
        dropButtonShown = true;
        onPhaseChange?.("buttonVisible");
        dropButton.fadeIn();  // intentionally don't await
      }

      if (dropped) { resolve(); return; }
      requestAnimationFrame(loop);
    };
    loop();
  });

  // Teardown struggle listeners
  canvas.removeEventListener("click", onTap);
  canvas.removeEventListener("touchstart", onTap);
  window.removeEventListener("keydown", onKey);
  tauntBubble.cancel();

  // ===== DROPPING =====
  onPhaseChange?.("dropping");
  character.setExpression("tired");
  await animateDrop(deps, config, w, h);

  // ===== WALKING =====
  onPhaseChange?.("walking");
  character.setExpression("neutral");
  dropButton.hide();
  await character.walkTo(w * 0.85, h * 0.65, prefersReducedMotion() ? 0 : 2500);
  await fadeDesaturationBack(deps, w, h, config);

  // ===== VALUED =====
  onPhaseChange?.("valued");
  announce(`You walked into the ${config.captionText} scene`);
  await showValuedScene(deps, config, roundNum, w, h);
}

// Helper animations — leave as stubs to be filled in, OR inline the following
async function animateArrival(
  deps: RoundDeps, config: RoundConfig, w: number, h: number, startMs: number,
): Promise<void> {
  const { ctx } = deps;
  return new Promise((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - startMs;
      const t = Math.min(1, elapsed / config.monsterWalkInMs);
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, 1);
      const monsterX = w * 1.1 - t * (w * 0.35);  // walks in from right edge
      drawMonster(ctx, config.monster, {
        cx: monsterX, cy: h * 0.55, height: 180,
        breathPhase: (elapsed / 500) % 1, pullLean: 0,
      });
      // Static rope from raccoon to monster
      drawRope(ctx, { x: w * 0.3 + 20, y: h * 0.6 }, { x: monsterX - 30, y: h * 0.55 + 10 }, 0, "taut", false);
      if (t < 1) { requestAnimationFrame(loop); } else { resolve(); }
    };
    loop();
  });
}

async function animateDrop(
  deps: RoundDeps, config: RoundConfig, w: number, h: number,
): Promise<void> {
  // 3-keyframe drop: taut -> sagging -> flat over ~0.8s
  const { ctx } = deps;
  const frames: Array<[RopeState, number]> = [["taut", 0], ["sagging", 250], ["flat", 500]];
  const start = performance.now();
  return new Promise((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - start;
      let state: RopeState = "flat";
      for (const [s, ms] of frames) { if (elapsed >= ms) state = s; }
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, 0.15);
      drawMonster(ctx, config.monster, {
        cx: w * 0.75, cy: h * 0.55, height: 180,
        breathPhase: (elapsed / 500) % 1, pullLean: 0.3, // still yanking at empty air
      });
      drawRope(ctx, { x: w * 0.3 + 20, y: h * 0.6 }, { x: w * 0.75 - 30, y: h * 0.55 + 10 }, 0, state, false);
      if (elapsed >= 800) { resolve(); } else { requestAnimationFrame(loop); }
    };
    loop();
  });
}

async function fadeDesaturationBack(
  deps: RoundDeps, w: number, h: number, config: RoundConfig,
): Promise<void> {
  const { ctx } = deps;
  const start = performance.now();
  const duration = 1500;
  return new Promise((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / duration);
      const sat = 0.15 + (1 - 0.15) * t;
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, sat);
      // Keep monster in frame (still roaring at empty rope)
      drawMonster(ctx, config.monster, {
        cx: w * 0.75, cy: h * 0.55, height: 180,
        breathPhase: (elapsed / 500) % 1, pullLean: 0.2,
      });
      if (t < 1) { requestAnimationFrame(loop); } else { resolve(); }
    };
    loop();
  });
}

// Forward declared — will be implemented in Tasks 13-18
async function showValuedScene(
  _deps: RoundDeps, _config: RoundConfig, _roundNum: number, _w: number, _h: number,
): Promise<void> {
  // Placeholder — Tasks 13-18 will wire in per-round drawing
  await new Promise((r) => setTimeout(r, 4000));
}
```

- [ ] **Step 2: Typecheck + lint**

`npx tsc --noEmit && npm run lint` → exit 0. If type errors from `_viz-*.ts` scaffolding files remain, ensure they're deleted.

- [ ] **Step 3: Commit**

```bash
git add src/lessons/drop-the-rope/round-loop.ts
git commit -m "feat: drop-the-rope runRound() state machine"
```

---

## Task 13: Implement valued scene 1 — coffee at home

**Files:**
- Create: `src/lessons/drop-the-rope/valued-scenes.ts`

- [ ] **Step 1: Create the file with an empty registry + scene 1**

```typescript
import { lerpColor } from "../../scenes/utils";

export type ValuedSceneId = 1 | 2 | 3 | 4 | 5;

export interface ValuedSceneContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** animation time in ms since the scene started */
  t: number;
}

/** Scene 1: Morning coffee at home, open window, bird silhouette flying past. */
export function drawValuedCoffee(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Interior wall + floor
  c.fillStyle = "#3a2a1a";
  c.fillRect(0, 0, w, h * 0.7);
  c.fillStyle = "#2a1a0a";
  c.fillRect(0, h * 0.7, w, h * 0.3);

  // Window on the right — opening onto the warm dawn
  const winX = w * 0.55, winY = h * 0.15, winW = w * 0.35, winH = h * 0.4;
  const sky = c.createLinearGradient(winX, winY, winX, winY + winH);
  sky.addColorStop(0, "#5a3a4a");
  sky.addColorStop(1, "#f0c060");
  c.fillStyle = sky;
  c.fillRect(winX, winY, winW, winH);
  // Window frame
  c.strokeStyle = "#4a3a2a";
  c.lineWidth = 6;
  c.strokeRect(winX, winY, winW, winH);
  // Muntin cross
  c.beginPath();
  c.moveTo(winX + winW / 2, winY);
  c.lineTo(winX + winW / 2, winY + winH);
  c.moveTo(winX, winY + winH / 2);
  c.lineTo(winX + winW, winY + winH / 2);
  c.stroke();
  // Tree silhouettes outside
  c.fillStyle = "#2a1a0a";
  c.beginPath(); c.arc(winX + winW * 0.3, winY + winH * 0.8, winH * 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(winX + winW * 0.7, winY + winH * 0.85, winH * 0.35, 0, Math.PI * 2); c.fill();

  // Bird silhouette flying past (animate across the window)
  const birdX = winX + (t / 3000) * winW - winW * 0.2;
  if (birdX > winX && birdX < winX + winW) {
    c.fillStyle = "#1a1a22";
    c.beginPath();
    c.moveTo(birdX, winY + winH * 0.25);
    c.lineTo(birdX - 5, winY + winH * 0.22);
    c.lineTo(birdX - 3, winY + winH * 0.27);
    c.lineTo(birdX + 3, winY + winH * 0.27);
    c.lineTo(birdX + 5, winY + winH * 0.22);
    c.closePath();
    c.fill();
  }

  // Wooden table + mug
  const tableY = h * 0.62;
  c.fillStyle = "#5a3a1a";
  c.fillRect(w * 0.15, tableY, w * 0.3, 10);
  // Mug
  const mugX = w * 0.26, mugY = tableY - 30;
  c.fillStyle = "#f5f0e8";
  c.fillRect(mugX, mugY, 24, 30);
  // Steam (wavy)
  c.strokeStyle = "rgba(255,255,255,0.5)";
  c.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    const sx = mugX + 6 + i * 6;
    const phase = (t / 300 + i) % 3;
    c.moveTo(sx, mugY);
    c.quadraticCurveTo(sx - 4 + Math.sin(phase) * 4, mugY - 15, sx, mugY - 30);
    c.stroke();
  }
}
```

- [ ] **Step 2: Typecheck + lint + commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lessons/drop-the-rope/valued-scenes.ts
git commit -m "feat: valued scene 1 — coffee at home"
```

---

## Task 14: Valued scene 2 — kettlebell swing (reuse gym.ts)

**Files:**
- Modify: `src/lessons/drop-the-rope/valued-scenes.ts`

- [ ] **Step 1: Add drawValuedGym**

```typescript
import { drawGymScene } from "../../scenes/gym";

export function drawValuedGym(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;
  // Reuse existing gym scene — it's already warm-palette-adjacent
  drawGymScene(c, w, h, 0.4);  // skyPhase 0.4 = warm daytime

  // Kettlebell swing animation overlay: a single swing over ~2s
  const swingT = Math.min(1, t / 2000);
  const swingAngle = Math.sin(swingT * Math.PI) * 0.9;
  // The raccoon is positioned separately — here we just draw a kettlebell in its paws
  // Kettlebell follows an arc from in-front to extended
  const bellX = w * 0.5 + Math.sin(swingAngle) * 60;
  const bellY = h * 0.68 - Math.cos(swingAngle) * 20;
  c.fillStyle = "#3a3a3a";
  c.beginPath();
  c.arc(bellX, bellY, 18, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2a2a2a";
  c.lineWidth = 4;
  c.beginPath();
  c.arc(bellX, bellY - 20, 8, Math.PI, 0);
  c.stroke();
  // Weight label
  c.fillStyle = "#ffffff";
  c.font = "10px sans-serif";
  c.textAlign = "center";
  c.fillText("16kg", bellX, bellY + 3);
}
```

Note: the existing `drawGymScene` signature is `(ctx, w, h, skyPhase)` — verify by checking `src/scenes/gym.ts` before committing; adjust if different.

- [ ] **Step 2: Commit**

```bash
git add src/lessons/drop-the-rope/valued-scenes.ts
git commit -m "feat: valued scene 2 — kettlebell swing (reuses gym.ts)"
```

---

## Task 15: Valued scene 3 — park bench + friend text

**Files:**
- Modify: `src/lessons/drop-the-rope/valued-scenes.ts`

- [ ] **Step 1: Add drawValuedFriend**

```typescript
export function drawValuedFriend(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Golden hour grassy field
  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#f0c060");
  grad.addColorStop(0.6, "#c0855f");
  grad.addColorStop(0.65, "#8a6540");
  grad.addColorStop(1, "#3a2a1a");
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  // Tree behind the bench (single blob + trunk)
  c.fillStyle = "#3a2a1a";
  c.fillRect(w * 0.22, h * 0.35, 8, h * 0.3);
  c.fillStyle = "#2a4a2a";
  c.beginPath(); c.arc(w * 0.24, h * 0.35, h * 0.18, 0, Math.PI * 2); c.fill();

  // Park bench
  c.fillStyle = "#5a3a1a";
  c.fillRect(w * 0.35, h * 0.65, w * 0.3, 8);  // seat
  c.fillRect(w * 0.35, h * 0.58, w * 0.3, 6);  // backrest top
  for (let i = 0; i < 4; i++) {
    c.fillRect(w * 0.37 + i * (w * 0.26 / 3), h * 0.59, 3, 14);  // slats
  }

  // Speech bubble notification after 1s delay
  if (t > 1000) {
    const bubbleX = w * 0.35, bubbleY = h * 0.35;
    const bubbleW = w * 0.3, bubbleH = 50;
    c.fillStyle = "rgba(255, 255, 255, 0.95)";
    c.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
    c.fillStyle = "#1a1a22";
    c.font = "14px sans-serif";
    c.textAlign = "left";
    c.fillText('📱 "hey. coffee this week?"', bubbleX + 10, bubbleY + 30);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lessons/drop-the-rope/valued-scenes.ts
git commit -m "feat: valued scene 3 — park bench + friend text"
```

---

## Task 16: Valued scene 4 — writing at desk

**Files:**
- Modify: `src/lessons/drop-the-rope/valued-scenes.ts`

- [ ] **Step 1: Add drawValuedWriting**

```typescript
export function drawValuedWriting(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Dim warm room
  c.fillStyle = "#5a3a4a";
  c.fillRect(0, 0, w, h * 0.7);
  c.fillStyle = "#3a2a1a";
  c.fillRect(0, h * 0.7, w, h * 0.3);

  // Desk
  c.fillStyle = "#5a3a1a";
  c.fillRect(w * 0.1, h * 0.6, w * 0.8, 12);

  // Amber desk lamp (glow)
  const lampX = w * 0.25, lampY = h * 0.45;
  const glow = c.createRadialGradient(lampX, lampY, 0, lampX, lampY, w * 0.3);
  glow.addColorStop(0, "rgba(255, 200, 100, 0.6)");
  glow.addColorStop(1, "rgba(255, 200, 100, 0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, w, h);
  // Lamp shade
  c.fillStyle = "#c8954a";
  c.beginPath();
  c.moveTo(lampX - 15, lampY);
  c.lineTo(lampX + 15, lampY);
  c.lineTo(lampX + 20, lampY - 25);
  c.lineTo(lampX - 20, lampY - 25);
  c.closePath();
  c.fill();
  c.fillStyle = "#5a3a1a";
  c.fillRect(lampX - 2, lampY, 4, h * 0.6 - lampY);

  // Open notebook (two white pages)
  const nbX = w * 0.4, nbY = h * 0.55;
  c.fillStyle = "#f5f0e8";
  c.fillRect(nbX, nbY, w * 0.3, 50);
  c.strokeStyle = "#3a2a1a";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(nbX + w * 0.15, nbY);
  c.lineTo(nbX + w * 0.15, nbY + 50);
  c.stroke();

  // Ink trail from the raccoon's paw — grows over time
  const maxInk = Math.min(w * 0.12, (t / 2500) * w * 0.12);
  c.strokeStyle = "#1a1a22";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(nbX + w * 0.01, nbY + 20);
  c.lineTo(nbX + w * 0.01 + maxInk, nbY + 22);
  c.stroke();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lessons/drop-the-rope/valued-scenes.ts
git commit -m "feat: valued scene 4 — writing at desk with warm lamp glow"
```

---

## Task 17: Valued scene 5 — dog in living room (painted cartoon dog per rev 2)

**Files:**
- Modify: `src/lessons/drop-the-rope/valued-scenes.ts`

- [ ] **Step 1: Add drawValuedDog**

```typescript
export function drawValuedDog(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Warm living room — wood floor, window on the right
  c.fillStyle = "#3a2a1a";
  c.fillRect(0, 0, w, h * 0.7);
  c.fillStyle = "#5a3a1a";
  c.fillRect(0, h * 0.7, w, h * 0.3);
  // Planks
  c.strokeStyle = "#4a2a0a";
  for (let px = 0; px < w; px += 30) {
    c.beginPath(); c.moveTo(px, h * 0.7); c.lineTo(px, h); c.stroke();
  }

  // Amber couch corner on the left
  c.fillStyle = "#c8954a";
  c.fillRect(0, h * 0.55, w * 0.25, h * 0.2);
  c.fillStyle = "#a0742a";
  c.fillRect(0, h * 0.55, w * 0.25, 8);  // cushion edge

  // Window on the right with warm light
  const winX = w * 0.75, winY = h * 0.15, winW = w * 0.2, winH = h * 0.4;
  const winGrad = c.createLinearGradient(winX, winY, winX, winY + winH);
  winGrad.addColorStop(0, "#f0c060");
  winGrad.addColorStop(1, "#ffe890");
  c.fillStyle = winGrad;
  c.fillRect(winX, winY, winW, winH);
  c.strokeStyle = "#4a3a2a";
  c.lineWidth = 4;
  c.strokeRect(winX, winY, winW, winH);

  // PAINTED CARTOON DOG (rev 2 — not a silhouette)
  const dogX = w * 0.55, dogY = h * 0.72;
  c.fillStyle = "#d97706";  // warm rust-orange body
  // Body oval
  c.beginPath(); c.ellipse(dogX, dogY, 30, 20, 0, 0, Math.PI * 2); c.fill();
  // Head
  c.beginPath(); c.ellipse(dogX - 25, dogY - 10, 16, 14, 0, 0, Math.PI * 2); c.fill();
  // Snout
  c.fillStyle = "#a55a00";
  c.beginPath(); c.ellipse(dogX - 38, dogY - 6, 8, 5, 0, 0, Math.PI * 2); c.fill();
  // Ears (floppy)
  c.fillStyle = "#b55e08";
  c.beginPath(); c.ellipse(dogX - 30, dogY - 20, 5, 10, 0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(dogX - 20, dogY - 22, 5, 10, -0.3, 0, Math.PI * 2); c.fill();
  // Eyes looking up
  c.fillStyle = "#1a1a22";
  c.beginPath(); c.arc(dogX - 32, dogY - 12, 2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(dogX - 25, dogY - 12, 2, 0, Math.PI * 2); c.fill();
  // Tail mid-wag — animated via t
  c.strokeStyle = "#d97706";
  c.lineWidth = 6;
  c.lineCap = "round";
  const wagAngle = Math.sin(t / 200) * 0.6;
  c.beginPath();
  c.moveTo(dogX + 28, dogY - 5);
  c.lineTo(dogX + 28 + Math.cos(wagAngle - 0.5) * 25, dogY - 5 - Math.sin(wagAngle - 0.5) * 25);
  c.stroke();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lessons/drop-the-rope/valued-scenes.ts
git commit -m "feat: valued scene 5 — warm cartoon dog with wagging tail"
```

---

## Task 18: Wire valued scenes into round-loop + captions

**Files:**
- Modify: `src/lessons/drop-the-rope/round-loop.ts`
- Modify: `src/lessons/drop-the-rope/style.css`

- [ ] **Step 1: Replace the `showValuedScene` stub**

In `round-loop.ts`, replace the placeholder:

```typescript
import {
  drawValuedCoffee,
  drawValuedGym,
  drawValuedFriend,
  drawValuedWriting,
  drawValuedDog,
  type ValuedSceneContext,
} from "./valued-scenes";

async function showValuedScene(
  deps: RoundDeps, config: RoundConfig, roundNum: number, w: number, h: number,
): Promise<void> {
  const { ctx } = deps;
  const drawFn = [drawValuedCoffee, drawValuedGym, drawValuedFriend, drawValuedWriting, drawValuedDog][roundNum - 1];

  // Crossfade: fade from warm dawn to scene over ~1s
  const fadeStart = performance.now();
  await new Promise<void>((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - fadeStart;
      const t = Math.min(1, elapsed / 1000);
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, 1);
      ctx.globalAlpha = t;
      drawFn({ ctx, w, h, t: elapsed });
      ctx.globalAlpha = 1;
      if (t < 1) { requestAnimationFrame(loop); } else { resolve(); }
    };
    loop();
  });

  // Raccoon arrives at a scene-specific spot
  const sceneSpot = [
    { x: w * 0.28, y: h * 0.72 }, // coffee — at the table
    { x: w * 0.5,  y: h * 0.72 }, // gym — center with kettlebell
    { x: w * 0.48, y: h * 0.72 }, // friend — on the bench
    { x: w * 0.5,  y: h * 0.72 }, // writing — at the desk
    { x: w * 0.35, y: h * 0.72 }, // dog — entering the room
  ][roundNum - 1];
  await deps.character.walkTo(sceneSpot.x, sceneSpot.y, prefersReducedMotion() ? 0 : 1000);

  // Play out the scene with animation for ~4s total
  const playStart = performance.now();
  const captionEl = ensureCaptionEl();
  captionEl.textContent = "";
  await new Promise<void>((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - playStart;
      ctx.clearRect(0, 0, w, h);
      drawFn({ ctx, w, h, t: elapsed });
      // Q5: caption fades in 2s after arrival
      if (elapsed >= 2000 && !captionEl.textContent) {
        captionEl.textContent = config.captionText;
        captionEl.classList.add("dtr-caption-visible");
      }
      if (elapsed >= 4500) { resolve(); } else { requestAnimationFrame(loop); }
    };
    loop();
  });

  // Hide caption before next round
  captionEl.classList.remove("dtr-caption-visible");
}

function ensureCaptionEl(): HTMLDivElement {
  let el = document.getElementById("dtr-caption") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "dtr-caption";
    el.className = "dtr-caption";
    document.body.appendChild(el);
  }
  return el;
}
```

- [ ] **Step 2: Add caption CSS**

Append to `style.css`:

```css
.dtr-caption {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.85);
  font-size: 24px;
  font-style: italic;
  letter-spacing: 0.05em;
  opacity: 0;
  transition: opacity 0.8s ease-out;
  pointer-events: none;
}
.dtr-caption-visible { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .dtr-caption { transition: none; }
}
```

- [ ] **Step 3: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lessons/drop-the-rope/round-loop.ts src/lessons/drop-the-rope/style.css
git commit -m "feat: wire valued scenes into round loop + captions"
```

---

## Task 19: Write `intro.ts` (3 glow-style slides)

**Files:**
- Create: `src/lessons/drop-the-rope/intro.ts`

- [ ] **Step 1: Write runIntro()**

```typescript
/** 3 glow-style intro slides: "Every hard feeling wants you to fight it." etc. */
export async function runIntro(container: HTMLElement): Promise<void> {
  const slides = [
    "Every hard feeling wants you to fight it.",
    "Fighting it is the trap.",
    "Here. Try.",
  ];
  const intro = document.createElement("div");
  intro.className = "dtr-intro";
  container.appendChild(intro);

  for (const text of slides) {
    intro.textContent = text;
    intro.classList.add("dtr-intro-visible");
    await waitForAdvance(intro);
    intro.classList.remove("dtr-intro-visible");
    await delay(400);
  }
  container.removeChild(intro);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForAdvance(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handler = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
          cleanup(); resolve();
        }
      } else {
        cleanup(); resolve();
      }
    };
    const cleanup = () => {
      window.removeEventListener("keydown", handler);
      el.removeEventListener("click", handler);
    };
    window.addEventListener("keydown", handler);
    el.addEventListener("click", handler);
  });
}
```

Add CSS to `style.css`:

```css
.dtr-intro {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #e0e0e0;
  font-size: 28px;
  font-style: italic;
  opacity: 0;
  transition: opacity 0.8s ease-out;
  cursor: pointer;
  padding: 32px;
}
.dtr-intro-visible { opacity: 1; }
```

- [ ] **Step 2: Commit**

```bash
git add src/lessons/drop-the-rope/intro.ts src/lessons/drop-the-rope/style.css
git commit -m "feat: drop-the-rope 3-slide intro in glow style"
```

---

## Task 20: Write `gallery.ts` ending

**Files:**
- Create: `src/lessons/drop-the-rope/gallery.ts`

- [ ] **Step 1: Write runGallery()**

```typescript
import type { RoundDeps } from "./round-loop";
import { drawWarmDawn } from "./warm-dawn";
import { drawMonster } from "./monsters";
import { drawRaccoonComposite } from "../../scenes/raccoonComposite";
import type { MonsterId } from "./types";

const ALL_MONSTERS: MonsterId[] = ["anxiety", "self-criticism", "shame", "doubt", "anger"];

export async function runGallery(
  deps: RoundDeps,
  onAgain: () => void,
  onExit: () => void,
): Promise<void> {
  const { ctx, canvas, character } = deps;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // Hide the Character DOM overlay — we'll composite the raccoon statically
  character.el.style.display = "none";

  // Draw: warm dawn → 5 distant monsters → raccoon front-center (via composite)
  ctx.clearRect(0, 0, w, h);
  drawWarmDawn(ctx, w, h, 1);

  // 5 monsters in a row across top-half, small
  for (let i = 0; i < 5; i++) {
    const cx = (w * 0.1) + (i + 0.5) * (w * 0.16);
    const cy = h * 0.3;
    drawMonster(ctx, ALL_MONSTERS[i], { cx, cy, height: 70, breathPhase: i * 0.2, pullLean: 0.6 });
  }

  // Raccoon front-center using the composite function (ear padding matters at this size)
  drawRaccoonComposite(ctx, w / 2, h * 0.7, 120, "neutral");

  // Fade-in ending lines
  const endUI = document.createElement("div");
  endUI.className = "dtr-ending";
  endUI.innerHTML = `
    <div class="dtr-ending-line1">The monsters don't leave. You do.</div>
    <div class="dtr-ending-line2">Same move. Every time.</div>
    <div class="dtr-ending-actions">
      <a href="#" id="dtr-again">Again</a>
      <a href="/">Explorable Explanations</a>
    </div>
  `;
  document.body.appendChild(endUI);

  // Fade in lines sequentially
  await delay(2000);
  endUI.querySelector<HTMLElement>(".dtr-ending-line1")!.style.opacity = "1";
  await delay(2000);
  endUI.querySelector<HTMLElement>(".dtr-ending-line2")!.style.opacity = "1";
  await delay(3000);
  endUI.querySelector<HTMLElement>(".dtr-ending-actions")!.style.opacity = "1";

  // Wait for "Again" click or external exit
  endUI.querySelector("#dtr-again")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.removeChild(endUI);
    character.el.style.display = "";
    onAgain();
  });
  // Exit via hub link is handled by the link's href
  void onExit;
}

function delay(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
```

Add CSS:

```css
.dtr-ending {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 48px;
  pointer-events: none;
}
.dtr-ending > div { opacity: 0; transition: opacity 1.2s ease-out; margin-top: 12px; }
.dtr-ending-line1, .dtr-ending-line2 { font-size: 22px; color: #e0e0e0; font-style: italic; }
.dtr-ending-actions { display: flex; gap: 24px; pointer-events: auto; }
.dtr-ending-actions a { color: #93C5FD; text-decoration: none; font-size: 18px; }
```

- [ ] **Step 2: Commit**

```bash
git add src/lessons/drop-the-rope/gallery.ts src/lessons/drop-the-rope/style.css
git commit -m "feat: drop-the-rope gallery ending with static composition"
```

---

## Task 21: Write `game.ts` top-level orchestrator

**Files:**
- Create: `src/lessons/drop-the-rope/game.ts`

- [ ] **Step 1: Write the DropTheRopeGame class**

```typescript
import { Character } from "../../characters/Character";
import { ExhaustionBar } from "./exhaustion-bar";
import { DropButton } from "./drop-button";
import { TauntBubble } from "./taunt-bubble";
import { canvasAspect } from "../../scenes/utils";
import { ROUND_CONFIGS } from "./monsters";
import { runRound, type RoundDeps } from "./round-loop";
import { runIntro } from "./intro";
import { runGallery } from "./gallery";
import { initA11y } from "./a11y";

export class DropTheRopeGame {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private character!: Character;
  private exhaustionBar!: ExhaustionBar;
  private dropButton!: DropButton;
  private tauntBubble!: TauntBubble;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async start(): Promise<void> {
    initA11y();
    this.setupDOM();
    await runIntro(this.container);
    for (let r = 1 as 1 | 2 | 3 | 4 | 5; r <= 5; r++) {
      await runRound(ROUND_CONFIGS[r - 1], r, this.deps());
    }
    await runGallery(
      this.deps(),
      () => this.restart(),
      () => { location.href = "/"; },
    );
  }

  restart(): void {
    this.container.innerHTML = "";
    this.start();
  }

  private deps(): RoundDeps {
    return {
      ctx: this.canvas.getContext("2d")!,
      canvas: this.canvas,
      character: this.character,
      exhaustionBar: this.exhaustionBar,
      dropButton: this.dropButton,
      tauntBubble: this.tauntBubble,
    };
  }

  private setupDOM(): void {
    this.container.innerHTML = "";
    this.container.style.position = "relative";

    this.exhaustionBar = new ExhaustionBar();
    this.container.appendChild(this.exhaustionBar.el);

    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.maxWidth = "1200px";
    this.canvas.style.margin = "0 auto";
    const rect = this.container.getBoundingClientRect();
    const aspect = canvasAspect(rect.width || 1200);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 1200) * dpr;
    this.canvas.height = (rect.width || 1200) * aspect * dpr;
    this.canvas.style.height = `${(rect.width || 1200) * aspect}px`;
    this.canvas.getContext("2d")!.scale(dpr, dpr);
    this.container.appendChild(this.canvas);

    this.character = new Character();
    this.container.appendChild(this.character.el);

    this.dropButton = new DropButton();
    this.container.appendChild(this.dropButton.el);

    this.tauntBubble = new TauntBubble();
    this.container.appendChild(this.tauntBubble.el);
  }
}
```

- [ ] **Step 2: Wire into main.ts** — replace the placeholder content

```typescript
import "./style.css";
import { DropTheRopeGame } from "./game";

const container = document.getElementById("game-container");
if (!container) throw new Error("#game-container not found");

// About modal wiring (keep from Task 2)
const aboutLink = document.getElementById("about-link")!;
const aboutModal = document.getElementById("about-modal")!;
const aboutClose = document.getElementById("about-close")!;
aboutLink.addEventListener("click", (e) => { e.preventDefault(); aboutModal.removeAttribute("hidden"); });
aboutClose.addEventListener("click", () => aboutModal.setAttribute("hidden", ""));
aboutModal.addEventListener("click", (e) => { if (e.target === aboutModal) aboutModal.setAttribute("hidden", ""); });

const game = new DropTheRopeGame(container);
game.start();

document.getElementById("restart-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  game.restart();
});
```

- [ ] **Step 3: Typecheck + lint + build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/lessons/drop-the-rope/game.ts src/lessons/drop-the-rope/main.ts
git commit -m "feat: drop-the-rope game orchestrator + main.ts wiring"
```

---

## Task 22: Manual visual walkthrough at mobile and desktop

**Files:** none (manual verification)

- [ ] **Step 1: Start dev server**

```bash
npm run dev -- --host 0.0.0.0 &
```

- [ ] **Step 2: Screenshot at mobile viewport (iPhone 17 Pro reference)**

```javascript
// tmp-dtr-mobile.mjs
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 427, height: 933 }, deviceScaleFactor: 3 });
await page.goto('http://localhost:5180/lessons/drop-the-rope/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/dtr-mobile-intro.png' });
// Advance past the intro
await page.keyboard.press('Space');
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/dtr-mobile-round1.png' });
await browser.close();
```

Run and read both screenshots.

- [ ] **Step 3: Screenshot at desktop viewport (1200x900)**

Same script but `viewport: { width: 1200, height: 900 }`. Save to `/tmp/dtr-desktop-*.png`.

- [ ] **Step 4: Verify visually** — intro slides are centered, round 1 shows the raccoon + rope + Anxiety monster against a warm dawn background + thin exhaustion bar at top. Mobile and desktop should both look right (aspect ratio differs per `canvasAspect()`).

If any regression, fix and re-screenshot. Do not proceed until both viewports look correct.

- [ ] **Step 5: Kill dev server**

```bash
kill $(pgrep -f "vite.*5180")
```

- [ ] **Step 6: Commit any tuning changes**

```bash
git add -A
git commit -m "tweak: drop-the-rope mobile + desktop visual tuning" --allow-empty
```

---

## Task 23: Write Playwright E2E test

**Files:**
- Create: `tests/drop-the-rope.spec.ts`

- [ ] **Step 1: Write the E2E test**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Drop the Rope", () => {
  test("loads the page and shows the intro", async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
    await expect(page.locator(".dtr-intro")).toBeVisible();
    await expect(page.locator(".dtr-intro")).toContainText("Every hard feeling");
  });

  test("advances through all 3 intro slides via Space key", async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
    await page.waitForSelector(".dtr-intro.dtr-intro-visible");
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await expect(page.locator(".dtr-intro")).toContainText("Fighting it is the trap");
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await expect(page.locator(".dtr-intro")).toContainText("Here. Try.");
    await page.keyboard.press("Space");
    await page.waitForTimeout(2000);
    // Intro is gone, canvas is rendering round 1
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("drop button appears after drop-timer elapses", async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
    // Skip intro
    for (let i = 0; i < 3; i++) { await page.keyboard.press("Space"); await page.waitForTimeout(200); }
    // Wait for round 1 to be in struggle phase, then mash space for 18s
    await page.waitForTimeout(500);
    const dropBtn = page.locator(".dtr-drop-button");
    await expect(dropBtn).toBeHidden();
    // Wait at least 18s (the round-1 timer). Use long-poll.
    await expect(dropBtn).toBeVisible({ timeout: 22000 });
  });

  test("clicking drop button advances the round", async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
    for (let i = 0; i < 3; i++) { await page.keyboard.press("Space"); await page.waitForTimeout(200); }
    const dropBtn = page.locator(".dtr-drop-button");
    await expect(dropBtn).toBeVisible({ timeout: 22000 });
    await dropBtn.click();
    // After ~4s of drop + walk + valued scene, the caption should appear
    await expect(page.locator(".dtr-caption-visible")).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".dtr-caption")).toContainText("coffee");
  });

  test("restart link returns to intro", async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
    await page.waitForTimeout(500);
    await page.click("#restart-link");
    await expect(page.locator(".dtr-intro")).toContainText("Every hard feeling");
  });

  test("hub link is reachable from header", async ({ page }) => {
    await page.goto("/lessons/drop-the-rope/");
    await page.waitForTimeout(500);
    const hubLink = page.locator("a", { hasText: "Explorable Explanations" }).first();
    await expect(hubLink).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run the test**

`npx playwright test tests/drop-the-rope.spec.ts` — all 6 tests should pass. The 22-second timeout for `drop button appears` is intentional (round 1 uses 18s + ~1.2s button fade + buffer).

- [ ] **Step 3: Commit**

```bash
git add tests/drop-the-rope.spec.ts
git commit -m "test: drop-the-rope Playwright E2E walkthrough"
```

---

## Task 24: Run the playtest agent on round 1 (Q3 gate)

**Files:** none (research task — produces a report)

Per Q3, the round-1 drop-timer (18s) is a placeholder that must be validated by the playtest agent critic before the PR can merge.

- [ ] **Step 1: Dispatch the playtest agent**

Use the `Agent` tool with `subagent_type: "general-purpose"` and a prompt that follows the pattern from `memory/reference_playtest_agent.md`. The key criterion to bake in:

> "At t=18s when the drop button first appears in round 1, what does the raccoon's face mean? Relief, surrender, or confusion? Which of those did the player just feel? Take screenshots every 2 seconds of round 1 from t=0 to t=22, view each with vision, then write a verdict: is 18s too long, too short, or right?"

The playtest agent should:
1. Start the dev server
2. Launch Playwright
3. Walk through the intro
4. Take timestamped screenshots every 2s of round 1 (t=2, t=4, ..., t=22)
5. View each with the Read tool
6. Write a single-paragraph verdict + recommended new timer value if different

- [ ] **Step 2: Apply the playtest recommendation**

If the agent recommends a different number, update `ROUND_CONFIGS[0].dropTimerMs` in `monsters.ts` to match, update the Q3 entry in the design doc to record the playtest result, and re-run the E2E test (adjusting the 22s timeout if needed).

- [ ] **Step 3: Commit the tuning (if any)**

```bash
git add src/lessons/drop-the-rope/monsters.ts docs/plans/2026-04-11-drop-the-rope-monster-gallery-design.md tests/drop-the-rope.spec.ts
git commit -m "tune: drop-the-rope round-1 timer per playtest agent report"
```

If the agent says 18s is right, just document "playtest validated 18s" in a commit message with --allow-empty.

---

## Task 25: Open the final PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin drop-the-rope-main
```

Note: all prior tasks may have been on separate small branches merged via small PRs. If the team prefers one big PR, the tasks could also run on a single long-lived branch. Either way, the final state on main must have all of Tasks 2-24 integrated.

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat: Drop the Rope — wordless 5-round defusion lesson" --body "$(cat <<EOF
## Summary

Implements the Drop the Rope lesson per design doc \`docs/plans/2026-04-11-drop-the-rope-monster-gallery-design.md\` (revision 3, all 11 open questions locked).

- 5 emotion-monster silhouette characters against a warm dawn world
- Graduated drop-timer (18s → 10s → 6s → 3s → 0.5s) and graduated taunt durations
- 5 valued scenes (coffee / gym / friend / page / dog) with 2s-after-arrival captions
- Gallery ending with "The monsters don't leave. You do." / "Same move. Every time."
- Full a11y: aria-live announcements, prefers-reduced-motion, Space=pull / Enter=drop
- Playwright E2E walkthrough in \`tests/drop-the-rope.spec.ts\`

## Prerequisites

- [x] PR #8 (mismatched Crocs) merged
- [x] \`canvasAspect\` refactor merged

## Test plan

- [x] Round 1 drop-timer validated by playtest agent (see commit log)
- [ ] CI passes: tsc + eslint + playwright
- [ ] Preview deploy renders correctly on mobile (427x933) and desktop
- [ ] Manual smoke: restart link works, About modal opens, hub card links in

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

Checklist run against the spec:

- **§1 concept:** covered by the overall flow (Tasks 11, 12, 21).
- **§2 monster roster (5 monsters, warm dawn, graduated taunts):** Tasks 4 (data + round configs with graduated taunt durations), 6 (drawing).
- **§3 core loop (arriving → struggling → greying → button → drop → walk → valued → dissolve):** Task 11 (helpers), Task 12 (full integration).
- **§4 raccoon expression choreography:** Task 12 uses `character.setExpression("stressed"|"desperate"|"tired"|"neutral")` at the right phase transitions.
- **§5 valued scenes:** Tasks 13-18, one per scene + wiring.
- **§6 layout, rope, greying, drop button:** Tasks 5, 7, 8, 9. Greying-during-struggle implemented via `computeDesaturation` + per-frame re-draw in Task 12.
- **§7 pacing:** drop-timer and taunt-duration data in Task 4; round-5 compressed walk-in via `monsterWalkInMs: 500` in the config. Graduated taunt durations flow through `TauntBubble.show()` in Task 12.
- **§8 gallery ending:** Task 20.
- **§9 architecture (self-contained state machine, file layout, canvasAspect refactor):** Task 1 (refactor), Task 2 (scaffold), Task 21 (orchestrator). File layout matches the spec's new-files list.
- **§10 Q2-Q11 locked decisions:**
  - Q2 graduated taunts: `ROUND_CONFIGS[i].tauntHoldMs` + `TauntBubble.show()` honors it (Task 4, 10, 12).
  - Q3 18s + playtest gate: Task 24.
  - Q4 0.5s + compressed walk-in: `ROUND_CONFIGS[4].monsterWalkInMs = 500` + `animateArrival` honors it (Task 4, 12).
  - Q5 captions 2s after arrival: Task 18 `showValuedScene` waits 2000ms before adding `dtr-caption-visible`.
  - Q6 URL `/lessons/drop-the-rope/`: Task 2.
  - Q7 sound deferred: explicitly not in scope for this plan; add as a follow-up when audio pass begins.
  - Q8 no inline cross-link: gallery ending (Task 20) only links to hub, not to choice-point.
  - Q9 unwinnable tension-spike flash: Task 12 lines `if (roundNum === 1 && elapsed >= 4000 && elapsed < 4200 && tapCount > 10)`.
  - Q10 a11y checklist: Task 9 (aria-live infrastructure), Task 12 (announce on monster arrival + button + scene arrival), Task 18 (prefers-reduced-motion hook), Task 9 (keyboard: Space=pull via round-loop, Enter=button via default browser behavior).
  - Q11 Crocs prereq PR: Task 0 gate.

- **Placeholder scan:** All tasks have concrete code or concrete commands. No TBD / TODO / "add appropriate error handling" / "similar to Task N" present. The one inline `// TODO`-adjacent placeholder in Task 11 (`showValuedScene` stub) is filled by Task 18 — that's an intentional forward-declaration to keep Task 11's commit small.

- **Type consistency:**
  - `Monster`, `MonsterId`, `RoundConfig`, `RoundPhase`, `GameState`, `GamePhase` defined in Task 3 and used consistently thereafter.
  - `RoundDeps` interface defined in Task 11, used in Tasks 12, 20, 21.
  - `drawMonster(ctx, id, opts)` signature consistent between Task 6 definition and Task 12 usage.
  - `drawRope(ctx, from, to, tension, state, flashFrame)` — Task 7 → Task 12 usage matches.
  - `getRoundConfig(round)` one-indexed per the 1|2|3|4|5 type; consistent.

- **Gap:** Q7 audio pass is explicitly deferred to a follow-up, not dropped. Design doc §10 Q7 already says "add audio in a second pass" — this plan honors that by not implementing audio but making sure nothing depends on it.

Self-review passes.

---
