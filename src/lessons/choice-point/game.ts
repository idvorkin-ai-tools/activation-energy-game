import "../../style.css";
import { Character } from "../../characters/Character";
import { ARCADE_PALETTE } from "./palette";

/**
 * The Catcher — Choice Point lesson as arcade.
 * Self-contained state machine. See docs/plans/2026-04-11-choice-point-catcher-design.md.
 */
export class CatcherGame {
  private container: HTMLElement;
  private raccoon!: Character;

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
      .cp-stage {
        position: relative;
        max-width: 600px;
        height: calc(100vh - 48px);
        margin: 0 auto;
        overflow: hidden;
      }
      .cp-decision-line {
        position: absolute;
        left: 20px; right: 20px;
        top: 60%;
        border-top: 1.5px dashed ${ARCADE_PALETTE.decisionLine};
        opacity: 0.7;
      }
      .cp-raccoon-layer { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
      .cp-bins {
        position: absolute;
        left: 0; right: 0;
        bottom: 80px;
        display: flex;
        justify-content: space-between;
        padding: 0 24px;
      }
      .cp-bin {
        width: 40%;
        max-width: 160px;
        padding: 18px 0;
        text-align: center;
        border: 2px solid;
        border-radius: 14px;
        background: rgba(20, 15, 40, 0.4);
      }
      .cp-bin-away {
        border-color: ${ARCADE_PALETTE.awayBinBorder};
        color: ${ARCADE_PALETTE.awayBinText};
      }
      .cp-bin-towards {
        border-color: ${ARCADE_PALETTE.towardsBinBorder};
        color: ${ARCADE_PALETTE.towardsBinText};
      }
      .cp-bin-label { font-size: 13px; font-weight: 600; letter-spacing: 2px; }
      .cp-bin-arrow { font-size: 24px; margin-top: 6px; opacity: 0.9; }
      .cp-hud {
        position: absolute;
        bottom: 22px;
        left: 0; right: 0;
        text-align: center;
        font-size: 12px;
        color: ${ARCADE_PALETTE.hudText};
        letter-spacing: 1px;
      }
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
    this.container.innerHTML = `
      <div class="cp-stage">
        <div class="cp-decision-line"></div>
        <div class="cp-raccoon-layer"></div>
        <div class="cp-bins">
          <div class="cp-bin cp-bin-away">
            <div class="cp-bin-label">AWAY</div>
            <div class="cp-bin-arrow">&larr;</div>
          </div>
          <div class="cp-bin cp-bin-towards">
            <div class="cp-bin-label">TOWARDS</div>
            <div class="cp-bin-arrow">&rarr;</div>
          </div>
        </div>
        <div class="cp-hud"><span class="cp-hud-wave">WAVE 1</span></div>
      </div>
    `;

    // Raccoon on its own layer
    const raccoonLayer = this.container.querySelector<HTMLDivElement>(".cp-raccoon-layer")!;
    raccoonLayer.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none";
    this.raccoon = new Character();
    this.raccoon.setExpression("neutral");
    raccoonLayer.appendChild(this.raccoon.el);
    this.positionRaccoonAtDecisionLine();
  }

  private positionRaccoonAtDecisionLine(): void {
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    const rect = stage.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height * 0.62; // just above the bins, below decision line
    this.raccoon.setPosition(cx, cy);
  }
}
