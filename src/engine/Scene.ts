import { Container, Application } from "pixi.js";

export abstract class Scene {
  container: Container;
  app: Application;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
  }

  /** Called when scene becomes active. Set up visuals, start animations. */
  abstract enter(): Promise<void>;

  /** Called when scene is leaving. Clean up, fade out. */
  abstract exit(): Promise<void>;

  /** Get canvas width */
  get width(): number {
    return this.app.screen.width;
  }

  /** Get canvas height */
  get height(): number {
    return this.app.screen.height;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
