import { Application } from "pixi.js";
import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { Character } from "../characters/Character";
import type { Game } from "../Game";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class Ch0_Morning extends Scene {
  onComplete: (() => void) | null = null;
  private game: Game;

  constructor(app: Application, game: Game) {
    super(app);
    this.game = game;
  }

  async enter(): Promise<void> {
    const textX = 80;
    const textY = this.height * 0.55;
    const textMaxWidth = this.width * 0.7;

    // Create character lying down at bottom-center
    const character = new Character();
    character.setPosition(this.width / 2, this.height * 0.4);
    character.container.rotation = Math.PI / 2; // lying down
    this.container.addChild(character.container);

    // Create a single reusable TextBox
    const textBox = new TextBox({
      text: "It's 6am. You just woke up.",
      x: textX,
      y: textY,
      maxWidth: textMaxWidth,
    });
    this.container.addChild(textBox);

    // Scene fades in with character lying down
    await textBox.show();
    await delay(1200);

    // Character sits up / stands
    character.container.rotation = 0;
    character.setExpression("neutral");
    await character.walkTo(this.width / 2, this.height * 0.35, 800);
    await delay(600);

    // "You feel pretty good"
    textBox.setText("You feel... pretty good, actually. Clear-headed. Ready to do things.");
    await textBox.show();
    await delay(1500);

    // WillpowerBar fills from 0 to 80
    this.game.willpowerBar.setValue(0, 100);
    await delay(200);
    this.game.willpowerBar.setValue(80, 100);
    await delay(800);

    textBox.setText("You've got a full tank. 80 units of willpower.");
    await textBox.show();
    await delay(1500);

    textBox.setText("That sounds like a lot. It is.");
    await textBox.show();
    await delay(1800);

    textBox.setText(
      "By 10pm tonight, you'll have 10 units left and you'll be watching your 47th TikTok about a dog that can skateboard.",
    );
    await textBox.show();
    await delay(800);

    // Brief flash to tired and back
    character.setExpression("tired");
    await delay(600);
    character.setExpression("neutral");
    await delay(1000);

    textBox.setText("How does 80 become 10?");
    await textBox.show();
    await delay(1500);

    textBox.setText("Let's find out.");
    await textBox.show();
    await delay(1000);

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
