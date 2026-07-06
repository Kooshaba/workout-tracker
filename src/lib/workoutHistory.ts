import type { Workout } from "../types/workout";

export const WORKOUT_HISTORY_KEY = "workoutHistory";
export const WORKOUT_HISTORY_ROLLBACK_KEY = "workoutHistoryRollback";

type ValidationResult =
  | { ok: true; workouts: Workout[] }
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStrengthSet(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.reps) &&
    isFiniteNumber(value.weight) &&
    typeof value.completed === "boolean"
  );
}

function isCardioSession(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.duration) &&
    isFiniteNumber(value.distance) &&
    isFiniteNumber(value.pace)
  );
}

function isWorkoutExercise(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.exerciseId) &&
    isOptionalString(value.notes) &&
    ((Array.isArray(value.sets) && value.sets.every(isStrengthSet)) ||
      isCardioSession(value.sets))
  );
}

function isWorkout(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.date) &&
    !Number.isNaN(new Date(value.date).getTime()) &&
    isString(value.name) &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutExercise) &&
    isOptionalString(value.notes)
  );
}

export function validateWorkoutHistory(value: unknown): ValidationResult {
  if (!Array.isArray(value)) {
    return { ok: false, reason: "Workout history must be an array." };
  }

  if (!value.every(isWorkout)) {
    return { ok: false, reason: "Workout history contains malformed items." };
  }

  return { ok: true, workouts: value };
}

export function readWorkoutHistory(): Workout[] {
  try {
    const value = window.localStorage.getItem(WORKOUT_HISTORY_KEY);
    if (!value) return [];

    const result = validateWorkoutHistory(JSON.parse(value));
    if (!result.ok) {
      throw new Error(result.reason);
    }

    return result.workouts;
  } catch (error) {
    console.error("Could not read workout history.", error);
    return [];
  }
}

export function writeWorkoutHistory(workouts: Workout[]) {
  window.localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(workouts));
}

export function saveWorkoutHistoryRollback() {
  const current = window.localStorage.getItem(WORKOUT_HISTORY_KEY);
  window.localStorage.setItem(
    WORKOUT_HISTORY_ROLLBACK_KEY,
    current ?? JSON.stringify([])
  );
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
