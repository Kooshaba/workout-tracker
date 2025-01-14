import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  Workout,
  WorkoutTemplate,
  StrengthSet,
  CardioSession,
} from "../types/workout";
import { ExerciseForm } from "../components/workout/ExerciseForm";
import { ExerciseList } from "../components/workout/ExerciseList";
import { RestTimer } from "../components/workout/RestTimer";

export function WorkoutLog() {
  const [currentWorkout, setCurrentWorkout] = useLocalStorage<Workout | null>(
    "currentWorkout",
    null
  );
  const [showTimer, setShowTimer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentExerciseName, setCurrentExerciseName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const startNewWorkout = () => {
    const workoutDate = new Date(selectedDate);
    setCurrentWorkout({
      id: Date.now().toString(),
      date: workoutDate.toISOString(),
      name: "Workout " + workoutDate.toLocaleDateString(),
      exercises: [],
    });
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    const workoutDate = new Date(selectedDate);
    setCurrentWorkout({
      id: Date.now().toString(),
      date: workoutDate.toISOString(),
      name: template.name,
      exercises: template.exercises.map((exercise) => ({
        id: Date.now().toString(),
        name: exercise.name,
        exerciseId: exercise.id,
        sets:
          exercise.type === "strength"
            ? [
                {
                  reps: 0,
                  weight: 0,
                  completed: false,
                } as StrengthSet,
              ]
            : ({
                duration: 0,
                distance: 0,
                pace: 0,
              } as CardioSession),
      })),
    });
    setShowTemplates(false);
  };

  const finishWorkout = () => {
    // Save to workout history
    const workouts = JSON.parse(localStorage.getItem("workoutHistory") || "[]");
    localStorage.setItem(
      "workoutHistory",
      JSON.stringify([...workouts, currentWorkout])
    );
    setCurrentWorkout(null);
  };

  const cancelWorkout = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel this workout? All progress will be lost."
      )
    ) {
      setCurrentWorkout(null);
    }
  };

  return (
    <div className="pb-20 p-4">
      {!currentWorkout ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="workout-date"
              className="block text-sm font-medium text-gray-700"
            >
              Workout Date
            </label>
            <input
              type="date"
              id="workout-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button
            onClick={startNewWorkout}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
          >
            Start New Workout
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="w-full border border-blue-500 text-blue-500 py-3 rounded-lg font-semibold"
          >
            Use Template
          </button>

          {showTemplates && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
                <h2 className="font-semibold">Select Template</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {JSON.parse(
                    localStorage.getItem("workoutTemplates") || "[]"
                  ).map((template: WorkoutTemplate) => (
                    <button
                      key={template.id}
                      onClick={() => startFromTemplate(template)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">
                        {template.exercises.length} exercises
                      </div>
                      <div className="text-sm text-gray-500">
                        {template.exercises.map((e) => e.name).join(", ")}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="w-full py-2 text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{currentWorkout.name}</h1>
            <div className="space-x-2">
              <button
                onClick={cancelWorkout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={finishWorkout}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Finish
              </button>
            </div>
          </div>

          <ExerciseForm
            onAddExercise={(exercise) => {
              setCurrentWorkout({
                ...currentWorkout,
                exercises: [...currentWorkout.exercises, exercise],
              });
            }}
          />

          <ExerciseList
            exercises={currentWorkout.exercises}
            onUpdate={(exercises) => {
              setCurrentWorkout({
                ...currentWorkout,
                exercises,
              });
            }}
            onTimerStart={(exerciseName) => {
              setShowTimer(true);
              setCurrentExerciseName(exerciseName);
            }}
          />

          {showTimer && (
            <RestTimer
              exerciseName={currentExerciseName}
              onClose={() => setShowTimer(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
