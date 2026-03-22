import { roundRect } from "./utils";

/** Draw a dramatic alarm clock intro — big shaking clock centered on dark background */
export function drawAlarmIntroScene(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  time: string, animTime: number
): void {
  // Dark bedroom background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#0e0e1e");
  bgGrad.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle stars in background
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  const starPositions = [
    [0.1, 0.1], [0.85, 0.15], [0.3, 0.08], [0.7, 0.25], [0.15, 0.3],
    [0.9, 0.35], [0.5, 0.12], [0.65, 0.05], [0.2, 0.22], [0.8, 0.08],
  ];
  for (const [sx, sy] of starPositions) {
    ctx.beginPath();
    ctx.arc(w * sx, h * sy, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = w / 2;
  const cy = h * 0.45;

  // Shake animation — oscillates with decreasing-then-increasing intensity
  const shakeFreq = 12;
  const shakeAmt = 3 + Math.sin(animTime * 0.003) * 2;
  const shakeX = Math.sin(animTime * shakeFreq * 0.01) * shakeAmt;
  const shakeY = Math.cos(animTime * shakeFreq * 0.013) * shakeAmt * 0.5;
  const shakeRot = Math.sin(animTime * shakeFreq * 0.008) * 0.05;

  ctx.save();
  ctx.translate(cx + shakeX, cy + shakeY);
  ctx.rotate(shakeRot);

  // Sound waves radiating outward
  const waveCount = 4;
  for (let i = 0; i < waveCount; i++) {
    const phase = ((animTime * 0.002 + i / waveCount) % 1);
    const radius = w * 0.12 + phase * w * 0.25;
    const alpha = (1 - phase) * 0.25;
    ctx.strokeStyle = `rgba(255,220,50,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Clock body — big rounded rectangle
  const clockW = w * 0.3;
  const clockH = h * 0.22;

  // Clock shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, -clockW / 2 + 4, -clockH / 2 + 4, clockW, clockH, 12);
  ctx.fill();

  // Clock body
  const bodyGrad = ctx.createLinearGradient(0, -clockH / 2, 0, clockH / 2);
  bodyGrad.addColorStop(0, "#3a3a3a");
  bodyGrad.addColorStop(1, "#222");
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -clockW / 2, -clockH / 2, clockW, clockH, 12);
  ctx.fill();

  // Clock rim
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  roundRect(ctx, -clockW / 2, -clockH / 2, clockW, clockH, 12);
  ctx.stroke();

  // Bells on top
  const bellR = clockW * 0.12;
  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.arc(-clockW * 0.25, -clockH / 2 - bellR * 0.6, bellR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(clockW * 0.25, -clockH / 2 - bellR * 0.6, bellR, 0, Math.PI * 2);
  ctx.fill();
  // Bell highlights
  ctx.fillStyle = "#666";
  ctx.beginPath();
  ctx.arc(-clockW * 0.25 - 2, -clockH / 2 - bellR * 0.6 - 2, bellR * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(clockW * 0.25 - 2, -clockH / 2 - bellR * 0.6 - 2, bellR * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Hammer between bells
  ctx.fillStyle = "#444";
  ctx.beginPath();
  ctx.arc(0, -clockH / 2 - bellR * 1.1, bellR * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Clock feet
  ctx.fillStyle = "#444";
  ctx.fillRect(-clockW * 0.35, clockH / 2, clockW * 0.08, clockH * 0.12);
  ctx.fillRect(clockW * 0.27, clockH / 2, clockW * 0.08, clockH * 0.12);

  // Screen area
  const screenPad = clockW * 0.08;
  const screenW = clockW - screenPad * 2;
  const screenH = clockH - screenPad * 2;
  ctx.fillStyle = "#0a1a0a";
  roundRect(ctx, -screenW / 2, -screenH / 2, screenW, screenH, 6);
  ctx.fill();

  // Time display — big and bright
  const pulse = 0.7 + Math.sin(animTime * 0.008) * 0.3;
  ctx.fillStyle = `rgba(0,255,0,${pulse})`;
  ctx.font = `bold ${Math.max(20, clockW * 0.28)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(time, 0, 0);

  // AM label
  ctx.fillStyle = `rgba(0,200,0,${pulse * 0.7})`;
  ctx.font = `${Math.max(10, clockW * 0.1)}px monospace`;
  ctx.fillText("AM", screenW * 0.35, screenH * 0.3);

  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";

  ctx.restore();

  // "BEEP BEEP" text bouncing around
  const beepAlpha = 0.3 + Math.abs(Math.sin(animTime * 0.006)) * 0.5;
  ctx.fillStyle = `rgba(255,100,100,${beepAlpha})`;
  ctx.font = `bold ${Math.max(12, w * 0.03)}px sans-serif`;
  ctx.textAlign = "center";

  const b1x = cx + Math.sin(animTime * 0.004) * w * 0.15 - w * 0.2;
  const b1y = cy - h * 0.2 + Math.cos(animTime * 0.005) * 10;
  ctx.fillText("BEEP", b1x, b1y);

  const b2x = cx + Math.cos(animTime * 0.003) * w * 0.15 + w * 0.2;
  const b2y = cy - h * 0.15 + Math.sin(animTime * 0.006) * 10;
  ctx.fillText("BEEP", b2x, b2y);

  ctx.textAlign = "start";
}

