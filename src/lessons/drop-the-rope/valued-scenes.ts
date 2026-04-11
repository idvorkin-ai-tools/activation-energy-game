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

export function drawValuedFriend(ctx: ValuedSceneContext): void {
  const { ctx: c, w, h, t } = ctx;

  // Golden hour sky — warm amber to burnt orange
  const sky = c.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, "#c87030");
  sky.addColorStop(0.5, "#d88030");
  sky.addColorStop(1, "#e89040");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h * 0.6);

  // Sun glow (low on horizon, blurred golden disc)
  const sunX = w * 0.75;
  const sunY = h * 0.52;
  const sunGlow = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.35);
  sunGlow.addColorStop(0, "rgba(255,240,180,0.5)");
  sunGlow.addColorStop(0.3, "rgba(255,200,80,0.2)");
  sunGlow.addColorStop(1, "rgba(255,180,60,0)");
  c.fillStyle = sunGlow;
  c.fillRect(0, 0, w, h);

  // Warm grassy ground
  const grass = c.createLinearGradient(0, h * 0.6, 0, h);
  grass.addColorStop(0, "#9a6a20");
  grass.addColorStop(0.3, "#7a5010");
  grass.addColorStop(1, "#4a2a08");
  c.fillStyle = grass;
  c.fillRect(0, h * 0.6, w, h * 0.4);

  // Golden bokeh background trees (distant)
  const treePositions = [0.0, 0.2, 0.42, 0.65, 0.82, 0.95];
  for (const tx of treePositions) {
    const treeGrad = c.createRadialGradient(tx * w, h * 0.48, 0, tx * w, h * 0.48, h * 0.15);
    treeGrad.addColorStop(0, "rgba(40,25,5,0.75)");
    treeGrad.addColorStop(1, "rgba(40,25,5,0)");
    c.fillStyle = treeGrad;
    c.beginPath();
    c.arc(tx * w, h * 0.48, h * 0.15, 0, Math.PI * 2);
    c.fill();
  }

  // Main tree on the left
  const treeX = w * 0.16;
  // Trunk
  c.fillStyle = "#3a2010";
  c.fillRect(treeX - 6, h * 0.38, 12, h * 0.32);
  // Crown
  c.fillStyle = "#2a1a05";
  c.beginPath();
  c.arc(treeX, h * 0.3, h * 0.2, 0, Math.PI * 2);
  c.fill();
  // Warm golden leafy highlights
  c.fillStyle = "rgba(200,140,20,0.25)";
  c.beginPath();
  c.arc(treeX + 18, h * 0.24, h * 0.12, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(treeX - 8, h * 0.22, h * 0.09, 0, Math.PI * 2);
  c.fill();

  // Fallen leaves (little amber shapes)
  c.fillStyle = "rgba(180,100,20,0.4)";
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.ellipse(w * (0.05 + i * 0.12), h * 0.63, 5, 3, i * 0.8, 0, Math.PI * 2);
    c.fill();
  }

  // Park bench (warm brown wood)
  const benchX = w * 0.3;
  const benchY = h * 0.63;
  const benchW = w * 0.4;

  // Bench legs (draw first, behind seat)
  c.fillStyle = "#5a3010";
  // Left leg pair
  c.beginPath();
  c.moveTo(benchX + 10, benchY + 10);
  c.lineTo(benchX + 5, benchY + 35);
  c.lineTo(benchX + 18, benchY + 35);
  c.lineTo(benchX + 22, benchY + 10);
  c.closePath();
  c.fill();
  // Right leg pair
  c.beginPath();
  c.moveTo(benchX + benchW - 22, benchY + 10);
  c.lineTo(benchX + benchW - 18, benchY + 35);
  c.lineTo(benchX + benchW - 5, benchY + 35);
  c.lineTo(benchX + benchW - 10, benchY + 10);
  c.closePath();
  c.fill();

  // Bench back panel (solid, then slats)
  c.fillStyle = "#8a5520";
  c.fillRect(benchX + 5, benchY - 32, benchW - 10, 34);
  // Backrest slat lines
  c.strokeStyle = "#6a3810";
  c.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) {
    c.beginPath();
    c.moveTo(benchX + 5 + i * ((benchW - 10) / 5), benchY - 32);
    c.lineTo(benchX + 5 + i * ((benchW - 10) / 5), benchY + 2);
    c.stroke();
  }
  // Top rail
  c.fillStyle = "#9a6530";
  c.fillRect(benchX + 3, benchY - 34, benchW - 6, 7);

  // Seat
  c.fillStyle = "#9a6030";
  c.fillRect(benchX, benchY, benchW, 10);
  // Seat slat lines
  for (let i = 1; i < 5; i++) {
    c.beginPath();
    c.moveTo(benchX + i * (benchW / 5), benchY);
    c.lineTo(benchX + i * (benchW / 5), benchY + 10);
    c.stroke();
  }
  // Seat edge highlight
  c.fillStyle = "#b08040";
  c.fillRect(benchX, benchY, benchW, 3);

  // Speech bubble notification (appears after 1s, fades in)
  if (t > 800) {
    const fadeFactor = Math.min(1, (t - 800) / 400);
    const bubbleW = w * 0.38;
    const bubbleH = 40;
    const bubbleX = w * 0.36;
    const bubbleY = h * 0.3;

    c.save();
    c.globalAlpha = fadeFactor;

    // Bubble shadow
    c.fillStyle = "rgba(0,0,0,0.12)";
    c.beginPath();
    c.roundRect(bubbleX + 2, bubbleY + 2, bubbleW, bubbleH, 8);
    c.fill();

    // Bubble
    c.fillStyle = "rgba(255,255,255,0.97)";
    c.beginPath();
    c.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
    c.fill();

    // Tail pointing down-left toward bench
    c.beginPath();
    c.moveTo(bubbleX + 22, bubbleY + bubbleH);
    c.lineTo(bubbleX + 14, bubbleY + bubbleH + 11);
    c.lineTo(bubbleX + 34, bubbleY + bubbleH);
    c.closePath();
    c.fill();

    c.fillStyle = "#222222";
    c.font = "13px sans-serif";
    c.textAlign = "left";
    c.fillText('"hey. coffee this week?"', bubbleX + 10, bubbleY + 26);

    c.restore();
  }
}

/** Scene 4: Writing at desk with warm amber lamp glow. */

