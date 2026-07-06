import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  Workout,
  WorkoutExercise,
  StrengthSet,
  CardioSession,
} from "../types/workout";
import { useI18n } from "../i18nContext";

type Recommendation = {
  name: string;
  type: "strength" | "cardio";
  reason: string;
};

type CoachResponse = {
  answer: string;
  recommendations: Recommendation[];
};

type Translate = ReturnType<typeof useI18n>["t"];

const DEFAULT_COACH_MODEL = "gpt-5.5";

const coachModels = [
  { value: "gpt-5.5", labelKey: "coach.modelGpt55" },
  { value: "gpt-4.1-mini", labelKey: "coach.modelGpt41Mini" },
  { value: "gpt-4o", labelKey: "coach.modelGpt4o" },
  { value: "gpt-4o-mini", labelKey: "coach.modelGpt4oMini" },
] as const;

const coachResponseSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["strength", "cardio"] },
          reason: { type: "string" },
        },
        required: ["name", "type", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["answer", "recommendations"],
  additionalProperties: false,
} as const;

function workoutSnapshot(workout: Workout | null, t: Translate) {
  if (!workout) return t("coach.noActiveWorkout");

  const lines: string[] = [];
  lines.push(t("coach.snapshotWorkout", { name: workout.name }));
  lines.push(t("coach.snapshotExercises", { count: workout.exercises.length }));

  for (const ex of workout.exercises) {
    if (Array.isArray(ex.sets)) {
      const completed = ex.sets.filter((s) => s.completed).length;
      lines.push(
        t("coach.snapshotStrength", {
          name: ex.name,
          sets: ex.sets.length,
          completed,
        })
      );
    } else {
      lines.push(
        t("coach.snapshotCardio", {
          name: ex.name,
          duration: ex.sets.duration,
          distance: ex.sets.distance,
        })
      );
    }
  }

  if (workout.notes?.trim()) {
    lines.push(t("coach.snapshotNotes", { notes: workout.notes }));
  }
  return lines.join("\n");
}

function fallbackResponse(workout: Workout | null, t: Translate): CoachResponse {
  if (!workout) {
    return {
      answer: t("coach.fallbackNoWorkout"),
      recommendations: [],
    };
  }

  return {
    answer: t("coach.fallbackBaseline"),
    recommendations: [
      {
        name: "Chest-Supported Row",
        type: "strength",
        reason: t("coach.reasonRow"),
      },
      {
        name: "Dead Bug",
        type: "strength",
        reason: t("coach.reasonDeadBug"),
      },
      {
        name: "Zone 2 Bike",
        type: "cardio",
        reason: t("coach.reasonBike"),
      },
    ],
  };
}

async function askData(options: {
  apiKey: string;
  model: string;
  question: string;
  snapshot: string;
  language: string;
  t: Translate;
}): Promise<CoachResponse> {
  const { apiKey, model, question, snapshot, language, t } = options;

  const system = `You are Data, an evolved Commander Data style fitness assistant: precise, calm, direct, practical. Avoid fluff. Give safe, conservative workout guidance. Keep recommendations to 1-3 items. Respond in ${language === "ja" ? "Japanese" : "English"}.`;

  const user = `Question: ${question}\n\nCurrent workout context:\n${snapshot}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coach_response",
          strict: true,
          schema: coachResponseSchema,
        },
      },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) throw new Error(await response.text());

  const data = (await response.json()) as {
    choices?: { message?: { content?: string; refusal?: string } }[];
  };

  const message = data.choices?.[0]?.message;
  if (message?.refusal) throw new Error(message.refusal);

  const content = message?.content?.trim();
  if (!content) throw new Error(t("coach.noStructuredResponse"));

  const parsed = JSON.parse(content) as Partial<CoachResponse>;

  return {
    answer: parsed.answer || t("coach.noResponse"),
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 3).map((r) => ({
          name: r.name || t("coach.suggestedExercise"),
          type: r.type === "cardio" ? "cardio" : "strength",
          reason: r.reason || t("coach.defaultReason"),
        }))
      : [],
  };
}

function makeExercise(rec: Recommendation, t: Translate): WorkoutExercise {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: rec.name,
    exerciseId: rec.name.toLowerCase().replace(/\s+/g, "-"),
    sets:
      rec.type === "strength"
        ? ([{ reps: 10, weight: 0, completed: false }] as StrengthSet[])
        : ({ duration: 12, distance: 0, pace: 0 } as CardioSession),
    notes: `${t("coach.notePrefix")}: ${rec.reason}`,
  };
}

export function Coach() {
  const { language, t } = useI18n();
  const [currentWorkout, setCurrentWorkout] = useLocalStorage<Workout | null>(
    "currentWorkout",
    null
  );
  const [apiKey, setApiKey] = useLocalStorage<string>("coachApiKey", "");
  const [model, setModel] = useLocalStorage<string>(
    "coachModel",
    DEFAULT_COACH_MODEL
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshot = useMemo(
    () => workoutSnapshot(currentWorkout, t),
    [currentWorkout, t]
  );

  async function askCoach() {
    const q = question.trim() || t("coach.askDefault");
    setLoading(true);
    setError(null);

    try {
      if (!apiKey.trim()) {
        setAnswer(fallbackResponse(currentWorkout, t));
        setError(t("coach.noApiKey"));
      } else {
        const response = await askData({
          apiKey,
          model,
          question: q,
          snapshot,
          language,
          t,
        });
        setAnswer(response);
      }
    } catch (err) {
      setAnswer(fallbackResponse(currentWorkout, t));
      setError(
        err instanceof Error ? err.message : t("coach.requestFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  function addRecommendation(rec: Recommendation) {
    if (!currentWorkout) return;
    const next = {
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, makeExercise(rec, t)],
    };
    setCurrentWorkout(next);
  }

  return (
    <div className="pb-20 p-4 space-y-4">
      <h1 className="text-xl font-bold">{t("coach.title")}</h1>

      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-sm font-semibold">{t("coach.contextTitle")}</div>
        <pre className="text-xs whitespace-pre-wrap text-gray-600">{snapshot}</pre>
      </div>

      <div className="space-y-4 rounded-lg border p-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{t("coach.connectionTitle")}</h2>
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
      </div>

      <div className="space-y-2">
        <label
          htmlFor="coach-question"
          className="block text-sm font-medium text-gray-700"
        >
          {t("coach.askLabel")}
        </label>
        <textarea
          id="coach-question"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("coach.askPlaceholder")}
          className="w-full border rounded-lg px-3 py-2"
        />
        <button
          onClick={askCoach}
          disabled={loading}
          className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5 disabled:opacity-60"
        >
          {loading ? t("coach.loading") : t("coach.askButton")}
        </button>
        {error && <p className="text-xs text-amber-600">{error}</p>}
      </div>

      {answer && (
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm">{answer.answer}</p>

          <div className="space-y-2">
            {answer.recommendations.map((rec) => (
              <div key={rec.name} className="border rounded-lg p-3">
                <div className="font-semibold">{rec.name}</div>
                <div className="text-sm text-gray-600">{rec.reason}</div>
                {currentWorkout && (
                  <button
                    onClick={() => addRecommendation(rec)}
                    className="mt-2 rounded-xl border border-emerald-900/80 bg-emerald-950/50 px-3 py-2 text-sm font-semibold text-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-900/50 active:translate-y-0.5"
                  >
                    {t("coach.addToWorkout")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
