# Explorable Explanations

A collection of interactive explorable explanations — Nicky Case-style — about psychology, habits, and how the mind works.

**[Play it live](https://activation-energy-game.surge.sh)**

## Site Structure

```
/                              → Hub page (links to everything)
/lessons/energy/               → Activation Energy lesson
/playground/raccoon-styles/    → Raccoon character style playground
```

Multi-page app — each page is an independent HTML entry point built with Vite.

## Lessons

### Activation Energy

Based on the blog post: [idvork.in/activation](https://idvork.in/activation)

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

## Playgrounds

### Raccoon Character Styles

Compare three procedural Canvas 2D raccoon character designs with all 6 expressions and walk animations. Style B (Cute/Chibi) was chosen for the game character.

## Tech Stack

- **HTML/CSS/Canvas 2D** — All graphics procedurally drawn, no sprites
- **[Tween.js](https://github.com/tweenjs/tween.js)** — Animation
- **[Howler.js](https://howlerjs.com/)** — Audio (placeholder)
- **TypeScript** + **Vite** — Build toolchain (multi-page mode)
- **[Surge.sh](https://surge.sh/)** — Hosting

## Project Structure

```
index.html                     # Hub landing page
lessons/energy/index.html      # Activation Energy game entry
playground/raccoon-styles/     # Raccoon style comparison playground

src/
  lessons/energy/main.ts       # Boot: creates Game, starts chapters
  Game.ts                      # Orchestrator: chains chapters, drives ticker
  style.css

  engine/                      # Reusable UI primitives
    Scene.ts                   # Abstract base class for chapters
    SceneManager.ts            # Fade transitions between scenes
    TextBox.ts                 # Typewriter text display
    Button.ts                  # Clickable button
    WillpowerBar.ts            # Animated horizontal bar
    SkipButton.ts              # "Skip" affordance

  characters/                  # Procedurally drawn characters
    Character.ts               # Canvas 2D character with expressive face
    expressions.ts             # 6 expressions: happy, neutral, tired, stressed, desperate, energized

  sim/                         # Pure logic (no rendering)
    types.ts                   # Shared interfaces
    activities.ts              # 11 activities with starting/stopping energy costs
    DaySimulator.ts            # Simulates a day of willpower drain
    FiberModel.ts              # 5-fiber willpower model with cascade effects
    DeathSpiral.ts             # Multi-day spiral simulation

  interactions/                # Interactive components (one per chapter)
    DragToNumberLine.ts        # Ch1: drag cards to a number line
    TimelineScrubber.ts        # Ch2: scrub to compare stopping curves
    DayTimeline.ts             # Ch3: drag-and-drop day planner
    FiberRope.ts               # Ch4: click to release fiber holders
    SpiralAnimation.ts         # Ch5: animated 5-day cascade
    LeverToggles.ts            # Ch6: three lever experiments

  chapters/                    # One file per narrative chapter
    Ch0_Morning.ts ... Ch7_Sandbox.ts
```

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5180)
npm run build      # TypeScript check + production build to dist/
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
- [`docs/walk-the-store/walkthrough.md`](docs/walk-the-store/walkthrough.md) — Visual walkthrough with screenshots

## Credits

Inspired by [Nicky Case](https://ncase.me/)'s explorable explanations, especially [The Evolution of Trust](https://ncase.me/trust/).
