import {
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from "pixi.js";
import { Tween, Group } from "@tweenjs/tween.js";
import type { Activity, DaySlot, SimResult } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import { DaySimulator } from "../sim/DaySimulator";
import { Character } from "../characters/Character";
import { WillpowerBar } from "../engine/WillpowerBar";

export interface DayTimelineOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  activities: Activity[];
  willpowerBar: WillpowerBar;
}

const START_MINUTE = 360; // 6am
const END_MINUTE = 1320; // 10pm
const BLOCK_W = 140;
const BLOCK_H = 40;
const BLOCK_RADIUS = 8;
const TIMELINE_Y = 80;
const BLOCK_COLORS = [
  0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0xeab308, 0xef4444,
];

function minuteToLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${suffix}`;
}

export class DayTimeline extends Container {
  onFirstPlayComplete: (() => void) | null = null;

  private options: DayTimelineOptions;
  private tweenGroup: Group;
  private timelineGfx: Graphics;
  private blocksContainer: Container;
  private overlayContainer: Container;
  private isNarrow: boolean;
  private blockW: number;

  private blockEntries: {
    activity: Activity;
    container: Container;
    homeX: number;
    homeY: number;
    placed: boolean;
    snappedMinute: number;
  }[] = [];
  private character: Character;
  private playButton: Container | null = null;
  private resetButton: Container | null = null;

  private firstRunCurve: number[] | null = null;
  private ghostGfx: Graphics;
  private hasPlayedOnce = false;
  private lastResult: SimResult | null = null;

  constructor(options: DayTimelineOptions) {
    super();

    this.options = options;
    this.x = options.x;
    this.y = options.y;
    this.tweenGroup = new Group();
    this.isNarrow = options.width < 600;
    this.blockW = this.isNarrow ? 100 : BLOCK_W;

    this.timelineGfx = new Graphics();
    this.blocksContainer = new Container();
    this.overlayContainer = new Container();
    this.ghostGfx = new Graphics();

    this.addChild(this.timelineGfx);
    this.addChild(this.ghostGfx);
    this.addChild(this.blocksContainer);
    this.addChild(this.overlayContainer);

    this.character = new Character();
    this.character.setPosition(this.minuteToX(START_MINUTE), TIMELINE_Y + 60);
    this.addChild(this.character.container);

    this.drawTimeline();
    this.createBlocks();
    this.createButtons();

    // Drive tweens
    const animate = () => {
      this.tweenGroup.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /** Last sim result, available after playback */
  getLastResult(): SimResult | null {
    return this.lastResult;
  }

  /** Get the schedule the player built */
  getSchedule(): DaySlot[] {
    return this.blockEntries
      .filter((b) => b.placed)
      .sort((a, b) => a.snappedMinute - b.snappedMinute)
      .map((b) => ({ activity: b.activity, startMinute: b.snappedMinute }));
  }

  // ─── Drawing ───────────────────────────────────────────────────

  private drawTimeline(): void {
    const g = this.timelineGfx;
    const w = this.options.width;

    // Main line
    g.moveTo(0, TIMELINE_Y).lineTo(w, TIMELINE_Y);
    g.stroke({ width: 2, color: 0x9ca3af });

    const labelStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 11,
      fill: "#9ca3af",
    });

    // Hour ticks
    for (let m = START_MINUTE; m <= END_MINUTE; m += 60) {
      const x = this.minuteToX(m);
      g.moveTo(x, TIMELINE_Y - 6).lineTo(x, TIMELINE_Y + 6);
      g.stroke({ width: 1, color: 0x6b7280 });

      const label = new Text({ text: minuteToLabel(m), style: labelStyle });
      label.anchor.set(0.5, 0);
      label.x = x;
      label.y = TIMELINE_Y + 10;
      this.addChild(label);
    }
  }

  private minuteToX(minute: number): number {
    return (
      ((minute - START_MINUTE) / (END_MINUTE - START_MINUTE)) *
      this.options.width
    );
  }

  private xToMinute(x: number): number {
    const clamped = Math.max(0, Math.min(x, this.options.width));
    return (
      START_MINUTE +
      (clamped / this.options.width) * (END_MINUTE - START_MINUTE)
    );
  }

  // ─── Activity Blocks ──────────────────────────────────────────

  private createBlocks(): void {
    const { activities } = this.options;
    const blockW = this.blockW;
    const stackX = 10;
    const stackStartY = TIMELINE_Y + 90;
    const stackSpacing = BLOCK_H + 8;

    activities.forEach((activity, index) => {
      const c = new Container();
      const color = BLOCK_COLORS[index % BLOCK_COLORS.length];

      const bg = new Graphics();
      bg.roundRect(0, 0, blockW, BLOCK_H, BLOCK_RADIUS).fill(color);
      bg.alpha = 0.9;
      c.addChild(bg);

      const labelStyle = new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: this.isNarrow ? 10 : 12,
        fill: "#ffffff",
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: blockW - 12,
        align: "center",
      });
      const label = new Text({ text: activity.name, style: labelStyle });
      label.anchor.set(0.5);
      label.x = blockW / 2;
      label.y = BLOCK_H / 2;
      c.addChild(label);

      const homeX = stackX;
      const homeY = stackStartY + index * stackSpacing;
      c.x = homeX;
      c.y = homeY;

      const entry = {
        activity,
        container: c,
        homeX,
        homeY,
        placed: false,
        snappedMinute: 0,
      };

      // Drag and drop
      c.eventMode = "static";
      c.cursor = "grab";

      let dragging = false;
      const dragOffset = { x: 0, y: 0 };

      c.on("pointerdown", (e: FederatedPointerEvent) => {
        dragging = true;
        c.cursor = "grabbing";
        const local = this.toLocal(e.global);
        dragOffset.x = local.x - c.x;
        dragOffset.y = local.y - c.y;
        this.blocksContainer.setChildIndex(
          c,
          this.blocksContainer.children.length - 1,
        );
      });

      c.on("globalpointermove", (e: FederatedPointerEvent) => {
        if (!dragging) return;
        const local = this.toLocal(e.global);
        c.x = local.x - dragOffset.x;
        c.y = local.y - dragOffset.y;
      });

      const onDrop = () => {
        if (!dragging) return;
        dragging = false;
        c.cursor = "grab";

        const centerX = c.x + blockW / 2;
        const centerY = c.y + BLOCK_H / 2;

        // If dropped near the timeline, snap it
        if (
          Math.abs(centerY - TIMELINE_Y) < 60 &&
          centerX > 0 &&
          centerX < this.options.width
        ) {
          const minute = Math.round(this.xToMinute(centerX) / 15) * 15; // snap to 15-min
          const snappedX = this.minuteToX(minute) - blockW / 2;
          c.x = snappedX;
          c.y = TIMELINE_Y - BLOCK_H - 4;
          entry.placed = true;
          entry.snappedMinute = minute;
        } else {
          // Return home
          c.x = entry.homeX;
          c.y = entry.homeY;
          entry.placed = false;
        }

        this.updatePlayButton();
      };

      c.on("pointerup", onDrop);
      c.on("pointerupoutside", onDrop);

      this.blocksContainer.addChild(c);
      this.blockEntries.push(entry);
    });
  }

  // ─── Buttons ──────────────────────────────────────────────────

  private createButtons(): void {
    const btnX = this.isNarrow ? this.options.width - 120 : this.options.width - 200;
    this.playButton = this.makeButton(
      "Play \u25B6",
      btnX,
      TIMELINE_Y + 100,
      0x22c55e,
      () => this.runPlayback(),
    );
    this.playButton.alpha = 0.4;
    this.playButton.eventMode = "none";
    this.addChild(this.playButton);

    this.resetButton = this.makeButton(
      "Reset",
      btnX,
      TIMELINE_Y + 160,
      0x6b7280,
      () => this.resetTimeline(),
    );
    this.addChild(this.resetButton);
  }

  private makeButton(
    text: string,
    x: number,
    y: number,
    color: number,
    onClick: () => void,
  ): Container {
    const c = new Container();
    c.x = x;
    c.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, 120, 40, 8).fill(color);
    c.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 16,
      fill: "#ffffff",
      fontWeight: "bold",
    });
    const label = new Text({ text, style });
    label.anchor.set(0.5);
    label.x = 60;
    label.y = 20;
    c.addChild(label);

    c.eventMode = "static";
    c.cursor = "pointer";
    c.hitArea = {
      contains: (px: number, py: number) =>
        px >= 0 && px <= 120 && py >= 0 && py <= 40,
    };
    c.on("pointerdown", onClick);

    return c;
  }

  private updatePlayButton(): void {
    const placedCount = this.blockEntries.filter((b) => b.placed).length;
    if (this.playButton) {
      const enabled = placedCount >= 2;
      this.playButton.alpha = enabled ? 1 : 0.4;
      this.playButton.eventMode = enabled ? "static" : "none";
    }
  }

  // ─── Playback ─────────────────────────────────────────────────

  private async runPlayback(): Promise<void> {
    if (this.playButton) {
      this.playButton.eventMode = "none";
      this.playButton.alpha = 0.4;
    }

    // Disable dragging during playback
    for (const entry of this.blockEntries) {
      entry.container.eventMode = "none";
    }

    const schedule = this.getSchedule();
    if (schedule.length === 0) return;

    const fibers = FiberModel.defaultFibers();
    const initialWP = FiberModel.totalWillpower(fibers);
    const sim = new DaySimulator();
    const result = sim.simulate(schedule, initialWP, fibers);
    this.lastResult = result;

    // Build willpower curve from events
    const curve: { minute: number; wp: number }[] = [
      { minute: START_MINUTE, wp: initialWP },
    ];
    for (const ev of result.events) {
      curve.push({ minute: ev.time, wp: ev.willpowerAfter });
    }

    // Animate character walking and willpower updating
    this.character.setPosition(this.minuteToX(START_MINUTE), TIMELINE_Y + 60);
    this.character.setExpression("neutral");

    for (let i = 0; i < curve.length; i++) {
      const point = curve[i];
      const targetX = this.minuteToX(point.minute);

      // Walk to position
      await this.character.walkTo(targetX, TIMELINE_Y + 60, 400);

      // Update willpower bar
      this.options.willpowerBar.setValue(point.wp, initialWP);

      // Update character expression
      const pct = initialWP > 0 ? (point.wp / initialWP) * 100 : 0;
      this.character.setExpression(Character.expressionForWillpower(pct));

      // Show activation energy cost
      const ev = result.events[i - 1]; // events offset by 1 since curve[0] is initial
      if (
        ev &&
        ev.type === "start" &&
        ev.willpowerCost > 0
      ) {
        await this.showCostFloat(targetX, TIMELINE_Y + 30, ev.willpowerCost);
      }

      await this.delay(200);
    }

    // Store first run curve for ghost comparison
    if (!this.hasPlayedOnce) {
      this.firstRunCurve = curve.map((c) => c.wp);
      this.hasPlayedOnce = true;
      if (this.onFirstPlayComplete) {
        this.onFirstPlayComplete();
      }
    } else {
      // Draw ghost of first run
      this.drawGhostCurve(curve);
    }

    // Re-enable interactions
    for (const entry of this.blockEntries) {
      entry.container.eventMode = "static";
    }
    this.updatePlayButton();
  }

  private async showCostFloat(
    x: number,
    y: number,
    cost: number,
  ): Promise<void> {
    const style = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 18,
      fill: "#ef4444",
      fontWeight: "bold",
    });
    const text = new Text({ text: `-${Math.round(cost)}`, style });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    this.overlayContainer.addChild(text);

    const obj = { y: y, alpha: 1 };
    await new Promise<void>((resolve) => {
      const tween = new Tween(obj)
        .to({ y: y - 30, alpha: 0 }, 800)
        .onUpdate(() => {
          text.y = obj.y;
          text.alpha = obj.alpha;
        })
        .onComplete(() => {
          this.overlayContainer.removeChild(text);
          text.destroy();
          resolve();
        });
      this.tweenGroup.add(tween);
      tween.start();
    });
  }

  private drawGhostCurve(
    currentCurve: { minute: number; wp: number }[],
  ): void {
    if (!this.firstRunCurve) return;

    this.ghostGfx.clear();

    // Draw the first run as a faint line
    const ghostY = TIMELINE_Y - 50;
    const curveHeight = 40;

    // Find max for normalization
    const allValues = [
      ...this.firstRunCurve,
      ...currentCurve.map((c) => c.wp),
    ];
    const maxWP = Math.max(...allValues, 1);

    // Ghost line (first run)
    if (this.firstRunCurve.length > 1) {
      const step = this.options.width / (this.firstRunCurve.length - 1);
      this.ghostGfx.moveTo(
        0,
        ghostY - (this.firstRunCurve[0] / maxWP) * curveHeight,
      );
      for (let i = 1; i < this.firstRunCurve.length; i++) {
        this.ghostGfx.lineTo(
          i * step,
          ghostY - (this.firstRunCurve[i] / maxWP) * curveHeight,
        );
      }
      this.ghostGfx.stroke({ width: 2, color: 0x6b7280 });
    }
  }

  private resetTimeline(): void {
    for (const entry of this.blockEntries) {
      entry.container.x = entry.homeX;
      entry.container.y = entry.homeY;
      entry.placed = false;
      entry.snappedMinute = 0;
      entry.container.eventMode = "static";
    }

    this.character.setPosition(this.minuteToX(START_MINUTE), TIMELINE_Y + 60);
    this.character.setExpression("neutral");
    this.overlayContainer.removeChildren();
    this.updatePlayButton();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
