import type { Scenario, Side } from "./types";
import { REFLECTION_PALETTE } from "./palette";
import { pickReflectionQuestion } from "./scenarios";

export interface ReflectionState {
  /** Number of same-side routings in a row. */
  sameStreakCount: number;
  /** Which side the streak is on. */
  sameStreakSide: Side | null;
  /** Number of fast routings (<500ms) in a row. */
  fastStreakCount: number;
  /** Scenarios since last reflection beat. */
  sinceLastBeat: number;
}

export function newReflectionState(): ReflectionState {
  return { sameStreakCount: 0, sameStreakSide: null, fastStreakCount: 0, sinceLastBeat: 0 };
}

export function updateReflectionState(
  state: ReflectionState,
  side: Side,
  timeToRouteMs: number,
): ReflectionState {
  const sameStreakCount = state.sameStreakSide === side ? state.sameStreakCount + 1 : 1;
  const fastStreakCount = timeToRouteMs < 500 ? state.fastStreakCount + 1 : 0;
  return {
    sameStreakCount,
    sameStreakSide: side,
    fastStreakCount,
    sinceLastBeat: state.sinceLastBeat + 1,
  };
}

export type ReflectionTrigger = "streak5" | "fast3" | "ambiguous" | "floor" | null;

export function shouldTriggerReflection(
  state: ReflectionState,
  scenario: Scenario,
): ReflectionTrigger {
  if (state.sameStreakCount >= 5) return "streak5";
  if (state.fastStreakCount >= 3) return "fast3";
  if (scenario.ambiguous && Math.random() < 0.6) return "ambiguous";
  if (state.sinceLastBeat >= 8) return "floor";
  return null;
}

export interface ReflectionBeatOptions {
  stage: HTMLElement;
  scenario: Scenario;
  side: Side;
  onResolve: (outcome: "confirmed" | "depends") => void;
}

/** Build the reflection beat DOM. Caller is responsible for adding it to the stage. */
export function showReflectionBeat(opts: ReflectionBeatOptions): HTMLDivElement {
  const question = pickReflectionQuestion(opts.scenario, opts.side as "away" | "towards");
  const overlay = document.createElement("div");
  overlay.className = "cp-reflection";
  overlay.innerHTML = `
    <div class="cp-reflection-tile">${escapeHTML(opts.scenario.text)}</div>
    <div class="cp-reflection-question">${escapeHTML(question)}</div>
    <div class="cp-reflection-buttons">
      <button class="cp-reflection-btn cp-reflection-btn-primary">Yes, that's a ${opts.side} move for me</button>
      <button class="cp-reflection-btn">Actually, it depends.</button>
    </div>
  `;
  const [confirmBtn, dependsBtn] = overlay.querySelectorAll<HTMLButtonElement>(".cp-reflection-btn");
  confirmBtn.addEventListener("click", () => opts.onResolve("confirmed"));
  dependsBtn.addEventListener("click", () => opts.onResolve("depends"));
  opts.stage.appendChild(overlay);
  return overlay;
}

function escapeHTML(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

export function injectReflectionStyles(): void {
  if (document.getElementById("cp-reflection-styles")) return;
  const style = document.createElement("style");
  style.id = "cp-reflection-styles";
  style.textContent = `
    .cp-reflection {
      position: absolute;
      inset: 0;
      background: ${REFLECTION_PALETTE.background};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 60px 32px 40px;
      color: ${REFLECTION_PALETTE.questionText};
      font-family: Georgia, "Source Serif Pro", serif;
      z-index: 10;
    }
    .cp-reflection-tile {
      width: 100%;
      max-width: 360px;
      padding: 24px 22px;
      background: ${REFLECTION_PALETTE.tileFill};
      border: 1.5px solid ${REFLECTION_PALETTE.tileBorder};
      border-radius: 18px;
      text-align: center;
      font-size: 18px;
      line-height: 1.4;
      margin-bottom: 40px;
    }
    .cp-reflection-question {
      text-align: center;
      font-size: 18px;
      font-style: italic;
      line-height: 1.45;
      margin-bottom: 40px;
      max-width: 360px;
    }
    .cp-reflection-buttons {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
      max-width: 360px;
    }
    .cp-reflection-btn {
      padding: 15px 20px;
      background: transparent;
      border: 1.5px solid ${REFLECTION_PALETTE.buttonBorder};
      border-radius: 10px;
      color: ${REFLECTION_PALETTE.buttonText};
      font-family: inherit;
      font-size: 15px;
      cursor: pointer;
    }
    .cp-reflection-btn-primary { border-color: ${REFLECTION_PALETTE.buttonBorderPrimary}; }
    .cp-reflection-btn:hover { background: rgba(255,255,255,0.04); }
  `;
  document.head.appendChild(style);
}
