import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Group } from "@tweenjs/tween.js";
import type { DailyState } from "../sim/types";
import { FIBER_KEYS, FIBER_COLORS } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import { DeathSpiral } from "../sim/DeathSpiral";
import { Character } from "../characters/Character";

export interface SpiralAnimationOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DAY_PANEL_WIDTH = 140;
const DAY_PANEL_HEIGHT = 200;
const DAY_PANEL_GAP = 12;
const BAR_WIDTH = 16;
const BAR_MAX_HEIGHT = 80;
const NUM_DAYS = 5;

export class SpiralAnimation extends Container {
  private _options: SpiralAnimationOptions;
  private tweenGroup: Group;
  private panelsContainer: Container;
  private overlayContainer: Container;
  private character: Character;
  private spiralData: DailyState[] | null = null;
  private interventionData: DailyState[] | null = null;
  private dayNarrations: string[] = [];
  private narrationText: Text;
  private playBtn: Container | null = null;
  private rewindBtn: Container | null = null;
  private isPlaying = false;
  private hasPlayed = false;
  private showingIntervention = false;

  onPlayComplete: (() => void) | null = null;
  onRewindComplete: (() => void) | null = null;

  constructor(options: SpiralAnimationOptions) {
    super();

    this._options = options;
    this.x = options.x;
    this.y = options.y;
    this.tweenGroup = new Group();

    this.panelsContainer = new Container();
    this.overlayContainer = new Container();
    this.addChild(this.panelsContainer);
    this.addChild(this.overlayContainer);

    // Character
    this.character = new Character();
    this.character.setPosition(20, DAY_PANEL_HEIGHT + 50);
    this.addChild(this.character.container);

    // Narration text
    const narStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 14,
      fill: "#e0e0e0",
      wordWrap: true,
      wordWrapWidth: options.width * 0.8,
      lineHeight: 20,
    });
    this.narrationText = new Text({ text: "", style: narStyle });
    this.narrationText.x = 10;
    this.narrationText.y = DAY_PANEL_HEIGHT + 90;
    this.addChild(this.narrationText);

    // Precompute spiral data
    const initialFibers = FiberModel.defaultFibers();
    // Weaken physical to start the spiral (stayed up late)
    const weakened = FiberModel.weakenFiber(initialFibers, "physical", 8);
    const spiral = new DeathSpiral();
    this.spiralData = spiral.simulate(weakened, NUM_DAYS);
    this.interventionData = spiral.simulateWithIntervention(
      weakened,
      NUM_DAYS,
      1, // intervene on day 2 (index 1)
      "morning-workout",
    );

    this.dayNarrations = [
      "You stay up late scrolling. No big deal.",
      "You're tired. Skip the workout. Snap at a coworker.",
      "Can't focus. The phone keeps appearing in your hand.",
      "Everything feels harder. You cancel plans with friends.",
      "All five fibers are weakened. The only thing with activation energy low enough to start is... TikTok.",
    ];

    // Play button
    this.playBtn = this.makeButton(
      "Play \u25B6",
      options.width / 2 - 60,
      DAY_PANEL_HEIGHT + 50,
      0x22c55e,
      () => this.play(),
    );
    this.addChild(this.playBtn);

    // Drive tweens
    const animate = () => {
      this.tweenGroup.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /** Show rewind button for intervention path */
  showRewindButton(): void {
    if (this.rewindBtn) return;
    this.rewindBtn = this.makeButton(
      "\u23EA Rewind",
      this._options.width / 2 - 60,
      DAY_PANEL_HEIGHT + 50,
      0xf97316,
      () => this.playIntervention(),
    );
    this.addChild(this.rewindBtn);
  }

  // ─── Playback ─────────────────────────────────────────────────

  async play(): Promise<void> {
    if (this.isPlaying || !this.spiralData) return;
    this.isPlaying = true;

    if (this.playBtn) {
      this.playBtn.visible = false;
    }

    this.panelsContainer.removeChildren();
    this.character.setExpression("neutral");

    for (let day = 0; day < this.spiralData.length; day++) {
      const state = this.spiralData[day];

      // Draw day panel
      this.drawDayPanel(day, state, false);

      // Move character to this panel
      const panelX = day * (DAY_PANEL_WIDTH + DAY_PANEL_GAP) + DAY_PANEL_WIDTH / 2;
      await this.character.walkTo(panelX, DAY_PANEL_HEIGHT + 50, 600);

      // Update expression based on willpower
      const maxWP = FiberModel.totalWillpower(FiberModel.defaultFibers());
      const pct = maxWP > 0 ? (state.totalWillpower / maxWP) * 100 : 0;
      this.character.setExpression(Character.expressionForWillpower(pct));

      // Show narration
      this.narrationText.text = this.dayNarrations[day] ?? "";

      await this.delay(1500);
    }

    this.isPlaying = false;
    this.hasPlayed = true;

    if (this.onPlayComplete) {
      this.onPlayComplete();
    }
  }

  async playIntervention(): Promise<void> {
    if (this.isPlaying || !this.interventionData) return;
    this.isPlaying = true;
    this.showingIntervention = true;

    if (this.rewindBtn) {
      this.rewindBtn.visible = false;
    }

    this.panelsContainer.removeChildren();
    this.character.setPosition(20, DAY_PANEL_HEIGHT + 50);
    this.character.setExpression("neutral");

    const interventionNarrations = [
      "Same late night. Same weakened physical fiber.",
      "But today, you force the workout. It costs almost everything.",
      "The physical fiber stabilizes. Focus returns a little.",
      "You make it to work. You call a friend.",
      "The spiral breaks. Not fixed — but stopped.",
    ];

    for (let day = 0; day < this.interventionData.length; day++) {
      const state = this.interventionData[day];

      this.drawDayPanel(day, state, day === 1);

      const panelX = day * (DAY_PANEL_WIDTH + DAY_PANEL_GAP) + DAY_PANEL_WIDTH / 2;
      await this.character.walkTo(panelX, DAY_PANEL_HEIGHT + 50, 600);

      const maxWP = FiberModel.totalWillpower(FiberModel.defaultFibers());
      const pct = maxWP > 0 ? (state.totalWillpower / maxWP) * 100 : 0;
      this.character.setExpression(Character.expressionForWillpower(pct));

      this.narrationText.text = interventionNarrations[day] ?? "";

      await this.delay(1500);
    }

    this.isPlaying = false;

    if (this.onRewindComplete) {
      this.onRewindComplete();
    }
  }

  // ─── Drawing ──────────────────────────────────────────────────

  private drawDayPanel(
    dayIndex: number,
    state: DailyState,
    isIntervention: boolean,
  ): void {
    const c = new Container();
    const px = dayIndex * (DAY_PANEL_WIDTH + DAY_PANEL_GAP);
    c.x = px;
    c.y = 0;

    // Panel background
    const bg = new Graphics();
    const bgColor = isIntervention ? 0x1e3a2f : 0x1f2937;
    bg.roundRect(0, 0, DAY_PANEL_WIDTH, DAY_PANEL_HEIGHT, 8).fill(bgColor);
    bg.alpha = 0.8;
    c.addChild(bg);

    // Day label
    const dayStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 14,
      fill: isIntervention ? "#4ade80" : "#e0e0e0",
      fontWeight: "bold",
    });
    const dayLabel = new Text({
      text: `Day ${dayIndex + 1}`,
      style: dayStyle,
    });
    dayLabel.anchor.set(0.5, 0);
    dayLabel.x = DAY_PANEL_WIDTH / 2;
    dayLabel.y = 8;
    c.addChild(dayLabel);

    // Fiber bars
    const barStartX =
      (DAY_PANEL_WIDTH - FIBER_KEYS.length * (BAR_WIDTH + 4)) / 2;
    const barBaseY = 120;

    FIBER_KEYS.forEach((key, i) => {
      const value = state.fibers[key];
      const barHeight = (value / 20) * BAR_MAX_HEIGHT;
      const bx = barStartX + i * (BAR_WIDTH + 4);

      const bar = new Graphics();
      bar
        .roundRect(bx, barBaseY - barHeight, BAR_WIDTH, barHeight, 3)
        .fill(FIBER_COLORS[key]);
      c.addChild(bar);

      // Value label
      const valStyle = new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 9,
        fill: FIBER_COLORS[key],
      });
      const valLabel = new Text({
        text: String(Math.round(value)),
        style: valStyle,
      });
      valLabel.anchor.set(0.5, 0);
      valLabel.x = bx + BAR_WIDTH / 2;
      valLabel.y = barBaseY + 4;
      c.addChild(valLabel);
    });

    // Willpower total
    const wpStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 12,
      fill: "#9ca3af",
    });
    const wpLabel = new Text({
      text: `WP: ${state.totalWillpower}`,
      style: wpStyle,
    });
    wpLabel.anchor.set(0.5, 0);
    wpLabel.x = DAY_PANEL_WIDTH / 2;
    wpLabel.y = 140;
    c.addChild(wpLabel);

    // Activity summary
    const skippedStr = state.activitiesSkipped.length > 0
      ? state.activitiesSkipped.join(", ").slice(0, 30)
      : "";

    const actStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 9,
      fill: "#6b7280",
      wordWrap: true,
      wordWrapWidth: DAY_PANEL_WIDTH - 16,
    });

    if (skippedStr) {
      const skippedLabel = new Text({
        text: `Skipped: ${skippedStr}`,
        style: actStyle,
      });
      skippedLabel.x = 8;
      skippedLabel.y = 160;
      c.addChild(skippedLabel);
    }

    this.panelsContainer.addChild(c);
  }

  // ─── Helpers ──────────────────────────────────────────────────

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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
