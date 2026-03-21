import { ExpressionName } from "./expressions";
import { drawRaccoon, RACCOON_CANVAS_SIZE } from "./drawRaccoon";

/**
 * Cute/chibi raccoon character (Style B, big head) drawn on an HTML canvas.
 * 100x100px. Origin at center.
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
    this.el.width = RACCOON_CANVAS_SIZE;
    this.el.height = RACCOON_CANVAS_SIZE;
    this.el.style.position = "absolute";
    this.el.style.pointerEvents = "none";
    this.ctx = this.el.getContext("2d")!;
    this.draw("neutral");
  }

  private draw(expression: ExpressionName): void {
    drawRaccoon(this.ctx, RACCOON_CANVAS_SIZE, RACCOON_CANVAS_SIZE, expression);
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
    this.el.style.left = `${x - RACCOON_CANVAS_SIZE / 2}px`;
    this.el.style.top = `${y - RACCOON_CANVAS_SIZE / 2}px`;
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
