import type { RoundDeps } from "./round-loop.ts";
import { drawWarmDawn } from "./warm-dawn.ts";
import { drawMonster } from "./monsters.ts";
import { drawRaccoonComposite } from "../../scenes/raccoonComposite";
import type { MonsterId } from "./types";

const ALL_MONSTERS: readonly MonsterId[] = [
  "anxiety",
  "self-criticism",
  "shame",
  "doubt",
  "anger",
];

/**
 * Final tableau: warm dawn background, 5 distant roaring monsters across the
 * top half, raccoon front-center. Two lines of ending text fade in, then the
 * action links ("Again" / hub). Resolves after the player chooses "Again" or
 * clicks the hub link (which navigates away on its own).
 */
export async function runGallery(
  deps: RoundDeps,
  onAgain: () => void,
): Promise<void> {
  const { ctx, canvas, character } = deps;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  // Hide the Character DOM canvas — we'll composite the raccoon statically
  character.el.style.display = "none";

  // Draw: warm dawn → 5 distant monsters → raccoon front-center (via composite)
  const render = (): void => {
    ctx.clearRect(0, 0, w, h);
    drawWarmDawn(ctx, w, h, 1);

    // 5 monsters in a row across the upper-third, small and evenly spaced
    const monsterHeight = Math.min(80, h * 0.14);
    for (let i = 0; i < 5; i++) {
      const cx = w * 0.1 + (i + 0.5) * (w * 0.16);
      const cy = h * 0.32;
      drawMonster(ctx, ALL_MONSTERS[i], {
        cx,
        cy,
        height: monsterHeight,
        breathPhase: i * 0.2,
        pullLean: 0.6,
      });
    }

    // Raccoon front-center via composite (ear padding matters at small sizes)
    const raccoonSize = Math.min(140, h * 0.25);
    drawRaccoonComposite(ctx, w / 2, h * 0.72, raccoonSize, "neutral");
  };
  render();

  // Ending overlay with two lines + actions, fading in sequentially
  const endUI = document.createElement("div");
  endUI.className = "dtr-ending";
  endUI.innerHTML = `
    <div class="dtr-ending-line1">The monsters don't leave. You do.</div>
    <div class="dtr-ending-line2">Same move. Every time.</div>
    <div class="dtr-ending-actions">
      <a href="#" id="dtr-again">Again</a>
      <a href="/">Explorable Explanations</a>
    </div>
  `;
  (canvas.parentElement ?? document.body).appendChild(endUI);

  const showEl = (selector: string): void => {
    const el = endUI.querySelector<HTMLElement>(selector);
    if (el) el.style.opacity = "1";
  };

  await delay(1500);
  showEl(".dtr-ending-line1");
  await delay(1800);
  showEl(".dtr-ending-line2");
  await delay(2200);
  showEl(".dtr-ending-actions");

  // Wait for "Again" click — the hub link's href handles its own navigation
  await new Promise<void>((resolve) => {
    const again = endUI.querySelector<HTMLAnchorElement>("#dtr-again");
    again?.addEventListener("click", (e) => {
      e.preventDefault();
      if (endUI.parentElement) endUI.parentElement.removeChild(endUI);
      character.el.style.display = "";
      onAgain();
      resolve();
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
