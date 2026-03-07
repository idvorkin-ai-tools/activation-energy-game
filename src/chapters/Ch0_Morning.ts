import { Scene } from "../engine/Scene";
import { TextBox } from "../engine/TextBox";
import { Button } from "../engine/Button";
import { Character } from "../characters/Character";
import type { Game } from "../Game";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class Ch0_Morning extends Scene {
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
  }

  async enter(): Promise<void> {
    const textX = 80;
    const textY = this.height * 0.55;
    const textMaxWidth = this.width * 0.7;

    // Create character lying down at bottom-center
    const character = new Character();
    character.setPosition(this.width / 2, this.height * 0.4);
    character.el.style.transform = "rotate(90deg)";
    this.el.appendChild(character.el);

    const textBox = new TextBox({
      text: "It's 6am. You just woke up.",
      x: textX,
      y: textY,
      maxWidth: textMaxWidth,
    });
    this.el.appendChild(textBox.el);

    await textBox.show();
    await delay(1200);

    // Character sits up / stands
    character.el.style.transform = "";
    character.setExpression("neutral");
    await character.walkTo(this.width / 2, this.height * 0.35, 800);
    await delay(600);

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
