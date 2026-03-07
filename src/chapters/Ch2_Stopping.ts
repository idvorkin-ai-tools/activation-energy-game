import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { TimelineScrubber } from "../interactions/TimelineScrubber";
import { createSkipButton } from "../engine/SkipButton";
import type { Game } from "../Game";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function movieStoppingEnergy(timeMinutes: number): number {
  if (timeMinutes <= 90) {
    return 35 + (5 * timeMinutes) / 90;
  } else if (timeMinutes <= 120) {
    const t = (timeMinutes - 90) / 30;
    return 40 * (1 - t) + 2 * t;
  } else {
    return Math.max(0, 2 - (timeMinutes - 120) * 0.1);
  }
}

function tiktokStoppingEnergy(timeMinutes: number): number {
  return 38 + 2 * Math.sin(timeMinutes * 0.05);
}

export class Ch2_Stopping extends Scene {
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
  }

  async enter(): Promise<void> {
    const textX = 80;
    const textMaxWidth = this.width * 0.7;

    const textBox = new TextBox({
      text: "Starting things is hard. But stopping things? That's where it gets interesting.",
      x: textX,
      y: this.height * 0.05,
      maxWidth: textMaxWidth,
    });
    this.el.appendChild(textBox.el);

    await textBox.show();
    await delay(1500);

    textBox.setText(
      "Every activity also has Stopping Energy \u2014 the willpower cost to quit what you're doing and switch to something else.",
    );
    await textBox.show();
    await delay(2000);

    textBox.setText("And Stopping Energy changes over time.");
    await textBox.show();
    await delay(1200);

    // Create the TimelineScrubber
    const scrubberWidth = Math.min(this.width - 100, 900);
    const scrubberHeight = Math.min(this.height * 0.4, 300);
    const scrubberX = (this.width - scrubberWidth) / 2;
    const scrubberY = this.height * 0.22;

    let interactResolve: () => void;
    let interactResolved = false;
    const interactPromise = new Promise<void>((resolve) => {
      interactResolve = () => {
        if (!interactResolved) {
          interactResolved = true;
          resolve();
        }
      };
    });

    const scrubber = new TimelineScrubber({
      x: scrubberX,
      y: scrubberY,
      width: scrubberWidth,
      height: scrubberHeight,
      curves: [
        { label: "Movie", color: "#60a5fa", getStoppingEnergy: movieStoppingEnergy },
        { label: "TikTok", color: "#f87171", getStoppingEnergy: tiktokStoppingEnergy },
      ],
      maxTimeMinutes: 150,
    });
    this.el.appendChild(scrubber.el);

    scrubber.onInteract = () => {
      setTimeout(() => interactResolve(), 3000);
    };

    textBox.setText("Drag the timeline. Watch what happens.");
    await textBox.show();

    const cleanupSkip = createSkipButton(this.el, this.width, this.height, interactResolve!);

    await interactPromise;
    cleanupSkip();

    textBox.y = this.height * 0.65;

    textBox.setText("See that? The movie ends. It gives you a natural exit \u2014 the credits roll, the lights come on.");
    await textBox.show();
    await delay(2500);

    textBox.setText(
      "TikTok never ends. There are no credits. There is no exit ramp. Just one more video.",
    );
    await textBox.show();
    await delay(2500);

    textBox.setText("TikTok is engineered to never give you a stopping point.");
    await textBox.show();
    await delay(2000);

    // Show the equation as a styled span
    const equation = document.createElement("div");
    equation.style.position = "absolute";
    equation.style.left = `${textX}px`;
    equation.style.top = `${this.height * 0.65 - 36}px`;
    equation.style.fontFamily = '"Courier New", monospace';
    equation.style.fontSize = "18px";
    equation.style.color = "#fbbf24";
    equation.style.fontWeight = "bold";
    equation.textContent = "Activation Energy = Stopping Energy (current) + Starting Energy (new)";
    this.el.appendChild(equation);

    await delay(1500);

    textBox.setText(
      "To go from TikTok (stopping: 40) to meditating (starting: 20), you need 60 willpower units.",
    );
    await textBox.show();
    await delay(2200);

    textBox.setText("At 10pm, you have 10.");
    await textBox.show();
    await delay(1800);

    textBox.setText("That's why you never meditate at night.");
    await textBox.show();
    await delay(1800);

    textBox.setText("It's not discipline. It's math.");
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
