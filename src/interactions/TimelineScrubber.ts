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

export class TimelineScrubber {
  el: HTMLDivElement;
  onInteract: (() => void) | null = null;

  private options: TimelineScrubberOptions;
  private panelCanvases: HTMLCanvasElement[] = [];
  private panelContexts: CanvasRenderingContext2D[] = [];
  private panelWidthCalc: number;
  private panelHeightCalc: number;
  private graphHeight: number;
  private isNarrow: boolean;
  private handleEl: HTMLDivElement;
  private currentTime = 0;
  private interacted = false;

  constructor(options: TimelineScrubberOptions) {
    this.options = options;
    this.isNarrow = options.width < 600;

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = `${options.height}px`;

    const numPanels = options.curves.length;

    if (this.isNarrow) {
      this.panelWidthCalc = options.width;
      const availableHeight = options.height - SCRUBBER_HEIGHT - 20;
      this.panelHeightCalc = (availableHeight - PANEL_GAP) / numPanels;
      this.graphHeight = this.panelHeightCalc - GRAPH_TOP - 10;
    } else {
      this.panelWidthCalc = (options.width - PANEL_GAP * (numPanels - 1)) / numPanels;
      this.panelHeightCalc = options.height - SCRUBBER_HEIGHT - 10;
      this.graphHeight = options.height - SCRUBBER_HEIGHT - GRAPH_TOP - 20;
    }

    // Draw panels
    options.curves.forEach((curve, i) => {
      this.createPanel(curve, i);
    });

    // Scrubber
    this.handleEl = document.createElement("div");
    this.createScrubber();
    this.updateNowLine(0);
  }

  private createPanel(curve: StoppingCurve, index: number): void {
    let panelX: number, panelY: number;
    if (this.isNarrow) {
      panelX = 0;
      panelY = index * (this.panelHeightCalc + PANEL_GAP);
    } else {
      panelX = index * (this.panelWidthCalc + PANEL_GAP);
      panelY = 0;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.panelWidthCalc;
    canvas.height = this.panelHeightCalc;
    canvas.style.position = "absolute";
    canvas.style.left = `${panelX}px`;
    canvas.style.top = `${panelY}px`;
    canvas.style.pointerEvents = "none";
    this.el.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    this.panelCanvases.push(canvas);
    this.panelContexts.push(ctx);

    // Panel background
    ctx.fillStyle = "rgba(31, 41, 55, 0.8)";
    this.roundRect(ctx, 0, 0, this.panelWidthCalc, this.panelHeightCalc, 8);
    ctx.fill();

    // Title
    ctx.fillStyle = curve.color;
    ctx.font = "bold 16px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(curve.label, this.panelWidthCalc / 2, 24);

    // Axes
    const graphLeft = PANEL_PADDING;
    const graphRight = this.panelWidthCalc - PANEL_PADDING;
    const graphTop = GRAPH_TOP;
    const graphBottom = graphTop + this.graphHeight;
    const graphWidth = graphRight - graphLeft;

    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(graphLeft, graphTop);
    ctx.lineTo(graphLeft, graphBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(graphLeft, graphBottom);
    ctx.lineTo(graphRight, graphBottom);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px Arial, Helvetica, sans-serif";
    ctx.textAlign = "right";
    for (let v = 0; v <= 50; v += 10) {
      const yPos = graphBottom - (v / 50) * this.graphHeight;
      ctx.fillText(String(v), graphLeft - 4, yPos + 3);
    }

    // Curve
    const steps = 100;
    const maxTime = this.options.maxTimeMinutes;
    ctx.strokeStyle = curve.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(graphLeft, graphBottom - (curve.getStoppingEnergy(0) / 50) * this.graphHeight);
    for (let s = 1; s <= steps; s++) {
      const t = (s / steps) * maxTime;
      const energy = curve.getStoppingEnergy(t);
      const cx = graphLeft + (s / steps) * graphWidth;
      const cy = graphBottom - (Math.max(0, Math.min(50, energy)) / 50) * this.graphHeight;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  private createScrubber(): void {
    const scrubberY = this.options.height - SCRUBBER_HEIGHT;
    const trackWidth = this.options.width;

    // Track
    const track = document.createElement("div");
    track.style.position = "absolute";
    track.style.left = "0";
    track.style.top = `${scrubberY + SCRUBBER_HEIGHT / 2 - 3}px`;
    track.style.width = `${trackWidth}px`;
    track.style.height = "6px";
    track.style.borderRadius = "3px";
    track.style.background = "#374151";
    this.el.appendChild(track);

    // Time labels
    const timeSteps = [0, 30, 60, 90, 120, 150];
    for (const t of timeSteps) {
      if (t > this.options.maxTimeMinutes) break;
      const xPos = (t / this.options.maxTimeMinutes) * trackWidth;
      const label = document.createElement("span");
      label.style.position = "absolute";
      label.style.left = `${xPos}px`;
      label.style.top = `${scrubberY + SCRUBBER_HEIGHT / 2 + 8}px`;
      label.style.transform = "translateX(-50%)";
      label.style.color = "#6b7280";
      label.style.fontSize = "11px";
      label.textContent = `${t}m`;
      this.el.appendChild(label);
    }

    // Handle
    this.handleEl.style.position = "absolute";
    this.handleEl.style.width = `${HANDLE_RADIUS * 2}px`;
    this.handleEl.style.height = `${HANDLE_RADIUS * 2}px`;
    this.handleEl.style.borderRadius = "50%";
    this.handleEl.style.background = "#3b82f6";
    this.handleEl.style.left = `${-HANDLE_RADIUS}px`;
    this.handleEl.style.top = `${scrubberY + SCRUBBER_HEIGHT / 2 - HANDLE_RADIUS}px`;
    this.handleEl.style.cursor = "ew-resize";
    this.handleEl.style.zIndex = "5";
    this.el.appendChild(this.handleEl);

    // Invisible hit area for easier dragging
    const hitArea = document.createElement("div");
    hitArea.style.position = "absolute";
    hitArea.style.left = "0";
    hitArea.style.top = `${scrubberY}px`;
    hitArea.style.width = `${trackWidth}px`;
    hitArea.style.height = `${SCRUBBER_HEIGHT}px`;
    hitArea.style.cursor = "ew-resize";
    this.el.appendChild(hitArea);

    let dragging = false;

    const onStart = (e: PointerEvent) => {
      dragging = true;
      this.handleEl.setPointerCapture(e.pointerId);
      onMove(e);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const rect = this.el.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const clamped = Math.max(0, Math.min(localX, trackWidth));
      const time = (clamped / trackWidth) * this.options.maxTimeMinutes;
      this.currentTime = time;
      this.handleEl.style.left = `${clamped - HANDLE_RADIUS}px`;
      this.updateNowLine(time);

      if (!this.interacted) {
        this.interacted = true;
        if (this.onInteract) this.onInteract();
      }
    };

    const onEnd = () => { dragging = false; };

    this.handleEl.addEventListener("pointerdown", onStart);
    hitArea.addEventListener("pointerdown", (e) => {
      dragging = true;
      onMove(e);
    });
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onEnd);
  }

  private updateNowLine(timeMinutes: number): void {
    const { curves, maxTimeMinutes } = this.options;

    curves.forEach((curve, i) => {
      const ctx = this.panelContexts[i];
      const canvas = this.panelCanvases[i];

      // Save and redraw the base panel (clear overlay area only)
      // For simplicity, we create an overlay canvas per panel
      // But simpler: draw on a separate overlay canvas
      // Actually let's just re-render the panels with indicator

      // Clear and redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Panel background
      ctx.fillStyle = "rgba(31, 41, 55, 0.8)";
      this.roundRect(ctx, 0, 0, this.panelWidthCalc, this.panelHeightCalc, 8);
      ctx.fill();

      // Title
      ctx.fillStyle = curve.color;
      ctx.font = "bold 16px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(curve.label, this.panelWidthCalc / 2, 24);

      // Axes
      const graphLeft = PANEL_PADDING;
      const graphRight = this.panelWidthCalc - PANEL_PADDING;
      const graphTop = GRAPH_TOP;
      const graphBottom = graphTop + this.graphHeight;
      const graphWidth = graphRight - graphLeft;

      ctx.strokeStyle = "#4b5563";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(graphLeft, graphTop);
      ctx.lineTo(graphLeft, graphBottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(graphLeft, graphBottom);
      ctx.lineTo(graphRight, graphBottom);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px Arial, Helvetica, sans-serif";
      ctx.textAlign = "right";
      for (let v = 0; v <= 50; v += 10) {
        const yPos = graphBottom - (v / 50) * this.graphHeight;
        ctx.fillText(String(v), graphLeft - 4, yPos + 3);
      }

      // Curve
      const steps = 100;
      const maxTime = maxTimeMinutes;
      ctx.strokeStyle = curve.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(graphLeft, graphBottom - (curve.getStoppingEnergy(0) / 50) * this.graphHeight);
      for (let s = 1; s <= steps; s++) {
        const t = (s / steps) * maxTime;
        const energy = curve.getStoppingEnergy(t);
        const cx = graphLeft + (s / steps) * graphWidth;
        const cy = graphBottom - (Math.max(0, Math.min(50, energy)) / 50) * this.graphHeight;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // Now line
      const xFraction = timeMinutes / maxTimeMinutes;
      const lineX = graphLeft + xFraction * graphWidth;

      ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lineX, graphTop);
      ctx.lineTo(lineX, graphBottom);
      ctx.stroke();

      // Dot on curve
      const energy = curve.getStoppingEnergy(timeMinutes);
      const dotY = graphBottom - (Math.max(0, Math.min(50, energy)) / 50) * this.graphHeight;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(lineX, dotY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Value label
      ctx.fillStyle = "#e0e0e0";
      ctx.font = "bold 14px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Stopping: ${Math.round(energy)}`, this.panelWidthCalc / 2, graphTop - 6);
    });
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
