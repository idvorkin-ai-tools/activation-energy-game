import { Tween, Group } from "@tweenjs/tween.js";
import type { Activity, DaySlot, SimResult } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import { DaySimulator } from "../sim/DaySimulator";
import { Character } from "../characters/Character";
import { WillpowerBar } from "../engine/WillpowerBar";
import { hexToCSS } from "../utils/dom";

export interface DayTimelineOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  activities: Activity[];
  willpowerBar: WillpowerBar;
}

const START_MINUTE = 360;
const END_MINUTE = 1320;
const BLOCK_W = 140;
const BLOCK_H = 40;
const TIMELINE_Y = 80;
const BLOCK_COLORS = [0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0xeab308, 0xef4444];

function minuteToLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${suffix}`;
}

export class DayTimeline {
  el: HTMLDivElement;
  onFirstPlayComplete: (() => void) | null = null;

  private options: DayTimelineOptions;
  private tweenGroup: Group;
  private isNarrow: boolean;
  private blockW: number;

  private blockEntries: {
    activity: Activity;
    el: HTMLDivElement;
    homeX: number;
    homeY: number;
    placed: boolean;
    snappedMinute: number;
  }[] = [];
  private character: Character;
  private playButton: HTMLButtonElement | null = null;
  private overlayEl: HTMLDivElement;
  private ghostCanvas: HTMLCanvasElement;
  private ghostCtx: CanvasRenderingContext2D;

  private firstRunCurve: number[] | null = null;
  private hasPlayedOnce = false;
  private lastResult: SimResult | null = null;

  constructor(options: DayTimelineOptions) {
    this.options = options;
    this.tweenGroup = new Group();
    this.isNarrow = options.width < 600;
    this.blockW = this.isNarrow ? 100 : BLOCK_W;

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    // Timeline canvas
    const timelineCanvas = document.createElement("canvas");
    timelineCanvas.width = options.width;
    timelineCanvas.height = options.height;
    timelineCanvas.style.position = "absolute";
    timelineCanvas.style.pointerEvents = "none";
    const tCtx = timelineCanvas.getContext("2d")!;
    this.drawTimeline(tCtx, options.width);
    this.el.appendChild(timelineCanvas);

    // Ghost curve canvas
    this.ghostCanvas = document.createElement("canvas");
    this.ghostCanvas.width = options.width;
    this.ghostCanvas.height = options.height;
    this.ghostCanvas.style.position = "absolute";
    this.ghostCanvas.style.pointerEvents = "none";
    this.ghostCtx = this.ghostCanvas.getContext("2d")!;
    this.el.appendChild(this.ghostCanvas);

    // Overlay for cost floats
    this.overlayEl = document.createElement("div");
    this.overlayEl.style.position = "absolute";
    this.overlayEl.style.inset = "0";
    this.overlayEl.style.pointerEvents = "none";
    this.el.appendChild(this.overlayEl);

    // Character
    this.character = new Character();
    this.character.setPosition(this.minuteToX(START_MINUTE), TIMELINE_Y + 60);
    this.el.appendChild(this.character.el);

    this.createBlocks();
    this.createButtons();

    // Drive tweens
    const animate = () => {
      this.tweenGroup.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  getLastResult(): SimResult | null {
    return this.lastResult;
  }

  getSchedule(): DaySlot[] {
    return this.blockEntries
      .filter((b) => b.placed)
      .sort((a, b) => a.snappedMinute - b.snappedMinute)
      .map((b) => ({ activity: b.activity, startMinute: b.snappedMinute }));
  }

  private drawTimeline(ctx: CanvasRenderingContext2D, w: number): void {
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, TIMELINE_Y);
    ctx.lineTo(w, TIMELINE_Y);
    ctx.stroke();

    ctx.font = "11px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";

    for (let m = START_MINUTE; m <= END_MINUTE; m += 60) {
      const x = this.minuteToX(m);
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, TIMELINE_Y - 6);
      ctx.lineTo(x, TIMELINE_Y + 6);
      ctx.stroke();
      ctx.fillText(minuteToLabel(m), x, TIMELINE_Y + 22);
    }
  }

  private minuteToX(minute: number): number {
    return ((minute - START_MINUTE) / (END_MINUTE - START_MINUTE)) * this.options.width;
  }

  private xToMinute(x: number): number {
    const clamped = Math.max(0, Math.min(x, this.options.width));
    return START_MINUTE + (clamped / this.options.width) * (END_MINUTE - START_MINUTE);
  }

  private createBlocks(): void {
    const { activities } = this.options;
    const blockW = this.blockW;
    const stackX = 10;
    const stackStartY = TIMELINE_Y + 90;
    const stackSpacing = BLOCK_H + 8;

    activities.forEach((activity, index) => {
      const blockEl = document.createElement("div");
      blockEl.style.position = "absolute";
      blockEl.style.width = `${blockW}px`;
      blockEl.style.height = `${BLOCK_H}px`;
      blockEl.style.borderRadius = "8px";
      blockEl.style.background = hexToCSS(BLOCK_COLORS[index % BLOCK_COLORS.length]);
      blockEl.style.opacity = "0.9";
      blockEl.style.display = "flex";
      blockEl.style.alignItems = "center";
      blockEl.style.justifyContent = "center";
      blockEl.style.textAlign = "center";
      blockEl.style.color = "#fff";
      blockEl.style.fontWeight = "bold";
      blockEl.style.fontSize = this.isNarrow ? "10px" : "12px";
      blockEl.style.cursor = "grab";
      blockEl.style.userSelect = "none";
      blockEl.style.padding = "2px";
      blockEl.textContent = activity.name;

      const homeX = stackX;
      const homeY = stackStartY + index * stackSpacing;
      blockEl.style.left = `${homeX}px`;
      blockEl.style.top = `${homeY}px`;

      const entry = {
        activity,
        el: blockEl,
        homeX,
        homeY,
        placed: false,
        snappedMinute: 0,
      };

      // Drag
      let dragging = false;
      let offsetX = 0, offsetY = 0;

      blockEl.addEventListener("pointerdown", (e) => {
        dragging = true;
        blockEl.style.cursor = "grabbing";
        blockEl.style.zIndex = "10";
        const rect = this.el.getBoundingClientRect();
        offsetX = e.clientX - rect.left - parseFloat(blockEl.style.left);
        offsetY = e.clientY - rect.top - parseFloat(blockEl.style.top);
        blockEl.setPointerCapture(e.pointerId);
      });

      blockEl.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const rect = this.el.getBoundingClientRect();
        blockEl.style.left = `${e.clientX - rect.left - offsetX}px`;
        blockEl.style.top = `${e.clientY - rect.top - offsetY}px`;
      });

      const onDrop = () => {
        if (!dragging) return;
        dragging = false;
        blockEl.style.cursor = "grab";
        blockEl.style.zIndex = "";

        const centerX = parseFloat(blockEl.style.left) + blockW / 2;
        const centerY = parseFloat(blockEl.style.top) + BLOCK_H / 2;

        if (Math.abs(centerY - TIMELINE_Y) < 60 && centerX > 0 && centerX < this.options.width) {
          const minute = Math.round(this.xToMinute(centerX) / 15) * 15;
          const snappedX = this.minuteToX(minute) - blockW / 2;
          blockEl.style.left = `${snappedX}px`;
          blockEl.style.top = `${TIMELINE_Y - BLOCK_H - 4}px`;
          entry.placed = true;
          entry.snappedMinute = minute;
        } else {
          blockEl.style.left = `${entry.homeX}px`;
          blockEl.style.top = `${entry.homeY}px`;
          entry.placed = false;
        }

        this.updatePlayButton();
      };

      blockEl.addEventListener("pointerup", onDrop);
      blockEl.addEventListener("pointercancel", onDrop);

      this.el.appendChild(blockEl);
      this.blockEntries.push(entry);
    });
  }

  private createButtons(): void {
    const btnX = this.isNarrow ? this.options.width - 120 : this.options.width - 200;

    // Play button
    this.playButton = document.createElement("button");
    this.playButton.className = "game-btn";
    this.playButton.textContent = "Play \u25B6";
    this.playButton.style.position = "absolute";
    this.playButton.style.left = `${btnX}px`;
    this.playButton.style.top = `${TIMELINE_Y + 100}px`;
    this.playButton.style.background = "#22c55e";
    this.playButton.style.minWidth = "120px";
    this.playButton.style.height = "40px";
    this.playButton.style.opacity = "0.4";
    this.playButton.disabled = true;
    this.playButton.addEventListener("click", () => this.runPlayback());
    this.el.appendChild(this.playButton);

    // Reset button
    const resetBtn = document.createElement("button");
    resetBtn.className = "game-btn";
    resetBtn.textContent = "Reset";
    resetBtn.style.position = "absolute";
    resetBtn.style.left = `${btnX}px`;
    resetBtn.style.top = `${TIMELINE_Y + 160}px`;
    resetBtn.style.background = "#6b7280";
    resetBtn.style.minWidth = "120px";
    resetBtn.style.height = "40px";
    resetBtn.addEventListener("click", () => this.resetTimeline());
    this.el.appendChild(resetBtn);
  }

  private updatePlayButton(): void {
    const placedCount = this.blockEntries.filter((b) => b.placed).length;
    if (this.playButton) {
      const enabled = placedCount >= 2;
      this.playButton.disabled = !enabled;
      this.playButton.style.opacity = enabled ? "1" : "0.4";
    }
  }

  private async runPlayback(): Promise<void> {
    if (this.playButton) {
      this.playButton.disabled = true;
      this.playButton.style.opacity = "0.4";
    }

    for (const entry of this.blockEntries) {
      entry.el.style.pointerEvents = "none";
    }

    const schedule = this.getSchedule();
    if (schedule.length === 0) return;

    const fibers = FiberModel.defaultFibers();
    const initialWP = FiberModel.totalWillpower(fibers);
    const sim = new DaySimulator();
    const result = sim.simulate(schedule, initialWP, fibers);
    this.lastResult = result;

    const curve: { minute: number; wp: number }[] = [
      { minute: START_MINUTE, wp: initialWP },
    ];
    for (const ev of result.events) {
      curve.push({ minute: ev.time, wp: ev.willpowerAfter });
    }

    this.character.setPosition(this.minuteToX(START_MINUTE), TIMELINE_Y + 60);
    this.character.setExpression("neutral");

    for (let i = 0; i < curve.length; i++) {
      const point = curve[i];
      const targetX = this.minuteToX(point.minute);

      await this.character.walkTo(targetX, TIMELINE_Y + 60, 400);
      this.options.willpowerBar.setValue(point.wp, initialWP);

      const pct = initialWP > 0 ? (point.wp / initialWP) * 100 : 0;
      this.character.setExpression(Character.expressionForWillpower(pct));

      const ev = result.events[i - 1];
      if (ev && ev.type === "start" && ev.willpowerCost > 0) {
        await this.showCostFloat(targetX, TIMELINE_Y + 30, ev.willpowerCost);
      }

      await this.delay(200);
    }

    if (!this.hasPlayedOnce) {
      this.firstRunCurve = curve.map((c) => c.wp);
      this.hasPlayedOnce = true;
      if (this.onFirstPlayComplete) this.onFirstPlayComplete();
    } else {
      this.drawGhostCurve(curve);
    }

    for (const entry of this.blockEntries) {
      entry.el.style.pointerEvents = "";
    }
    this.updatePlayButton();
  }

  private async showCostFloat(x: number, y: number, cost: number): Promise<void> {
    const floatEl = document.createElement("span");
    floatEl.style.position = "absolute";
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    floatEl.style.transform = "translateX(-50%)";
    floatEl.style.color = "#ef4444";
    floatEl.style.fontWeight = "bold";
    floatEl.style.fontSize = "18px";
    floatEl.style.pointerEvents = "none";
    floatEl.textContent = `-${Math.round(cost)}`;
    this.overlayEl.appendChild(floatEl);

    const obj = { y: y, alpha: 1 };
    await new Promise<void>((resolve) => {
      const tween = new Tween(obj)
        .to({ y: y - 30, alpha: 0 }, 800)
        .onUpdate(() => {
          floatEl.style.top = `${obj.y}px`;
          floatEl.style.opacity = `${obj.alpha}`;
        })
        .onComplete(() => {
          floatEl.remove();
          resolve();
        });
      this.tweenGroup.add(tween);
      tween.start();
    });
  }

  private drawGhostCurve(currentCurve: { minute: number; wp: number }[]): void {
    if (!this.firstRunCurve) return;

    this.ghostCtx.clearRect(0, 0, this.ghostCanvas.width, this.ghostCanvas.height);

    const ghostY = TIMELINE_Y - 50;
    const curveHeight = 40;

    const allValues = [...this.firstRunCurve, ...currentCurve.map((c) => c.wp)];
    const maxWP = Math.max(...allValues, 1);

    if (this.firstRunCurve.length > 1) {
      const step = this.options.width / (this.firstRunCurve.length - 1);
      this.ghostCtx.strokeStyle = "#6b7280";
      this.ghostCtx.lineWidth = 2;
      this.ghostCtx.beginPath();
      this.ghostCtx.moveTo(0, ghostY - (this.firstRunCurve[0] / maxWP) * curveHeight);
      for (let i = 1; i < this.firstRunCurve.length; i++) {
        this.ghostCtx.lineTo(i * step, ghostY - (this.firstRunCurve[i] / maxWP) * curveHeight);
      }
      this.ghostCtx.stroke();
    }
  }

  private resetTimeline(): void {
    for (const entry of this.blockEntries) {
      entry.el.style.left = `${entry.homeX}px`;
      entry.el.style.top = `${entry.homeY}px`;
      entry.placed = false;
      entry.snappedMinute = 0;
      entry.el.style.pointerEvents = "";
    }

    this.character.setPosition(this.minuteToX(START_MINUTE), TIMELINE_Y + 60);
    this.character.setExpression("neutral");
    this.overlayEl.innerHTML = "";
    this.updatePlayButton();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
