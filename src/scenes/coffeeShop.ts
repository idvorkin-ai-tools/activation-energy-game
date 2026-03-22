import { lerpColor, roundRect } from "./utils";

/** Draw a coffee shop scene with big window, table, coffee cup, and notebook */
export function drawCoffeeShopScene(ctx: CanvasRenderingContext2D, w: number, h: number, skyPhase: number): void {
  // Warm wall
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  wallGrad.addColorStop(0, "#3a2820");
  wallGrad.addColorStop(1, "#4a3830");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.78);

  // Floor — wood
  const floorGrad = ctx.createLinearGradient(0, h * 0.78, 0, h);
  floorGrad.addColorStop(0, "#5a4530");
  floorGrad.addColorStop(1, "#4a3520");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  // Window — big cafe window
  const wx = w * 0.5;
  const wy = h * 0.05;
  const ww = w * 0.45;
  const wh = h * 0.55;

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);

  const skyTop = lerpColor("#87CEEB", "#87CEEB", skyPhase);
  const skyBot = lerpColor("#a8d8ea", "#c8e8f8", skyPhase);
  const skyGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(wx, wy, ww, wh);

  // Trees outside window
  ctx.fillStyle = "#5a8a3a";
  ctx.beginPath(); ctx.arc(wx + ww * 0.3, wy + wh * 0.7, w * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(wx + ww * 0.7, wy + wh * 0.6, w * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4a7a2a";
  ctx.beginPath(); ctx.arc(wx + ww * 0.5, wy + wh * 0.75, w * 0.05, 0, Math.PI * 2); ctx.fill();
  // Tree trunks
  ctx.fillStyle = "#5a4a30";
  ctx.fillRect(wx + ww * 0.29, wy + wh * 0.75, 4, wh * 0.25);
  ctx.fillRect(wx + ww * 0.69, wy + wh * 0.65, 4, wh * 0.35);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 3;
  ctx.strokeRect(wx, wy, ww, wh);
  // Window sill
  ctx.fillStyle = "#555";
  ctx.fillRect(wx - 4, wy + wh, ww + 8, 4);

  // Table
  const tx = w * 0.05;
  const ty = h * 0.55;
  const tw = w * 0.4;
  const th = h * 0.04;

  ctx.fillStyle = "#6a5540";
  roundRect(ctx, tx, ty, tw, th, 2);
  ctx.fill();
  // Table legs
  ctx.fillStyle = "#5a4530";
  ctx.fillRect(tx + 8, ty + th, 4, h * 0.78 - ty - th + 2);
  ctx.fillRect(tx + tw - 12, ty + th, 4, h * 0.78 - ty - th + 2);

  // Coffee cup
  const cupX = tx + tw * 0.6;
  const cupY = ty - h * 0.06;
  ctx.fillStyle = "#f5f0e8";
  roundRect(ctx, cupX, cupY, w * 0.03, h * 0.06, 2);
  ctx.fill();
  // Handle
  ctx.strokeStyle = "#f5f0e8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cupX + w * 0.03 + 3, cupY + h * 0.03, 4, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  // Steam
  ctx.strokeStyle = "rgba(200,200,200,0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const sx = cupX + w * 0.01 + i * 4;
    ctx.beginPath();
    ctx.moveTo(sx, cupY - 2);
    ctx.quadraticCurveTo(sx + 2, cupY - 8, sx - 1, cupY - 14);
    ctx.stroke();
  }

  // Notebook
  const nbX = tx + tw * 0.15;
  const nbY = ty - h * 0.04;
  ctx.fillStyle = "#d4c4a0";
  roundRect(ctx, nbX, nbY, w * 0.08, h * 0.04, 1);
  ctx.fill();
  // Lines on notebook
  ctx.strokeStyle = "rgba(100,80,60,0.3)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(nbX + 3, nbY + 5 + i * 3);
    ctx.lineTo(nbX + w * 0.07, nbY + 5 + i * 3);
    ctx.stroke();
  }
}
