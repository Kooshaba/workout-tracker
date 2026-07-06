import { useRef, useState } from "react";
import { useI18n } from "../i18nContext";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import {
  mergeWorkoutHistory,
  saveWorkoutHistoryRollback,
  validateWorkoutHistory,
} from "../lib/workoutHistory";

type ImportMode = "replace" | "merge";

export function Profile() {
  const { t } = useI18n();
  const { workouts: workoutHistory, replaceWorkouts } = useWorkoutHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("merge");

  const backupFileName = () =>
    `workout-history-${new Date().toISOString().slice(0, 10)}.json`;

  const downloadBackup = (file: File) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleExport = async () => {
    const file = new File(
      [JSON.stringify(workoutHistory, null, 2)],
      backupFileName(),
      { type: "application/json" }
    );

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("profile.exportTitle"),
        });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.warn("Falling back to backup download.", error);
    }

    try {
      downloadBackup(file);
      alert(t("profile.exportSuccess"));
    } catch (error) {
      alert(t("profile.exportError"));
      console.error(error);
    }
  };

  const applyImportedJson = (
    jsonText: string,
    invalidMessage: string,
    parseMessage: string,
    onSuccess?: () => void
  ) => {
    try {
      saveWorkoutHistoryRollback();
    } catch (error) {
      alert(t("profile.rollbackError"));
      console.error(error);
      return;
    }

    try {
      const importedData = JSON.parse(jsonText);
      const result = validateWorkoutHistory(importedData);

      if (!result.ok) {
        alert(invalidMessage);
        console.error(result.reason);
        return;
      }

      const nextWorkouts =
        importMode === "merge"
          ? mergeWorkoutHistory(workoutHistory, result.workouts)
          : result.workouts;

      replaceWorkouts(nextWorkouts);
      alert(
        t(
          importMode === "merge"
            ? "profile.importMergeSuccess"
            : "profile.importReplaceSuccess"
        )
      );
      onSuccess?.();
    } catch (error) {
      alert(parseMessage);
      console.error(error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      applyImportedJson(
        String(e.target?.result ?? ""),
        t("profile.invalidFile"),
        t("profile.importError")
      );
    };
    reader.onerror = () => {
      try {
        saveWorkoutHistoryRollback();
      } catch (error) {
        console.error(error);
      }

      alert(t("profile.importError"));
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleImportFromText = (jsonText: string) => {
    applyImportedJson(
      jsonText,
      t("profile.invalidText"),
      t("profile.parseError"),
      () => setShowImport(false)
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("profile.backupHelp")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <fieldset className="col-span-2 rounded-lg border border-slate-700 p-3">
          <legend className="px-1 text-sm font-semibold">
            {t("profile.importModeLabel")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
              <input
                type="radio"
                name="import-mode"
                value="merge"
                checked={importMode === "merge"}
                onChange={() => setImportMode("merge")}
              />
              <span>{t("profile.importModeMerge")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm">
              <input
                type="radio"
                name="import-mode"
                value="replace"
                checked={importMode === "replace"}
                onChange={() => setImportMode("replace")}
              />
              <span>{t("profile.importModeReplace")}</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t("profile.importModeHelp")}
          </p>
        </fieldset>
        <button
          onClick={handleExport}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5"
        >
          {t("profile.exportBackup")}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-amber-900/80 bg-amber-950/60 px-4 py-2 font-semibold text-amber-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-900/50 active:translate-y-0.5"
        >
          {t("profile.importBackup")}
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="col-span-2 rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
        >
          {t("profile.pasteJson")}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4">
            <h2 className="font-semibold">{t("profile.importTitle")}</h2>
            <p className="text-sm text-gray-600">{t("profile.importHelp")}</p>
            <fieldset className="rounded-lg border border-gray-200 p-3">
              <legend className="px-1 text-sm font-semibold">
                {t("profile.importModeLabel")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="paste-import-mode"
                    value="merge"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                  />
                  <span>{t("profile.importModeMerge")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="paste-import-mode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                  />
                  <span>{t("profile.importModeReplace")}</span>
                </label>
              </div>
            </fieldset>
            <textarea
              className="w-full h-96 border rounded-lg p-2 font-mono text-sm"
              placeholder={t("profile.importPlaceholder")}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImport(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={(e) => {
                  const textarea = (e.target as HTMLElement)
                    .closest(".bg-white")
                    ?.querySelector("textarea");
                  if (textarea) {
                    handleImportFromText(textarea.value);
                  }
                }}
                className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
              >
                {t("common.import")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
