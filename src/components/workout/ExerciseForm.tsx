import { useState, useEffect } from "react";
import { WorkoutExercise, StrengthSet } from "../../types/workout";
import { getSimilarExercises } from "../../utils/exerciseUtils";

type Props = {
  onAddExercise: (
    exercise: WorkoutExercise,
    shouldFocusLastSet?: boolean
  ) => void;
};

export function ExerciseForm({ onAddExercise }: Props) {
  const [exerciseType, setExerciseType] = useState<"strength" | "cardio">(
    "strength"
  );
  const [exerciseName, setExerciseName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (exerciseName.length >= 2) {
      const similarExercises = getSimilarExercises(exerciseName);
      setSuggestions(similarExercises);
      setShowSuggestions(similarExercises.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [exerciseName]);

  const createExercise = (name: string) => {
    const initialStrengthSet: StrengthSet = {
      reps: 0,
      weight: 0,
      completed: false,
    };

    const exercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: Date.now().toString(),
      name: name.trim(),
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
  };

  const handleSelectSuggestion = (suggestion: string) => {
    createExercise(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExercise(exerciseName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setExerciseType("strength")}
          className={`flex-1 py-2 rounded-lg ${
            exerciseType === "strength"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Strength
        </button>
        <button
          type="button"
          onClick={() => setExerciseType("cardio")}
          className={`flex-1 py-2 rounded-lg ${
            exerciseType === "cardio" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Cardio
        </button>
      </div>

      <div className="relative flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Exercise name"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Add
        </button>
      </div>
    </form>
  );
}
