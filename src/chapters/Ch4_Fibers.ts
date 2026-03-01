import { Application } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { FiberRope } from "../interactions/FiberRope";
import { FIBER_KEYS, FIBER_COLORS } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import type { Game } from "../Game";

export class Ch4_Fibers extends Scene {
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
      text: "Remember that willpower bar?",
      x: textX,
      y: 60,
      maxWidth: textMaxW,
    });
    this.container.addChild(text1);
    await text1.show();

    await this.delay(800);

    const text2 = new TextBox({
      text: "It's actually this.",
      x: textX,
      y: 110,
      maxWidth: textMaxW,
    });
    this.container.addChild(text2);
    await text2.show();

    // Animate the willpower bar into fiber mode
    await this.delay(600);

    const fibers = FiberModel.defaultFibers();
    const fiberSegments = FIBER_KEYS.map((key) => ({
      name: key,
      color: FIBER_COLORS[key],
      value: fibers[key],
    }));
    this.game.willpowerBar.setFiberMode(fiberSegments);

    await this.delay(800);

    const text3 = new TextBox({
      text: "Your willpower isn't one muscle. It's five.",
      x: textX,
      y: 150,
      maxWidth: textMaxW,
    });
    this.container.addChild(text3);
    await text3.show();

    await this.delay(800);

    const text4 = new TextBox({
      text: "Think of it like a group of people lifting a heavy log. When everyone lifts together, the log rises easily. When one person drops out...",
      x: textX,
      y: 200,
      maxWidth: textMaxW,
    });
    this.container.addChild(text4);
    await text4.show();

    await this.delay(600);

    // ─── Fiber Rope Interaction ──────────────────────────────

    const ropeWidth = Math.min(w - 80, 700);
    const rope = new FiberRope({
      x: (w - ropeWidth) / 2,
      y: 280,
      width: ropeWidth,
      height: 350,
    });
    this.container.addChild(rope);

    // Wait for player to click at least 2 holders
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (rope.getReleasedCount() >= 2) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 300);
    });

    await this.delay(800);

    const text5 = new TextBox({
      text: "That's why a breakup makes it impossible to focus at work. Why losing your job makes you stop exercising.",
      x: textX,
      y: h - 240,
      maxWidth: textMaxW,
    });
    this.container.addChild(text5);
    await text5.show();

    await this.delay(1200);

    const text6 = new TextBox({
      text: "Every role in your life is a willpower fiber. When one breaks, the others have to carry the weight.",
      x: textX,
      y: h - 190,
      maxWidth: textMaxW,
    });
    this.container.addChild(text6);
    await text6.show();

    // Show presets for exploration
    rope.showPresets();

    await this.delay(2000);

    const text7 = new TextBox({
      text: "Every fiber affects every other fiber. This isn't five independent bars. It's one system.",
      x: textX,
      y: h - 140,
      maxWidth: textMaxW,
    });
    this.container.addChild(text7);
    await text7.show();

    await this.delay(1200);

    const text8 = new TextBox({
      text: "And when one fiber starts pulling the others down...",
      x: textX,
      y: h - 100,
      maxWidth: textMaxW,
    });
    this.container.addChild(text8);
    await text8.show();

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
