import { Container, Graphics, Text, TextStyle } from "pixi.js";
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

export class WillpowerBar extends Container {
  private barBg: Graphics;
  private barFill: Graphics;
  private valueLabel: Text;
  private tweenGroup: Group;
  private barWidth: number;
  private barHeight: number;
  private currentValue = 100;
  private maxValue = 100;
  private displayWidth: number;
  private fiberMode = false;
  private fibers: FiberSegment[] = [];

  constructor(options: WillpowerBarOptions) {
    super();

    this.x = options.x;
    this.y = options.y;
    this.barWidth = options.width;
    this.barHeight = options.height;
    this.displayWidth = this.barWidth;
    this.tweenGroup = new Group();

    // Background track
    this.barBg = new Graphics();
    this.barBg.roundRect(0, 0, this.barWidth, this.barHeight, 4).fill(0x374151);
    this.addChild(this.barBg);

    // Fill bar
    this.barFill = new Graphics();
    this.drawFill();
    this.addChild(this.barFill);

    // Value label
    const style = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 14,
      fill: "#e0e0e0",
      fontWeight: "bold",
    });
    this.valueLabel = new Text({ text: `${this.currentValue}/${this.maxValue}`, style });
    this.valueLabel.anchor.set(0.5, 1);
    this.valueLabel.x = this.barWidth / 2;
    this.valueLabel.y = -4;
    this.addChild(this.valueLabel);
  }

  private getBarColor(pct: number): number {
    if (pct > 0.6) return 0x4ade80; // green
    if (pct > 0.3) return 0xfacc15; // yellow
    return 0xef4444; // red
  }

  private drawFill(): void {
    this.barFill.clear();

    if (this.fiberMode && this.fibers.length > 0) {
      // Draw segmented fiber bar
      let offsetX = 0;
      const totalValue = this.fibers.reduce((sum, f) => sum + f.value, 0);
      for (const fiber of this.fibers) {
        const segWidth = totalValue > 0 ? (fiber.value / totalValue) * this.displayWidth : 0;
        if (segWidth > 0) {
          this.barFill.roundRect(offsetX, 0, segWidth, this.barHeight, 2).fill(fiber.color);
          offsetX += segWidth;
        }
      }
    } else {
      // Single colored bar
      const pct = this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
      const color = this.getBarColor(pct);
      this.barFill.roundRect(0, 0, this.displayWidth, this.barHeight, 4).fill(color);
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
        this.valueLabel.text = `${this.currentValue}/${this.maxValue}`;
        this.drawFill();
      })
      .onComplete(() => {
        this.currentValue = targetValue;
        this.displayWidth = targetWidth;
        this.valueLabel.text = `${this.currentValue}/${this.maxValue}`;
        this.drawFill();
      });
    this.tweenGroup.add(tween);
    tween.start();
  }

  /** Switch to fiber mode — splits the bar into colored segments for Chapter 4+. */
  setFiberMode(fibers: FiberSegment[]): void {
    this.fiberMode = true;
    this.fibers = fibers;

    // Calculate display width from fiber totals relative to max
    const totalValue = fibers.reduce((sum, f) => sum + f.value, 0);
    this.displayWidth = this.maxValue > 0
      ? (totalValue / this.maxValue) * this.barWidth
      : 0;

    // Update label to show total
    this.currentValue = totalValue;
    this.valueLabel.text = `${Math.round(totalValue)}/${this.maxValue}`;
    this.drawFill();
  }

  update(): void {
    this.tweenGroup.update();
  }
}
