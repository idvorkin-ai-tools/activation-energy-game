import { ExpressionName, EXPRESSIONS } from "./expressions";

const CANVAS_SIZE = 90;

// Raccoon palette
const PAL = {
  fur: "#8B8680",
  belly: "#C4BAB0",
  mask: "#2C2420",
  nose: "#1A1614",
  earInner: "#C4A08A",
  eye: "#1A1A2E",
  eyeWhite: "#FFFFFF",
  tailDark: "#2C2420",
  tailLight: "#8B8680",
  whisker: "#D4CCC4",
};

// Accent colors per expression (for blush, tears, etc.)
const EXPR_ACCENTS: Record<ExpressionName, string | null> = {
  happy: "#E8A0A0",
  neutral: null,
  tired: "#7888A0",
  stressed: "#FBBF24",
  desperate: "#EF4444",
  energized: "#22D3EE",
};

/**
 * Cute/chibi raccoon character (Style B) drawn on an HTML canvas.
 * ~90x90px. Origin at center.
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
    this.el.width = CANVAS_SIZE;
    this.el.height = CANVAS_SIZE;
    this.el.style.position = "absolute";
    this.el.style.pointerEvents = "none";
    this.ctx = this.el.getContext("2d")!;
    this.draw("neutral");
  }

  private draw(expression: ExpressionName): void {
    const ctx = this.ctx;
    const params = EXPRESSIONS[expression];
    const w = CANVAS_SIZE;
    const h = CANVAS_SIZE;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy + 4);

    // Body oval
    ctx.beginPath();
    ctx.ellipse(0, 16, 15, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.fur;
    ctx.fill();

    // Belly
    ctx.beginPath();
    ctx.ellipse(0, 18, 10, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.belly;
    ctx.fill();

    // Tail: overlapping ovals
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const tx = 14 + t * 14;
      const ty = 20 - t * 35;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 6, 5, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? PAL.tailDark : PAL.tailLight;
      ctx.fill();
    }

    // Paws
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 12, 14, 4, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = PAL.mask;
      ctx.fill();
    }

    // Feet
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 7, 34, 5, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = PAL.mask;
      ctx.fill();
    }

    // Head circle
    ctx.beginPath();
    ctx.arc(0, -10, 19, 0, Math.PI * 2);
    ctx.fillStyle = PAL.fur;
    ctx.fill();

    // Ears
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 14, -25, 7, 0, Math.PI * 2);
      ctx.fillStyle = PAL.fur;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(side * 14, -25, 4, 0, Math.PI * 2);
      ctx.fillStyle = PAL.earInner;
      ctx.fill();
    }

    // Mask patches (teardrop shapes around eyes)
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 7, -11, 8, 6, side * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = PAL.mask;
      ctx.fill();
    }
    // Light bridge between patches
    ctx.beginPath();
    ctx.ellipse(0, -12, 3, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.fur;
    ctx.fill();

    // Eyes
    const eyeSpacing = 7;
    const eyeY = -11;
    if (expression === "happy") {
      // Happy closed eyes (arcs)
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * eyeSpacing, eyeY, 4, Math.PI * 0.1, Math.PI * 0.9);
        ctx.strokeStyle = PAL.eyeWhite;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      const eR = 4 * params.eyeScale;
      for (const side of [-1, 1]) {
        // Sclera
        ctx.beginPath();
        ctx.arc(side * eyeSpacing, eyeY, eR, 0, Math.PI * 2);
        ctx.fillStyle = PAL.eyeWhite;
        ctx.fill();
        // Iris
        ctx.beginPath();
        ctx.arc(side * eyeSpacing, eyeY, eR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = PAL.eye;
        ctx.fill();
        // Shine dot (stars for energized)
        if (expression === "energized") {
          this.drawStar(ctx, side * eyeSpacing + 1.5, eyeY - 1.5, 2, 4, PAL.eyeWhite);
        } else {
          ctx.beginPath();
          ctx.arc(side * eyeSpacing + 1.5, eyeY - 1.5, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = PAL.eyeWhite;
          ctx.fill();
        }
        // Tired: eyelid
        if (expression === "tired") {
          ctx.beginPath();
          ctx.moveTo(side * eyeSpacing - eR, eyeY - 1);
          ctx.lineTo(side * eyeSpacing + eR, eyeY - 1);
          ctx.lineTo(side * eyeSpacing + eR, eyeY - eR);
          ctx.arc(side * eyeSpacing, eyeY, eR, -Math.PI * 0.05, -Math.PI * 0.95, true);
          ctx.fillStyle = PAL.mask;
          ctx.fill();
        }
      }
    }

    // Nose
    ctx.beginPath();
    ctx.ellipse(0, -4, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.nose;
    ctx.fill();

    // Whiskers
    for (const side of [-1, 1]) {
      for (const angle of [-0.2, 0.2]) {
        ctx.beginPath();
        ctx.moveTo(side * 3, -3);
        ctx.lineTo(side * 14, -3 + angle * 20);
        ctx.strokeStyle = PAL.whisker;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Mouth
    if (expression === "happy") {
      // W-shaped mouth
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.quadraticCurveTo(-2, 3, 0, 0);
      ctx.quadraticCurveTo(2, 3, 4, -1);
      ctx.strokeStyle = PAL.nose;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (expression === "desperate") {
      // Open O
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = PAL.nose;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(0, params.mouthCurve * -5, 4, 0);
      ctx.strokeStyle = PAL.nose;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Cheek blush
    const accent = EXPR_ACCENTS[expression];
    if ((expression === "happy" || expression === "energized") && accent) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * 13, -6, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Desperate extras
    if (expression === "desperate") {
      // Teardrop
      ctx.beginPath();
      ctx.moveTo(10, -13);
      ctx.quadraticCurveTo(13, -8, 10, -6);
      ctx.quadraticCurveTo(7, -8, 10, -13);
      ctx.fillStyle = "#93C5FD";
      ctx.fill();
      // Distress lines
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-8 + i * 8, -34);
        ctx.lineTo(-5 + i * 8, -38);
        ctx.strokeStyle = PAL.mask;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    points: number,
    color: string,
  ): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.4;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
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
    this.el.style.left = `${x - CANVAS_SIZE / 2}px`;
    this.el.style.top = `${y - CANVAS_SIZE / 2}px`;
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
