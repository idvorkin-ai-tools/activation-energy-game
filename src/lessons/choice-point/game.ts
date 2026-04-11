import "../../style.css";
import { ARCADE_PALETTE } from "./palette";

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
    this.injectStyles();
    this.showIntro();
  }

  restart(): void {
    this.container.innerHTML = "";
    this.showIntro();
  }

  private injectStyles(): void {
    if (document.getElementById("cp-styles")) return;
    const style = document.createElement("style");
    style.id = "cp-styles";
    style.textContent = `
      body { background: ${ARCADE_PALETTE.background}; }
      .cp-intro {
        max-width: 600px;
        margin: 80px auto 0;
        padding: 0 24px;
        color: ${ARCADE_PALETTE.tileText};
        text-align: center;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      .cp-intro p {
        font-size: 18px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      .cp-begin-btn {
        margin-top: 40px;
        padding: 16px 32px;
        background: transparent;
        border: 2px solid ${ARCADE_PALETTE.accent};
        border-radius: 10px;
        color: ${ARCADE_PALETTE.accent};
        font-size: 16px;
        letter-spacing: 1px;
        cursor: pointer;
        font-family: inherit;
      }
      .cp-begin-btn:hover { background: rgba(255, 184, 107, 0.08); }
    `;
    document.head.appendChild(style);
  }

  private showIntro(): void {
    this.container.innerHTML = `
      <div class="cp-intro">
        <p>Harris — the ACT guy — draws a diagram in the first session with every client.</p>
        <p>Two arrows. Towards moves. Away moves.</p>
        <p>I'm going to show it to you at speed and then we'll talk.</p>
        <button class="cp-begin-btn">TAP TO BEGIN</button>
      </div>
    `;
    const btn = this.container.querySelector<HTMLButtonElement>(".cp-begin-btn")!;
    btn.addEventListener("click", () => this.startArcade());
  }

  private startArcade(): void {
    // Placeholder — implemented in Task 5
    this.container.innerHTML = "<div style='color:#fff;padding:40px'>ARCADE START</div>";
  }
}
