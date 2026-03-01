# Activation Energy Game — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Nicky-Case-style narrative game about willpower, activation energy, and death spirals — canvas-rendered with animated characters, 8 chapters, interactive simulations.

**Architecture:** PIXI.js canvas game inside a Vite+TypeScript project. A custom SceneManager drives chapter transitions. Each chapter is a class that owns its PIXI containers, text, and interactions. Pure-logic simulation classes (DaySimulator, FiberModel) are separated from rendering. Howler.js for minimal sound design.

**Tech Stack:** Vite, TypeScript (strict), PIXI.js v8, Howler.js, Tween.js (@tweenjs/tween.js), deployed to Surge.sh.

**Script:** `docs/plans/2026-03-01-activation-energy-script.md` — the source of truth for all narrative text and interaction design.

**Repo:** `/home/developer/gits/activation-energy-game/`

---

## Task 1: Project Scaffold

**Files:**
- Create: `activation-energy-game/package.json`
- Create: `activation-energy-game/tsconfig.json`
- Create: `activation-energy-game/tsconfig.node.json`
- Create: `activation-energy-game/vite.config.ts`
- Create: `activation-energy-game/index.html`
- Create: `activation-energy-game/justfile`
- Create: `activation-energy-game/.github/workflows/build.yml`
- Create: `activation-energy-game/.github/workflows/deploy-surge.yml`
- Create: `activation-energy-game/src/main.ts`
- Create: `activation-energy-game/src/style.css`

**Step 1: Create repo and initialize**

```bash
mkdir -p /home/developer/gits/activation-energy-game
cd /home/developer/gits/activation-energy-game
git init
```

**Step 2: Create package.json**

```json
{
  "name": "activation-energy-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "pixi.js": "^8.6.6",
    "@tweenjs/tween.js": "^25.0.0",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "@types/howler": "^2.2.12",
    "typescript": "~5.9.3",
    "vite": "^7.2.4",
    "@eslint/js": "^9.39.1",
    "eslint": "^9.39.1",
    "typescript-eslint": "^8.46.4",
    "globals": "^16.5.0"
  }
}
```

**Step 3: Create tsconfig.json, vite.config.ts, index.html**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve"
  },
  "include": ["src"]
}
```

`vite.config.ts`:
```typescript
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: 5180,
  },
});
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Activation Energy: The Game</title>
    <meta name="description" content="An interactive game about willpower, habits, and why you doom-scroll at 2am" />
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 4: Create justfile** (copy pattern from how-long-since-ai)

```makefile
default:
    @just --list

install:
    npm ci

lint:
    npm run lint

build:
    npm run build

ci: install lint build

dev:
    npm run dev

deploy-stage:
    npx surge dist activation-energy-game-stage.surge.sh

deploy-prod:
    npx surge dist activation-energy-game.surge.sh

serve:
    npx serve dist
```

**Step 5: Create src/main.ts with PIXI.js boot**

```typescript
import { Application } from "pixi.js";
import { Game } from "./Game";

async function init() {
  const app = new Application();
  await app.init({
    background: "#1a1a2e",
    resizeTo: window,
    antialias: true,
  });

  const container = document.getElementById("game")!;
  container.appendChild(app.canvas);

  const game = new Game(app);
  game.start();
}

init();
```

**Step 6: Create src/style.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; background: #1a1a2e; }
#game { width: 100vw; height: 100vh; }
canvas { display: block; }
```

**Step 7: npm install, verify dev server boots**

```bash
cd /home/developer/gits/activation-energy-game
npm install
npm run dev  # verify blank canvas loads at localhost:5180
```

**Step 8: Copy GitHub Actions** from how-long-since-ai (adapt domain names)

**Step 9: Initial commit**

```bash
git add -A
git commit -m "feat: scaffold activation energy game project"
```

---

## Task 2: Engine — SceneManager + TextBox + Button

**Files:**
- Create: `src/Game.ts`
- Create: `src/engine/SceneManager.ts`
- Create: `src/engine/Scene.ts`
- Create: `src/engine/TextBox.ts`
- Create: `src/engine/Button.ts`
- Create: `src/engine/WillpowerBar.ts`

**Depends on:** Task 1

This is the core engine that every chapter uses. The SceneManager handles transitions between chapters. TextBox renders narrative text with typewriter effect. Button handles click interactions.

**Step 1: Create Scene base class**

`src/engine/Scene.ts`:
```typescript
import { Container, Application } from "pixi.js";

export abstract class Scene {
  container: Container;
  app: Application;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
  }

  abstract enter(): Promise<void>;
  abstract exit(): Promise<void>;

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
```

**Step 2: Create SceneManager**

`src/engine/SceneManager.ts` — manages a stack of scenes, handles fade transitions between them:
- `goTo(scene: Scene)` — fade out current, fade in new
- `currentScene` — the active scene
- Fade transitions via alpha tweening over 500ms

**Step 3: Create TextBox**

`src/engine/TextBox.ts` — renders text with typewriter effect:
- Constructor takes `(text: string, style: TextStyle, options: { typewriter?: boolean, speed?: number })`
- `show()` — starts typewriter or shows immediately
- `onComplete` — callback when typewriter finishes
- Uses PIXI Text with word wrapping
- Markdown-lite: `**bold**` renders bold, `*italic*` renders italic

**Step 4: Create Button**

`src/engine/Button.ts` — clickable rectangle with text:
- Hover effect (slight scale up, color change)
- Click handler
- Disabled state
- Arrow/next button variant for chapter transitions

**Step 5: Create WillpowerBar**

`src/engine/WillpowerBar.ts` — the ever-present willpower meter:
- Horizontal bar with numeric value
- Smooth tweened transitions when value changes
- Color gradient: green (high) → yellow (mid) → red (low)
- Later: splits into 5 fiber colors (Ch4+)
- Method: `setFibers(fibers: FiberState[])` to switch to multi-fiber mode

**Step 6: Create Game.ts**

`src/Game.ts` — the top-level orchestrator:
- Creates SceneManager
- Creates persistent WillpowerBar (always visible)
- Loads chapter list
- `start()` — begins at Chapter 0

**Step 7: Test** — verify scene transition works with two dummy scenes

**Step 8: Commit**

```bash
git add src/Game.ts src/engine/
git commit -m "feat: add engine — SceneManager, TextBox, Button, WillpowerBar"
```

---

## Task 3: Simulation Layer (Pure Logic)

**Files:**
- Create: `src/sim/types.ts`
- Create: `src/sim/activities.ts`
- Create: `src/sim/DaySimulator.ts`
- Create: `src/sim/FiberModel.ts`
- Create: `src/sim/DeathSpiral.ts`

**Depends on:** Nothing (can run in parallel with Task 2)

All game logic, zero rendering. These are pure functions and classes that chapters call to compute state.

**Step 1: Define types**

`src/sim/types.ts`:
```typescript
export interface Activity {
  id: string;
  name: string;
  startingEnergy: number;      // negative = addictive, positive = effortful
  stoppingEnergy: number;      // base stopping cost
  stoppingCurve: "flat" | "natural-end" | "decaying";  // how stopping energy changes over time
  willpowerDelta: number;      // net effect on willpower (e.g., workout = +10, TikTok = -25)
  duration: number;            // in minutes
  fiberEffects: FiberEffects;  // which fibers it strengthens/weakens
  icon: string;                // emoji for now, sprite later
}

export interface FiberState {
  professional: number;  // 0-20 each
  physical: number;
  emotional: number;
  family: number;
  creative: number;
}

export interface FiberEffects {
  professional?: number;
  physical?: number;
  emotional?: number;
  family?: number;
  creative?: number;
}

export interface DaySlot {
  activity: Activity;
  startTime: number;   // minutes from midnight
  endTime: number;
}

export interface SimState {
  willpower: number;
  fibers: FiberState;
  time: number;        // minutes from midnight
  log: SimEvent[];
}

export interface SimEvent {
  time: number;
  type: "start" | "stop" | "transition";
  activity: string;
  willpowerCost: number;
  willpowerAfter: number;
  fibersAfter: FiberState;
}
```

**Step 2: Define activities**

`src/sim/activities.ts` — the activity catalog:
```typescript
export const ACTIVITIES: Activity[] = [
  {
    id: "tiktok",
    name: "TikTok",
    startingEnergy: -50,
    stoppingEnergy: 40,
    stoppingCurve: "flat",
    willpowerDelta: -25,
    duration: 60,
    fiberEffects: { physical: -2, emotional: -1, professional: -2 },
    icon: "📱",
  },
  {
    id: "work",
    name: "Going to Work",
    startingEnergy: -10,
    stoppingEnergy: 10,
    stoppingCurve: "natural-end",
    willpowerDelta: -15,
    duration: 480,
    fiberEffects: { professional: 3 },
    icon: "💼",
  },
  {
    id: "existing-habit",
    name: "Existing Habit",
    startingEnergy: 5,
    stoppingEnergy: 5,
    stoppingCurve: "decaying",
    willpowerDelta: 5,
    duration: 30,
    fiberEffects: { emotional: 1 },
    icon: "🔄",
  },
  {
    id: "meditation",
    name: "Meditating",
    startingEnergy: 20,
    stoppingEnergy: 5,
    stoppingCurve: "decaying",
    willpowerDelta: 10,
    duration: 20,
    fiberEffects: { emotional: 3, creative: 1 },
    icon: "🧘",
  },
  {
    id: "avoided-thing",
    name: "The Thing You've Been Avoiding",
    startingEnergy: 80,
    stoppingEnergy: 5,
    stoppingCurve: "decaying",
    willpowerDelta: 15,
    duration: 60,
    fiberEffects: { emotional: 5, professional: 2 },
    icon: "😰",
  },
  {
    id: "workout",
    name: "Morning Workout",
    startingEnergy: 15,
    stoppingEnergy: 10,
    stoppingCurve: "natural-end",
    willpowerDelta: 10,
    duration: 45,
    fiberEffects: { physical: 5, emotional: 2 },
    icon: "🏋️",
  },
  {
    id: "family-breakfast",
    name: "Breakfast with Family",
    startingEnergy: 5,
    stoppingEnergy: 5,
    stoppingCurve: "natural-end",
    willpowerDelta: 5,
    duration: 30,
    fiberEffects: { family: 4, emotional: 1 },
    icon: "🥞",
  },
  {
    id: "deep-work",
    name: "Deep Work",
    startingEnergy: 25,
    stoppingEnergy: 15,
    stoppingCurve: "decaying",
    willpowerDelta: -10,
    duration: 120,
    fiberEffects: { professional: 4, creative: 2 },
    icon: "🧠",
  },
  {
    id: "meetings",
    name: "Afternoon Meetings",
    startingEnergy: 5,
    stoppingEnergy: 5,
    stoppingCurve: "natural-end",
    willpowerDelta: -15,
    duration: 120,
    fiberEffects: { professional: 1, emotional: -1 },
    icon: "📅",
  },
  {
    id: "evening-gym",
    name: "Evening Gym",
    startingEnergy: 40,
    stoppingEnergy: 10,
    stoppingCurve: "natural-end",
    willpowerDelta: 10,
    duration: 60,
    fiberEffects: { physical: 5, emotional: 2 },
    icon: "🏃",
  },
  {
    id: "journaling",
    name: "Journaling",
    startingEnergy: 10,
    stoppingEnergy: 5,
    stoppingCurve: "decaying",
    willpowerDelta: 8,
    duration: 15,
    fiberEffects: { emotional: 3, creative: 2 },
    icon: "📝",
  },
];
```

**Step 3: DaySimulator**

`src/sim/DaySimulator.ts`:
- `simulate(schedule: DaySlot[], initialWillpower: number, fibers: FiberState): SimState`
- For each transition between activities: compute activation energy = stopping(current) + starting(next), subtract from willpower
- Apply willpower delta and fiber effects from each activity
- Return full event log for visualization
- `computeActivationEnergy(current: Activity, next: Activity, timeInCurrent: number): number`
- `getStoppingEnergy(activity: Activity, timeSpent: number): number` — applies the stopping curve

**Step 4: FiberModel**

`src/sim/FiberModel.ts`:
- `totalWillpower(fibers: FiberState): number` — sum of all fibers, with coordination bonus when all are healthy
- `applyEffects(fibers: FiberState, effects: FiberEffects): FiberState` — clamp each 0-20
- `weakenFiber(fibers: FiberState, fiber: keyof FiberState, amount: number): FiberState`
- `cascadeEffect(fibers: FiberState): FiberState` — when one fiber drops below 5, adjacent fibers lose 1-2 points (the death spiral mechanic)

**Step 5: DeathSpiral**

`src/sim/DeathSpiral.ts`:
- `simulateSpiral(initialFibers: FiberState, days: number): DayState[]`
- Each day: character does default activities, but with weakened fibers some become unaffordable, defaults to low-cost activities (TikTok)
- Returns array of daily states showing the cascade

**Step 6: Commit**

```bash
git add src/sim/
git commit -m "feat: add simulation layer — DaySimulator, FiberModel, DeathSpiral"
```

---

## Task 4: Character + Visual Assets

**Files:**
- Create: `src/characters/Character.ts`
- Create: `src/characters/expressions.ts`
- Create: `src/assets/sounds.ts`
- Create: `public/sounds/` (placeholder)

**Depends on:** Task 1

Simple, expressive characters (think Nicky Case's round-faced characters). Not sprites — drawn with PIXI Graphics for infinite scaling and easy state changes.

**Step 1: Character class**

`src/characters/Character.ts`:
- Drawn with PIXI Graphics — circle body, dot eyes, line mouth
- Expressions: `happy`, `neutral`, `tired`, `stressed`, `desperate`, `energized`
- Expression changes the mouth shape and eye position
- `setExpression(expr: Expression)` with tween between states
- `walkTo(x, y)` with simple bounce animation
- Body color tints based on willpower level

**Step 2: Expression definitions**

`src/characters/expressions.ts`:
- Map of expression name → draw parameters (mouth curve, eye width, brow position)
- Keep it minimal — 6 expressions is enough

**Step 3: Sound manager**

`src/assets/sounds.ts`:
- Load sound sprites: click, chime, descend, ascend, heartbeat
- Use Howler.js
- Generate placeholder sounds with Web Audio API for dev (sine waves, etc.)
- Replace with real sounds later

**Step 4: Commit**

```bash
git add src/characters/ src/assets/
git commit -m "feat: add character system with expressions and sound manager"
```

---

## Task 5: Chapter 0 — The Morning

**Files:**
- Create: `src/chapters/Ch0_Morning.ts`

**Depends on:** Tasks 2, 4

**Step 1: Implement Ch0**

The simplest chapter — sets the tone.

- Scene fades in: dark background, character in bed (lying down)
- TextBox: "It's 6am. You just woke up." (typewriter)
- Character sits up, willpower bar fills from 0 → 80 with ascending sound
- TextBox: "You've got a full tank. 80 units of willpower."
- Pause
- TextBox: "That sounds like a lot. It is."
- Pause
- TextBox: "By 10pm tonight, you'll have 10 units left and you'll be watching your 47th TikTok about a dog that can skateboard."
- Character expression: `neutral` → `tired` (brief flash forward, screen tints blue/night)
- TextBox: "How does 80 become 10?"
- TextBox: "Let's find out."
- Next button appears → SceneManager transitions to Ch1

**Step 2: Test** — verify chapter loads, text appears, transition works

**Step 3: Commit**

```bash
git add src/chapters/Ch0_Morning.ts
git commit -m "feat: add Chapter 0 — The Morning"
```

---

## Task 6: Chapter 1 — Starting Energy

**Files:**
- Create: `src/chapters/Ch1_Starting.ts`
- Create: `src/interactions/DragToNumberLine.ts`

**Depends on:** Tasks 2, 3, 4

**Step 1: Create DragToNumberLine interaction**

`src/interactions/DragToNumberLine.ts`:
- Renders a horizontal number line from -60 to +100
- Accepts draggable card objects
- Cards snap to positions when released
- After all cards placed, `onComplete(placements: Map<string, number>)` fires
- "Reveal" mode: cards animate to their correct positions

**Step 2: Implement Ch1**

- TextBox: "Every activity has a price tag..." (per script)
- 5 activity cards appear (TikTok, Work, Habit, Meditation, Avoided Thing)
- Player drags each onto number line
- TextBox: "Go ahead. Where do you think each one goes?"
- After all placed → reveal animation. Cards slide to correct positions
- TextBox: "TikTok is at negative fifty." etc.
- Visual: character pushing boulder up hill vs sliding down slope
- TextBox: "But here's what nobody tells you..."
- Next button → Ch2

**Step 3: Commit**

```bash
git add src/chapters/Ch1_Starting.ts src/interactions/DragToNumberLine.ts
git commit -m "feat: add Chapter 1 — Starting Energy with drag interaction"
```

---

## Task 7: Chapter 2 — Stopping Energy

**Files:**
- Create: `src/chapters/Ch2_Stopping.ts`
- Create: `src/interactions/TimelineScrubber.ts`

**Depends on:** Tasks 2, 3, 4

**Step 1: Create TimelineScrubber interaction**

`src/interactions/TimelineScrubber.ts`:
- Horizontal slider at bottom of two panels
- As player drags: both panels update their stopping energy curves in real-time
- Left panel: Movie (curve rises then drops to zero)
- Right panel: TikTok (curve stays flat)
- Smooth animated graph lines (PIXI Graphics, redrawn on scrub)

**Step 2: Implement Ch2**

- Per script: text about stopping energy
- Two-panel comparison with scrubber
- After player explores → text reveals: "TikTok never ends..."
- Visual: character watching movie (gets up) vs TikTok (glued, clock spins)
- The equation reveal: Activation Energy = Stopping + Starting
- The 10pm math: "To go from TikTok to meditating, you need 60. At 10pm, you have 10."
- TextBox: "It's not discipline. It's math."
- Next → Ch3

**Step 3: Commit**

```bash
git add src/chapters/Ch2_Stopping.ts src/interactions/TimelineScrubber.ts
git commit -m "feat: add Chapter 2 — Stopping Energy with timeline scrubber"
```

---

## Task 8: Chapter 3 — The Day Simulator

**Files:**
- Create: `src/chapters/Ch3_Day.ts`
- Create: `src/interactions/DayTimeline.ts`

**Depends on:** Tasks 2, 3, 4

**Step 1: Create DayTimeline interaction**

`src/interactions/DayTimeline.ts`:
- Horizontal timeline from 6am to 10pm
- Activity blocks can be dragged onto it
- Blocks snap to time slots
- "Play" button runs the simulation (calls DaySimulator)
- Willpower bar updates in real-time as simulation plays
- Character walks through the day, expression changes based on willpower level
- A/B mode: "Try again" resets, shows ghost of previous run for comparison

**Step 2: Implement Ch3**

- Per script: "What if the order matters?"
- 6 activity blocks available
- Player drags into timeline, hits play
- Simulation runs visually — character moves, willpower drains/recharges
- After first run: text reveals based on what player did
  - If morning workout first: "Morning habits don't just cost willpower — they generate it"
  - If TikTok at lunch: "That TikTok at lunch? You went in with 60 and came out with 35"
- Prompt to rearrange and re-run
- Two-timeline comparison visual
- TextBox: "But we've been lying to you a little..."
- Next → Ch4

**Step 3: Commit**

```bash
git add src/chapters/Ch3_Day.ts src/interactions/DayTimeline.ts
git commit -m "feat: add Chapter 3 — The Day Simulator"
```

---

## Task 9: Chapter 4 — The Fibers

**Files:**
- Create: `src/chapters/Ch4_Fibers.ts`
- Create: `src/interactions/FiberRope.ts`
- Create: `src/interactions/FiberSliders.ts`

**Depends on:** Tasks 2, 3, 4

**Step 1: Create FiberRope visual**

`src/interactions/FiberRope.ts`:
- 5 colored strands braided into a rope (PIXI Graphics)
- Clickable fiber characters holding up a log
- When clicked, character releases → log drops → remaining strain
- Smooth physics-like animation (tween the log position based on fiber count)
- Activities displayed above with green/red indicators based on affordability

**Step 2: Create FiberSliders**

`src/interactions/FiberSliders.ts`:
- 5 vertical sliders, one per fiber, colored
- Radar chart that updates in real-time as sliders move
- Activity list showing which are affordable at current willpower
- Preset buttons: "Gap Year" (professional→0), "Sick Week" (physical→0), "Breakup" (family→0)

**Step 3: Implement Ch4**

- Per script: single bar → splits into 5 fibers (animated reveal)
- Log-lifting interaction: click to release fibers
- Text explains the cross-role effect
- Slider exploration with presets
- Next → Ch5

**Step 4: Commit**

```bash
git add src/chapters/Ch4_Fibers.ts src/interactions/FiberRope.ts src/interactions/FiberSliders.ts
git commit -m "feat: add Chapter 4 — The Fibers with rope and slider interactions"
```

---

## Task 10: Chapter 5 — The Death Spiral

**Files:**
- Create: `src/chapters/Ch5_DeathSpiral.ts`
- Create: `src/interactions/SpiralAnimation.ts`

**Depends on:** Tasks 2, 3, 4

**Step 1: Create SpiralAnimation**

`src/interactions/SpiralAnimation.ts`:
- Plays a 5-day cascade animation (calls DeathSpiral sim)
- Day-by-day: character goes through activities, fibers weaken
- Visual: fiber rope frays progressively. Character expression degrades
- At Day 5: TikTok card glows — it's the only affordable thing
- "Rewind" button: player can jump to any day and make a different choice
- Alternate timeline shows the spiral breaking

**Step 2: Implement Ch5**

- Per script: "Let's watch a spiral happen."
- Play button → cascade animation with narration at each day
- Day 1-5 text overlays
- Rewind interaction: break the spiral by choosing workout on Day 2
- TextBox: "One good choice doesn't fix everything. But it stops the cascade."
- Next → Ch6

**Step 3: Commit**

```bash
git add src/chapters/Ch5_DeathSpiral.ts src/interactions/SpiralAnimation.ts
git commit -m "feat: add Chapter 5 — The Death Spiral"
```

---

## Task 11: Chapter 6 — The Levers

**Files:**
- Create: `src/chapters/Ch6_Levers.ts`
- Create: `src/interactions/LeverToggles.ts`

**Depends on:** Tasks 2, 3, 4

**Step 1: Create LeverToggles**

`src/interactions/LeverToggles.ts`:
- Three interactive experiments on one screen:
  1. Morning Habits toggle: ON/OFF → willpower curve for a full day redraws
  2. Schedule comparison: side-by-side characters, one with schedule, one without
  3. Peer gravity: central character + 5 peers with adjustable willpower → watch character drift

**Step 2: Implement Ch6**

- Per script: three levers, each with its own mini-interaction
- Morning Habits: toggle shows curve shift from 70→90 start
- Schedules: split-screen, left agonizes, right just goes
- Peers: magnetic gravity visualization
- Text for each lever per script
- Next → Ch7

**Step 3: Commit**

```bash
git add src/chapters/Ch6_Levers.ts src/interactions/LeverToggles.ts
git commit -m "feat: add Chapter 6 — The Levers"
```

---

## Task 12: Chapter 7 — Sandbox

**Files:**
- Create: `src/chapters/Ch7_Sandbox.ts`

**Depends on:** Tasks 2, 3, 4, and ideally all previous chapters working

**Step 1: Implement full sandbox**

Combines everything:
- Day timeline (from Ch3) with all activities available
- Fiber sliders (from Ch4)
- Three lever toggles (from Ch6)
- Real-time willpower curve + fiber breakdown
- Character animation showing the full day
- "Summary" panel: what's affordable, what's not, peak/trough willpower

**Step 2: Closing text**

- "You don't need more discipline."
- "You need better physics."
- Credits / link back to blog post

**Step 3: Commit**

```bash
git add src/chapters/Ch7_Sandbox.ts
git commit -m "feat: add Chapter 7 — Sandbox mode"
```

---

## Task 13: Polish + Deploy

**Files:**
- Modify: all chapters (tweaking timing, transitions)
- Create: `public/og-image.png`

**Depends on:** All previous tasks

**Step 1: Chapter transition polish**
- Smooth fade transitions between all chapters
- Progress indicator (dots or chapter numbers at top)
- Back button to revisit previous chapters

**Step 2: Mobile responsiveness**
- Canvas resizes to viewport
- Touch events for all drag interactions
- Text sizes adjust for small screens

**Step 3: Sound integration**
- Add sound effects to all interactions (click, chime, descend, ascend)
- Death spiral heartbeat
- Keep it minimal — sounds should enhance, not annoy

**Step 4: Deploy**

```bash
npm run build
just deploy-prod
```

**Step 5: Commit + push**

```bash
git add -A
git commit -m "feat: polish — transitions, mobile, sound, deploy"
git push
```

---

## Parallel Execution Map

```
Task 1 (Scaffold)
├── Task 2 (Engine) ──────┐
├── Task 3 (Simulations) ─┤── Task 5 (Ch0)
├── Task 4 (Characters) ──┘   Task 6 (Ch1)
                               Task 7 (Ch2)
                               Task 8 (Ch3)
                               Task 9 (Ch4)
                               Task 10 (Ch5)
                               Task 11 (Ch6)
                               Task 12 (Ch7)
                               Task 13 (Polish)
```

Tasks 2, 3, 4 can run in parallel after Task 1.
Chapters 5-12 depend on engine + sim + characters being done.
Chapters can be built in parallel once dependencies are met.
