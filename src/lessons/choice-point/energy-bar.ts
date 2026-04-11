import { ARCADE_PALETTE } from "./palette";

/**
 * Raccoon energy bar for the Choice Point Catcher lesson.
 *
 * Diegetic feedback for the raccoon's state — NOT scoring. Starts at 100, can
 * go to 0, never game-over. Costs are configured by the caller (see game.ts):
 *   routing: -3 (+ -5 if fast)
 *   missed: -2
 *   reflection confirmed: +5
 *   reflection depends: +10
 */
export class EnergyBar {
  readonly el: HTMLDivElement;
  private fill: HTMLDivElement;
  private _value = 100;
  private readonly _max = 100;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "cp-energy-bar";
    this.el.innerHTML = `
      <div class="cp-energy-track">
        <div class="cp-energy-fill" style="width:100%"></div>
      </div>
      <div class="cp-energy-label">raccoon energy</div>
    `;
    this.fill = this.el.querySelector<HTMLDivElement>(".cp-energy-fill")!;
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById("cp-energy-bar-styles")) return;
    const style = document.createElement("style");
    style.id = "cp-energy-bar-styles";
    style.textContent = `
      .cp-energy-bar {
        position: absolute;
        left: 20px;
        right: 20px;
        top: 16px;
        z-index: 5;
        pointer-events: none;
      }
      .cp-energy-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        overflow: hidden;
      }
      .cp-energy-fill {
        height: 100%;
        width: 100%;
        background: ${ARCADE_PALETTE.accent};
        border-radius: 3px;
        transition: width 400ms ease;
      }
      .cp-energy-label {
        margin-top: 4px;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        font-size: 10px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: ${ARCADE_PALETTE.hudText};
        text-align: right;
      }
    `;
    document.head.appendChild(style);
  }

  setValue(value: number): void {
    this._value = Math.max(0, Math.min(this._max, value));
    this.fill.style.width = `${(this._value / this._max) * 100}%`;
  }

  getValue(): number {
    return this._value;
  }

  adjust(delta: number): void {
    this.setValue(this._value + delta);
  }

  reset(): void {
    this.setValue(100);
  }
}
