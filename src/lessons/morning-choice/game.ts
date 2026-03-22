import type { Beat, GameState, SceneUpdate } from "./types";
import { BEATS, GO_PATH_BEATS, GO_PATH_ENERGY_GAINS, GO_PATH_TIME_OFFSETS, STAY_BEAT_INERTIA } from "./beats";
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
    return GO_PATH_BEATS.has(beatId);
  }

  private async transitionToBeat(beatId: string): Promise<void> {
    this.narrativeEl.style.transition = "opacity 0.4s";
    this.choicesEl.style.transition = "opacity 0.4s";
    this.narrativeEl.style.opacity = "0";
    this.choicesEl.style.opacity = "0";

    await new Promise(r => setTimeout(r, 400));
    this.enterBeat(beatId);
    this.narrativeEl.style.opacity = "1";
    this.choicesEl.style.opacity = "1";
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
    this.energyBar.setTime(this.getEffectiveTime(beatId));
    this.render();

    if (beatId === "reflection") {
      this.showNarrative(beat);
      this.showReflection();
      return;
    }

    // Set up choices (hidden), then show narration which reveals them on complete
    if (beat.goChoices) {
      this.showGoChoices(beat);
    } else {
      this.showChoices(beat);
    }

    this.showNarrative(beat, () => this.revealChoices());

    // Auto-advance
    if (beat.autoAdvanceMs) {
      const autoTarget = this.getAutoAdvanceTarget(beatId);
      if (autoTarget) {
        this.computeGoPathOverrides(autoTarget);
        setTimeout(() => this.transitionToBeat(autoTarget), beat.autoAdvanceMs);
      }
    }
  }

  private getAutoAdvanceTarget(beatId: string): string | null {
    if (beatId === "easyChair") return "reflection";
    if (beatId === "outOfBed") return "shoesOn";
    if (beatId === "atGym") return "postGym";
    if (beatId === "coffeeShop") return "reflection";
    return null;
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

  private showNarrative(beat: Beat, onComplete?: () => void): void {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    this.narrativeEl.textContent = "";
    const text = beat.narration;
    let i = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (this.typewriterInterval) {
        clearInterval(this.typewriterInterval);
        this.typewriterInterval = null;
      }
      this.narrativeEl.textContent = text;
      onComplete?.();
    };

    // Click to skip typewriter
    const skipHandler = () => {
      finish();
      this.narrativeEl.removeEventListener("click", skipHandler);
    };
    this.narrativeEl.addEventListener("click", skipHandler);
    this.narrativeEl.style.cursor = "pointer";

    this.typewriterInterval = setInterval(() => {
      if (i < text.length) {
        this.narrativeEl.textContent += text[i];
        i++;
      } else {
        finish();
        this.narrativeEl.removeEventListener("click", skipHandler);
        this.narrativeEl.style.cursor = "";
      }
    }, 30);
  }

  private showChoices(beat: Beat): void {
    this.choicesEl.innerHTML = "";
    if (!beat.choices) return;

    // Hide buttons initially, show after narration
    this.choicesEl.style.visibility = "hidden";

    const stayBtn = document.createElement("button");
    stayBtn.className = "mc-btn mc-btn-stay";
    stayBtn.textContent = beat.choices.stay.label;
    stayBtn.addEventListener("click", () => {
      this.transitionToBeat(beat.choices!.stay.next);
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

  private showGoChoices(beat: Beat): void {
    this.choicesEl.innerHTML = "";
    if (!beat.goChoices) return;

    // Hide buttons initially, show after narration
    this.choicesEl.style.visibility = "hidden";

    for (const choice of beat.goChoices) {
      const btn = document.createElement("button");
      btn.className = "mc-btn";
      if (choice.energyDelta && choice.energyDelta < 0) {
        btn.classList.add("mc-btn-stay");
      } else {
        btn.classList.add("mc-btn-go");
      }
      btn.textContent = choice.label;
      btn.addEventListener("click", () => {
        if (choice.energyDelta) {
          this.state.energy = Math.max(0, Math.min(100, this.state.energy + choice.energyDelta));
          this.energyBar.setValue(this.state.energy);
        }
        this.computeGoPathOverrides(choice.next);
        this.transitionToBeat(choice.next);
      });
      this.choicesEl.appendChild(btn);
    }
  }

  private revealChoices(): void {
    this.choicesEl.style.visibility = "visible";
  }

  startDrag(): void {
    this.choicesEl.innerHTML = "";
    // Clear any running typewriter before setting new text
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }
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
        this.transitionToBeat("outOfBed");
      },
      onSnapBack: () => {
        dragPos = { ...originalPos };
        this.render();
      },
    });
  }

  jumpToBeat(beatId: string): void {
    // Clean up reflection if showing
    this.reflectionEl?.remove();
    this.reflectionEl = null;
    this.canvas.style.display = "block";
    this.goPathOverrides.clear();
    // Set energy for go-path scenes
    if (this.isGoPathBeat(beatId)) {
      this.state.exitBeatId = "alarm";
      this.computeGoPathOverrides(beatId);
    }
    this.enterBeat(beatId);
  }

  private showReflection(): void {
    this.choicesEl.innerHTML = "";
    this.canvas.style.display = "none";
    this.energyBar.el.style.display = "none";

    this.reflectionEl?.remove();

    const isStayEnd = this.state.exitBeatId === null;
    const goEnergy = isStayEnd ? null : this.state.energy;
    const goTime = isStayEnd ? null : this.getEffectiveTime("coffeeShop");

    const reflectionEl = document.createElement("div");
    this.reflectionEl = reflectionEl;
    reflectionEl.className = "mc-reflection";
    reflectionEl.style.cssText = `
      max-width: 600px;
      margin: 24px auto;
      padding: 0 16px;
    `;

    const goLabel = goEnergy != null
      ? `Energy: ${goEnergy}<br>${goTime} — morning is yours`
      : `What could have been?<br>Try the other path`;
    const goLabelColor = goEnergy != null ? "#4a4" : "#888";
    const canvasSize = 200;

    reflectionEl.innerHTML = `
      <div style="display:flex;gap:24px;justify-content:center;align-items:flex-start;margin-bottom:20px">
        <div style="flex:1;text-align:center;max-width:220px">
          <canvas id="reflect-stay" width="${canvasSize}" height="${canvasSize}" style="border-radius:12px;background:#1a1a2e;width:100%;max-width:${canvasSize}px"></canvas>
          <p style="color:#c44;font-size:15px;margin-top:10px;line-height:1.4">Energy: 10<br>9:00 AM in the chair</p>
        </div>
        <div style="display:flex;align-items:center;padding-top:60px;color:#555;font-size:24px;font-weight:bold">vs</div>
        <div style="flex:1;text-align:center;max-width:220px">
          <canvas id="reflect-go" width="${canvasSize}" height="${canvasSize}" style="border-radius:12px;background:#1a1a2e;width:100%;max-width:${canvasSize}px"></canvas>
          <p style="color:${goLabelColor};font-size:15px;margin-top:10px;line-height:1.4">${goLabel}</p>
        </div>
      </div>
    `;
    this.container.insertBefore(reflectionEl, this.narrativeEl);

    const stayCanvas = document.getElementById("reflect-stay") as HTMLCanvasElement;
    drawRaccoon(stayCanvas.getContext("2d")!, canvasSize, canvasSize, "desperate");

    const goCanvas = document.getElementById("reflect-go") as HTMLCanvasElement;
    const goExpr = goEnergy != null
      ? ((goEnergy >= 80) ? "energized" : "happy")
      : "neutral";
    drawRaccoon(goCanvas.getContext("2d")!, canvasSize, canvasSize, goExpr);

    const retryBtn = document.createElement("button");
    retryBtn.className = "mc-retry";
    retryBtn.textContent = isStayEnd ? "Try getting up this time?" : "Try again?";
    retryBtn.addEventListener("click", () => {
      reflectionEl.remove();
      this.reflectionEl = null;
      this.canvas.style.display = "block";
      this.energyBar.el.style.display = "";
      this.goPathOverrides.clear();
      this.state = { currentBeatId: "alarm", energy: 70, exitBeatId: null };
      this.enterBeat("alarm");
    });

    setTimeout(() => {
      this.choicesEl.appendChild(retryBtn);
    }, 3000);
  }
}
