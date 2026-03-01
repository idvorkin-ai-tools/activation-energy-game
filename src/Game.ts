import { Application } from "pixi.js";
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
  app: Application;
  sceneManager: SceneManager;
  willpowerBar: WillpowerBar;

  constructor(app: Application) {
    this.app = app;
    this.sceneManager = new SceneManager(app);

    // Willpower bar positioned at top center
    const barWidth = Math.min(400, app.screen.width * 0.6);
    this.willpowerBar = new WillpowerBar({
      x: (app.screen.width - barWidth) / 2,
      y: 16,
      width: barWidth,
      height: 20,
    });
    app.stage.addChild(this.willpowerBar);

    // Register ticker for tween updates
    app.ticker.add(() => {
      this.sceneManager.update();
      this.willpowerBar.update();
    });
  }

  start(): void {
    const chapters = [
      () => new Ch0_Morning(this.app, this),
      () => new Ch1_Starting(this.app, this),
      () => new Ch2_Stopping(this.app, this),
      () => new Ch3_Day(this.app, this),
      () => new Ch4_Fibers(this.app, this),
      () => new Ch5_DeathSpiral(this.app, this),
      () => new Ch6_Levers(this.app, this),
      () => new Ch7_Sandbox(this.app, this),
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
