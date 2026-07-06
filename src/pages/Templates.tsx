import { useRef, useState } from "react";
import type { Workout, WorkoutTemplate } from "../types/workout";
import { TemplateEditor } from "../components/workout/TemplateEditor";
import { useI18n } from "../i18nContext";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import {
  normalizeTemplateImport,
  TEMPLATE_IMPORT_EXAMPLE,
} from "../lib/templateImport";
import { groupBySuperset, getSupersetIds } from "../utils/supersetUtils";

export function Templates() {
  const { t } = useI18n();
  const { workouts } = useWorkoutHistory();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() =>
    JSON.parse(localStorage.getItem("workoutTemplates") || "[]")
  );
  const [showWorkoutSelect, setShowWorkoutSelect] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState(TEMPLATE_IMPORT_EXAMPLE);
  const [editingTemplate, setEditingTemplate] =
    useState<WorkoutTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistTemplates = (nextTemplates: WorkoutTemplate[]) => {
    setTemplates(nextTemplates);
    localStorage.setItem("workoutTemplates", JSON.stringify(nextTemplates));
  };

  const saveTemplate = (template: WorkoutTemplate) => {
    let newTemplates: WorkoutTemplate[];
    const existingTemplate = templates.find((t) => t.id === template.id);
    if (existingTemplate) {
      const updatedTemplates = templates.map((t) =>
        t.id === template.id ? template : t
      );
      newTemplates = updatedTemplates;
    } else {
      newTemplates = [...templates, template];
    }
    persistTemplates(newTemplates);
    setEditingTemplate(null);
  };

  const createTemplateFromWorkout = (workout: Workout) => {
    const template: WorkoutTemplate = {
      id: Date.now().toString(),
      name: t("templates.fromWorkout", { name: workout.name }),
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        type: Array.isArray(exercise.sets) ? "strength" : "cardio",
        notes: exercise.notes,
        supersetId: exercise.supersetId,
      })),
    };
    setEditingTemplate(template);
    setShowWorkoutSelect(false);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    persistTemplates(updatedTemplates);
  };

  const importTemplates = (jsonText: string) => {
    try {
      const importedTemplates = normalizeTemplateImport(JSON.parse(jsonText));
      if (importedTemplates.length === 0) {
        alert(t("templates.importEmpty"));
        return;
      }

      persistTemplates([...templates, ...importedTemplates]);
      setShowImport(false);
      setImportText(TEMPLATE_IMPORT_EXAMPLE);
      alert(t("templates.importSuccess", { count: importedTemplates.length }));
    } catch (error) {
      alert(t("templates.importError"));
      console.error(error);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      importTemplates(String(readerEvent.target?.result || ""));
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold">{t("templates.title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5"
          >
            {t("common.import")}
          </button>
          <button
            onClick={() => setShowWorkoutSelect(true)}
            className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
          >
            {t("templates.create")}
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json,application/json"
        className="hidden"
      />

      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4">
            <h2 className="font-semibold">{t("templates.importTitle")}</h2>
            <p className="text-sm text-gray-600">
              {t("templates.importHelp")}
            </p>
            <textarea
              className="w-full h-80 border rounded-lg p-2 font-mono text-sm"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                {t("templates.chooseFile")}
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => importTemplates(importText)}
                className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
              >
                {t("common.import")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkoutSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="font-semibold">{t("templates.selectWorkout")}</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => createTemplateFromWorkout(workout)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  {workout.name} (
                  {t("common.exerciseCount", {
                    count: workout.exercises.length,
                  })}
                  )
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWorkoutSelect(false)}
              className="w-full rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onSave={saveTemplate}
          onCancel={() => setEditingTemplate(null)}
        />
      )}

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{template.name}</h3>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="text-sky-300 transition-colors hover:text-sky-100"
                >
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-rose-300 transition-colors hover:text-rose-100"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {groupBySuperset(template.exercises).map((group) => {
                if (group.kind === "single") {
                  return (
                    <div key={group.item.id} className="text-sm text-gray-600">
                      {group.item.name}
                    </div>
                  );
                }

                const supersetIds = getSupersetIds(template.exercises);
                return (
                  <div
                    key={group.supersetId}
                    className={`rounded-lg border-l-4 ${group.color.border} ${group.color.bg} px-3 py-2`}
                  >
                    <div className={`text-sm font-semibold ${group.color.text}`}>
                      {t("superset.label", {
                        number: supersetIds.indexOf(group.supersetId) + 1,
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.items.map(({ item }) => item.name).join(" + ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
