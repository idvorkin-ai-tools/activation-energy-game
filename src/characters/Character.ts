import { ExpressionName, EXPRESSIONS } from "./expressions";
import { hexToCSS } from "../utils/dom";

const CANVAS_W = 60;
const CANVAS_H = 80;
const BODY_RADIUS = 25;
const HEAD_RADIUS = 18;

/**
 * A simple round character drawn on an HTML canvas.
 * Pill-shaped body with expressive face, ~60x80px. Origin at center.
 * The el is positioned so (left, top) corresponds to the character center.
 */
export class Character {
  el: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentExpression: ExpressionName = "neutral";
  private posX = 0;
  private posY = 0;

  constructor() {
    this.el = document.createElement("canvas");
    this.el.width = CANVAS_W;
    this.el.height = CANVAS_H;
    this.el.style.position = "absolute";
    this.el.style.pointerEvents = "none";
    this.ctx = this.el.getContext("2d")!;
    this.draw("neutral");
  }

  private draw(expression: ExpressionName): void {
    const ctx = this.ctx;
    const params = EXPRESSIONS[expression];
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Origin offset: character center is at (30, 35) on canvas
    const cx = CANVAS_W / 2;
    const bodyOffsetY = 55; // body center Y on canvas
    const headOffsetY = 20; // head center Y on canvas

    // Body circle
    ctx.fillStyle = hexToCSS(params.bodyTint);
    ctx.beginPath();
    ctx.arc(cx, bodyOffsetY, BODY_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Head circle
    ctx.beginPath();
    ctx.arc(cx, headOffsetY, HEAD_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeY = headOffsetY - 3;
    const eyeSpacing = 8;
    const eyeRadius = 3 * params.eyeScale;
    ctx.fillStyle = "#1a1a2e";

    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    const mouthY = headOffsetY + 7;
    const cpY = mouthY + params.mouthCurve * -8;
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, mouthY);
    ctx.quadraticCurveTo(cx, cpY, cx + 6, mouthY);
    ctx.stroke();

    // Eyebrows
    const browY = eyeY - 6 + params.browOffset;
    const browAngle = params.browOffset * 0.3;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx - eyeSpacing - 3, browY);
    ctx.lineTo(cx - eyeSpacing + 3, browY - browAngle);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + eyeSpacing - 3, browY - browAngle);
    ctx.lineTo(cx + eyeSpacing + 3, browY);
    ctx.stroke();
  }

  setExpression(expression: ExpressionName): void {
    this.currentExpression = expression;
    this.draw(expression);
  }

  getExpression(): ExpressionName {
    return this.currentExpression;
  }

  walkTo(x: number, y: number, durationMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startX = this.posX;
      const startY = this.posY;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / durationMs, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        this.setPosition(
          startX + (x - startX) * ease,
          startY + (y - startY) * ease,
        );
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  setPosition(x: number, y: number): void {
    this.posX = x;
    this.posY = y;
    // Position so the center of the character is at (x, y)
    this.el.style.left = `${x - CANVAS_W / 2}px`;
    this.el.style.top = `${y - CANVAS_H / 2}px`;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.posX, y: this.posY };
  }

  static expressionForWillpower(percent: number): ExpressionName {
    if (percent > 80) return "energized";
    if (percent > 60) return "happy";
    if (percent > 40) return "neutral";
    if (percent > 20) return "tired";
    if (percent > 10) return "stressed";
    return "desperate";
  }
}
