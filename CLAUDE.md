# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment

Production auto-deploys on push to main via GitHub Actions. PRs get preview deploys at `pr-{N}-activation-energy-game.surge.sh` with an auto-comment on the PR.

## What This Is

A collection of interactive explorable explanations (Nicky Case-style). Built as a multi-page app (MPA) with HTML/CSS/Canvas — all graphics are procedurally drawn (no image sprites).

### Site Structure (MPA)

```
/                              → Hub page (card grid linking to all content)
/lessons/energy/               → Lesson 1: Activation Energy game (8 chapters)
/lessons/glow/                 → Lesson 2: Raccoon's Glow (wordless energy story)
/lessons/morning-choice/       → Lesson 3: The Morning Choice (branching narrative)
/lessons/free-evening/         → Free Evening (stubbed, not built yet)
/playground/raccoon-styles/    → Playground: raccoon character style comparison
```

Each page is an independent HTML entry point. Vite multi-page build configured in `vite.config.ts`.

## Commands

```bash
npm run dev       # Vite dev server on localhost:5180
npm run build     # TypeScript check + Vite production build → dist/
npm run lint      # ESLint
npm run preview   # Preview production build
just ci           # npm ci + lint + build (CI pipeline)
```

Playwright E2E tests in `tests/`. Run with `npx playwright test`.

## Architecture

### Layer Overview

```
src/lessons/energy/main.ts → Game → SceneManager → Chapter (extends Scene)
                                   → WillpowerBar (persistent, always visible)
```

- **Game** (`src/Game.ts`): Top-level orchestrator. Owns the SceneManager, WillpowerBar, and a `requestAnimationFrame` loop that drives tween updates (global + WillpowerBar groups).
- **SceneManager** (`src/engine/SceneManager.ts`): Manages one active Scene at a time with 400ms CSS opacity fade transitions. Calls `enter()`/`exit()` on scenes.
- **Scene** (`src/engine/Scene.ts`): Abstract base class owning an `HTMLDivElement`. Each chapter extends it, implementing `enter()` (async setup) and `exit()` (cleanup). The chapter signals completion via `this.onComplete?.()`.

### Chapter Flow

Chapters run sequentially (Ch0→Ch7). Each chapter's `enter()` method:
1. Creates TextBox(es) with narrative text (typewriter effect)
2. Creates an interaction component (DragToNumberLine, TimelineScrubber, etc.)
3. Awaits user interaction via promises
4. Updates WillpowerBar and Character expression
5. Calls `this.onComplete?.()` to trigger the next chapter

Chapter constructors take `(game: Game)` — `game` provides access to the shared `willpowerBar`.

### Simulation Layer (`src/sim/`)

Pure logic with no rendering dependencies:
- **DaySimulator**: Takes a schedule + initial willpower/fibers → SimResult. Computes activation energy as stopping(current) + starting(next).
- **FiberModel**: 5-fiber willpower model. Static methods for `totalWillpower()`, `applyEffects()`, `cascadeEffect()` (when fiber <5, adjacent fibers lose points).
- **DeathSpiral**: Multi-day cascade simulation with optional intervention.
- **activities.ts**: 11 predefined activities with starting/stopping costs and fiber effects.

### Interaction Components (`src/interactions/`)

Each owns an `HTMLDivElement` (`.el` property) and uses HTML elements for UI with Canvas 2D for charts/drawings. Some use their own Tween.Group for animations. They accept options (position, dimensions, callbacks) and fire callbacks on user completion. One per chapter:
- Ch1: DragToNumberLine, Ch2: TimelineScrubber, Ch3: DayTimeline
- Ch4: FiberRope, Ch5: SpiralAnimation, Ch6: LeverToggles

### Character System (`src/characters/`)

Procedurally drawn pill-shaped character on a small `<canvas>` element with 6 expressions (happy, neutral, tired, stressed, desperate, energized). Key methods: `setExpression(name)`, `walkTo(x, y, duration)`. `Character.expressionForWillpower(percent)` maps willpower percentage to an expression.

**Gotcha:** `drawRaccoon()` calls `clearRect(0, 0, w, h)` internally. When compositing the raccoon onto another canvas (e.g., the room scene), draw onto an offscreen canvas first, then `drawImage()` it — otherwise `clearRect` wipes the background.

### Animation Pattern

Tween.js is used for animated values (willpower bar, card reveals, cost floats). The Game runs a `requestAnimationFrame` loop that updates:
1. Global tween group (`updateTweens()`)
2. WillpowerBar's tween group

Scene transitions use CSS `opacity` with `transition` property. Each interaction component that uses tweens also runs its own `requestAnimationFrame` loop for its local tween group.

### Self-Contained Lessons (Alternative Pattern)

Lessons that need branching or non-linear flow (e.g., `/lessons/morning-choice/`) use a self-contained state machine instead of the Game/SceneManager framework. They import shared modules (`drawRaccoon`, expressions) but own their own flow, rendering, and UI. See `src/lessons/morning-choice/game.ts` for the pattern.

## Page Conventions (MUST follow for every new page)

Every lesson and playground page MUST have:

1. **Standard header** — 48px bar with breadcrumb left, About link right:
   ```html
   <header id="header">
     <span class="header-title"><a href="/">Explorable Explanations</a> / Page Name</span>
     <a id="about-link" href="#">About</a>
   </header>
   ```
2. **About modal** — clicking About opens a modal with page description, tech note, and GitHub link. Uses the same modal HTML/CSS/JS pattern as `lessons/energy/index.html`.
3. **Hub link** — the "Explorable Explanations" text in the header always links back to `/`.
4. **Hub card** — every new page gets a card added to the hub (`index.html`) in the appropriate section (Lessons or Playgrounds).
5. **Vite entry** — every new HTML page gets added to `vite.config.ts` `build.rollupOptions.input`.
6. **Navigation** — all slide/chapter-based lessons MUST support forward AND back:
   - **Keyboard:** ArrowRight/ArrowDown/Space/Enter = forward, ArrowLeft/ArrowUp = back
   - **Click/tap:** left third of screen = back, rest = forward
   - **Swipe (mobile):** swipe left = forward, swipe right = back

## Key Conventions

- **TypeScript strict mode** with ES2020 target
- **No sprites/textures** — all visuals drawn with HTML/CSS and Canvas 2D
- **Visual verification** — whenever you draw a new scene or change a scene, you must screenshot and look at it with vision. When changing shared scene code in `src/scenes/`, re-screenshot ALL scenes that use it to check for regressions
- **No heavy frameworks** — vanilla DOM manipulation, `<canvas>` for procedural drawing
- **Sounds via Howler.js** — `src/assets/sounds.ts` is a stub ready for real audio files in `public/sounds/`
- **Design docs** in `docs/plans/` and `docs/superpowers/specs/` — specs and implementation plans describe intended behavior
- **Deployed to Surge.sh** — staging at `activation-energy-game-stage.surge.sh`, production at `activation-energy-game.surge.sh`
