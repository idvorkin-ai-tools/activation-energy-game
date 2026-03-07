import { Character } from "../characters/Character";

// ═══════════════════════════════════════════════════════════════════
// Lever 1: Morning Habits Toggle
// ═══════════════════════════════════════════════════════════════════

export interface MorningHabitsToggleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MorningHabitsToggle {
  el: HTMLDivElement;
  private isOn = false;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private statsText: HTMLDivElement;
  private toggleBtn: HTMLButtonElement;
  private chartWidth: number;
  private chartHeight: number;
  private chartX = 20;
  private chartY = 50;

  constructor(options: MorningHabitsToggleOptions) {
    this.chartWidth = options.width - 40;
    this.chartHeight = options.height - 80;

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    // Toggle button
    this.toggleBtn = document.createElement("button");
    this.toggleBtn.className = "game-btn";
    this.toggleBtn.textContent = "Morning Habits: OFF";
    this.toggleBtn.style.position = "absolute";
    this.toggleBtn.style.left = "0";
    this.toggleBtn.style.top = "0";
    this.toggleBtn.style.minWidth = "220px";
    this.toggleBtn.style.height = "36px";
    this.toggleBtn.style.fontSize = "15px";
    this.toggleBtn.style.background = "#374151";
    this.toggleBtn.addEventListener("click", () => this.toggle());
    this.el.appendChild(this.toggleBtn);

    // Chart canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.canvas.style.position = "absolute";
    this.canvas.style.pointerEvents = "none";
    this.ctx = this.canvas.getContext("2d")!;
    this.el.appendChild(this.canvas);

    // Stats text
    this.statsText = document.createElement("div");
    this.statsText.style.position = "absolute";
    this.statsText.style.left = `${this.chartX}px`;
    this.statsText.style.top = `${this.chartY + this.chartHeight + 8}px`;
    this.statsText.style.fontSize = "14px";
    this.statsText.style.color = "#e0e0e0";
    this.el.appendChild(this.statsText);

    this.drawCurves();
  }

  private toggle(): void {
    this.isOn = !this.isOn;
    this.toggleBtn.textContent = `Morning Habits: ${this.isOn ? "ON" : "OFF"}`;
    this.toggleBtn.style.background = this.isOn ? "#22c55e" : "#374151";
    this.drawCurves();
  }

  private drawCurves(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.chartX;
    const cy = this.chartY;
    const cw = this.chartWidth;
    const ch = this.chartHeight;

    // Axes
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + ch);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + ch);
    ctx.lineTo(cx + cw, cy + ch);
    ctx.stroke();

    // Time labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    const timeLabels = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
    for (let i = 0; i < timeLabels.length; i++) {
      const lx = cx + (i / (timeLabels.length - 1)) * cw;
      ctx.fillText(timeLabels[i], lx, cy + ch + 14);
    }

    const steps = 20;
    const wpToY = (wp: number) => cy + ch - (wp / 100) * ch;

    // OFF curve
    const offCurve: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      offCurve.push(70 * Math.exp(-1.9 * t));
    }

    // ON curve
    const onCurve: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      onCurve.push(90 * Math.exp(-1.28 * t));
    }

    // Draw OFF curve
    const offAlpha = this.isOn ? 0.3 : 1.0;
    ctx.strokeStyle = `rgba(249, 115, 22, ${offAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, wpToY(offCurve[0]));
    for (let i = 1; i <= steps; i++) {
      ctx.lineTo(cx + (i / steps) * cw, wpToY(offCurve[i]));
    }
    ctx.stroke();

    // Draw ON curve
    const onAlpha = this.isOn ? 1.0 : 0.3;
    ctx.strokeStyle = `rgba(34, 197, 94, ${onAlpha})`;
    ctx.beginPath();
    ctx.moveTo(cx, wpToY(onCurve[0]));
    for (let i = 1; i <= steps; i++) {
      ctx.lineTo(cx + (i / steps) * cw, wpToY(onCurve[i]));
    }
    ctx.stroke();

    // Legend dots
    ctx.globalAlpha = offAlpha;
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(cx + cw - 100, cy + 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = onAlpha;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(cx + cw - 100, cy + 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Update stats
    const offEnd = Math.round(offCurve[steps]);
    const onEnd = Math.round(onCurve[steps]);
    this.statsText.textContent = `Peak: 70 vs 90  •  Evening: ${offEnd} vs ${onEnd}`;
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

export class ScheduleComparison {
  el: HTMLDivElement;
  private leftCharacter: Character;
  private rightCharacter: Character;
  private leftBubble: HTMLDivElement;
  private rightBubble: HTMLDivElement;
  private leftOutcome: HTMLDivElement;
  private rightOutcome: HTMLDivElement;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private _isDestroyed = false;

  constructor(options: ScheduleComparisonOptions) {
    const isNarrow = options.width < 500;
    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    let leftCenterX: number, leftCenterY: number;
    let rightCenterX: number, rightCenterY: number;
    let sectionW: number;

    if (isNarrow) {
      const halfH = options.height / 2;
      sectionW = options.width;
      leftCenterX = options.width / 2;
      leftCenterY = halfH * 0.5;
      rightCenterX = options.width / 2;
      rightCenterY = halfH + halfH * 0.5;
    } else {
      const halfW = options.width / 2;
      sectionW = halfW;
      leftCenterX = halfW / 2;
      leftCenterY = options.height * 0.5;
      rightCenterX = halfW + halfW / 2;
      rightCenterY = options.height * 0.5;
    }

    // Section labels
    const leftLabel = this.makeLabel("No Schedule", "#f97316", leftCenterX, isNarrow ? 0 : 0);
    this.el.appendChild(leftLabel);
    const rightLabel = this.makeLabel("Scheduled", "#22c55e", rightCenterX, isNarrow ? options.height / 2 : 0);
    this.el.appendChild(rightLabel);

    // Divider (canvas line)
    const divCanvas = document.createElement("canvas");
    divCanvas.width = options.width;
    divCanvas.height = options.height;
    divCanvas.style.position = "absolute";
    divCanvas.style.pointerEvents = "none";
    const dCtx = divCanvas.getContext("2d")!;
    dCtx.strokeStyle = "#374151";
    dCtx.lineWidth = 1;
    dCtx.beginPath();
    if (isNarrow) {
      dCtx.moveTo(0, options.height / 2);
      dCtx.lineTo(options.width, options.height / 2);
    } else {
      dCtx.moveTo(options.width / 2, 0);
      dCtx.lineTo(options.width / 2, options.height);
    }
    dCtx.stroke();
    this.el.appendChild(divCanvas);

    // Characters
    this.leftCharacter = new Character();
    this.leftCharacter.setPosition(leftCenterX, leftCenterY);
    this.leftCharacter.setExpression("neutral");
    this.el.appendChild(this.leftCharacter.el);

    this.rightCharacter = new Character();
    this.rightCharacter.setPosition(rightCenterX, rightCenterY);
    this.rightCharacter.setExpression("neutral");
    this.el.appendChild(this.rightCharacter.el);

    // Thought bubbles
    this.leftBubble = this.makeBubble("#fbbf24", "italic", sectionW - 40, leftCenterX, leftCenterY - 50);
    this.el.appendChild(this.leftBubble);

    this.rightBubble = this.makeBubble("#4ade80", "bold", sectionW - 40, rightCenterX, rightCenterY - 50);
    this.el.appendChild(this.rightBubble);

    // Outcome text
    this.leftOutcome = this.makeOutcome("#ef4444", leftCenterX, isNarrow ? leftCenterY + 40 : options.height * 0.7);
    this.el.appendChild(this.leftOutcome);

    this.rightOutcome = this.makeOutcome("#22c55e", rightCenterX, isNarrow ? rightCenterY + 40 : options.height * 0.7);
    this.el.appendChild(this.rightOutcome);

    this.startAnimation(isNarrow ? options.width : options.width / 2);
  }

  private makeLabel(text: string, color: string, x: number, y: number): HTMLDivElement {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translateX(-50%)";
    el.style.fontSize = "16px";
    el.style.fontWeight = "bold";
    el.style.color = color;
    el.textContent = text;
    return el;
  }

  private makeBubble(color: string, fontStyle: string, maxW: number, x: number, y: number): HTMLDivElement {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translateX(-50%)";
    el.style.fontSize = "13px";
    el.style.color = color;
    el.style.fontStyle = fontStyle === "italic" ? "italic" : "normal";
    el.style.fontWeight = fontStyle === "bold" ? "bold" : "normal";
    el.style.maxWidth = `${maxW}px`;
    el.style.textAlign = "center";
    return el;
  }

  private makeOutcome(color: string, x: number, y: number): HTMLDivElement {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translateX(-50%)";
    el.style.fontSize = "14px";
    el.style.fontWeight = "bold";
    el.style.color = color;
    return el;
  }

  private async startAnimation(halfW: number): Promise<void> {
    const thoughts = ["Should I go to the gym?", "Maybe at 3?", "After work?"];

    let cycle = 0;
    this.cycleTimer = setInterval(() => {
      if (this._isDestroyed) return;
      if (cycle < thoughts.length) {
        this.leftBubble.textContent = thoughts[cycle];
        cycle++;
      } else {
        if (this.cycleTimer) clearInterval(this.cycleTimer);
        this.leftCharacter.setExpression("tired");
        this.leftBubble.textContent = "";
        this.leftOutcome.textContent = "Skipped gym";
      }
    }, 2000);

    await this.delay(500);
    if (this._isDestroyed) return;
    this.rightBubble.textContent = "Gym: 6:30am";

    await this.delay(1500);
    if (this._isDestroyed) return;
    await this.rightCharacter.walkTo(halfW / 2 + halfW + 30, this.rightCharacter.getPosition().y, 800);
    if (this._isDestroyed) return;
    this.rightCharacter.setExpression("energized");
    this.rightBubble.textContent = "";
    this.rightOutcome.textContent = "At the gym!";
  }

  destroy(): void {
    this._isDestroyed = true;
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    this.el.remove();
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

export class PeerGravity {
  el: HTMLDivElement;
  private centralCharacter: Character;
  private peerValues: number[] = [];
  private peerTexts: HTMLDivElement[] = [];
  private peerPositions: { x: number; y: number }[] = [];
  private arrowCanvas: HTMLCanvasElement;
  private arrowCtx: CanvasRenderingContext2D;
  private sliderValue = 55;
  private sliderLabel: HTMLDivElement;
  private activityLabel: HTMLDivElement;
  private centerX: number;
  private centerY: number;

  constructor(options: PeerGravityOptions) {
    this.centerX = options.width / 2;
    this.centerY = options.height * 0.4;

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    // Arrow canvas
    this.arrowCanvas = document.createElement("canvas");
    this.arrowCanvas.width = options.width;
    this.arrowCanvas.height = options.height;
    this.arrowCanvas.style.position = "absolute";
    this.arrowCanvas.style.pointerEvents = "none";
    this.arrowCtx = this.arrowCanvas.getContext("2d")!;
    this.el.appendChild(this.arrowCanvas);

    // Central character
    this.centralCharacter = new Character();
    this.centralCharacter.setPosition(this.centerX, this.centerY);
    this.centralCharacter.setExpression("neutral");
    this.el.appendChild(this.centralCharacter.el);

    // 5 peers in a ring
    const peerRadius = Math.min(options.width, options.height) * 0.3;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = this.centerX + Math.cos(angle) * peerRadius;
      const py = this.centerY + Math.sin(angle) * peerRadius;
      this.peerPositions.push({ x: px, y: py });

      const circle = document.createElement("div");
      circle.style.position = "absolute";
      circle.style.left = `${px - 18}px`;
      circle.style.top = `${py - 18}px`;
      circle.style.width = "36px";
      circle.style.height = "36px";
      circle.style.borderRadius = "50%";
      circle.style.background = "#6b7280";
      circle.style.display = "flex";
      circle.style.alignItems = "center";
      circle.style.justifyContent = "center";
      this.el.appendChild(circle);

      const value = 30 + i * 12;
      this.peerValues.push(value);

      const valueText = document.createElement("div");
      valueText.style.color = "#fff";
      valueText.style.fontSize = "12px";
      valueText.style.fontWeight = "bold";
      valueText.textContent = `${value}`;
      circle.appendChild(valueText);
      this.peerTexts.push(valueText);
    }

    // Activity label
    this.activityLabel = document.createElement("div");
    this.activityLabel.style.position = "absolute";
    this.activityLabel.style.left = `${this.centerX}px`;
    this.activityLabel.style.top = `${this.centerY + 40}px`;
    this.activityLabel.style.transform = "translateX(-50%)";
    this.activityLabel.style.fontSize = "13px";
    this.activityLabel.style.fontStyle = "italic";
    this.activityLabel.style.color = "#9ca3af";
    this.el.appendChild(this.activityLabel);

    // Slider
    const sliderY = options.height - 40;

    this.sliderLabel = document.createElement("div");
    this.sliderLabel.style.position = "absolute";
    this.sliderLabel.style.left = "50%";
    this.sliderLabel.style.top = `${sliderY - 20}px`;
    this.sliderLabel.style.transform = "translateX(-50%)";
    this.sliderLabel.style.fontSize = "13px";
    this.sliderLabel.style.color = "#e0e0e0";
    this.el.appendChild(this.sliderLabel);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "20";
    slider.max = "80";
    slider.value = `${this.sliderValue}`;
    slider.style.position = "absolute";
    slider.style.left = "40px";
    slider.style.top = `${sliderY}px`;
    slider.style.width = `${options.width - 80}px`;
    slider.style.accentColor = "#3b82f6";
    slider.addEventListener("input", () => {
      this.sliderValue = Number(slider.value);
      this.updateFromSlider();
    });
    this.el.appendChild(slider);

    this.updateFromSlider();
  }

  private updateFromSlider(): void {
    this.sliderLabel.textContent = `Peer Average Willpower: ${this.sliderValue}`;

    const spread = [-12, -5, 0, 5, 12];
    for (let i = 0; i < 5; i++) {
      const v = Math.max(20, Math.min(80, this.sliderValue + spread[i]));
      this.peerValues[i] = v;
      this.peerTexts[i].textContent = `${v}`;
    }

    if (this.sliderValue >= 60) {
      this.centralCharacter.setExpression("happy");
      this.activityLabel.textContent = "Deep Work, Exercise, Family time";
      this.activityLabel.style.color = "#4ade80";
    } else if (this.sliderValue >= 40) {
      this.centralCharacter.setExpression("neutral");
      this.activityLabel.textContent = "Work, some exercise, mixed habits";
      this.activityLabel.style.color = "#9ca3af";
    } else {
      this.centralCharacter.setExpression("tired");
      this.activityLabel.textContent = "TikTok, snacking, avoiding tasks";
      this.activityLabel.style.color = "#ef4444";
    }

    this.drawArrows();
  }

  private drawArrows(): void {
    const ctx = this.arrowCtx;
    ctx.clearRect(0, 0, this.arrowCanvas.width, this.arrowCanvas.height);

    for (let i = 0; i < this.peerPositions.length; i++) {
      const peer = this.peerPositions[i];
      const dx = this.centerX - peer.x;
      const dy = this.centerY - peer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      const nx = dx / dist;
      const ny = dy / dist;

      const sx = peer.x + nx * 22;
      const sy = peer.y + ny * 22;
      const ex = this.centerX - nx * 35;
      const ey = this.centerY - ny * 35;

      const color = this.peerValues[i] >= 50 ? "rgba(74, 222, 128, 0.5)" : "rgba(239, 68, 68, 0.5)";

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrowhead
      const headLen = 8;
      const angle = Math.atan2(ey - sy, ex - sx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
      ctx.stroke();
    }
  }
}
