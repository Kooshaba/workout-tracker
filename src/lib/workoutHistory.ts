import type { Workout } from "../types/workout";

export const WORKOUT_HISTORY_KEY = "workoutHistory";

export function readWorkoutHistory(): Workout[] {
  try {
    const value = window.localStorage.getItem(WORKOUT_HISTORY_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error("Could not read workout history.", error);
    return [];
  }
}

export function writeWorkoutHistory(workouts: Workout[]) {
  window.localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(workouts));
}

export function mergeWorkoutHistory(local: Workout[], remote: Workout[]) {
  const byId = new Map<string, Workout>();

  for (const workout of [...remote, ...local]) {
    const existing = byId.get(workout.id);
    if (!existing || new Date(workout.date) >= new Date(existing.date)) {
      byId.set(workout.id, workout);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
