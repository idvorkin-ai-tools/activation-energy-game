import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";

import { DayTimeline } from "../interactions/DayTimeline";
import { ACTIVITIES } from "../sim/activities";
import { FIBER_KEYS, FIBER_COLORS } from "../sim/types";
import type { FiberState } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import type { Game } from "../Game";

// ─── Fiber Slider Helper ────────────────────────────────────────

interface FiberSliderOptions {
  label: string;
  color: string;
  initialValue: number;
  height: number;
  onChange: (value: number) => void;
}

class FiberSlider {
  el: HTMLDivElement;
  private slider: HTMLInputElement;
  private valueLabel: HTMLDivElement;
  private onChange: (value: number) => void;

  constructor(options: FiberSliderOptions) {
    this.onChange = options.onChange;

    this.el = document.createElement("div");
    this.el.style.display = "flex";
    this.el.style.flexDirection = "column";
    this.el.style.alignItems = "center";
    this.el.style.gap = "4px";

    // Label at top
    const label = document.createElement("div");
    label.style.fontSize = "10px";
    label.style.fontWeight = "bold";
    label.style.color = options.color;
    label.textContent = options.label.slice(0, 4).toUpperCase();
    this.el.appendChild(label);

    // Vertical range slider
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.min = "0";
    this.slider.max = "20";
    this.slider.value = String(options.initialValue);
    this.slider.style.writingMode = "vertical-lr";
    this.slider.style.direction = "rtl";
    this.slider.style.height = `${options.height}px`;
    this.slider.style.width = "20px";
    this.slider.style.accentColor = options.color;
    this.slider.style.cursor = "ns-resize";
    this.slider.addEventListener("input", () => {
      const val = parseInt(this.slider.value, 10);
      this.valueLabel.textContent = String(val);
      this.onChange(val);
    });
    this.el.appendChild(this.slider);

    // Value text at bottom
    this.valueLabel = document.createElement("div");
    this.valueLabel.style.fontSize = "11px";
    this.valueLabel.style.color = "#e0e0e0";
    this.valueLabel.textContent = String(options.initialValue);
    this.el.appendChild(this.valueLabel);
  }

  getValue(): number {
    return parseInt(this.slider.value, 10);
  }
}

// ─── Toggle Button Helper ────────────────────────────────────────

class ToggleButton {
  el: HTMLButtonElement;
  private isOn = false;
  private onToggle: (isOn: boolean) => void;

  constructor(text: string, onToggle: (isOn: boolean) => void) {
    this.onToggle = onToggle;

    this.el = document.createElement("button");
    this.el.className = "game-btn";
    this.el.textContent = text;
    this.el.style.width = "100%";
    this.el.style.height = "32px";
    this.el.style.fontSize = "12px";
    this.el.style.background = "#4b5563";
    this.el.style.border = "none";
    this.el.style.borderRadius = "6px";
    this.el.style.color = "#ffffff";
    this.el.style.fontWeight = "bold";
    this.el.style.cursor = "pointer";
    this.el.addEventListener("click", () => {
      this.isOn = !this.isOn;
      this.el.style.background = this.isOn ? "#22c55e" : "#4b5563";
      this.onToggle(this.isOn);
    });
  }

  getIsOn(): boolean {
    return this.isOn;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Chapter 7: Your Day (Sandbox)
// ═══════════════════════════════════════════════════════════════════

export class Ch7_Sandbox extends Scene {
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
  }

  async enter(): Promise<void> {
    const w = this.width;
    const h = this.height;
    const textX = 80;
    const textMaxW = w * 0.7;

    // ─── Intro Text ──────────────────────────────────────────

    const text1 = new TextBox({
      text: "You know the system now.",
      x: textX,
      y: 50,
      maxWidth: textMaxW,
      fontSize: 24,
    });
    this.el.appendChild(text1.el);
    await text1.show();

    await this.delay(800);

    const bullets = new TextBox({
      text: "Activities have starting and stopping costs\nWillpower is five fibers, not one bar\nOrder matters \u2014 morning habits supercharge everything\nSchedules eliminate choice leaks\nPeers shift your gravity",
      x: textX + 20,
      y: 90,
      maxWidth: textMaxW - 20,
      fontSize: 16,
      color: "#9ca3af",
    });
    this.el.appendChild(bullets.el);
    await bullets.show();

    await this.delay(2000);

    // ─── Clear intro, build sandbox ──────────────────────────

    text1.hide();
    bullets.hide();

    await this.buildSandbox(w, h);
  }

  private async buildSandbox(w: number, h: number): Promise<void> {
    const textX = 80;
    const textMaxW = w * 0.7;

    // Layout: responsive - stack vertically on narrow screens
    const isNarrow = w < 700;

    let timelineX: number, timelineY: number, timelineW: number, timelineH: number;
    let controlX: number, controlY: number, controlW: number, controlH: number;

    if (isNarrow) {
      timelineX = 10;
      timelineY = 50;
      timelineW = w - 20;
      timelineH = h * 0.45;
      controlX = 10;
      controlY = timelineY + timelineH + 10;
      controlW = w - 20;
      controlH = h * 0.40;
    } else {
      const leftWidth = Math.floor(w * 0.6);
      const rightX = leftWidth + 10;
      const rightWidth = w - rightX - 10;
      timelineX = 10;
      timelineY = 50;
      timelineW = leftWidth - 20;
      timelineH = h * 0.65;
      controlX = rightX;
      controlY = 50;
      controlW = rightWidth;
      controlH = h * 0.65;
    }

    // ─── Left/Top Panel: Day Timeline ────────────────────────

    const timeline = new DayTimeline({
      x: timelineX,
      y: timelineY,
      width: timelineW,
      height: timelineH,
      activities: ACTIVITIES,
      willpowerBar: this.game.willpowerBar,
    });
    this.el.appendChild(timeline.el);

    // ─── Right/Bottom Panel: Controls ────────────────────────

    const controlPanel = document.createElement("div");
    controlPanel.style.position = "absolute";
    controlPanel.style.left = `${controlX}px`;
    controlPanel.style.top = `${controlY}px`;
    controlPanel.style.width = `${controlW}px`;
    controlPanel.style.height = `${controlH}px`;
    controlPanel.style.background = "rgba(30, 41, 59, 0.6)";
    controlPanel.style.borderRadius = "8px";
    controlPanel.style.padding = "10px";
    controlPanel.style.boxSizing = "border-box";
    this.el.appendChild(controlPanel);

    // ── Fiber Sliders ──────────────────────────────────────

    const fiberLabel = document.createElement("div");
    fiberLabel.style.fontSize = "14px";
    fiberLabel.style.fontWeight = "bold";
    fiberLabel.style.color = "#e0e0e0";
    fiberLabel.style.marginBottom = "4px";
    fiberLabel.textContent = "Fiber Levels";
    controlPanel.appendChild(fiberLabel);

    const fiberState: FiberState = FiberModel.defaultFibers();
    const sliderHeight = Math.min(120, h * 0.2);

    const slidersRow = document.createElement("div");
    slidersRow.style.display = "flex";
    slidersRow.style.justifyContent = "space-around";
    slidersRow.style.marginBottom = "12px";
    controlPanel.appendChild(slidersRow);

    for (let i = 0; i < FIBER_KEYS.length; i++) {
      const key = FIBER_KEYS[i];
      const slider = new FiberSlider({
        label: key,
        color: FIBER_COLORS[key],
        initialValue: fiberState[key],
        height: sliderHeight,
        onChange: (val: number) => {
          fiberState[key] = val;
          updateTotalDisplay();
        },
      });
      slidersRow.appendChild(slider.el);
    }

    // ── Lever Toggles ──────────────────────────────────────

    const togglesContainer = document.createElement("div");
    togglesContainer.style.display = "flex";
    togglesContainer.style.flexDirection = "column";
    togglesContainer.style.gap = "6px";
    togglesContainer.style.marginBottom = "12px";
    controlPanel.appendChild(togglesContainer);

    let morningHabitsOn = false;
    let highPeersOn = false;

    const morningToggle = new ToggleButton("Morning Habits", (on) => {
      morningHabitsOn = on;
      updateTotalDisplay();
    });
    togglesContainer.appendChild(morningToggle.el);

    const schedulesToggle = new ToggleButton("Schedules", (_on) => {
      updateTotalDisplay();
    });
    togglesContainer.appendChild(schedulesToggle.el);

    const peersToggle = new ToggleButton("High Peers", (on) => {
      highPeersOn = on;
      updateTotalDisplay();
    });
    togglesContainer.appendChild(peersToggle.el);

    // ── Willpower Summary ──────────────────────────────────

    const totalDisplay = document.createElement("div");
    totalDisplay.style.fontSize = "18px";
    totalDisplay.style.fontWeight = "bold";
    totalDisplay.style.color = "#4ade80";
    controlPanel.appendChild(totalDisplay);

    const breakdownDisplay = document.createElement("div");
    breakdownDisplay.style.fontSize = "12px";
    breakdownDisplay.style.color = "#9ca3af";
    breakdownDisplay.style.marginTop = "4px";
    controlPanel.appendChild(breakdownDisplay);

    const updateTotalDisplay = () => {
      const base = FiberModel.totalWillpower(fiberState);
      let bonus = 0;
      const parts: string[] = [];

      if (morningHabitsOn) {
        bonus += 10;
        parts.push("+10 morning");
      }
      if (highPeersOn) {
        bonus += 5;
        parts.push("+5 peers");
      }

      const total = base + bonus;
      totalDisplay.textContent = `Total: ${total}`;
      breakdownDisplay.textContent = parts.length > 0
        ? `Base: ${base} ${parts.join(" ")}`
        : `Base: ${base}`;

      // Update the willpower bar
      this.game.willpowerBar.setValue(total, 100);

      // Update fiber mode on the bar
      const segments = FIBER_KEYS.map((key) => ({
        name: key,
        color: FIBER_COLORS[key],
        value: fiberState[key],
      }));
      this.game.willpowerBar.setFiberMode(segments);
    };

    updateTotalDisplay();

    // ─── Wait for first play ─────────────────────────────────

    let closingShown = false;

    const showClosing = async () => {
      if (closingShown) return;
      closingShown = true;

      await this.delay(800);

      const closing1 = new TextBox({
        text: "The goal isn't to have perfect willpower.",
        x: textX,
        y: h * 0.7 + 10,
        maxWidth: textMaxW,
      });
      this.el.appendChild(closing1.el);
      await closing1.show();

      await this.delay(1200);

      const closing2 = new TextBox({
        text: "The goal is to understand the system well enough to work with it instead of against it.",
        x: textX,
        y: h * 0.7 + 50,
        maxWidth: textMaxW,
      });
      this.el.appendChild(closing2.el);
      await closing2.show();

      await this.delay(1200);

      const closing3 = new TextBox({
        text: "You don't need more discipline.",
        x: textX,
        y: h * 0.7 + 100,
        maxWidth: textMaxW,
      });
      this.el.appendChild(closing3.el);
      await closing3.show();

      await this.delay(1000);

      const closing4 = new TextBox({
        text: "You need better physics.",
        x: textX,
        y: h * 0.7 + 140,
        maxWidth: textMaxW,
        fontSize: 24,
        color: "#3b82f6",
      });
      this.el.appendChild(closing4.el);
      await closing4.show();

      // Credits
      const credits = document.createElement("div");
      credits.style.position = "absolute";
      credits.style.left = "50%";
      credits.style.transform = "translateX(-50%)";
      credits.style.bottom = "55px";
      credits.style.fontSize = "13px";
      credits.style.color = "#6b7280";
      credits.style.fontStyle = "italic";
      credits.textContent = "Based on Igor's Activation Energy model \u2022 Built with Claude";
      this.el.appendChild(credits);

      const link = document.createElement("a");
      link.href = "https://idvork.in/activation";
      link.target = "_blank";
      link.style.position = "absolute";
      link.style.left = "50%";
      link.style.transform = "translateX(-50%)";
      link.style.bottom = "35px";
      link.style.fontSize = "13px";
      link.style.color = "#3b82f6";
      link.style.textDecoration = "none";
      link.style.cursor = "pointer";
      link.textContent = "Read more at idvork.in/activation";
      this.el.appendChild(link);
    };

    // Race: first play completes or 30s timeout
    const playPromise = new Promise<void>((resolve) => {
      timeline.onFirstPlayComplete = resolve;
    });
    const timeoutPromise = this.delay(30000);

    Promise.race([playPromise, timeoutPromise]).then(() => showClosing());
  }

  async exit(): Promise<void> {}

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
