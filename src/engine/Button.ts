export interface ButtonOptions {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  onClick: () => void;
}

export class Button {
  el: HTMLButtonElement;

  constructor(options: ButtonOptions) {
    this.el = document.createElement("button");
    this.el.className = "game-btn";
    this.el.textContent = options.text;
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    if (options.width) this.el.style.minWidth = `${options.width}px`;
    if (options.height) this.el.style.height = `${options.height}px`;

    this.el.addEventListener("click", () => {
      if (!this.el.disabled) options.onClick();
    });
  }

  setEnabled(enabled: boolean): void {
    this.el.disabled = !enabled;
  }
}
