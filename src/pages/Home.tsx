import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";
import { Language, useI18n } from "../i18nContext";
import { AuthStatus } from "../components/AuthStatus";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import { formatWorkoutDisplayName } from "../utils/exerciseUtils";

export function Home() {
  const { language, setLanguage, t, dateLocale } = useI18n();
  const { workouts: workoutHistory, deleteWorkout } = useWorkoutHistory();
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );

  const recentWorkouts = [...workoutHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleDeleteWorkout = (workoutId: string) => {
    deleteWorkout(workoutId);
    setShowConfirmDelete(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("app.title")}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-xs font-medium text-gray-500" htmlFor="language">
            {t("language.label")}
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="en">{t("language.english")}</option>
            <option value="ja">{t("language.japanese")}</option>
          </select>
        </div>
      </div>

      <Link
        to="/workout"
        className="inline-flex w-full items-center justify-center rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
      >
        {t("home.newWorkout")}
      </Link>

      <AuthStatus />

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="font-semibold">{t("home.deleteTitle")}</h2>
            <p>{t("home.deleteConfirm")}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDeleteWorkout(showConfirmDelete)}
                className="rounded-xl border border-rose-900/80 bg-rose-950/50 px-4 py-2 font-semibold text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-900/50 active:translate-y-0.5"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("home.recentWorkouts")}</h2>
        {recentWorkouts.length === 0 ? (
          <p className="text-gray-500">{t("home.noWorkouts")}</p>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/workout/${workout.id}`}
                    className="flex-1 transition-colors hover:text-sky-200"
                  >
                    <h3 className="font-semibold">
                      {formatWorkoutDisplayName(workout.name)}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(workout.date), "PP", {
                        locale: dateLocale,
                      })}
                    </span>
                    <div className="text-sm text-gray-600">
                      {t("common.exerciseCount", {
                        count: workout.exercises.length,
                      })}
                    </div>
                    <div className="text-sm">
                      {workout.exercises
                        .map((exercise) =>
                          formatWorkoutDisplayName(exercise.name)
                        )
                        .join(", ")}
                    </div>
                  </Link>
                  <button
                    onClick={() => setShowConfirmDelete(workout.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-900/80 bg-rose-950/50 px-3 py-2 text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-900/50 active:translate-y-0.5"
                    aria-label={t("home.deleteWorkoutLabel")}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
