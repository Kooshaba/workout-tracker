import { WorkoutExercise } from "../types/workout";
import { Workout } from "../types/workout";

export function getSimilarExercises(searchTerm: string): string[] {
  try {
    const workoutHistory = JSON.parse(
      localStorage.getItem("workoutHistory") || "[]"
    );
    const exerciseNames = new Set<string>();

    workoutHistory.forEach((workout: Workout) => {
      workout.exercises.forEach((exercise: WorkoutExercise) => {
        console.log(exercise);
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
