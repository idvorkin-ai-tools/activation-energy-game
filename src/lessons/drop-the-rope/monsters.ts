import type { Monster, MonsterId, RoundConfig } from "./types";

export const MONSTERS: readonly Monster[] = [
  {
    id: "anxiety",
    displayName: "Anxiety",
    taunt: "What if it all falls apart today?",
    accentColor: "#93C5FD", // cold blue
    round: 1,
  },
  {
    id: "self-criticism",
    displayName: "Self-Criticism",
    taunt: "You're still not good enough. You know it.",
    accentColor: "#E8A0A0", // pink
    round: 2,
  },
  {
    id: "shame",
    displayName: "Shame",
    taunt: "Don't let them see what you really are.",
    accentColor: "#8B5CF6", // violet
    round: 3,
  },
  {
    id: "doubt",
    displayName: "Doubt",
    taunt: "Are you sure? Really sure?",
    accentColor: "#5EA5B5", // muted teal (revised from grey in rev 2)
    round: 4,
  },
  {
    id: "anger",
    displayName: "Anger",
    taunt: "They don't get to do this to you.",
    accentColor: "#EF4444", // red
    round: 5,
  },
];

export const ROUND_CONFIGS: readonly RoundConfig[] = [
  { monster: "anxiety",        dropTimerMs: 18000, tauntHoldMs: 2000, tauntFadeMs: 1000, monsterWalkInMs: 1500, captionText: "coffee" },
  { monster: "self-criticism", dropTimerMs: 10000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a swing" },
  { monster: "shame",          dropTimerMs:  6000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a friend" },
  { monster: "doubt",          dropTimerMs:  3000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a page" },
  { monster: "anger",          dropTimerMs:   500, tauntHoldMs:    0, tauntFadeMs:  300, monsterWalkInMs:  500, captionText: "her"      },
];

export function getMonster(id: MonsterId): Monster {
  const m = MONSTERS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown monster: ${id}`);
  return m;
}

export function getRoundConfig(round: 1 | 2 | 3 | 4 | 5): RoundConfig {
  return ROUND_CONFIGS[round - 1];
}

export interface MonsterDrawOptions {
  /** Center x of the monster's body in logical pixels */
  cx: number;
  /** Center y of the monster's body */
  cy: number;
  /** Monster's rendered height in logical pixels (body will be drawn ~1.8x the raccoon size by caller) */
  height: number;
  /** 0..1 breath pulse phase for y-axis scale modulation */
  breathPhase: number;
  /** 0..1 rope pull strength — leans backward slightly */
  pullLean: number;
}

export function drawMonster(
  ctx: CanvasRenderingContext2D,
  id: MonsterId,
  opts: MonsterDrawOptions,
): void {
  const m = getMonster(id);
  const breathScale = 1 + Math.sin(opts.breathPhase * Math.PI * 2) * 0.02;
  ctx.save();
  ctx.translate(opts.cx, opts.cy);
  ctx.scale(1, breathScale);
  ctx.rotate(opts.pullLean * -0.08);

  switch (id) {
    case "anxiety":        drawAnxiety(ctx, opts.height, m.accentColor); break;
    case "self-criticism": drawSelfCriticism(ctx, opts.height, m.accentColor); break;
    case "shame":          drawShame(ctx, opts.height, m.accentColor); break;
    case "doubt":          drawDoubt(ctx, opts.height, m.accentColor); break;
    case "anger":          drawAnger(ctx, opts.height, m.accentColor); break;
  }

  ctx.restore();
}

const BODY_BLACK = "#1a1a22";

function drawAnxiety(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Tall thin humanoid silhouette with wispy smoke hair at top.
  // Body is ~h*0.6 tall, head ~h*0.18 radius, wispy hair extends to top.
  const bodyW = h * 0.18;
  const headR = h * 0.15;
  const neckY = -h * 0.15;
  const headY = neckY - headR;

  ctx.fillStyle = BODY_BLACK;

  // Smoke wisp — drawn as a thick tapered stroke along a curved path,
  // so the "hook" silhouette is clear. Uses a wide-to-narrow stroke trick.
  // Path: starts at head top, goes straight up, then hooks left at the top.
  const wispPath = new Path2D();
  wispPath.moveTo(0, headY - headR);
  wispPath.bezierCurveTo(
     headR * 0.15, headY - headR * 2.5,  // ctrl1 — slight right lean
    -headR * 0.5,  headY - headR * 4.0,  // ctrl2 — bending left
    -headR * 1.5,  headY - headR * 5.2,  // tip — hooks far left
  );
  // Draw twice at different widths to create a tapered ribbon
  ctx.save();
  ctx.strokeStyle = BODY_BLACK;
  ctx.lineCap = "round";
  ctx.lineWidth = headR * 0.55;  // base width
  ctx.stroke(wispPath);
  ctx.restore();

  // Head
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Slim torso
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.6, neckY);
  ctx.lineTo( bodyW * 0.6, neckY);
  ctx.lineTo( bodyW * 0.7, h * 0.3);
  ctx.lineTo(-bodyW * 0.7, h * 0.3);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.5, h * 0.28);
  ctx.lineTo(-bodyW * 0.7, h * 0.5);
  ctx.lineTo(-bodyW * 0.25, h * 0.5);
  ctx.lineTo(-bodyW * 0.15, h * 0.28);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo( bodyW * 0.5, h * 0.28);
  ctx.lineTo( bodyW * 0.7, h * 0.5);
  ctx.lineTo( bodyW * 0.25, h * 0.5);
  ctx.lineTo( bodyW * 0.15, h * 0.28);
  ctx.closePath();
  ctx.fill();

  // Arms — one reaching forward (holding rope)
  ctx.strokeStyle = BODY_BLACK;
  ctx.lineWidth = bodyW * 0.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.6, -h * 0.05);
  ctx.lineTo(-bodyW * 1.5, h * 0.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo( bodyW * 0.6, -h * 0.05);
  ctx.lineTo( bodyW * 2.0, h * 0.05);
  ctx.stroke();

  // Cold blue inner glow radiating from chest
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 0.3);
  glow.addColorStop(0, accent + "cc");
  glow.addColorStop(0.5, accent + "66");
  glow.addColorStop(1, "transparent");
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = glow;
  ctx.fillRect(-h * 0.5, -h * 0.6, h, h * 1.2);
  ctx.restore();

  // Two small white pinprick eyes
  const jitterX = (Math.random() - 0.5) * 1.5;
  const jitterY = (Math.random() - 0.5) * 1.5;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(-headR * 0.35 + jitterX, headY - headR * 0.05 + jitterY, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( headR * 0.35 + jitterX, headY - headR * 0.05 + jitterY, 2.5, 0, Math.PI * 2); ctx.fill();
}

function drawSelfCriticism(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Short squat rounded blob — as wide as tall. Cyclops eye + open mouth with teeth.
  const rx = h * 0.48;
  const ry = h * 0.44;

  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Small stubby legs at bottom
  ctx.beginPath();
  ctx.ellipse(-rx * 0.35, ry * 0.85, rx * 0.2, ry * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse( rx * 0.35, ry * 0.85, rx * 0.2, ry * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // One giant cyclops eye — upper center
  const eyeR = h * 0.18;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(0, -ry * 0.25, eyeR, 0, Math.PI * 2); ctx.fill();

  // Dark iris/pupil
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath(); ctx.arc(h * 0.03, -ry * 0.25, eyeR * 0.55, 0, Math.PI * 2); ctx.fill();

  // Eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(-eyeR * 0.3, -ry * 0.25 - eyeR * 0.3, eyeR * 0.18, 0, Math.PI * 2); ctx.fill();

  // Wide open mouth — pink interior with white rectangular teeth
  const mouthY = ry * 0.2;
  const mouthW = rx * 0.72;
  const mouthH = ry * 0.3;

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-mouthW, mouthY);
  ctx.lineTo( mouthW, mouthY);
  ctx.lineTo( mouthW * 0.9, mouthY + mouthH);
  ctx.lineTo(-mouthW * 0.9, mouthY + mouthH);
  ctx.closePath();
  ctx.fill();

  // Rectangular teeth along top of mouth
  ctx.fillStyle = "#ffffff";
  const toothCount = 7;
  const toothW = (mouthW * 1.6) / (toothCount * 2);
  for (let i = 0; i < toothCount; i++) {
    const tx = -mouthW * 0.8 + i * (mouthW * 1.6 / toothCount) + toothW * 0.1;
    ctx.fillRect(tx, mouthY + 1, toothW * 1.8, mouthH * 0.45);
  }
}

function drawShame(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Round sphere body, arms wrapped tight around itself, violet glow peeking through.
  const r = h * 0.42;

  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // Wrapped arms — thick arcs crossing the front of the body
  ctx.strokeStyle = BODY_BLACK;
  ctx.lineWidth = r * 0.38;
  ctx.lineCap = "round";

  // Left arm wrapping rightward
  ctx.beginPath();
  ctx.arc(-r * 0.1, r * 0.05, r * 0.75, Math.PI * 0.55, Math.PI * 1.0);
  ctx.stroke();

  // Right arm wrapping leftward
  ctx.beginPath();
  ctx.arc( r * 0.1, r * 0.05, r * 0.75, Math.PI * 0.0, Math.PI * 0.45);
  ctx.stroke();

  // Violet inner glow peeking from inside/below the wrapped arms — radial from core
  const glowGrad = ctx.createRadialGradient(0, r * 0.15, 0, 0, r * 0.15, r * 0.85);
  glowGrad.addColorStop(0, accent + "99");
  glowGrad.addColorStop(0.45, accent + "55");
  glowGrad.addColorStop(1, "transparent");
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = glowGrad;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();

  // Sad downcast eyes — small glints visible above the wrapped arms
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.18, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.22, -r * 0.18, 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDoubt(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Two heads on one humanoid body, facing OPPOSITE directions.
  const bodyW = h * 0.16;
  const headR = h * 0.16;
  const hipY = h * 0.25;

  ctx.fillStyle = BODY_BLACK;

  // Single torso
  ctx.beginPath();
  ctx.moveTo(-bodyW * 1.0, -h * 0.05);
  ctx.lineTo( bodyW * 1.0, -h * 0.05);
  ctx.lineTo( bodyW * 1.2, hipY);
  ctx.lineTo(-bodyW * 1.2, hipY);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.9, hipY - 2);
  ctx.lineTo(-bodyW * 1.5, h * 0.5);
  ctx.lineTo(-bodyW * 0.5, h * 0.5);
  ctx.lineTo(-bodyW * 0.2, hipY - 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo( bodyW * 0.9, hipY - 2);
  ctx.lineTo( bodyW * 1.5, h * 0.5);
  ctx.lineTo( bodyW * 0.5, h * 0.5);
  ctx.lineTo( bodyW * 0.2, hipY - 2);
  ctx.closePath();
  ctx.fill();

  // One arm going right (holding rope)
  ctx.strokeStyle = BODY_BLACK;
  ctx.lineWidth = bodyW * 0.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo( bodyW * 0.9, h * 0.05);
  ctx.lineTo( bodyW * 2.2, h * 0.15);
  ctx.stroke();

  // Left arm out to side
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.9, h * 0.05);
  ctx.lineTo(-bodyW * 2.0, h * 0.1);
  ctx.stroke();

  // LEFT head — faces LEFT (centered left of torso)
  const lhx = -headR * 0.7;
  const lhy = -h * 0.15 - headR;
  ctx.fillStyle = BODY_BLACK;
  ctx.beginPath(); ctx.arc(lhx, lhy, headR, 0, Math.PI * 2); ctx.fill();

  // RIGHT head — faces RIGHT (centered right of torso)
  const rhx = headR * 0.7;
  const rhy = -h * 0.15 - headR;
  ctx.beginPath(); ctx.arc(rhx, rhy, headR, 0, Math.PI * 2); ctx.fill();

  // LEFT head eyes (looking left / outward)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(lhx - headR * 0.4, lhy - headR * 0.1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(lhx - headR * 0.08, lhy - headR * 0.1, 2.5, 0, Math.PI * 2); ctx.fill();

  // RIGHT head eyes (looking right / outward)
  ctx.beginPath(); ctx.arc(rhx + headR * 0.4, rhy - headR * 0.1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rhx + headR * 0.08, rhy - headR * 0.1, 2.5, 0, Math.PI * 2); ctx.fill();

  // LEFT head open mouth — teal fill, facing left side
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(lhx - headR * 0.15, lhy + headR * 0.3, headR * 0.38, headR * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // RIGHT head open mouth — facing right side
  ctx.beginPath();
  ctx.ellipse(rhx + headR * 0.15, rhy + headR * 0.3, headR * 0.38, headR * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAnger(ctx: CanvasRenderingContext2D, h: number, accent: string): void {
  // Massive broad-shouldered hulking monster, hunched forward. Horns, red visor eye, big fists.
  const bodyW = h * 0.52;
  const headR = h * 0.2;
  const shoulderY = -h * 0.05;
  const hipY = h * 0.35;

  ctx.fillStyle = BODY_BLACK;

  // Massive trapezoid torso (wider at shoulders)
  ctx.beginPath();
  ctx.moveTo(-bodyW, shoulderY);
  ctx.lineTo( bodyW, shoulderY);
  ctx.lineTo( bodyW * 0.65, hipY);
  ctx.lineTo(-bodyW * 0.65, hipY);
  ctx.closePath();
  ctx.fill();

  // Legs — short and thick
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.55, hipY - 2);
  ctx.lineTo(-bodyW * 0.65, h * 0.5);
  ctx.lineTo(-bodyW * 0.2, h * 0.5);
  ctx.lineTo(-bodyW * 0.15, hipY - 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo( bodyW * 0.55, hipY - 2);
  ctx.lineTo( bodyW * 0.65, h * 0.5);
  ctx.lineTo( bodyW * 0.2, h * 0.5);
  ctx.lineTo( bodyW * 0.15, hipY - 2);
  ctx.closePath();
  ctx.fill();

  // Head — slightly forward/low on the body (hunched)
  ctx.beginPath();
  ctx.arc(0, shoulderY - headR * 0.85, headR, 0, Math.PI * 2);
  ctx.fill();

  // Two sharp horns — the ONLY hard edges in the roster
  const hornBase = shoulderY - headR * 0.85 - headR * 0.85;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, hornBase + 5);
  ctx.lineTo(-headR * 0.2, hornBase - headR * 0.9);
  ctx.lineTo(-headR * 0.75, hornBase - headR * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo( headR * 0.5, hornBase + 5);
  ctx.lineTo( headR * 0.2, hornBase - headR * 0.9);
  ctx.lineTo( headR * 0.75, hornBase - headR * 0.5);
  ctx.closePath();
  ctx.fill();

  // Red horizontal visor-bar eye across face
  const eyeY = shoulderY - headR * 0.85 - headR * 0.05;
  ctx.fillStyle = accent;
  ctx.fillRect(-headR * 0.6, eyeY - headR * 0.1, headR * 1.2, headR * 0.18);

  // Big round fists — at end of short arms
  const fistR = headR * 0.95;
  ctx.fillStyle = BODY_BLACK;

  // Left fist (arm extended out leftward)
  ctx.strokeStyle = BODY_BLACK;
  ctx.lineWidth = headR * 0.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.9, shoulderY + headR * 0.3);
  ctx.lineTo(-bodyW * 1.3, h * 0.2);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(-bodyW * 1.3, h * 0.2, fistR, 0, Math.PI * 2); ctx.fill();

  // Right fist (arm reaching forward — holding rope)
  ctx.beginPath();
  ctx.moveTo( bodyW * 0.9, shoulderY + headR * 0.3);
  ctx.lineTo( bodyW * 1.2, h * 0.15);
  ctx.stroke();
  ctx.beginPath(); ctx.arc( bodyW * 1.2, h * 0.15, fistR, 0, Math.PI * 2); ctx.fill();
}
