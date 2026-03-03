import { update as updateTweens } from "@tweenjs/tween.js";
import { SceneManager } from "./engine/SceneManager";
import { WillpowerBar } from "./engine/WillpowerBar";
import { Ch0_Morning } from "./chapters/Ch0_Morning";
import { Ch1_Starting } from "./chapters/Ch1_Starting";
import { Ch2_Stopping } from "./chapters/Ch2_Stopping";
import { Ch3_Day } from "./chapters/Ch3_Day";
import { Ch4_Fibers } from "./chapters/Ch4_Fibers";
import { Ch5_DeathSpiral } from "./chapters/Ch5_DeathSpiral";
import { Ch6_Levers } from "./chapters/Ch6_Levers";
import { Ch7_Sandbox } from "./chapters/Ch7_Sandbox";

export class Game {
  gameEl: HTMLElement;
  sceneManager: SceneManager;
  willpowerBar: WillpowerBar;
  private rafId = 0;

  constructor(gameEl: HTMLElement) {
    this.gameEl = gameEl;
    this.sceneManager = new SceneManager(gameEl);

    const barWidth = Math.min(400, gameEl.clientWidth * 0.6);
    this.willpowerBar = new WillpowerBar({
      x: (gameEl.clientWidth - barWidth) / 2,
      y: 16,
      width: barWidth,
      height: 20,
    });
    gameEl.appendChild(this.willpowerBar.el);

    // Global animation loop for tweens
    const tick = () => {
      updateTweens();
      this.willpowerBar.update();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  start(): void {
    const chapters = [
      () => new Ch0_Morning(this),
      () => new Ch1_Starting(this),
      () => new Ch2_Stopping(this),
      () => new Ch3_Day(this),
      () => new Ch4_Fibers(this),
      () => new Ch5_DeathSpiral(this),
      () => new Ch6_Levers(this),
      () => new Ch7_Sandbox(this),
    ];

    const loadChapter = (index: number) => {
      if (index >= chapters.length) return;
      const chapter = chapters[index]();
      chapter.onComplete = () => {
        loadChapter(index + 1);
      };
      this.sceneManager.goTo(chapter);
    };

    loadChapter(0);
  }
}
