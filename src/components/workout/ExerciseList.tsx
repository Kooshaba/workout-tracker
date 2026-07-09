import {
  WorkoutExercise,
  StrengthSet,
  Workout,
  CardioSession,
} from "../../types/workout";
import { useEffect, useRef, useState } from "react";
import { ExerciseItem } from "./ExerciseItem";
import { groupBySuperset, getSupersetIds } from "../../utils/supersetUtils";
import type { SupersetColor } from "../../utils/supersetUtils";
import { useI18n } from "../../i18nContext";
import { formatWorkoutDisplayName } from "../../utils/exerciseUtils";

type Props = {
  exercises: WorkoutExercise[];
  workoutHistory: Workout[];
  onUpdate: (exercises: WorkoutExercise[]) => void;
  onTimerStart: (exerciseName: string) => void;
};

type PendingReorder = {
  pointerId: number;
  element: HTMLElement;
  timeoutId: number;
  cleanup: () => void;
};

type ActiveReorder = {
  pointerId: number;
  element: HTMLElement;
  cleanup: () => void;
};

const LONG_PRESS_REORDER_DELAY_MS = 320;
const LONG_PRESS_MOVE_TOLERANCE_PX = 8;

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const isInteractiveDragTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest("button, a, input, textarea, select, label, option")
  );
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
  const [draggingExerciseIndex, setDraggingExerciseIndex] = useState<
    number | null
  >(
    null
  );
  const [dragOrderIndexes, setDragOrderIndexes] = useState<number[]>([]);
  const [dragPointerY, setDragPointerY] = useState<number | null>(null);
  const dragOrderIndexesRef = useRef<number[]>([]);
  const compactRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pendingReorderRef = useRef<PendingReorder | null>(null);
  const activeReorderRef = useRef<ActiveReorder | null>(null);

  const supersetIds = getSupersetIds(exercises);
  const exerciseGroups = groupBySuperset(exercises);
  const isReordering = draggingExerciseIndex !== null;

  const clearPendingReorder = () => {
    const pendingReorder = pendingReorderRef.current;
    if (!pendingReorder) return;

    window.clearTimeout(pendingReorder.timeoutId);
    pendingReorder.cleanup();
    if (pendingReorder.element.hasPointerCapture(pendingReorder.pointerId)) {
      pendingReorder.element.releasePointerCapture(pendingReorder.pointerId);
    }
    pendingReorderRef.current = null;
  };

  const clearActiveReorder = () => {
    const activeReorder = activeReorderRef.current;
    if (!activeReorder) return;

    activeReorder.cleanup();
    if (activeReorder.element.hasPointerCapture(activeReorder.pointerId)) {
      activeReorder.element.releasePointerCapture(activeReorder.pointerId);
    }
    activeReorderRef.current = null;
  };

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

  useEffect(() => {
    dragOrderIndexesRef.current = dragOrderIndexes;
  }, [dragOrderIndexes]);

  useEffect(() => {
    return () => {
      clearPendingReorder();
      clearActiveReorder();
    };
  }, []);

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

  const startReorder = (
    event: React.PointerEvent<HTMLElement>,
    exerciseIndex: number
  ) => {
    if (event.button !== 0 || exercises.length < 2) return;
    if (isInteractiveDragTarget(event.target)) return;

    event.preventDefault();
    clearPendingReorder();

    const element = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let isActiveReorder = false;

    try {
      element.setPointerCapture(pointerId);
    } catch {
      // Some mobile browsers decline capture for synthetic or interrupted touches.
    }

    const moveDraggedExercise = (pointerY: number) => {
      setDragPointerY(pointerY);

      setDragOrderIndexes((currentIndexes) => {
        const currentIndex = currentIndexes.indexOf(exerciseIndex);
        if (currentIndex === -1) return currentIndexes;

        const indexesWithoutDragged = currentIndexes.filter(
          (index) => index !== exerciseIndex
        );
        const targetIndex = indexesWithoutDragged.reduce(
          (index, nextExerciseIndex) => {
            const row = compactRowRefs.current.get(nextExerciseIndex);
            if (!row) return index;

            const rect = row.getBoundingClientRect();
            return pointerY > rect.top + rect.height / 2 ? index + 1 : index;
          },
          0
        );

        if (targetIndex === currentIndex) return currentIndexes;

        const nextIndexes = reorderItems(
          currentIndexes,
          currentIndex,
          targetIndex
        );
        dragOrderIndexesRef.current = nextIndexes;
        return nextIndexes;
      });
    };

    const cleanupGestureListeners = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };

    const finishReorder = () => {
      const orderedExercises = dragOrderIndexesRef.current
        .map((index) => exercises[index])
        .filter((exercise): exercise is WorkoutExercise => Boolean(exercise));
      const orderChanged = dragOrderIndexesRef.current.some(
        (nextExerciseIndex, orderIndex) => nextExerciseIndex !== orderIndex
      );

      clearPendingReorder();
      clearActiveReorder();
      setDraggingExerciseIndex(null);
      setDragOrderIndexes([]);
      setDragPointerY(null);
      compactRowRefs.current.clear();

      if (orderChanged) {
        onUpdate(orderedExercises);
      }
    };

    const cancelReorder = () => {
      clearPendingReorder();
      clearActiveReorder();
      setDraggingExerciseIndex(null);
      setDragOrderIndexes([]);
      setDragPointerY(null);
      compactRowRefs.current.clear();
    };

    function handlePointerMove(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) return;

      if (isActiveReorder) {
        if (pointerEvent.cancelable) {
          pointerEvent.preventDefault();
        }
        moveDraggedExercise(pointerEvent.clientY);
        return;
      }

      const distance = Math.hypot(
        pointerEvent.clientX - startX,
        pointerEvent.clientY - startY
      );

      if (distance > LONG_PRESS_MOVE_TOLERANCE_PX) {
        cancelReorder();
      }
    }

    function handlePointerEnd(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) return;

      if (isActiveReorder) {
        finishReorder();
      } else {
        cancelReorder();
      }
    }

    function handleTouchMove(touchEvent: TouchEvent) {
      const touch = touchEvent.touches[0];
      if (!touch) return;

      if (isActiveReorder) {
        if (touchEvent.cancelable) {
          touchEvent.preventDefault();
        }
        moveDraggedExercise(touch.clientY);
        return;
      }

      const distance = Math.hypot(touch.clientX - startX, touch.clientY - startY);
      if (distance > LONG_PRESS_MOVE_TOLERANCE_PX) {
        cancelReorder();
      }
    }

    function handleTouchEnd() {
      if (isActiveReorder) {
        finishReorder();
      } else {
        cancelReorder();
      }
    }

    const beginReorder = () => {
      const pendingReorder = pendingReorderRef.current;
      if (!pendingReorder || pendingReorder.pointerId !== pointerId) return;

      const initialOrderIndexes = exercises.map((_, index) => index);
      isActiveReorder = true;
      setDraggingExerciseIndex(exerciseIndex);
      setDragPointerY(startY);
      dragOrderIndexesRef.current = initialOrderIndexes;
      activeReorderRef.current = {
        pointerId,
        element,
        cleanup: cleanupGestureListeners,
      };
      setDragOrderIndexes(initialOrderIndexes);
      pendingReorderRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);

    pendingReorderRef.current = {
      pointerId,
      element,
      timeoutId: window.setTimeout(() => {
        beginReorder();
      }, LONG_PRESS_REORDER_DELAY_MS),
      cleanup: cleanupGestureListeners,
    };
  };

  const registerCompactRow = (exerciseIndex: number) => {
    return (element: HTMLDivElement | null) => {
      if (element) {
        compactRowRefs.current.set(exerciseIndex, element);
      } else {
        compactRowRefs.current.delete(exerciseIndex);
      }
    };
  };

  const renderExerciseItem = (
    exercise: WorkoutExercise,
    exerciseIndex: number,
    options?: {
      supersetColor?: SupersetColor;
      showSupersetControl?: boolean;
    }
  ) => (
    <ExerciseItem
      key={`${exercise.id}-${exerciseIndex}`}
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
      supersetColor={options?.supersetColor}
      showSupersetControl={options?.showSupersetControl}
      animateIn={animatedExerciseIds.includes(exercise.id)}
      animatedSetIndex={
        animatedSet?.exerciseId === exercise.id ? animatedSet.setIndex : null
      }
      onReorderPointerDown={(event) => startReorder(event, exerciseIndex)}
    />
  );

  if (isReordering) {
    const draggedExercise =
      draggingExerciseIndex === null ? null : exercises[draggingExerciseIndex];

    return (
      <div className="relative space-y-2 touch-none select-none">
        {dragOrderIndexes.map((exerciseIndex) => {
          const exercise = exercises[exerciseIndex];
          if (!exercise) return null;

          const isDraggedExercise = exerciseIndex === draggingExerciseIndex;

          return (
            <div
              key={`${exercise.id}-${exerciseIndex}`}
              ref={registerCompactRow(exerciseIndex)}
              className={`flex min-h-12 items-center rounded-lg border px-4 py-3 text-left text-base font-semibold transition-all duration-150 ${
                isDraggedExercise
                  ? "border-sky-500 bg-sky-950/20 text-sky-100 opacity-30"
                  : "border-slate-700 bg-slate-900/80 text-slate-100"
              }`}
            >
              <span className="truncate">
                {formatWorkoutDisplayName(exercise.name)}
              </span>
            </div>
          );
        })}
        {draggedExercise && dragPointerY !== null && (
          <div
            className="pointer-events-none fixed left-4 right-4 z-50 flex min-h-12 -translate-y-1/2 items-center rounded-lg border border-sky-400 bg-sky-950 px-4 py-3 text-left text-base font-semibold text-sky-50 shadow-2xl"
            style={{ top: dragPointerY }}
          >
            <span className="truncate">
              {formatWorkoutDisplayName(draggedExercise.name)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exerciseGroups.map((group) => {
        if (group.kind === "single") {
          return renderExerciseItem(group.item, group.index);
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
              renderExerciseItem(exercise, exerciseIndex, {
                supersetColor: group.color,
                showSupersetControl: false,
              })
            ))}
          </div>
        );
      })}
    </div>
  );
}
