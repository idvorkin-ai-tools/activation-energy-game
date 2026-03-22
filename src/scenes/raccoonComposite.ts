import { drawRaccoon } from "../characters/drawRaccoon";
import type { ExpressionName } from "../characters/expressions";

/**
 * Draw a raccoon onto a canvas context at a given position and rotation.
 * Uses an offscreen canvas to avoid drawRaccoon's clearRect wiping the background.
 * Adds vertical padding so the ears aren't clipped at small sizes.
 */
export function drawRaccoonComposite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  expression: ExpressionName,
  rotation = 0,
): void {
  // drawRaccoon centers the raccoon but ears extend ~49px above midpoint at 100px scale.
  // At small sizes the ears clip. Extra vertical padding fixes this.
  const padding = Math.ceil(size * 0.3);
  const offW = size;
  const offH = size + padding;
  const offscreen = document.createElement("canvas");
  offscreen.width = offW;
  offscreen.height = offH;
  const offCtx = offscreen.getContext("2d")!;
  offCtx.translate(0, padding / 2);
  drawRaccoon(offCtx, size, size, expression);

  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  ctx.drawImage(offscreen, -offW / 2, -offH / 2);
  ctx.restore();
}
