export class EnergyBar {
  readonly el: HTMLDivElement;
  private fill: HTMLDivElement;
  private label: HTMLSpanElement;
  private timeLabel: HTMLSpanElement;
  private _value = 70;
  private _max = 100;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "mc-energy-bar";
    this.el.innerHTML = `
      <span class="mc-energy-label">Energy: 70</span>
      <div class="mc-energy-track">
        <div class="mc-energy-fill" style="width:70%"></div>
      </div>
      <span class="mc-time-label">6:00 AM</span>
    `;
    this.fill = this.el.querySelector(".mc-energy-fill")!;
    this.label = this.el.querySelector(".mc-energy-label")!;
    this.timeLabel = this.el.querySelector(".mc-time-label")!;

    const style = document.createElement("style");
    style.textContent = `
      .mc-energy-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        max-width: 600px;
        margin: 0 auto;
      }
      .mc-energy-label {
        color: #e0e0ff;
        font-size: 14px;
        min-width: 80px;
        font-family: monospace;
      }
      .mc-time-label {
        color: #e0e0ff;
        font-size: 14px;
        min-width: 70px;
        font-family: monospace;
        text-align: right;
      }
      .mc-energy-track {
        flex: 1;
        height: 16px;
        background: #333;
        border-radius: 8px;
        overflow: hidden;
      }
      .mc-energy-fill {
        height: 100%;
        border-radius: 8px;
        transition: width 0.8s ease, background-color 0.8s ease;
      }
    `;
    this.el.appendChild(style);
    this.updateColor();
  }

  get value(): number { return this._value; }

  setTime(time: string): void {
    this.timeLabel.textContent = time;
  }

  setValue(v: number): void {
    this._value = Math.max(0, Math.min(this._max, v));
    this.fill.style.width = `${(this._value / this._max) * 100}%`;
    this.label.textContent = `Energy: ${this._value}`;
    this.updateColor();
  }

  private updateColor(): void {
    const pct = this._value / this._max;
    let color: string;
    if (pct > 0.6) color = "#4a4";
    else if (pct > 0.3) color = "#aa4";
    else if (pct > 0.15) color = "#c84";
    else color = "#c44";
    this.fill.style.backgroundColor = color;
  }
}
