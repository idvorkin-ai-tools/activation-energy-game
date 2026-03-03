import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { FiberRope } from "../interactions/FiberRope";
import { FIBER_KEYS, FIBER_COLORS } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import { createSkipButton } from "../engine/SkipButton";
import type { Game } from "../Game";

export class Ch4_Fibers extends Scene {
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
  }

  async enter(): Promise<void> {
    const w = this.width;
    const h = this.height;
    const textX = 80;
    const textMaxW = w * 0.7;

    const text1 = new TextBox({ text: "Remember that willpower bar?", x: textX, y: 60, maxWidth: textMaxW });
    this.el.appendChild(text1.el);
    await text1.show();
    await this.delay(800);

    const text2 = new TextBox({ text: "It's actually this.", x: textX, y: 110, maxWidth: textMaxW });
    this.el.appendChild(text2.el);
    await text2.show();

    // Animate the willpower bar into fiber mode
    await this.delay(600);
    const fibers = FiberModel.defaultFibers();
    const fiberSegments = FIBER_KEYS.map((key) => ({
      name: key, color: FIBER_COLORS[key], value: fibers[key],
    }));
    this.game.willpowerBar.setFiberMode(fiberSegments);
    await this.delay(800);

    const text3 = new TextBox({ text: "Your willpower isn't one muscle. It's five.", x: textX, y: 150, maxWidth: textMaxW });
    this.el.appendChild(text3.el);
    await text3.show();
    await this.delay(800);

    const text4 = new TextBox({
      text: "Think of it like a group of people lifting a heavy log. When everyone lifts together, the log rises easily. When one person drops out...",
      x: textX, y: 200, maxWidth: textMaxW,
    });
    this.el.appendChild(text4.el);
    await text4.show();
    await this.delay(600);

    const ropeWidth = Math.min(w - 80, 700);
    const rope = new FiberRope({
      x: (w - ropeWidth) / 2, y: 280,
      width: ropeWidth, height: 350,
    });
    this.el.appendChild(rope.el);

    let fiberResolve: () => void;
    let fiberResolved = false;
    const fiberPromise = new Promise<void>((resolve) => {
      fiberResolve = () => { if (!fiberResolved) { fiberResolved = true; resolve(); } };
    });

    const checkInterval = setInterval(() => {
      if (rope.getReleasedCount() >= 2) {
        clearInterval(checkInterval);
        fiberResolve();
      }
    }, 300);

    const cleanupSkip = createSkipButton(this.el, w, h, fiberResolve!);
    await fiberPromise;
    clearInterval(checkInterval);
    cleanupSkip();

    await this.delay(800);

    const text5 = new TextBox({
      text: "That's why a breakup makes it impossible to focus at work. Why losing your job makes you stop exercising.",
      x: textX, y: h - 240, maxWidth: textMaxW,
    });
    this.el.appendChild(text5.el);
    await text5.show();
    await this.delay(1200);

    const text6 = new TextBox({
      text: "Every role in your life is a willpower fiber. When one breaks, the others have to carry the weight.",
      x: textX, y: h - 190, maxWidth: textMaxW,
    });
    this.el.appendChild(text6.el);
    await text6.show();

    rope.showPresets();
    await this.delay(2000);

    const text7 = new TextBox({
      text: "Every fiber affects every other fiber. This isn't five independent bars. It's one system.",
      x: textX, y: h - 140, maxWidth: textMaxW,
    });
    this.el.appendChild(text7.el);
    await text7.show();
    await this.delay(1200);

    const text8 = new TextBox({
      text: "And when one fiber starts pulling the others down...",
      x: textX, y: h - 100, maxWidth: textMaxW,
    });
    this.el.appendChild(text8.el);
    await text8.show();

    const nextBtn = new Button({
      text: "Next \u2192", x: w - 160, y: h - 80, width: 120, height: 44,
      onClick: () => { if (this.onComplete) this.onComplete(); },
    });
    this.el.appendChild(nextBtn.el);
  }

  async exit(): Promise<void> {}

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
