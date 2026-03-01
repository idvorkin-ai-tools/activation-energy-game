import { Container, Graphics, Text, TextStyle } from "pixi.js";
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
  gfx: Graphics;
  label: Text;
  homeX: number;
  awayX: number;
}

const LOG_WIDTH = 280;
const LOG_HEIGHT = 18;
const LOG_RADIUS = 9;
const HOLDER_RADIUS = 18;
const LOG_BASE_Y = 200;
const LOG_TOP_Y = 80;
const HOLDER_Y = 240;
const HOLDER_AWAY_OFFSET_Y = 60;

export class FiberRope extends Container {
  private _options: FiberRopeOptions;
  private tweenGroup: Group;
  private holders: FiberHolder[] = [];
  private logGfx: Graphics;
  private logY: number;
  private fibers: FiberState;
  private willpowerLabel: Text;
  private activityListContainer: Container;
  private presetsContainer: Container;
  private presetsVisible = false;

  constructor(options: FiberRopeOptions) {
    super();

    this._options = options;
    this.x = options.x;
    this.y = options.y;
    this.tweenGroup = new Group();
    this.fibers = FiberModel.defaultFibers();
    this.logY = LOG_TOP_Y;

    // Log
    this.logGfx = new Graphics();
    this.addChild(this.logGfx);
    this.drawLog();

    // Holders
    const spacing = LOG_WIDTH / (FIBER_KEYS.length + 1);
    const startX = (options.width - LOG_WIDTH) / 2;

    FIBER_KEYS.forEach((key, i) => {
      const hx = startX + spacing * (i + 1);
      const color = FIBER_COLORS[key];

      const gfx = new Graphics();
      gfx.circle(0, 0, HOLDER_RADIUS).fill(color);
      gfx.x = hx;
      gfx.y = HOLDER_Y;
      this.addChild(gfx);

      // Fiber name below circle
      const labelStyle = new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 10,
        fill: color,
        fontWeight: "bold",
      });
      const label = new Text({
        text: key.charAt(0).toUpperCase() + key.slice(0, 4),
        style: labelStyle,
      });
      label.anchor.set(0.5, 0);
      label.x = hx;
      label.y = HOLDER_Y + HOLDER_RADIUS + 4;
      this.addChild(label);

      // "Rope" line from holder to log
      const ropeGfx = new Graphics();
      this.addChild(ropeGfx);

      const holder: FiberHolder = {
        key,
        color,
        active: true,
        gfx,
        label,
        homeX: hx,
        awayX: hx + (i < 2 ? -80 : 80),
      };

      // Click to release
      gfx.eventMode = "static";
      gfx.cursor = "pointer";
      gfx.on("pointerdown", () => {
        if (holder.active) {
          this.releaseHolder(holder);
        }
      });

      this.holders.push(holder);
    });

    // Willpower total
    const wpStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 20,
      fill: "#e0e0e0",
      fontWeight: "bold",
    });
    this.willpowerLabel = new Text({ text: "", style: wpStyle });
    this.willpowerLabel.anchor.set(0.5, 0);
    this.willpowerLabel.x = options.width / 2;
    this.willpowerLabel.y = 10;
    this.addChild(this.willpowerLabel);

    // Activity affordability list
    this.activityListContainer = new Container();
    this.activityListContainer.x = options.width - 180;
    this.activityListContainer.y = 60;
    this.addChild(this.activityListContainer);

    // Presets
    this.presetsContainer = new Container();
    this.presetsContainer.x = 10;
    this.presetsContainer.y = HOLDER_Y + HOLDER_AWAY_OFFSET_Y + 60;
    this.presetsContainer.visible = false;
    this.addChild(this.presetsContainer);
    this.createPresets();

    this.updateDisplay();
    this.drawRopes();

    // Drive tweens
    const animate = () => {
      this.tweenGroup.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /** Show the preset buttons (called after 2 holders removed) */
  showPresets(): void {
    this.presetsVisible = true;
    this.presetsContainer.visible = true;
  }

  /** Get count of released holders */
  getReleasedCount(): number {
    return this.holders.filter((h) => !h.active).length;
  }

  // ─── Core ─────────────────────────────────────────────────────

  private releaseHolder(holder: FiberHolder): void {
    holder.active = false;
    holder.gfx.eventMode = "none";
    holder.gfx.cursor = "default";
    holder.gfx.alpha = 0.3;

    // Animate stepping away
    const obj = { y: holder.gfx.y };
    const tween = new Tween(obj)
      .to({ y: HOLDER_Y + HOLDER_AWAY_OFFSET_Y }, 400)
      .onUpdate(() => {
        holder.gfx.y = obj.y;
        holder.label.y = obj.y + HOLDER_RADIUS + 4;
      })
      .onComplete(() => {
        this.updateFibersFromHolders();
        this.updateDisplay();
        this.animateLog();
        this.drawRopes();

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
      if (!holder.active) {
        fibers[holder.key] = 0;
      }
    }
    this.fibers = fibers;
  }

  private updateDisplay(): void {
    const total = FiberModel.totalWillpower(this.fibers);
    this.willpowerLabel.text = `Total Willpower: ${total}`;
    this.updateActivityList(total);
  }

  private updateActivityList(totalWP: number): void {
    this.activityListContainer.removeChildren();

    // Show a subset of interesting activities
    const shown = ACTIVITIES.filter((a) =>
      [
        "morning-workout",
        "deep-work",
        "tiktok",
        "the-thing-youve-been-avoiding",
        "meditating",
        "evening-gym",
      ].includes(a.id),
    );

    const headerStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 12,
      fill: "#9ca3af",
      fontWeight: "bold",
    });
    const header = new Text({ text: "Activities:", style: headerStyle });
    header.y = 0;
    this.activityListContainer.addChild(header);

    shown.forEach((activity, i) => {
      const cost = Math.max(0, activity.startingEnergy);
      const affordable = totalWP >= cost;
      const color = affordable ? "#22c55e" : "#ef4444";

      const style = new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 11,
        fill: color,
      });
      const text = new Text({
        text: `${activity.name} (${cost})`,
        style,
      });
      text.y = 20 + i * 18;
      this.activityListContainer.addChild(text);
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
        this.drawLog();
        this.drawRopes();
      });
    this.tweenGroup.add(tween);
    tween.start();
  }

  private drawLog(): void {
    const cx = this._options.width / 2;
    this.logGfx.clear();
    this.logGfx
      .roundRect(cx - LOG_WIDTH / 2, this.logY, LOG_WIDTH, LOG_HEIGHT, LOG_RADIUS)
      .fill(0x8b5e3c);
    // Wood grain lines
    this.logGfx
      .moveTo(cx - LOG_WIDTH / 2 + 10, this.logY + 6)
      .lineTo(cx + LOG_WIDTH / 2 - 10, this.logY + 6);
    this.logGfx.stroke({ width: 1, color: 0x6d4c2a });
    this.logGfx
      .moveTo(cx - LOG_WIDTH / 2 + 20, this.logY + 12)
      .lineTo(cx + LOG_WIDTH / 2 - 20, this.logY + 12);
    this.logGfx.stroke({ width: 1, color: 0x6d4c2a });
  }

  private drawRopes(): void {
    // Remove old rope lines — we redraw via a dedicated graphics layer
    // We'll reuse existing rope approach: draw lines from each active holder to log
    // For simplicity, draw directly into logGfx after the log
    const cx = this._options.width / 2;
    const spacing = LOG_WIDTH / (FIBER_KEYS.length + 1);
    const startX = cx - LOG_WIDTH / 2;

    for (let i = 0; i < this.holders.length; i++) {
      const holder = this.holders[i];
      if (!holder.active) continue;

      const ropeTopX = startX + spacing * (i + 1);
      const ropeTopY = this.logY + LOG_HEIGHT;
      this.logGfx
        .moveTo(ropeTopX, ropeTopY)
        .lineTo(holder.gfx.x, holder.gfx.y - HOLDER_RADIUS);
      this.logGfx.stroke({ width: 2, color: holder.color });
    }
  }

  // ─── Presets ──────────────────────────────────────────────────

  private createPresets(): void {
    const presets = [
      { label: "Gap Year", fiber: "professional" as keyof FiberState },
      { label: "Sick Week", fiber: "physical" as keyof FiberState },
      { label: "Breakup", fiber: "family" as keyof FiberState },
    ];

    presets.forEach((preset, i) => {
      const c = new Container();
      c.x = i * 130;

      const bg = new Graphics();
      bg.roundRect(0, 0, 120, 36, 6).fill(0x374151);
      c.addChild(bg);

      const style = new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 13,
        fill: "#e0e0e0",
        fontWeight: "bold",
      });
      const label = new Text({ text: preset.label, style });
      label.anchor.set(0.5);
      label.x = 60;
      label.y = 18;
      c.addChild(label);

      c.eventMode = "static";
      c.cursor = "pointer";
      c.hitArea = {
        contains: (px: number, py: number) =>
          px >= 0 && px <= 120 && py >= 0 && py <= 36,
      };
      c.on("pointerdown", () => this.applyPreset(preset.fiber));

      this.presetsContainer.addChild(c);
    });
  }

  private applyPreset(fiberKey: keyof FiberState): void {
    // Reset all holders
    for (const holder of this.holders) {
      holder.active = true;
      holder.gfx.alpha = 1;
      holder.gfx.eventMode = "static";
      holder.gfx.cursor = "pointer";
      holder.gfx.y = HOLDER_Y;
      holder.label.y = HOLDER_Y + HOLDER_RADIUS + 4;
    }

    this.fibers = FiberModel.defaultFibers();
    this.logY = LOG_TOP_Y;
    this.drawLog();
    this.drawRopes();
    this.updateDisplay();

    // Now release the specified fiber
    const target = this.holders.find((h) => h.key === fiberKey);
    if (target) {
      // Small delay for visual clarity
      setTimeout(() => this.releaseHolder(target), 300);
    }
  }

}

