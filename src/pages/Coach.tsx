import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Workout, WorkoutExercise, StrengthSet, CardioSession } from "../types/workout";

type Recommendation = {
  name: string;
  type: "strength" | "cardio";
  reason: string;
};

type CoachResponse = {
  answer: string;
  recommendations: Recommendation[];
};

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

function workoutSnapshot(workout: Workout | null) {
  if (!workout) return "No active workout. Start one in the Workout tab.";

  const lines: string[] = [];
  lines.push(`Workout: ${workout.name}`);
  lines.push(`Exercises: ${workout.exercises.length}`);

  for (const ex of workout.exercises) {
    if (Array.isArray(ex.sets)) {
      const completed = ex.sets.filter((s) => s.completed).length;
      lines.push(`- ${ex.name}: ${ex.sets.length} sets (${completed} completed)`);
    } else {
      lines.push(`- ${ex.name}: cardio ${ex.sets.duration} min / ${ex.sets.distance} km`);
    }
  }

  if (workout.notes?.trim()) lines.push(`Notes: ${workout.notes}`);
  return lines.join("\n");
}

function fallbackResponse(workout: Workout | null): CoachResponse {
  if (!workout) {
    return {
      answer: "You do not currently have an active workout session. Start one first, then I can give context-aware recommendations.",
      recommendations: [],
    };
  }

  return {
    answer:
      "I can still offer a baseline: add 1-2 movements that balance your current session, keep intensity submaximal, and avoid redundant fatigue.",
    recommendations: [
      {
        name: "Chest-Supported Row",
        type: "strength",
        reason: "Reliable pull pattern with low systemic fatigue.",
      },
      {
        name: "Dead Bug",
        type: "strength",
        reason: "Improves trunk stability and movement quality.",
      },
      {
        name: "Zone 2 Bike",
        type: "cardio",
        reason: "Adds conditioning without crushing recovery.",
      },
    ],
  };
}

async function askData(options: {
  apiKey: string;
  model: string;
  question: string;
  workout: Workout | null;
}): Promise<CoachResponse> {
  const { apiKey, model, question, workout } = options;

  const system = `You are Data, an evolved Commander Data style fitness assistant: precise, calm, direct, practical. Avoid fluff. Give safe, conservative workout guidance. Keep recommendations to 1-3 items.`;

  const user = `Question: ${question}\n\nCurrent workout context:\n${workoutSnapshot(workout)}`;

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
  if (!content) throw new Error("No structured response returned.");

  const parsed = JSON.parse(content) as Partial<CoachResponse>;

  return {
    answer: parsed.answer || "No response generated.",
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 3).map((r) => ({
          name: r.name || "Suggested Exercise",
          type: r.type === "cardio" ? "cardio" : "strength",
          reason: r.reason || "Useful addition for your current workout context.",
        }))
      : [],
  };
}

function makeExercise(rec: Recommendation): WorkoutExercise {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: rec.name,
    exerciseId: rec.name.toLowerCase().replace(/\s+/g, "-"),
    sets:
      rec.type === "strength"
        ? ([{ reps: 10, weight: 0, completed: false }] as StrengthSet[])
        : ({ duration: 12, distance: 0, pace: 0 } as CardioSession),
    notes: `Coach suggestion: ${rec.reason}`,
  };
}

export function Coach() {
  const [currentWorkout, setCurrentWorkout] = useLocalStorage<Workout | null>("currentWorkout", null);
  const [apiKey, setApiKey] = useLocalStorage<string>("coachApiKey", "");
  const [model, setModel] = useLocalStorage<string>("coachModel", "gpt-4o-mini");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshot = useMemo(() => workoutSnapshot(currentWorkout), [currentWorkout]);

  async function askCoach() {
    const q = question.trim() || "What should I add to this workout?";
    setLoading(true);
    setError(null);

    try {
      if (!apiKey.trim()) {
        setAnswer(fallbackResponse(currentWorkout));
        setError("No API key set. Showing fallback guidance.");
      } else {
        const response = await askData({ apiKey, model, question: q, workout: currentWorkout });
        setAnswer(response);
      }
    } catch (err) {
      setAnswer(fallbackResponse(currentWorkout));
      setError(err instanceof Error ? err.message : "Coach request failed. Showing fallback guidance.");
    } finally {
      setLoading(false);
    }
  }

  function addRecommendation(rec: Recommendation) {
    if (!currentWorkout) return;
    const next = { ...currentWorkout, exercises: [...currentWorkout.exercises, makeExercise(rec)] };
    setCurrentWorkout(next);
  }

  return (
    <div className="pb-20 p-4 space-y-4">
      <h1 className="text-xl font-bold">Coach (Experimental)</h1>

      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-sm font-semibold">Current workout context (auto-shared)</div>
        <pre className="text-xs whitespace-pre-wrap text-gray-600">{snapshot}</pre>
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        <div className="text-sm font-semibold">Data connection (optional but recommended)</div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="OpenAI API key (sk-...)"
          className="w-full border rounded-lg px-3 py-2"
        />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
        </select>
        <p className="text-xs text-gray-500">Stored locally on this device. If missing, app uses fallback suggestions.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="coach-question" className="block text-sm font-medium text-gray-700">
          Ask Data for help
        </label>
        <textarea
          id="coach-question"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., I already did squats and bench. What should I add without overdoing fatigue?"
          className="w-full border rounded-lg px-3 py-2"
        />
        <button onClick={askCoach} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-60">
          {loading ? "Consulting Data..." : "Ask Data"}
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
                    className="mt-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Add to current workout
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
