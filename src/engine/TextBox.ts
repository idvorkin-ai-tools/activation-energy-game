import { Container, Text, TextStyle } from "pixi.js";

export interface TextBoxOptions {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize?: number;
  color?: string;
}

export class TextBox extends Container {
  private fullText: string;
  private textDisplay: Text;
  private charsPerSecond = 30;

  constructor(options: TextBoxOptions) {
    super();

    this.fullText = options.text;
    this.x = options.x;
    this.y = options.y;

    const style = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: options.fontSize ?? 22,
      fill: options.color ?? "#e0e0e0",
      wordWrap: true,
      wordWrapWidth: options.maxWidth,
      lineHeight: (options.fontSize ?? 22) * 1.4,
    });

    this.textDisplay = new Text({ text: "", style });
    this.addChild(this.textDisplay);
  }

  /** Typewriter effect — adds one character at a time at 30 chars/sec. */
  show(): Promise<void> {
    return new Promise((resolve) => {
      let charIndex = 0;
      const intervalMs = 1000 / this.charsPerSecond;
      const timer = setInterval(() => {
        charIndex++;
        this.textDisplay.text = this.fullText.slice(0, charIndex);
        if (charIndex >= this.fullText.length) {
          clearInterval(timer);
          resolve();
        }
      }, intervalMs);
    });
  }

  /** Show all text immediately. */
  showInstant(): void {
    this.textDisplay.text = this.fullText;
  }

  /** Hide the text box. */
  hide(): void {
    this.alpha = 0;
  }

  /** Update the text content. */
  setText(text: string): void {
    this.fullText = text;
    this.textDisplay.text = text;
  }
}
