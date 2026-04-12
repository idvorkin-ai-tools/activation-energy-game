/**
 * Thin horizontal bar at the top of the screen that darkens/lengthens as
 * the struggle continues. NOT a willpower bar — no label, no number, just
 * a silent line that gets darker and longer. The rising line is fatigue.
 */
export class ExhaustionBar {
  el: HTMLDivElement;
  private fill: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "dtr-exhaustion";
    this.fill = document.createElement("div");
    this.fill.className = "dtr-exhaustion-fill";
    this.el.appendChild(this.fill);
    this.setLevel(0);
  }

  /** level in [0, 1] */
  setLevel(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));
    this.fill.style.width = `${clamped * 100}%`;
    // Darken with level — from #4a4a4a to #0a0a0a
    const dark = Math.round(74 - clamped * 64);
    this.fill.style.background = `rgb(${dark},${dark},${dark})`;
  }

  reset(): void {
    this.setLevel(0);
  }
}
