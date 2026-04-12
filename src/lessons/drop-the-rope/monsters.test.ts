import { test } from "node:test";
import assert from "node:assert/strict";
import { MONSTERS, ROUND_CONFIGS, getMonster, getRoundConfig } from "./monsters.ts";
import type { MonsterId } from "./types.ts";

test("MONSTERS: has exactly 5 monsters", () => {
  assert.equal(MONSTERS.length, 5);
});

test("MONSTERS: has the expected ids in order", () => {
  const expected: MonsterId[] = ["anxiety", "self-criticism", "shame", "doubt", "anger"];
  assert.deepEqual(
    MONSTERS.map((m) => m.id),
    expected,
  );
});

test("MONSTERS: anxiety is round 1", () => {
  assert.equal(getMonster("anxiety").round, 1);
});

test("MONSTERS: doubt has the revised teal accent color #5EA5B5", () => {
  // Revised during Q1 brainstorm: grey would vanish against amber dawn
  assert.equal(getMonster("doubt").accentColor, "#5EA5B5");
});

test("ROUND_CONFIGS: has 5 entries", () => {
  assert.equal(ROUND_CONFIGS.length, 5);
});

test("ROUND_CONFIGS: round 1 drop timer is 12 seconds (tuned from 18s by playtest)", () => {
  // Q3 post-playtest tuning (2026-04-12): original 18s felt like surrender,
  // not relief. Shortened to 12s so the button lands as the stuck feeling peaks.
  assert.equal(getRoundConfig(1).dropTimerMs, 12000);
});

test("ROUND_CONFIGS: round 5 drop timer is 0.5 seconds", () => {
  assert.equal(getRoundConfig(5).dropTimerMs, 500);
});

test("ROUND_CONFIGS: round 5 has a compressed monster walk-in (0.5s)", () => {
  // Q4 decision: the whole round 5 is compressed, not just the button
  assert.equal(getRoundConfig(5).monsterWalkInMs, 500);
});

test("ROUND_CONFIGS: drop timers are strictly decreasing", () => {
  for (let i = 0; i < ROUND_CONFIGS.length - 1; i++) {
    assert.ok(
      ROUND_CONFIGS[i].dropTimerMs > ROUND_CONFIGS[i + 1].dropTimerMs,
      `round ${i + 1} (${ROUND_CONFIGS[i].dropTimerMs}ms) should be > round ${i + 2} (${ROUND_CONFIGS[i + 1].dropTimerMs}ms)`,
    );
  }
});

test("ROUND_CONFIGS: taunt hold duration is longest on round 1 and shortest on round 5", () => {
  // Q2 decision: graduated taunt durations stack a second learning curve
  assert.ok(ROUND_CONFIGS[0].tauntHoldMs > ROUND_CONFIGS[1].tauntHoldMs);
  assert.ok(ROUND_CONFIGS[4].tauntHoldMs < ROUND_CONFIGS[3].tauntHoldMs);
});
