import type { Beat } from "./types";

export const BEATS: Record<string, Beat> = {
  alarm: {
    id: "alarm",
    time: "6:00 AM",
    energy: 70,
    narration: "Saturday. 6:00 AM. The alarm screams. Your eyes crack open. Everything in your body says: not yet.",
    expression: "tired",
    choices: {
      stay: { label: "5 more minutes", next: "secondAlarm" },
      go: { label: "Get up" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: true,
    },
  },
  secondAlarm: {
    id: "secondAlarm",
    time: "6:15 AM",
    energy: 55,
    narration: "The alarm again. You slap it off. Your body feels heavier than before. Just... a little more.",
    expression: "tired",
    choices: {
      stay: { label: "Just a bit more", next: "lyingAwake" },
      go: { label: "Force yourself up" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0.15,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: true,
    },
  },
  lyingAwake: {
    id: "lyingAwake",
    time: "6:45 AM",
    energy: 40,
    narration: "You're awake now. Fully awake. Staring at the ceiling. Not sleeping. Not up. Just... stuck.",
    expression: "stressed",
    choices: {
      stay: { label: "Check phone", next: "phoneScroll" },
      go: { label: "Come on, get up" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0.35,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
  },
  phoneScroll: {
    id: "phoneScroll",
    time: "7:30 AM",
    energy: 25,
    narration: "You grab your phone. Just to check one thing. An hour evaporates. You didn't even enjoy it.",
    expression: "desperate",
    choices: {
      stay: { label: "Keep scrolling", next: "easyChair" },
      go: { label: "You can do this" },
    },
    scene: {
      raccoonPos: { x: 0.25, y: 0.65, rotation: 90 },
      skyPhase: 0.55,
      showEasyChair: false,
      showPhone: true,
      showAlarmRing: false,
    },
  },
  easyChair: {
    id: "easyChair",
    time: "9:00 AM",
    energy: 10,
    narration: "You drag yourself to the easy chair. Coffee in one hand, phone in the other. The morning is gone.",
    expression: "desperate",
    scene: {
      raccoonPos: { x: 0.4, y: 0.6, rotation: 0 },
      skyPhase: 0.8,
      showEasyChair: true,
      showPhone: true,
      showAlarmRing: false,
    },
    autoAdvanceMs: 3000,
  },
  outOfBed: {
    id: "outOfBed",
    time: "",
    energy: 0,
    narration: "Feet on the floor. That was the hardest part. Already, something shifts.",
    expression: "tired",
    scene: {
      raccoonPos: { x: 0.45, y: 0.7, rotation: 0 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2000,
  },
  shoesOn: {
    id: "shoesOn",
    time: "",
    energy: 0,
    narration: "Shoes on. Door open. The cool air hits your face. You're moving.",
    expression: "neutral",
    scene: {
      raccoonPos: { x: 0.65, y: 0.7, rotation: 0 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2000,
  },
  atGym: {
    id: "atGym",
    time: "",
    energy: 0,
    narration: "At the gym. Your body wakes up. Energy you didn't know you had starts flowing.",
    expression: "energized",
    scene: {
      raccoonPos: { x: 0.5, y: 0.7, rotation: 0 },
      skyPhase: 0,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2000,
  },
  coffeeShop: {
    id: "coffeeShop",
    time: "",
    energy: 0,
    narration: "Coffee shop. Notebook open. The morning is yours. You earned this.",
    expression: "happy",
    scene: {
      raccoonPos: { x: 0.5, y: 0.7, rotation: 0 },
      skyPhase: 1,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
    autoAdvanceMs: 2500,
  },
  reflection: {
    id: "reflection",
    time: "",
    energy: 0,
    narration: "Same raccoon. Same Saturday. Same 70 energy at 6:00 AM.\nThe difference wasn't motivation — it was inertia.\nThe hard part was the first 30 seconds after the alarm.",
    expression: "neutral",
    scene: {
      raccoonPos: { x: 0.5, y: 0.7, rotation: 0 },
      skyPhase: 1,
      showEasyChair: false,
      showPhone: false,
      showAlarmRing: false,
    },
  },
};

export const GO_PATH_ENERGY_GAINS: Record<string, number> = {
  outOfBed: 5,
  shoesOn: 10,
  atGym: 20,
  coffeeShop: 15,
};

export const GO_PATH_TIME_OFFSETS: Record<string, number> = {
  outOfBed: 0,
  shoesOn: 15,
  atGym: 60,
  coffeeShop: 90,
};

export const GO_PATH_ORDER = ["outOfBed", "shoesOn", "atGym", "coffeeShop", "reflection"];

export const STAY_BEAT_INERTIA: Record<string, number> = {
  alarm: 1,
  secondAlarm: 2,
  lyingAwake: 3,
  phoneScroll: 4,
};
