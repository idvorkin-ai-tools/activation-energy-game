import type { FiberState } from "./types";
import { FIBER_KEYS } from "./types";

/**
 * Adjacency pairs for cascade effects.
 * professional <-> physical <-> emotional <-> family <-> creative
 */
const ADJACENT_PAIRS: [keyof FiberState, keyof FiberState][] = [
  ["professional", "physical"],
  ["physical", "emotional"],
  ["emotional", "family"],
  ["family", "creative"],
];

export class FiberModel {
  /** Sum of all fibers, with coordination bonus when all above 10. */
  static totalWillpower(fibers: FiberState): number {
    const sum = FIBER_KEYS.reduce((s, k) => s + fibers[k], 0);
    const allHealthy = FIBER_KEYS.every((k) => fibers[k] >= 10);
    return allHealthy ? Math.round(sum * 1.1) : sum; // 10% coordination bonus
  }

  /** Apply fiber effects, clamping each to 0-20. */
  static applyEffects(
    fibers: FiberState,
    effects: Partial<FiberState>,
  ): FiberState {
    const result = { ...fibers };
    for (const key of FIBER_KEYS) {
      if (effects[key] !== undefined) {
        result[key] = Math.max(0, Math.min(20, result[key] + effects[key]));
      }
    }
    return result;
  }

  /** Weaken a specific fiber. */
  static weakenFiber(
    fibers: FiberState,
    fiber: keyof FiberState,
    amount: number,
  ): FiberState {
    const result = { ...fibers };
    result[fiber] = Math.max(0, result[fiber] - amount);
    return result;
  }

  /**
   * Cascade effect: when any fiber drops below 5, adjacent fibers lose 1 point.
   * "Adjacent" means: professional<->physical, physical<->emotional,
   * emotional<->family, family<->creative.
   */
  static cascadeEffect(fibers: FiberState): FiberState {
    const result = { ...fibers };
    for (const [a, b] of ADJACENT_PAIRS) {
      if (fibers[a] < 5) {
        result[b] = Math.max(0, result[b] - 1);
      }
      if (fibers[b] < 5) {
        result[a] = Math.max(0, result[a] - 1);
      }
    }
    return result;
  }

  /** Create default healthy fiber state (all at 17). */
  static defaultFibers(): FiberState {
    return {
      professional: 17,
      physical: 17,
      emotional: 17,
      family: 17,
      creative: 17,
    };
  }
}
