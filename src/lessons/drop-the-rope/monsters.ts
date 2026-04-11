import type { Monster, MonsterId, RoundConfig } from "./types";

export const MONSTERS: readonly Monster[] = [
  {
    id: "anxiety",
    displayName: "Anxiety",
    taunt: "What if it all falls apart today?",
    accentColor: "#93C5FD", // cold blue
    round: 1,
  },
  {
    id: "self-criticism",
    displayName: "Self-Criticism",
    taunt: "You're still not good enough. You know it.",
    accentColor: "#E8A0A0", // pink
    round: 2,
  },
  {
    id: "shame",
    displayName: "Shame",
    taunt: "Don't let them see what you really are.",
    accentColor: "#8B5CF6", // violet
    round: 3,
  },
  {
    id: "doubt",
    displayName: "Doubt",
    taunt: "Are you sure? Really sure?",
    accentColor: "#5EA5B5", // muted teal (revised from grey in rev 2)
    round: 4,
  },
  {
    id: "anger",
    displayName: "Anger",
    taunt: "They don't get to do this to you.",
    accentColor: "#EF4444", // red
    round: 5,
  },
];

export const ROUND_CONFIGS: readonly RoundConfig[] = [
  { monster: "anxiety",        dropTimerMs: 18000, tauntHoldMs: 2000, tauntFadeMs: 1000, monsterWalkInMs: 1500, captionText: "coffee" },
  { monster: "self-criticism", dropTimerMs: 10000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a swing" },
  { monster: "shame",          dropTimerMs:  6000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a friend" },
  { monster: "doubt",          dropTimerMs:  3000, tauntHoldMs:  800, tauntFadeMs:  700, monsterWalkInMs: 1500, captionText: "a page" },
  { monster: "anger",          dropTimerMs:   500, tauntHoldMs:    0, tauntFadeMs:  300, monsterWalkInMs:  500, captionText: "her"      },
];

export function getMonster(id: MonsterId): Monster {
  const m = MONSTERS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown monster: ${id}`);
  return m;
}

export function getRoundConfig(round: 1 | 2 | 3 | 4 | 5): RoundConfig {
  return ROUND_CONFIGS[round - 1];
}
