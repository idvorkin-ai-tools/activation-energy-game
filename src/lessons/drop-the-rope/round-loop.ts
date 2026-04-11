import type { Character } from "../../characters/Character";
import type { ExhaustionBar } from "./exhaustion-bar";
import type { DropButton } from "./drop-button";
import type { TauntBubble } from "./taunt-bubble";

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

// Implementation of runRound() follows in Task 12.
