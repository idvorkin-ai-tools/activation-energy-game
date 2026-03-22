import { lerpColor } from "./utils";
import { drawKettlebell } from "./kettlebell";

/** Draw a gym scene with kettlebell rack, floor kettlebells, and high strip windows */
export function drawGymScene(ctx: CanvasRenderingContext2D, w: number, h: number, skyPhase: number): void {
  // Wall — concrete gray
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  wallGrad.addColorStop(0, "#3a3a3e");
  wallGrad.addColorStop(1, "#454548");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.78);

  // Floor — rubber mat tiles
  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.strokeStyle = "#333338";
  ctx.lineWidth = 1;
  const tileSize = w / 10;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, h * 0.78);
    ctx.lineTo(i * tileSize, h);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, h * 0.89);
  ctx.lineTo(w, h * 0.89);
  ctx.stroke();

  // High windows (gym-style strip)
  const wx = w * 0.1;
  const wy = h * 0.04;
  const ww = w * 0.8;
  const wh = h * 0.15;
  const skyTop = lerpColor("#2a3a5a", "#87CEEB", skyPhase);
  const skyBot = lerpColor("#3a4a6a", "#a8d8ea", skyPhase);
  const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 3;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(wx + ww * (i / 4), wy);
    ctx.lineTo(wx + ww * (i / 4), wy + wh);
    ctx.stroke();
  }

  // Kettlebell rack — metal frame
  const rackX = w * 0.05;
  const rackY = h * 0.5;
  const rackW = w * 0.35;
  const rackH = h * 0.28;

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(rackX, rackY); ctx.lineTo(rackX, rackY + rackH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rackX + rackW, rackY); ctx.lineTo(rackX + rackW, rackY + rackH); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(rackX, rackY + rackH * 0.45); ctx.lineTo(rackX + rackW, rackY + rackH * 0.45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rackX, rackY + rackH * 0.9); ctx.lineTo(rackX + rackW, rackY + rackH * 0.9); ctx.stroke();

  // Top shelf — lighter kettlebells
  const topY = rackY + rackH * 0.35;
  const topKBs: [string, string][] = [["#8B0000","8"], ["#8B0000","12"], ["#CC5500","16"], ["#CC5500","20"], ["#2255AA","24"]];
  for (let i = 0; i < topKBs.length; i++) {
    drawKettlebell(ctx, rackX + w * 0.03 + i * w * 0.065, topY, w * 0.035, topKBs[i][0], topKBs[i][1]);
  }

  // Bottom shelf — heavier kettlebells
  const botY = rackY + rackH * 0.8;
  const botKBs: [string, string][] = [["#1a1a1a","28"], ["#1a1a1a","32"], ["#333","36"], ["#1a1a1a","40"]];
  for (let i = 0; i < botKBs.length; i++) {
    drawKettlebell(ctx, rackX + w * 0.04 + i * w * 0.08, botY, w * 0.045, botKBs[i][0], botKBs[i][1]);
  }

  // Floor kettlebells (scattered right side, in use)
  drawKettlebell(ctx, w * 0.7, h * 0.72, w * 0.05, "#8B0000", "28");
  drawKettlebell(ctx, w * 0.82, h * 0.73, w * 0.04, "#CC5500", "32");
  drawKettlebell(ctx, w * 0.9, h * 0.71, w * 0.055, "#1a1a1a", "40");
}
