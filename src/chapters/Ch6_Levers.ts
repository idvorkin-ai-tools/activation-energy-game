import { Application } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import {
  MorningHabitsToggle,
  ScheduleComparison,
  PeerGravity,
} from "../interactions/LeverToggles";
import type { Game } from "../Game";

export class Ch6_Levers extends Scene {
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

    // ─── Intro ───────────────────────────────────────────────

    const text1 = new TextBox({
      text: "So you've got five fibers, a limited tank, and a world designed to drain you.",
      x: textX,
      y: 50,
      maxWidth: textMaxW,
    });
    this.container.addChild(text1);
    await text1.show();

    await this.delay(1000);

    const text2 = new TextBox({
      text: "What can you actually do?",
      x: textX,
      y: 100,
      maxWidth: textMaxW,
    });
    this.container.addChild(text2);
    await text2.show();

    await this.delay(800);

    const text3 = new TextBox({
      text: "Three levers.",
      x: textX,
      y: 140,
      maxWidth: textMaxW,
      fontSize: 26,
      color: "#3b82f6",
    });
    this.container.addChild(text3);
    await text3.show();

    await this.delay(1000);

    // ─── Lever 1: Morning Habits ─────────────────────────────

    // Clear intro texts
    text1.hide();
    text2.hide();
    text3.hide();

    const lever1Title = new TextBox({
      text: "Lever 1: Morning Habits",
      x: textX,
      y: 50,
      maxWidth: textMaxW,
      fontSize: 24,
      color: "#22c55e",
    });
    this.container.addChild(lever1Title);
    await lever1Title.show();

    const morningToggle = new MorningHabitsToggle({
      x: (w - Math.min(w - 100, 600)) / 2,
      y: 100,
      width: Math.min(w - 100, 600),
      height: h * 0.35,
    });
    this.container.addChild(morningToggle);

    await this.delay(1500);

    const lever1Explain = new TextBox({
      text: "Morning habits don't add willpower. They activate all five fibers at once.",
      x: textX,
      y: h * 0.35 + 120,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever1Explain);
    await lever1Explain.show();

    await this.delay(1000);

    const bullets1 = new TextBox({
      text: "Exercise \u2192 Physical fiber fires up\nJournaling \u2192 Emotional + Creative fibers engage\nFamily breakfast \u2192 Family fiber warms up\nReview your plan \u2192 Professional fiber pre-loads",
      x: textX + 20,
      y: h * 0.35 + 165,
      maxWidth: textMaxW - 20,
      fontSize: 16,
      color: "#9ca3af",
    });
    this.container.addChild(bullets1);
    await bullets1.show();

    await this.delay(1500);

    const lever1Summary = new TextBox({
      text: "It's like a warm-up before lifting. You're not stronger \u2014 you're more coordinated.",
      x: textX,
      y: h - 130,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever1Summary);
    await lever1Summary.show();

    // Continue button for lever 1 → lever 2
    await this.waitForContinue(w, h);

    // ─── Lever 2: Schedules ──────────────────────────────────

    // Clear lever 1 content
    this.container.removeChildren();

    const lever2Title = new TextBox({
      text: "Lever 2: Schedules",
      x: textX,
      y: 50,
      maxWidth: textMaxW,
      fontSize: 24,
      color: "#3b82f6",
    });
    this.container.addChild(lever2Title);
    await lever2Title.show();

    const scheduleComparison = new ScheduleComparison({
      x: (w - Math.min(w - 60, 700)) / 2,
      y: 100,
      width: Math.min(w - 60, 700),
      height: h * 0.4,
    });
    this.container.addChild(scheduleComparison);

    await this.delay(2000);

    const lever2Text1 = new TextBox({
      text: "Every choice is a willpower leak.",
      x: textX,
      y: h * 0.4 + 130,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever2Text1);
    await lever2Text1.show();

    await this.delay(1000);

    const lever2Text2 = new TextBox({
      text: "A schedule eliminates all those choices. The gym isn't a decision \u2014 it's a fact. Like gravity.",
      x: textX,
      y: h * 0.4 + 175,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever2Text2);
    await lever2Text2.show();

    await this.delay(1200);

    const lever2Summary = new TextBox({
      text: "The calendar doesn't add willpower. It stops you from wasting it on choices.",
      x: textX,
      y: h - 130,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever2Summary);
    await lever2Summary.show();

    // Continue button for lever 2 → lever 3
    await this.waitForContinue(w, h);

    // ─── Lever 3: Peers ──────────────────────────────────────

    // Clear lever 2 content
    this.container.removeChildren();

    const lever3Title = new TextBox({
      text: "Lever 3: Peers",
      x: textX,
      y: 50,
      maxWidth: textMaxW,
      fontSize: 24,
      color: "#a855f7",
    });
    this.container.addChild(lever3Title);
    await lever3Title.show();

    const peerGravity = new PeerGravity({
      x: (w - Math.min(w - 60, 600)) / 2,
      y: 90,
      width: Math.min(w - 60, 600),
      height: h * 0.55,
    });
    this.container.addChild(peerGravity);

    await this.delay(1500);

    const lever3Text1 = new TextBox({
      text: "You become the average of the people around you.",
      x: textX,
      y: h * 0.55 + 120,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever3Text1);
    await lever3Text1.show();

    await this.delay(1200);

    const lever3Text2 = new TextBox({
      text: "Your peers don't give you willpower. They change what feels normal.",
      x: textX,
      y: h - 130,
      maxWidth: textMaxW,
    });
    this.container.addChild(lever3Text2);
    await lever3Text2.show();

    // ─── Next Button ─────────────────────────────────────────

    const nextBtn = new Button({
      text: "Next \u2192",
      x: w - 160,
      y: h - 80,
      width: 120,
      height: 44,
      onClick: () => {
        if (this.onComplete) this.onComplete();
      },
    });
    this.container.addChild(nextBtn);
  }

  async exit(): Promise<void> {
    // Cleanup handled by Scene.destroy()
  }

  /** Show a "Continue" button and wait for click */
  private waitForContinue(w: number, h: number): Promise<void> {
    return new Promise((resolve) => {
      const btn = new Button({
        text: "Continue \u2192",
        x: w - 180,
        y: h - 80,
        width: 140,
        height: 44,
        onClick: () => {
          resolve();
        },
      });
      this.container.addChild(btn);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
