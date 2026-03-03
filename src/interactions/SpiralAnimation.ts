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

const DAY_PANEL_HEIGHT = 200;
const BAR_WIDTH = 16;
const BAR_MAX_HEIGHT = 80;
const NUM_DAYS = 5;

export class SpiralAnimation {
  el: HTMLDivElement;
  onPlayComplete: (() => void) | null = null;
  onRewindComplete: (() => void) | null = null;

  private optionsWidth: number;
  private panelsEl: HTMLDivElement;
  private character: Character;
  private narrationText: HTMLDivElement;
  private spiralData: DailyState[] | null = null;
  private interventionData: DailyState[] | null = null;
  private dayNarrations: string[] = [];
  private playBtn: HTMLButtonElement | null = null;
  private rewindBtn: HTMLButtonElement | null = null;
  private isPlaying = false;
  private isNarrow: boolean;
  private dayPanelWidth: number;
  private dayPanelGap: number;

  constructor(options: SpiralAnimationOptions) {
    this.optionsWidth = options.width;
    this.isNarrow = options.width < 600;
    this.dayPanelWidth = this.isNarrow ? 65 : 140;
    this.dayPanelGap = this.isNarrow ? 6 : 12;

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    this.panelsEl = document.createElement("div");
    this.panelsEl.style.position = "absolute";
    this.panelsEl.style.inset = "0";
    this.el.appendChild(this.panelsEl);

    // Character
    this.character = new Character();
    this.character.setPosition(20, DAY_PANEL_HEIGHT + 50);
    this.el.appendChild(this.character.el);

    // Narration text
    this.narrationText = document.createElement("div");
    this.narrationText.style.position = "absolute";
    this.narrationText.style.left = "10px";
    this.narrationText.style.top = `${DAY_PANEL_HEIGHT + 90}px`;
    this.narrationText.style.fontSize = "14px";
    this.narrationText.style.color = "#e0e0e0";
    this.narrationText.style.maxWidth = `${options.width * 0.8}px`;
    this.narrationText.style.lineHeight = "20px";
    this.el.appendChild(this.narrationText);

    // Precompute spiral data
    const initialFibers = FiberModel.defaultFibers();
    const weakened = FiberModel.weakenFiber(initialFibers, "physical", 8);
    const spiral = new DeathSpiral();
    this.spiralData = spiral.simulate(weakened, NUM_DAYS);
    this.interventionData = spiral.simulateWithIntervention(weakened, NUM_DAYS, 1, "morning-workout");

    this.dayNarrations = [
      "You stay up late scrolling. No big deal.",
      "You're tired. Skip the workout. Snap at a coworker.",
      "Can't focus. The phone keeps appearing in your hand.",
      "Everything feels harder. You cancel plans with friends.",
      "All five fibers are weakened. The only thing with activation energy low enough to start is... TikTok.",
    ];

    // Play button
    this.playBtn = document.createElement("button");
    this.playBtn.className = "game-btn";
    this.playBtn.textContent = "Play \u25B6";
    this.playBtn.style.position = "absolute";
    this.playBtn.style.left = `${options.width / 2 - 60}px`;
    this.playBtn.style.top = `${DAY_PANEL_HEIGHT + 50}px`;
    this.playBtn.style.background = "#22c55e";
    this.playBtn.style.minWidth = "120px";
    this.playBtn.style.height = "40px";
    this.playBtn.addEventListener("click", () => this.play());
    this.el.appendChild(this.playBtn);
  }

  showRewindButton(): void {
    if (this.rewindBtn) return;
    this.rewindBtn = document.createElement("button");
    this.rewindBtn.className = "game-btn";
    this.rewindBtn.textContent = "\u23EA Rewind";
    this.rewindBtn.style.position = "absolute";
    this.rewindBtn.style.left = `${this.optionsWidth / 2 - 60}px`;
    this.rewindBtn.style.top = `${DAY_PANEL_HEIGHT + 50}px`;
    this.rewindBtn.style.background = "#f97316";
    this.rewindBtn.style.minWidth = "120px";
    this.rewindBtn.style.height = "40px";
    this.rewindBtn.addEventListener("click", () => this.playIntervention());
    this.el.appendChild(this.rewindBtn);
  }

  async play(): Promise<void> {
    if (this.isPlaying || !this.spiralData) return;
    this.isPlaying = true;
    if (this.playBtn) this.playBtn.style.display = "none";

    this.panelsEl.innerHTML = "";
    this.character.setExpression("neutral");

    for (let day = 0; day < this.spiralData.length; day++) {
      const state = this.spiralData[day];
      this.drawDayPanel(day, state, false);

      const panelX = day * (this.dayPanelWidth + this.dayPanelGap) + this.dayPanelWidth / 2;
      await this.character.walkTo(panelX, DAY_PANEL_HEIGHT + 50, 600);

      const maxWP = FiberModel.totalWillpower(FiberModel.defaultFibers());
      const pct = maxWP > 0 ? (state.totalWillpower / maxWP) * 100 : 0;
      this.character.setExpression(Character.expressionForWillpower(pct));
      this.narrationText.textContent = this.dayNarrations[day] ?? "";
      await this.delay(1500);
    }

    this.isPlaying = false;
    if (this.onPlayComplete) this.onPlayComplete();
  }

  async playIntervention(): Promise<void> {
    if (this.isPlaying || !this.interventionData) return;
    this.isPlaying = true;
    if (this.rewindBtn) this.rewindBtn.style.display = "none";

    this.panelsEl.innerHTML = "";
    this.character.setPosition(20, DAY_PANEL_HEIGHT + 50);
    this.character.setExpression("neutral");

    const interventionNarrations = [
      "Same late night. Same weakened physical fiber.",
      "But today, you force the workout. It costs almost everything.",
      "The physical fiber stabilizes. Focus returns a little.",
      "You make it to work. You call a friend.",
      "The spiral breaks. Not fixed \u2014 but stopped.",
    ];

    for (let day = 0; day < this.interventionData.length; day++) {
      const state = this.interventionData[day];
      this.drawDayPanel(day, state, day === 1);

      const panelX = day * (this.dayPanelWidth + this.dayPanelGap) + this.dayPanelWidth / 2;
      await this.character.walkTo(panelX, DAY_PANEL_HEIGHT + 50, 600);

      const maxWP = FiberModel.totalWillpower(FiberModel.defaultFibers());
      const pct = maxWP > 0 ? (state.totalWillpower / maxWP) * 100 : 0;
      this.character.setExpression(Character.expressionForWillpower(pct));
      this.narrationText.textContent = interventionNarrations[day] ?? "";
      await this.delay(1500);
    }

    this.isPlaying = false;
    if (this.onRewindComplete) this.onRewindComplete();
  }

  private drawDayPanel(dayIndex: number, state: DailyState, isIntervention: boolean): void {
    const panelW = this.dayPanelWidth;
    const panelGap = this.dayPanelGap;
    const barWidth = this.isNarrow ? 8 : BAR_WIDTH;
    const barGap = this.isNarrow ? 2 : 4;

    const panel = document.createElement("div");
    panel.style.position = "absolute";
    panel.style.left = `${dayIndex * (panelW + panelGap)}px`;
    panel.style.top = "0";
    panel.style.width = `${panelW}px`;
    panel.style.height = `${DAY_PANEL_HEIGHT}px`;
    panel.style.borderRadius = "8px";
    panel.style.background = isIntervention ? "rgba(30, 58, 47, 0.8)" : "rgba(31, 41, 55, 0.8)";

    // Day label
    const dayLabel = document.createElement("div");
    dayLabel.style.textAlign = "center";
    dayLabel.style.paddingTop = "8px";
    dayLabel.style.fontSize = this.isNarrow ? "10px" : "14px";
    dayLabel.style.fontWeight = "bold";
    dayLabel.style.color = isIntervention ? "#4ade80" : "#e0e0e0";
    dayLabel.textContent = this.isNarrow ? `D${dayIndex + 1}` : `Day ${dayIndex + 1}`;
    panel.appendChild(dayLabel);

    // Fiber bars using a small canvas
    const barCanvas = document.createElement("canvas");
    barCanvas.width = panelW;
    barCanvas.height = 100;
    barCanvas.style.position = "absolute";
    barCanvas.style.top = "30px";
    const bCtx = barCanvas.getContext("2d")!;

    const barStartX = (panelW - FIBER_KEYS.length * (barWidth + barGap)) / 2;
    const barBaseY = 90;

    FIBER_KEYS.forEach((key, i) => {
      const value = state.fibers[key];
      const barHeight = (value / 20) * BAR_MAX_HEIGHT;
      const bx = barStartX + i * (barWidth + barGap);

      bCtx.fillStyle = FIBER_COLORS[key];
      bCtx.beginPath();
      bCtx.roundRect(bx, barBaseY - barHeight, barWidth, barHeight, 3);
      bCtx.fill();

      if (!this.isNarrow) {
        bCtx.fillStyle = FIBER_COLORS[key];
        bCtx.font = "9px Arial, Helvetica, sans-serif";
        bCtx.textAlign = "center";
        bCtx.fillText(String(Math.round(value)), bx + barWidth / 2, barBaseY + 12);
      }
    });
    panel.appendChild(barCanvas);

    // WP label
    const wpLabel = document.createElement("div");
    wpLabel.style.textAlign = "center";
    wpLabel.style.position = "absolute";
    wpLabel.style.bottom = "40px";
    wpLabel.style.width = "100%";
    wpLabel.style.fontSize = this.isNarrow ? "9px" : "12px";
    wpLabel.style.color = "#9ca3af";
    wpLabel.textContent = `WP: ${state.totalWillpower}`;
    panel.appendChild(wpLabel);

    // Skipped activities
    const skippedStr = state.activitiesSkipped.length > 0
      ? state.activitiesSkipped.join(", ").slice(0, this.isNarrow ? 15 : 30)
      : "";
    if (skippedStr) {
      const skippedLabel = document.createElement("div");
      skippedLabel.style.position = "absolute";
      skippedLabel.style.bottom = "8px";
      skippedLabel.style.left = "8px";
      skippedLabel.style.right = "8px";
      skippedLabel.style.fontSize = this.isNarrow ? "7px" : "9px";
      skippedLabel.style.color = "#6b7280";
      skippedLabel.textContent = `Skipped: ${skippedStr}`;
      panel.appendChild(skippedLabel);
    }

    this.panelsEl.appendChild(panel);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
