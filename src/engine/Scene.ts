export abstract class Scene {
  el: HTMLDivElement;
  onComplete: (() => void) | null = null;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "scene";
  }

  abstract enter(): Promise<void>;
  abstract exit(): Promise<void>;

  get width(): number {
    return this.el.clientWidth;
  }

  get height(): number {
    return this.el.clientHeight;
  }

  destroy(): void {
    this.el.remove();
  }
}
