import { Tween, Group } from "@tweenjs/tween.js";
import { hexToCSS } from "../utils/dom";

export interface DragCard {
  id: string;
  label: string;
  icon: string;
  correctValue: number;
}

export interface DragToNumberLineOptions {
  x: number;
  y: number;
  width: number;
  minValue: number;
  maxValue: number;
  cards: DragCard[];
  onAllPlaced: (placements: Map<string, number>) => void;
}

const CARD_WIDTH = 120;
const CARD_HEIGHT = 50;
const LINE_Y = 80;
const CARD_COLORS = [0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0xeab308];

export class DragToNumberLine {
  el: HTMLDivElement;
  private placedCards: Map<string, number> = new Map();
  private cardEls: Map<string, HTMLDivElement> = new Map();
  private tweenGroup: Group;
  private options: DragToNumberLineOptions;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(options: DragToNumberLineOptions) {
    this.options = options;
    this.tweenGroup = new Group();

    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.left = `${options.x}px`;
    this.el.style.top = `${options.y}px`;
    this.el.style.width = `${options.width}px`;
    this.el.style.height = "300px";

    // Canvas for the number line
    this.canvas = document.createElement("canvas");
    this.canvas.width = options.width;
    this.canvas.height = 300;
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.style.pointerEvents = "none";
    this.ctx = this.canvas.getContext("2d")!;
    this.el.appendChild(this.canvas);

    this.drawNumberLine();
    this.createCards();

    // Drive tween animations
    const animate = () => {
      this.tweenGroup.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private drawNumberLine(): void {
    const ctx = this.ctx;
    const { width, minValue, maxValue } = this.options;

    // Main horizontal line
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, LINE_Y);
    ctx.lineTo(width, LINE_Y);
    ctx.stroke();

    // Tick marks and labels
    const range = maxValue - minValue;
    const step = range <= 100 ? 10 : 20;

    ctx.font = "12px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";

    for (let val = minValue; val <= maxValue; val += step) {
      const xPos = this.valueToX(val);

      const tickHeight = val === 0 ? 12 : 6;
      ctx.strokeStyle = val === 0 ? "#e0e0e0" : "#6b7280";
      ctx.lineWidth = val === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(xPos, LINE_Y - tickHeight);
      ctx.lineTo(xPos, LINE_Y + tickHeight);
      ctx.stroke();

      if (val % (step * 2) === 0 || step >= 20 || val === 0) {
        ctx.fillStyle = "#9ca3af";
        ctx.fillText(String(val), xPos, LINE_Y + 26);
      }
    }
  }

  private valueToX(value: number): number {
    const { width, minValue, maxValue } = this.options;
    return ((value - minValue) / (maxValue - minValue)) * width;
  }

  private xToValue(x: number): number {
    const { width, minValue, maxValue } = this.options;
    const clamped = Math.max(0, Math.min(x, width));
    return minValue + (clamped / width) * (maxValue - minValue);
  }

  private createCards(): void {
    const { cards } = this.options;
    const isNarrow = this.options.width < 600;
    const cardW = isNarrow ? 100 : CARD_WIDTH;
    const gap = isNarrow ? 8 : 12;
    const spacing = cardW + gap;

    const topRowCount = isNarrow ? 3 : cards.length;
    const startY = LINE_Y - CARD_HEIGHT - (isNarrow ? 100 : 50);

    cards.forEach((card, index) => {
      const cardEl = document.createElement("div");
      cardEl.style.position = "absolute";
      cardEl.style.width = `${cardW}px`;
      cardEl.style.height = `${CARD_HEIGHT}px`;
      cardEl.style.borderRadius = "10px";
      cardEl.style.background = hexToCSS(CARD_COLORS[index % CARD_COLORS.length]);
      cardEl.style.opacity = "0.9";
      cardEl.style.display = "flex";
      cardEl.style.alignItems = "center";
      cardEl.style.justifyContent = "center";
      cardEl.style.textAlign = "center";
      cardEl.style.color = "#fff";
      cardEl.style.fontWeight = "bold";
      cardEl.style.fontSize = isNarrow ? "11px" : "13px";
      cardEl.style.cursor = "grab";
      cardEl.style.userSelect = "none";
      cardEl.style.padding = "4px";
      cardEl.style.lineHeight = "1.2";
      cardEl.textContent = card.label;

      // Position stacked above the line
      let initX: number, initY: number;
      if (isNarrow) {
        const row = index < topRowCount ? 0 : 1;
        const colIndex = row === 0 ? index : index - topRowCount;
        const colCount = row === 0 ? topRowCount : cards.length - topRowCount;
        const rowTotalWidth = colCount * spacing - gap;
        const rowStartX = (this.options.width - rowTotalWidth) / 2;
        initX = rowStartX + colIndex * spacing;
        initY = startY + row * (CARD_HEIGHT + gap);
      } else {
        const totalWidth = cards.length * spacing - gap;
        const rowStartX = (this.options.width - totalWidth) / 2;
        initX = rowStartX + index * spacing;
        initY = startY;
      }

      cardEl.style.left = `${initX}px`;
      cardEl.style.top = `${initY}px`;

      // Drag logic
      let dragging = false;
      let offsetX = 0, offsetY = 0;

      const onPointerDown = (e: PointerEvent) => {
        dragging = true;
        cardEl.style.cursor = "grabbing";
        cardEl.style.zIndex = "10";
        const rect = this.el.getBoundingClientRect();
        offsetX = e.clientX - rect.left - parseFloat(cardEl.style.left);
        offsetY = e.clientY - rect.top - parseFloat(cardEl.style.top);
        cardEl.setPointerCapture(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        const rect = this.el.getBoundingClientRect();
        cardEl.style.left = `${e.clientX - rect.left - offsetX}px`;
        cardEl.style.top = `${e.clientY - rect.top - offsetY}px`;
      };

      const onPointerUp = () => {
        if (!dragging) return;
        dragging = false;
        cardEl.style.cursor = "grab";
        cardEl.style.zIndex = "";

        const centerX = parseFloat(cardEl.style.left) + cardW / 2;
        const snappedValue = Math.round(this.xToValue(centerX));
        const snappedX = this.valueToX(snappedValue) - cardW / 2;

        cardEl.style.left = `${snappedX}px`;
        cardEl.style.top = `${LINE_Y - CARD_HEIGHT - 4}px`;

        this.placedCards.set(card.id, snappedValue);

        if (this.placedCards.size === this.options.cards.length) {
          this.options.onAllPlaced(new Map(this.placedCards));
        }
      };

      cardEl.addEventListener("pointerdown", onPointerDown);
      cardEl.addEventListener("pointermove", onPointerMove);
      cardEl.addEventListener("pointerup", onPointerUp);
      cardEl.addEventListener("pointercancel", onPointerUp);

      this.el.appendChild(cardEl);
      this.cardEls.set(card.id, cardEl);
    });
  }

  async reveal(): Promise<void> {
    const { cards } = this.options;
    const isNarrow = this.options.width < 600;
    const cardW = isNarrow ? 100 : CARD_WIDTH;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardEl = this.cardEls.get(card.id);
      if (!cardEl) continue;

      const targetX = this.valueToX(card.correctValue) - cardW / 2;
      const targetY = LINE_Y - CARD_HEIGHT - 4;

      const p = new Promise<void>((resolve) => {
        setTimeout(() => {
          const startX = parseFloat(cardEl.style.left);
          const startY = parseFloat(cardEl.style.top);
          const pos = { x: startX, y: startY };
          const tween = new Tween(pos)
            .to({ x: targetX, y: targetY }, 500)
            .onUpdate(() => {
              cardEl.style.left = `${pos.x}px`;
              cardEl.style.top = `${pos.y}px`;
            })
            .onComplete(() => resolve());
          this.tweenGroup.add(tween);
          tween.start();
        }, i * 200);
      });

      promises.push(p);
    }

    await Promise.all(promises);
  }
}
