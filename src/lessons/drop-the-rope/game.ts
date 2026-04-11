import { Character } from "../../characters/Character";
import { ExhaustionBar } from "./exhaustion-bar";
import { DropButton } from "./drop-button";
import { TauntBubble } from "./taunt-bubble";
import { canvasAspect } from "../../scenes/utils";
import { ROUND_CONFIGS } from "./monsters.ts";
import { runRound, type RoundDeps } from "./round-loop.ts";
import { runIntro } from "./intro.ts";
import { runGallery } from "./gallery.ts";
import { initA11y } from "./a11y.ts";

/**
 * Top-level orchestrator for the Drop the Rope lesson.
 *
 * Flow: intro (3 slides) → round 1..5 → gallery ending → either "Again"
 * restarts the whole flow, or the hub link navigates away.
 *
 * Owns the canvas, the Character DOM, the exhaustion bar, the drop button,
 * and the taunt bubble — passed through to round-loop via `deps()`.
 */
export class DropTheRopeGame {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private character!: Character;
  private exhaustionBar!: ExhaustionBar;
  private dropButton!: DropButton;
  private tauntBubble!: TauntBubble;
  private stopped = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async start(): Promise<void> {
    this.stopped = false;
    initA11y();
    this.setupDOM();

    await runIntro(this.container);
    if (this.stopped) return;

    for (let r = 1; r <= 5; r++) {
      if (this.stopped) return;
      await runRound(
        ROUND_CONFIGS[r - 1],
        r as 1 | 2 | 3 | 4 | 5,
        this.deps(),
      );
    }
    if (this.stopped) return;

    await runGallery(this.deps(), () => this.restart());
  }

  restart(): void {
    this.stopped = true;
    this.cleanupLingeringUI();
    this.container.innerHTML = "";
    // Kick off fresh run on next tick so any in-flight promises unwind first
    queueMicrotask(() => {
      void this.start();
    });
  }

  /** Remove UI nodes that may have been appended to the canvas parent. */
  private cleanupLingeringUI(): void {
    ["dtr-caption"].forEach((id) => {
      document.getElementById(id)?.remove();
    });
    document.querySelectorAll(".dtr-ending").forEach((el) => el.remove());
  }

  private deps(): RoundDeps {
    return {
      ctx: this.ctx,
      canvas: this.canvas,
      character: this.character,
      exhaustionBar: this.exhaustionBar,
      dropButton: this.dropButton,
      tauntBubble: this.tauntBubble,
    };
  }

  private setupDOM(): void {
    this.container.innerHTML = "";
    this.container.style.position = "relative";

    // Exhaustion bar rides at the very top of the container
    this.exhaustionBar = new ExhaustionBar();
    this.exhaustionBar.el.style.position = "absolute";
    this.exhaustionBar.el.style.top = "0";
    this.exhaustionBar.el.style.left = "0";
    this.exhaustionBar.el.style.zIndex = "5";
    this.container.appendChild(this.exhaustionBar.el);

    // Canvas sized to the container width with the shared aspect helper
    const rect = this.container.getBoundingClientRect();
    const containerW = rect.width || 1200;
    const aspect = canvasAspect(containerW);
    const cssH = containerW * aspect;
    const dpr = window.devicePixelRatio || 1;

    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.canvas.style.width = `${containerW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.width = containerW * dpr;
    this.canvas.height = cssH * dpr;
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.scale(dpr, dpr);

    // Character DOM canvas sits above the main canvas
    this.character = new Character();
    this.character.el.style.zIndex = "2";
    this.container.appendChild(this.character.el);
    this.character.setPosition(containerW * 0.3, cssH * 0.6);

    // Drop button + taunt bubble live in the container so they position over the canvas
    this.dropButton = new DropButton();
    this.dropButton.el.style.zIndex = "4";
    this.container.appendChild(this.dropButton.el);

    this.tauntBubble = new TauntBubble();
    this.tauntBubble.el.style.zIndex = "3";
    this.container.appendChild(this.tauntBubble.el);
  }
}
