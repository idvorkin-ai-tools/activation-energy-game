import { Tween, Group } from "@tweenjs/tween.js";

export interface WillpowerBarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FiberSegment {
  name: string;
  color: string;
  value: number;
}

export class WillpowerBar {
  el: HTMLDivElement;
  private trackEl: HTMLDivElement;
  private fillEl: HTMLDivElement;
  private labelEl: HTMLDivElement;
  private tweenGroup: Group;
  private barWidth: number;
  private barHeight: number;
  private currentValue = 100;
  private maxValue = 100;
  private displayWidth: number;
  private fiberMode = false;
  private fibers: FiberSegment[] = [];

  constructor(options: WillpowerBarOptions) {
    this.barWidth = options.width;
    this.barHeight = options.height;
    this.displayWidth = this.barWidth;
    this.tweenGroup = new Group();

    this.el = document.createElement("div");
    this.el.className = "willpower-bar";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;

    // Label above bar
    this.labelEl = document.createElement("div");
    this.labelEl.className = "willpower-bar__label";
    this.labelEl.style.bottom = `${options.height + 4}px`;
    this.labelEl.textContent = `${this.currentValue}/${this.maxValue}`;
    this.el.appendChild(this.labelEl);

    // Track
    this.trackEl = document.createElement("div");
    this.trackEl.className = "willpower-bar__track";
    this.trackEl.style.width = `${options.width}px`;
    this.trackEl.style.height = `${options.height}px`;
    this.el.appendChild(this.trackEl);

    // Fill (single-color mode)
    this.fillEl = document.createElement("div");
    this.fillEl.className = "willpower-bar__fill";
    this.fillEl.style.width = `${this.displayWidth}px`;
    this.fillEl.style.background = this.getBarColor(1);
    this.trackEl.appendChild(this.fillEl);
  }

  private getBarColor(pct: number): string {
    if (pct > 0.6) return "#4ade80";
    if (pct > 0.3) return "#facc15";
    return "#ef4444";
  }

  private drawFill(): void {
    if (this.fiberMode && this.fibers.length > 0) {
      // Create a linear-gradient from fiber segment colors
      const totalValue = this.fibers.reduce((sum, f) => sum + f.value, 0);
      if (totalValue <= 0) {
        this.fillEl.style.width = "0px";
        this.fillEl.style.background = "transparent";
        return;
      }
      const stops: string[] = [];
      let pct = 0;
      for (const fiber of this.fibers) {
        const segPct = (fiber.value / totalValue) * 100;
        stops.push(`${fiber.color} ${pct}% ${pct + segPct}%`);
        pct += segPct;
      }
      this.fillEl.style.width = `${this.displayWidth}px`;
      this.fillEl.style.background = `linear-gradient(to right, ${stops.join(", ")})`;
    } else {
      const pct = this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
      this.fillEl.style.width = `${this.displayWidth}px`;
      this.fillEl.style.background = this.getBarColor(pct);
    }
  }

  setValue(value: number, max?: number): void {
    if (max !== undefined) this.maxValue = max;
    const targetValue = Math.max(0, Math.min(value, this.maxValue));
    const targetWidth = this.maxValue > 0
      ? (targetValue / this.maxValue) * this.barWidth
      : 0;

    const obj = { w: this.displayWidth, v: this.currentValue };
    const tween = new Tween(obj)
      .to({ w: targetWidth, v: targetValue }, 500)
      .onUpdate(() => {
        this.displayWidth = obj.w;
        this.currentValue = Math.round(obj.v);
        this.labelEl.textContent = `${this.currentValue}/${this.maxValue}`;
        this.drawFill();
      })
      .onComplete(() => {
        this.currentValue = targetValue;
        this.displayWidth = targetWidth;
        this.labelEl.textContent = `${this.currentValue}/${this.maxValue}`;
        this.drawFill();
      });
    this.tweenGroup.add(tween);
    tween.start();
  }

  setFiberMode(fibers: FiberSegment[]): void {
    this.fiberMode = true;
    this.fibers = fibers;

    const totalValue = fibers.reduce((sum, f) => sum + f.value, 0);
    this.displayWidth = this.maxValue > 0
      ? (totalValue / this.maxValue) * this.barWidth
      : 0;

    this.currentValue = totalValue;
    this.labelEl.textContent = `${Math.round(totalValue)}/${this.maxValue}`;
    this.drawFill();
  }

  update(): void {
    this.tweenGroup.update();
  }
}
