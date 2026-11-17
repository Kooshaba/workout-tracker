import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  askData, coachModels, DEFAULT_COACH_MODEL, workoutSnapshot,
} from "../lib/coach";
import type { CoachTurn, Recommendation } from "../lib/coach";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  Workout,
  WorkoutExercise,
  StrengthSet,
  CardioSession,
} from "../types/workout";
import { useI18n } from "../i18nContext";
import { formatWorkoutDisplayName } from "../utils/exerciseUtils";

type Translate = ReturnType<typeof useI18n>["t"];

function makeExercise(rec: Recommendation, t: Translate): WorkoutExercise {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: rec.name,
    exerciseId: rec.name.toLowerCase().replace(/\s+/g, "-"),
    sets:
      rec.type === "strength"
        ? ([{ reps: 0, weight: 0, completed: false }] as StrengthSet[])
        : ({ duration: 0, distance: 0, pace: 0 } as CardioSession),
    notes: `${t("coach.notePrefix")}: ${rec.reason}`,
  };
}

export function Coach() {
  const [currentWorkout, setCurrentWorkout] = useLocalStorage<Workout | null>(
    "currentWorkout",
    null
  );
  return <CoachChat key={currentWorkout?.id ?? "general"}
    currentWorkout={currentWorkout} setCurrentWorkout={setCurrentWorkout} />;
}

function CoachChat({ currentWorkout, setCurrentWorkout }: {
  currentWorkout: Workout | null;
  setCurrentWorkout: Dispatch<SetStateAction<Workout | null>>;
}) {
  const { language, t } = useI18n();
  const chatKey = `coachChat:${currentWorkout?.id ?? "general"}`;
  const [turns, setTurns] = useLocalStorage<CoachTurn[]>(chatKey, []);
  const [question, setQuestion] = useLocalStorage<string>(`${chatKey}:draft`, "");
  const request = useRef<AbortController | null>(null);
  const chatEnd = useRef<HTMLDivElement | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (turns.length) chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [turns]);
  const [apiKey, setApiKey] = useLocalStorage<string>("coachApiKey", "");
  const [model, setModel] = useLocalStorage<string>(
    "coachModel",
    DEFAULT_COACH_MODEL
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshot = useMemo(
    () => workoutSnapshot(currentWorkout, t),
    [currentWorkout, t]
  );

  async function askCoach() {
    const q = question.trim();
    if (!q || request.current) return;
    if (!apiKey.trim()) {
      setError(t("coach.noApiKey"));
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await askData({
        apiKey: apiKey.trim(), model, question: q, snapshot, turns,
        signal: controller.signal, language, t,
      });
      if (controller.signal.aborted) return;
      setTurns((previous) => [...previous, {
        id: crypto.randomUUID(), question: q, snapshot, response,
      }]);
      setQuestion("");
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : t("coach.requestFailed"));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      request.current = null;
    }
  }

  function addRecommendation(turnId: string, index: number, rec: Recommendation) {
    const exerciseId = `coach-${turnId}-${index}`;
    setCurrentWorkout((latest) => {
      if (!latest || latest.id !== currentWorkout?.id ||
          latest.exercises.some((exercise) => exercise.id === exerciseId)) return latest;
      return {
        ...latest,
        exercises: [...latest.exercises, { ...makeExercise(rec, t), id: exerciseId }],
      };
    });
  }

  function startNewChat() {
    if (!window.confirm(t("coach.newChatConfirm"))) return;
    setTurns([]);
    setQuestion("");
    setError(null);
  }

  return (
    <div className="p-4 space-y-4" style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}>
      <h1 className="text-xl font-bold">{t("coach.title")}</h1>

      <p className="text-sm text-gray-600">{t("coach.chatHelp")}</p>
      <details className="rounded-lg border p-3 space-y-2">
        <summary className="cursor-pointer text-sm font-semibold">{t("coach.contextTitle")}</summary>
        <pre className="text-xs whitespace-pre-wrap break-words text-gray-600">{snapshot}</pre>
      </details>

      <details className="space-y-4 rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold">{t("coach.connectionTitle")}</summary>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{t("coach.connectionHelp")}</p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="coach-api-key"
            className="block text-xs font-semibold text-gray-700"
          >
            {t("coach.apiKeyLabel")}
          </label>
          <input
            id="coach-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t("coach.apiKeyPlaceholder")}
            autoComplete="off"
            className="w-full border rounded-lg px-3 py-2"
          />
          <p className="text-xs text-gray-500">{t("coach.apiKeyHelp")}</p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="coach-model"
            className="block text-xs font-semibold text-gray-700"
          >
            {t("coach.modelLabel")}
          </label>
          <select
            id="coach-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {coachModels.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">{t("coach.modelHelp")}</p>
        </div>
      </details>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{t("coach.conversation")}</h2>
        {turns.length > 0 && <button type="button" onClick={startNewChat}
          disabled={loading} className="text-sm underline disabled:opacity-50">
          {t("coach.newChat")}
        </button>}
      </div>
      <div role="log" aria-label={t("coach.conversation")} aria-live="polite" className="space-y-4">
        {turns.length === 0 && !loading && <p className="text-sm text-gray-500">{t("coach.chatEmpty")}</p>}
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-3">
            <div className="ml-6 rounded-xl border border-sky-800 bg-sky-950/30 p-3">
              <div className="mb-1 text-xs font-semibold">{t("coach.you")}</div>
              <p className="whitespace-pre-wrap break-words text-sm">{turn.question}</p>
            </div>
            <div className="mr-3 rounded-xl border p-3 space-y-3">
              <div className="text-xs font-semibold">Data</div>
              <p className="whitespace-pre-wrap break-words text-sm">{turn.response.answer}</p>
              {turn.response.recommendations.map((rec, index) => {
                const added = currentWorkout?.exercises.some((exercise) => exercise.id === `coach-${turn.id}-${index}`);
                return <div key={index} className="rounded-lg border p-3">
                  <div className="font-semibold">{formatWorkoutDisplayName(rec.name)}</div>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                  {currentWorkout && <button type="button"
                    onClick={() => addRecommendation(turn.id, index, rec)}
                    disabled={added || loading}
                    className="mt-2 rounded-xl border border-emerald-900/80 bg-emerald-950/50 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50">
                    {t(added ? "coach.addedToWorkout" : "coach.addToWorkout")}
                  </button>}
                </div>;
              })}
            </div>
          </div>
        ))}
        {loading && <div className="space-y-3">
          <p className="ml-6 rounded-xl border p-3 text-sm whitespace-pre-wrap">{question}</p>
          <p role="status" className="text-sm text-gray-500">{t("coach.loading")}</p>
        </div>}
        <div ref={chatEnd} />
      </div>

      <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void askCoach(); }}>
        <label
          htmlFor="coach-question"
          className="block text-sm font-medium text-gray-700"
        >
          {t("coach.askLabel")}
        </label>
        <textarea
          id="coach-question"
          rows={3}
          disabled={loading}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("coach.askPlaceholder")}
          className="w-full border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5 disabled:opacity-60"
        >
          {loading ? t("coach.loading") : t("coach.askButton")}
        </button>
        {error && <p role="alert" className="text-sm text-amber-600">{error}</p>}
      </form>
    </div>
  );
}
