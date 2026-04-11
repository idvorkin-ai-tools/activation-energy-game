export type Side = "away" | "towards" | "missed";

export type ScenarioCategory = "obvious-towards" | "obvious-away" | "ambiguous" | "covert";

export interface Scenario {
  id: string;
  text: string;
  category: ScenarioCategory;
  /** The scenario's "default" classification if one exists; null for ambiguous. */
  defaultSide: Side | null;
  /** True if this scenario is designed to trigger reflection beats. */
  ambiguous: boolean;
}

export interface RoutingRecord {
  scenario: Scenario;
  routedAs: Side;
  timeToRouteMs: number;
  /** True if the player marked this "it depends" in a reflection beat. */
  ambivalent: boolean;
  /** True if rerouted during the ending reconsider phase. */
  rerouted: boolean;
}

export type Mode =
  | "intro"
  | "wave1"
  | "wave2"
  | "wave3"
  | "reflection"
  | "ending-fade"
  | "ending-list"
  | "ending-diagram"
  | "ending-lesson"
  | "ending-reconsider"
  | "ending-takeaway";

export interface WaveConfig {
  index: 1 | 2 | 3;
  tileCount: number;
  secondsPerTile: number;
}

export const WAVES: WaveConfig[] = [
  { index: 1, tileCount: 6, secondsPerTile: 4.0 },
  { index: 2, tileCount: 8, secondsPerTile: 3.0 },
  { index: 3, tileCount: 8, secondsPerTile: 2.0 },
];
