# Drop the Rope — Execution Handoff

> **Written 2026-04-11 ~evening** at the end of a long execution session. Tasks 1–12 are committed and green. A background subagent was dispatched to run Tasks 13–17 (5 valued scenes). This doc exists so the next session (you, or a fresh Claude) can pick up without re-reading everything.

## Where to find things

- **Plan:** [`docs/superpowers/plans/2026-04-11-drop-the-rope.md`](./2026-04-11-drop-the-rope.md) — 25 tasks, ~3000 lines, fully specified.
- **Design doc (decisions locked):** [`docs/plans/2026-04-11-drop-the-rope-monster-gallery-design.md`](../../plans/2026-04-11-drop-the-rope-monster-gallery-design.md) — rev 3, all 11 open questions resolved. Don't re-litigate.
- **Visual references:** `docs/design-refs/drop-the-rope/` — 11 Gemini preview PNGs (monster-a2-warm, lineup-1..5, valued-1..5). These are the authoritative visual targets.
- **Work branch:** `drop-the-rope-main` (long-lived, tasks 2–24 all commit here; Task 25 opens the final PR).
- **Separate PR:** `#9` (`refactor: extract canvasAspect() to scenes/utils`) — the Task 1 prereq. **Still OPEN at time of handoff** and waiting for user to squash-merge. Green CI. Independent of the lesson branch.

## What's done (tasks 1–12)

| # | Task | Commit | Notes |
|---|---|---|---|
| 1 | `canvasAspect()` refactor | `e562fd0` | PR #9 |
| 2 | Scaffold dir + vite + hub card | `9982b1f` + `7d6cbc9` | Plan's file paths were outdated — actual layout is `lessons/<name>/index.html` (root) + `src/lessons/<name>/main.ts`. Implementer caught this. Also fixed modal backdrop click handler and added `import "../../style.css"` for consistency with morning-choice. |
| 3 | `types.ts` | `ed23d05` | Straight copy from plan. |
| 4 | `monsters.ts` data + 10 tests | `daf11bb` | Also enabled `allowImportingTsExtensions: true` in `tsconfig.json` — required so node --test can load test files that import `./monsters.ts` (explicit extension). |
| 5 | `warm-dawn.ts` background | `151b902` | Visual-verified against `monster-a2-warm.png`. Plan's code had `#555` / `#333` shorthand hex which breaks `hexToRgb` in `src/scenes/utils.ts`; implementer expanded to `#555555` / `#333333`. |
| 6 | 5 monster silhouettes | `2c41141` | Visual-verified. Implementer iterated 3x on Anxiety and 1x on Shame vs. the original plan code — the ones shipped are different from the plan's initial code but match the reference PNGs better. Don't revert. |
| 7 | `rope.ts` + 3 tests | `8218487` | Straight copy from plan. |
| 8 | `exhaustion-bar.ts` + CSS | `ec7f852` | CSS goes into shared `src/style.css` under `/* drop-the-rope lesson */` section — matches morning-choice pattern, there's no per-lesson CSS file. |
| 9 | `a11y.ts` + `drop-button.ts` + CSS | `ec59603` | Same CSS strategy. |
| 10 | `taunt-bubble.ts` + CSS | `fd7af8c` | Same CSS strategy. |
| 11 | `round-loop.ts` helpers + 13 tension tests | `9c899b0` | Tension constants ship as-is from plan — all invariants pass on first run, no tuning. |
| 12 | `runRound()` state machine | `7da01aa` + `76d15a5` | The heart of the lesson. Fix commit `76d15a5` added `.ts` extensions to runtime imports (see Gotchas below). |

**Test state at handoff:** 26/26 across `monsters.test.ts` (10), `rope.test.ts` (3), `round-loop.test.ts` (13). `tsc --noEmit` exit 0. `npm run lint` clean.

## Tasks 13–17: DONE by background subagent

Background subagent completed all 5 valued scenes. Commits landed on `drop-the-rope-main`:

| # | Task | Commit | Visual judgment (agent's own words) |
|---|---|---|---|
| 13 | Coffee at home | `0f6ad0e` | Warm amber/brown interior with dawn window, tree silhouettes, animated bird, small table with steaming mug — close match to reference minus the raccoon character. **Empty space on the left** that the reference fills with the raccoon; should read correctly once the raccoon layer is composited at runtime. |
| 14 | Warm wooden gym + kettlebell swing | `cff617e` | Warm terracotta walls (not cool grey), wooden floor, bright sunlit window, kettlebell rack with 4 labelled bells, animated swing kettlebell — good match. |
| 15 | Park bench + friend text | `754f6fb` | Golden hour amber sky, foreground tree with bokeh distance trees, well-structured park bench, speech bubble fading in — strong match. |
| 16 | Writing at desk + warm lamp | `a0b55e0` | Dim mauve room, colorful bookshelves both sides, warm amber lamp glow, night window with stars, open-book notebook with angled page spread and animated ink lines — good match. |
| 17 | Dog in living room (painted cartoon) | `81b9057` | Warm salmon walls, orange couch on left, bright window right, painted rust-orange dog with floppy ears, paws, animated wagging tail above the floor — good match. |

All 5 scenes went through 2–3 visual refinement iterations against the reference PNGs. Key fixes the agent made during iteration:
- Bench back geometry in scene 3 (initial version had floating slats)
- Dog positioning above the baseboard in scene 5 (initial version had the dog "sinking")
- Notebook in scene 4 now has an angled open-book shape, not a flat rectangle
- Foam roller color in scene 2 changed from jarring red to warm brown

**State at handoff:** tsc clean, lint clean, 26/26 tests passing, `git status` clean.

**One thing to verify during Task 22 visual walkthrough:** scene 1 (coffee) has empty space on the left where the runtime raccoon should land. If the raccoon's final runtime position overlaps the mug or doesn't fill that space visually, the composition will look unbalanced — tune `showValuedScene` raccoon positioning in Task 18 accordingly.

## What's next (tasks 18–25)

Tasks 18–25 are untouched. Keep going in sequence:

### Task 18: Wire valued scenes into round-loop + captions
- Replace the 4-second placeholder `showValuedScene()` stub in `round-loop.ts` with real routing by `roundNum`.
- Add caption DOM element that fades in **2s after raccoon arrival** (Q5 locked — 2s, not 1s).
- Captions per round: `coffee` / `a swing` / `a friend` / `a page` / `her` (from `ROUND_CONFIGS[i].captionText`).
- Update the `showValuedScene` forward-declaration at the bottom of `round-loop.ts`.
- Plan section: lines ~2259–2379.

### Task 19: `intro.ts` — 3 glow-style slides
- `"Every hard feeling wants you to fight it."` / `"Fighting it is the trap."` / `"Here. Try."`
- Reference: `src/lessons/glow/` for the slide-typewriter pattern.
- Plan section: lines ~2380–2463.

### Task 20: `gallery.ts` ending
- 5 distant roaring monsters (small, evenly spaced) + foreground raccoon via `drawRaccoonComposite()` (with ear padding — this is the one place we composite the raccoon onto the scene canvas).
- Two lines fade in: `"The monsters don't leave. You do."` then `"Same move. Every time."`
- Then links: "Again" (restart) and "Explorable Explanations" (hub).
- Plan section: lines ~2464–2568.

### Task 21: `game.ts` top-level orchestrator
- `intro → round(1..5) → gallery` state machine.
- Wire `Escape` and `#restart-link` to `game.restart()`.
- Replace the placeholder in `src/lessons/drop-the-rope/main.ts` with `new DropTheRopeGame(container)`.
- Plan section: lines ~2569–2703.
- **After this task, the lesson should be runnable end-to-end in the dev server.** Kick off `npm run dev -- --host 0.0.0.0` and click through once as a sanity check.

### Task 22: Manual visual walkthrough — mobile + desktop
- Screenshot every beat at iPhone 17 Pro (`{width: 427, height: 933, deviceScaleFactor: 3}`) AND desktop (1200×900 or similar).
- Read each screenshot with vision. Compare to `valued-N-*.png` and `lineup-N-*.png`.
- This is the first time you'll see the full lesson running — expect to find visual regressions and fix them iteratively.
- Plan section: lines ~2704–2759.

### Task 23: Playwright E2E test
- `tests/drop-the-rope.spec.ts` — walk through all 5 rounds + gallery.
- Use the "click `.mc-narrative` to skip typewriter" pattern from existing lessons.
- Watch out for the "multi-step intro test helper" gotcha (documented in CLAUDE.md) — rounds share button selectors.
- Plan section: lines ~2760–2843.

### Task 24: Playtest agent on round 1 (Q3 gate)
- **This is a gate on the PR — not a "nice to have".** Design doc Q3 says the 18s round-1 drop timer ships as a placeholder AND requires playtest agent judgment before merging.
- Dispatch a general-purpose subagent using the "playtest agent" template (reference memory: `reference_playtest_agent.md`, or in CLAUDE.md under "Playtest agent").
- **Criterion (verbatim from plan):** *"At t=18s when the drop button first appears, what does the raccoon's face mean? Relief, surrender, or confusion? Which of those did the player just feel?"* Relief = ship. Surrender/confusion = adjust the drop timer up or down.
- If the agent recommends changing the timer, do it in `ROUND_CONFIGS[0].dropTimerMs` and re-run the gate.
- Plan section: lines ~2844–2878.

### Task 25: Open the final PR
- Push `drop-the-rope-main` and open the PR with the title/body template in the plan (lines ~2879–2919).
- **Before pushing:** if PR #9 has merged to main by then, `git rebase origin/main` on `drop-the-rope-main` to drop the duplicate canvasAspect commit. If PR #9 is still open, push as-is — GitHub will figure it out at merge time.

## Gotchas (learned the hard way)

### 1. `.ts` extensions on runtime value imports in files touched by node --test
Node's `--experimental-strip-types` loader demands explicit `.ts` extensions on all **value** (non-type) imports in any file loaded by a test (including transitively). Type imports are erased before resolution so those can stay extension-less.

The project fix is `tsconfig.json` → `"allowImportingTsExtensions": true`. Vite and `tsc --noEmit` both accept `.ts` imports with that flag. But you MUST add `.ts` to the runtime import specifiers yourself — the compiler won't synthesize them.

Files currently using `.ts` specifiers (scoped to drop-the-rope + the one utils import):
- `round-loop.ts` — imports from `./warm-dawn.ts`, `./monsters.ts`, `./rope.ts`, `./a11y.ts`
- `warm-dawn.ts` — imports from `../../scenes/utils.ts`
- All `*.test.ts` files — import their SUT with `.ts`

**If you add a new value import to any of these files or to a new file in this lesson that needs to be testable via node --test, use the `.ts` specifier.**

### 2. LSP false positives after tsconfig / value-import changes
The editor's TypeScript server caches tsconfig and misreports errors that CLI `tsc --noEmit` doesn't see. Every time something looks broken in an editor diagnostic, verify with `npx tsc --noEmit && npm run lint` from the terminal. Trust the CLI, not the squigglies.

### 3. File layout deviation from plan (Task 2)
Plan says `src/lessons/drop-the-rope/index.html`. Actual project layout is `lessons/drop-the-rope/index.html` (project root) + `src/lessons/drop-the-rope/main.ts`. All existing lessons do this split. The plan is wrong; the implementation is right. Don't "fix" the path.

### 4. CSS location
No per-lesson CSS file. All drop-the-rope styles live in `src/style.css` under a `/* drop-the-rope lesson */` section, matching morning-choice. Plan says `src/lessons/drop-the-rope/style.css` but that file doesn't exist and shouldn't be created.

### 5. `drawRaccoon()`'s `clearRect` footgun
Already documented in CLAUDE.md but worth repeating: `drawRaccoon()` calls `clearRect(0, 0, w, h)` internally. The drop-the-rope lesson sidesteps this by keeping the raccoon on its own DOM canvas (via `Character`) — the main canvas only has the background + monster + rope. The ONE place we composite the raccoon onto the main canvas is Task 20's gallery ending, where we use `drawRaccoonComposite()` (which handles offscreen + ear padding).

### 6. `gym.ts` is COLD grey concrete
Do **not** reuse `src/scenes/gym.ts` for Task 14 — its palette (`#3a3a3e` walls, `#2a2a2e` floor) is wrong for the warm dawn world. Task 14 draws a new warm wooden gym inline in `valued-scenes.ts`. Audit point #2 in the plan's self-review documents this.

### 7. Task 2 modal backdrop wiring
The backdrop is a nested `<div class="modal-backdrop">`, not the outer `#about-modal`. Use `modal.querySelector(".modal-backdrop").addEventListener(...)` — NOT `modal.addEventListener("click", e => e.target === modal)`. Already fixed in `main.ts`. This pattern also applies if you create new modal-like UI.

## Context checkpoints if you resume

- **Sanity:** `git branch --show-current` should be `drop-the-rope-main` (or checkout it).
- **Branch delta:** `git log main..drop-the-rope-main --oneline` should show ~15 commits from Tasks 1–12 (if PR #9 merged, Task 1 commit is already on main and isn't in this list).
- **Tests:** `node --experimental-strip-types --test 'src/lessons/drop-the-rope/*.test.ts'` should show 26+ passing (more if Tasks 13–17 added unit tests).
- **Typecheck:** `npx tsc --noEmit` exit 0.
- **Lint:** `npm run lint` exit 0.
- **Dev smoke:** `npm run dev -- --host 0.0.0.0` and navigate to `http://localhost:5180/lessons/drop-the-rope/`. Before Task 21 lands, you'll see the placeholder "Drop the Rope — scaffolding in progress" text. After Task 21, the lesson should actually run.

## Resume command (for a fresh Claude session)

> Read `docs/superpowers/plans/2026-04-11-drop-the-rope-handoff.md`. Continue executing the drop-the-rope plan via `superpowers:subagent-driven-development` from wherever the background subagent left off — verify its commits, finish any tasks it didn't reach, then push through Tasks 18–25.

That's all the handoff needed.
