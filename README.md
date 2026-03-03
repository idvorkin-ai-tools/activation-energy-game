# Activation Energy: An Interactive Explainer

An interactive, narrative-driven explainer about **willpower, habits, and activation energy** — built in the style of [Nicky Case's explorable explanations](https://ncase.me/).

**[Play it live](https://activation-energy-game.surge.sh)**

Based on the blog post: [idvork.in/activation](https://idvork.in/activation)

## What is this?

You wake up with 80 units of willpower. By 10pm, you'll have 10. This game shows you why — through 8 interactive chapters that let you drag, scrub, toggle, and experiment with the physics of getting things done.

**Chapters:**

0. **Morning** — You wake up. The willpower bar fills.
1. **Starting Energy** — Drag activities onto a number line to discover their activation cost.
2. **Stopping Energy** — Scrub a timeline to see why TikTok is harder to stop than a movie.
3. **A Day** — Plan a day by dragging activities onto a timeline. Watch willpower drain.
4. **Fibers** — Your willpower isn't one bar — it's five ropes. Release them to see what breaks.
5. **Death Spiral** — Watch one bad day cascade into five. Then rewind and intervene.
6. **Levers** — Toggle morning habits, schedules, and peer gravity to reshape your day.
7. **Sandbox** — Combine everything. Build your own day.

## Tech Stack

- **[PixiJS v8](https://pixijs.com/)** — Canvas 2D rendering
- **[Tween.js](https://github.com/tweenjs/tween.js)** — Animation
- **[Howler.js](https://howlerjs.com/)** — Audio (placeholder)
- **TypeScript** + **Vite** — Build toolchain
- **[Surge.sh](https://surge.sh/)** — Hosting

## Project Structure

```
src/
  main.ts              # Boot: creates PIXI app, starts Game
  Game.ts              # Orchestrator: chains chapters, drives ticker
  style.css

  engine/              # Reusable UI primitives
    Scene.ts           # Abstract base class for chapters
    SceneManager.ts    # Fade transitions between scenes
    TextBox.ts         # Typewriter text display
    Button.ts          # Clickable button with hover/press animations
    WillpowerBar.ts    # Animated horizontal bar (green/yellow/red)
    SkipButton.ts      # "Skip" affordance for interactive chapters

  characters/          # Nicky Case-style drawn characters
    Character.ts       # Pill-body figure with expressive face
    expressions.ts     # 6 expressions: happy, neutral, tired, stressed, desperate, energized

  sim/                 # Pure logic (no rendering)
    types.ts           # Shared interfaces
    activities.ts      # 11 activities with starting/stopping energy costs
    DaySimulator.ts    # Simulates a day of willpower drain
    FiberModel.ts      # 5-fiber willpower model with cascade effects
    DeathSpiral.ts     # Multi-day spiral simulation

  interactions/        # Interactive components (one per chapter)
    DragToNumberLine.ts    # Ch1: drag cards to a number line
    TimelineScrubber.ts    # Ch2: scrub to compare stopping curves
    DayTimeline.ts         # Ch3: drag-and-drop day planner
    FiberRope.ts           # Ch4: click to release fiber holders
    SpiralAnimation.ts     # Ch5: animated 5-day cascade
    LeverToggles.ts        # Ch6: three lever experiments

  chapters/            # One file per narrative chapter
    Ch0_Morning.ts ... Ch7_Sandbox.ts
```

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5173)
npm run build      # production build to dist/
npm run lint       # eslint
```

Or with [just](https://github.com/casey/just):

```bash
just dev           # dev server
just ci            # install + lint + build
just deploy-prod   # build + deploy to surge.sh
```

## Design Docs

- [`docs/plans/2026-03-01-activation-energy-script.md`](docs/plans/2026-03-01-activation-energy-script.md) — Full 8-chapter narrative script
- [`docs/plans/2026-03-01-activation-energy-plan.md`](docs/plans/2026-03-01-activation-energy-plan.md) — Implementation plan

## Credits

Inspired by [Nicky Case](https://ncase.me/)'s explorable explanations, especially [The Evolution of Trust](https://ncase.me/trust/).
