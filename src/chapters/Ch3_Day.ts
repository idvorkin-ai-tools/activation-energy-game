import { Application } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { DayTimeline } from "../interactions/DayTimeline";
import { getActivityById } from "../sim/activities";
import type { Activity } from "../sim/types";
import type { Game } from "../Game";

export class Ch3_Day extends Scene {
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
      text: "OK. So starting things costs willpower. Stopping things costs willpower. And you have a limited tank.",
      x: textX,
      y: 60,
      maxWidth: textMaxW,
    });
    this.container.addChild(text1);
    await text1.show();

    await this.delay(600);

    const text2 = new TextBox({
      text: "What if the order matters?",
      x: textX,
      y: 120,
      maxWidth: textMaxW,
    });
    this.container.addChild(text2);
    await text2.show();

    await this.delay(400);

    // ─── Day Timeline ────────────────────────────────────────

    // Select 6 activities for the planner
    const activityIds = [
      "morning-workout",
      "breakfast-with-family",
      "deep-work",
      "tiktok",
      "afternoon-meetings",
      "evening-gym",
    ];
    const activities: Activity[] = activityIds
      .map((id) => getActivityById(id))
      .filter((a): a is Activity => a !== undefined);

    const timeline = new DayTimeline({
      x: 40,
      y: 180,
      width: w - 80,
      height: h * 0.5,
      activities,
      willpowerBar: this.game.willpowerBar,
    });
    this.container.addChild(timeline);

    const instructionText = new TextBox({
      text: "Plan a day. Drag the blocks into order on the timeline, then press Play.",
      x: textX,
      y: 160,
      maxWidth: textMaxW,
      fontSize: 16,
      color: "#9ca3af",
    });
    this.container.addChild(instructionText);
    instructionText.showInstant();

    // ─── After First Play ────────────────────────────────────

    await new Promise<void>((resolve) => {
      timeline.onFirstPlayComplete = resolve;
    });

    instructionText.hide();

    // Analyze the schedule for contextual feedback
    const schedule = timeline.getSchedule();
    const firstActivityId = schedule.length > 0 ? schedule[0].activity.id : "";
    const tiktokSlot = schedule.find((s) => s.activity.id === "tiktok");
    const afternoonSlots = schedule.filter(
      (s) =>
        s.startMinute >= 720 &&
        s.activity.id !== "tiktok",
    );
    const tiktokBeforeAfternoon =
      tiktokSlot &&
      afternoonSlots.some((s) => s.startMinute > tiktokSlot.startMinute);

    let feedbackMessage: string;
    if (firstActivityId === "morning-workout") {
      feedbackMessage =
        "Did you catch it? Morning habits don't just cost willpower \u2014 they generate it.";
    } else if (tiktokBeforeAfternoon) {
      feedbackMessage = "But that TikTok at lunch? Devastating.";
    } else {
      feedbackMessage =
        "The same activities in different order produce completely different days.";
    }

    const feedbackText = new TextBox({
      text: feedbackMessage,
      x: textX,
      y: h - 220,
      maxWidth: textMaxW,
    });
    this.container.addChild(feedbackText);
    await feedbackText.show();

    await this.delay(1200);

    const text3 = new TextBox({
      text: "This is why morning routines aren't a productivity hack. They're an energy strategy.",
      x: textX,
      y: h - 170,
      maxWidth: textMaxW,
    });
    this.container.addChild(text3);
    await text3.show();

    await this.delay(1200);

    const text4 = new TextBox({
      text: "But we've been lying to you a little. That willpower bar? It's not actually one bar.",
      x: textX,
      y: h - 120,
      maxWidth: textMaxW,
    });
    this.container.addChild(text4);
    await text4.show();

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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
