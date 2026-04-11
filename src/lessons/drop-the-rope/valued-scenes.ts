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


/** Scene 2: Warm wooden gym with kettlebell swing. DO NOT reuse src/scenes/gym.ts — cool grey. */
export function drawValuedGym(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Warm terracotta/rust wall
  const wallGrad = c.createLinearGradient(0, 0, 0, h * 0.72);
  wallGrad.addColorStop(0, "#7a4a3a");
  wallGrad.addColorStop(0.6, "#8a5040");
  wallGrad.addColorStop(1, "#6a3a2a");
  c.fillStyle = wallGrad;
  c.fillRect(0, 0, w, h * 0.72);

  // Wooden warm floor
  const floorGrad = c.createLinearGradient(0, h * 0.72, 0, h);
  floorGrad.addColorStop(0, "#8a5020");
  floorGrad.addColorStop(1, "#5a3010");
  c.fillStyle = floorGrad;
  c.fillRect(0, h * 0.72, w, h * 0.28);
  // Plank lines
  c.strokeStyle = "#4a2a0a";
  c.lineWidth = 1;
  for (let px = 0; px < w; px += 40) {
    c.beginPath();
    c.moveTo(px, h * 0.72);
    c.lineTo(px, h);
    c.stroke();
  }

  // Bright warm window on the left — sunlight flooding in
  const winX = w * 0.04;
  const winY = h * 0.1;
  const winW = w * 0.22;
  const winH = h * 0.38;

  const winGrad = c.createLinearGradient(winX, winY, winX, winY + winH);
  winGrad.addColorStop(0, "#fff4c0");
  winGrad.addColorStop(1, "#ffd060");
  c.fillStyle = winGrad;
  c.fillRect(winX, winY, winW, winH);

  // Sunlight glow radiating from window
  const sunGlow = c.createRadialGradient(
    winX + winW, winY + winH * 0.3, 0,
    winX + winW, winY + winH * 0.3, w * 0.55
  );
  sunGlow.addColorStop(0, "rgba(255,220,120,0.3)");
  sunGlow.addColorStop(0.4, "rgba(255,180,60,0.15)");
  sunGlow.addColorStop(1, "rgba(255,180,60,0)");
  c.fillStyle = sunGlow;
  c.fillRect(0, 0, w, h);

  c.strokeStyle = "#5a3a1a";
  c.lineWidth = 5;
  c.strokeRect(winX, winY, winW, winH);
  // Cross muntin
  c.beginPath();
  c.moveTo(winX + winW / 2, winY);
  c.lineTo(winX + winW / 2, winY + winH);
  c.moveTo(winX, winY + winH / 2);
  c.lineTo(winX + winW, winY + winH / 2);
  c.stroke();

  // Kettlebell rack on the right — warm brown wood
  const rackX = w * 0.72;
  const rackY = h * 0.45;
  const rackW = w * 0.24;

  // Rack frame
  c.fillStyle = "#5a3510";
  c.fillRect(rackX, rackY, rackW, 7);  // top shelf
  c.fillRect(rackX, rackY + 55, rackW, 7);  // bottom shelf
  c.fillRect(rackX, rackY, 6, 62);  // left side
  c.fillRect(rackX + rackW - 6, rackY, 6, 62);  // right side
  // Rack legs
  c.fillRect(rackX + 4, rackY + 62, 6, 22);
  c.fillRect(rackX + rackW - 10, rackY + 62, 6, 22);

  // 4 kettlebells on rack (ascending size)
  const bellData: Array<{ size: number; label: string }> = [
    { size: 11, label: "8" },
    { size: 13, label: "12" },
    { size: 15, label: "16" },
    { size: 17, label: "20" },
  ];
  for (let i = 0; i < 4; i++) {
    const { size, label } = bellData[i];
    const bx = rackX + 14 + i * (rackW - 14) / 3.5;
    const by = rackY - size + 2;
    c.fillStyle = "#3a3028";
    c.beginPath();
    c.arc(bx, by, size, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#252018";
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(bx, by - size - 2, size * 0.5, Math.PI, 0);
    c.stroke();
    c.fillStyle = "#888070";
    c.font = `bold ${Math.round(size * 0.65)}px sans-serif`;
    c.textAlign = "center";
    c.fillText(label, bx, by + size * 0.35);
  }

  // Foam roller on the floor next to rack (warm brown/dark tone)
  c.fillStyle = "#5a3820";
  c.beginPath();
  c.ellipse(rackX + rackW * 0.5, h * 0.88, rackW * 0.22, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#3a2210";
  c.lineWidth = 1;
  c.stroke();

  // Active kettlebell in swing (center of scene)
  const swingCycle = (t / 2200) % 1.0;
  const swingT = Math.sin(swingCycle * Math.PI * 2) * 0.7;
  const bellX = w * 0.46 + Math.sin(swingT) * 55;
  const bellY = h * 0.68 - Math.cos(swingT) * 20 - 12;

  // Arm lines from implied grip above
  c.strokeStyle = "#5a3a1a";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(w * 0.43, h * 0.58);
  c.lineTo(bellX - 5, bellY - 18);
  c.moveTo(w * 0.49, h * 0.57);
  c.lineTo(bellX + 5, bellY - 18);
  c.stroke();

  // Active bell
  c.fillStyle = "#2a2820";
  c.beginPath();
  c.arc(bellX, bellY, 20, 0, Math.PI * 2);
  c.fill();
  // Handle
  c.strokeStyle = "#1a1810";
  c.lineWidth = 5;
  c.beginPath();
  c.arc(bellX, bellY - 22, 10, Math.PI, 0);
  c.stroke();
  // Slight sheen on bell
  c.fillStyle = "rgba(255,255,255,0.08)";
  c.beginPath();
  c.arc(bellX - 5, bellY - 7, 8, 0, Math.PI * 2);
  c.fill();
  // Weight label on active bell
  c.fillStyle = "#ffffff";
  c.font = "bold 9px sans-serif";
  c.textAlign = "center";
  c.fillText("16kg", bellX, bellY + 5);
}

/** Scene 3: Park bench at golden hour, raccoon getting a friend text. */

