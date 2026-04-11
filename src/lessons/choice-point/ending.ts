import type { RoutingRecord } from "./types";
import { REFLECTION_PALETTE } from "./palette";
import { Character } from "../../characters/Character";

export interface EndingOptions {
  container: HTMLElement;
  history: RoutingRecord[];
  raccoon: Character;
  onDone: () => void;
}

/**
 * Runs the full ending sequence: fade → list → diagram → lesson → reconsider → takeaway.
 * Each screen pauses for user interaction.
 */
export async function runEndingSequence(opts: EndingOptions): Promise<void> {
  injectEndingStyles();
  opts.container.innerHTML = `<div class="cp-ending"></div>`;
  const root = opts.container.querySelector<HTMLDivElement>(".cp-ending")!;
  opts.raccoon.setExpression("tired");

  await showListScreen(root, opts.history);
  await showDiagramScreen(root);
  await showLessonScreen(root);
  await showReconsiderScreen(root, opts.history);
  await showTakeawayScreen(root, opts.raccoon);
  opts.onDone();
}

async function showListScreen(root: HTMLDivElement, history: RoutingRecord[]): Promise<void> {
  const towards = history.filter((r) => r.routedAs === "towards");
  const away = history.filter((r) => r.routedAs === "away");
  const missed = history.filter((r) => r.routedAs === "missed");

  root.innerHTML = `
    <div class="cp-ending-inner">
      <p class="cp-ending-lead">Okay. That was fast. Let's slow down.</p>
      <p class="cp-ending-sub">Here's what you sent where.</p>
      <div class="cp-ending-list">
        <div class="cp-ending-col">
          <h3>Away</h3>
          ${away.map((r) => `<div class="cp-ending-item">${escape(r.scenario.text)}</div>`).join("")}
        </div>
        <div class="cp-ending-col">
          <h3>Towards</h3>
          ${towards.map((r) => `<div class="cp-ending-item">${escape(r.scenario.text)}</div>`).join("")}
        </div>
        ${missed.length > 0 ? `
          <div class="cp-ending-col">
            <h3>Didn't choose</h3>
            ${missed.map((r) => `<div class="cp-ending-item">${escape(r.scenario.text)}</div>`).join("")}
          </div>
        ` : ""}
      </div>
      <button class="cp-ending-next">Next</button>
    </div>
  `;
  await waitForClick(root.querySelector<HTMLButtonElement>(".cp-ending-next")!);
}

async function showDiagramScreen(root: HTMLDivElement): Promise<void> {
  root.innerHTML = `
    <div class="cp-ending-inner">
      <p class="cp-ending-lead">Here's what Harris draws in the first session with every client.</p>
      <canvas class="cp-ending-diagram" width="387" height="460"></canvas>
      <p class="cp-ending-caption">difficult situations, thoughts, feelings</p>
      <button class="cp-ending-next">Next</button>
    </div>
  `;
  const canvas = root.querySelector<HTMLCanvasElement>(".cp-ending-diagram")!;
  drawChoicePointDiagram(canvas);
  await waitForClick(root.querySelector<HTMLButtonElement>(".cp-ending-next")!);
}

async function showLessonScreen(root: HTMLDivElement): Promise<void> {
  root.innerHTML = `
    <div class="cp-ending-inner">
      <p class="cp-ending-para">The arcade cheated you. It made you classify by the shape of the activity, not by its function. That's the one thing this diagnostic is trying to teach you NOT to do.</p>
      <p class="cp-ending-para">Any activity can be a towards move or an away move. It's never the form. It's always the function.</p>
      <button class="cp-ending-next">Next</button>
    </div>
  `;
  await waitForClick(root.querySelector<HTMLButtonElement>(".cp-ending-next")!);
}

async function showReconsiderScreen(root: HTMLDivElement, history: RoutingRecord[]): Promise<void> {
  root.innerHTML = `
    <div class="cp-ending-inner">
      <p class="cp-ending-lead">Your routings — no timer, no pressure.</p>
      <div class="cp-reconsider-list">
        ${history.map((r) => `
          <div class="cp-reconsider-item">
            <span class="cp-reconsider-text">${escape(r.scenario.text)}</span>
            <span class="cp-reconsider-side cp-reconsider-${r.routedAs}">${r.routedAs}</span>
          </div>
        `).join("")}
      </div>
      <button class="cp-ending-next">Next</button>
    </div>
  `;
  // Simple click-to-flip: click any item to toggle its routing
  root.querySelectorAll<HTMLDivElement>(".cp-reconsider-item").forEach((item, i) => {
    item.addEventListener("click", () => {
      const r = history[i];
      if (r.routedAs === "missed") return;
      r.routedAs = r.routedAs === "towards" ? "away" : "towards";
      r.rerouted = true;
      const sideEl = item.querySelector<HTMLSpanElement>(".cp-reconsider-side")!;
      sideEl.textContent = r.routedAs;
      sideEl.className = `cp-reconsider-side cp-reconsider-${r.routedAs}`;
    });
  });
  await waitForClick(root.querySelector<HTMLButtonElement>(".cp-ending-next")!);
}

async function showTakeawayScreen(root: HTMLDivElement, raccoon: Character): Promise<void> {
  raccoon.setExpression("happy");
  root.innerHTML = `
    <div class="cp-ending-inner">
      <p class="cp-ending-para cp-ending-question">What's one thing you routed just now that might be either, depending on the day?</p>
      <textarea class="cp-ending-textarea" rows="3" placeholder="(optional)"></textarea>
      <div class="cp-ending-actions">
        <a href="/" class="cp-ending-hublink">← back to the hub</a>
      </div>
    </div>
  `;
  const textarea = root.querySelector<HTMLTextAreaElement>(".cp-ending-textarea")!;
  const saved = localStorage.getItem("choice-point:last-reflection");
  if (saved) textarea.placeholder = `last time: ${saved}`;
  textarea.addEventListener("input", () => {
    if (textarea.value.trim()) {
      localStorage.setItem("choice-point:last-reflection", textarea.value.trim());
    }
  });
}

function drawChoicePointDiagram(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const bottomY = H - 20;
  const leftTopX = 40, rightTopX = W - 40, topY = 50;

  ctx.strokeStyle = "#8a9aa8";
  ctx.lineWidth = 1.5;

  // Left arrow (Away)
  ctx.beginPath();
  ctx.moveTo(W / 2 - 8, bottomY - 24);
  ctx.quadraticCurveTo(W / 2 - 140, H / 2 - 40, leftTopX + 20, topY + 10);
  ctx.stroke();
  const ax = leftTopX + 20, ay = topY + 10;
  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.lineTo(ax + 8, ay + 10);
  ctx.moveTo(ax, ay); ctx.lineTo(ax + 14, ay + 2);
  ctx.stroke();

  // Right arrow (Towards)
  ctx.beginPath();
  ctx.moveTo(W / 2 + 8, bottomY - 24);
  ctx.quadraticCurveTo(W / 2 + 140, H / 2 - 40, rightTopX - 20, topY + 10);
  ctx.stroke();
  const bx = rightTopX - 20, by = topY + 10;
  ctx.beginPath();
  ctx.moveTo(bx, by); ctx.lineTo(bx - 8, by + 10);
  ctx.moveTo(bx, by); ctx.lineTo(bx - 14, by + 2);
  ctx.stroke();

  // Labels
  ctx.font = "italic 15px Georgia, serif";
  ctx.fillStyle = "#d8a0c0";
  ctx.textAlign = "center";
  ctx.fillText("AWAY MOVES", leftTopX + 50, topY - 4);
  ctx.fillStyle = "#7be0b0";
  ctx.fillText("TOWARDS MOVES", rightTopX - 58, topY - 4);

  ctx.font = "italic 11px Georgia, serif";
  ctx.fillStyle = "#8a9aa8";
  ctx.fillText("(hooked)", leftTopX + 50, topY + 32);
  ctx.fillText("(unhooked)", rightTopX - 58, topY + 32);

  ctx.beginPath();
  ctx.arc(W / 2, bottomY - 18, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#a8b5c2";
  ctx.fill();
}

function escape(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function waitForClick(btn: HTMLButtonElement): Promise<void> {
  return new Promise((resolve) => btn.addEventListener("click", () => resolve(), { once: true }));
}

function injectEndingStyles(): void {
  if (document.getElementById("cp-ending-styles")) return;
  const style = document.createElement("style");
  style.id = "cp-ending-styles";
  style.textContent = `
    body.cp-ending-mode { background: ${REFLECTION_PALETTE.background}; }
    .cp-ending {
      position: relative;
      min-height: calc(100vh - 48px);
      background: ${REFLECTION_PALETTE.background};
      color: ${REFLECTION_PALETTE.questionText};
      font-family: Georgia, serif;
      padding: 40px 24px;
    }
    .cp-ending-inner {
      max-width: 560px;
      margin: 0 auto;
      text-align: center;
    }
    .cp-ending-lead { font-size: 20px; font-style: italic; margin-bottom: 24px; line-height: 1.5; }
    .cp-ending-sub { color: #a8b5c2; font-size: 15px; margin-bottom: 32px; }
    .cp-ending-para { font-size: 17px; line-height: 1.6; margin-bottom: 22px; text-align: left; }
    .cp-ending-question { text-align: center; font-style: italic; }
    .cp-ending-list {
      display: flex;
      gap: 20px;
      justify-content: center;
      text-align: left;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .cp-ending-col { flex: 1 1 220px; min-width: 200px; }
    .cp-ending-col h3 { font-size: 13px; letter-spacing: 2px; color: #8a9aa8; margin-bottom: 12px; }
    .cp-ending-item { font-size: 13px; padding: 6px 0; color: #cfd6e0; border-bottom: 1px solid #3a4558; line-height: 1.3; }
    .cp-ending-diagram { display: block; margin: 20px auto; max-width: 100%; }
    .cp-ending-caption { font-size: 13px; color: #8a9aa8; font-style: italic; margin-bottom: 32px; }
    .cp-ending-next {
      margin-top: 24px;
      padding: 14px 36px;
      background: transparent;
      border: 1.5px solid #a8b5c2;
      border-radius: 10px;
      color: #f0efe8;
      font-family: inherit;
      font-size: 14px;
      letter-spacing: 1px;
      cursor: pointer;
    }
    .cp-ending-next:hover { background: rgba(255,255,255,0.05); }
    .cp-reconsider-list { text-align: left; max-width: 420px; margin: 0 auto 32px; }
    .cp-reconsider-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; border-bottom: 1px solid #3a4558; cursor: pointer;
      transition: background 0.15s;
    }
    .cp-reconsider-item:hover { background: #323c4c; }
    .cp-reconsider-text { flex: 1; font-size: 13px; color: #cfd6e0; padding-right: 12px; }
    .cp-reconsider-side {
      font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
      padding: 3px 10px; border: 1px solid; border-radius: 6px;
    }
    .cp-reconsider-towards { color: #7be0b0; border-color: #3a5a4e; }
    .cp-reconsider-away { color: #d8a0c0; border-color: #4a3050; }
    .cp-reconsider-missed { color: #8a9aa8; border-color: #5e6c80; }
    .cp-ending-textarea {
      width: 100%; max-width: 420px; padding: 12px 14px;
      background: #3a4558; border: 1px solid #5e6c80; border-radius: 8px;
      color: #f0efe8; font-family: inherit; font-size: 14px; resize: vertical;
      margin-bottom: 24px;
    }
    .cp-ending-hublink {
      color: #a8b5c2; text-decoration: none;
      border-bottom: 1px solid #5e6c80; padding-bottom: 1px;
    }
  `;
  document.head.appendChild(style);
}
