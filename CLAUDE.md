# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment

Production auto-deploys on push to main via GitHub Actions. PRs get preview deploys at `pr-{N}-activation-energy-game.surge.sh` with an auto-comment on the PR.

## What This Is

An interactive narrative game (Nicky Case-style explorable explainer) about willpower, habits, and activation energy. Built with HTML/CSS/Canvas — all graphics are procedurally drawn (no image sprites). 8 sequential chapters, each with narrative text and an interactive component.

## Commands

```bash
npm run dev       # Vite dev server on localhost:5180
npm run build     # TypeScript check + Vite production build → dist/
npm run lint      # ESLint
npm run preview   # Preview production build
just ci           # npm ci + lint + build (CI pipeline)
```

No test suite exists. Playwright is installed but no tests are written yet.

## Architecture

### Layer Overview

```
main.ts → Game → SceneManager → Chapter (extends Scene)
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

### Animation Pattern

Tween.js is used for animated values (willpower bar, card reveals, cost floats). The Game runs a `requestAnimationFrame` loop that updates:
1. Global tween group (`updateTweens()`)
2. WillpowerBar's tween group

Scene transitions use CSS `opacity` with `transition` property. Each interaction component that uses tweens also runs its own `requestAnimationFrame` loop for its local tween group.

## Key Conventions

- **TypeScript strict mode** with ES2020 target
- **No sprites/textures** — all visuals drawn with HTML/CSS and Canvas 2D
- **No heavy frameworks** — vanilla DOM manipulation, `<canvas>` for procedural drawing
- **Sounds via Howler.js** — `src/assets/sounds.ts` is a stub ready for real audio files in `public/sounds/`
- **Design docs** in `docs/plans/` — the script and implementation plan describe intended behavior for all chapters
- **Deployed to Surge.sh** — staging at `activation-energy-game-stage.surge.sh`, production at `activation-energy-game.surge.sh`
