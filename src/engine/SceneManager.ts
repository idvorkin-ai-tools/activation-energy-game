import { Scene } from "./Scene";

export class SceneManager {
  currentScene: Scene | null = null;
  private gameEl: HTMLElement;

  constructor(gameEl: HTMLElement) {
    this.gameEl = gameEl;
  }

  async goTo(scene: Scene): Promise<void> {
    if (this.currentScene) {
      await this.fadeOut(this.currentScene);
      this.currentScene.destroy();
    }

    this.currentScene = scene;
    scene.el.style.opacity = "0";
    this.gameEl.appendChild(scene.el);

    // Force reflow so the transition triggers
    void scene.el.offsetHeight;

    await this.fadeIn(scene);
    await scene.enter();
  }

  private fadeOut(scene: Scene): Promise<void> {
    return new Promise((resolve) => {
      scene.el.style.opacity = "0";
      scene.el.addEventListener("transitionend", () => resolve(), { once: true });
      setTimeout(resolve, 450);
    });
  }

  private fadeIn(scene: Scene): Promise<void> {
    return new Promise((resolve) => {
      scene.el.style.opacity = "1";
      scene.el.addEventListener("transitionend", () => resolve(), { once: true });
      setTimeout(resolve, 450);
    });
  }
}
