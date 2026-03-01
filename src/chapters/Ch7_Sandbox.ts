import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { DayTimeline } from "../interactions/DayTimeline";
import { ACTIVITIES } from "../sim/activities";
import { FIBER_KEYS, FIBER_COLORS } from "../sim/types";
import type { FiberState } from "../sim/types";
import { FiberModel } from "../sim/FiberModel";
import type { Game } from "../Game";

// ─── Fiber Slider Helper ────────────────────────────────────────

interface FiberSliderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  initialValue: number;
  onChange: (value: number) => void;
}

class FiberSlider extends Container {
  private knob: Graphics;
  private valueText: Text;
  private sliderValue: number;
  private trackHeight: number;
  private trackX: number;
  private onChange: (value: number) => void;

  constructor(options: FiberSliderOptions) {
    super();
    this.x = options.x;
    this.y = options.y;
    this.sliderValue = options.initialValue;
    this.onChange = options.onChange;

    const trackWidth = 10;
    this.trackHeight = options.height - 40;
    this.trackX = options.width / 2;

    // Label at top
    const label = new Text({
      text: options.label.slice(0, 4).toUpperCase(),
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 10,
        fill: options.color,
        fontWeight: "bold",
      }),
    });
    label.anchor.set(0.5, 0);
    label.x = this.trackX;
    label.y = 0;
    this.addChild(label);

    // Track background
    const track = new Graphics();
    track
      .roundRect(this.trackX - trackWidth / 2, 18, trackWidth, this.trackHeight, 4)
      .fill(0x374151);
    this.addChild(track);

    // Filled portion
    const fill = new Graphics();
    this.addChild(fill);

    // Knob
    this.knob = new Graphics();
    this.knob.circle(0, 0, 8).fill(options.color);
    this.knob.x = this.trackX;
    this.updateKnobY();
    this.addChild(this.knob);

    // Value text at bottom
    this.valueText = new Text({
      text: `${this.sliderValue}`,
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 11,
        fill: "#e0e0e0",
      }),
    });
    this.valueText.anchor.set(0.5, 0);
    this.valueText.x = this.trackX;
    this.valueText.y = this.trackHeight + 22;
    this.addChild(this.valueText);

    // Interaction
    this.knob.eventMode = "static";
    this.knob.cursor = "ns-resize";
    let dragging = false;

    this.knob.on("pointerdown", () => {
      dragging = true;
    });
    this.knob.on("globalpointermove", (e: FederatedPointerEvent) => {
      if (!dragging) return;
      const local = this.toLocal(e.global);
      const trackTop = 18;
      const trackBottom = 18 + this.trackHeight;
      const clamped = Math.max(trackTop, Math.min(local.y, trackBottom));
      // Invert: top = max, bottom = min
      const ratio = 1 - (clamped - trackTop) / (trackBottom - trackTop);
      this.sliderValue = Math.round(ratio * 20);
      this.knob.y = clamped;
      this.valueText.text = `${this.sliderValue}`;
      this.onChange(this.sliderValue);
    });
    this.knob.on("pointerup", () => {
      dragging = false;
    });
    this.knob.on("pointerupoutside", () => {
      dragging = false;
    });
  }

  getValue(): number {
    return this.sliderValue;
  }

  private updateKnobY(): void {
    const trackTop = 18;
    const ratio = 1 - this.sliderValue / 20;
    this.knob.y = trackTop + ratio * this.trackHeight;
  }
}

// ─── Toggle Button Helper ────────────────────────────────────────

class ToggleButton extends Container {
  private bg: Graphics;
  private labelText: Text;
  private isOn = false;
  private onToggle: (isOn: boolean) => void;
  private btnWidth: number;
  private btnHeight: number;

  constructor(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onToggle: (isOn: boolean) => void,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.btnWidth = width;
    this.btnHeight = height;
    this.onToggle = onToggle;

    this.bg = new Graphics();
    this.drawBg();
    this.addChild(this.bg);

    this.labelText = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 12,
        fill: "#ffffff",
        fontWeight: "bold",
      }),
    });
    this.labelText.anchor.set(0.5);
    this.labelText.x = this.btnWidth / 2;
    this.labelText.y = this.btnHeight / 2;
    this.addChild(this.labelText);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = {
      contains: (px: number, py: number) =>
        px >= 0 && px <= this.btnWidth && py >= 0 && py <= this.btnHeight,
    };
    this.on("pointerdown", () => {
      this.isOn = !this.isOn;
      this.drawBg();
      this.onToggle(this.isOn);
    });
  }

  getIsOn(): boolean {
    return this.isOn;
  }

  private drawBg(): void {
    this.bg.clear();
    const color = this.isOn ? 0x22c55e : 0x4b5563;
    this.bg.roundRect(0, 0, this.btnWidth, this.btnHeight, 6).fill(color);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Chapter 7: Your Day (Sandbox)
// ═══════════════════════════════════════════════════════════════════

export class Ch7_Sandbox extends Scene {
  onComplete: (() => void) | null = null;
  private game: Game;

  constructor(app: Application, game: Game) {
    super(app);
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
    this.container.addChild(text1);
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
    this.container.addChild(bullets);
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

    // Layout: left 60% for timeline, right 40% for controls
    const leftWidth = Math.floor(w * 0.6);
    const rightX = leftWidth + 10;
    const rightWidth = w - rightX - 10;

    // ─── Left Panel: Day Timeline ────────────────────────────

    const timeline = new DayTimeline({
      x: 10,
      y: 50,
      width: leftWidth - 20,
      height: h * 0.65,
      activities: ACTIVITIES,
      willpowerBar: this.game.willpowerBar,
    });
    this.container.addChild(timeline);

    // ─── Right Panel: Controls ───────────────────────────────

    const controlPanel = new Container();
    controlPanel.x = rightX;
    controlPanel.y = 50;
    this.container.addChild(controlPanel);

    // Panel background
    const panelBg = new Graphics();
    panelBg
      .roundRect(0, 0, rightWidth, h * 0.65, 8)
      .fill({ color: 0x1e293b, alpha: 0.6 });
    controlPanel.addChild(panelBg);

    // ── Fiber Sliders ──────────────────────────────────────

    const fiberLabel = new Text({
      text: "Fiber Levels",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 14,
        fill: "#e0e0e0",
        fontWeight: "bold",
      }),
    });
    fiberLabel.x = 10;
    fiberLabel.y = 8;
    controlPanel.addChild(fiberLabel);

    const fiberState: FiberState = FiberModel.defaultFibers();
    const sliderSpacing = Math.min(50, (rightWidth - 20) / FIBER_KEYS.length);
    const sliderStartX = 10;
    const sliderHeight = Math.min(160, h * 0.25);
    const fiberSliders: FiberSlider[] = [];

    for (let i = 0; i < FIBER_KEYS.length; i++) {
      const key = FIBER_KEYS[i];
      const slider = new FiberSlider({
        x: sliderStartX + i * sliderSpacing,
        y: 28,
        width: sliderSpacing,
        height: sliderHeight,
        label: key,
        color: FIBER_COLORS[key],
        initialValue: fiberState[key],
        onChange: (val: number) => {
          fiberState[key] = val;
          updateTotalDisplay();
        },
      });
      controlPanel.addChild(slider);
      fiberSliders.push(slider);
    }

    // ── Lever Toggles ──────────────────────────────────────

    const toggleY = sliderHeight + 50;
    const toggleW = rightWidth - 20;
    const toggleH = 32;

    let morningHabitsOn = false;
    let schedulesOn = false;
    let highPeersOn = false;

    const morningToggle = new ToggleButton(
      "Morning Habits",
      10,
      toggleY,
      toggleW,
      toggleH,
      (on) => {
        morningHabitsOn = on;
        updateTotalDisplay();
      },
    );
    controlPanel.addChild(morningToggle);

    const schedulesToggle = new ToggleButton(
      "Schedules",
      10,
      toggleY + toggleH + 6,
      toggleW,
      toggleH,
      (on) => {
        schedulesOn = on;
        updateTotalDisplay();
      },
    );
    controlPanel.addChild(schedulesToggle);

    const peersToggle = new ToggleButton(
      "High Peers",
      10,
      toggleY + (toggleH + 6) * 2,
      toggleW,
      toggleH,
      (on) => {
        highPeersOn = on;
        updateTotalDisplay();
      },
    );
    controlPanel.addChild(peersToggle);

    // ── Willpower Summary ──────────────────────────────────

    const summaryY = toggleY + (toggleH + 6) * 3 + 10;
    const totalDisplay = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 18,
        fill: "#4ade80",
        fontWeight: "bold",
      }),
    });
    totalDisplay.x = 10;
    totalDisplay.y = summaryY;
    controlPanel.addChild(totalDisplay);

    const breakdownDisplay = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 12,
        fill: "#9ca3af",
      }),
    });
    breakdownDisplay.x = 10;
    breakdownDisplay.y = summaryY + 26;
    controlPanel.addChild(breakdownDisplay);

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
      totalDisplay.text = `Total: ${total}`;
      breakdownDisplay.text = parts.length > 0
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

    // Show closing text either after first play or after timeout
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
      this.container.addChild(closing1);
      await closing1.show();

      await this.delay(1200);

      const closing2 = new TextBox({
        text: "The goal is to understand the system well enough to work with it instead of against it.",
        x: textX,
        y: h * 0.7 + 50,
        maxWidth: textMaxW,
      });
      this.container.addChild(closing2);
      await closing2.show();

      await this.delay(1200);

      const closing3 = new TextBox({
        text: "You don't need more discipline.",
        x: textX,
        y: h * 0.7 + 100,
        maxWidth: textMaxW,
      });
      this.container.addChild(closing3);
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
      this.container.addChild(closing4);
      await closing4.show();

      // Credits
      const credits = new Text({
        text: "Based on Igor's Activation Energy model \u2022 Built with Claude",
        style: new TextStyle({
          fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
          fontSize: 13,
          fill: "#6b7280",
          fontStyle: "italic",
        }),
      });
      credits.anchor.set(0.5, 0);
      credits.x = w / 2;
      credits.y = h - 55;
      this.container.addChild(credits);

      const link = new Text({
        text: "Read more at idvork.in/activation",
        style: new TextStyle({
          fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
          fontSize: 13,
          fill: "#3b82f6",
        }),
      });
      link.anchor.set(0.5, 0);
      link.x = w / 2;
      link.y = h - 35;
      link.eventMode = "static";
      link.cursor = "pointer";
      link.on("pointerdown", () => {
        window.open("https://idvork.in/activation", "_blank");
      });
      this.container.addChild(link);
    };

    // Race: first play completes or 30s timeout
    const playPromise = new Promise<void>((resolve) => {
      timeline.onFirstPlayComplete = resolve;
    });
    const timeoutPromise = this.delay(30000);

    Promise.race([playPromise, timeoutPromise]).then(() => showClosing());
  }

  async exit(): Promise<void> {
    // Cleanup handled by Scene.destroy()
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
