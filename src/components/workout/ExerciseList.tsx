import {
  WorkoutExercise,
  StrengthSet,
  Workout,
  CardioSession,
} from "../../types/workout";
import { useRef } from "react";
import { ExerciseItem } from "./ExerciseItem";

type Props = {
  exercises: WorkoutExercise[];
  onUpdate: (exercises: WorkoutExercise[]) => void;
  onTimerStart: (exerciseName: string) => void;
};

export function ExerciseList({ exercises, onUpdate, onTimerStart }: Props) {
  const lastSetRef = useRef<HTMLInputElement>(null);

  const getLastCompletedSet = (exerciseName: string): StrengthSet | null => {
    const workoutHistory = JSON.parse(
      localStorage.getItem("workoutHistory") || "[]"
    );

    // Find the last workout that had this exercise
    const lastWorkout = workoutHistory
      .sort(
        (a: Workout, b: Workout) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .find((workout: Workout) =>
        workout.exercises.some(
          (e: WorkoutExercise) =>
            e.name === exerciseName &&
            Array.isArray(e.sets) &&
            e.sets.length > 0
        )
      );

    if (!lastWorkout) return null;

    // Find the exercise and get its last set
    const exercise = lastWorkout.exercises.find(
      (e: WorkoutExercise) => e.name === exerciseName
    );
    if (!exercise || !Array.isArray(exercise.sets)) return null;

    return exercise.sets[exercise.sets.length - 1] || null;
  };

  const handleUpdateStrengthSet = (
    exerciseIndex: number,
    set: StrengthSet,
    setIndex: number
  ) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (Array.isArray(exercise.sets)) {
      exercise.sets[setIndex] = set;
      onUpdate(newExercises);
    }
  };

  const handleUpdateCardioSession = (
    exerciseIndex: number,
    session: CardioSession
  ) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (!Array.isArray(exercise.sets)) {
      exercise.sets = session;
      onUpdate(newExercises);
    }
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (Array.isArray(exercise.sets)) {
      // Get the previous exercise's last set if it exists
      const previousExercise =
        exerciseIndex > 0 ? newExercises[exerciseIndex - 1] : null;
      const previousSet =
        previousExercise?.sets && Array.isArray(previousExercise.sets)
          ? previousExercise.sets[previousExercise.sets.length - 1]
          : null;

      // Create a new set with values from:
      // 1. Last set of current exercise (if exists)
      // 2. First set of previous exercise (if exists)
      // 3. Default values
      const newSet: StrengthSet =
        exercise.sets.length > 0
          ? {
              reps: exercise.sets[exercise.sets.length - 1].reps,
              weight: exercise.sets[exercise.sets.length - 1].weight,
              completed: false,
            }
          : previousSet && Array.isArray(previousExercise?.sets)
          ? {
              reps: previousSet.reps,
              weight: previousSet.weight,
              completed: false,
            }
          : {
              reps: 0,
              weight: 0,
              completed: false,
            };

      exercise.sets.push(newSet);
      onUpdate(newExercises);

      // Schedule focus for after the state update
      setTimeout(() => {
        if (lastSetRef.current) {
          lastSetRef.current.focus();
          lastSetRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 0);
    }
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (Array.isArray(exercise.sets)) {
      exercise.sets = exercise.sets.filter((_, index) => index !== setIndex);
      onUpdate(newExercises);
    }
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    const newExercises = exercises.filter(
      (_, index) => index !== exerciseIndex
    );
    onUpdate(newExercises);
  };

  return (
    <div className="space-y-4">
      {exercises.map((exercise, exerciseIndex) => (
        <ExerciseItem
          key={exercise.id}
          exercise={exercise}
          exerciseIndex={exerciseIndex}
          onUpdateStrengthSet={handleUpdateStrengthSet}
          onUpdateCardioSession={handleUpdateCardioSession}
          onAddSet={handleAddSet}
          onRemoveSet={handleRemoveSet}
          onRemoveExercise={handleRemoveExercise}
          onTimerStart={onTimerStart}
          getLastCompletedSet={getLastCompletedSet}
        />
      ))}
    </div>
  );
}
