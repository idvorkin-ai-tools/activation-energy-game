import type { Activity, DaySlot, FiberState, SimEvent, SimResult } from "./types";
import { FIBER_KEYS } from "./types";
import { FiberModel } from "./FiberModel";

export class DaySimulator {
  /**
   * Simulate a day given a schedule of activities.
   * For each transition: activation cost = getStoppingEnergy(current) + next.startingEnergy
   * If willpower < activation cost, activity is skipped (but time still passes).
   * Apply willpowerDelta and fiberEffects after completing each activity.
   */
  simulate(
    schedule: DaySlot[],
    initialWillpower: number,
    initialFibers: FiberState,
  ): SimResult {
    const events: SimEvent[] = [];
    let willpower = initialWillpower;
    let fibers = { ...initialFibers };
    let peakWillpower = willpower;
    let troughWillpower = willpower;

    // Sort schedule by start time
    const sorted = [...schedule].sort((a, b) => a.startMinute - b.startMinute);

    let currentActivity: Activity | null = null;
    let currentStartMinute = 0;

    for (let i = 0; i < sorted.length; i++) {
      const slot = sorted[i];
      const next = slot.activity;

      // Compute time spent in current activity
      const timeInCurrent =
        currentActivity !== null ? slot.startMinute - currentStartMinute : 0;

      // Compute activation energy for the transition
      const activationCost = this.computeActivationEnergy(
        currentActivity,
        next,
        timeInCurrent,
      );

      if (willpower < activationCost) {
        // Not enough willpower to switch — skip this activity
        events.push({
          time: slot.startMinute,
          type: "transition",
          activityId: next.id,
          activityName: next.name,
          willpowerCost: activationCost,
          willpowerAfter: willpower,
          fibersAfter: { ...fibers },
        });
        // Don't update currentActivity — character stays in whatever they were doing
        // (or idle if nothing)
        continue;
      }

      // Deduct activation cost
      willpower -= activationCost;
      troughWillpower = Math.min(troughWillpower, willpower);

      // Record stop event for previous activity (if any)
      if (currentActivity !== null) {
        events.push({
          time: slot.startMinute,
          type: "stop",
          activityId: currentActivity.id,
          activityName: currentActivity.name,
          willpowerCost: this.getStoppingEnergy(currentActivity, timeInCurrent),
          willpowerAfter: willpower,
          fibersAfter: { ...fibers },
        });
      }

      // Record start event for new activity
      events.push({
        time: slot.startMinute,
        type: "start",
        activityId: next.id,
        activityName: next.name,
        willpowerCost: Math.max(0, next.startingEnergy),
        willpowerAfter: willpower,
        fibersAfter: { ...fibers },
      });

      // Activity is now running
      currentActivity = next;
      currentStartMinute = slot.startMinute;

      // Apply willpowerDelta and fiberEffects upon completing the activity
      willpower += next.willpowerDelta;
      fibers = FiberModel.applyEffects(fibers, next.fiberEffects);

      peakWillpower = Math.max(peakWillpower, willpower);
      troughWillpower = Math.min(troughWillpower, willpower);
    }

    return {
      events,
      finalWillpower: willpower,
      finalFibers: fibers,
      peakWillpower,
      troughWillpower,
    };
  }

  /**
   * Get stopping energy based on curve type and time spent.
   * - flat: constant stoppingEnergy
   * - natural-end: stoppingEnergy * (1 - timeSpent/duration), min 0
   *   (drops to 0 at end)
   * - decaying: stoppingEnergy * exp(-timeSpent / (duration * 0.5))
   *   (exponential decay)
   */
  getStoppingEnergy(activity: Activity, timeSpentMinutes: number): number {
    switch (activity.stoppingCurve) {
      case "flat":
        return activity.stoppingEnergy;

      case "natural-end": {
        const ratio = Math.min(1, timeSpentMinutes / activity.duration);
        return Math.max(0, activity.stoppingEnergy * (1 - ratio));
      }

      case "decaying": {
        const halfLife = activity.duration * 0.5;
        return activity.stoppingEnergy * Math.exp(-timeSpentMinutes / halfLife);
      }
    }
  }

  /**
   * Compute activation energy to switch from current to next activity.
   * If current is null (first activity of day), stopping cost is 0.
   */
  computeActivationEnergy(
    current: Activity | null,
    next: Activity,
    timeInCurrent: number,
  ): number {
    const stoppingCost =
      current !== null ? this.getStoppingEnergy(current, timeInCurrent) : 0;
    return stoppingCost + next.startingEnergy;
  }
}
