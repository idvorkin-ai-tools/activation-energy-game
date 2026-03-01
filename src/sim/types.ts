export interface Activity {
  id: string;
  name: string;
  startingEnergy: number; // negative = addictive pull, positive = effortful
  stoppingEnergy: number; // base cost to stop
  stoppingCurve: "flat" | "natural-end" | "decaying";
  willpowerDelta: number; // net willpower change from doing this activity
  duration: number; // minutes
  fiberEffects: Partial<FiberState>; // which fibers it affects and by how much
  icon: string;
}

export interface FiberState {
  professional: number; // each 0-20
  physical: number;
  emotional: number;
  family: number;
  creative: number;
}

export const FIBER_KEYS: (keyof FiberState)[] = [
  "professional",
  "physical",
  "emotional",
  "family",
  "creative",
];

export const FIBER_COLORS: Record<keyof FiberState, string> = {
  professional: "#3b82f6", // blue
  physical: "#22c55e", // green
  emotional: "#a855f7", // purple
  family: "#f97316", // orange
  creative: "#eab308", // yellow
};

export interface DaySlot {
  activity: Activity;
  startMinute: number; // minutes from midnight (e.g., 360 = 6am)
}

export interface SimEvent {
  time: number;
  type: "start" | "stop" | "transition";
  activityId: string;
  activityName: string;
  willpowerCost: number;
  willpowerAfter: number;
  fibersAfter: FiberState;
}

export interface SimResult {
  events: SimEvent[];
  finalWillpower: number;
  finalFibers: FiberState;
  peakWillpower: number;
  troughWillpower: number;
}

export interface DailyState {
  day: number;
  fibers: FiberState;
  totalWillpower: number;
  activitiesCompleted: string[];
  activitiesSkipped: string[];
}
