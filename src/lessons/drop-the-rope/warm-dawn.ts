import { lerpColor } from "../../scenes/utils.ts";

/**
 * Draw the warm dawn earth world — amber sky, warm brown ground.
 * Palette is continuous with `morning-choice`. Drain-able via saturation parameter.
 *
 * @param ctx canvas context
 * @param w logical width
 * @param h logical height
 * @param saturation 1.0 = full warm dawn, 0.0 = near-grey (for the greying-during-struggle mechanic)
 */
export function drawWarmDawn(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  saturation: number = 1,
): void {
  const horizonY = h * 0.65;

  // Sky: amber at horizon → dusty rose-purple at top
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  const skyTop = lerpColor("#5a5a5a", "#5a3a4a", saturation);
  const skyMid = lerpColor("#7a7070", "#c0855f", saturation);
  const skyBot = lerpColor("#888080", "#f0c060", saturation);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(0.6, skyMid);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  // Golden glow at horizon (only when saturated)
  if (saturation > 0.1) {
    const glow = ctx.createRadialGradient(w / 2, horizonY, 0, w / 2, horizonY, w * 0.6);
    glow.addColorStop(0, `rgba(255, 200, 100, ${0.35 * saturation})`);
    glow.addColorStop(1, "rgba(255, 200, 100, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, horizonY);
  }

  // Ground: warm brown gradient
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  const groundTop = lerpColor("#555555", "#3a2a1a", saturation);
  const groundBot = lerpColor("#333333", "#2a1a0a", saturation);
  groundGrad.addColorStop(0, groundTop);
  groundGrad.addColorStop(1, groundBot);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);
}
