import { Application } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { SpiralAnimation } from "../interactions/SpiralAnimation";
import type { Game } from "../Game";

export class Ch5_DeathSpiral extends Scene {
  onComplete: (() => void) | null = null;
  private game: Game;

  constructor(app: Application, game: Game) {
    super(app);
    this.game = game;
  }

  async enter(): Promise<void> {
    const w = this.width;
    const h = this.height;
    const textX = 80;
    const textMaxW = w * 0.7;

    // ─── Intro ───────────────────────────────────────────────

    const text1 = new TextBox({
      text: "Let's watch a spiral happen.",
      x: textX,
      y: 50,
      maxWidth: textMaxW,
    });
    this.container.addChild(text1);
    await text1.show();

    await this.delay(600);

    // ─── Spiral Animation ────────────────────────────────────

    const spiralWidth = Math.min(w - 60, 800);
    const spiral = new SpiralAnimation({
      x: (w - spiralWidth) / 2,
      y: 100,
      width: spiralWidth,
      height: h * 0.5,
    });
    this.container.addChild(spiral);

    // Wait for the spiral play to complete
    await new Promise<void>((resolve) => {
      spiral.onPlayComplete = resolve;
    });

    await this.delay(800);

    const text2 = new TextBox({
      text: "That's a death spiral.",
      x: textX,
      y: h - 240,
      maxWidth: textMaxW,
    });
    this.container.addChild(text2);
    await text2.show();

    await this.delay(1000);

    // Show rewind button
    spiral.showRewindButton();

    const text3 = new TextBox({
      text: "But here's the thing: it also works in reverse. Press Rewind to see.",
      x: textX,
      y: h - 200,
      maxWidth: textMaxW,
      fontSize: 16,
      color: "#f97316",
    });
    this.container.addChild(text3);
    await text3.show();

    // Wait for intervention playback
    await new Promise<void>((resolve) => {
      spiral.onRewindComplete = resolve;
    });

    text3.hide();

    await this.delay(600);

    const text4 = new TextBox({
      text: "One good choice doesn't fix everything. But it stops the cascade.",
      x: textX,
      y: h - 160,
      maxWidth: textMaxW,
    });
    this.container.addChild(text4);
    await text4.show();

    // ─── Next Button ─────────────────────────────────────────

    const nextBtn = new Button({
      text: "Next \u2192",
      x: w - 160,
      y: h - 80,
      width: 120,
      height: 44,
      onClick: () => {
        if (this.onComplete) this.onComplete();
      },
    });
    this.container.addChild(nextBtn);
  }

  async exit(): Promise<void> {
    // Cleanup handled by Scene.destroy()
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
