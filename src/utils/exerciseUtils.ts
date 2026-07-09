import type { Workout, WorkoutExercise } from "../types/workout";

export const formatWorkoutDisplayName = (name: string) =>
  name.replace(/(^|[\s\-_/[({])(\p{L})/gu, (_match, prefix, letter) => {
    return `${prefix}${letter.toLocaleUpperCase()}`;
  });

export type ExerciseSearchResult = {
  name: string;
  score: number;
  workoutCount: number;
  lastUsedAt: string;
};

type ExerciseSearchStats = {
  name: string;
  normalizedName: string;
  workoutCount: number;
  lastUsedAt: string;
};

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const calculateEditDistance = (left: string, right: string) => {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    for (let rightIndex = 0; rightIndex <= right.length; rightIndex += 1) {
      previous[rightIndex] = current[rightIndex];
    }
  }

  return previous[right.length];
};

const isSubsequence = (query: string, target: string) => {
  let queryIndex = 0;

  for (const character of target) {
    if (character === query[queryIndex]) queryIndex += 1;
    if (queryIndex === query.length) return true;
  }

  return false;
};

const scoreExerciseName = (
  query: string,
  queryTokens: string[],
  exercise: ExerciseSearchStats
) => {
  if (!query) return 0;

  const name = exercise.normalizedName;
  const nameTokens = name.split(" ");
  const acronym = nameTokens.map((token) => token[0]).join("");
  let score = 0;

  if (name === query) score += 180;
  if (name.startsWith(query)) score += 120;
  if (name.includes(query)) score += 90 - name.indexOf(query);
  if (acronym.startsWith(query)) score += 70;

  for (const queryToken of queryTokens) {
    let tokenScore = 0;

    for (const nameToken of nameTokens) {
      if (nameToken === queryToken) tokenScore = Math.max(tokenScore, 80);
      else if (nameToken.startsWith(queryToken))
        tokenScore = Math.max(tokenScore, 62);
      else if (nameToken.includes(queryToken))
        tokenScore = Math.max(tokenScore, 42);
      else {
        const maxDistance = queryToken.length <= 4 ? 1 : 2;
        const distance = calculateEditDistance(queryToken, nameToken);
        if (distance <= maxDistance) {
          tokenScore = Math.max(tokenScore, 36 - distance * 8);
        }
      }
    }

    if (tokenScore === 0 && isSubsequence(queryToken, name)) {
      tokenScore = 18;
    }

    score += tokenScore;
  }

  const fullDistance = calculateEditDistance(query, name);
  const maxFullDistance = Math.max(2, Math.floor(query.length * 0.25));
  if (fullDistance <= maxFullDistance) score += 55 - fullDistance * 8;

  return score;
};

const buildExerciseSearchStats = (workoutHistory: Workout[]) => {
  const exerciseStats = new Map<string, ExerciseSearchStats>();

  workoutHistory.forEach((workout: Workout) => {
    const exercisesSeenInWorkout = new Set<string>();

    workout.exercises.forEach((exercise: WorkoutExercise) => {
      const name = exercise.name.trim();
      if (!name) return;

      const normalizedName = normalizeSearchText(name);
      if (!normalizedName) return;

      const existing = exerciseStats.get(normalizedName);
      const workoutDate = workout.date || "";
      const hasSeenExerciseInWorkout =
        exercisesSeenInWorkout.has(normalizedName);
      exercisesSeenInWorkout.add(normalizedName);

      exerciseStats.set(normalizedName, {
        name:
          !existing || workoutDate >= existing.lastUsedAt ? name : existing.name,
        normalizedName,
        workoutCount:
          (existing?.workoutCount ?? 0) + (hasSeenExerciseInWorkout ? 0 : 1),
        lastUsedAt:
          !existing || workoutDate >= existing.lastUsedAt
            ? workoutDate
            : existing.lastUsedAt,
      });
    });
  });

  return Array.from(exerciseStats.values());
};

export function searchExercises(
  searchTerm: string,
  workoutHistory: Workout[],
  limit = 30
): ExerciseSearchResult[] {
  try {
    const query = normalizeSearchText(searchTerm);
    const queryTokens = query.split(" ").filter(Boolean);
    const exerciseStats = buildExerciseSearchStats(workoutHistory);

    return exerciseStats
      .map((exercise) => {
        const relevanceScore = scoreExerciseName(query, queryTokens, exercise);
        const frequencyScore = Math.min(exercise.workoutCount, 10) * 3;
        const recencyScore = exercise.lastUsedAt ? 6 : 0;

        return {
          name: exercise.name,
          score: relevanceScore + frequencyScore + recencyScore,
          workoutCount: exercise.workoutCount,
          lastUsedAt: exercise.lastUsedAt,
        };
      })
      .filter((result) => !query || result.score > result.workoutCount * 3 + 6)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (right.workoutCount !== left.workoutCount) {
          return right.workoutCount - left.workoutCount;
        }
        if (right.lastUsedAt !== left.lastUsedAt) {
          return right.lastUsedAt.localeCompare(left.lastUsedAt);
        }
        return left.name.localeCompare(right.name);
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error searching exercises:", error);
    return [];
  }
}

export function getSimilarExercises(
  searchTerm: string,
  workoutHistory: Workout[],
  limit = 12
): string[] {
  try {
    return searchExercises(searchTerm, workoutHistory, limit).map(
      (result) => result.name
    );
  } catch (error) {
    console.error("Error getting similar exercises:", error);
    return [];
  }
}
