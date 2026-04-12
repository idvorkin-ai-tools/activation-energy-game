import { test } from "node:test";
import assert from "node:assert/strict";
import { ropeMidpoint } from "./rope.ts";

test("ropeMidpoint: balanced tension (0) returns center point", () => {
  const mid = ropeMidpoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 0);
  assert.ok(Math.abs(mid.x - 50) < 0.01);
  assert.ok(Math.abs(mid.y - 0) < 0.01);
});

test("ropeMidpoint: player-winning tension (-1) bows toward raccoon", () => {
  const mid = ropeMidpoint({ x: 0, y: 0 }, { x: 100, y: 0 }, -1);
  assert.ok(mid.x < 50);
});

test("ropeMidpoint: monster-winning tension (+1) bows toward monster", () => {
  const mid = ropeMidpoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 1);
  assert.ok(mid.x > 50);
});
