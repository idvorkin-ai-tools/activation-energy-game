export type ValuedSceneId = 1 | 2 | 3 | 4 | 5;

export interface ValuedSceneContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** animation time in ms since the scene started */
  t: number;
}

/** Scene 1: Morning coffee at home, open window, bird silhouette flying past. */
export function drawValuedCoffee(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Warm amber interior wall
  const wallGrad = c.createLinearGradient(0, 0, 0, h * 0.72);
  wallGrad.addColorStop(0, "#5a3520");
  wallGrad.addColorStop(1, "#7a4a2a");
  c.fillStyle = wallGrad;
  c.fillRect(0, 0, w, h * 0.72);

  // Warm wooden floor
  const floorGrad = c.createLinearGradient(0, h * 0.72, 0, h);
  floorGrad.addColorStop(0, "#7a4a1a");
  floorGrad.addColorStop(1, "#4a2a0a");
  c.fillStyle = floorGrad;
  c.fillRect(0, h * 0.72, w, h * 0.28);

  // Floor planks
  c.strokeStyle = "#5a3510";
  c.lineWidth = 1;
  for (let px = 0; px < w; px += 35) {
    c.beginPath();
    c.moveTo(px, h * 0.72);
    c.lineTo(px, h);
    c.stroke();
  }

  // Window on the right — sunset/dawn outside
  const winX = w * 0.6;
  const winY = h * 0.06;
  const winW = w * 0.33;
  const winH = h * 0.55;

  // Warm dawn sky
  const sky = c.createLinearGradient(winX, winY, winX, winY + winH);
  sky.addColorStop(0, "#6a3a4a");
  sky.addColorStop(0.35, "#c06030");
  sky.addColorStop(0.75, "#e8a040");
  sky.addColorStop(1, "#f0c060");
  c.fillStyle = sky;
  c.fillRect(winX, winY, winW, winH);

  // Tree silhouettes in window
  c.fillStyle = "#2a1505";
  c.beginPath();
  c.arc(winX + winW * 0.3, winY + winH * 0.78, winH * 0.28, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(winX + winW * 0.72, winY + winH * 0.82, winH * 0.32, 0, Math.PI * 2);
  c.fill();
  // Tree trunks
  c.fillRect(winX + winW * 0.28, winY + winH * 0.78, 5, winH * 0.25);
  c.fillRect(winX + winW * 0.7, winY + winH * 0.82, 6, winH * 0.22);

  // Bird silhouette flying past the window
  const birdProgress = (t / 3500) % 1.0;
  const birdX = winX + birdProgress * (winW + 30) - 15;
  if (birdX > winX - 5 && birdX < winX + winW + 5) {
    c.save();
    c.translate(birdX, winY + winH * 0.2);
    c.strokeStyle = "#1a1010";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-7, -5, -12, -2);
    c.moveTo(0, 0);
    c.quadraticCurveTo(7, -5, 12, -2);
    c.stroke();
    c.restore();
  }

  // Window frame (warm brown wood)
  c.strokeStyle = "#5a3a1a";
  c.lineWidth = 7;
  c.strokeRect(winX, winY, winW, winH);

  // Window muntin cross
  c.beginPath();
  c.moveTo(winX + winW / 2, winY);
  c.lineTo(winX + winW / 2, winY + winH);
  c.moveTo(winX, winY + winH / 2);
  c.lineTo(winX + winW, winY + winH / 2);
  c.stroke();

  // Window sill (wider, prominent)
  c.fillStyle = "#7a5030";
  c.fillRect(winX - 10, winY + winH, winW + 20, 12);

  // Warm ambient light spilling from window
  const ambientGlow = c.createRadialGradient(
    winX, winY + winH * 0.5, 0,
    winX, winY + winH * 0.5, winW * 1.5
  );
  ambientGlow.addColorStop(0, "rgba(255,160,60,0.18)");
  ambientGlow.addColorStop(1, "rgba(255,160,60,0)");
  c.fillStyle = ambientGlow;
  c.fillRect(0, 0, w, h);

  // Small stool
  const stoolX = w * 0.25;
  const stoolY = h * 0.71;
  c.fillStyle = "#8a5520";
  c.beginPath();
  c.ellipse(stoolX, stoolY, 22, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#6a3a12";
  c.fillRect(stoolX - 2, stoolY, 4, 18);

  // Wooden table — small round
  const tableX = w * 0.32;
  const tableY = h * 0.67;
  // Table top (ellipse for 3D look)
  c.fillStyle = "#9a6530";
  c.beginPath();
  c.ellipse(tableX, tableY, 40, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#8a5520";
  c.beginPath();
  c.ellipse(tableX, tableY - 3, 40, 10, 0, 0, Math.PI * 2);
  c.fill();
  // Table edge highlight
  c.strokeStyle = "#aa7540";
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(tableX, tableY - 5, 38, 8, 0, 0, Math.PI);
  c.stroke();
  // Table leg (single pedestal)
  c.fillStyle = "#7a4820";
  c.fillRect(tableX - 5, tableY, 10, h * 0.33);

  // Mug on table
  const mugX = tableX - 14;
  const mugY = tableY - 46;
  // Mug body
  c.fillStyle = "#f0ebe0";
  c.beginPath();
  c.roundRect(mugX, mugY, 28, 32, 4);
  c.fill();
  c.strokeStyle = "#d0c8b8";
  c.lineWidth = 1;
  c.stroke();
  // Mug handle
  c.strokeStyle = "#d8d0c0";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(mugX + 30, mugY + 15, 8, -Math.PI / 2, Math.PI / 2);
  c.stroke();
  // Coffee inside
  c.fillStyle = "#7a4520";
  c.fillRect(mugX + 3, mugY + 3, 22, 10);
  // Mug bottom shadow
  c.fillStyle = "rgba(0,0,0,0.15)";
  c.beginPath();
  c.ellipse(mugX + 14, tableY - 2, 18, 4, 0, 0, Math.PI * 2);
  c.fill();

  // Steam from mug
  c.strokeStyle = "rgba(255,255,255,0.45)";
  c.lineWidth = 1.5;
  c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const sx = mugX + 8 + i * 6;
    const phase = (t / 800 + i * 1.2) % (Math.PI * 2);
    c.beginPath();
    c.moveTo(sx, mugY);
    c.quadraticCurveTo(sx + Math.sin(phase) * 6, mugY - 14, sx + Math.sin(phase + 1) * 3, mugY - 28);
    c.stroke();
  }
}


