import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";
import { Tween, Group } from "@tweenjs/tween.js";

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
const CARD_RADIUS = 10;
const LINE_Y = 80;
const CARD_COLORS = [0x3b82f6, 0x22c55e, 0xa855f7, 0xf97316, 0xeab308];

export class DragToNumberLine extends Container {
  private lineGraphics: Graphics;
  private cardsContainer: Container;
  private cardMap: Map<string, Container> = new Map();
  private placedCards: Map<string, number> = new Map();
  private tweenGroup: Group;
  private options: DragToNumberLineOptions;

  constructor(options: DragToNumberLineOptions) {
    super();

    this.options = options;
    this.x = options.x;
    this.y = options.y;
    this.tweenGroup = new Group;

    this.lineGraphics = new Graphics();
    this.cardsContainer = new Container();
    this.addChild(this.lineGraphics);
    this.addChild(this.cardsContainer);

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
    const { width, minValue, maxValue } = this.options;
    const g = this.lineGraphics;

    // Main horizontal line
    g.moveTo(0, LINE_Y).lineTo(width, LINE_Y);
    g.stroke({ width: 2, color: 0x9ca3af });

    // Tick marks and labels at meaningful intervals
    const range = maxValue - minValue;
    const step = range <= 100 ? 10 : 20;

    const labelStyle = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 12,
      fill: "#9ca3af",
    });

    for (let val = minValue; val <= maxValue; val += step) {
      const xPos = this.valueToX(val);

      // Tick mark
      const tickHeight = val === 0 ? 12 : 6;
      g.moveTo(xPos, LINE_Y - tickHeight).lineTo(xPos, LINE_Y + tickHeight);
      g.stroke({ width: val === 0 ? 2 : 1, color: val === 0 ? 0xe0e0e0 : 0x6b7280 });

      // Label (only show every other tick, or all if step is large)
      if (val % (step * 2) === 0 || step >= 20 || val === 0) {
        const label = new Text({ text: String(val), style: labelStyle });
        label.anchor.set(0.5, 0);
        label.x = xPos;
        label.y = LINE_Y + 14;
        this.addChild(label);
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
    const cardH = CARD_HEIGHT;
    const gap = isNarrow ? 8 : 12;
    const spacing = cardW + gap;

    // On narrow screens, use 2 rows: 3 cards on top, 2 on bottom
    const topRowCount = isNarrow ? 3 : cards.length;
    const startY = LINE_Y - cardH - (isNarrow ? 100 : 50);

    cards.forEach((card, index) => {
      const cardContainer = new Container();
      const color = CARD_COLORS[index % CARD_COLORS.length];

      // Card background
      const bg = new Graphics();
      bg.roundRect(0, 0, cardW, cardH, CARD_RADIUS).fill(color);
      bg.alpha = 0.9;
      cardContainer.addChild(bg);

      // Card label
      const labelStyle = new TextStyle({
        fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
        fontSize: isNarrow ? 11 : 13,
        fill: "#ffffff",
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: cardW - 16,
        align: "center",
      });
      const label = new Text({ text: card.label, style: labelStyle });
      label.anchor.set(0.5);
      label.x = cardW / 2;
      label.y = cardH / 2;
      cardContainer.addChild(label);

      // Position stacked above the line
      if (isNarrow) {
        const row = index < topRowCount ? 0 : 1;
        const colIndex = row === 0 ? index : index - topRowCount;
        const colCount = row === 0 ? topRowCount : cards.length - topRowCount;
        const rowTotalWidth = colCount * spacing - gap;
        const rowStartX = (this.options.width - rowTotalWidth) / 2;
        cardContainer.x = rowStartX + colIndex * spacing;
        cardContainer.y = startY + row * (cardH + gap);
      } else {
        const totalWidth = cards.length * spacing - gap;
        const startX = (this.options.width - totalWidth) / 2;
        cardContainer.x = startX + index * spacing;
        cardContainer.y = startY;
      }

      // Make draggable
      cardContainer.eventMode = "static";
      cardContainer.cursor = "grab";

      let dragging = false;
      const dragOffset = { x: 0, y: 0 };

      cardContainer.on("pointerdown", (e: FederatedPointerEvent) => {
        dragging = true;
        cardContainer.cursor = "grabbing";
        const local = this.toLocal(e.global);
        dragOffset.x = local.x - cardContainer.x;
        dragOffset.y = local.y - cardContainer.y;
        // Bring to front
        this.cardsContainer.setChildIndex(
          cardContainer,
          this.cardsContainer.children.length - 1,
        );
      });

      cardContainer.on("globalpointermove", (e: FederatedPointerEvent) => {
        if (!dragging) return;
        const local = this.toLocal(e.global);
        cardContainer.x = local.x - dragOffset.x;
        cardContainer.y = local.y - dragOffset.y;
      });

      cardContainer.on("pointerup", () => {
        if (!dragging) return;
        dragging = false;
        cardContainer.cursor = "grab";

        // Snap to number line
        const centerX = cardContainer.x + cardW / 2;
        const snappedValue = Math.round(this.xToValue(centerX));
        const snappedX = this.valueToX(snappedValue) - cardW / 2;

        cardContainer.x = snappedX;
        cardContainer.y = LINE_Y - cardH - 4;

        this.placedCards.set(card.id, snappedValue);

        // Check if all cards are placed
        if (this.placedCards.size === this.options.cards.length) {
          this.options.onAllPlaced(new Map(this.placedCards));
        }
      });

      cardContainer.on("pointerupoutside", () => {
        if (!dragging) return;
        dragging = false;
        cardContainer.cursor = "grab";

        // Snap same as pointerup
        const centerX = cardContainer.x + cardW / 2;
        const snappedValue = Math.round(this.xToValue(centerX));
        const snappedX = this.valueToX(snappedValue) - cardW / 2;

        cardContainer.x = snappedX;
        cardContainer.y = LINE_Y - cardH - 4;

        this.placedCards.set(card.id, snappedValue);

        if (this.placedCards.size === this.options.cards.length) {
          this.options.onAllPlaced(new Map(this.placedCards));
        }
      });

      this.cardsContainer.addChild(cardContainer);
      this.cardMap.set(card.id, cardContainer);
    });
  }

  /** Animate all cards to their correct positions */
  async reveal(): Promise<void> {
    const { cards } = this.options;
    const isNarrow = this.options.width < 600;
    const cardW = isNarrow ? 100 : CARD_WIDTH;
    const cardH = CARD_HEIGHT;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardContainer = this.cardMap.get(card.id);
      if (!cardContainer) continue;

      const targetX = this.valueToX(card.correctValue) - cardW / 2;
      const targetY = LINE_Y - cardH - 4;

      const p = new Promise<void>((resolve) => {
        setTimeout(() => {
          const pos = { x: cardContainer.x, y: cardContainer.y };
          const tween = new Tween(pos)
            .to({ x: targetX, y: targetY }, 500)
            .onUpdate(() => {
              cardContainer.x = pos.x;
              cardContainer.y = pos.y;
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
