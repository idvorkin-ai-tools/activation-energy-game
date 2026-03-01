import { Application, Text, TextStyle } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { TimelineScrubber } from "../interactions/TimelineScrubber";
import type { Game } from "../Game";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Movie stopping curve: starts at 35, peaks around 40 at 90min,
 * then drops to near-zero by 120min (natural end).
 */
function movieStoppingEnergy(timeMinutes: number): number {
  if (timeMinutes <= 90) {
    // Gradual rise from 35 to 40
    return 35 + (5 * timeMinutes) / 90;
  } else if (timeMinutes <= 120) {
    // Rapid drop from 40 to ~2
    const t = (timeMinutes - 90) / 30;
    return 40 * (1 - t) + 2 * t;
  } else {
    // After credits, near-zero
    return Math.max(0, 2 - (timeMinutes - 120) * 0.1);
  }
}

/**
 * TikTok stopping curve: starts at 40, stays flat around 38-40.
 * Engineered to never give you a stopping point.
 */
function tiktokStoppingEnergy(timeMinutes: number): number {
  // Slight oscillation to look organic, but essentially flat
  return 38 + 2 * Math.sin(timeMinutes * 0.05);
}

export class Ch2_Stopping extends Scene {
  onComplete: (() => void) | null = null;
  private game: Game;

  constructor(app: Application, game: Game) {
    super(app);
    this.game = game;
  }

  async enter(): Promise<void> {
    const textX = 80;
    const textMaxWidth = this.width * 0.7;

    // Text in upper area
    const textBox = new TextBox({
      text: "Starting things is hard. But stopping things? That's where it gets interesting.",
      x: textX,
      y: this.height * 0.05,
      maxWidth: textMaxWidth,
    });
    this.container.addChild(textBox);

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

    const interactPromise = new Promise<void>((resolve) => {
      const scrubber = new TimelineScrubber({
        x: scrubberX,
        y: scrubberY,
        width: scrubberWidth,
        height: scrubberHeight,
        curves: [
          {
            label: "Movie",
            color: "#60a5fa",
            getStoppingEnergy: movieStoppingEnergy,
          },
          {
            label: "TikTok",
            color: "#f87171",
            getStoppingEnergy: tiktokStoppingEnergy,
          },
        ],
        maxTimeMinutes: 150,
      });
      this.container.addChild(scrubber);

      scrubber.onInteract = () => {
        // Wait a few seconds of interaction, then resolve
        setTimeout(() => resolve(), 3000);
      };
    });

    textBox.setText("Drag the timeline. Watch what happens.");
    await textBox.show();

    // Wait for user to interact
    await interactPromise;

    // Move text to lower area for commentary
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

    // Show the equation
    const equationStyle = new TextStyle({
      fontFamily: '"Courier New", monospace',
      fontSize: 18,
      fill: "#fbbf24",
      fontWeight: "bold",
    });
    const equation = new Text({
      text: "Activation Energy = Stopping Energy (current) + Starting Energy (new)",
      style: equationStyle,
    });
    equation.x = textX;
    equation.y = textBox.y - 36;
    this.container.addChild(equation);

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

    // Show "Next" button
    const nextButton = new Button({
      text: "Next \u2192",
      x: this.width - 160,
      y: this.height - 80,
      onClick: () => {
        if (this.onComplete) this.onComplete();
      },
    });
    this.container.addChild(nextButton);
  }

  async exit(): Promise<void> {
    return Promise.resolve();
  }
}
