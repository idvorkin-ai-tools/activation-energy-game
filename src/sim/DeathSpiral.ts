import type { Activity, DailyState, DaySlot, FiberState } from "./types";
import { FIBER_KEYS } from "./types";
import { getActivityById } from "./activities";
import { DaySimulator } from "./DaySimulator";
import { FiberModel } from "./FiberModel";

/**
 * Default daily schedule: workout, work, deep-work, family-time.
 * These are the activities the character *attempts* each day.
 */
const DEFAULT_SCHEDULE_IDS = [
  "morning-workout",
  "going-to-work",
  "deep-work",
  "breakfast-with-family",
];

function buildSchedule(activityIds: string[]): DaySlot[] {
  const slots: DaySlot[] = [];
  let minute = 360; // start at 6am

  for (const id of activityIds) {
    const activity = getActivityById(id);
    if (!activity) continue;
    slots.push({ activity, startMinute: minute });
    minute += activity.duration + 15; // 15 min gap between activities
  }

  return slots;
}

/**
 * When an activity is skipped, weaken the fibers that activity would have
 * strengthened. Each positive fiber effect that is missed weakens that fiber
 * by 1.
 */
function weakenFibersForSkipped(
  fibers: FiberState,
  activity: Activity,
): FiberState {
  let result = { ...fibers };
  for (const key of FIBER_KEYS) {
    const effect = activity.fiberEffects[key];
    if (effect !== undefined && effect > 0) {
      result = FiberModel.weakenFiber(result, key, 1);
    }
  }
  return result;
}

export class DeathSpiral {
  /**
   * Simulate a multi-day spiral.
   * Each day: start with current fibers, compute total willpower from FiberModel,
   * character attempts default activities but skips any whose activation energy
   * exceeds willpower. Skipped activities weaken relevant fibers. TikTok is
   * always affordable (negative starting energy).
   * Apply cascade effects at end of each day.
   */
  simulate(initialFibers: FiberState, days: number): DailyState[] {
    return this._simulate(initialFibers, days, -1, null);
  }

  /**
   * Simulate with an intervention on a specific day.
   * On interventionDay, character forces the interventionActivity regardless
   * of willpower cost.
   */
  simulateWithIntervention(
    initialFibers: FiberState,
    days: number,
    interventionDay: number,
    interventionActivityId: string,
  ): DailyState[] {
    const interventionActivity = getActivityById(interventionActivityId);
    if (!interventionActivity) {
      return this.simulate(initialFibers, days);
    }
    return this._simulate(
      initialFibers,
      days,
      interventionDay,
      interventionActivity,
    );
  }

  private _simulate(
    initialFibers: FiberState,
    days: number,
    interventionDay: number,
    interventionActivity: Activity | null,
  ): DailyState[] {
    const results: DailyState[] = [];
    let fibers = { ...initialFibers };
    const simulator = new DaySimulator();

    for (let day = 0; day < days; day++) {
      const totalWillpower = FiberModel.totalWillpower(fibers);
      const schedule = buildSchedule(DEFAULT_SCHEDULE_IDS);

      // On intervention day, add the intervention activity to the schedule
      if (day === interventionDay && interventionActivity) {
        // Insert it at the beginning of the day
        schedule.unshift({
          activity: interventionActivity,
          startMinute: 330, // 5:30am, before normal schedule
        });
      }

      // Run the day simulation
      const simResult = simulator.simulate(schedule, totalWillpower, fibers);

      // Determine which activities were completed vs skipped
      const completed: string[] = [];
      const skipped: string[] = [];

      // Track which activities had a "start" event (meaning they were started)
      const startedIds = new Set<string>();
      for (const event of simResult.events) {
        if (event.type === "start") {
          startedIds.add(event.activityId);
        }
      }

      for (const slot of schedule) {
        if (startedIds.has(slot.activity.id)) {
          completed.push(slot.activity.id);
        } else {
          skipped.push(slot.activity.id);
        }
      }

      // Weaken fibers for skipped activities
      let dayFibers = simResult.finalFibers;
      for (const skippedId of skipped) {
        const activity = getActivityById(skippedId);
        if (activity) {
          dayFibers = weakenFibersForSkipped(dayFibers, activity);
        }
      }

      // TikTok replaces skipped activities (always affordable due to negative
      // starting energy). If anything was skipped, character falls into TikTok.
      if (skipped.length > 0) {
        const tiktok = getActivityById("tiktok");
        if (tiktok) {
          dayFibers = FiberModel.applyEffects(dayFibers, tiktok.fiberEffects);
          completed.push("tiktok");
        }
      }

      // Apply cascade effects at end of day
      dayFibers = FiberModel.cascadeEffect(dayFibers);

      fibers = dayFibers;

      results.push({
        day,
        fibers: { ...fibers },
        totalWillpower: FiberModel.totalWillpower(fibers),
        activitiesCompleted: completed,
        activitiesSkipped: skipped,
      });
    }

    return results;
  }
}
