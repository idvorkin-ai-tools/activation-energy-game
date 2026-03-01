import { Application } from "pixi.js";
import { SceneManager } from "./engine/SceneManager";
import { WillpowerBar } from "./engine/WillpowerBar";

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
    console.log("Activation Energy: Game engine ready — awaiting chapters");
  }
}
