import type { Scenario } from "./types";
import { ARCADE_PALETTE } from "./palette";

/** Create a tile DOM element for the given scenario. */
export function createTileEl(scenario: Scenario): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cp-tile";
  el.dataset.scenarioId = scenario.id;
  el.innerHTML = `
    <div class="cp-tile-icon"></div>
    <div class="cp-tile-text"></div>
  `;
  el.querySelector<HTMLDivElement>(".cp-tile-text")!.textContent = scenario.text;
  return el;
}

/**
 * Animate a tile falling from startY to endY over durationMs.
 * Returns a cancellation function.
 */
export function animateTileFall(
  el: HTMLDivElement,
  startY: number,
  endY: number,
  durationMs: number,
  onDone: () => void,
): () => void {
  const startTime = performance.now();
  let raf = 0;
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) return;
    const elapsed = now - startTime;
    const t = Math.min(elapsed / durationMs, 1);
    const y = startY + (endY - startY) * t;
    el.style.top = `${y}px`;
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      onDone();
    }
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

/** Inject the tile CSS into the page. Called once by game.ts. */
export function injectTileStyles(): void {
  if (document.getElementById("cp-tile-styles")) return;
  const style = document.createElement("style");
  style.id = "cp-tile-styles";
  style.textContent = `
    .cp-tile {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 320px;
      padding: 18px 22px;
      background: ${ARCADE_PALETTE.tileFill};
      border: 1.5px solid ${ARCADE_PALETTE.tileBorder};
      border-radius: 14px;
      box-shadow: 0 8px 28px rgba(255, 184, 107, 0.12);
      color: ${ARCADE_PALETTE.tileText};
      font-size: 15px;
      line-height: 1.35;
      display: flex;
      align-items: center;
      gap: 12px;
      will-change: top, transform;
    }
    .cp-tile-icon {
      width: 20px; height: 20px;
      flex-shrink: 0;
      border: 1.5px solid ${ARCADE_PALETTE.tileText};
      border-radius: 50%;
      position: relative;
    }
    .cp-tile-icon::after {
      content: "";
      position: absolute;
      left: 50%; top: 5px;
      width: 2px; height: 8px;
      background: ${ARCADE_PALETTE.tileText};
      transform: translateX(-50%);
    }
    .cp-tile-text { flex: 1; }
  `;
  document.head.appendChild(style);
}
