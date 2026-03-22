import type { ExpressionName } from "../../characters/expressions";

export interface SceneUpdate {
  raccoonPos: { x: number; y: number; rotation: number };
  skyPhase: number;
  showEasyChair: boolean;
  showPhone: boolean;
  showAlarmRing: boolean;
}

export interface Beat {
  id: string;
  time: string;
  energy: number;
  narration: string;
  expression: ExpressionName;
  choices?: {
    stay: { label: string; next: string };
    go: { label: string };
  };
  scene: SceneUpdate;
  autoAdvanceMs?: number;
}

export interface GameState {
  currentBeatId: string;
  energy: number;
  exitBeatId: string | null;
}
