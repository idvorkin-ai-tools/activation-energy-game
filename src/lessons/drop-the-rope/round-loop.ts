import type { Character } from "../../characters/Character";
import type { ExhaustionBar } from "./exhaustion-bar";
import type { DropButton } from "./drop-button";
import type { TauntBubble } from "./taunt-bubble";
import type { RoundConfig } from "./types";
import { drawWarmDawn } from "./warm-dawn.ts";
import { drawMonster, getMonster } from "./monsters.ts";
import { drawRope, type Point, type RopeState } from "./rope.ts";
import { announce, prefersReducedMotion } from "./a11y.ts";

// ========= Greying =========

const GREY_AT_COMPLETE = 0.15;

/** Returns saturation in [GREY_AT_COMPLETE, 1]. Fades 1 → 0.15 between t=2s and t=6s. */
export function computeDesaturation(elapsedMs: number, _dropTimerMs: number): number {
  if (elapsedMs < 2000) return 1;
  if (elapsedMs >= 6000) return GREY_AT_COMPLETE;
  const t = (elapsedMs - 2000) / 4000;
  return 1 - (1 - GREY_AT_COMPLETE) * t;
}

/** Returns exhaustion bar level in [0, 1] */
export function computeExhaustion(elapsedMs: number, dropTimerMs: number): number {
  return Math.max(0, Math.min(1, elapsedMs / dropTimerMs));
}

// ========= Tension math (the unwinnable rope) =========

/**
 * Tension lives in [TENSION_FLOOR, 1]. Negative = raccoon winning, positive = monster winning.
 * The design is unwinnable: the player can bow the rope toward themselves (negative tension)
 * but there's a hard floor at -0.6 that represents the "rope hitting its fully-stretched
 * extent on the raccoon side." Meanwhile the monster's pull ramps up over time so that the
 * equilibrium drifts monotonically rightward. This is proven numerically in the unit tests.
 */
export const TENSION_FLOOR = -0.6;
export const TENSION_CEIL = 1;

/** Tap impulse — each player tap moves tension this much toward the raccoon. */
export const TAP_IMPULSE = 0.08;

/**
 * Monster's per-second pull strength as a function of elapsed ms since struggle start.
 * Starts at 0.6/sec and ramps to ~1.4/sec over 10+ seconds. Plus a rubber-band term
 * elsewhere that kicks in harder the more negative tension gets.
 */
export function computeMonsterPull(elapsedMs: number): number {
  return 0.6 + Math.min(elapsedMs / 1000, 16) * 0.05;
}

/** Rubber-band coefficient applied to `-tension` when tension < 0. */
export const RUBBER_BAND = 2.4;

export interface TensionSimInput {
  durationMs: number;
  tapsPerSecond: number;
  dropTimerMs: number;
  stopTappingAtMs?: number;
}

export interface TensionSimResult {
  minTension: number;
  maxTension: number;
  finalTension: number;
  /** samples every 100ms of tension over the simulation */
  samples: number[];
}

/**
 * Deterministic simulation of the tension mechanic, used both by tests and
 * by the playtest agent to verify the unwinnability invariant without
 * running the canvas loop.
 */
export function simulateTension(input: TensionSimInput): TensionSimResult {
  const FPS = 60;
  const frameMs = 1000 / FPS;
  const totalFrames = Math.ceil(input.durationMs / frameMs);
  const tapsPerFrame = input.tapsPerSecond / FPS;

  let tension = 0;
  let minTension = 0;
  let maxTension = 0;
  const samples: number[] = [];
  const stopAt = input.stopTappingAtMs ?? Infinity;

  for (let f = 0; f < totalFrames; f++) {
    const elapsedMs = f * frameMs;

    // Player taps (fractional — simulates tapsPerSecond rate)
    const tapping = elapsedMs < stopAt;
    if (tapping) {
      tension -= TAP_IMPULSE * tapsPerFrame;
    }

    // Monster pull: base + rubber-band when player has pulled negative
    const basePull = computeMonsterPull(elapsedMs) / FPS;
    const rubberBand = tension < 0 ? (-tension * RUBBER_BAND) / FPS : 0;
    tension += basePull + rubberBand;

    // Clamp to floor/ceiling
    tension = Math.max(TENSION_FLOOR, Math.min(TENSION_CEIL, tension));

    if (tension < minTension) minTension = tension;
    if (tension > maxTension) maxTension = tension;
    if (f % 6 === 0) samples.push(tension); // sample every 100ms
  }

  return { minTension, maxTension, finalTension: tension, samples };
}

// ========= Deps passed into runRound() =========

export interface RoundDeps {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  character: Character;
  exhaustionBar: ExhaustionBar;
  dropButton: DropButton;
  tauntBubble: TauntBubble;
}

// ========= runRound() — the main state machine =========

/** Run one full round. Resolves when the valued scene finishes. */
export async function runRound(
  config: RoundConfig,
  roundNum: 1 | 2 | 3 | 4 | 5,
  deps: RoundDeps,
): Promise<void> {
  const { ctx, canvas, character, exhaustionBar, dropButton, tauntBubble } = deps;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // ===== ARRIVING =====
  announce(`${getMonster(config.monster).displayName} approaches`);
  character.setExpression("neutral");
  character.setPosition(w * 0.3, h * 0.6);
  await animateArrival(deps, config, w, h, performance.now());

  // ===== TAUNT (non-blocking — plays concurrently with struggle) =====
  // Q2: graduated duration. For R5 the struggle's drop-button fires before the taunt
  // finishes fading in (tauntBubble.cancel() is called in the teardown).
  void tauntBubble.show(getMonster(config.monster).taunt, config.tauntHoldMs, config.tauntFadeMs);

  // ===== STRUGGLING + BUTTON VISIBLE =====
  character.setExpression("stressed");
  const struggleStart = performance.now();
  const reduced = prefersReducedMotion();
  let tension = 0;
  let tapCount = 0;
  let flashUntil = 0;

  const onTap = () => {
    tapCount++;
    tension = Math.max(TENSION_FLOOR, tension - TAP_IMPULSE);
    flashUntil = performance.now() + 50;
  };
  canvas.addEventListener("click", onTap);
  canvas.addEventListener("touchstart", onTap, { passive: true });
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      onTap();
    }
  };
  window.addEventListener("keydown", onKey);

  let dropButtonShown = false;
  let dropped = false;
  dropButton.onClick(() => {
    dropped = true;
  });

  const FPS = 60;
  await new Promise<void>((resolve) => {
    const loop = () => {
      const now = performance.now();
      const elapsed = now - struggleStart;

      // Monster pulls per frame: base + rubber band if player has dipped negative.
      // Matches the simulateTension() math proven unwinnable by Task 11's tests.
      const basePull = computeMonsterPull(elapsed) / FPS;
      const rubberBand = tension < 0 ? (-tension * RUBBER_BAND) / FPS : 0;
      tension = Math.min(TENSION_CEIL, tension + basePull + rubberBand);

      // Exhaustion bar
      exhaustionBar.setLevel(computeExhaustion(elapsed, config.dropTimerMs));

      // Raccoon expression transitions
      if (elapsed > 2000 && character.getExpression() !== "desperate") {
        character.setExpression("desperate");
      }

      // Render background + monster + rope
      const saturation = computeDesaturation(elapsed, config.dropTimerMs);
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, saturation);

      const monsterX = w * 0.75;
      const monsterY = h * 0.55;
      drawMonster(ctx, config.monster, {
        cx: monsterX,
        cy: monsterY,
        height: 180,
        breathPhase: reduced ? 0 : (elapsed / 500) % 1, // Q10: respect reduced motion
        pullLean: tension,
      });

      const ropeFrom: Point = { x: w * 0.3 + 20, y: h * 0.6 };
      const ropeTo: Point = { x: monsterX - 30, y: monsterY + 10 };
      drawRope(ctx, ropeFrom, ropeTo, tension, "taut", now < flashUntil);

      // Q9: Round 1 only, at t≈4000ms, "max tension" flash + snap-back
      // Triggers if the player has tapped aggressively (tapCount > 10)
      if (roundNum === 1 && elapsed >= 4000 && elapsed < 4200 && tapCount > 10) {
        drawMaxTensionSnapBack(ctx, ropeFrom, ropeTo);
      }

      // Reveal drop button
      if (!dropButtonShown && elapsed >= config.dropTimerMs) {
        dropButtonShown = true;
        void dropButton.fadeIn(); // non-blocking
      }

      if (dropped) {
        resolve();
        return;
      }
      requestAnimationFrame(loop);
    };
    loop();
  });

  // Teardown
  canvas.removeEventListener("click", onTap);
  canvas.removeEventListener("touchstart", onTap);
  window.removeEventListener("keydown", onKey);
  tauntBubble.cancel();

  // ===== DROPPING =====
  character.setExpression("tired");
  await animateDrop(deps, config, w, h);

  // ===== WALKING — desaturation lifts DURING the walk, not after =====
  character.setExpression("neutral");
  dropButton.hide();
  const walkDuration = reduced ? 0 : 2500;
  // Run walkTo and the desaturation fade in parallel so they finish together.
  const walkPromise = character.walkTo(w * 0.85, h * 0.65, walkDuration);
  const satPromise = fadeDesaturationBack(deps, config, w, h, walkDuration);
  await Promise.all([walkPromise, satPromise]);

  // ===== VALUED =====
  announce(`You walked into the ${config.captionText} scene`);
  await showValuedScene(deps, config, roundNum, w, h);
}

function drawMaxTensionSnapBack(ctx: CanvasRenderingContext2D, from: Point, to: Point): void {
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y + (Math.random() - 0.5) * 6);
  ctx.lineTo(to.x, to.y + (Math.random() - 0.5) * 6);
  ctx.stroke();
  ctx.restore();
}

async function animateArrival(
  deps: RoundDeps,
  config: RoundConfig,
  w: number,
  h: number,
  startMs: number,
): Promise<void> {
  const { ctx } = deps;
  return new Promise((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - startMs;
      const t = Math.min(1, elapsed / config.monsterWalkInMs);
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, 1);
      const monsterX = w * 1.1 - t * (w * 0.35); // walks in from right edge
      drawMonster(ctx, config.monster, {
        cx: monsterX,
        cy: h * 0.55,
        height: 180,
        breathPhase: (elapsed / 500) % 1,
        pullLean: 0,
      });
      // Static rope from raccoon to monster
      drawRope(
        ctx,
        { x: w * 0.3 + 20, y: h * 0.6 },
        { x: monsterX - 30, y: h * 0.55 + 10 },
        0,
        "taut",
        false,
      );
      if (t < 1) {
        requestAnimationFrame(loop);
      } else {
        resolve();
      }
    };
    loop();
  });
}

async function animateDrop(
  deps: RoundDeps,
  config: RoundConfig,
  w: number,
  h: number,
): Promise<void> {
  // 3-keyframe drop: taut -> sagging -> flat over ~0.8s
  const { ctx } = deps;
  const frames: Array<[RopeState, number]> = [
    ["taut", 0],
    ["sagging", 250],
    ["flat", 500],
  ];
  const start = performance.now();
  return new Promise((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - start;
      let state: RopeState = "flat";
      for (const [s, ms] of frames) {
        if (elapsed >= ms) state = s;
      }
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, 0.15);
      drawMonster(ctx, config.monster, {
        cx: w * 0.75,
        cy: h * 0.55,
        height: 180,
        breathPhase: (elapsed / 500) % 1,
        pullLean: 0.3, // still yanking at empty air
      });
      drawRope(
        ctx,
        { x: w * 0.3 + 20, y: h * 0.6 },
        { x: w * 0.75 - 30, y: h * 0.55 + 10 },
        0,
        state,
        false,
      );
      if (elapsed >= 800) {
        resolve();
      } else {
        requestAnimationFrame(loop);
      }
    };
    loop();
  });
}

/**
 * Eases the world back from the struggle's dimmed saturation (0.15) to full
 * color over `duration` ms, keeping the monster still pulling at empty air
 * (per spec: "still there, still roaring, still pulling on a slack line").
 * `duration` matches the raccoon's walk-past duration so they finish together.
 */
async function fadeDesaturationBack(
  deps: RoundDeps,
  config: RoundConfig,
  w: number,
  h: number,
  duration: number,
): Promise<void> {
  const { ctx } = deps;
  if (duration === 0) {
    // prefers-reduced-motion: snap straight to full color, draw once
    ctx.clearRect(0, 0, w, h);
    drawWarmDawn(ctx, w, h, 1);
    drawMonster(ctx, config.monster, {
      cx: w * 0.75,
      cy: h * 0.55,
      height: 180,
      breathPhase: 0,
      pullLean: 0.2,
    });
    return;
  }
  const start = performance.now();
  return new Promise((resolve) => {
    const loop = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / duration);
      const sat = 0.15 + (1 - 0.15) * t;
      ctx.clearRect(0, 0, w, h);
      drawWarmDawn(ctx, w, h, sat);
      drawMonster(ctx, config.monster, {
        cx: w * 0.75,
        cy: h * 0.55,
        height: 180,
        breathPhase: (elapsed / 500) % 1,
        pullLean: 0.2,
      });
      if (t < 1) {
        requestAnimationFrame(loop);
      } else {
        resolve();
      }
    };
    loop();
  });
}

// Forward declared — will be implemented in Tasks 13-18
async function showValuedScene(
  _deps: RoundDeps,
  _config: RoundConfig,
  _roundNum: number,
  _w: number,
  _h: number,
): Promise<void> {
  // Placeholder — Tasks 13-18 will wire in per-round drawing
  await new Promise((r) => setTimeout(r, 4000));
}
