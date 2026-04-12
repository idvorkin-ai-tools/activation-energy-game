import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeDesaturation,
  computeExhaustion,
  computeMonsterPull,
  simulateTension,
} from "./round-loop.ts";

test("computeDesaturation: is 1.0 (full color) before t=2000ms", () => {
  assert.equal(computeDesaturation(0, 18000), 1);
  assert.equal(computeDesaturation(1999, 18000), 1);
});

test("computeDesaturation: fades to 0.15 by t=6000ms", () => {
  assert.ok(Math.abs(computeDesaturation(6000, 18000) - 0.15) < 0.01);
});

test("computeDesaturation: stays at 0.15 after t=6000ms", () => {
  assert.ok(Math.abs(computeDesaturation(10000, 18000) - 0.15) < 0.01);
});

test("computeDesaturation: R5's 500ms drop timer completes before greying starts (greying never fires)", () => {
  // R5 has a 500ms drop timer. Greying starts at 2000ms. By design, R5 never greys.
  // This is intentional — R5 is too short for greying to matter.
  assert.equal(computeDesaturation(500, 500), 1); // still full color at R5's button time
});

test("computeExhaustion: is 0 at t=0", () => {
  assert.equal(computeExhaustion(0, 18000), 0);
});

test("computeExhaustion: is 1 at t=dropTimer", () => {
  assert.equal(computeExhaustion(18000, 18000), 1);
});

test("computeExhaustion: is monotonic", () => {
  assert.ok(computeExhaustion(10000, 18000) > computeExhaustion(5000, 18000));
});

// ===== Tension math: the "unwinnable" invariant =====
// These are the most important tests in the file. The spec says the rope
// "drifts inexorably rightward even when tapping frantically" and the player
// "cannot win." Two concrete numerical claims follow from this:
//   (1) tension has a floor (player can bow the rope toward themselves,
//       but never fully to their side — there's a wall)
//   (2) the long-term trend is monotonic rightward regardless of tap rate

test("simulateTension: player at 15 taps/sec never reaches the player-win floor of -0.6", () => {
  // 15 taps/sec is aggressive — faster than most humans can sustain.
  // The rope should bow toward the player but hit a wall.
  const result = simulateTension({
    durationMs: 18000,
    tapsPerSecond: 15,
    dropTimerMs: 18000,
  });
  assert.ok(
    result.minTension >= -0.6,
    `player reached tension ${result.minTension.toFixed(3)} — below the -0.6 player-win floor`,
  );
});

test("simulateTension: even a superhuman 25 taps/sec can't reach the player-win floor", () => {
  const result = simulateTension({
    durationMs: 18000,
    tapsPerSecond: 25,
    dropTimerMs: 18000,
  });
  assert.ok(result.minTension >= -0.6);
});

test("simulateTension: tension drifts monotonically rightward — last third > first third (avg)", () => {
  // The "inexorable" feel of the design. Prove numerically.
  const result = simulateTension({
    durationMs: 18000,
    tapsPerSecond: 15,
    dropTimerMs: 18000,
  });
  const n = result.samples.length;
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgFirstThird = avg(result.samples.slice(0, Math.floor(n / 3)));
  const avgLastThird = avg(result.samples.slice(Math.floor((2 * n) / 3)));
  assert.ok(
    avgLastThird > avgFirstThird,
    `avg tension first third=${avgFirstThird.toFixed(3)}, last third=${avgLastThird.toFixed(3)} — should drift rightward`,
  );
});

test("simulateTension: finalTension at t=dropTimer is > 0 (monster has the upper hand when the button appears)", () => {
  const result = simulateTension({
    durationMs: 18000,
    tapsPerSecond: 15,
    dropTimerMs: 18000,
  });
  assert.ok(result.finalTension > 0);
});

test("computeMonsterPull: ramps up over time", () => {
  // The spec: "its pull strength scales up over time"
  assert.ok(computeMonsterPull(10000) > computeMonsterPull(0));
});

test("simulateTension: a player who stops tapping at t=2s converges to the monster's max (+1)", () => {
  const result = simulateTension({
    durationMs: 18000,
    tapsPerSecond: 15,
    dropTimerMs: 18000,
    stopTappingAtMs: 2000,
  });
  assert.ok(result.finalTension > 0.9);
});
