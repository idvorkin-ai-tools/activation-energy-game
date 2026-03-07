import { Tween, Group } from "@tweenjs/tween.js";
import { FIBER_KEYS, FIBER_COLORS } from "../sim/types";
import type { FiberState } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import { ACTIVITIES } from "../sim/activities";


export interface FiberRopeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FiberHolder {
  key: keyof FiberState;
  color: string;
  active: boolean;
  circleEl: HTMLDivElement;
  labelEl: HTMLDivElement;
  homeX: number;
  currentY: number;
}

const LOG_WIDTH = 280;
const LOG_HEIGHT = 18;
const LOG_BASE_Y = 200;
const LOG_TOP_Y = 80;
const HOLDER_RADIUS = 18;
const HOLDER_Y = 240;
const HOLDER_AWAY_OFFSET_Y = 60;

export class FiberRope {
  el: HTMLDivElement;
  private tweenGroup: Group;
  private holders: FiberHolder[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logY: number;
  private fibers: FiberState;
  private willpowerLabel: HTMLDivElement;
  private activityListEl: HTMLDivElement;
  private presetsEl: HTMLDivElement;
  private presetsVisible = false;
  private optionsWidth: number;

  constructor(options: FiberRopeOptions) {
    this.optionsWidth = options.width;
    this.tweenGroup = new Group();
    this.fibers = FiberModel.defaultFibers();
    this.logY = LOG_TOP_Y;

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    // Canvas for log + ropes
    this.canvas = document.createElement("canvas");
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.canvas.style.position = "absolute";
    this.canvas.style.pointerEvents = "none";
    this.ctx = this.canvas.getContext("2d")!;
    this.el.appendChild(this.canvas);

    // Create holder circles + labels
    const spacing = LOG_WIDTH / (FIBER_KEYS.length + 1);
    const startX = (options.width - LOG_WIDTH) / 2;

    FIBER_KEYS.forEach((key, i) => {
      const hx = startX + spacing * (i + 1);
      const color = FIBER_COLORS[key];

      const circleEl = document.createElement("div");
      circleEl.style.position = "absolute";
      circleEl.style.width = `${HOLDER_RADIUS * 2}px`;
      circleEl.style.height = `${HOLDER_RADIUS * 2}px`;
      circleEl.style.borderRadius = "50%";
      circleEl.style.background = color;
      circleEl.style.left = `${hx - HOLDER_RADIUS}px`;
      circleEl.style.top = `${HOLDER_Y - HOLDER_RADIUS}px`;
      circleEl.style.cursor = "pointer";
      this.el.appendChild(circleEl);

      const labelEl = document.createElement("div");
      labelEl.style.position = "absolute";
      labelEl.style.left = `${hx}px`;
      labelEl.style.top = `${HOLDER_Y + HOLDER_RADIUS + 4}px`;
      labelEl.style.transform = "translateX(-50%)";
      labelEl.style.fontSize = "10px";
      labelEl.style.fontWeight = "bold";
      labelEl.style.color = color;
      labelEl.textContent = key.charAt(0).toUpperCase() + key.slice(0, 4);
      this.el.appendChild(labelEl);

      const holder: FiberHolder = {
        key, color, active: true,
        circleEl, labelEl,
        homeX: hx,
        currentY: HOLDER_Y,
      };

      circleEl.addEventListener("click", () => {
        if (holder.active) this.releaseHolder(holder);
      });

      this.holders.push(holder);
    });

    // Willpower label
    this.willpowerLabel = document.createElement("div");
    this.willpowerLabel.style.position = "absolute";
    this.willpowerLabel.style.left = "50%";
    this.willpowerLabel.style.top = "10px";
    this.willpowerLabel.style.transform = "translateX(-50%)";
    this.willpowerLabel.style.fontSize = "20px";
    this.willpowerLabel.style.fontWeight = "bold";
    this.willpowerLabel.style.color = "#e0e0e0";
    this.el.appendChild(this.willpowerLabel);

    // Activity list
    this.activityListEl = document.createElement("div");
    this.activityListEl.style.position = "absolute";
    this.activityListEl.style.right = "0";
    this.activityListEl.style.top = "60px";
    this.activityListEl.style.fontSize = "11px";
    this.el.appendChild(this.activityListEl);

    // Presets
    this.presetsEl = document.createElement("div");
    this.presetsEl.style.position = "absolute";
    this.presetsEl.style.left = "10px";
    this.presetsEl.style.top = `${HOLDER_Y + HOLDER_AWAY_OFFSET_Y + 60}px`;
    this.presetsEl.style.display = "none";
    this.createPresets();
    this.el.appendChild(this.presetsEl);

    this.updateDisplay();
    this.drawCanvas();

    // Drive tweens
    const animate = () => {
      this.tweenGroup.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  showPresets(): void {
    this.presetsVisible = true;
    this.presetsEl.style.display = "flex";
  }

  getReleasedCount(): number {
    return this.holders.filter((h) => !h.active).length;
  }

  private releaseHolder(holder: FiberHolder): void {
    holder.active = false;
    holder.circleEl.style.cursor = "default";
    holder.circleEl.style.opacity = "0.3";

    const startY = holder.currentY;
    const targetY = HOLDER_Y + HOLDER_AWAY_OFFSET_Y;
    const obj = { y: startY };
    const tween = new Tween(obj)
      .to({ y: targetY }, 400)
      .onUpdate(() => {
        holder.currentY = obj.y;
        holder.circleEl.style.top = `${obj.y - HOLDER_RADIUS}px`;
        holder.labelEl.style.top = `${obj.y + HOLDER_RADIUS + 4}px`;
      })
      .onComplete(() => {
        this.updateFibersFromHolders();
        this.updateDisplay();
        this.animateLog();

        if (this.getReleasedCount() >= 2 && !this.presetsVisible) {
          this.showPresets();
        }
      });
    this.tweenGroup.add(tween);
    tween.start();
  }

  private updateFibersFromHolders(): void {
    const fibers = FiberModel.defaultFibers();
    for (const holder of this.holders) {
      if (!holder.active) fibers[holder.key] = 0;
    }
    this.fibers = fibers;
  }

  private updateDisplay(): void {
    const total = FiberModel.totalWillpower(this.fibers);
    this.willpowerLabel.textContent = `Total Willpower: ${total}`;
    this.updateActivityList(total);
  }

  private updateActivityList(totalWP: number): void {
    this.activityListEl.innerHTML = "";

    const shown = ACTIVITIES.filter((a) =>
      ["morning-workout", "deep-work", "tiktok", "the-thing-youve-been-avoiding", "meditating", "evening-gym"].includes(a.id),
    );

    const header = document.createElement("div");
    header.style.color = "#9ca3af";
    header.style.fontWeight = "bold";
    header.style.fontSize = "12px";
    header.style.marginBottom = "4px";
    header.textContent = "Activities:";
    this.activityListEl.appendChild(header);

    shown.forEach((activity) => {
      const cost = Math.max(0, activity.startingEnergy);
      const affordable = totalWP >= cost;
      const item = document.createElement("div");
      item.style.color = affordable ? "#22c55e" : "#ef4444";
      item.style.marginBottom = "2px";
      item.textContent = `${activity.name} (${cost})`;
      this.activityListEl.appendChild(item);
    });
  }

  private animateLog(): void {
    const activeCount = this.holders.filter((h) => h.active).length;
    const totalHolders = this.holders.length;
    const ratio = activeCount / totalHolders;
    const targetY = LOG_BASE_Y - ratio * (LOG_BASE_Y - LOG_TOP_Y);

    const obj = { y: this.logY };
    const tween = new Tween(obj)
      .to({ y: targetY }, 500)
      .onUpdate(() => {
        this.logY = obj.y;
        this.drawCanvas();
      });
    this.tweenGroup.add(tween);
    tween.start();
  }

  private drawCanvas(): void {
    const ctx = this.ctx;
    const w = this.optionsWidth;
    ctx.clearRect(0, 0, w, 400);

    const cx = w / 2;

    // Log
    ctx.fillStyle = "#8b5e3c";
    this.roundRect(ctx, cx - LOG_WIDTH / 2, this.logY, LOG_WIDTH, LOG_HEIGHT, 9);
    ctx.fill();

    // Wood grain
    ctx.strokeStyle = "#6d4c2a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - LOG_WIDTH / 2 + 10, this.logY + 6);
    ctx.lineTo(cx + LOG_WIDTH / 2 - 10, this.logY + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - LOG_WIDTH / 2 + 20, this.logY + 12);
    ctx.lineTo(cx + LOG_WIDTH / 2 - 20, this.logY + 12);
    ctx.stroke();

    // Ropes from holders to log
    const spacing = LOG_WIDTH / (FIBER_KEYS.length + 1);
    const startX = cx - LOG_WIDTH / 2;

    for (let i = 0; i < this.holders.length; i++) {
      const holder = this.holders[i];
      if (!holder.active) continue;

      const ropeTopX = startX + spacing * (i + 1);
      const ropeTopY = this.logY + LOG_HEIGHT;
      ctx.strokeStyle = holder.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ropeTopX, ropeTopY);
      ctx.lineTo(holder.homeX, holder.currentY - HOLDER_RADIUS);
      ctx.stroke();
    }
  }

  private createPresets(): void {
    const isNarrow = this.optionsWidth < 500;
    const btnW = isNarrow ? 80 : 120;
    const btnSpacing = isNarrow ? 90 : 130;
    this.presetsEl.style.gap = `${btnSpacing - btnW}px`;

    const presets = [
      { label: "Gap Year", fiber: "professional" as keyof FiberState },
      { label: "Sick Week", fiber: "physical" as keyof FiberState },
      { label: "Breakup", fiber: "family" as keyof FiberState },
    ];

    presets.forEach((preset) => {
      const btn = document.createElement("button");
      btn.className = "game-btn";
      btn.textContent = preset.label;
      btn.style.minWidth = `${btnW}px`;
      btn.style.height = "36px";
      btn.style.fontSize = isNarrow ? "11px" : "13px";
      btn.style.background = "#374151";
      btn.addEventListener("click", () => this.applyPreset(preset.fiber));
      this.presetsEl.appendChild(btn);
    });
  }

  private applyPreset(fiberKey: keyof FiberState): void {
    for (const holder of this.holders) {
      holder.active = true;
      holder.circleEl.style.opacity = "1";
      holder.circleEl.style.cursor = "pointer";
      holder.currentY = HOLDER_Y;
      holder.circleEl.style.top = `${HOLDER_Y - HOLDER_RADIUS}px`;
      holder.labelEl.style.top = `${HOLDER_Y + HOLDER_RADIUS + 4}px`;
    }

    this.fibers = FiberModel.defaultFibers();
    this.logY = LOG_TOP_Y;
    this.drawCanvas();
    this.updateDisplay();

    const target = this.holders.find((h) => h.key === fiberKey);
    if (target) {
      setTimeout(() => this.releaseHolder(target), 300);
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
