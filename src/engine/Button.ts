import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";
import { Tween, Group } from "@tweenjs/tween.js";

export interface ButtonOptions {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  onClick: () => void;
}

export class Button extends Container {
  private bg: Graphics;
  private labelText: Text;
  private onClick: () => void;
  private tweenGroup: Group;
  private enabled = true;
  private readonly btnWidth: number;
  private readonly btnHeight: number;
  private readonly bgColor = 0x3b82f6;
  private readonly bgColorDisabled = 0x6b7280;
  private readonly cornerRadius = 8;

  constructor(options: ButtonOptions) {
    super();

    this.onClick = options.onClick;
    this.tweenGroup = new Group();
    this.btnWidth = options.width ?? 200;
    this.btnHeight = options.height ?? 50;

    this.x = options.x;
    this.y = options.y;

    // Background
    this.bg = new Graphics();
    this.drawBg(this.bgColor);
    this.addChild(this.bg);

    // Label
    const style = new TextStyle({
      fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
      fontSize: 18,
      fill: "#ffffff",
      fontWeight: "bold",
    });
    this.labelText = new Text({ text: options.text, style });
    this.labelText.anchor.set(0.5);
    this.labelText.x = this.btnWidth / 2;
    this.labelText.y = this.btnHeight / 2;
    this.addChild(this.labelText);

    // Interaction
    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= this.btnWidth && y >= 0 && y <= this.btnHeight };

    this.on("pointerover", this.onHoverIn, this);
    this.on("pointerout", this.onHoverOut, this);
    this.on("pointerdown", this.onPress, this);
  }

  private drawBg(color: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.btnWidth, this.btnHeight, this.cornerRadius).fill(color);
  }

  private onHoverIn(): void {
    if (!this.enabled) return;
    this.pivot.set(this.btnWidth / 2, this.btnHeight / 2);
    this.position.x += this.btnWidth / 2;
    this.position.y += this.btnHeight / 2;
    this.scale.set(1.05);
    this.drawBg(0x60a5fa); // slightly brighter
  }

  private onHoverOut(): void {
    if (!this.enabled) return;
    this.scale.set(1);
    this.position.x -= this.btnWidth / 2;
    this.position.y -= this.btnHeight / 2;
    this.pivot.set(0, 0);
    this.drawBg(this.bgColor);
  }

  private onPress(_e: FederatedPointerEvent): void {
    if (!this.enabled) return;

    // Quick press animation
    const obj = { s: 1.05 };
    const pressTween = new Tween(obj)
      .to({ s: 0.95 }, 80)
      .onUpdate(() => {
        this.scale.set(obj.s);
      })
      .onComplete(() => {
        this.scale.set(1);
        this.onClick();
      });
    this.tweenGroup.add(pressTween);
    pressTween.start();

    // Drive the short animation
    const animate = () => {
      if (this.tweenGroup.getAll().length > 0) {
        this.tweenGroup.update();
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.eventMode = enabled ? "static" : "none";
    this.cursor = enabled ? "pointer" : "default";
    this.alpha = enabled ? 1 : 0.5;
    this.drawBg(enabled ? this.bgColor : this.bgColorDisabled);
  }
}
