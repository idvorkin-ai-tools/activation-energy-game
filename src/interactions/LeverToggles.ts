import {
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from "pixi.js";
import { Character } from "../characters/Character";

// ─── Shared Styles ──────────────────────────────────────────────

const LABEL_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
  fontSize: 14,
  fill: "#e0e0e0",
});

const SMALL_STYLE = new TextStyle({
  fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
  fontSize: 12,
  fill: "#9ca3af",
});

// ═══════════════════════════════════════════════════════════════════
// Lever 1: Morning Habits Toggle
// ═══════════════════════════════════════════════════════════════════

export interface MorningHabitsToggleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MorningHabitsToggle extends Container {
  private isOn = false;
  private curveGfx: Graphics;
  private statsText: Text;
  private toggleBtn: Container;
  private toggleLabel: Text;
  private chartWidth: number;
  private chartHeight: number;
  private chartX: number;
  private chartY: number;

  constructor(options: MorningHabitsToggleOptions) {
    super();
    this.x = options.x;
    this.y = options.y;

    this.chartWidth = options.width - 40;
    this.chartHeight = options.height - 80;
    this.chartX = 20;
    this.chartY = 50;

    // Toggle button
    this.toggleBtn = new Container();
    this.toggleBtn.x = 0;
    this.toggleBtn.y = 0;

    const btnBg = new Graphics();
    btnBg.roundRect(0, 0, 220, 36, 8).fill(0x374151);
    this.toggleBtn.addChild(btnBg);

    this.toggleLabel = new Text({
      text: "Morning Habits: OFF",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 15,
        fill: "#ffffff",
        fontWeight: "bold",
      }),
    });
    this.toggleLabel.anchor.set(0.5);
    this.toggleLabel.x = 110;
    this.toggleLabel.y = 18;
    this.toggleBtn.addChild(this.toggleLabel);

    this.toggleBtn.eventMode = "static";
    this.toggleBtn.cursor = "pointer";
    this.toggleBtn.hitArea = {
      contains: (px: number, py: number) =>
        px >= 0 && px <= 220 && py >= 0 && py <= 36,
    };
    this.toggleBtn.on("pointerdown", () => this.toggle());
    this.addChild(this.toggleBtn);

    // Chart area
    this.curveGfx = new Graphics();
    this.addChild(this.curveGfx);

    // Stats text
    this.statsText = new Text({ text: "", style: LABEL_STYLE });
    this.statsText.x = this.chartX;
    this.statsText.y = this.chartY + this.chartHeight + 8;
    this.addChild(this.statsText);

    this.drawCurves();
  }

  private toggle(): void {
    this.isOn = !this.isOn;
    this.toggleLabel.text = `Morning Habits: ${this.isOn ? "ON" : "OFF"}`;

    // Update button color
    const bg = this.toggleBtn.getChildAt(0) as Graphics;
    bg.clear();
    bg.roundRect(0, 0, 220, 36, 8).fill(this.isOn ? 0x22c55e : 0x374151);

    this.drawCurves();
  }

  private drawCurves(): void {
    const g = this.curveGfx;
    g.clear();

    const cx = this.chartX;
    const cy = this.chartY;
    const cw = this.chartWidth;
    const ch = this.chartHeight;

    // Draw axes
    g.moveTo(cx, cy).lineTo(cx, cy + ch);
    g.stroke({ width: 1, color: 0x4b5563 });
    g.moveTo(cx, cy + ch).lineTo(cx + cw, cy + ch);
    g.stroke({ width: 1, color: 0x4b5563 });

    // Axis labels
    const timeLabels = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
    for (let i = 0; i < timeLabels.length; i++) {
      const lx = cx + (i / (timeLabels.length - 1)) * cw;
      const label = new Text({ text: timeLabels[i], style: SMALL_STYLE });
      label.anchor.set(0.5, 0);
      label.x = lx;
      label.y = cy + ch + 2;
      // Remove old labels and re-add — we'll just add them fresh
      // (this is called on toggle, but it's cheap)
    }

    const steps = 20;
    const wpToY = (wp: number) => cy + ch - (wp / 100) * ch;

    // OFF curve: starts at 70, decays to ~10
    const offCurve: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      offCurve.push(70 * Math.exp(-1.9 * t)); // 70 → ~10
    }

    // ON curve: starts at 90, decays to ~25
    const onCurve: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      onCurve.push(90 * Math.exp(-1.28 * t)); // 90 → ~25
    }

    // Draw OFF curve
    const offAlpha = this.isOn ? 0.3 : 1.0;
    g.moveTo(cx, wpToY(offCurve[0]));
    for (let i = 1; i <= steps; i++) {
      g.lineTo(cx + (i / steps) * cw, wpToY(offCurve[i]));
    }
    g.stroke({ width: 3, color: 0xf97316, alpha: offAlpha });

    // Draw ON curve
    const onAlpha = this.isOn ? 1.0 : 0.3;
    g.moveTo(cx, wpToY(onCurve[0]));
    for (let i = 1; i <= steps; i++) {
      g.lineTo(cx + (i / steps) * cw, wpToY(onCurve[i]));
    }
    g.stroke({ width: 3, color: 0x22c55e, alpha: onAlpha });

    // Legend dots
    g.circle(cx + cw - 100, cy + 6, 5).fill({ color: 0xf97316, alpha: offAlpha });
    g.circle(cx + cw - 100, cy + 22, 5).fill({ color: 0x22c55e, alpha: onAlpha });

    // Update stats
    const offEnd = Math.round(offCurve[steps]);
    const onEnd = Math.round(onCurve[steps]);
    this.statsText.text = `Peak: 70 vs 90  •  Evening: ${offEnd} vs ${onEnd}`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Lever 2: Schedule Comparison
// ═══════════════════════════════════════════════════════════════════

export interface ScheduleComparisonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ScheduleComparison extends Container {
  private leftCharacter: Character;
  private rightCharacter: Character;
  private leftBubble: Text;
  private rightBubble: Text;
  private leftOutcome: Text;
  private rightOutcome: Text;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private _isDestroyed = false;

  constructor(options: ScheduleComparisonOptions) {
    super();
    this.x = options.x;
    this.y = options.y;

    const halfW = options.width / 2;

    // Section labels
    const leftLabel = new Text({
      text: "No Schedule",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 16,
        fill: "#f97316",
        fontWeight: "bold",
      }),
    });
    leftLabel.anchor.set(0.5, 0);
    leftLabel.x = halfW / 2;
    leftLabel.y = 0;
    this.addChild(leftLabel);

    const rightLabel = new Text({
      text: "Scheduled",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 16,
        fill: "#22c55e",
        fontWeight: "bold",
      }),
    });
    rightLabel.anchor.set(0.5, 0);
    rightLabel.x = halfW + halfW / 2;
    rightLabel.y = 0;
    this.addChild(rightLabel);

    // Divider
    const divider = new Graphics();
    divider.moveTo(halfW, 0).lineTo(halfW, options.height);
    divider.stroke({ width: 1, color: 0x374151 });
    this.addChild(divider);

    // Characters
    this.leftCharacter = new Character();
    this.leftCharacter.setPosition(halfW / 2, options.height * 0.5);
    this.leftCharacter.setExpression("neutral");
    this.addChild(this.leftCharacter.container);

    this.rightCharacter = new Character();
    this.rightCharacter.setPosition(halfW + halfW / 2, options.height * 0.5);
    this.rightCharacter.setExpression("neutral");
    this.addChild(this.rightCharacter.container);

    // Thought bubbles
    this.leftBubble = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 13,
        fill: "#fbbf24",
        fontStyle: "italic",
        wordWrap: true,
        wordWrapWidth: halfW - 40,
        align: "center",
      }),
    });
    this.leftBubble.anchor.set(0.5, 1);
    this.leftBubble.x = halfW / 2;
    this.leftBubble.y = options.height * 0.5 - 50;
    this.addChild(this.leftBubble);

    this.rightBubble = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 13,
        fill: "#4ade80",
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: halfW - 40,
        align: "center",
      }),
    });
    this.rightBubble.anchor.set(0.5, 1);
    this.rightBubble.x = halfW + halfW / 2;
    this.rightBubble.y = options.height * 0.5 - 50;
    this.addChild(this.rightBubble);

    // Outcome text (shown later)
    this.leftOutcome = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 14,
        fill: "#ef4444",
        fontWeight: "bold",
      }),
    });
    this.leftOutcome.anchor.set(0.5, 0);
    this.leftOutcome.x = halfW / 2;
    this.leftOutcome.y = options.height * 0.7;
    this.addChild(this.leftOutcome);

    this.rightOutcome = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 14,
        fill: "#22c55e",
        fontWeight: "bold",
      }),
    });
    this.rightOutcome.anchor.set(0.5, 0);
    this.rightOutcome.x = halfW + halfW / 2;
    this.rightOutcome.y = options.height * 0.7;
    this.addChild(this.rightOutcome);

    this.startAnimation(halfW);
  }

  private async startAnimation(halfW: number): Promise<void> {
    const thoughts = [
      "Should I go to the gym?",
      "Maybe at 3?",
      "After work?",
    ];

    // Left character: cycling indecision
    let cycle = 0;
    this.cycleTimer = setInterval(() => {
      if (this._isDestroyed) return;
      if (cycle < thoughts.length) {
        this.leftBubble.text = thoughts[cycle];
        cycle++;
      } else {
        // After 3 cycles — tired, skipped gym
        if (this.cycleTimer) clearInterval(this.cycleTimer);
        this.leftCharacter.setExpression("tired");
        this.leftBubble.text = "";
        this.leftOutcome.text = "Skipped gym";
      }
    }, 2000);

    // Right character: immediate action
    await this.delay(500);
    if (this._isDestroyed) return;
    this.rightBubble.text = "Gym: 6:30am";

    await this.delay(1500);
    if (this._isDestroyed) return;
    // Walk forward (to the right, as if heading to gym)
    await this.rightCharacter.walkTo(halfW + halfW / 2 + 30, this.rightCharacter.container.y, 800);
    if (this._isDestroyed) return;
    this.rightCharacter.setExpression("energized");
    this.rightBubble.text = "";
    this.rightOutcome.text = "At the gym!";
  }

  override destroy(): void {
    this._isDestroyed = true;
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    super.destroy({ children: true });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════
// Lever 3: Peer Gravity
// ═══════════════════════════════════════════════════════════════════

export interface PeerGravityOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PeerGravity extends Container {
  private centralCharacter: Character;
  private peerCircles: Graphics[] = [];
  private peerValues: number[] = [];
  private peerTexts: Text[] = [];
  private arrowGfx: Graphics;
  private slider: Container;
  private sliderValue = 55;
  private sliderKnob: Graphics;
  private sliderLabel: Text;
  private activityLabel: Text;
  private centerX: number;
  private centerY: number;

  constructor(options: PeerGravityOptions) {
    super();
    this.x = options.x;
    this.y = options.y;

    this.centerX = options.width / 2;
    this.centerY = options.height * 0.4;

    // Central character
    this.centralCharacter = new Character();
    this.centralCharacter.setPosition(this.centerX, this.centerY);
    this.centralCharacter.setExpression("neutral");
    this.addChild(this.centralCharacter.container);

    // Arrow graphics (drawn under peers)
    this.arrowGfx = new Graphics();
    this.addChild(this.arrowGfx);

    // 5 peers in a ring
    const peerRadius = Math.min(options.width, options.height) * 0.3;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = this.centerX + Math.cos(angle) * peerRadius;
      const py = this.centerY + Math.sin(angle) * peerRadius;

      const circle = new Graphics();
      circle.circle(0, 0, 18).fill(0x6b7280);
      circle.x = px;
      circle.y = py;
      this.addChild(circle);
      this.peerCircles.push(circle);

      const value = 30 + i * 12; // initial spread: 30,42,54,66,78
      this.peerValues.push(value);

      const valueText = new Text({
        text: `${value}`,
        style: new TextStyle({
          fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
          fontSize: 12,
          fill: "#ffffff",
          fontWeight: "bold",
        }),
      });
      valueText.anchor.set(0.5);
      valueText.x = px;
      valueText.y = py;
      this.addChild(valueText);
      this.peerTexts.push(valueText);
    }

    // Activity label
    this.activityLabel = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 13,
        fill: "#9ca3af",
        fontStyle: "italic",
      }),
    });
    this.activityLabel.anchor.set(0.5, 0);
    this.activityLabel.x = this.centerX;
    this.activityLabel.y = this.centerY + 40;
    this.addChild(this.activityLabel);

    // Slider
    this.slider = new Container();
    const sliderY = options.height - 40;
    this.slider.y = sliderY;

    const sliderTrackWidth = options.width - 80;
    const sliderTrackX = 40;

    // Track
    const track = new Graphics();
    track
      .roundRect(sliderTrackX, 0, sliderTrackWidth, 8, 4)
      .fill(0x374151);
    this.slider.addChild(track);

    // Knob
    this.sliderKnob = new Graphics();
    this.sliderKnob.circle(0, 4, 12).fill(0x3b82f6);
    const initialKnobX =
      sliderTrackX +
      ((this.sliderValue - 20) / 60) * sliderTrackWidth;
    this.sliderKnob.x = initialKnobX;
    this.slider.addChild(this.sliderKnob);

    // Slider label
    this.sliderLabel = new Text({
      text: `Peer Average Willpower: ${this.sliderValue}`,
      style: new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: 13,
        fill: "#e0e0e0",
      }),
    });
    this.sliderLabel.anchor.set(0.5, 1);
    this.sliderLabel.x = options.width / 2;
    this.sliderLabel.y = -6;
    this.slider.addChild(this.sliderLabel);

    // Slider interaction
    this.sliderKnob.eventMode = "static";
    this.sliderKnob.cursor = "ew-resize";
    let dragging = false;

    this.sliderKnob.on("pointerdown", () => {
      dragging = true;
    });

    this.sliderKnob.on("globalpointermove", (e: FederatedPointerEvent) => {
      if (!dragging) return;
      const local = this.slider.toLocal(e.global);
      const clamped = Math.max(
        sliderTrackX,
        Math.min(local.x, sliderTrackX + sliderTrackWidth),
      );
      this.sliderKnob.x = clamped;
      this.sliderValue = Math.round(
        20 + ((clamped - sliderTrackX) / sliderTrackWidth) * 60,
      );
      this.updateFromSlider();
    });

    this.sliderKnob.on("pointerup", () => {
      dragging = false;
    });
    this.sliderKnob.on("pointerupoutside", () => {
      dragging = false;
    });

    this.addChild(this.slider);
    this.updateFromSlider();
  }

  private updateFromSlider(): void {
    this.sliderLabel.text = `Peer Average Willpower: ${this.sliderValue}`;

    // Spread peer values around the slider value
    const spread = [-12, -5, 0, 5, 12];
    for (let i = 0; i < 5; i++) {
      const v = Math.max(
        20,
        Math.min(80, this.sliderValue + spread[i]),
      );
      this.peerValues[i] = v;
      this.peerTexts[i].text = `${v}`;
    }

    // Update character expression based on peer average
    if (this.sliderValue >= 60) {
      this.centralCharacter.setExpression("happy");
      this.activityLabel.text = "Deep Work, Exercise, Family time";
      this.activityLabel.style.fill = "#4ade80";
    } else if (this.sliderValue >= 40) {
      this.centralCharacter.setExpression("neutral");
      this.activityLabel.text = "Work, some exercise, mixed habits";
      this.activityLabel.style.fill = "#9ca3af";
    } else {
      this.centralCharacter.setExpression("tired");
      this.activityLabel.text = "TikTok, snacking, avoiding tasks";
      this.activityLabel.style.fill = "#ef4444";
    }

    // Draw arrows from peers to center
    this.drawArrows();
  }

  private drawArrows(): void {
    this.arrowGfx.clear();

    for (let i = 0; i < this.peerCircles.length; i++) {
      const peer = this.peerCircles[i];
      const dx = this.centerX - peer.x;
      const dy = this.centerY - peer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      const nx = dx / dist;
      const ny = dy / dist;

      // Arrow starts 20px from peer, ends 35px from center
      const sx = peer.x + nx * 22;
      const sy = peer.y + ny * 22;
      const ex = this.centerX - nx * 35;
      const ey = this.centerY - ny * 35;

      // Color based on whether peer is pulling up or down
      const color = this.peerValues[i] >= 50 ? 0x4ade80 : 0xef4444;
      const alpha = 0.5;

      this.arrowGfx.moveTo(sx, sy).lineTo(ex, ey);
      this.arrowGfx.stroke({ width: 2, color, alpha });

      // Arrowhead
      const headLen = 8;
      const angle = Math.atan2(ey - sy, ex - sx);
      this.arrowGfx.moveTo(ex, ey);
      this.arrowGfx.lineTo(
        ex - headLen * Math.cos(angle - 0.4),
        ey - headLen * Math.sin(angle - 0.4),
      );
      this.arrowGfx.stroke({ width: 2, color, alpha });
      this.arrowGfx.moveTo(ex, ey);
      this.arrowGfx.lineTo(
        ex - headLen * Math.cos(angle + 0.4),
        ey - headLen * Math.sin(angle + 0.4),
      );
      this.arrowGfx.stroke({ width: 2, color, alpha });
    }
  }
}
