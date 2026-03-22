import type { ExpressionName } from "../../characters/expressions";
import type { SceneUpdate } from "./types";
import { parseTime } from "./time-utils";
import { roundRect, lerpColor } from "../../scenes/utils";
import { drawGymScene } from "../../scenes/gym";
import { drawCoffeeShopScene } from "../../scenes/coffeeShop";
import { drawRaccoonComposite } from "../../scenes/raccoonComposite";
import { drawAlarmIntroScene } from "../../scenes/alarmIntro";

export interface RoomRenderState {
  scene: SceneUpdate;
  expression: ExpressionName;
  time: string;
  energy: number;
  inertia: number;
}

let alarmAnimId = 0;

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

export function stopRoomAnimation(): void {
  if (alarmAnimId) {
    cancelAnimationFrame(alarmAnimId);
    alarmAnimId = 0;
  }
}

function setupCanvas(canvas: HTMLCanvasElement, dpr: number): void {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.width * 0.6 * dpr;
  canvas.style.height = `${rect.width * 0.6}px`;
}

export function renderRoom(canvas: HTMLCanvasElement, state: RoomRenderState): void {
  stopRoomAnimation();
  const dpr = window.devicePixelRatio || 1;
  setupCanvas(canvas, dpr);

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.width * 0.6;

  const sceneType = state.scene.sceneType ?? "bedroom";

  if (sceneType === "alarmIntro") {
    // Animated alarm clock — runs its own RAF loop
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      setupCanvas(canvas, dpr);
      const actx = canvas.getContext("2d")!;
      actx.scale(dpr, dpr);
      drawAlarmIntroScene(actx, w, h, state.time, elapsed);
      alarmAnimId = requestAnimationFrame(animate);
    };
    animate();
    return;
  }

  if (sceneType === "gym") {
    drawGymScene(ctx, w, h, state.scene.skyPhase);
  } else if (sceneType === "coffeeShop") {
    drawCoffeeShopScene(ctx, w, h, state.scene.skyPhase);
  } else {
    drawBackground(ctx, w, h, state.scene.skyPhase);
    drawWindow(ctx, w, h, state.scene.skyPhase);
    drawBed(ctx, w, h);
    drawNightstand(ctx, w, h, state.time, state.scene.showAlarmRing);
    if (state.scene.showEasyChair) {
      drawEasyChair(ctx, w, h);
    }
    drawDoor(ctx, w, h);
    if (state.scene.showPhone) {
      drawPhone(ctx, w, h, state.scene.raccoonPos);
    }
    drawInertiaArrows(ctx, w, h, state.inertia, state.scene.raccoonPos);
  }

  drawRaccoonInRoom(ctx, w, h, state.scene.raccoonPos, state.expression);
}

// --- Background ---

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, skyPhase: number): void {
  const wallTop = lerpColor("#1e1e38", "#2a2a50", skyPhase);
  const wallBot = lerpColor("#252545", "#353565", skyPhase);
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  wallGrad.addColorStop(0, wallTop);
  wallGrad.addColorStop(1, wallBot);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.78);

  const floorGrad = ctx.createLinearGradient(0, h * 0.78, 0, h);
  floorGrad.addColorStop(0, "#3a2a1a");
  floorGrad.addColorStop(1, "#2a1a0a");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(0, h * 0.775, w, h * 0.025);
}

// --- Window ---

function drawWindow(ctx: CanvasRenderingContext2D, w: number, h: number, skyPhase: number): void {
  const wx = w * 0.62;
  const wy = h * 0.08;
  const ww = w * 0.22;
  const wh = h * 0.35;

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);

  const skyTop = lerpColor("#0a0a2a", "#87CEEB", skyPhase);
  const skyMid = lerpColor("#151535", "#a8d8ea", skyPhase);
  const skyBot = lerpColor("#1a1a3e", "#f0c060", Math.min(skyPhase * 1.5, 1));
  const grad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(0.6, skyMid);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(wx, wy, ww, wh);

  if (skyPhase > 0.2 && skyPhase < 0.7) {
    const glowAlpha = Math.sin((skyPhase - 0.2) * Math.PI / 0.5) * 0.4;
    const glow = ctx.createRadialGradient(wx + ww * 0.5, wy + wh * 0.85, 0, wx + ww * 0.5, wy + wh * 0.85, ww * 0.6);
    glow.addColorStop(0, `rgba(255,200,100,${glowAlpha})`);
    glow.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(wx, wy, ww, wh);
  }

  if (skyPhase < 0.4) {
    const alpha = 1 - skyPhase * 2.5;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    for (const [sx, sy] of [[0.25,0.15],[0.6,0.25],[0.15,0.55],[0.75,0.12],[0.45,0.45],[0.85,0.35],[0.35,0.7]]) {
      ctx.beginPath();
      ctx.arc(wx + ww * sx, wy + wh * sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 3;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();

  ctx.fillStyle = "#555";
  ctx.fillRect(wx - 4, wy + wh, ww + 8, 4);
}

// --- Bed ---

function drawBed(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bx = w * 0.06, by = h * 0.48, bw = w * 0.38, bh = h * 0.32;

  ctx.fillStyle = "#4a2a0a";
  ctx.fillRect(bx + 4, by + bh - 2, 6, h * 0.78 - (by + bh) + 4);
  ctx.fillRect(bx + bw - 10, by + bh - 2, 6, h * 0.78 - (by + bh) + 4);

  ctx.fillStyle = "#5a3a1a";
  ctx.beginPath();
  ctx.moveTo(bx, by + bh);
  ctx.lineTo(bx, by - h * 0.08);
  ctx.quadraticCurveTo(bx, by - h * 0.14, bx + w * 0.02, by - h * 0.14);
  ctx.lineTo(bx + w * 0.04, by - h * 0.14);
  ctx.quadraticCurveTo(bx + w * 0.06, by - h * 0.14, bx + w * 0.06, by - h * 0.08);
  ctx.lineTo(bx + w * 0.06, by + bh);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(bx + bw - w * 0.025, by + h * 0.08, w * 0.035, bh - h * 0.06);

  ctx.fillStyle = "#3b3060";
  roundRect(ctx, bx + w * 0.06, by, bw - w * 0.085, bh * 0.5, 4);
  ctx.fill();

  ctx.fillStyle = "#c8c0d8";
  ctx.beginPath();
  ctx.ellipse(bx + w * 0.11, by + bh * 0.15, w * 0.045, h * 0.06, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8d0e8";
  ctx.beginPath();
  ctx.ellipse(bx + w * 0.105, by + bh * 0.12, w * 0.025, h * 0.03, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b4080";
  roundRect(ctx, bx + w * 0.06, by + bh * 0.35, bw - w * 0.085, bh * 0.65, 3);
  ctx.fill();
  ctx.fillStyle = "#5b5090";
  ctx.fillRect(bx + w * 0.065, by + bh * 0.33, bw - w * 0.09, h * 0.02);
  ctx.strokeStyle = "#3a3070";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.06, by + bh * 0.5);
  ctx.lineTo(bx + bw - w * 0.025, by + bh * 0.5);
  ctx.stroke();
}

// --- Nightstand ---

function drawNightstand(ctx: CanvasRenderingContext2D, w: number, h: number, time: string, alarmRing: boolean): void {
  const nx = w * 0.46, ny = h * 0.55, nw = w * 0.09, nh = h * 0.23;

  ctx.fillStyle = "#4a3a2a";
  roundRect(ctx, nx, ny, nw, nh, 2);
  ctx.fill();
  ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(nx + 3, ny + nh * 0.5); ctx.lineTo(nx + nw - 3, ny + nh * 0.5); ctx.stroke();
  ctx.fillStyle = "#daa520";
  ctx.beginPath(); ctx.arc(nx + nw / 2, ny + nh * 0.5, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(nx + 3, ny + nh, 3, h * 0.78 - (ny + nh) + 2);
  ctx.fillRect(nx + nw - 6, ny + nh, 3, h * 0.78 - (ny + nh) + 2);

  const cx = nx + nw * 0.15, cy = ny - h * 0.06, cw = nw * 0.7, ch = h * 0.06;
  ctx.fillStyle = "#2a2a2a";
  roundRect(ctx, cx, cy, cw, ch, 3); ctx.fill();
  ctx.fillStyle = "#0a1a0a";
  ctx.fillRect(cx + 3, cy + 3, cw - 6, ch - 6);

  const minutes = parseTime(time);
  let timeColor = "#0f0";
  if (minutes >= 540) timeColor = "#f44";
  else if (minutes >= 480) timeColor = "#ff0";
  ctx.fillStyle = timeColor;
  ctx.font = `bold ${Math.max(9, w * 0.018)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(time, cx + cw / 2, cy + ch - 4);
  ctx.textAlign = "start";

  if (alarmRing) {
    ctx.strokeStyle = "#ff0"; ctx.lineWidth = 1.5;
    const rcx = cx + cw / 2, rcy = cy - 2;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.8 - i * 0.2;
      ctx.beginPath(); ctx.arc(rcx, rcy, 3 + i * 3, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ff0"; ctx.lineWidth = 1;
    for (const side of [-1, 1]) {
      const sx = rcx + side * (cw / 2 + 4);
      ctx.beginPath(); ctx.moveTo(sx, cy + 2); ctx.lineTo(sx + side * 3, cy - 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, cy + 6); ctx.lineTo(sx + side * 4, cy + 4); ctx.stroke();
    }
  }
}

// --- Door ---

function drawDoor(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const dx = w * 0.88, dy = h * 0.18, dw = w * 0.09, dh = h * 0.6;
  ctx.fillStyle = "#4a3a2a"; ctx.fillRect(dx - 3, dy - 3, dw + 6, dh + 3);
  ctx.fillStyle = "#5a4a3a"; ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(dx + dw * 0.15, dy + dh * 0.08, dw * 0.7, dh * 0.3);
  ctx.fillRect(dx + dw * 0.15, dy + dh * 0.48, dw * 0.7, dh * 0.35);
  ctx.fillStyle = "#daa520";
  ctx.beginPath(); ctx.arc(dx + dw * 0.25, dy + dh * 0.5, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f0d060";
  ctx.beginPath(); ctx.arc(dx + dw * 0.23, dy + dh * 0.49, 1.5, 0, Math.PI * 2); ctx.fill();
}

// --- Easy Chair ---

function drawEasyChair(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.54, cy = h * 0.5, cw = w * 0.14, ch = h * 0.28;
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(cx + 4, cy + ch - 4, 4, h * 0.78 - (cy + ch) + 6);
  ctx.fillRect(cx + cw - 8, cy + ch - 4, 4, h * 0.78 - (cy + ch) + 6);
  ctx.fillStyle = "#5a4538"; roundRect(ctx, cx - w * 0.01, cy - h * 0.12, w * 0.05, ch + h * 0.12, 4); ctx.fill();
  ctx.fillStyle = "#6a5545"; roundRect(ctx, cx, cy + ch * 0.3, cw, ch * 0.7, 4); ctx.fill();
  ctx.fillStyle = "#7a6555"; roundRect(ctx, cx + 3, cy + ch * 0.33, cw - 6, ch * 0.35, 3); ctx.fill();
  ctx.fillStyle = "#7a6555"; roundRect(ctx, cx + 2, cy - h * 0.02, w * 0.035, h * 0.15, 3); ctx.fill();
  ctx.fillStyle = "#5a4538"; roundRect(ctx, cx + cw - w * 0.02, cy + ch * 0.15, w * 0.03, ch * 0.5, 3); ctx.fill();
}

// --- Raccoon ---

function drawRaccoonInRoom(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  pos: { x: number; y: number; rotation: number }, expression: ExpressionName
): void {
  const size = Math.min(w * 0.17, 100);
  drawRaccoonComposite(ctx, w * pos.x, h * pos.y, size, expression, pos.rotation);
}

// --- Phone ---

function drawPhone(ctx: CanvasRenderingContext2D, w: number, h: number, raccoonPos: { x: number; y: number; rotation: number }): void {
  const isLying = raccoonPos.rotation > 45;
  let px: number, py: number, pw: number, ph: number;
  if (isLying) {
    px = w * raccoonPos.x + w * 0.04; py = h * raccoonPos.y - h * 0.12; pw = w * 0.04; ph = h * 0.07;
  } else {
    px = w * raccoonPos.x + w * 0.04; py = h * raccoonPos.y - h * 0.02; pw = w * 0.035; ph = h * 0.06;
  }
  ctx.fillStyle = "#1a1a1a"; roundRect(ctx, px, py, pw, ph, 3); ctx.fill();
  const screenPad = 2;
  const screenGrad = ctx.createLinearGradient(px, py, px, py + ph);
  screenGrad.addColorStop(0, "#3366cc"); screenGrad.addColorStop(0.3, "#4488ee"); screenGrad.addColorStop(1, "#2255aa");
  ctx.fillStyle = screenGrad; roundRect(ctx, px + screenPad, py + screenPad, pw - screenPad * 2, ph - screenPad * 2, 2); ctx.fill();
  ctx.save();
  const glowGrad = ctx.createRadialGradient(px + pw / 2, py + ph / 2, 0, px + pw / 2, py + ph / 2, pw * 1.5);
  glowGrad.addColorStop(0, "rgba(68,136,255,0.15)"); glowGrad.addColorStop(1, "rgba(68,136,255,0)");
  ctx.fillStyle = glowGrad; ctx.fillRect(px - pw, py - ph, pw * 3, ph * 3);
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px + screenPad + 2, py + screenPad + 3 + i * 4, pw * (0.4 + Math.random() * 0.3), 1.5);
  }
}

// --- Inertia Arrows ---

function drawInertiaArrows(ctx: CanvasRenderingContext2D, w: number, h: number, inertia: number, raccoonPos: { x: number; y: number; rotation: number }): void {
  if (inertia <= 0) return;
  const px = w * raccoonPos.x, py = h * raccoonPos.y;
  const isLying = raccoonPos.rotation > 45;
  ctx.save();
  for (let i = 0; i < inertia; i++) {
    const size = 8 + i * 3;
    const alpha = 0.4 + i * 0.12;
    const red = Math.min(255, 180 + i * 25);
    ctx.fillStyle = `rgba(${red},50,50,${alpha})`;
    ctx.strokeStyle = `rgba(${red + 30},80,80,${alpha * 0.5})`;
    ctx.lineWidth = 1;
    const ay = (isLying ? py + h * 0.08 : py + h * 0.1) + i * 14;
    ctx.beginPath(); ctx.moveTo(px - size, ay); ctx.lineTo(px + size, ay); ctx.lineTo(px, ay + size * 1.2); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
