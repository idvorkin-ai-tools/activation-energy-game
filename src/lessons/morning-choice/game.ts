import type { Beat, GameState, SceneUpdate } from "./types";
import { BEATS, PRODUCTIVE_PATH_BEATS, PRODUCTIVE_PATH_ENERGY_GAINS, PRODUCTIVE_PATH_TIME_OFFSETS, STAY_BEAT_INERTIA } from "./beats";
import { createRoomCanvas, renderRoom, stopRoomAnimation, canvasAspect } from "./room";
import { startDragInteraction } from "./drag";
import { EnergyBar } from "./energy-bar";
import { drawRaccoonComposite } from "../../scenes/raccoonComposite";
import { parseTime, formatTime, skyPhaseForTime } from "./time-utils";

export class MorningChoiceGame {
  private canvas: HTMLCanvasElement;
  private energyBar: EnergyBar;
  private narrativeEl: HTMLDivElement;
  private choicesEl: HTMLDivElement;
  private state: GameState;
  private container: HTMLElement;
  private productivePathOverrides: Map<string, { time: string; skyPhase: number }> = new Map();
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

  private isProductivePathBeat(beatId: string): boolean {
    return PRODUCTIVE_PATH_BEATS.has(beatId);
  }

  private async transitionToBeat(beatId: string): Promise<void> {
    stopRoomAnimation();
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

    if (this.isProductivePathBeat(beatId)) {
      const gain = PRODUCTIVE_PATH_ENERGY_GAINS[beatId];
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

    const continueTarget = this.getContinueTarget(beatId);

    // Beats with a continue target get a "Continue" button (except easyChair which auto-advances)
    if (continueTarget && beatId === "easyChair") {
      this.showNarrative(beat);
      setTimeout(() => {
        this.computeGoPathOverrides(continueTarget);
        this.transitionToBeat(continueTarget);
      }, beat.autoAdvanceMs ?? 3000);
      return;
    }

    if (continueTarget) {
      this.showContinueButton(continueTarget);
      this.showNarrative(beat, () => this.revealChoices());
      return;
    }

    // Set up choices (hidden), then show narration which reveals them on complete
    if (beat.productiveChoices) {
      this.showGoChoices(beat);
    } else {
      this.showChoices(beat);
    }

    this.showNarrative(beat, () => this.revealChoices());
  }

  private getContinueTarget(beatId: string): string | null {
    if (beatId === "easyChair") return "reflection";
    if (beatId === "outOfBed") return "shoesOn";
    if (beatId === "atGym") return "postGym";
    if (beatId === "coffeeShop") return "reflection";
    return null;
  }

  private computeGoPathOverrides(beatId: string): void {
    if (!this.state.exitBeatId) return;
    const exitBeat = BEATS[this.state.exitBeatId];
    const offset = PRODUCTIVE_PATH_TIME_OFFSETS[beatId] ?? 0;
    const exitMinutes = parseTime(exitBeat.time);
    const totalMinutes = exitMinutes + offset;
    this.productivePathOverrides.set(beatId, {
      time: formatTime(totalMinutes),
      skyPhase: skyPhaseForTime(totalMinutes),
    });
  }

  private getEffectiveTime(beatId: string): string {
    return this.productivePathOverrides.get(beatId)?.time ?? BEATS[beatId]?.time ?? "";
  }

  private getEffectiveScene(beatId: string): SceneUpdate {
    const beat = BEATS[beatId];
    if (!beat) return BEATS["alarm"].scene;
    const override = this.productivePathOverrides.get(beatId);
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
    if (!beat.productiveChoices) return;

    // Hide buttons initially, show after narration
    this.choicesEl.style.visibility = "hidden";

    for (const choice of beat.productiveChoices) {
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

  private showContinueButton(nextBeatId: string): void {
    this.choicesEl.innerHTML = "";
    this.choicesEl.style.visibility = "hidden";

    const btn = document.createElement("button");
    btn.className = "mc-btn mc-btn-go";
    btn.textContent = "Continue";
    btn.addEventListener("click", () => {
      this.computeGoPathOverrides(nextBeatId);
      this.transitionToBeat(nextBeatId);
    });
    this.choicesEl.appendChild(btn);
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

    const canvasW = this.canvas.getBoundingClientRect().width;
    const canvasH = canvasW * canvasAspect(canvasW);

    cleanup = startDragInteraction({
      canvas: this.canvas,
      startX: canvasW * originalPos.x,
      startY: canvasH * originalPos.y,
      thresholdX: canvasW * 0.6,
      springK: 0.02 + inertia * 0.015,
      onProgress: (x, y) => {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width;
        const h = w * canvasAspect(w);
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
    this.productivePathOverrides.clear();
    // Set energy for go-path scenes
    if (this.isProductivePathBeat(beatId)) {
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
    const canvasSize = 200;

    const reflectionEl = document.createElement("div");
    this.reflectionEl = reflectionEl;
    reflectionEl.className = "mc-reflection";
    reflectionEl.style.cssText = `
      max-width: 600px;
      margin: 24px auto;
      padding: 0 16px;
    `;

    const retryBtn = document.createElement("button");
    retryBtn.className = "mc-retry";

    if (isStayEnd) {
      // Stay path: show side-by-side comparison
      reflectionEl.innerHTML = `
        <div class="mc-reflect-compare">
          <div class="mc-reflect-side">
            <canvas id="reflect-stay" width="${canvasSize}" height="${canvasSize}" style="border-radius:12px;background:#1a1a2e;width:100%;max-width:${canvasSize}px"></canvas>
            <p style="color:#c44;font-size:15px;margin-top:8px;line-height:1.4">Energy: 10<br>9:00 AM in the chair</p>
          </div>
          <div class="mc-reflect-vs">vs</div>
          <div class="mc-reflect-side">
            <canvas id="reflect-go" width="${canvasSize}" height="${canvasSize}" style="border-radius:12px;background:#1a1a2e;width:100%;max-width:${canvasSize}px"></canvas>
            <p style="color:#888;font-size:15px;margin-top:8px;line-height:1.4">What could have been?<br>Try the other path</p>
          </div>
        </div>
        <style>
          .mc-reflect-compare {
            display: flex;
            gap: 20px;
            justify-content: center;
            align-items: flex-start;
            margin-bottom: 16px;
          }
          .mc-reflect-side {
            flex: 1;
            text-align: center;
            max-width: 220px;
          }
          .mc-reflect-vs {
            display: flex;
            align-items: center;
            padding-top: 50px;
            color: #555;
            font-size: 24px;
            font-weight: bold;
          }
          @media (max-width: 500px) {
            .mc-reflect-compare {
              flex-direction: column;
              align-items: center;
              gap: 8px;
            }
            .mc-reflect-side {
              max-width: 160px;
            }
            .mc-reflect-vs {
              padding-top: 0;
              font-size: 18px;
            }
          }
        </style>
      `;
      this.container.insertBefore(reflectionEl, this.narrativeEl);

      const stayCanvas = document.getElementById("reflect-stay") as HTMLCanvasElement;
      drawRaccoonComposite(stayCanvas.getContext("2d")!, canvasSize / 2, canvasSize / 2, canvasSize * 0.8, "desperate");

      const goCanvas = document.getElementById("reflect-go") as HTMLCanvasElement;
      drawRaccoonComposite(goCanvas.getContext("2d")!, canvasSize / 2, canvasSize / 2, canvasSize * 0.8, "neutral");

      retryBtn.textContent = "Try getting up this time?";
    } else {
      // Productive path: single centered raccoon with congratulatory text
      const goEnergy = this.state.energy;
      const goTime = this.getEffectiveTime("coffeeShop");
      const goExpr = goEnergy >= 80 ? "energized" : "happy";

      reflectionEl.innerHTML = `
        <div class="mc-reflect-win">
          <canvas id="reflect-win" width="${canvasSize}" height="${canvasSize}" style="border-radius:12px;background:#1a1a2e;width:100%;max-width:${canvasSize}px"></canvas>
          <p style="color:#e0e0ff;font-size:17px;margin-top:16px;line-height:1.6">
            You did it! Same raccoon, same Saturday — but you chose to start.<br>
            The hard part was the first 30 seconds.
          </p>
          <p style="color:#4a4;font-size:15px;margin-top:8px;line-height:1.4">Energy: ${goEnergy}<br>${goTime} — morning is yours</p>
        </div>
        <style>
          .mc-reflect-win {
            text-align: center;
            margin-bottom: 16px;
          }
          .mc-reflect-win canvas {
            display: block;
            margin: 0 auto;
          }
        </style>
      `;
      this.container.insertBefore(reflectionEl, this.narrativeEl);

      const winCanvas = document.getElementById("reflect-win") as HTMLCanvasElement;
      drawRaccoonComposite(winCanvas.getContext("2d")!, canvasSize / 2, canvasSize / 2, canvasSize * 0.8, goExpr);

      retryBtn.textContent = "Play again?";
    }

    retryBtn.addEventListener("click", () => {
      reflectionEl.remove();
      this.reflectionEl = null;
      this.canvas.style.display = "block";
      this.energyBar.el.style.display = "";
      this.productivePathOverrides.clear();
      this.state = { currentBeatId: "alarm", energy: 70, exitBeatId: null };
      this.enterBeat("alarm");
    });

    setTimeout(() => {
      this.choicesEl.appendChild(retryBtn);
      retryBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 3000);
  }
}
