import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";

export interface StoppingCurve {
  label: string;
  color: string;
  getStoppingEnergy(timeMinutes: number): number;
}

export interface TimelineScrubberOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  curves: StoppingCurve[];
  maxTimeMinutes: number;
}

const PANEL_PADDING = 20;
const PANEL_GAP = 24;
const SCRUBBER_HEIGHT = 40;
const GRAPH_TOP = 40;
const HANDLE_RADIUS = 10;

export class TimelineScrubber extends Container {
  private options: TimelineScrubberOptions;
  private panelWidth: number;
  private graphHeight: number;
  private nowLines: Graphics[] = [];
  private valueLabels: Text[] = [];
  private scrubberHandle: Graphics;
  private currentTime = 0;
  private interacted = false;
  private onInteractCallback: (() => void) | null = null;

  constructor(options: TimelineScrubberOptions) {
    super();

    this.options = options;
    this.x = options.x;
    this.y = options.y;

    // Calculate panel dimensions
    const numPanels = options.curves.length;
    this.panelWidth = (options.width - PANEL_GAP * (numPanels - 1)) / numPanels;
    this.graphHeight = options.height - SCRUBBER_HEIGHT - GRAPH_TOP - 20;

    // Draw panels
    options.curves.forEach((curve, i) => {
      this.drawPanel(curve, i);
    });

    // Draw scrubber
    this.scrubberHandle = new Graphics();
    this.drawScrubber();

    // Initial position
    this.updateNowLine(0);
  }

  /** Set a callback for when the user first interacts with the scrubber */
  set onInteract(cb: (() => void) | null) {
    this.onInteractCallback = cb;
  }

  private drawPanel(curve: StoppingCurve, index: number): void {
    const panelX = index * (this.panelWidth + PANEL_GAP);

    // Panel background
    const bg = new Graphics();
    bg.roundRect(panelX, 0, this.panelWidth, this.options.height - SCRUBBER_HEIGHT - 10, 8).fill(0x1f2937);
    bg.alpha = 0.8;
    this.addChild(bg);

    // Panel title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 16,
      fill: curve.color,
      fontWeight: "bold",
    });
    const title = new Text({ text: curve.label, style: titleStyle });
    title.x = panelX + this.panelWidth / 2;
    title.y = 10;
    title.anchor.set(0.5, 0);
    this.addChild(title);

    // Draw axes
    const axisGraphics = new Graphics();
    const graphLeft = panelX + PANEL_PADDING;
    const graphRight = panelX + this.panelWidth - PANEL_PADDING;
    const graphBottom = GRAPH_TOP + this.graphHeight;
    const graphWidth = graphRight - graphLeft;

    // Y-axis
    axisGraphics.moveTo(graphLeft, GRAPH_TOP).lineTo(graphLeft, graphBottom);
    axisGraphics.stroke({ width: 1, color: 0x4b5563 });

    // X-axis
    axisGraphics.moveTo(graphLeft, graphBottom).lineTo(graphRight, graphBottom);
    axisGraphics.stroke({ width: 1, color: 0x4b5563 });

    // Y-axis labels
    const yLabelStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 10,
      fill: "#6b7280",
    });
    for (let v = 0; v <= 50; v += 10) {
      const yPos = graphBottom - (v / 50) * this.graphHeight;
      const label = new Text({ text: String(v), style: yLabelStyle });
      label.anchor.set(1, 0.5);
      label.x = graphLeft - 4;
      label.y = yPos;
      this.addChild(label);
    }

    this.addChild(axisGraphics);

    // Draw the curve as a line graph
    const curveGraphics = new Graphics();
    const steps = 100;
    const maxTime = this.options.maxTimeMinutes;

    curveGraphics.moveTo(graphLeft, graphBottom - (curve.getStoppingEnergy(0) / 50) * this.graphHeight);

    for (let s = 1; s <= steps; s++) {
      const t = (s / steps) * maxTime;
      const energy = curve.getStoppingEnergy(t);
      const cx = graphLeft + (s / steps) * graphWidth;
      const cy = graphBottom - (Math.max(0, Math.min(50, energy)) / 50) * this.graphHeight;
      curveGraphics.lineTo(cx, cy);
    }

    curveGraphics.stroke({ width: 2.5, color: curve.color });
    this.addChild(curveGraphics);

    // "Now" vertical indicator line
    const nowLine = new Graphics();
    this.addChild(nowLine);
    this.nowLines.push(nowLine);

    // Value label (current stopping energy at cursor position)
    const valueLabelStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 14,
      fill: "#e0e0e0",
      fontWeight: "bold",
    });
    const valueLabel = new Text({ text: "", style: valueLabelStyle });
    valueLabel.anchor.set(0.5, 1);
    valueLabel.x = panelX + this.panelWidth / 2;
    valueLabel.y = GRAPH_TOP - 2;
    this.addChild(valueLabel);
    this.valueLabels.push(valueLabel);
  }

  private drawScrubber(): void {
    const scrubberY = this.options.height - SCRUBBER_HEIGHT;
    const trackWidth = this.options.width;

    // Scrubber track
    const track = new Graphics();
    track.roundRect(0, scrubberY + SCRUBBER_HEIGHT / 2 - 3, trackWidth, 6, 3).fill(0x374151);
    this.addChild(track);

    // Time labels
    const timeLabelStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 11,
      fill: "#6b7280",
    });

    const maxTime = this.options.maxTimeMinutes;
    const timeSteps = [0, 30, 60, 90, 120, 150];
    for (const t of timeSteps) {
      if (t > maxTime) break;
      const xPos = (t / maxTime) * trackWidth;
      const label = new Text({ text: `${t}m`, style: timeLabelStyle });
      label.anchor.set(0.5, 0);
      label.x = xPos;
      label.y = scrubberY + SCRUBBER_HEIGHT / 2 + 8;
      this.addChild(label);
    }

    // Draggable handle
    this.scrubberHandle.circle(0, 0, HANDLE_RADIUS).fill(0x3b82f6);
    this.scrubberHandle.x = 0;
    this.scrubberHandle.y = scrubberY + SCRUBBER_HEIGHT / 2;
    this.scrubberHandle.eventMode = "static";
    this.scrubberHandle.cursor = "ew-resize";
    this.addChild(this.scrubberHandle);

    // Hit area for easier dragging
    const hitArea = new Graphics();
    hitArea.rect(0, scrubberY, trackWidth, SCRUBBER_HEIGHT).fill({ color: 0x000000, alpha: 0.01 });
    hitArea.eventMode = "static";
    hitArea.cursor = "ew-resize";
    this.addChild(hitArea);

    let dragging = false;

    const startDrag = () => {
      dragging = true;
    };

    const onMove = (e: FederatedPointerEvent) => {
      if (!dragging) return;
      const local = this.toLocal(e.global);
      const clamped = Math.max(0, Math.min(local.x, trackWidth));
      const time = (clamped / trackWidth) * this.options.maxTimeMinutes;
      this.currentTime = time;
      this.scrubberHandle.x = clamped;
      this.updateNowLine(time);

      if (!this.interacted) {
        this.interacted = true;
        if (this.onInteractCallback) {
          this.onInteractCallback();
        }
      }
    };

    const endDrag = () => {
      dragging = false;
    };

    this.scrubberHandle.on("pointerdown", startDrag);
    hitArea.on("pointerdown", (e: FederatedPointerEvent) => {
      startDrag();
      onMove(e);
    });

    this.scrubberHandle.on("globalpointermove", onMove);
    hitArea.on("globalpointermove", onMove);

    this.scrubberHandle.on("pointerup", endDrag);
    this.scrubberHandle.on("pointerupoutside", endDrag);
    hitArea.on("pointerup", endDrag);
    hitArea.on("pointerupoutside", endDrag);
  }

  private updateNowLine(timeMinutes: number): void {
    const { curves, maxTimeMinutes } = this.options;

    curves.forEach((curve, i) => {
      const panelX = i * (this.panelWidth + PANEL_GAP);
      const graphLeft = panelX + PANEL_PADDING;
      const graphRight = panelX + this.panelWidth - PANEL_PADDING;
      const graphWidth = graphRight - graphLeft;
      const graphBottom = GRAPH_TOP + this.graphHeight;

      const nowLine = this.nowLines[i];
      nowLine.clear();

      const xFraction = timeMinutes / maxTimeMinutes;
      const lineX = graphLeft + xFraction * graphWidth;

      // Vertical line
      nowLine.moveTo(lineX, GRAPH_TOP).lineTo(lineX, graphBottom);
      nowLine.stroke({ width: 1.5, color: 0xfbbf24, alpha: 0.8 });

      // Dot on the curve at current position
      const energy = curve.getStoppingEnergy(timeMinutes);
      const dotY = graphBottom - (Math.max(0, Math.min(50, energy)) / 50) * this.graphHeight;
      nowLine.circle(lineX, dotY, 5).fill(0xfbbf24);

      // Update value label
      this.valueLabels[i].text = `Stopping: ${Math.round(energy)}`;
    });
  }
}
