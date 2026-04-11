/**
 * The Catcher — Choice Point lesson as arcade.
 * Self-contained state machine. See docs/plans/2026-04-11-choice-point-catcher-design.md.
 */
export class CatcherGame {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    container.innerHTML = "";
    container.style.padding = "0";
    // TODO: intro screen in Task 4
  }

  restart(): void {
    this.container.innerHTML = "";
    // TODO: re-init in later tasks
  }
}
