import { useMemo, useState } from "react";
import { WorkoutExercise, StrengthSet } from "../../types/workout";
import {
  formatWorkoutDisplayName,
  searchExercises,
} from "../../utils/exerciseUtils";
import { useI18n } from "../../i18nContext";
import { useWorkoutHistory } from "../../context/useWorkoutHistory";

type Props = {
  onAddExercise: (
    exercise: WorkoutExercise,
    shouldFocusLastSet?: boolean
  ) => void;
};

export function ExerciseForm({ onAddExercise }: Props) {
  const { t } = useI18n();
  const { workouts } = useWorkoutHistory();
  const [exerciseType, setExerciseType] = useState<"strength" | "cardio">(
    "strength"
  );
  const [exerciseName, setExerciseName] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const pickerResults = useMemo(
    () => searchExercises(pickerSearch, workouts, 80),
    [pickerSearch, workouts]
  );

  const createExercise = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const initialStrengthSet: StrengthSet = {
      reps: 0,
      weight: 0,
      completed: false,
    };

    const exercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: Date.now().toString(),
      name: trimmedName,
      sets:
        exerciseType === "strength"
          ? [initialStrengthSet]
          : {
              duration: 0,
              distance: 0,
              pace: 0,
            },
      notes: "",
    };

    onAddExercise(exercise, true);
    setExerciseName("");
    setPickerSearch("");
    setIsPickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExercise(exerciseName);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExerciseType("strength")}
            className={`flex-1 rounded-xl border px-4 py-2.5 font-semibold transition-all duration-200 ${
              exerciseType === "strength"
                ? "border-sky-800 bg-sky-950/60 text-sky-100"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            {t("exerciseType.strength")}
          </button>
          <button
            type="button"
            onClick={() => setExerciseType("cardio")}
            className={`flex-1 rounded-xl border px-4 py-2.5 font-semibold transition-all duration-200 ${
              exerciseType === "cardio"
                ? "border-sky-800 bg-sky-950/60 text-sky-100"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            {t("exerciseType.cardio")}
          </button>
        </div>

        <div className="relative flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => {
                const nextName = e.target.value;
                setExerciseName(nextName);
                setPickerSearch(nextName);
                if (nextName.trim()) setIsPickerOpen(true);
              }}
              placeholder={t("exercise.namePlaceholder")}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              required
            />
          </div>
        </div>
      </form>

      {isPickerOpen && (
        <div className="fixed inset-0 z-40 flex bg-slate-950 text-slate-100">
          <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-950">
            <div className="sticky top-0 z-10 space-y-3 border-b border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">
                  {t("exercise.searchTitle")}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-semibold text-slate-100 transition-all duration-200 hover:bg-slate-800"
                >
                  {t("common.close")}
                </button>
              </div>
              <input
                type="text"
                value={pickerSearch}
                onChange={(event) => {
                  setPickerSearch(event.target.value);
                  setExerciseName(event.target.value);
                }}
                placeholder={t("exercise.searchPlaceholder")}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => createExercise(pickerSearch)}
                disabled={!pickerSearch.trim()}
                className="w-full rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2.5 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500 disabled:hover:translate-y-0"
              >
                {t("common.add")}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-28">
              {pickerResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {pickerResults.map((result) => (
                    <button
                      key={result.name}
                      type="button"
                      onClick={() => createExercise(result.name)}
                      className="min-h-28 rounded-lg border border-slate-800 bg-slate-900 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-700 hover:bg-slate-800 active:translate-y-0.5"
                    >
                      <span className="block font-semibold text-slate-100">
                        {formatWorkoutDisplayName(result.name)}
                      </span>
                      <span className="mt-2 block text-xs text-slate-400">
                        {t("exercise.usedInWorkouts", {
                          count: result.workoutCount,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
                  {t("exercise.noMatches")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
