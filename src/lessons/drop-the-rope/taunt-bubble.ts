import { announce } from "./a11y";

/**
 * Speech-bubble DOM element that fades up over the monster for a configurable duration.
 * Per Q2, duration is graduated per round: R1 3s, R2-R4 1.5s, R5 ~0.3s (interrupted).
 */
export class TauntBubble {
  el: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "dtr-taunt";
    this.el.hidden = true;
  }

  /** Fade in, hold, fade out. Announces via aria-live so screen readers get the taunt. */
  async show(text: string, holdMs: number, fadeMs: number): Promise<void> {
    this.el.textContent = text;
    this.el.hidden = false;
    this.el.style.opacity = "0";
    void this.el.offsetHeight;
    this.el.style.transition = `opacity ${fadeMs}ms ease-out`;
    this.el.style.opacity = "1";
    announce(text);
    await new Promise((r) => setTimeout(r, fadeMs + holdMs));
    this.el.style.transition = `opacity ${fadeMs}ms ease-in`;
    this.el.style.opacity = "0";
    await new Promise((r) => setTimeout(r, fadeMs));
    this.el.hidden = true;
  }

  /** Abruptly cut off the taunt (for round 5 when the player drops before it completes) */
  cancel(): void {
    this.el.style.transition = "opacity 100ms linear";
    this.el.style.opacity = "0";
    setTimeout(() => {
      this.el.hidden = true;
    }, 100);
  }
}
