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
  ctx.fillStyle = "#252540";
  ctx.fillRect(0, 0, w, h * 0.8);
  ctx.fillStyle = "#2a1a0a";
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(0, h * 0.78, w, h * 0.03);
}

function drawWindow(ctx: CanvasRenderingContext2D, w: number, h: number, skyPhase: number): void {
  const wx = w * 0.65;
  const wy = h * 0.1;
  const ww = w * 0.18;
  const wh = h * 0.3;

  const skyTop = lerpColor("#0a0a2a", "#87CEEB", skyPhase);
  const skyBot = lerpColor("#1a1a3e", "#f0c060", Math.min(skyPhase * 1.5, 1));

  const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(wx, wy, ww, wh);

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

  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillRect(bx, by - h * 0.1, w * 0.03, bh + h * 0.1);
  ctx.fillRect(bx + bw - w * 0.02, by + h * 0.05, w * 0.03, bh - h * 0.05);

  ctx.fillStyle = "#4a6a9a";
  ctx.fillRect(bx + w * 0.03, by + h * 0.02, bw - w * 0.06, bh * 0.4);

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

  const cx = nx + nw * 0.1;
  const cy = ny + nh * 0.15;
  const cw = nw * 0.8;
  const ch = nh * 0.35;
  ctx.fillStyle = "#1a2a1a";
  ctx.fillRect(cx, cy, cw, ch);

  ctx.fillStyle = "#0f0";
  ctx.font = `${Math.max(10, w * 0.02)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(time, cx + cw / 2, cy + ch * 0.7);
  ctx.textAlign = "start";

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

  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(cx, cy, cw, ch);
  ctx.fillRect(cx - w * 0.02, cy - h * 0.1, w * 0.04, ch + h * 0.1);
  ctx.fillRect(cx + cw - w * 0.01, cy, w * 0.03, ch * 0.5);
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
