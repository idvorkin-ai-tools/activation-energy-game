/** Canonical monster identifiers — index into MONSTERS data */
export type MonsterId = "anxiety" | "self-criticism" | "shame" | "doubt" | "anger";

/** Static config for a single monster (data, not rendering) */
export interface Monster {
  id: MonsterId;
  displayName: string;
  taunt: string;
  accentColor: string; // e.g. "#93C5FD"
  round: 1 | 2 | 3 | 4 | 5;
}

/** Static per-round timing config */
export interface RoundConfig {
  monster: MonsterId;
  dropTimerMs: number; // time from rope-taut to drop-button-appearing
  tauntHoldMs: number; // how long the taunt bubble stays fully visible
  tauntFadeMs: number; // how long the fade-in + fade-out each take
  monsterWalkInMs: number; // arrival animation duration
  captionText: string; // one-word caption shown 2s after raccoon arrives at valued scene
}

/** State machine phase of a single round */
export type RoundPhase =
  | "arriving" // monster walks in + taunt fades up
  | "struggling" // rope taut, player taps, desaturation fading in
  | "buttonVisible" // same as struggling + button is now fadeable
  | "dropping" // button clicked; rope goes slack
  | "walking" // raccoon walks past monster
  | "valued"; // arrived at post-drop scene

/** State machine phase of the whole game */
export type GamePhase = "intro" | "round" | "gallery" | "done";

/** Live state */
export interface GameState {
  phase: GamePhase;
  currentRound: 1 | 2 | 3 | 4 | 5 | null;
  roundPhase: RoundPhase | null;
}
