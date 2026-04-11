import "../../style.css";
import { Character } from "../../characters/Character";
import { ARCADE_PALETTE } from "./palette";
import { buildRunScenarios } from "./scenarios";
import { createTileEl, animateTileFall, injectTileStyles } from "./tile";
import type { Scenario, Side, RoutingRecord } from "./types";
import { WAVES } from "./types";
import {
  newReflectionState,
  updateReflectionState,
  shouldTriggerReflection,
  showReflectionBeat,
  injectReflectionStyles,
  type ReflectionState,
} from "./reflection";
import { EnergyBar } from "./energy-bar";

/**
 * The Catcher — Choice Point lesson as arcade.
 * Self-contained state machine. See docs/plans/2026-04-11-choice-point-catcher-design.md.
 */
export class CatcherGame {
  private container: HTMLElement;
  private raccoon!: Character;
  private scenarios: Scenario[] = [];
  private scenarioIndex = 0;
  private currentTile: HTMLDivElement | null = null;
  private cancelFall: (() => void) | null = null;
  private routingHistory: RoutingRecord[] = [];
  private tileDropTime = 0;
  private tapHandler: ((e: MouseEvent | TouchEvent) => void) | null = null;
  private lastWaveIndex = 0;
  private reflectionState: ReflectionState = newReflectionState();
  private energyBar!: EnergyBar;

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
    injectTileStyles();

    // Raccoon on its own layer
    const raccoonLayer = this.container.querySelector<HTMLDivElement>(".cp-raccoon-layer")!;
    raccoonLayer.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none";
    this.raccoon = new Character();
    this.raccoon.setExpression("neutral");
    raccoonLayer.appendChild(this.raccoon.el);
    this.positionRaccoonAtDecisionLine();

    // Energy bar at the top of the stage
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    this.energyBar = new EnergyBar();
    this.energyBar.reset();
    stage.insertBefore(this.energyBar.el, stage.firstChild);

    this.scenarios = buildRunScenarios();
    this.scenarioIndex = 0;
    this.lastWaveIndex = 0;
    this.routingHistory = [];
    this.reflectionState = newReflectionState();
    injectReflectionStyles();
    this.attachTapHandlers();
    this.dropNextTile();
  }

  private dropNextTile(): void {
    if (this.scenarioIndex >= this.scenarios.length) {
      this.runEnding();
      return;
    }
    const waveIdx = this.currentWaveIndex();
    if (waveIdx !== this.lastWaveIndex) {
      this.onWaveChange(waveIdx);
      this.lastWaveIndex = waveIdx;
    }
    const scenario = this.scenarios[this.scenarioIndex];
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    const stageRect = stage.getBoundingClientRect();

    const tile = createTileEl(scenario);
    tile.style.top = "-60px";
    stage.appendChild(tile);
    this.currentTile = tile;

    const startY = -60;
    const endY = stageRect.height * 0.6; // decision line
    const secondsPerTile = WAVES[waveIdx].secondsPerTile;

    this.tileDropTime = performance.now();
    this.cancelFall = animateTileFall(tile, startY, endY, secondsPerTile * 1000, () => {
      if (this.currentTile === tile) {
        // Tile was not routed — record as missed
        this.routingHistory.push({
          scenario,
          routedAs: "missed",
          timeToRouteMs: performance.now() - this.tileDropTime,
          ambivalent: false,
          rerouted: false,
        });
        this.energyBar.adjust(-2);
        tile.remove();
        this.currentTile = null;
        this.scenarioIndex++;
        this.dropNextTile();
      }
    });
  }

  private currentWaveIndex(): number {
    if (this.scenarioIndex < WAVES[0].tileCount) return 0;
    if (this.scenarioIndex < WAVES[0].tileCount + WAVES[1].tileCount) return 1;
    return 2;
  }

  private onWaveChange(waveIdx: number): void {
    const label = this.container.querySelector<HTMLSpanElement>(".cp-hud-wave");
    if (label) label.textContent = `WAVE ${waveIdx + 1}`;
    if (waveIdx === 0) this.raccoon.setExpression("neutral");
    else if (waveIdx === 1) this.raccoon.setExpression("tired");
    else this.raccoon.setExpression("stressed");
  }

  private async runEnding(): Promise<void> {
    // Import lazily to keep initial load simple
    const { runEndingSequence } = await import("./ending");
    await runEndingSequence({
      container: this.container,
      history: this.routingHistory,
      raccoon: this.raccoon,
    });
  }

  private attachTapHandlers(): void {
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    this.tapHandler = (e: MouseEvent | TouchEvent) => {
      if (!this.currentTile) return;
      const rect = stage.getBoundingClientRect();
      let clientX: number;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      } else {
        clientX = e.clientX;
      }
      const side: Side = clientX - rect.left < rect.width / 2 ? "away" : "towards";
      this.routeCurrentTile(side);
    };
    stage.addEventListener("click", this.tapHandler as (e: MouseEvent) => void);
  }

  private routeCurrentTile(side: Side): void {
    if (!this.currentTile) return;
    if (this.cancelFall) {
      this.cancelFall();
      this.cancelFall = null;
    }
    const tile = this.currentTile;
    this.currentTile = null;
    const scenario = this.scenarios[this.scenarioIndex];
    const timeToRouteMs = performance.now() - this.tileDropTime;

    this.routingHistory.push({
      scenario,
      routedAs: side,
      timeToRouteMs,
      ambivalent: false,
      rerouted: false,
    });

    // Energy cost: -3 base, -5 extra if fast (under 500ms)
    this.energyBar.adjust(timeToRouteMs < 500 ? -8 : -3);

    // Raccoon lean
    this.leanRaccoon(side);

    // Animate tile into the bin
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    const stageRect = stage.getBoundingClientRect();
    const targetX = side === "away" ? 60 : stageRect.width - 60;
    const targetY = stageRect.height - 80;
    const startLeft = tile.offsetLeft;
    const startTop = tile.offsetTop;
    const startTime = performance.now();
    const duration = 280;

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      tile.style.left = `${startLeft + (targetX - startLeft) * eased}px`;
      tile.style.top = `${startTop + (targetY - startTop) * eased}px`;
      tile.style.opacity = `${1 - t * 0.4}`;
      tile.style.transform = `translateX(-50%) scale(${1 - t * 0.2})`;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        tile.remove();
        this.scenarioIndex++;
        this.resetRaccoonLean();

        // Update reflection state and maybe trigger a beat
        this.reflectionState = updateReflectionState(this.reflectionState, side, timeToRouteMs);
        const trigger = shouldTriggerReflection(this.reflectionState, scenario);
        if (trigger) {
          this.triggerReflectionBeat(scenario, side);
        } else {
          this.dropNextTile();
        }
      }
    };
    requestAnimationFrame(tick);
  }

  private triggerReflectionBeat(scenario: Scenario, side: Side): void {
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    const priorExpression = this.raccoon.getExpression();
    this.raccoon.setExpression("neutral");
    showReflectionBeat({
      stage,
      scenario,
      side,
      onResolve: (outcome) => {
        if (outcome === "depends") {
          const last = this.routingHistory[this.routingHistory.length - 1];
          if (last) last.ambivalent = true;
          this.energyBar.adjust(10);
        } else {
          this.energyBar.adjust(5);
        }
        const overlay = stage.querySelector<HTMLDivElement>(".cp-reflection");
        overlay?.remove();
        this.reflectionState.sinceLastBeat = 0;
        // Restore prior wave-appropriate expression
        this.raccoon.setExpression(priorExpression);
        this.dropNextTile();
      },
    });
  }

  private leanRaccoon(side: Side): void {
    const stage = this.container.querySelector<HTMLDivElement>(".cp-stage")!;
    const rect = stage.getBoundingClientRect();
    const baseX = rect.width / 2;
    const baseY = rect.height * 0.62;
    const offset = side === "away" ? -30 : 30;
    this.raccoon.setPosition(baseX + offset, baseY);
  }

  private resetRaccoonLean(): void {
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
