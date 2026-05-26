import type { Workout, WorkoutExercise } from "../types/workout";

export function getSimilarExercises(
  searchTerm: string,
  workoutHistory: Workout[]
): string[] {
  try {
    const exerciseNames = new Set<string>();

    workoutHistory.forEach((workout: Workout) => {
      workout.exercises.forEach((exercise: WorkoutExercise) => {
        exerciseNames.add(exercise.name.toLowerCase());
      });
    });

    return Array.from(exerciseNames)
      .filter((name) => name.includes(searchTerm.toLowerCase()))
      .slice(0, 5); // Limit to 5 suggestions
  } catch (error) {
    console.error("Error getting similar exercises:", error);
    return [];
  }
}
