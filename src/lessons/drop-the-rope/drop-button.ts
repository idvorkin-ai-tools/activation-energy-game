import { announce } from "./a11y";

export class DropButton {
  el: HTMLButtonElement;
  private onClickCallback: (() => void) | null = null;

  constructor() {
    this.el = document.createElement("button");
    this.el.className = "dtr-drop-button";
    this.el.textContent = "Drop the rope";
    this.el.setAttribute("aria-label", "Drop the rope");
    this.el.hidden = true;
    this.el.addEventListener("click", () => this.onClickCallback?.());
    // Enter key triggers the button when focused (default browser behavior)
  }

  onClick(cb: () => void): void {
    this.onClickCallback = cb;
  }

  /** Fade in over 1.2s, deliberately low-contrast */
  async fadeIn(): Promise<void> {
    this.el.hidden = false;
    this.el.style.opacity = "0";
    // Force reflow
    void this.el.offsetHeight;
    this.el.style.transition = "opacity 1.2s linear";
    this.el.style.opacity = "1";
    // Announce to screen readers per Q10
    announce("Drop the rope button is now available");
    // Focus so keyboard users can press Enter
    this.el.focus();
    await new Promise((r) => setTimeout(r, 1200));
  }

  hide(): void {
    this.el.hidden = true;
    this.el.style.opacity = "0";
  }
}
