import type { Beat, GameState, SceneUpdate } from "./types";
import { BEATS, GO_PATH_ORDER, GO_PATH_ENERGY_GAINS, GO_PATH_TIME_OFFSETS, STAY_BEAT_INERTIA } from "./beats";
import { createRoomCanvas, renderRoom } from "./room";
import { startDragInteraction } from "./drag";
import { EnergyBar } from "./energy-bar";
import { drawRaccoon } from "../../characters/drawRaccoon";
import { parseTime, formatTime, skyPhaseForTime } from "./time-utils";

export class MorningChoiceGame {
  private canvas: HTMLCanvasElement;
  private energyBar: EnergyBar;
  private narrativeEl: HTMLDivElement;
  private choicesEl: HTMLDivElement;
  private state: GameState;
  private container: HTMLElement;
  private goPathOverrides: Map<string, { time: string; skyPhase: number }> = new Map();
  private typewriterInterval: ReturnType<typeof setInterval> | null = null;
  private reflectionEl: HTMLDivElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    container.innerHTML = "";
    container.style.padding = "0";

    this.energyBar = new EnergyBar();
    container.appendChild(this.energyBar.el);

    this.canvas = createRoomCanvas(container);

    this.narrativeEl = document.createElement("div");
    this.narrativeEl.className = "mc-narrative";
    container.appendChild(this.narrativeEl);

    this.choicesEl = document.createElement("div");
    this.choicesEl.className = "mc-choices";
    container.appendChild(this.choicesEl);

    const style = document.createElement("style");
    style.textContent = `
      .mc-narrative {
        max-width: 600px;
        margin: 16px auto;
        padding: 0 16px;
        color: #e0e0ff;
        font-size: 18px;
        line-height: 1.6;
        min-height: 60px;
        text-align: center;
      }
      .mc-choices {
        display: flex;
        gap: 16px;
        justify-content: center;
        max-width: 600px;
        margin: 12px auto;
        padding: 0 16px;
      }
      .mc-btn {
        padding: 12px 24px;
        border: 1px solid #555;
        border-radius: 8px;
        background: #2a2a4e;
        color: #e0e0ff;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
        flex: 1;
        max-width: 240px;
      }
      .mc-btn:hover {
        background: #3a3a6e;
        border-color: #888;
      }
      .mc-btn-stay {
        border-color: #664444;
      }
      .mc-btn-stay:hover {
        background: #3a2a2a;
      }
      .mc-btn-go {
        border-color: #446644;
      }
      .mc-btn-go:hover {
        background: #2a3a2a;
      }
      .mc-retry {
        display: block;
        margin: 24px auto;
        padding: 12px 32px;
        border: 1px solid #555;
        border-radius: 8px;
        background: #2a2a4e;
        color: #e0e0ff;
        font-size: 16px;
        cursor: pointer;
      }
      .mc-retry:hover {
        background: #3a3a6e;
      }
    `;
    container.appendChild(style);

    this.state = {
      currentBeatId: "alarm",
      energy: 70,
      exitBeatId: null,
    };

    window.addEventListener("resize", () => this.render());

    this.enterBeat("alarm");
  }

  private isGoPathBeat(beatId: string): boolean {
    return GO_PATH_ORDER.includes(beatId);
  }

  private enterBeat(beatId: string): void {
    const beat = BEATS[beatId];
    if (!beat) return;

    this.state.currentBeatId = beatId;

    if (this.isGoPathBeat(beatId)) {
      const gain = GO_PATH_ENERGY_GAINS[beatId];
      if (gain) {
        this.state.energy = Math.min(100, this.state.energy + gain);
      }
    } else if (beat.energy > 0) {
      this.state.energy = beat.energy;
    }

    this.energyBar.setValue(this.state.energy);
    this.render();
    this.showNarrative(beat);

    if (beatId === "reflection") {
      this.showReflection();
      return;
    }

    this.showChoices(beat);

    if (beat.autoAdvanceMs) {
      if (beatId === "easyChair") {
        setTimeout(() => this.enterBeat("reflection"), beat.autoAdvanceMs);
      } else {
        const nextIdx = GO_PATH_ORDER.indexOf(beatId) + 1;
        if (nextIdx > 0 && nextIdx < GO_PATH_ORDER.length) {
          const nextId = GO_PATH_ORDER[nextIdx];
          this.computeGoPathOverrides(nextId);
          setTimeout(() => this.enterBeat(nextId), beat.autoAdvanceMs);
        }
      }
    }
  }

  private computeGoPathOverrides(beatId: string): void {
    if (!this.state.exitBeatId) return;
    const exitBeat = BEATS[this.state.exitBeatId];
    const offset = GO_PATH_TIME_OFFSETS[beatId] ?? 0;
    const exitMinutes = parseTime(exitBeat.time);
    const totalMinutes = exitMinutes + offset;
    this.goPathOverrides.set(beatId, {
      time: formatTime(totalMinutes),
      skyPhase: skyPhaseForTime(totalMinutes),
    });
  }

  private getEffectiveTime(beatId: string): string {
    return this.goPathOverrides.get(beatId)?.time ?? BEATS[beatId]?.time ?? "";
  }

  private getEffectiveScene(beatId: string): SceneUpdate {
    const beat = BEATS[beatId];
    if (!beat) return BEATS["alarm"].scene;
    const override = this.goPathOverrides.get(beatId);
    if (override) {
      return { ...beat.scene, skyPhase: override.skyPhase };
    }
    return beat.scene;
  }

  private render(): void {
    const beat = BEATS[this.state.currentBeatId];
    if (!beat) return;

    const inertia = STAY_BEAT_INERTIA[this.state.currentBeatId] ?? 0;

    renderRoom(this.canvas, {
      scene: this.getEffectiveScene(this.state.currentBeatId),
      expression: beat.expression,
      time: this.getEffectiveTime(this.state.currentBeatId),
      energy: this.state.energy,
      inertia,
    });
  }

  private showNarrative(beat: Beat): void {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    this.narrativeEl.textContent = "";
    const text = beat.narration;
    let i = 0;
    this.typewriterInterval = setInterval(() => {
      if (i < text.length) {
        this.narrativeEl.textContent += text[i];
        i++;
      } else {
        clearInterval(this.typewriterInterval!);
        this.typewriterInterval = null;
      }
    }, 30);
  }

  private showChoices(beat: Beat): void {
    this.choicesEl.innerHTML = "";

    if (!beat.choices) return;

    const stayBtn = document.createElement("button");
    stayBtn.className = "mc-btn mc-btn-stay";
    stayBtn.textContent = beat.choices.stay.label;
    stayBtn.addEventListener("click", () => {
      this.enterBeat(beat.choices!.stay.next);
    });

    const goBtn = document.createElement("button");
    goBtn.className = "mc-btn mc-btn-go";
    goBtn.textContent = beat.choices.go.label;
    goBtn.addEventListener("click", () => {
      this.state.exitBeatId = this.state.currentBeatId;
      this.startDrag();
    });

    this.choicesEl.appendChild(stayBtn);
    this.choicesEl.appendChild(goBtn);
  }

  startDrag(): void {
    this.choicesEl.innerHTML = "";
    this.narrativeEl.textContent = "Drag yourself out of bed...";

    const beat = BEATS[this.state.currentBeatId];
    const inertia = STAY_BEAT_INERTIA[this.state.currentBeatId] ?? 1;
    const originalPos = { ...beat.scene.raccoonPos };

    let cleanup: (() => void) | null = null;
    let dragPos = { ...originalPos };

    cleanup = startDragInteraction({
      canvas: this.canvas,
      startX: this.canvas.getBoundingClientRect().width * originalPos.x,
      startY: this.canvas.getBoundingClientRect().width * 0.6 * originalPos.y,
      thresholdX: this.canvas.getBoundingClientRect().width * 0.6,
      springK: 0.02 + inertia * 0.015,
      onProgress: (x, y) => {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width;
        const h = w * 0.6;
        const nx = x / w;
        const ny = y / h;
        const startPx = w * originalPos.x;
        const threshPx = w * 0.6;
        const progress = Math.min(1, Math.max(0, (x - startPx) / (threshPx - startPx)));
        const rotation = 90 * (1 - progress);
        dragPos = { x: nx, y: ny, rotation };
        renderRoom(this.canvas, {
          scene: { ...beat.scene, raccoonPos: dragPos },
          expression: beat.expression,
          time: this.getEffectiveTime(this.state.currentBeatId),
          energy: this.state.energy,
          inertia,
        });
      },
      onComplete: () => {
        cleanup?.();
        this.computeGoPathOverrides("outOfBed");
        this.enterBeat("outOfBed");
      },
      onSnapBack: () => {
        dragPos = { ...originalPos };
        this.render();
      },
    });
  }

  private showReflection(): void {
    this.choicesEl.innerHTML = "";
    this.canvas.style.display = "none";

    this.reflectionEl?.remove();

    const isStayEnd = this.state.exitBeatId === null;
    const goEnergy = isStayEnd ? null : this.state.energy;
    const goTime = isStayEnd ? null : this.getEffectiveTime("coffeeShop");

    const reflectionEl = document.createElement("div");
    this.reflectionEl = reflectionEl;
    reflectionEl.className = "mc-reflection";
    reflectionEl.style.cssText = `
      max-width: 600px;
      margin: 16px auto;
      padding: 0 16px;
    `;

    reflectionEl.innerHTML = `
      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:24px">
        <div style="flex:1;text-align:center">
          <canvas id="reflect-stay" width="150" height="150" style="border-radius:8px;background:#1a1a2e"></canvas>
          <p style="color:#c44;font-size:14px;margin-top:8px">Energy: 10<br>9:00 AM in the chair</p>
        </div>
        <div style="flex:1;text-align:center">
          <canvas id="reflect-go" width="150" height="150" style="border-radius:8px;background:#1a1a2e"></canvas>
          <p style="color:#4a4;font-size:14px;margin-top:8px">Energy: ${goEnergy ?? 100}<br>${goTime ?? "7:30 AM"} — morning is yours</p>
        </div>
      </div>
    `;
    this.container.insertBefore(reflectionEl, this.narrativeEl);

    const stayCanvas = document.getElementById("reflect-stay") as HTMLCanvasElement;
    const stayCtx = stayCanvas.getContext("2d")!;
    drawRaccoon(stayCtx, 150, 150, "desperate");

    const goCanvas = document.getElementById("reflect-go") as HTMLCanvasElement;
    const goCtx = goCanvas.getContext("2d")!;
    const goExpr = (goEnergy ?? 100) >= 80 ? "energized" : "happy";
    drawRaccoon(goCtx, 150, 150, goExpr);

    const retryBtn = document.createElement("button");
    retryBtn.className = "mc-retry";
    retryBtn.textContent = "Try again?";
    retryBtn.addEventListener("click", () => {
      reflectionEl.remove();
      this.reflectionEl = null;
      this.canvas.style.display = "block";
      this.goPathOverrides.clear();
      this.state = { currentBeatId: "alarm", energy: 70, exitBeatId: null };
      this.enterBeat("alarm");
    });

    setTimeout(() => {
      this.choicesEl.appendChild(retryBtn);
    }, 3000);
  }
}
