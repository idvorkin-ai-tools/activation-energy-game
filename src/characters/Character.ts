import { ExpressionName, EXPRESSIONS } from "./expressions";

const CANVAS_SIZE = 100;

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

// Blush colors for happy / energized
const BLUSH_COLOR: Record<string, string> = {
  happy: "#E8A0A0",
  energized: "#22D3EE",
};

// Geometry — big-head chibi proportions (head r=32)
const HEAD_R = 32;
const BODY_W = 12;
const BODY_H = 14;
const BODY_Y = 24;
const BELLY_W = 8;
const BELLY_H = 10;
const HEAD_Y = -18;
const EAR_Y = -44;
const EAR_X = 23;
const EAR_R = 11;
const EYE_SPACING = 12;
const EYE_Y = -19;
const EYE_R = 7;
const MASK_W = 13;
const MASK_H = 10;
const NOSE_Y = -6;
const MOUTH_Y = 2;
const WHISKER_LEN = 23;
const BLUSH_X = 22;
const BLUSH_Y = -9;
const BLUSH_R = 5;

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
    ctx.translate(cx, cy + 6);

    // Body oval
    ctx.beginPath();
    ctx.ellipse(0, BODY_Y, BODY_W, BODY_H, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.fur;
    ctx.fill();

    // Belly
    ctx.beginPath();
    ctx.ellipse(0, BODY_Y + 2, BELLY_W, BELLY_H, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.belly;
    ctx.fill();

    // Tail: overlapping ovals
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.ellipse(
        BODY_W - 1 + t * 14,
        BODY_Y + 4 - t * 35,
        6,
        5,
        0.3,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = i % 2 === 0 ? PAL.tailDark : PAL.tailLight;
      ctx.fill();
    }

    // Paws
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * (BODY_W - 3), BODY_Y - 2, 4, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = PAL.mask;
      ctx.fill();
    }

    // Feet
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        side * 7,
        BODY_Y + BODY_H - 2,
        5,
        3,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = PAL.mask;
      ctx.fill();
    }

    // Head circle
    ctx.beginPath();
    ctx.arc(0, HEAD_Y, HEAD_R, 0, Math.PI * 2);
    ctx.fillStyle = PAL.fur;
    ctx.fill();

    // Ears
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * EAR_X, EAR_Y, EAR_R, 0, Math.PI * 2);
      ctx.fillStyle = PAL.fur;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(side * EAR_X, EAR_Y, EAR_R * 0.57, 0, Math.PI * 2);
      ctx.fillStyle = PAL.earInner;
      ctx.fill();
    }

    // Mask patches (teardrop shapes around eyes)
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        side * EYE_SPACING,
        EYE_Y,
        MASK_W,
        MASK_H,
        side * 0.15,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = PAL.mask;
      ctx.fill();
    }
    // Light bridge between patches
    ctx.beginPath();
    ctx.ellipse(0, EYE_Y - 1, 3, HEAD_R * 0.24, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.fur;
    ctx.fill();

    // Eyes
    if (expression === "happy") {
      // Happy closed eyes (arcs)
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(
          side * EYE_SPACING,
          EYE_Y,
          EYE_R,
          Math.PI * 0.1,
          Math.PI * 0.9,
        );
        ctx.strokeStyle = PAL.eyeWhite;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      const eR = EYE_R * params.eyeScale;
      for (const side of [-1, 1]) {
        // Sclera
        ctx.beginPath();
        ctx.arc(side * EYE_SPACING, EYE_Y, eR, 0, Math.PI * 2);
        ctx.fillStyle = PAL.eyeWhite;
        ctx.fill();
        // Iris
        ctx.beginPath();
        ctx.arc(side * EYE_SPACING, EYE_Y, eR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = PAL.eye;
        ctx.fill();
        // Shine dot (stars for energized)
        if (expression === "energized") {
          this.drawStar(
            ctx,
            side * EYE_SPACING + 1.5,
            EYE_Y - 1.5,
            2.5,
            4,
            PAL.eyeWhite,
          );
        } else {
          ctx.beginPath();
          ctx.arc(
            side * EYE_SPACING + 1.5,
            EYE_Y - 1.5,
            1.2,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = PAL.eyeWhite;
          ctx.fill();
        }
        // Tired: eyelid
        if (expression === "tired") {
          ctx.beginPath();
          ctx.moveTo(side * EYE_SPACING - eR, EYE_Y - 1);
          ctx.lineTo(side * EYE_SPACING + eR, EYE_Y - 1);
          ctx.lineTo(side * EYE_SPACING + eR, EYE_Y - eR);
          ctx.arc(
            side * EYE_SPACING,
            EYE_Y,
            eR,
            -Math.PI * 0.05,
            -Math.PI * 0.95,
            true,
          );
          ctx.fillStyle = PAL.mask;
          ctx.fill();
        }
      }
    }

    // Nose
    ctx.beginPath();
    ctx.ellipse(0, NOSE_Y, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAL.nose;
    ctx.fill();

    // Whiskers
    for (const side of [-1, 1]) {
      for (const angle of [-0.2, 0.2]) {
        ctx.beginPath();
        ctx.moveTo(side * 3, NOSE_Y + 1);
        ctx.lineTo(side * WHISKER_LEN, NOSE_Y + 1 + angle * 20);
        ctx.strokeStyle = PAL.whisker;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Mouth
    if (expression === "happy") {
      // W-shaped mouth
      ctx.beginPath();
      ctx.moveTo(-4, MOUTH_Y - 1);
      ctx.quadraticCurveTo(-2, MOUTH_Y + 3, 0, MOUTH_Y);
      ctx.quadraticCurveTo(2, MOUTH_Y + 3, 4, MOUTH_Y - 1);
      ctx.strokeStyle = PAL.nose;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (expression === "desperate") {
      // Open O
      ctx.beginPath();
      ctx.ellipse(0, MOUTH_Y, 3, 4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = PAL.nose;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-4, MOUTH_Y);
      ctx.quadraticCurveTo(0, MOUTH_Y + params.mouthCurve * -5, 4, MOUTH_Y);
      ctx.strokeStyle = PAL.nose;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Cheek blush (happy / energized)
    if (expression in BLUSH_COLOR) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * BLUSH_X, BLUSH_Y, BLUSH_R, 0, Math.PI * 2);
        ctx.fillStyle = BLUSH_COLOR[expression];
        ctx.globalAlpha = 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Stressed: sweat drop
    if (expression === "stressed") {
      const sx = -EAR_X + 2;
      const sy = EAR_Y + 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx - 2, sy + 6, sx, sy + 8);
      ctx.quadraticCurveTo(sx + 2, sy + 6, sx, sy);
      ctx.fillStyle = "#93C5FD";
      ctx.fill();
    }

    // Desperate extras
    if (expression === "desperate") {
      // Teardrop
      ctx.beginPath();
      ctx.moveTo(EYE_SPACING + 3, EYE_Y);
      ctx.quadraticCurveTo(EYE_SPACING + 6, EYE_Y + 5, EYE_SPACING + 3, EYE_Y + 7);
      ctx.quadraticCurveTo(EYE_SPACING, EYE_Y + 5, EYE_SPACING + 3, EYE_Y);
      ctx.fillStyle = "#93C5FD";
      ctx.fill();
      // Distress lines
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-8 + i * 8, HEAD_Y - HEAD_R - 4);
        ctx.lineTo(-5 + i * 8, HEAD_Y - HEAD_R - 8);
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
