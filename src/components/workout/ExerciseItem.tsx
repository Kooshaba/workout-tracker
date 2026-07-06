import {
  WorkoutExercise,
  StrengthSet,
  CardioSession,
} from "../../types/workout";
import type { SupersetColor } from "../../utils/supersetUtils";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18nContext";

type Props = {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  onUpdateStrengthSet: (
    exerciseIndex: number,
    set: StrengthSet,
    setIndex: number
  ) => void;
  onUpdateCardioSession: (
    exerciseIndex: number,
    session: CardioSession
  ) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onTimerStart: (exerciseName: string) => void;
  getLastCompletedSet: (exerciseName: string) => StrengthSet | null;
  onUpdateNotes: (exerciseIndex: number, notes: string) => void;
  onUpdateSuperset: (exerciseIndex: number, supersetId: string) => void;
  supersetIds: string[];
  supersetColor?: SupersetColor;
  showSupersetControl?: boolean;
  animateIn: boolean;
  animatedSetIndex: number | null;
};

export function ExerciseItem({
  exercise,
  exerciseIndex,
  onUpdateStrengthSet,
  onUpdateCardioSession,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onTimerStart,
  getLastCompletedSet,
  onUpdateNotes,
  onUpdateSuperset,
  supersetIds,
  supersetColor,
  showSupersetControl = true,
  animateIn,
  animatedSetIndex,
}: Props) {
  const { t } = useI18n();
  const lastSetRef = useRef<HTMLInputElement>(null);
  const [isExerciseVisible, setIsExerciseVisible] = useState(!animateIn);
  const [visibleAnimatedSetIndex, setVisibleAnimatedSetIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!animateIn) return;

    setIsExerciseVisible(false);
    const frameId = window.requestAnimationFrame(() => {
      setIsExerciseVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [animateIn]);

  useEffect(() => {
    if (animatedSetIndex === null) return;

    setVisibleAnimatedSetIndex(null);
    const frameId = window.requestAnimationFrame(() => {
      setVisibleAnimatedSetIndex(animatedSetIndex);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [animatedSetIndex]);

  const isStrengthExercise = <T extends WorkoutExercise>(
    exercise: T
  ): exercise is T & { sets: StrengthSet[] } => {
    return Array.isArray(exercise.sets);
  };

  const isCardioExercise = <T extends WorkoutExercise>(
    exercise: T
  ): exercise is T & { sets: CardioSession } => {
    return !Array.isArray(exercise.sets);
  };

  const supersetLabel = (supersetId: string) =>
    t("superset.label", { number: supersetIds.indexOf(supersetId) + 1 });

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
        exercise.supersetId ? `border-l-4 ${supersetColor?.border || "border-l-sky-500"}` : ""
      } ${
        animateIn
          ? isExerciseVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
          : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold mr-4">{exercise.name}</h3>
        <div className="flex items-center">
          <div className="flex gap-2 items-center">
            <Link
              to={`/exercise/${encodeURIComponent(exercise.name)}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-900/80 bg-emerald-950/50 px-3 py-2 text-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-900/50 active:translate-y-0.5"
              title={t("exercise.historyTitle")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative top-[-1px]"
              >
                <path
                  d="M2 4H14M2 8H14M2 12H7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <button
              onClick={() => onTimerStart(exercise.name)}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5"
              title={t("exercise.restTitle")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative top-[-1px]"
              >
                <path
                  d="M8 3.5V8L10.5 9.5M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("exercise.rest")}
            </button>
          </div>

          <div className="mx-3 w-px h-6 bg-gray-200" />

          <button
            onClick={() => onRemoveExercise(exerciseIndex)}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-rose-900/80 bg-rose-950/50 px-3 py-2 text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-900/50 active:translate-y-0.5"
            aria-label={t("exercise.removeExerciseLabel")}
          >
            ✕
          </button>
        </div>
      </div>

      {showSupersetControl && (
        <div className="mb-4 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <label
            htmlFor={`superset-${exercise.id}`}
            className="text-sm font-medium text-gray-700"
          >
            {t("superset.title")}
          </label>
          <select
            id={`superset-${exercise.id}`}
            value={exercise.supersetId || ""}
            onChange={(event) =>
              onUpdateSuperset(exerciseIndex, event.target.value)
            }
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">{t("superset.none")}</option>
            {supersetIds.map((supersetId) => (
              <option key={supersetId} value={supersetId}>
                {supersetLabel(supersetId)}
              </option>
            ))}
            <option value="new">{t("superset.new")}</option>
          </select>
        </div>
      )}

      {isStrengthExercise(exercise) && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 text-sm font-medium">
            <div>{t("common.set")}</div>
            <div></div>
            <div>{t("common.weight")}</div>
            <div>{t("common.reps")}</div>
            <div></div>
          </div>

          {exercise.sets.map((set, setIndex) => (
            <div
              key={setIndex}
              className={`grid grid-cols-5 gap-2 items-center transition-all duration-300 ease-out motion-reduce:transition-none ${
                setIndex === animatedSetIndex
                  ? visibleAnimatedSetIndex === animatedSetIndex
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                  : ""
              }`}
            >
              <div>{setIndex + 1}</div>
              <button
                onClick={() => {
                  const lastSet = getLastCompletedSet(exercise.name);
                  if (lastSet) {
                    onUpdateStrengthSet(
                      exerciseIndex,
                      {
                        ...set,
                        weight: lastSet.weight,
                        reps: lastSet.reps,
                      },
                      setIndex
                    );
                  }
                }}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5"
                title={t("exercise.useLastTitle")}
              >
                ↺
              </button>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                pattern="[0-9]*\.?[0-9]*"
                value={set.weight || ""}
                onChange={(e) =>
                  onUpdateStrengthSet(
                    exerciseIndex,
                    {
                      ...set,
                      weight: Number(e.target.value),
                    },
                    setIndex
                  )
                }
                className="border rounded px-2 py-1"
              />
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={set.reps || ""}
                onChange={(e) =>
                  onUpdateStrengthSet(
                    exerciseIndex,
                    {
                      ...set,
                      reps: Number(e.target.value),
                    },
                    setIndex
                  )
                }
                className="border rounded px-2 py-1"
                ref={setIndex === exercise.sets.length - 1 ? lastSetRef : null}
              />
              <button
                onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-rose-900/80 bg-rose-950/50 px-3 py-2 text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-900/50 active:translate-y-0.5"
                aria-label={t("exercise.removeSetLabel")}
              >
                ✕
              </button>
            </div>
          ))}

          <div className="h-4" />

          <button
            onClick={() => onAddSet(exerciseIndex)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2.5 text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative top-[-1px]"
              >
                <path
                  d="M8 1V15M1 8H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("exercise.addSet")}
            </span>
          </button>
        </div>
      )}

      {isCardioExercise(exercise) && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor={`duration-${exercise.id}`}
                className="block text-sm font-medium mb-1"
              >
                {t("common.duration")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    id={`duration-${exercise.id}`}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={Math.floor(exercise.sets.duration) || ""}
                    onChange={(e) => {
                      const minutes = Number(e.target.value);
                      const seconds = exercise.sets.duration
                        ? (exercise.sets.duration % 1) * 60
                        : 0;
                      onUpdateCardioSession(exerciseIndex, {
                        ...exercise.sets,
                        duration: minutes + seconds / 60,
                      });
                    }}
                    className="w-full border rounded px-2 py-1"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    min
                  </span>
                </div>
                <div className="relative">
                  <input
                    id={`duration-seconds-${exercise.id}`}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={Math.round((exercise.sets.duration % 1) * 60) || ""}
                    onChange={(e) => {
                      const minutes = Math.floor(exercise.sets.duration || 0);
                      const seconds = Number(e.target.value);
                      onUpdateCardioSession(exerciseIndex, {
                        ...exercise.sets,
                        duration: minutes + seconds / 60,
                      });
                    }}
                    className="w-full border rounded px-2 py-1"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    sec
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor={`distance-${exercise.id}`}
                className="block text-sm font-medium mb-1"
              >
                {t("common.distance")}
              </label>
              <div className="relative">
                <input
                  id={`distance-${exercise.id}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  pattern="[0-9]*\.?[0-9]*"
                  placeholder="0"
                  value={exercise.sets.distance || ""}
                  onChange={(e) => {
                    onUpdateCardioSession(exerciseIndex, {
                      ...exercise.sets,
                      distance: Number(e.target.value),
                    });
                  }}
                  className="w-full border rounded px-2 py-1"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  km
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("common.pace")}
              </label>
              <div className="border rounded px-2 py-1 bg-gray-50">
                {exercise.sets.duration && exercise.sets.distance
                  ? (exercise.sets.duration / exercise.sets.distance).toFixed(2)
                  : "0"}{" "}
                min/km
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add notes textarea for the exercise */}
      <div className="mt-4 pt-4 border-t">
        <label
          htmlFor={`exercise-notes-${exercise.id}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t("exercise.notes")}
        </label>
        <textarea
          id={`exercise-notes-${exercise.id}`}
          rows={2}
          className="w-full border rounded-lg px-3 py-2"
          placeholder={t("exercise.notesPlaceholder")}
          value={exercise.notes || ""}
          onChange={(e) => onUpdateNotes(exerciseIndex, e.target.value)}
        />
      </div>
    </div>
  );
}
