import { useState } from "react";
import { WorkoutTemplate } from "../../types/workout";
import { useI18n } from "../../i18nContext";
import { groupBySuperset, getSupersetIds } from "../../utils/supersetUtils";

type Props = {
  template: WorkoutTemplate;
  onSave: (template: WorkoutTemplate) => void;
  onCancel: () => void;
};

export function TemplateEditor({ template, onSave, onCancel }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(template.name);
  const [exercises, setExercises] = useState(template.exercises);

  const supersetIds = getSupersetIds(exercises);
  const exerciseGroups = groupBySuperset(exercises);

  const supersetLabel = (supersetId: string) =>
    t("superset.label", { number: supersetIds.indexOf(supersetId) + 1 });

  const updateSuperset = (index: number, supersetId: string) => {
    setExercises((currentExercises) =>
      currentExercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              supersetId:
                supersetId === "new"
                  ? `superset-${Date.now()}`
                  : supersetId || undefined,
            }
          : exercise
      )
    );
  };

  const updateSupersetGroup = (
    currentSupersetId: string,
    nextSupersetId: string
  ) => {
    const resolvedSupersetId =
      nextSupersetId === "new" ? `superset-${Date.now()}` : nextSupersetId;

    setExercises((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.supersetId === currentSupersetId
          ? { ...exercise, supersetId: resolvedSupersetId || undefined }
          : exercise
      )
    );
  };

  const handleSave = () => {
    onSave({
      ...template,
      name,
      exercises: exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        type: exercise.type,
        notes: exercise.notes || "",
        supersetId: exercise.supersetId,
      })),
    });
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
        <h2 className="font-semibold">{t("templates.editTitle")}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("templates.name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {t("common.exercises")}
          </label>
          {exerciseGroups.map((group) => {
            const renderExercise = (
              exercise: (typeof exercises)[number],
              index: number,
              showSupersetControl = true
            ) => (
              <div key={exercise.id} className="space-y-2 p-2 border rounded">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {t(`exerciseType.${exercise.type}`)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeExercise(index)}
                    className="text-rose-300 transition-colors hover:text-rose-100"
                  >
                    {t("common.remove")}
                  </button>
                </div>
                {showSupersetControl && (
                  <>
                    <label className="block text-xs font-medium text-gray-600">
                      {t("superset.title")}
                    </label>
                    <select
                      value={exercise.supersetId || ""}
                      onChange={(event) =>
                        updateSuperset(index, event.target.value)
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
                  </>
                )}
              </div>
            );

            if (group.kind === "single") {
              return renderExercise(group.item, group.index);
            }

            return (
              <div
                key={group.supersetId}
                className={`space-y-2 rounded-lg border-l-4 ${group.color.border} ${group.color.bg} p-2`}
              >
                <select
                  aria-label={t("superset.title")}
                  value={group.supersetId}
                  onChange={(event) =>
                    updateSupersetGroup(group.supersetId, event.target.value)
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
                {group.items.map(({ item, index }) =>
                  renderExercise(item, index, false)
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
          >
            {t("templates.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
