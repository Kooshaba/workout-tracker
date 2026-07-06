import type { Exercise, WorkoutTemplate } from "../types/workout";

const VALID_EXERCISE_TYPES = new Set(["strength", "cardio"]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createId(prefix: string, index: number) {
  return `${prefix}-${Date.now()}-${index}`;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readExerciseType(value: unknown): Exercise["type"] {
  return VALID_EXERCISE_TYPES.has(String(value)) ? (value as Exercise["type"]) : "strength";
}

function normalizeExercise(value: unknown, index: number): Exercise | null {
  if (!isRecord(value)) return null;

  const name = readString(value.name);
  if (!name) return null;

  const supersetId =
    readString(value.supersetId) ||
    readString(value.superset) ||
    readString(value.group) ||
    undefined;

  return {
    id: readString(value.id) || createId("exercise", index),
    name,
    type: readExerciseType(value.type),
    notes: readString(value.notes),
    ...(supersetId ? { supersetId } : {}),
  };
}

function normalizeTemplate(value: unknown, index: number): WorkoutTemplate | null {
  if (!isRecord(value)) return null;

  const name = readString(value.name);
  const rawExercises = Array.isArray(value.exercises) ? value.exercises : [];
  const exercises = rawExercises
    .map((exercise, exerciseIndex) => normalizeExercise(exercise, exerciseIndex))
    .filter((exercise): exercise is Exercise => exercise !== null);

  if (!name || exercises.length === 0) return null;

  return {
    id: readString(value.id) || createId("template", index),
    name,
    exercises,
  };
}

export function normalizeTemplateImport(value: unknown): WorkoutTemplate[] {
  const candidates = isRecord(value) && Array.isArray(value.templates)
    ? value.templates
    : Array.isArray(value)
    ? value
    : [value];

  return candidates
    .map((template, index) => normalizeTemplate(template, index))
    .filter((template): template is WorkoutTemplate => template !== null);
}

export const TEMPLATE_IMPORT_EXAMPLE = `{
  "version": 1,
  "templates": [
    {
      "name": "Upper Body Push/Pull",
      "exercises": [
        {
          "name": "Bench Press",
          "type": "strength",
          "superset": "A"
        },
        {
          "name": "Chest-Supported Row",
          "type": "strength",
          "superset": "A"
        },
        {
          "name": "Bike",
          "type": "cardio"
        }
      ]
    }
  ]
}`;
