# The Raccoon's Glow — Design Doc

## Premise

A wordless interactive story about energy, not time. The raccoon has a warm inner glow — no numbers, no bars, no UI. Just light. The player guides the raccoon through a day by choosing what to do next. The glow brightens or dims based on energy choices. Previous playthroughs leave ghost paths, haunting the screen with where you dimmed before.

## Core Insight

You don't run out of time. You run out of energy. The same hour can cost nothing or everything depending on what you do, when you do it, and what came before.

## The Rules (invisible to the player)

The player never sees numbers. But under the hood:

- Raccoon starts with **energy: 80** at dawn
- Each choice has an energy cost (or gain) that varies by:
  - **Time of day** — morning choices cost less
  - **Sequence** — three drains in a row compound; a generator after a drain costs less
  - **Momentum** — doing something similar to what you just did is cheaper (flow)
- The glow maps directly to energy: 80+ = radiant, 50 = warm, 20 = flickering, 0 = dark
- The world's color saturation tracks the glow
- The raccoon's movement speed tracks the glow

## Scene Flow

The day runs from **dawn to night** in 5 moments. Each moment, the player chooses from 2-3 options. The raccoon walks to the chosen activity, does it (short animation), and the glow shifts. After 5 moments, the day ends.

---

### Moment 1: Dawn

The raccoon wakes up in a cozy den. Warm orange light fills the screen. The glow is full and bright.

**Choices:**
- **Stretch outside** — The raccoon steps out, stretches in morning light. Glow holds steady. The world opens up, birds, soft color. (Energy: -2, sets "body" momentum)
- **Check the pile** — A pile of acorns (obligations/messages) sits by the den entrance. The raccoon starts sorting anxiously. Glow dims slightly. The pile never gets smaller. (Energy: -15, no momentum set)
- **Stare at the river** — The raccoon sits by the river, watching water. A slow, still moment. Glow brightens slightly. (Energy: +5, sets "calm" momentum)

---

### Moment 2: Morning

The world is bright. The raccoon is at whatever location they chose.

**Choices:**
- **Climb the big tree** — Hard work. The raccoon climbs, struggles, reaches the top. If they have calm or body momentum, the climb costs less and the view from the top brightens the glow. If they started with the pile, the climb is exhausting. (Energy: -20 base, -10 with momentum)
- **Forage with a friend** — Another raccoon appears. They forage together, chattering. Social energy. The glow warms. (Energy: -5, +8 social boost)
- **Back to the pile** — If they didn't do the pile in Moment 1, it's still there. Guilt. If they DID do it, this option doesn't appear. (Energy: -15)

---

### Moment 3: Midday

The sun is high. Energy is at whatever the choices have brought.

**Choices:**
- **Nap in the shade** — The raccoon curls up. The screen goes soft. Glow recovers. (Energy: +15)
- **Explore the far bank** — Adventure. The raccoon swims across the river, discovers something (a shell, a feather, a strange rock). If glow is above 50, this is joyful. If below 30, the raccoon barely makes it across. (Energy: -15 if bright, -25 if dim)
- **Help a neighbor** — A hedgehog is stuck. The raccoon helps. Warm social moment. But it takes what you have. (Energy: -10, but glow gets a "warm pulse" — visual boost even if energy is low)

---

### Moment 4: Afternoon

The light is getting golden. This is where the day turns.

**Choices:**
- **Do the hard thing** — Whatever the raccoon has been avoiding (context-dependent: the pile if never done, or a confrontation with a crow). If glow is strong, this is triumphant. If glow is dim, this breaks the raccoon. (Energy: -25 if dim, -10 if bright)
- **Easy comfort** — The raccoon finds berries and eats them by the river. Pleasant but empty. Glow stays flat. (Energy: -5, no change in trajectory)
- **Create something** — The raccoon arranges stones, sticks, or shells into a small sculpture. If there's momentum from morning's climb or exploration, this flows. If not, it feels forced. (Energy: -5 with momentum, -18 without)

---

### Moment 5: Dusk

The sky goes purple-orange. The day is ending. One last choice.

**Choices:**
- **Return to the den** — The raccoon walks home. If the glow is bright, the walk is peaceful, fireflies appear, the den feels warm. If dim, the walk is long, the den feels empty.
- **Stay out under the stars** — The raccoon lies on a hill. If bright, the stars are vivid and the raccoon glows against the night sky. If dim, the raccoon shivers and the stars blur.
- **Find the friend** — The raccoon seeks out the friend from Moment 2 (if chosen) or a new encounter. Warm ending regardless of glow — social connection recovers a flicker even in the dark.

---

### The Ending

No score. No summary. Just a final image:

- **Bright glow:** The raccoon radiates warmth. The world is colorful. The raccoon sleeps peacefully. A single sentence fades in: *"Same hours. Different day."*
- **Medium glow:** The raccoon is okay. Warm but tired. *"Same hours. Different day."*
- **Dim glow:** The raccoon flickers in the dark. The world is grey. *"Same hours. Different day."*

The same words. The feeling is completely different.

---

## Ghost Paths (Replay Mechanic)

After the first playthrough, a "Play again" prompt appears. On the second playthrough:

- **Ghost raccoon** — A translucent outline follows the path of your previous playthrough. Where you went, what you chose. You can see where you dimmed.
- **Multiple ghosts** — Each playthrough adds another ghost. By playthrough 3-4, the screen shows a constellation of your past selves. Some bright, some dim.
- **The insight emerges:** Same 5 moments, same 24 hours, completely different lives. The ghosts make this visceral — you can SEE the divergence.

Ghost paths are subtle — 15% opacity, slightly different color per run. They don't block or distract. They haunt.

---

## Visual Design

### The Raccoon
- Style B (Cute/Chibi) from the playground
- Inner glow: radial gradient emanating from the raccoon's center
- Glow color shifts: bright warm gold (full) -> amber (medium) -> dim blue-grey (low) -> barely visible (empty)
- Movement: bouncy and quick when bright, slow and heavy when dim
- Expression maps to energy (reuse expressionForWillpower system)

### The World
- Hand-drawn feel, minimal detail, lots of negative space
- Color saturation tied to raccoon's glow (CSS filter or canvas tinting)
- Locations: den, river, big tree, far bank, hill — simple iconic scenes
- Time of day = background gradient shifts (dawn gold -> midday white -> afternoon amber -> dusk purple)

### Transitions
- The raccoon walks between locations (reuse walkTo animation)
- Scene fades with CSS opacity (reuse SceneManager)
- Choices appear as glowing spots in the world the raccoon can walk toward — not buttons, not text. The player clicks a spot, the raccoon walks there.

### Ghost Paths
- Previous raccoon paths drawn as faint dotted trails
- Ghost raccoon: same chibi shape, 15% opacity, tinted by their ending glow color
- Ghosts replay their choices in real-time alongside the current run

---

## What This Doesn't Have

- No numbers visible to the player. Ever.
- No score screen.
- No "you got it wrong" messaging.
- No text except the final sentence and choice labels (which could even be icons instead of words).
- No tutorial. The glow teaches everything.

## Technical Notes

- Reuse: SceneManager, Scene, Character (Style B raccoon), tween.js, CSS transitions
- New: glow rendering (radial gradient on canvas), world color saturation system, ghost path recording/replay, choice-point interaction (click locations not buttons)
- Estimated: 5 scenes (moments) + intro + ending = 7 scenes total
- Energy model is a simple state machine — no DaySimulator needed, just a running total with modifiers
