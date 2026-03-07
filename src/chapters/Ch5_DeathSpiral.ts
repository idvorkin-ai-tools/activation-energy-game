import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { SpiralAnimation } from "../interactions/SpiralAnimation";
import { createSkipButton } from "../engine/SkipButton";
import type { Game } from "../Game";

export class Ch5_DeathSpiral extends Scene {
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

    const text1 = new TextBox({ text: "Let's watch a spiral happen.", x: textX, y: 50, maxWidth: textMaxW });
    this.el.appendChild(text1.el);
    await text1.show();
    await this.delay(600);

    const spiralWidth = Math.min(w - 60, 800);
    const spiral = new SpiralAnimation({
      x: (w - spiralWidth) / 2, y: 100,
      width: spiralWidth, height: h * 0.5,
    });
    this.el.appendChild(spiral.el);

    // Wait for spiral play to complete (or skip)
    let playResolve: () => void;
    let playResolved = false;
    const playPromise = new Promise<void>((resolve) => {
      playResolve = () => { if (!playResolved) { playResolved = true; resolve(); } };
    });
    spiral.onPlayComplete = playResolve!;
    const cleanupPlaySkip = createSkipButton(this.el, w, h, playResolve!);
    await playPromise;
    cleanupPlaySkip();

    await this.delay(800);

    const text2 = new TextBox({ text: "That's a death spiral.", x: textX, y: h - 240, maxWidth: textMaxW });
    this.el.appendChild(text2.el);
    await text2.show();
    await this.delay(1000);

    spiral.showRewindButton();

    const text3 = new TextBox({
      text: "But here's the thing: it also works in reverse. Press Rewind to see.",
      x: textX, y: h - 200, maxWidth: textMaxW,
      fontSize: 16, color: "#f97316",
    });
    this.el.appendChild(text3.el);
    await text3.show();

    // Wait for rewind (or skip)
    let rewindResolve: () => void;
    let rewindResolved = false;
    const rewindPromise = new Promise<void>((resolve) => {
      rewindResolve = () => { if (!rewindResolved) { rewindResolved = true; resolve(); } };
    });
    spiral.onRewindComplete = rewindResolve!;
    const cleanupRewindSkip = createSkipButton(this.el, w, h, rewindResolve!);
    await rewindPromise;
    cleanupRewindSkip();

    text3.hide();
    await this.delay(600);

    const text4 = new TextBox({
      text: "One good choice doesn't fix everything. But it stops the cascade.",
      x: textX, y: h - 160, maxWidth: textMaxW,
    });
    this.el.appendChild(text4.el);
    await text4.show();

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
