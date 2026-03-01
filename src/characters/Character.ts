import { Container, Graphics } from "pixi.js";
import { Tween } from "@tweenjs/tween.js";
import { ExpressionName, EXPRESSIONS } from "./expressions";

/**
 * A simple round character drawn entirely with PIXI Graphics.
 * Inspired by Nicky Case's explorable explanations style —
 * pill-shaped body with expressive face.
 *
 * Roughly 60px wide, 80px tall. Origin at center of body.
 */
export class Character {
  container: Container;
  private body: Graphics;
  private leftEye: Graphics;
  private rightEye: Graphics;
  private mouth: Graphics;
  private leftBrow: Graphics;
  private rightBrow: Graphics;
  private currentExpression: ExpressionName = "neutral";

  private readonly BODY_RADIUS = 25;
  private readonly HEAD_RADIUS = 18;

  constructor() {
    this.container = new Container();

    this.body = new Graphics();
    this.leftEye = new Graphics();
    this.rightEye = new Graphics();
    this.mouth = new Graphics();
    this.leftBrow = new Graphics();
    this.rightBrow = new Graphics();

    this.container.addChild(
      this.body,
      this.leftEye,
      this.rightEye,
      this.mouth,
      this.leftBrow,
      this.rightBrow,
    );

    this.draw("neutral");
  }

  /** Redraw the character with the given expression */
  private draw(expression: ExpressionName): void {
    const params = EXPRESSIONS[expression];

    // --- Body: pill shape (large circle) + head (smaller circle on top) ---
    this.body.clear();
    this.body.circle(0, 20, this.BODY_RADIUS).fill(params.bodyTint);
    this.body.circle(0, -15, this.HEAD_RADIUS).fill(params.bodyTint);

    // --- Eyes: two small circles on the head ---
    const eyeY = -18;
    const eyeSpacing = 8;
    const eyeRadius = 3 * params.eyeScale;

    this.leftEye.clear();
    this.leftEye.circle(-eyeSpacing, eyeY, eyeRadius).fill(0x1a1a2e);

    this.rightEye.clear();
    this.rightEye.circle(eyeSpacing, eyeY, eyeRadius).fill(0x1a1a2e);

    // --- Mouth: quadratic bezier curve ---
    // Control point y shifts up for smile (negative mouthCurve * -8 = positive offset)
    // and down for frown
    this.mouth.clear();
    this.mouth.moveTo(-6, -8);
    const cpY = -8 + params.mouthCurve * -8;
    this.mouth.quadraticCurveTo(0, cpY, 6, -8);
    this.mouth.stroke({ width: 2, color: 0x1a1a2e });

    // --- Eyebrows: small angled lines above each eye ---
    const browY = eyeY - 6 + params.browOffset;
    const browAngle = params.browOffset * 0.3;

    this.leftBrow.clear();
    this.leftBrow
      .moveTo(-eyeSpacing - 3, browY)
      .lineTo(-eyeSpacing + 3, browY - browAngle);
    this.leftBrow.stroke({ width: 1.5, color: 0x1a1a2e });

    this.rightBrow.clear();
    this.rightBrow
      .moveTo(eyeSpacing - 3, browY - browAngle)
      .lineTo(eyeSpacing + 3, browY);
    this.rightBrow.stroke({ width: 1.5, color: 0x1a1a2e });
  }

  /** Change expression (redraws immediately) */
  setExpression(expression: ExpressionName): void {
    this.currentExpression = expression;
    this.draw(expression);
  }

  /** Get current expression name */
  getExpression(): ExpressionName {
    return this.currentExpression;
  }

  /** Animate walking to a position. Returns a promise that resolves on arrival. */
  walkTo(x: number, y: number, durationMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const pos = { x: this.container.x, y: this.container.y };
      new Tween(pos)
        .to({ x, y }, durationMs)
        .onUpdate(() => {
          this.container.x = pos.x;
          this.container.y = pos.y;
        })
        .onComplete(() => resolve())
        .start();
    });
  }

  /** Set position directly (no animation) */
  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  /** Map a willpower percentage (0-100) to an appropriate expression */
  static expressionForWillpower(percent: number): ExpressionName {
    if (percent > 80) return "energized";
    if (percent > 60) return "happy";
    if (percent > 40) return "neutral";
    if (percent > 20) return "tired";
    if (percent > 10) return "stressed";
    return "desperate";
  }
}
