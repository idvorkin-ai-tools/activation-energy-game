import { Application } from "pixi.js";
import { Tween, Group } from "@tweenjs/tween.js";
import { Scene } from "./Scene";

export class SceneManager {
  currentScene: Scene | null = null;
  private app: Application;
  private tweenGroup: Group;

  constructor(app: Application) {
    this.app = app;
    this.tweenGroup = new Group();
  }

  async goTo(scene: Scene): Promise<void> {
    // Fade out current scene
    if (this.currentScene) {
      await this.fadeOut(this.currentScene);
      this.app.stage.removeChild(this.currentScene.container);
      this.currentScene.destroy();
    }

    // Set up new scene
    this.currentScene = scene;
    scene.container.alpha = 0;
    this.app.stage.addChild(scene.container);
    await scene.enter();

    // Fade in new scene
    await this.fadeIn(scene);
  }

  private fadeOut(scene: Scene): Promise<void> {
    return new Promise((resolve) => {
      const obj = { alpha: 1 };
      const tween = new Tween(obj)
        .to({ alpha: 0 }, 400)
        .onUpdate(() => {
          scene.container.alpha = obj.alpha;
        })
        .onComplete(() => resolve());
      this.tweenGroup.add(tween);
      tween.start();
    });
  }

  private fadeIn(scene: Scene): Promise<void> {
    return new Promise((resolve) => {
      const obj = { alpha: 0 };
      const tween = new Tween(obj)
        .to({ alpha: 1 }, 400)
        .onUpdate(() => {
          scene.container.alpha = obj.alpha;
        })
        .onComplete(() => resolve());
      this.tweenGroup.add(tween);
      tween.start();
    });
  }

  update(): void {
    this.tweenGroup.update();
  }
}
