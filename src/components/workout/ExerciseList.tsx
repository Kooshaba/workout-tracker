import {
  WorkoutExercise,
  StrengthSet,
  Workout,
  CardioSession,
} from "../../types/workout";
import { useEffect, useRef, useState } from "react";
import { ExerciseItem } from "./ExerciseItem";
import { groupBySuperset, getSupersetIds } from "../../utils/supersetUtils";
import { useI18n } from "../../i18nContext";

type Props = {
  exercises: WorkoutExercise[];
  workoutHistory: Workout[];
  onUpdate: (exercises: WorkoutExercise[]) => void;
  onTimerStart: (exerciseName: string) => void;
};

export function ExerciseList({
  exercises,
  workoutHistory,
  onUpdate,
  onTimerStart,
}: Props) {
  const { t } = useI18n();
  const lastSetRef = useRef<HTMLInputElement>(null);
  const previousExerciseIdsRef = useRef<string[]>(exercises.map((exercise) => exercise.id));
  const [animatedExerciseIds, setAnimatedExerciseIds] = useState<string[]>([]);
  const [animatedSet, setAnimatedSet] = useState<{
    exerciseId: string;
    setIndex: number;
  } | null>(null);

  const supersetIds = getSupersetIds(exercises);
  const exerciseGroups = groupBySuperset(exercises);

  useEffect(() => {
    const nextExerciseIds = exercises.map((exercise) => exercise.id);
    const newExerciseIds = nextExerciseIds.filter(
      (id) => !previousExerciseIdsRef.current.includes(id)
    );

    if (newExerciseIds.length > 0) {
      setAnimatedExerciseIds(newExerciseIds);
    }

    previousExerciseIdsRef.current = nextExerciseIds;
  }, [exercises]);

  useEffect(() => {
    if (animatedExerciseIds.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setAnimatedExerciseIds([]);
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [animatedExerciseIds]);

  useEffect(() => {
    if (!animatedSet) return;

    const timeoutId = window.setTimeout(() => {
      setAnimatedSet(null);
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [animatedSet]);

  const getLastCompletedSet = (exerciseName: string): StrengthSet | null => {
    // Find the last workout that had this exercise
    const lastWorkout = [...workoutHistory]
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
      setAnimatedSet({
        exerciseId: exercise.id,
        setIndex: exercise.sets.length - 1,
      });
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

  const handleUpdateExerciseNotes = (exerciseIndex: number, notes: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].notes = notes;
    onUpdate(newExercises);
  };

  const handleUpdateSuperset = (exerciseIndex: number, supersetId: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      supersetId:
        supersetId === "new" ? `superset-${Date.now()}` : supersetId || undefined,
    };
    onUpdate(newExercises);
  };

  const handleUpdateSupersetGroup = (
    currentSupersetId: string,
    nextSupersetId: string
  ) => {
    const resolvedSupersetId =
      nextSupersetId === "new" ? `superset-${Date.now()}` : nextSupersetId;
    onUpdate(
      exercises.map((exercise) =>
        exercise.supersetId === currentSupersetId
          ? { ...exercise, supersetId: resolvedSupersetId || undefined }
          : exercise
      )
    );
  };

  const supersetLabel = (supersetId: string) =>
    t("superset.label", { number: supersetIds.indexOf(supersetId) + 1 });

  return (
    <div className="space-y-4">
      {exerciseGroups.map((group) => {
        if (group.kind === "single") {
          return (
            <ExerciseItem
              key={group.item.id}
              exercise={group.item}
              exerciseIndex={group.index}
              onUpdateStrengthSet={handleUpdateStrengthSet}
              onUpdateCardioSession={handleUpdateCardioSession}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onRemoveExercise={handleRemoveExercise}
              onTimerStart={onTimerStart}
              getLastCompletedSet={getLastCompletedSet}
              onUpdateNotes={handleUpdateExerciseNotes}
              onUpdateSuperset={handleUpdateSuperset}
              supersetIds={supersetIds}
              animateIn={animatedExerciseIds.includes(group.item.id)}
              animatedSetIndex={
                animatedSet?.exerciseId === group.item.id
                  ? animatedSet.setIndex
                  : null
              }
            />
          );
        }

        return (
          <div
            key={group.supersetId}
            className={`space-y-3 rounded-lg border-l-4 ${group.color.border} ${group.color.bg} p-3`}
          >
            <select
              aria-label={t("superset.title")}
              value={group.supersetId}
              onChange={(event) =>
                handleUpdateSupersetGroup(group.supersetId, event.target.value)
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${group.color.badge}`}
            >
              <option value="">{t("superset.none")}</option>
              {supersetIds.map((supersetId) => (
                <option key={supersetId} value={supersetId}>
                  {supersetLabel(supersetId)}
                </option>
              ))}
              <option value="new">{t("superset.new")}</option>
            </select>
            {group.items.map(({ item: exercise, index: exerciseIndex }) => (
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
                onUpdateNotes={handleUpdateExerciseNotes}
                onUpdateSuperset={handleUpdateSuperset}
                supersetIds={supersetIds}
                supersetColor={group.color}
                showSupersetControl={false}
                animateIn={animatedExerciseIds.includes(exercise.id)}
                animatedSetIndex={
                  animatedSet?.exerciseId === exercise.id
                    ? animatedSet.setIndex
                    : null
                }
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
