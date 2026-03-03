export interface TextBoxOptions {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize?: number;
  color?: string;
}

export class TextBox {
  el: HTMLDivElement;
  private fullText: string;
  private charsPerSecond = 30;

  constructor(options: TextBoxOptions) {
    this.fullText = options.text;

    this.el = document.createElement("div");
    this.el.className = "text-box";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.maxWidth = `${options.maxWidth}px`;
    this.el.style.fontSize = `${options.fontSize ?? 22}px`;
    this.el.style.lineHeight = `${(options.fontSize ?? 22) * 1.4}px`;
    if (options.color) {
      this.el.style.color = options.color;
    }
  }

  show(): Promise<void> {
    return new Promise((resolve) => {
      let charIndex = 0;
      this.el.textContent = "";
      const intervalMs = 1000 / this.charsPerSecond;
      const timer = setInterval(() => {
        charIndex++;
        this.el.textContent = this.fullText.slice(0, charIndex);
        if (charIndex >= this.fullText.length) {
          clearInterval(timer);
          resolve();
        }
      }, intervalMs);
    });
  }

  showInstant(): void {
    this.el.textContent = this.fullText;
  }

  hide(): void {
    this.el.style.opacity = "0";
  }

  setText(text: string): void {
    this.fullText = text;
    this.el.textContent = text;
  }

  set y(val: number) {
    this.el.style.top = `${val}px`;
  }
}
