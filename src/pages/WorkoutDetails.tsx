import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { useI18n } from "../i18nContext";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import type { WorkoutExercise } from "../types/workout";
import { groupBySuperset, getSupersetIds } from "../utils/supersetUtils";
import type { SupersetColor } from "../utils/supersetUtils";

export function WorkoutDetails() {
  const { t, dateLocale } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { workouts } = useWorkoutHistory();
  const workout = workouts.find((w) => w.id === id) ?? null;

  if (!workout) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">{t("details.notFound")}</div>
      </div>
    );
  }

  const supersetIds = getSupersetIds(workout.exercises);
  const exerciseGroups = groupBySuperset(workout.exercises);

  const renderExercise = (
    exercise: WorkoutExercise,
    supersetColor?: SupersetColor
  ) => (
    <div
      key={exercise.id}
      className={`border rounded-lg p-4 ${
        supersetColor ? `border-l-4 ${supersetColor.border}` : ""
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Link
          to={`/exercise/${encodeURIComponent(exercise.name)}`}
          className="text-lg font-semibold text-sky-300 transition-colors hover:text-sky-100"
        >
          {exercise.name}
        </Link>
      </div>

      {Array.isArray(exercise.sets) ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-sm font-medium">
            <div>{t("common.set")}</div>
            <div>{t("common.weight")}</div>
            <div>{t("common.reps")}</div>
          </div>
          {exercise.sets.map((set, index) => (
            <div key={index} className="grid grid-cols-3 gap-2">
              <div>{index + 1}</div>
              <div>{set.weight} kg</div>
              <div>{set.reps}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium">{t("common.duration")}</div>
            <div>{exercise.sets.duration} min</div>
          </div>
          <div>
            <div className="text-sm font-medium">{t("common.distance")}</div>
            <div>{exercise.sets.distance} km</div>
          </div>
          <div>
            <div className="text-sm font-medium">{t("common.pace")}</div>
            <div>
              {exercise.sets.duration && exercise.sets.distance
                ? (exercise.sets.duration / exercise.sets.distance).toFixed(2)
                : "0"}{" "}
              min/km
            </div>
          </div>
        </div>
      )}

      {exercise.notes && exercise.notes.trim() !== "" && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm font-medium text-gray-700">
            {t("common.notes")}
          </div>
          <div className="text-gray-600 whitespace-pre-wrap">
            {exercise.notes}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
        >
          ← {t("common.back")}
        </button>
        <h1 className="text-2xl font-bold">{workout.name}</h1>
      </div>

      <div className="text-gray-500">
        {format(new Date(workout.date), "PPpp", { locale: dateLocale })}
      </div>

      {/* Display workout notes if they exist */}
      {workout.notes && workout.notes.trim() !== "" && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-medium text-gray-700 mb-2">
            {t("common.notes")}
          </h2>
          <p className="whitespace-pre-wrap">{workout.notes}</p>
        </div>
      )}

      <div className="space-y-6">
        {exerciseGroups.map((group) => {
          if (group.kind === "single") return renderExercise(group.item);

          const label = t("superset.label", {
            number: supersetIds.indexOf(group.supersetId) + 1,
          });

          return (
            <div
              key={group.supersetId}
              className={`space-y-3 rounded-lg border-l-4 ${group.color.border} ${group.color.bg} p-3`}
            >
              <div className={`text-sm font-semibold ${group.color.text}`}>
                {label}
              </div>
              {group.items.map(({ item }) => renderExercise(item, group.color))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
