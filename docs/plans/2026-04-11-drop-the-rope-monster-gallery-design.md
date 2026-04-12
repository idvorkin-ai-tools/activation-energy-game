# Drop the Rope — The Monster Gallery

**Design doc — 2026-04-11**
**Status:** design only, not a plan. One implementer, one pass.
**Revision 2 — 2026-04-11 (post Q1 visual brainstorm):** Q1 resolved via Gemini preview renders. Decisions locked:
- **World palette** → A2 warm dawn earth (amber sky, warm brown ground), not the original muted grey plain. The cold accent monsters stand out harder against warm than against grey, and the "valued world is already good, the feeling is in the way" reading fits ACT more accurately than "world is bleak, valued scenes are reprieves."
- **Doubt accent color** → muted teal `#5EA5B5`, not cool grey `#64748B`. Grey vanishes against amber; teal stays cool/uncertain but pops.
- **Doubt body language** → two heads facing *opposite directions*, both speaking, pulling the same rope. Replaces the original "lag-shadow of the first head" idea. Stronger pictorial doubt — two contradictory wills in one body.
- **Valued-scene dog** → painted warm cartoon dog, not a warm-colored silhouette. The spec's "care and threat wear similar shapes" reveal moves from in-scene (dog matches monsters) to implicit (monster-scenes use silhouette grammar, valued-scenes use painted grammar — the contrast is the lesson).

Visual references from the brainstorm session are in `.superpowers/brainstorm/229782-1775934718/content/` (see `monster-a2-warm.png`, `lineup-1-anxiety.png` through `lineup-5-anger.png`, and `valued-1-coffee.png` through `valued-5-dog.png`).

**Revision 3 — 2026-04-11 (Q2-Q11 walkthrough):** Remaining open questions resolved in a text-based brainstorm pass. Summary:
- **Q2 taunts** → graduated duration (R1: 3s, R2-R4: 1.5s, R5: interrupted). Taunt duration shrinks alongside drop-timer — second embodied learning curve stacked on the first.
- **Q3 round-1 drop timer** → **resolved 2026-04-12 to 12s** via playtest-agent run. Original plan shipped 18s as placeholder; the critic ruled *surrender*, not relief — by t=6–8s the raccoon was locked in the `desperate` expression and the frame didn't meaningfully change for another 10 seconds. Emotional arc crystallizes around t=10–12s; shortened to 12s so the button lands as the "stuck" feeling peaks.
- **Q4 round-5 drop timer** → 0.5s button timing PLUS compressed monster walk-in (0.5s instead of the usual 1.5s). Entire round 5 feels like one gesture.
- **Q5 captions** → kept as spec (coffee / a swing / a friend / a page / her); timing shifted to 2s after arrival so the word confirms the feeling rather than announcing it.
- **Q6 URL** → `drop-the-rope` (player verb).
- **Q7 sound** → visual-first; audio pass deferred but *the roar continuing during the walk-past* flagged as the critical beat of the audio pass.
- **Q8 cross-lesson link** → no inline link; hub and About modal only.
- **Q9 unwinnable + tension-spike flash** → Round 1 only, at ~4s of frantic tapping: rope briefly hits visual max-tension (brightens + 1 cycle vibrate), then SNAPS BACK. Snap-back is the key — embodied evidence that effort isn't the lever.
- **Q10 a11y** → expanded to a full checklist: aria-live announcements for monster arrival, taunt text, button availability, valued-scene arrival; `prefers-reduced-motion` skips animations; keyboard: space = pull, enter = drop.
- **Q11 mismatched Crocs** → prerequisite PR. Update `drawRaccoon` first (left blue `#3B82F6`, right yellow `#FDE047`), THEN build the lesson. Keeps this PR focused.

---

## 1. Concept and framing

The player is the raccoon. A monster walks on-screen, grabs one end of a rope, and starts pulling. The player pulls back — tap, tap, tap — trying to win the tug-of-war. The screen greys out. An exhaustion meter rises. Eventually, a faint button materializes at the bottom of the screen: **Drop the rope.** The player drops it. The raccoon's paws uncurl, the rope flops to the dirt, and the raccoon turns and walks past the monster — **which is still there, still roaring, still pulling on a slack line** — into a small bright scene of something that mattered all along. Then the next monster shows up. Then the next. By the fifth, the drop button is there the moment the fight starts.

**What it teaches.** Two linked ACT concepts from the book:

- **Defusion** as a transferable move (`act.md:201`). Harris's signature claim: defusion is a skill, not a trick per monster. Once you can drop the rope on Anxiety, you can drop it on Shame. It's the same hand-motion.
- **Acceptance** (`act.md:213`) — specifically the acceptance insight encoded in the tug-of-war metaphor itself (`act.md:348`): "pulling harder on the rope doesn't help. Drop the rope. The monster is still there, but I'm free." The monster doesn't disappear. That's the whole lesson. The raccoon walks past it, not through it. The roaring continues off-screen.

**Why the shortening rounds are the learning, not a pacing trick.** This is the part most lessons get wrong. If every round were the same length, the player would learn "drop the rope on Anxiety." They would not learn the transfer. The shortening timer is the mechanical embodiment of a therapeutic fact: **the second time you defuse, it's faster than the first, because you already know what the move feels like in your hands.** By round 5, the drop button is visible at t=0 and the player clicks it immediately. The game is over not because the player ran out of monsters but because the move has become reflexive. The learning curve and the difficulty curve are the same curve, inverted. **The shortening is the pedagogy.**

One-paragraph pitch: *A wordless five-round defusion exercise where the raccoon faces a parade of feelings on the other end of a rope, and learns — in the player's own hands, across minutes — that letting go is the same move every time.*

---

## 2. The roster of monsters

Art language (unifying): all monsters are **single-color silhouettes against a warm dawn earth** (amber sky, warm brown ground — palette continuous with `morning-choice`), drawn in Canvas 2D with simple shapes — a body blob, a mouth, two eyes, one feature that says which emotion. No shading beyond a single inner highlight. Each monster breathes (subtle 2Hz scale pulse on y-axis) and has a "pull" animation (leans backward when the rope is being yanked). When roaring, the mouth opens and a small puff of dark breath erupts. Think shadow-theater, not Pixar.

Palette: each monster gets one saturated cool accent against a near-black body, standing out against a warm dawn world. Bodies are near-black `#1a1a22`. Accents are the emotion color. The cold-on-warm contrast is deliberate: the monster reads as the only cold thing in an otherwise hopeful world — "this feeling does not belong in your morning." Ground colors: `#3a2a1a` foreground → `#2a1a0a` distance. Sky: amber `#f0c060` at the horizon → dusty rose-purple `#5a3a4a` at the top, warm golden `#ffc864` glow near the horizon.

| # | Name | Taunt (one line) | Visual | Round |
|---|---|---|---|---|
| 1 | **Anxiety** | *"What if it all falls apart today?"* | Tall, thin, hunched. Body like a wisp of smoke tapered at the top. Long spindly arms. Eyes are two jittering white dots (redraw with 1px random offset each frame). Accent `#93C5FD` (cold blue, same as the raccoon's sweat drop — deliberate callback). | **Round 1** |
| 2 | **Self-Criticism** | *"You're still not good enough. You know it."* | Short, squat, wide-mouthed. Jaw hangs open with a row of tiny rectangular teeth. One giant eye in the center (cyclops). Accent `#E8A0A0` (same pink as the raccoon's happy blush — self-criticism wears the face of concern). | Round 2 |
| 3 | **Shame** | *"Don't let them see what you really are."* | Curled in on itself — a circle with arms wrapped around the body. Looks the other way; face hidden most of the time. When it roars, the face whips toward camera and reveals eyes cast down. Accent `#8B5CF6` (violet). | Round 3 |
| 4 | **Doubt** | *"Are you sure? Really sure?"* | Two heads on one neck, **facing opposite directions**, both mouths open speaking simultaneously (one head says yes, the other no). Both sets of arms grip the same rope, pulling against each other's will within a single body. Accent `#5EA5B5` (muted teal — cool and uncertain without vanishing against the warm dawn). | Round 4 |
| 5 | **Anger** | *"They don't get to do this to you."* | Broad-shouldered, hunched forward, fists the size of its head. Mouth is a downward rectangle. Two small horns — the only hard edges on any monster in the roster. Accent `#EF4444` (red). | Round 5 |

**Round 1 = Anxiety, deliberately.** Harris's framing throughout the book (`act.md:180`) puts anxiety first because it's the feeling everyone in his target audience has already lost to, repeatedly, before they walked in the door. Starting with Anxiety means the player arrives primed — they already know what the struggle feels like — and the first drop lands with the weight of recognition, not novelty. The other monsters are then demonstrations that *this same move* works on things that feel categorically different.

**Taunts: shown, not spoken, with graduated duration.** A soft-drawn speech bubble fades up over the monster at round start, holds, then fades. No voiceover. The taunt is the monster's thesis, delivered once, and then the monster just roars the rest of the round. **Duration per round shrinks alongside the drop-timer** — this is a second embodied learning curve stacked on the first:

| Round | Taunt duration | Why |
|---|---|---|
| 1 (Anxiety) | **3.0s** — hold 2s, fade 1s | Player is learning the convention. The word needs to land. |
| 2 (Self-Criticism) | **1.5s** — hold 0.8s, fade 0.7s | The pattern is known. Half the time. |
| 3 (Shame) | **1.5s** | Same as R2. |
| 4 (Doubt) | **1.5s** | Same. |
| 5 (Anger) | **~0.3s truncated** — the taunt begins fading in, but the player drops the rope before it completes. The bubble never fully appears. | The punchline. Like the drop timer, the taunt is interrupted by the player's reflex. |

The taunt-duration curve is not the same as the drop-timer curve (which shrinks more aggressively — 18s → 10s → 6s → 3s → 0.5s) because the taunt is the monster *introducing itself*, not the struggle. You want rounds 2-4 to still show the taunt clearly so the player reads each monster as a distinct feeling. Round 5 is where both curves collapse together for the joke.

**Family resemblance.** All five share the same silhouette-on-warm-dawn style, same eye rendering language, same breath puff when roaring. The body shape and one defining feature (cyclops eye, wrapped arms, two heads, horns-and-fists, smoke-wisp tapered top) is the only thing that moves between them, alongside the accent color. This is deliberate: they should feel like siblings in a catalog. That's what makes the gallery ending work.

---

## 3. The core loop

One round, start to finish:

1. **Arrival (0–1.5s).** The previous valued scene fades out. The ground is a featureless warm earth plain under an amber dawn sky (palette in §2). The raccoon is already center-left, holding the near end of a rope (drawn as a line running off the right edge of the screen). A monster walks in from stage right, grabs the rope, and plants itself. Taunt speech bubble fades in over it.
2. **Struggle (1.5s → drop-button-appears).** The rope goes taut. The player **taps anywhere on the screen** to pull. Each tap advances a "pull progress" value by a small amount, which decays toward zero at ~40% per second. The rope's midpoint is rendered as a line that bows slightly toward whichever side is winning (player left or monster right). Monster pulls automatically — its pull strength scales up over time so the player feels the rope drifting inexorably rightward even when tapping frantically. **You cannot win.** The player doesn't know that yet.
3. **Greying (starts at t=2s, complete by t=6s).** The warm dawn world is fully saturated at t=0. As the struggle continues, a desaturation overlay fades in on top, draining warmth out of the amber sky and warm brown ground until by t=6s the world is near-greyscale. This is the visual language of fusion: the more you fight, the less you can see what you were fighting *for*. Note: because the base world is warm (not grey), the desaturation is a *subtractive* transformation, not a baseline — the player should feel color being pulled out of the frame as the struggle drags on, and feel it pour back in during the walk-past.
4. **Exhaustion meter rises (t=0 → drop-button-appears).** A thin horizontal bar at the top of the screen fills from left to right. It is **not** a willpower bar — it's not labeled, it has no number, and it doesn't behave like the `WillpowerBar` in the energy lesson. It's just a silent line that gets darker and longer. No explicit "you're tired" text. The rising line is the feeling of fatigue, drawn.
5. **Drop button appears.** The button (`Drop the rope`) fades in at the bottom of the screen, centered, when the round's drop-timer elapses. In round 1, this is **12 seconds** (tuned from the original 18s placeholder after playtest; see Q3) — long enough that the player goes through denial → frustration → recognition. In later rounds it's shorter (see §7). The button is small, low-contrast at first, and eases into full opacity over 1.2s. **The player can ignore it and keep tapping.** The game waits. This matters: the choice must be a choice.
6. **The drop (~2s).** Player taps the button. Rope goes slack — the line drops to the ground with a physics-less gravity animation (three keyframes is fine: taut → sagging → flat on ground). Monster stumbles half a step backward from the sudden slack, recovers, continues pulling and roaring **at empty air on its side of the rope**. The raccoon's paws uncurl. A half-second beat where nothing happens. Then:
7. **Walk past the monster (~2.5s).** The raccoon's expression shifts (see §4). `walkTo()` carries it from center-left toward a new point at the right side of the screen, **past the monster**. Crucially, the raccoon passes visibly *under/past* the monster — they exist in the same frame. The monster is still there. The raccoon does not look at it. The desaturation overlay lifts as the raccoon walks, and the warm dawn world pours back in at full saturation. Once the raccoon reaches the far side of the frame, a crossfade transitions the background from the warm dawn plain to the specific valued scene for this round.
8. **Into the valued scene (~3–4s).** The raccoon walks into the scene (coffee shop, gym, living room — see §5), arrives at a specific spot, and the scene "comes alive" briefly. Tiny animations — a friend waves, a kettlebell wobbles, a dog lifts its head. The raccoon's expression settles. A small caption may fade in (see §7 on whether we keep them).
9. **Dissolve to next round.** Crossfade to a featureless ground again. New monster arrives.

**"Pulling" mechanically.** Tap anywhere (not a button — any touch / click on the play area). Each tap fires a small pull impulse. This beats drag-to-pull because it works identically on mobile and desktop, doesn't require aiming at a small target, and creates the specific futile rhythm we want — fast taps, rope still drifting, fast taps, rope still drifting. It also makes dropping feel like *stopping doing something*, which is the point.

**Rope visualization.** Single quadratic-curve line from raccoon's paws to monster's hands. Midpoint-y offset is driven by a smoothed `tension` value: player pulls harder → curve dips toward raccoon; monster dominates → curve bows toward monster. Line thickness pulses slightly each tap (tactile feedback). When dropped: in three frames, replace with a slack curve that sags to the ground, then a flat line.

---

## 4. Raccoon expression choreography

The raccoon is the player. Its face is the only feedback loop more important than the exhaustion meter. Mapping each beat in a round to an expression:

| Beat | Expression | Rationale |
|---|---|---|
| Round start, monster arriving | `neutral` | Baseline. Player hasn't decided anything yet. |
| First 2s of tapping | `stressed` | Sweat drop shows (`drawRaccoon.ts:328`). This is the "I can handle this" phase. |
| 2s → drop-button-appears | `desperate` | Tears + distress lines (`drawRaccoon.ts:340`). This is the "I can't win but I can't stop" phase. The desaturation overlay is at full strength here. |
| Button appears, player hasn't dropped yet | `desperate` | Still. The button is there but the raccoon is still locked in. |
| Moment of drop | `tired` | Brief — the relief of stopping. Eyelids heavy (`drawRaccoon.ts:232`). One beat. |
| Walking past the monster | `neutral` | Important: **not happy**. The raccoon is not smug. It's just free to move again. This is the acceptance insight — acceptance isn't joy, it's the absence of struggle (`act.md:215`). |
| Arriving at the valued scene | `happy` or `energized` | Picked by round (see §5). The good feeling comes *from the valued activity*, not from beating the monster. |

**Round 5 exception.** In round 5, the player drops almost instantly. There's no time to go from `stressed` → `desperate`. The expression sequence collapses: `neutral` → `stressed` for a half-beat → drop → `neutral` → arrive at scene → `happy`. This shortening of the emotional arc is the felt sense of the learning.

**Compositing.** The raccoon lives on **the top HTML element** — a `Character` instance positioned absolutely over the canvas — *not* drawn onto the canvas via `drawRaccoonComposite`. Reason: the raccoon needs to `walkTo()` with its own internal animation, and the monster scene is re-rendered every frame onto the main canvas. Keeping the raccoon as a separate DOM canvas avoids the `clearRect` footgun entirely (`CLAUDE.md` raccoon compositing gotcha) — it's the same pattern the energy lesson already uses.

**Exception: the ending gallery.** In the final ending screen (§8), we *do* want the raccoon and the monsters all composed onto one canvas. There we use `drawRaccoonComposite()` with ear padding, drawn last (on top of the monsters), once, statically.

---

## 5. Valued scenes

Each round ends in a different valued scene. They are short — the raccoon walks in, a tiny beat of life plays, then we dissolve to the next round. Total time per scene: ~4 seconds. They are specific, not generic.

| Round | Scene | What happens | Canvas source |
|---|---|---|---|
| 1 (after Anxiety) | **Morning coffee at home, window open** | Raccoon arrives at a mug on a table. Steam rises. Bird silhouette flies past the window. | Adapt `coffeeShop.ts` — remove the cafe wall, use a home window. ~30 min of new scene code. |
| 2 (after Self-Criticism) | **Kettlebell drop** | Raccoon walks into the gym, sets down, picks up a 16kg kettlebell, does one swing. Nothing more. | **Reuse `gym.ts` directly.** Add a one-shot swing animation on top. |
| 3 (after Shame) | **Text message from a friend** | Raccoon is on a park bench. A speech-bubble phone notification pops up over its head: "hey. coffee this week?" The raccoon's expression softens. | **New scene** — simple: green blob ground, bench shape, one tree. ~40 min. |
| 4 (after Doubt) | **Writing at a desk** | Raccoon at a small desk. Notebook open. Raccoon's paw (animated) moves across the page, leaving a small ink trail. | **New scene** — simple: wall, desk, lamp, notebook. ~40 min. |
| 5 (after Anger) | **A dog looking up** | Raccoon arrives in a warm living-room-ish space (wood floor, corner of an amber couch, window with warm light). A small warm-painted cartoon dog with rust-orange fur looks up at the raccoon, tail mid-wag. Two wags and it softens. | **New scene** — simple: wood floor, couch corner, window, dog. ~45 min. *Revision 2 note:* earlier draft called for the dog to be drawn in the same silhouette grammar as the monsters (warm-colored but in silhouette shapes) to telegraph that "care and threat wear similar shapes." Brainstorm render showed this would fight the tenderness of the beat — the dog reads better as a soft painted cartoon continuous with the raccoon's style. The "care and threat wear similar shapes" message is preserved *implicitly* through the broader contrast: all monster scenes use silhouette grammar, all valued scenes use painted grammar — the lesson is in the difference between the two visual languages, not in forcing the dog into monster clothes. |

**Reuse:** `gym.ts` is used wholesale for round 2. `coffeeShop.ts` is adapted into a home-window variant (less reuse than I'd like, but the cafe-specific details don't fit round 1's tone). The other three scenes are new but each is under 60 lines of canvas drawing — no more complex than existing scenes.

**Why these, not others:** they span body (gym), relationships (texts, dog), craft (writing), and basic sensory pleasure (coffee). This matters because ACT's values are never singular (`act.md:245`). The game should make the player feel that "things that matter" is plural, not one goal in the future.

**Captions.** A single caption fades in at the bottom of each valued scene, **two seconds after the raccoon arrives** (not one — the word should confirm the feeling, not announce it). The set, locked in Q5:
- Round 1: *coffee*
- Round 2: *a swing*
- Round 3: *a friend*
- Round 4: *a page*
- Round 5: *her*

One-word captions, lowercase. These are tonal — direct, undramatic, trusting the player. Glow-inspired (`src/lessons/glow/main.ts`). **Not labels — tonal accents**, doing the same work glow's captions do: naming the feeling quietly so it can land. "her" is deliberate for round 5: specificity is the warmth. The dog is somebody, not some dog.

---

## 6. Visual design

**Layout — mobile (427×933, the reference iPhone 17 Pro viewport):**

```
┌──────────────────────────┐
│ Explorable... / Monster… │ 48px header
│                          │
│ ─────────────────        │ exhaustion bar (thin, ~6px)
│                          │
│                          │
│                          │
│     ╭──╮                 │
│     │  │    ≈≈≈≈≈        │ raccoon (left third) + rope (curve) + monster (right third)
│     ╰──╯         ▓▓▓     │
│                 ▓▓▓▓▓    │
│                  ▓▓▓     │
│                          │
│                          │
│                          │
│   ╭──────────────────╮   │
│   │  Drop the rope   │   │ fades in after drop-timer
│   ╰──────────────────╯   │
└──────────────────────────┘
```

**Layout — desktop (~1200 wide):** same composition, wider canvas. The rope is longer. The monster sits further right. The drop button stays centered and capped at ~400px wide. Everything scales by `canvasAspect()` (`src/lessons/morning-choice/room.ts`) — the canvas picks 0.9 aspect on mobile, 0.6 on desktop — because we want *less* vertical space on desktop so the rope reads as horizontal tension, not a sag. Drawing code receives `w` and `h`, uses no hardcoded pixel values.

**The rope.** One quadratic Bezier from raccoon paws to monster hands. Color `#6b5d4f` (manila brown). 4px line width. Midpoint bows toward the winning side, plus a small noise-driven vertical jitter (±2px at 8Hz) so it reads as *strain* not *static geometry*. On each player tap, the rope whitens for one frame (tactile flash). On drop, three-keyframe animation: taut → sag → flat.

**Greying during the struggle.** Two layers:
1. The warm dawn world (amber sky, warm brown ground — see §2 palette) is rendered in full color as the background during the struggle. The valued scene is NOT yet visible — it fades in only after the drop, as the raccoon walks into it. This is deliberate: when you're fused with a hard feeling, you can't see your values at all, you're just fighting. The valued-scene reveal is the payoff for dropping.
2. A CSS `filter: grayscale(x%)` overlay layered on top, easing 0→85% over ~6 seconds. Not 100% — keeping a trace of color means the player always sees that the warm colored world is *still there*, just being drained by the fight. When the player drops and walks past the monster, filter eases back to 0% over ~1.5s, and the warm dawn comes back in. As the raccoon reaches the far side of the frame, we crossfade from the warm dawn to the specific valued scene (coffee, gym, friend, etc.). CSS filter is simpler but canvas-level desaturation gives more control; pick CSS filter unless there's a specific reason not to.

**Monster position vs raccoon.** Raccoon's center at ~x=30% of width, y=60% of height. Monster's center at ~x=75% of width, y=55% of height (slightly higher — monsters loom). Rope between them passes through ~x=52%, y=57%. Monster is ~1.8x the raccoon's height. Not crushing — just clearly bigger.

**The "drop the rope" button.** Rounded rectangle, 8px radius. Background `rgba(20,20,30,0.7)`. Text white, 18px, `"Drop the rope"`. Position bottom-center, 48px above the bottom edge. Fades in over 1.2s using CSS opacity. **Gets no visual emphasis.** It's the opposite of a call to action — the player has to notice it on their own, just like in life. When the button becomes clickable, a very faint 1px border appears around it. No pulse, no glow, no bouncing arrow.

**Tone of the moment when the button appears.** Nothing yells. The music (if we add any — see §10) doesn't swell. The exhaustion bar keeps rising. The only sign that anything has changed is a faint rectangle at the bottom of the screen. This is deliberate. The game should not nudge the player toward the button; the player needs to discover it. Playtest will tell us if we need to nudge slightly (see §10).

---

## 7. Pacing and length

**Drop timer per round** (time from rope going taut to drop-button appearing):

| Round | Timer | Rationale |
|---|---|---|
| 1 | **12s** (was 18s; tuned 2026-04-12 by playtest agent) | Long enough for denial → frustration → "wait why can't I win" → button appears. 18s was tested but felt like surrender, not relief — the raccoon plateaued on `desperate` for 10+ seconds of dead air. 12s lands the button as the stuck feeling peaks. |
| 2 | **10s** | Player has seen the move once. Half the time. |
| 3 | **6s** | Muscle memory kicks in — this is the round where most players will start looking for the button on their own, before it appears. |
| 4 | **3s** | The button appears almost immediately on arrival. |
| 5 | **0.5s** + **compressed monster walk-in (0.5s vs usual 1.5s)** | The button fades in 0.5s into the round, AND the monster's walk-in is also shortened to 0.5s. The entire round 5 encounter is compressed, not just the button timing. Feels like "monster-button-drop" as a single gesture. The player drops before the taunt bubble finishes fading in. This is the punchline. |

**Total playtime target: 4–5 minutes.** Breakdown:

- Opening (before round 1): ~20s
- Round 1: ~12s struggle + ~4s walk-past + ~4s valued scene + ~2s transition = ~22s
- Round 2: ~10 + 4 + 4 + 2 = ~20s
- Round 3: ~6 + 4 + 4 + 2 = ~16s
- Round 4: ~3 + 4 + 4 + 2 = ~13s
- Round 5: ~0.5 + 4 + 4 + 2 = ~10.5s
- Ending: ~40s (§8)

That's ~167s for the core loop, ~215s with intros and ending. Call it **~4 minutes**. Playtest will adjust round 1's timer first — it's the one most likely to feel long or short.

**Transitions between rounds.** Crossfade over 0.8s — the valued scene dissolves to the featureless plain, and the new monster walks in from the right as the fade completes. No text between rounds. The rhythm *is* the lesson.

**Opening (before round 1).** Three short screens in the `glow` style:

1. *"Every hard feeling wants you to fight it."*
2. *"Fighting it is the trap."*
3. *"Here. Try."*

Then immediately round 1 begins — the raccoon is standing on the plain and Anxiety walks in.

**Ending (after round 5).** See §8.

---

## 8. The ending

Immediately after the round-5 valued scene (the dog), dissolve to a wide, still composition:

**The gallery.** A long, horizontal ground. Five monsters stand in a distant row across the top half of the screen, evenly spaced, small — each drawn at maybe 40% of their combat size. All five are still pulling on invisible ropes (their arms are in the pulling pose, leaning back slightly, mouths open mid-roar). **They are still there. They are still roaring.** The sound, if there is one, is quiet — we can almost hear them but they're far.

In the foreground, center, at full size: the raccoon. Back to the monsters. Facing the camera. Expression: `neutral`, not `happy`. Not triumphant. Just — there.

Below the raccoon, one line fades in after 2 seconds:

> *The monsters don't leave. You do.*

Below that, after another 2 seconds, a second line:

> *Same move. Every time.*

And below that, after 3 more seconds, two links:

- **Again** (restarts the game)
- **Explorable Explanations** (back to hub)

No "share" button, no "what did you learn" quiz, no next lesson link. **If the Choice Point lesson (the parallel one the other agent is designing) wants to link to this, that link belongs on the hub or on that lesson's ending — not pasted onto this one.** This ending should feel like the credits of a short film: quiet, over, done.

**Rendering note for the gallery.** This is the one place we composite the raccoon onto the same canvas as the monsters. Use `drawRaccoonComposite(ctx, x, y, size, 'neutral')` with ear padding — the raccoon is large in this shot and ear clipping at the top edge is a real risk. Draw order: ground, monsters, raccoon on top, captions as DOM elements fading in.

**The takeaway, stated plainly for the designer's sake, not the player's:** the player should walk away with one sentence rattling in their head — *"drop the rope, walk past it"* — as a portable thing they can reach for the next time a feeling tries to grab their end of a rope. That sentence is not displayed in the game. The two lines that *are* displayed ("the monsters don't leave. you do" / "same move. every time") gesture at it without saying it. The game trusts the player.

---

## 9. Architecture notes

**Pattern:** self-contained state machine, like `morning-choice`. Not the `Chapter`/`Scene`/`Game` framework from the energy lesson. Reasons:
- There is no shared willpower bar to persist.
- The rounds are structurally identical (same loop, different parameters) — not narratively distinct chapters.
- The main loop is timer- and input-driven, not "finish this chapter to start the next."
- `morning-choice` already proves the self-contained pattern is the right fit for this kind of lesson.

**State machine states:**
```
intro (3 glow-style slides)
  → round(n)
     ├── arriving      // monster walks on, taunt shows
     ├── struggling    // player taps, rope bows, meter rises
     ├── buttonVisible // same as struggling, but drop button is faded in
     ├── dropping      // rope falls, raccoon exhales
     ├── walking       // raccoon walks past monster
     └── valued        // the post-drop scene
  → round(n+1) … round(5)
  → gallery (ending)
  → hub (exit)
```

Each state transition is `async` and returns a promise that resolves on completion. No global event bus needed — a single `GameState` object with a current-state enum and a round number.

**Reused modules:**
- `Character` (`src/characters/Character.ts`) — the raccoon. Used directly. `setExpression()` for every beat, `walkTo()` for the past-monster walk and for entering valued scenes.
- `drawRaccoon` — never called directly from our code. `Character` handles it.
- `drawRaccoonComposite` (`src/scenes/raccoonComposite.ts`) — used **only** in the gallery ending, once, statically.
- `drawCoffeeShopScene` (`src/scenes/coffeeShop.ts`) — adapted, not reused verbatim, for round 1's home-window coffee variant.
- `drawGymScene` (`src/scenes/gym.ts`) — reused as-is for round 2.
- `canvasAspect()` from `src/lessons/morning-choice/room.ts` — for responsive aspect ratio. **Extract this to `src/scenes/utils.ts`** as part of this work so `morning-choice` and this new lesson share the same implementation. (Small refactor, worth doing.)
- Header / About modal / hub card pattern — copy from `src/lessons/glow/index.html` per `CLAUDE.md` page conventions.

**New files (directory: `src/lessons/drop-the-rope/`):**
```
src/lessons/drop-the-rope/
  index.html            // entry point
  main.ts               // bootstrap — instantiates DropTheRopeGame
  game.ts               // state machine, main loop
  types.ts              // Monster, Round, GameState
  monsters.ts           // 5 monster definitions + drawMonster(ctx, monster, state)
  rope.ts               // drawRope(ctx, from, to, tension, slackAnim)
  round-loop.ts         // the single-round state machine (struggle → drop → walk → valued)
  valued-scenes.ts      // the 5 post-drop scenes
  exhaustion-bar.ts     // the thin top bar
  gallery.ts            // the ending composition
  style.css
```

**URL:** `/lessons/drop-the-rope/`. Why not `/lessons/monster-gallery/`? Because *drop the rope* is the player verb — the thing they *do* — and the monster gallery is the reward. The URL should reflect the action. (Judgment call, flag in open questions.)

**Vite config:** add to `vite.config.ts`'s `build.rollupOptions.input`:
```
"drop-the-rope": "src/lessons/drop-the-rope/index.html"
```

**Hub card:** add to `index.html`, in the Lessons section. Card title: *Drop the Rope*. Card subtitle: *a wordless defusion exercise*. Thumbnail: a 2-color preview of the raccoon + a silhouette monster + a slack rope between them.

**New assets in `public/`:** none required. Optional: one or two ambient sound files in `public/sounds/` for wind on the plain, the rope creaking, the roar. `src/assets/sounds.ts` is already stubbed for this and the lesson should work silently if sounds are missing.

**Navigation:** the lesson uses keyboard / click / swipe navigation per `CLAUDE.md` conventions, but scoped:
- Keyboard arrows work **only in the intro and the gallery ending**, not during rounds. During rounds, all input goes to the pull/drop mechanic.
- `Escape` restarts (also wire to `id="restart-link"` on the title per conventions).

---

## 10. Open questions

**For the user to decide before implementation starts:**

1. ~~**How cartoony vs. how serious should the monsters be?**~~ **LOCKED (2026-04-11 visual brainstorm):** silhouette-serious monsters on a WARM DAWN EARTH world (variant A2), not the original muted grey plain. Confirmed via Gemini previews of all 5 monsters against the warm palette. The cold-accent-on-warm-background contrast reads as "this feeling doesn't belong in your morning" — closer to ACT's framing than "bleak world with brief reprieves." See revision 2 note at the top of this doc.

2. ~~**Are the taunts shown at all, or just implied?**~~ **LOCKED (rev 3):** shown, with graduated duration per round (see §2 Taunts table). Round 1 gets 3s to establish the convention; rounds 2-4 get 1.5s; round 5 begins fading in but is interrupted by the player's reflexive drop. The shrinking taunt duration is a second embodied learning curve stacked on the drop-timer curve.

3. ~~**Should the drop-timer in round 1 be 18s?**~~ **LOCKED (rev 3 → tuned 2026-04-12):** the gate required a playtest-agent run, and the critic ruled **surrender** for 18s. By t=6–8s the raccoon was locked in the `desperate` expression; t=8–16s was visually static dead air, and by the time the button appeared at t=18s the feeling was "finally, something changed on screen" — not earned catharsis. **New value: 12s**, which lands the button as the emotional arc (neutral → stressed → desperate → stuck) peaks. Test assertion updated to wait 25s for the button fade-in.

4. ~~**Does round 5 actually let the player drop in 0.5s?**~~ **LOCKED (rev 3):** yes, 0.5s — AND the monster's walk-in animation for round 5 is also shortened from the usual 1.5s to 0.5s. The entire round 5 is visually accelerated, not just the button timing. Feels like "monster-button-drop" as a single gesture. See §7 table.

5. ~~**Captions under the valued scenes — keep or cut?**~~ **LOCKED (rev 3):** keep all 5 exactly as spec (coffee / a swing / a friend / a page / her). But shift timing from 1s to **2s after arrival** — the word confirms the feeling rather than announcing it. "her" stays — specificity is the warmth. See §5 Captions.

6. ~~**The URL: `drop-the-rope` vs `monster-gallery`?**~~ **LOCKED (rev 3):** `/lessons/drop-the-rope/`. The player verb wins over the scene description. The slug is what someone types when they want to DO the thing.

7. ~~**Sound.**~~ **LOCKED (rev 3):** build visuals first, audio as a second pass — but the second pass has a specific critical beat that the rest of the audio is supporting: **the monster's roar continuing audibly during the raccoon's walk-past, after the drop.** That's the acceptance insight made audible — the monster is still there, still roaring, you're just not holding the rope. Other beats to budget for the audio pass: ambient wind on the warm plain; rope creaking/straining during the struggle; one diegetic sound per valued scene (coffee pour, kettlebell clunk, phone chime, pen scratch, dog tail thump on hardwood).

8. ~~**Can this lesson link forward to the Choice Point lesson?**~~ **LOCKED (rev 3):** no inline link on the ending — that would break the quiet "credits of a short film" tone. Cross-linking happens on the hub card and in the About modal only. Revisit when both lessons ship.

9. ~~**Does the player ever win a tug-of-war?**~~ **LOCKED (rev 3):** no, never — and Round 1 gets a specific visual touch to telegraph that effort isn't the variable. **At ~4s of frantic tapping** (round 1 only), the rope briefly hits a visual "max tension" state (brightens to near-white, vibrates through one full cycle) and then **SNAPS BACK** to where it was. The snap-back is the key — "you poured effort in, the rope didn't move." Embodied evidence that tapping harder isn't the lever. Once per lesson; does not repeat in later rounds.

10. ~~**Accessibility.**~~ **LOCKED (rev 3):** expanded from the original single-point concern into a full a11y checklist. Implementation must include:
    - `aria-live="polite"` region that announces **monster arrival** at round start ("Anxiety monster approaches")
    - Same region reads the **taunt text** aloud as the bubble fades in (so screen-reader users get the thesis even as the visual fades)
    - Same region announces **button availability** ("Drop the rope button is now available") when the button fades in, even though the visual deliberately downplays it
    - Same region announces **valued-scene arrival** ("You walked into the morning coffee scene") after each drop
    - `@media (prefers-reduced-motion: reduce)` skips the rope jitter, the monster breath pulse, and the walk-past animation. The state transitions still happen; they just cut instead of animate.
    - **Keyboard controls** during the struggle: `Space` = pull (one impulse per press, same as one tap), `Enter` = drop the rope (once the button is focused). The button is focusable once visible and receives keyboard focus automatically at that moment.

11. ~~**Raccoon visual continuity: mismatched Crocs.**~~ **LOCKED (rev 3):** this is a **prerequisite PR**, not inline with the lesson. Before the Drop the Rope lesson PR is opened, land a small PR that updates `drawRaccoon` to draw mismatched Crocs — left foot `#3B82F6` blue, right foot `#FDE047` yellow — so the in-game raccoon matches the canonical style in `~/.claude/skills/gen-image/raccoon-style.txt` and the brainstorm Gemini renders. Keeping this in its own PR keeps the lesson PR focused on lesson-specific code.

---

*Source citations: ACT concepts drawn from `/home/developer/blog/_d/act.md` — defusion at `act.md:201`, acceptance at `act.md:213`, tug-of-war metaphor at `act.md:348`, mindfulness as skills at `act.md:180`. Repo conventions from `/home/developer/gits/activation-energy-game/CLAUDE.md`. Raccoon character system at `/home/developer/gits/activation-energy-game/src/characters/`. Self-contained state machine pattern from `/home/developer/gits/activation-energy-game/src/lessons/morning-choice/game.ts`.*
