import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { DragToNumberLine } from "../interactions/DragToNumberLine";
import { createSkipButton } from "../engine/SkipButton";
import type { Game } from "../Game";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class Ch1_Starting extends Scene {
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
  }

  async enter(): Promise<void> {
    const textX = 80;
    const textMaxWidth = this.width * 0.7;

    const textBox = new TextBox({
      text: "Every activity has a price tag. Not in money \u2014 in willpower.",
      x: textX,
      y: this.height * 0.08,
      maxWidth: textMaxWidth,
    });
    this.el.appendChild(textBox.el);

    await textBox.show();
    await delay(1500);

    textBox.setText(
      "To *start* something, you have to pay its Starting Energy. Some things cost a lot. Some cost a little.",
    );
    await textBox.show();
    await delay(1800);

    textBox.setText("And some things... pay *you*.");
    await textBox.show();
    await delay(1500);

    const lineWidth = Math.min(this.width - 120, 800);
    const lineX = (this.width - lineWidth) / 2;

    let allPlacedResolve: () => void;
    const allPlacedPromise = new Promise<void>((resolve) => {
      allPlacedResolve = resolve;
    });

    const numberLine = new DragToNumberLine({
      x: lineX,
      y: this.height * 0.3,
      width: lineWidth,
      minValue: -60,
      maxValue: 100,
      cards: [
        { id: "tiktok", label: "TikTok", icon: "phone", correctValue: -50 },
        { id: "going-to-work", label: "Going to Work", icon: "briefcase", correctValue: -10 },
        { id: "existing-habit", label: "Existing Habit", icon: "repeat", correctValue: 5 },
        { id: "meditating", label: "Meditating", icon: "lotus", correctValue: 20 },
        {
          id: "the-thing",
          label: "The Thing You've\nBeen Avoiding",
          icon: "mountain",
          correctValue: 80,
        },
      ],
      onAllPlaced: () => {
        allPlacedResolve();
      },
    });
    this.el.appendChild(numberLine.el);

    textBox.setText("Go ahead. Where do you think each one goes?");
    await textBox.show();

    const cleanupSkip = createSkipButton(this.el, this.width, this.height, allPlacedResolve!);

    await allPlacedPromise;
    cleanupSkip();
    await delay(500);

    await numberLine.reveal();
    await delay(800);

    textBox.y = this.height * 0.62;

    textBox.setText("TikTok is at negative fifty.");
    await textBox.show();
    await delay(1500);

    textBox.setText(
      "That minus sign is important. It means TikTok doesn't cost willpower to start. TikTok pulls you in. You don't choose TikTok. TikTok chooses you.",
    );
    await textBox.show();
    await delay(2500);

    textBox.setText(
      "And that thing you've been putting off? Calling the dentist, filing taxes, having that conversation?",
    );
    await textBox.show();
    await delay(2000);

    textBox.setText("Eighty. It costs almost your entire morning tank just to begin.");
    await textBox.show();
    await delay(2000);

    textBox.setText("That's not a character flaw. That's physics.");
    await textBox.show();
    await delay(2000);

    textBox.setText("But here's what nobody tells you: starting energy is only half the equation.");
    await textBox.show();
    await delay(1200);

    const nextButton = new Button({
      text: "Next \u2192",
      x: this.width - 160,
      y: this.height - 80,
      onClick: () => {
        if (this.onComplete) this.onComplete();
      },
    });
    this.el.appendChild(nextButton.el);
  }

  async exit(): Promise<void> {
    return Promise.resolve();
  }
}
