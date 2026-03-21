# Morning Choice Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a branching narrative lesson where a raccoon faces the morning alarm — stay in bed (inertia spiral) or get up (momentum builds) — with a spring-back drag interaction as the pivotal mechanic.

**Architecture:** Self-contained TypeScript module with its own state machine. Single persistent canvas for the room scene. Imports shared `drawRaccoon` and `TextBox`. No Game/SceneManager/Scene framework.

**Tech Stack:** TypeScript, Canvas 2D, Tween.js, Playwright for E2E tests.

**Spec:** `docs/superpowers/specs/2026-03-21-morning-choice-design.md`

---

### Task 1: Page Scaffolding

**Files:**
- Create: `lessons/morning-choice/index.html`
- Create: `src/lessons/morning-choice/main.ts`
- Modify: `vite.config.ts`
- Modify: `index.html` (hub page)

- [ ] **Step 1: Create the HTML page**

Create `lessons/morning-choice/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Morning Choice — Explorable Explanations</title>
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <header id="header">
    <span class="header-title">
      <a href="/" style="color:inherit;text-decoration:none">Explorable Explanations</a> / The Morning Choice
    </span>
    <a id="about-link" href="#">About</a>
  </header>

  <div id="about-modal" class="modal-hidden">
    <div class="modal-backdrop"></div>
    <div class="modal-card">
      <button id="modal-close">&times;</button>
      <h2>The Morning Choice</h2>
      <p>An interactive exploration of inertia and momentum. The alarm goes off — do you get up or hit snooze? Watch two mornings diverge from the same starting point.</p>
      <p class="tech-note">Built with HTML Canvas — all graphics are procedurally drawn, no sprites or images.</p>
      <p><a href="https://github.com/idvorkin-ai-tools/activation-energy-game" target="_blank" rel="noopener">View source on GitHub</a></p>
    </div>
  </div>

  <div id="game"></div>
  <script type="module" src="/src/lessons/morning-choice/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Create the minimal TypeScript entry**

Create `src/lessons/morning-choice/main.ts`:

```typescript
import "../../style.css";

const modal = document.getElementById("about-modal")!;
document.getElementById("about-link")!.addEventListener("click", (e) => {
  e.preventDefault();
  modal.classList.remove("modal-hidden");
});
document.getElementById("modal-close")!.addEventListener("click", () => {
  modal.classList.add("modal-hidden");
});
modal.querySelector(".modal-backdrop")!.addEventListener("click", () => {
  modal.classList.add("modal-hidden");
});

const gameEl = document.getElementById("game")!;
gameEl.innerHTML = "<p style='color:#e0e0ff;text-align:center;margin-top:4rem'>Morning Choice — coming soon</p>";
```

- [ ] **Step 3: Add Vite entry**

In `vite.config.ts`, add to `rollupOptions.input`:

```typescript
morningChoice: resolve(__dirname, "lessons/morning-choice/index.html"),
```

- [ ] **Step 4: Add hub card**

In `index.html`, add a card in the Lessons section:

```html
<a class="card" href="/lessons/morning-choice/">
  <h3>The Morning Choice</h3>
  <p>A branching story about inertia and momentum. Get up or snooze — watch the spiral unfold.</p>
  <span class="tag tag-lesson">Lesson</span>
</a>
```

- [ ] **Step 5: Verify page loads**

Run: `npm run dev`
Open: `http://localhost:5180/lessons/morning-choice/`
Expected: Page loads with header, "coming soon" placeholder, About modal works.

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: Builds without errors.

- [ ] **Step 7: Commit**

```bash
git add lessons/morning-choice/index.html src/lessons/morning-choice/main.ts vite.config.ts index.html
git commit -m "feat(morning-choice): scaffold page with header, about modal, hub card"
```

---

### Task 2: State Machine Types & Beat Data

**Files:**
- Create: `src/lessons/morning-choice/beats.ts`
- Create: `src/lessons/morning-choice/types.ts`

- [ ] **Step 1: Define types**

Create `src/lessons/morning-choice/types.ts`:

```typescript
import type { ExpressionName } from "../../characters/expressions";

export interface SceneUpdate {
  raccoonPos: { x: number; y: number; rotation: number };
  skyPhase: number;
  showEasyChair: boolean;
  showPhone: boolean;
  showAlarmRing: boolean;
}

export interface Beat {
  id: string;
  time: string;
  energy: number;
  narration: string;
  expression: ExpressionName;
  choices?: {
    stay: { label: string; next: string };
    go: { label: string };
  };
  scene: SceneUpdate;
  autoAdvanceMs?: number;
}

export interface GameState {
  currentBeatId: string;
  energy: number;
  exitBeatId: string | null;
}
```

- [ ] **Step 2: Define all beats**

Create `src/lessons/morning-choice/beats.ts`:

```typescript
import type { Beat } from "./types";

export const BEATS: Record<string, Beat> = {
  alarm: {
    id: "alarm",
    time: "6:00 AM",
    energy: 70,
    narration: "Saturday. 6:00 AM. The alarm screams. Your eyes crack open. Everything in your body says: not yet.",
    expression: "tired",
    choices: {
      stay: { label: "5 more minutes", next: "secondAlarm" },
      go: { label: "Get up" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: true,
    },
  },
  secondAlarm: {
    id: "secondAlarm",
    time: "6:15 AM",
    energy: 55,
    narration: "The alarm again. You slap it off. Your body feels heavier than before. Just... a little more.",
    expression: "tired",
    choices: {
      stay: { label: "Just a bit more", next: "lyingAwake" },
      go: { label: "Force yourself up" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0.15,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: true,
    },
  },
  lyingAwake: {
    id: "lyingAwake",
    time: "6:45 AM",
    energy: 40,
    narration: "You're awake now. Fully awake. Staring at the ceiling. Not sleeping. Not up. Just... stuck.",
    expression: "stressed",
    choices: {
      stay: { label: "Check phone", next: "phoneScroll" },
      go: { label: "Come on, get up" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0.35,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
  },
  phoneScroll: {
    id: "phoneScroll",
    time: "7:30 AM",
    energy: 25,
    narration: "You grab your phone. Just to check one thing. An hour evaporates. You didn't even enjoy it.",
    expression: "desperate",
    choices: {
      stay: { label: "Keep scrolling", next: "easyChair" },
      go: { label: "You can do this" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0.55,
      showEasyChair: false,
      showPhone: true,
      showAlarmRing: false,
    },
  },
  easyChair: {
    id: "easyChair",
    time: "9:00 AM",
    energy: 10,
    narration: "You drag yourself to the easy chair. Coffee in one hand, phone in the other. The morning is gone.",
    expression: "desperate",
    scene: {
      raccoonPos: { x: 0.4, y: 0.6, rotation: 0 },
      skyPhase: 0.8,
      showEasyChair: true,
      showPhone: true,
      showAlarmRing: false,
    },
    autoAdvanceMs: 3000,
  },
  outOfBed: {
    id: "outOfBed",
    time: "",
    energy: 0,
    narration: "Feet on the floor. That was the hardest part. Already, something shifts.",
    expression: "tired",
    scene: {
      raccoonPos: { x: 0.45, y: 0.7, rotation: 0 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2000,
  },
  shoesOn: {
    id: "shoesOn",
    time: "",
    energy: 0,
    narration: "Shoes on. Door open. The cool air hits your face. You're moving.",
    expression: "neutral",
    scene: {
      raccoonPos: { x: 0.65, y: 0.7, rotation: 0 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2000,
  },
  atGym: {
    id: "atGym",
    time: "",
    energy: 0,
    narration: "At the gym. Your body wakes up. Energy you didn't know you had starts flowing.",
    expression: "energized",
    scene: {
      raccoonPos: { x: 0.5, y: 0.7, rotation: 0 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2000,
  },
  coffeeShop: {
    id: "coffeeShop",
    time: "",
    energy: 0,
    narration: "Coffee shop. Notebook open. The morning is yours. You earned this.",
    expression: "happy",
    scene: {
      raccoonPos: { x: 0.5, y: 0.7, rotation: 0 },
      skyPhase: 1,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2500,
  },
  reflection: {
    id: "reflection",
    time: "",
    energy: 0,
    narration: "Same raccoon. Same Saturday. Same 70 energy at 6:00 AM.\nThe difference wasn't motivation — it was inertia.\nThe hard part was the first 30 seconds after the alarm.",
    expression: "neutral",
    scene: {
      raccoonPos: { x: 0.5, y: 0.7, rotation: 0 },
      skyPhase: 1,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
  },
};

export const GO_PATH_ENERGY_GAINS: Record<string, number> = {
  outOfBed: 5,
  shoesOn: 10,
  atGym: 20,
  coffeeShop: 15,
};

export const GO_PATH_TIME_OFFSETS: Record<string, number> = {
  outOfBed: 0,
  shoesOn: 15,
  atGym: 60,
  coffeeShop: 90,
};

export const GO_PATH_ORDER = ["outOfBed", "shoesOn", "atGym", "coffeeShop", "reflection"];

export const STAY_BEAT_INERTIA: Record<string, number> = {
  alarm: 1,
  secondAlarm: 2,
  lyingAwake: 3,
  phoneScroll: 4,
};
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/morning-choice/types.ts src/lessons/morning-choice/beats.ts
git commit -m "feat(morning-choice): add state machine types and beat data"
```

---

### Task 3: Room Renderer

**Files:**
- Create: `src/lessons/morning-choice/room.ts`

The room renderer draws the persistent side-view bedroom scene on a canvas. It takes a `SceneUpdate` and renders all elements.

- [ ] **Step 1: Create the room renderer**

Create `src/lessons/morning-choice/room.ts`:

```typescript
import { drawRaccoon } from "../../characters/drawRaccoon";
import type { ExpressionName } from "../../characters/expressions";
import type { SceneUpdate } from "./types";

export interface RoomRenderState {
  scene: SceneUpdate;
  expression: ExpressionName;
  time: string;
  energy: number;
  inertia: number;
}

export function createRoomCanvas(container: HTMLElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.id = "room-canvas";
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
  canvas.style.maxWidth = "600px";
  canvas.style.width = "100%";
  container.appendChild(canvas);
  return canvas;
}

export function renderRoom(canvas: HTMLCanvasElement, state: RoomRenderState): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width * dpr;
  const H = (rect.width * 0.6) * dpr;

  canvas.width = W;
  canvas.height = H;
  canvas.style.height = `${rect.width * 0.6}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.width * 0.6;

  drawBackground(ctx, w, h);
  drawWindow(ctx, w, h, state.scene.skyPhase);
  drawBed(ctx, w, h);
  drawNightstand(ctx, w, h, state.time, state.scene.showAlarmRing);
  if (state.scene.showEasyChair) {
    drawEasyChair(ctx, w, h);
  }
  drawDoor(ctx, w, h);
  drawInertiaArrows(ctx, w, h, state.inertia, state.scene.raccoonPos);
  drawRaccoonInRoom(ctx, w, h, state.scene.raccoonPos, state.expression);
  if (state.scene.showPhone) {
    drawPhone(ctx, w, h, state.scene.raccoonPos);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Wall
  ctx.fillStyle = "#252540";
  ctx.fillRect(0, 0, w, h * 0.8);
  // Floor
  ctx.fillStyle = "#2a1a0a";
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
  // Baseboard
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(0, h * 0.78, w, h * 0.03);
}

function drawWindow(ctx: CanvasRenderingContext2D, w: number, h: number, skyPhase: number): void {
  const wx = w * 0.65;
  const wy = h * 0.1;
  const ww = w * 0.18;
  const wh = h * 0.3;

  // Sky gradient based on phase (0=dark, 0.5=dawn, 1=daylight)
  const skyTop = lerpColor("#0a0a2a", "#87CEEB", skyPhase);
  const skyBot = lerpColor("#1a1a3e", "#f0c060", Math.min(skyPhase * 1.5, 1));

  const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(wx, wy, ww, wh);

  // Window frame
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();

  // Stars (fade out as sky brightens)
  if (skyPhase < 0.5) {
    const alpha = 1 - skyPhase * 2;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    const stars = [
      [0.3, 0.2], [0.6, 0.35], [0.2, 0.7], [0.75, 0.15], [0.5, 0.6],
    ];
    for (const [sx, sy] of stars) {
      ctx.beginPath();
      ctx.arc(wx + ww * sx, wy + wh * sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBed(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bx = w * 0.08;
  const by = h * 0.5;
  const bw = w * 0.35;
  const bh = h * 0.3;

  // Frame
  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(bx, by, bw, bh);
  // Headboard
  ctx.fillRect(bx, by - h * 0.1, w * 0.03, bh + h * 0.1);
  // Footboard
  ctx.fillRect(bx + bw - w * 0.02, by + h * 0.05, w * 0.03, bh - h * 0.05);

  // Mattress
  ctx.fillStyle = "#4a6a9a";
  ctx.fillRect(bx + w * 0.03, by + h * 0.02, bw - w * 0.06, bh * 0.4);

  // Pillow
  ctx.fillStyle = "#ddd";
  ctx.beginPath();
  ctx.ellipse(bx + w * 0.08, by + h * 0.08, w * 0.05, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawNightstand(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  time: string, alarmRing: boolean
): void {
  const nx = w * 0.44;
  const ny = h * 0.6;
  const nw = w * 0.08;
  const nh = h * 0.2;

  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(nx, ny, nw, nh);

  // Clock face
  const cx = nx + nw * 0.1;
  const cy = ny + nh * 0.15;
  const cw = nw * 0.8;
  const ch = nh * 0.35;
  ctx.fillStyle = "#1a2a1a";
  ctx.fillRect(cx, cy, cw, ch);

  // Time text
  ctx.fillStyle = "#0f0";
  ctx.font = `${Math.max(10, w * 0.02)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(time, cx + cw / 2, cy + ch * 0.7);
  ctx.textAlign = "start";

  // Alarm ring indicator
  if (alarmRing) {
    ctx.strokeStyle = "#ff0";
    ctx.lineWidth = 1.5;
    const rcx = cx + cw / 2;
    const rcy = cy - 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(rcx, rcy, 4 + i * 3, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
    }
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const dx = w * 0.88;
  const dy = h * 0.2;
  const dw = w * 0.08;
  const dh = h * 0.58;

  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(dx, dy, dw, dh);
  // Doorknob
  ctx.fillStyle = "#daa520";
  ctx.beginPath();
  ctx.arc(dx + dw * 0.75, dy + dh * 0.55, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawEasyChair(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.55;
  const cy = h * 0.55;
  const cw = w * 0.12;
  const ch = h * 0.25;

  // Seat
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(cx, cy, cw, ch);
  // Back
  ctx.fillRect(cx - w * 0.02, cy - h * 0.1, w * 0.04, ch + h * 0.1);
  // Arm
  ctx.fillRect(cx + cw - w * 0.01, cy, w * 0.03, ch * 0.5);
  // Cushion
  ctx.fillStyle = "#6a5a4a";
  ctx.fillRect(cx + w * 0.01, cy + h * 0.02, cw - w * 0.03, ch * 0.35);
}

function drawRaccoonInRoom(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  pos: { x: number; y: number; rotation: number },
  expression: ExpressionName
): void {
  const px = w * pos.x;
  const py = h * pos.y;
  const size = Math.min(w * 0.15, 100);

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate((pos.rotation * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);
  drawRaccoon(ctx, size, size, expression);
  ctx.restore();
}

function drawPhone(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  raccoonPos: { x: number; y: number; rotation: number }
): void {
  const px = w * raccoonPos.x + w * 0.06;
  const py = h * raccoonPos.y - h * 0.02;

  ctx.fillStyle = "#222";
  ctx.fillRect(px, py, w * 0.03, h * 0.05);
  // Screen glow
  ctx.fillStyle = "#4488ff";
  ctx.fillRect(px + 1, py + 1, w * 0.03 - 2, h * 0.05 - 2);
}

function drawInertiaArrows(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  inertia: number, raccoonPos: { x: number; y: number; rotation: number }
): void {
  if (inertia <= 0) return;

  const px = w * raccoonPos.x;
  const py = h * raccoonPos.y + h * 0.1;

  for (let i = 0; i < inertia; i++) {
    const size = 6 + i * 2;
    const alpha = 0.3 + i * 0.15;
    const red = Math.min(255, 150 + i * 35);
    ctx.fillStyle = `rgba(${red},60,60,${alpha})`;
    ctx.beginPath();
    const ay = py + i * 12;
    ctx.moveTo(px - size, ay);
    ctx.lineTo(px + size, ay);
    ctx.lineTo(px, ay + size * 1.5);
    ctx.closePath();
    ctx.fill();
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lessons/morning-choice/room.ts
git commit -m "feat(morning-choice): add room renderer with sky, bed, furniture, raccoon"
```

---

### Task 4: Energy Bar Component

**Files:**
- Create: `src/lessons/morning-choice/energy-bar.ts`

A self-contained energy bar for this lesson. Simpler than WillpowerBar — just an HTML div with animated width.

- [ ] **Step 1: Create the energy bar**

Create `src/lessons/morning-choice/energy-bar.ts`:

```typescript
export class EnergyBar {
  readonly el: HTMLDivElement;
  private fill: HTMLDivElement;
  private label: HTMLSpanElement;
  private _value = 70;
  private _max = 100;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "mc-energy-bar";
    this.el.innerHTML = `
      <span class="mc-energy-label">Energy: 70</span>
      <div class="mc-energy-track">
        <div class="mc-energy-fill" style="width:70%"></div>
      </div>
    `;
    this.fill = this.el.querySelector(".mc-energy-fill")!;
    this.label = this.el.querySelector(".mc-energy-label")!;

    const style = document.createElement("style");
    style.textContent = `
      .mc-energy-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        max-width: 600px;
        margin: 0 auto;
      }
      .mc-energy-label {
        color: #e0e0ff;
        font-size: 14px;
        min-width: 80px;
        font-family: monospace;
      }
      .mc-energy-track {
        flex: 1;
        height: 16px;
        background: #333;
        border-radius: 8px;
        overflow: hidden;
      }
      .mc-energy-fill {
        height: 100%;
        border-radius: 8px;
        transition: width 0.8s ease, background-color 0.8s ease;
      }
    `;
    this.el.appendChild(style);
    this.updateColor();
  }

  get value(): number { return this._value; }

  setValue(v: number): void {
    this._value = Math.max(0, Math.min(this._max, v));
    this.fill.style.width = `${(this._value / this._max) * 100}%`;
    this.label.textContent = `Energy: ${this._value}`;
    this.updateColor();
  }

  private updateColor(): void {
    const pct = this._value / this._max;
    let color: string;
    if (pct > 0.6) color = "#4a4";
    else if (pct > 0.3) color = "#aa4";
    else if (pct > 0.15) color = "#c84";
    else color = "#c44";
    this.fill.style.backgroundColor = color;
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lessons/morning-choice/energy-bar.ts
git commit -m "feat(morning-choice): add energy bar component"
```

---

### Task 5: Game Controller (State Machine + UI Wiring)

**Files:**
- Create: `src/lessons/morning-choice/time-utils.ts`
- Create: `src/lessons/morning-choice/game.ts`
- Modify: `src/lessons/morning-choice/main.ts`

This is the core: the state machine that transitions between beats, renders the room, shows choices, and handles the flow.

- [ ] **Step 1: Create the game controller**

Create `src/lessons/morning-choice/time-utils.ts` (shared by game.ts and room.ts):

```typescript
export function parseTime(time: string): number {
  const match = time.match(/(\d+):(\d+)/);
  if (!match) return 360;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (time.includes("PM") && h < 12) h += 12;
  if (time.includes("AM") && h === 12) h = 0;
  return h * 60 + m;
}

export function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function skyPhaseForTime(totalMinutes: number): number {
  // Sky: 360min(6am)=0, 480min(8am)=0.7, 540min(9am)=1
  return Math.min(1, Math.max(0, (totalMinutes - 360) / 180));
}
```

Create `src/lessons/morning-choice/game.ts`:

```typescript
import type { Beat, GameState, SceneUpdate } from "./types";
import { BEATS, GO_PATH_ORDER, GO_PATH_ENERGY_GAINS, GO_PATH_TIME_OFFSETS, STAY_BEAT_INERTIA } from "./beats";
import { createRoomCanvas, renderRoom } from "./room";
import { EnergyBar } from "./energy-bar";
import { drawRaccoon } from "../../characters/drawRaccoon";
import { parseTime, formatTime, skyPhaseForTime } from "./time-utils";

export class MorningChoiceGame {
  private canvas: HTMLCanvasElement;
  private energyBar: EnergyBar;
  private narrativeEl: HTMLDivElement;
  private choicesEl: HTMLDivElement;
  private state: GameState;
  private container: HTMLElement;
  // Runtime overrides for go-path beats (avoids mutating BEATS)
  private goPathOverrides: Map<string, { time: string; skyPhase: number }> = new Map();
  private typewriterInterval: ReturnType<typeof setInterval> | null = null;
  private reflectionEl: HTMLDivElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    container.innerHTML = "";
    container.style.padding = "0";

    // Energy bar
    this.energyBar = new EnergyBar();
    container.appendChild(this.energyBar.el);

    // Room canvas
    this.canvas = createRoomCanvas(container);

    // Narrative text
    this.narrativeEl = document.createElement("div");
    this.narrativeEl.className = "mc-narrative";
    container.appendChild(this.narrativeEl);

    // Choice buttons
    this.choicesEl = document.createElement("div");
    this.choicesEl.className = "mc-choices";
    container.appendChild(this.choicesEl);

    // Inject styles
    const style = document.createElement("style");
    style.textContent = `
      .mc-narrative {
        max-width: 600px;
        margin: 16px auto;
        padding: 0 16px;
        color: #e0e0ff;
        font-size: 18px;
        line-height: 1.6;
        min-height: 60px;
        text-align: center;
      }
      .mc-choices {
        display: flex;
        gap: 16px;
        justify-content: center;
        max-width: 600px;
        margin: 12px auto;
        padding: 0 16px;
      }
      .mc-btn {
        padding: 12px 24px;
        border: 1px solid #555;
        border-radius: 8px;
        background: #2a2a4e;
        color: #e0e0ff;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
        flex: 1;
        max-width: 240px;
      }
      .mc-btn:hover {
        background: #3a3a6e;
        border-color: #888;
      }
      .mc-btn-stay {
        border-color: #664444;
      }
      .mc-btn-stay:hover {
        background: #3a2a2a;
      }
      .mc-btn-go {
        border-color: #446644;
      }
      .mc-btn-go:hover {
        background: #2a3a2a;
      }
      .mc-retry {
        display: block;
        margin: 24px auto;
        padding: 12px 32px;
        border: 1px solid #555;
        border-radius: 8px;
        background: #2a2a4e;
        color: #e0e0ff;
        font-size: 16px;
        cursor: pointer;
      }
      .mc-retry:hover {
        background: #3a3a6e;
      }
    `;
    container.appendChild(style);

    // Init state
    this.state = {
      currentBeatId: "alarm",
      energy: 70,
      exitBeatId: null,
    };

    // Handle resize
    window.addEventListener("resize", () => this.render());

    this.enterBeat("alarm");
  }

  private isGoPathBeat(beatId: string): boolean {
    return GO_PATH_ORDER.includes(beatId);
  }

  private enterBeat(beatId: string): void {
    const beat = BEATS[beatId];
    if (!beat) return;

    this.state.currentBeatId = beatId;

    // Update energy based on path
    if (this.isGoPathBeat(beatId)) {
      const gain = GO_PATH_ENERGY_GAINS[beatId];
      if (gain) {
        this.state.energy = Math.min(100, this.state.energy + gain);
      }
    } else if (beat.energy > 0) {
      // Stay path: energy is absolute from beat data
      this.state.energy = beat.energy;
    }

    this.energyBar.setValue(this.state.energy);
    this.render();
    this.showNarrative(beat);

    // Reflection beat is handled specially — no choices, no auto-advance
    if (beatId === "reflection") {
      this.showReflection();
      return;
    }

    this.showChoices(beat);

    // Auto-advance
    if (beat.autoAdvanceMs) {
      if (beatId === "easyChair") {
        setTimeout(() => this.enterBeat("reflection"), beat.autoAdvanceMs);
      } else {
        const nextIdx = GO_PATH_ORDER.indexOf(beatId) + 1;
        if (nextIdx > 0 && nextIdx < GO_PATH_ORDER.length) {
          const nextId = GO_PATH_ORDER[nextIdx];
          this.computeGoPathOverrides(nextId);
          setTimeout(() => this.enterBeat(nextId), beat.autoAdvanceMs);
        }
      }
    }
  }

  private computeGoPathOverrides(beatId: string): void {
    if (!this.state.exitBeatId) return;
    const exitBeat = BEATS[this.state.exitBeatId];
    const offset = GO_PATH_TIME_OFFSETS[beatId] ?? 0;
    const exitMinutes = parseTime(exitBeat.time);
    const totalMinutes = exitMinutes + offset;
    this.goPathOverrides.set(beatId, {
      time: formatTime(totalMinutes),
      skyPhase: skyPhaseForTime(totalMinutes),
    });
  }

  private getEffectiveTime(beatId: string): string {
    return this.goPathOverrides.get(beatId)?.time ?? BEATS[beatId]?.time ?? "";
  }

  private getEffectiveScene(beatId: string): SceneUpdate {
    const beat = BEATS[beatId];
    if (!beat) return BEATS["alarm"].scene;
    const override = this.goPathOverrides.get(beatId);
    if (override) {
      return { ...beat.scene, skyPhase: override.skyPhase };
    }
    return beat.scene;
  }

  private render(): void {
    const beat = BEATS[this.state.currentBeatId];
    if (!beat) return;

    const inertia = STAY_BEAT_INERTIA[this.state.currentBeatId] ?? 0;

    renderRoom(this.canvas, {
      scene: this.getEffectiveScene(this.state.currentBeatId),
      expression: beat.expression,
      time: this.getEffectiveTime(this.state.currentBeatId),
      energy: this.state.energy,
      inertia,
    });
  }

  private showNarrative(beat: Beat): void {
    // Clear any existing typewriter
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    this.narrativeEl.textContent = "";
    const text = beat.narration;
    let i = 0;
    this.typewriterInterval = setInterval(() => {
      if (i < text.length) {
        this.narrativeEl.textContent += text[i];
        i++;
      } else {
        clearInterval(this.typewriterInterval!);
        this.typewriterInterval = null;
      }
    }, 30);
  }

  private showChoices(beat: Beat): void {
    this.choicesEl.innerHTML = "";

    if (!beat.choices) return;

    const stayBtn = document.createElement("button");
    stayBtn.className = "mc-btn mc-btn-stay";
    stayBtn.textContent = beat.choices.stay.label;
    stayBtn.addEventListener("click", () => {
      this.enterBeat(beat.choices!.stay.next);
    });

    const goBtn = document.createElement("button");
    goBtn.className = "mc-btn mc-btn-go";
    goBtn.textContent = beat.choices.go.label;
    goBtn.addEventListener("click", () => {
      this.state.exitBeatId = this.state.currentBeatId;
      this.startDrag();
    });

    this.choicesEl.appendChild(stayBtn);
    this.choicesEl.appendChild(goBtn);
  }

  startDrag(): void {
    // Placeholder: skip drag for now, go straight to go path
    this.choicesEl.innerHTML = "";
    this.computeGoPathOverrides("outOfBed");
    this.enterBeat("outOfBed");
  }

  private showReflection(): void {
    this.choicesEl.innerHTML = "";
    this.canvas.style.display = "none";

    // Clean up old reflection if retrying
    this.reflectionEl?.remove();

    const isStayEnd = this.state.exitBeatId === null;
    const goEnergy = isStayEnd ? null : this.state.energy;
    const goTime = isStayEnd ? null : this.getEffectiveTime("coffeeShop");

    const reflectionEl = document.createElement("div");
    this.reflectionEl = reflectionEl;
    reflectionEl.className = "mc-reflection";
    reflectionEl.style.cssText = `
      max-width: 600px;
      margin: 16px auto;
      padding: 0 16px;
    `;

    reflectionEl.innerHTML = `
      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:24px">
        <div style="flex:1;text-align:center">
          <canvas id="reflect-stay" width="150" height="150" style="border-radius:8px;background:#1a1a2e"></canvas>
          <p style="color:#c44;font-size:14px;margin-top:8px">Energy: 10<br>9:00 AM in the chair</p>
        </div>
        <div style="flex:1;text-align:center">
          <canvas id="reflect-go" width="150" height="150" style="border-radius:8px;background:#1a1a2e"></canvas>
          <p style="color:#4a4;font-size:14px;margin-top:8px">Energy: ${goEnergy ?? 100}<br>${goTime ?? "7:30 AM"} — morning is yours</p>
        </div>
      </div>
    `;
    this.container.insertBefore(reflectionEl, this.narrativeEl);

    // Draw stay raccoon (desperate)
    const stayCanvas = document.getElementById("reflect-stay") as HTMLCanvasElement;
    const stayCtx = stayCanvas.getContext("2d")!;
    drawRaccoon(stayCtx, 150, 150, "desperate");

    // Draw go raccoon
    const goCanvas = document.getElementById("reflect-go") as HTMLCanvasElement;
    const goCtx = goCanvas.getContext("2d")!;
    const goExpr = (goEnergy ?? 100) >= 80 ? "energized" : "happy";
    drawRaccoon(goCtx, 150, 150, goExpr);

    // Retry button
    const retryBtn = document.createElement("button");
    retryBtn.className = "mc-retry";
    retryBtn.textContent = "Try again?";
    retryBtn.addEventListener("click", () => {
      reflectionEl.remove();
      this.reflectionEl = null;
      this.canvas.style.display = "block";
      this.goPathOverrides.clear();
      this.state = { currentBeatId: "alarm", energy: 70, exitBeatId: null };
      this.enterBeat("alarm");
    });

    setTimeout(() => {
      this.choicesEl.appendChild(retryBtn);
    }, 3000);
  }
}
```

- [ ] **Step 2: Wire up main.ts**

Replace the placeholder in `src/lessons/morning-choice/main.ts`:

```typescript
import "../../style.css";
import { MorningChoiceGame } from "./game";

// About modal
const modal = document.getElementById("about-modal")!;
document.getElementById("about-link")!.addEventListener("click", (e) => {
  e.preventDefault();
  modal.classList.remove("modal-hidden");
});
document.getElementById("modal-close")!.addEventListener("click", () => {
  modal.classList.add("modal-hidden");
});
modal.querySelector(".modal-backdrop")!.addEventListener("click", () => {
  modal.classList.add("modal-hidden");
});

// Start game
const gameEl = document.getElementById("game")!;
new MorningChoiceGame(gameEl);
```

- [ ] **Step 3: Verify it compiles and loads**

Run: `npx tsc --noEmit`
Run: `npm run dev`
Open: `http://localhost:5180/lessons/morning-choice/`
Expected: Room renders, energy bar shows, narrative types out, choice buttons work, clicking through stay path works, go path auto-advances.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/morning-choice/time-utils.ts src/lessons/morning-choice/game.ts src/lessons/morning-choice/main.ts
git commit -m "feat(morning-choice): add game controller with state machine and UI"
```

---

### Task 6: Drag Interaction

**Files:**
- Create: `src/lessons/morning-choice/drag.ts`
- Modify: `src/lessons/morning-choice/game.ts`

The signature mechanic: drag the raccoon out of bed with spring-back physics.

- [ ] **Step 1: Create the drag interaction module**

Create `src/lessons/morning-choice/drag.ts`:

```typescript
export interface DragConfig {
  canvas: HTMLCanvasElement;
  startX: number;
  startY: number;
  thresholdX: number;
  springK: number;
  onProgress: (x: number, y: number) => void;
  onComplete: () => void;
  onSnapBack: () => void;
}

export function startDragInteraction(config: DragConfig): () => void {
  const { canvas, startX, startY, thresholdX, springK, onProgress, onComplete, onSnapBack } = config;

  let isDragging = false;
  let currentX = startX;
  let currentY = startY;
  let offsetX = 0;
  let offsetY = 0;
  let animId = 0;

  function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: MouseEvent | TouchEvent) {
    const pos = getPos(e);
    const raccoonSize = Math.min(canvas.getBoundingClientRect().width * 0.15, 100);
    const dist = Math.hypot(pos.x - currentX, pos.y - currentY);
    if (dist > raccoonSize) return;

    isDragging = true;
    offsetX = currentX - pos.x;
    offsetY = currentY - pos.y;
    e.preventDefault();
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    const pos = getPos(e);
    currentX = pos.x + offsetX;
    currentY = pos.y + offsetY;
    onProgress(currentX, currentY);
    e.preventDefault();
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;

    if (currentX >= thresholdX) {
      onComplete();
    } else {
      // Spring back
      springBack();
    }
  }

  function springBack() {
    const targetX = startX;
    const targetY = startY;
    let vx = 0;
    const damping = 0.85;

    function animate() {
      const dx = currentX - targetX;
      const force = -springK * dx;
      vx += force;
      vx *= damping;
      currentX += vx;
      currentY += (targetY - currentY) * 0.1;

      onProgress(currentX, currentY);

      if (Math.abs(dx) < 1 && Math.abs(vx) < 0.5) {
        currentX = targetX;
        currentY = targetY;
        onProgress(currentX, currentY);
        onSnapBack();
        return;
      }
      animId = requestAnimationFrame(animate);
    }
    animate();
  }

  // Add hint text
  const hint = document.createElement("div");
  hint.className = "mc-drag-hint";
  hint.textContent = "↔ Drag the raccoon to get up";
  hint.style.cssText = `
    text-align: center;
    color: #aaa;
    font-size: 14px;
    margin-top: 8px;
    animation: mc-pulse 1.5s ease-in-out infinite;
  `;
  canvas.parentElement?.insertBefore(hint, canvas.nextSibling);

  const pulseStyle = document.createElement("style");
  pulseStyle.textContent = `
    @keyframes mc-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `;
  canvas.parentElement?.appendChild(pulseStyle);

  canvas.addEventListener("mousedown", onPointerDown);
  canvas.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  canvas.addEventListener("touchstart", onPointerDown, { passive: false });
  canvas.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);

  // Cursor hint
  canvas.style.cursor = "grab";

  // Cleanup function
  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener("mousedown", onPointerDown);
    canvas.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("mouseup", onPointerUp);
    canvas.removeEventListener("touchstart", onPointerDown);
    canvas.removeEventListener("touchmove", onPointerMove);
    window.removeEventListener("touchend", onPointerUp);
    canvas.style.cursor = "";
    hint.remove();
    pulseStyle.remove();
  };
}
```

- [ ] **Step 2: Wire drag into game controller**

In `src/lessons/morning-choice/game.ts`, replace the `startDrag()` placeholder:

```typescript
import { startDragInteraction } from "./drag";
```

Replace the `startDrag` method:

```typescript
startDrag(): void {
  this.choicesEl.innerHTML = "";
  this.narrativeEl.textContent = "Drag yourself out of bed...";

  const beat = BEATS[this.state.currentBeatId];
  const inertia = STAY_BEAT_INERTIA[this.state.currentBeatId] ?? 1;
  const originalPos = { ...beat.scene.raccoonPos };

  let cleanup: (() => void) | null = null;
  // Store drag raccoon pos separately (don't mutate BEATS)
  let dragPos = { ...originalPos };

  cleanup = startDragInteraction({
    canvas: this.canvas,
    startX: this.canvas.getBoundingClientRect().width * originalPos.x,
    startY: this.canvas.getBoundingClientRect().width * 0.6 * originalPos.y,
    thresholdX: this.canvas.getBoundingClientRect().width * 0.6,
    springK: 0.02 + inertia * 0.015,
    onProgress: (x, y) => {
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width;
      const h = w * 0.6;
      const nx = x / w;
      const ny = y / h;
      const startPx = w * originalPos.x;
      const threshPx = w * 0.6;
      const progress = Math.min(1, Math.max(0, (x - startPx) / (threshPx - startPx)));
      const rotation = 90 * (1 - progress);
      dragPos = { x: nx, y: ny, rotation };
      // Render with drag position override
      renderRoom(this.canvas, {
        scene: { ...beat.scene, raccoonPos: dragPos },
        expression: beat.expression,
        time: this.getEffectiveTime(this.state.currentBeatId),
        energy: this.state.energy,
        inertia,
      });
    },
    onComplete: () => {
      cleanup?.();
      this.computeGoPathOverrides("outOfBed");
      this.enterBeat("outOfBed");
    },
    onSnapBack: () => {
      dragPos = { ...originalPos };
      this.render();
    },
  });
}
```

- [ ] **Step 3: Verify drag works**

Run: `npm run dev`
Open: `http://localhost:5180/lessons/morning-choice/`
Test: Click "Get up" at any beat, drag the raccoon rightward. Release early → snaps back. Drag past threshold → transitions to go path. Test at different beats — later beats should have stronger pull-back.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/morning-choice/drag.ts src/lessons/morning-choice/game.ts
git commit -m "feat(morning-choice): add spring-back drag interaction"
```

---

### Task 7: Polish — Transitions & Visual Feedback

**Files:**
- Modify: `src/lessons/morning-choice/game.ts`
- Modify: `src/lessons/morning-choice/room.ts`

Smooth transitions between beats, visual feedback on choices.

- [ ] **Step 1: Add fade transitions between beats**

In `game.ts`, wrap `enterBeat` with a fade:

```typescript
private async transitionToBeat(beatId: string): Promise<void> {
  this.narrativeEl.style.transition = "opacity 0.4s";
  this.choicesEl.style.transition = "opacity 0.4s";
  this.narrativeEl.style.opacity = "0";
  this.choicesEl.style.opacity = "0";

  await new Promise(r => setTimeout(r, 400));
  this.enterBeat(beatId);
  this.narrativeEl.style.opacity = "1";
  this.choicesEl.style.opacity = "1";
}
```

Update these specific call sites to use `this.transitionToBeat(...)` instead of `this.enterBeat(...)`:
- In `showChoices()`: the stay button click handler
- In `enterBeat()`: both `setTimeout` callbacks (easyChair → reflection, go-path auto-advance)
- In `startDrag()` `onComplete`: the transition to outOfBed

Keep `this.enterBeat(...)` for: initial load in the constructor, and the retry button click handler (which resets state first).

- [ ] **Step 2: Add clock color**

In `room.ts`, add `import { parseTime } from "./time-utils";` at the top.

In `drawNightstand`, color the clock text based on time:

```typescript
// Time color: white (early) → yellow (8:00+) → red (9:00+)
const minutes = parseTime(time);
let timeColor = "#fff";
if (minutes >= 540) timeColor = "#f44";
else if (minutes >= 480) timeColor = "#ff0";
ctx.fillStyle = timeColor;
```

- [ ] **Step 3: Verify polish**

Run: `npm run dev`
Expected: Smooth fades between beats, clock color changes as time progresses.

- [ ] **Step 4: Commit**

```bash
git add src/lessons/morning-choice/game.ts src/lessons/morning-choice/room.ts
git commit -m "feat(morning-choice): add beat transitions and clock coloring"
```

---

### Task 8: Verify Reflection Screen

The reflection screen is already implemented in the `showReflection()` method in `game.ts` (Task 5). This task is verification only.

- [ ] **Step 1: Verify reflection screen works for both paths**

Run: `npm run dev`
Open: `http://localhost:5180/lessons/morning-choice/`

Test stay-path ending:
- Click "5 more minutes" four times to reach easy chair
- Wait for auto-advance to reflection
- Expected: Side-by-side raccoons, stay outcome (10 energy, 9 AM), go outcome (100 energy), lesson text, retry button after 3s

Test go-path ending:
- Click "Get up" at any beat
- Wait for go-path auto-advance through all beats
- Expected: Same reflection screen but with actual go-path energy/time

Test retry:
- Click "Try again?"
- Expected: Game restarts at alarm beat, energy 70, room canvas visible again

---

### Task 9: E2E Tests

**Files:**
- Create: `tests/morning-choice.spec.ts`

- [ ] **Step 1: Write E2E tests**

Create `tests/morning-choice.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Morning Choice lesson", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/lessons/morning-choice/");
    await page.waitForTimeout(1000);
  });

  test("page loads with header and game", async ({ page }) => {
    await expect(page.locator("#header")).toBeVisible();
    await expect(page.locator("#room-canvas")).toBeVisible();
    await expect(page.locator(".mc-energy-bar")).toBeVisible();
  });

  test("about modal opens and closes", async ({ page }) => {
    await page.click("#about-link");
    await expect(page.locator("#about-modal")).not.toHaveClass(/modal-hidden/);
    await page.click("#modal-close");
    await expect(page.locator("#about-modal")).toHaveClass(/modal-hidden/);
  });

  test("initial state shows alarm beat", async ({ page }) => {
    await expect(page.locator(".mc-narrative")).toContainText("alarm");
    const buttons = page.locator(".mc-btn");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toContainText("5 more minutes");
    await expect(buttons.last()).toContainText("Get up");
  });

  test("stay path progresses through beats", async ({ page }) => {
    // Click stay through all beats
    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("alarm again", { ignoreCase: true });

    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("awake");

    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("phone");

    await page.click(".mc-btn-stay");
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("chair");
  });

  test("energy bar updates on stay path", async ({ page }) => {
    await expect(page.locator(".mc-energy-label")).toContainText("70");
    await page.click(".mc-btn-stay");
    await page.waitForTimeout(800);
    await expect(page.locator(".mc-energy-label")).toContainText("55");
  });

  test("go path leads to reflection", async ({ page }) => {
    // Click get up immediately
    await page.click(".mc-btn-go");
    // Wait for drag to complete (or skip if drag auto-completes in test)
    await page.waitForTimeout(10000);
    // Should eventually reach reflection
    await expect(page.locator(".mc-narrative")).toContainText("first 30 seconds", { timeout: 15000 });
  });

  test("retry button restarts the game", async ({ page }) => {
    // Quick path: stay all the way
    for (let i = 0; i < 4; i++) {
      await page.click(".mc-btn-stay");
      await page.waitForTimeout(600);
    }
    // Wait for auto-advance to reflection
    await page.waitForTimeout(5000);
    // Click retry
    await page.click(".mc-retry", { timeout: 10000 });
    await page.waitForTimeout(600);
    await expect(page.locator(".mc-narrative")).toContainText("alarm", { ignoreCase: true });
  });

  test("hub page has morning choice card", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('a[href="/lessons/morning-choice/"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText("Morning Choice");
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npx playwright test tests/morning-choice.spec.ts`
Expected: All tests pass.

- [ ] **Step 3: Fix any failures and re-run**

Adjust selectors or timeouts as needed based on actual DOM output.

- [ ] **Step 4: Commit**

```bash
git add tests/morning-choice.spec.ts
git commit -m "test(morning-choice): add E2E tests for page load, beats, energy, retry"
```

---

### Task 10: Build Verification & Final Check

**Files:** None new — verification only.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: No errors. Fix any that appear.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Full test suite**

Run: `npx playwright test`
Expected: All tests pass (both existing and new).

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Open: `http://localhost:5180/lessons/morning-choice/`
Verify:
- Room scene renders with bed, window, door
- Energy bar shows 70, green
- Narrative types out with typewriter effect
- Stay path: clicking "5 more minutes" progresses through all beats, energy drops, clock advances, sky brightens
- Drag: clicking "Get up" at any beat shows drag hint, can drag raccoon rightward, spring-back if released early, snaps to standing if past threshold
- Go path: auto-advances through shoes/gym/coffee shop, energy rises
- Reflection: side-by-side raccoons, lesson text, retry works
- About modal works
- Hub page card links correctly

Open: `http://localhost:5180/` (hub)
Verify: Morning Choice card appears in Lessons section.

- [ ] **Step 5: Final commit if any fixes**

```bash
git add -A
git commit -m "fix(morning-choice): address lint and test issues"
```
