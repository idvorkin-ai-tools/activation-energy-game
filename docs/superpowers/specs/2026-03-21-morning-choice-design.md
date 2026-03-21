# Morning Choice Game — Design Spec

## Concept

An interactive branching narrative about what happens when your alarm goes off. The player guides a raccoon through a Saturday morning, choosing between staying in bed (inertia spiral) and getting up (momentum builds). The core lesson: "The hard part was the first 30 seconds after the alarm."

Inspired by real morning kryptonite patterns: hitting snooze (not sleeping, not up), lying in bed awake, and drifting to the easy chair with phone. These are all the same phenomenon — choosing comfort over starting — expressed as escalating beats.

## Architecture

**Self-contained TypeScript module** at `src/lessons/morning-choice/main.ts`. Owns its own state machine, room rendering, and UI. Imports shared pieces (`drawRaccoon`, expressions) but does not use the Game/SceneManager/Scene framework.

### Why not the existing engine?

The Scene system is linear (A→B→C). Branching narrative needs a state machine with conditional transitions. Building a state machine from scratch is simpler than retrofitting branching into SceneManager, and avoids over-engineering the engine for one lesson (YAGNI).

## Visual Design

**Side-view room** — cross-section dollhouse layout. Canvas-rendered.

- **Bed** on the left side (stuck/comfort zone)
- **Door** on the far right (go/freedom)
- **Window** on the right wall — sky gradient changes with time (dark → dawn → daylight)
- **Alarm clock** on nightstand beside bed
- **Easy chair** appears in later stay-path beats (replaces bed as the comfort trap)
- **Raccoon** lies in bed initially, rotated 90 degrees. Stands upright when getting up.

Spatial metaphor: left = stuck, right = go. Reinforces the drag gesture direction.

The room is a persistent canvas that updates per beat (sky color, raccoon position, props appearing/disappearing) rather than full scene swaps. Transitions are animated — raccoon slides, sky fades, elements fade in/out.

## State Machine & Beats

Clock starts at 6:00 AM. Energy starts at 70/100. Energy range is 0-100 (capped at 100).

### Stay Path (inertia spiral)

Each beat the player stays, energy drops and the "get up" cost increases.

| Beat | Time | Energy | Scene | Choice |
|------|------|--------|-------|--------|
| 1. Alarm | 6:00 | 70 | Alarm rings. Raccoon in bed, eyes open. | "Get up" / "5 more minutes" |
| 2. Second Alarm | 6:15 | 55 | Alarm again. Raccoon groans. | "Get up" / "Just a bit more" |
| 3. Lying Awake | 6:45 | 40 | Awake, staring at ceiling. Can't sleep. | "Get up" / "Check phone" |
| 4. Phone Scroll | 7:30 | 25 | TikTok/Reddit hole. Time evaporates. | "Put it down" / "Keep scrolling" |
| 5. Easy Chair | 9:00 | 10 | Dragged self to chair with coffee, still scrolling. Morning gone. | End state — no choice, just the consequence. Raccoon slumped, desperate expression. |

Choosing "Get up" at any beat (1-4) exits to the Go Path via the drag interaction.

### The Drag Interaction (pivot moment, state id: `"drag"`)

When the player chooses "Get up," they physically drag the raccoon out of bed (or off the chair at beat 4). This is the signature interaction. It is a transient state between the stay and go paths — not a numbered beat.

**Spring-back mechanic:** The raccoon follows the cursor/finger but is pulled back toward the bed by a spring force proportional to inertia. Release too early and it snaps back. Drag past a threshold and it "clicks" — feet hit the floor, transition fires.

**Resistance scales with beat:**
- Beat 1 (energy 70): Light resistance — smooth, short drag
- Beat 2 (energy 55): Medium resistance — slight pull-back
- Beat 3 (energy 40): Heavy resistance — strong pull-back, longer distance needed
- Beat 4 (energy 25): Maximum resistance — really have to commit

After successful drag, the raccoon stands upright and the game transitions to the Go Path.

### Go Path (momentum builds)

Once up, no more choices — momentum carries the raccoon forward. Each beat is auto-paced (short delay + animation), showing energy ticking up.

Beat 6 time = the time of the stay-path beat where the player chose "Get up." Subsequent times are cumulative offsets from that.

| Beat | Time | Energy | Scene |
|------|------|--------|-------|
| 6. Out of Bed | (exit time) | +5 | Raccoon stands. Feet on floor. Expression: tired but upright. |
| 7. Shoes On | +15 min | +10 | Raccoon walks toward door. Window brightens. Expression: neutral. |
| 8. At the Gym | +45 min | +20 | Scene shifts to outside/gym. Raccoon moving. Expression: energized. |
| 9. Coffee Shop | +30 min | +15 | Peak morning. Expression: happy. "The morning is yours." |

The energy gained in the Go Path is +50 total regardless of when you got up — the lesson is that starting was the hard part, not which routine you pick. Final energy depends on when you exited the stay path: got up at Beat 1 → 70+50 = 100 (capped). Beat 2 → 55+50 = 100 (capped). Beat 3 → 40+50 = 90. Beat 4 → 25+50 = 75.

### Lesson Beat (convergence)

Beat 10. **Reflection** — Both paths converge on this final screen.

Side-by-side comparison: the same raccoon, same Saturday, same 70 energy at 6:00 AM. Left shows the stay-path outcome (slumped, 10 energy, 9 AM in the chair). Right shows the go-path outcome (energized, 75-100 energy depending on when they got up, productive morning).

Text: "Same raccoon. Same Saturday. Same 70 energy at 6:00 AM. The difference wasn't motivation — it was inertia. The hard part was the first 30 seconds after the alarm."

Optional: "Want to try again?" button that restarts.

## UI Elements

### Energy Bar
Horizontal bar at the top of the screen. Color-coded: green (>60) → yellow (30-60) → orange (15-30) → red (<15). Animates smoothly on change. Shows numeric value.

### Clock
Digital clock display near the alarm clock in the scene. Updates per beat. Color shifts: white (early) → yellow (8:00+) → red (9:00+).

### Inertia Meter
A downward-pointing gravity arrow near the raccoon, growing larger and redder each stay beat. Visually communicates the increasing cost of getting up.

### Choice Buttons
Two buttons below the scene. Styled consistently with the rest of the site (dark theme). Left button is always the "stay" option, right button is always the "go" option — reinforcing the spatial metaphor.

The "stay" button text escalates: "5 more minutes" → "Just a bit more" → "Check phone" → "Keep scrolling"
The "go" button always says some form of "Get up" but with increasing effort implied: "Get up" → "Force yourself up" → "Come on, get up" → "You can do this"

### Narrative Text
TextBox-style element above or below the scene. Brief narration per beat — one or two sentences setting the moment. Typewriter effect on entry.

## Raccoon Rendering

Uses the shared `drawRaccoon()` function from `src/characters/drawRaccoon.ts`.

**Lying down:** Canvas is rotated 90 degrees. Raccoon drawn normally but the canvas itself is rotated, making the raccoon appear horizontal in bed.

**Standing:** Canvas upright, normal rendering.

**Expressions per beat:**
- Beat 1: tired (just woke up)
- Beat 2: tired (groaning)
- Beat 3: stressed (can't sleep, restless)
- Beat 4: desperate (doom scrolling)
- Beat 5: desperate (morning gone, slumped)
- Beat 6 (got up): tired (but upright)
- Beat 7: neutral (moving)
- Beat 8: energized (at gym)
- Beat 9: happy (coffee shop, morning is yours)

## Responsive Design

The room scene canvas scales to fit the viewport width (max ~600px). Choice buttons and text are below the canvas. On mobile, the drag interaction works with touch (touchstart/touchmove/touchend).

## Page Setup

Following project conventions:

1. **HTML entry:** `lessons/morning-choice/index.html` with standard header (breadcrumb + About link) and About modal
2. **TypeScript entry:** `src/lessons/morning-choice/main.ts`
3. **Vite config:** Added to `vite.config.ts` rollupOptions.input
4. **Hub card:** Added to `index.html` in the Lessons section
5. **No navigation arrows** — CLAUDE.md requires forward/back navigation for "slide/chapter-based lessons," but this is a choice-based branching narrative, not a linear slide deck. Forward/back doesn't apply to branching stories. The "try again" button at the end serves as replay.

## Technical Implementation Notes

### State Machine
```typescript
interface Beat {
  id: string;
  time: string;        // display time
  energy: number;      // energy at this beat
  narration: string;   // text shown
  expression: string;  // raccoon expression
  choices?: {          // undefined = auto-advance (go path beats)
    stay: { label: string; next: string };
    go: { label: string };  // always goes to drag interaction
  };
  scene: SceneUpdate;  // what changes in the room
}

interface SceneUpdate {
  raccoonPos: { x: number; y: number; rotation: number };  // rotation: 0 = standing, 90 = lying
  skyPhase: number;       // 0 = dark/night, 0.5 = dawn, 1 = daylight
  showEasyChair: boolean; // only true for beat 5
  showPhone: boolean;     // true for beats 3-5
  showAlarmRing: boolean; // true for beats 1-2
}
```

### Room Renderer
Single canvas, redrawn per beat. Elements:
- Background wall + floor (static)
- Window with sky gradient (parameterized by time-of-day)
- Bed (always present, raccoon may not be in it)
- Nightstand + alarm clock
- Easy chair (appears beat 5 only)
- Raccoon (position + rotation animated)
- Door (right side, static)

### Drag Physics
- Raccoon position tracks cursor/finger with offset
- Spring force: `F = -k * displacement` where k increases per beat
- On release: if past threshold → snap to "standing" position, fire transition. If not → spring back to bed.
- Damping on spring-back for smooth feel.
- Threshold line could be visualized subtly (faint line on the floor).

### Animation
Use Tween.js (already in the project) for:
- Energy bar changes
- Clock updates
- Sky gradient transitions
- Raccoon position/rotation
- Element fade in/out

Each beat transition: ~800ms for scene updates, then text appears (typewriter), then choices appear.

## Out of Scope

- Sound effects (Howler.js is stubbed but no audio files exist yet)
- Multiple difficulty levels
- Saving progress/state
- The "Refresher Supreme" level (meditation) — keep it simple with gym + coffee shop
- Keyboard navigation (this is choice-based + drag, not slide-based)
