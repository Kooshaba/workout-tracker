import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Workout, WorkoutExercise } from "../types/workout";

type ExerciseEntry = {
  date: string;
  workoutId: string;
  workoutName: string;
  exercise: WorkoutExercise;
};

export function ExerciseHistory() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ExerciseEntry[]>([]);

  useEffect(() => {
    const workouts: Workout[] = JSON.parse(
      localStorage.getItem("workoutHistory") || "[]"
    );

    const exerciseHistory = workouts
      .flatMap((workout) => {
        const exercise = workout.exercises.find((e) => e.name === name);
        if (exercise) {
          return [
            {
              date: workout.date,
              workoutId: workout.id,
              workoutName: workout.name,
              exercise,
            },
          ];
        }
        return [];
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setHistory(exerciseHistory);
  }, [name]);

  if (!name) {
    return <div className="p-4">Exercise not found</div>;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-blue-500">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="text-gray-500">No history found for this exercise</p>
        ) : (
          history.map((entry, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-medium">
                    {format(new Date(entry.date), "MMMM d, yyyy")}
                  </div>
                  <div
                    className="text-sm text-blue-500 cursor-pointer"
                    onClick={() => navigate(`/workout/${entry.workoutId}`)}
                  >
                    {entry.workoutName}
                  </div>
                </div>
              </div>

              {Array.isArray(entry.exercise.sets) ? (
                // Strength exercise
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium">
                    <div>Set</div>
                    <div>Weight</div>
                    <div>Reps</div>
                  </div>
                  {entry.exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-3 gap-2">
                      <div>{setIndex + 1}</div>
                      <div>{set.weight} kg</div>
                      <div>{set.reps}</div>
                    </div>
                  ))}
                </div>
              ) : (
                // Cardio exercise
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div>{entry.exercise.sets.duration} min</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Distance</div>
                    <div>{entry.exercise.sets.distance} km</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Pace</div>
                    <div>
                      {entry.exercise.sets.duration &&
                      entry.exercise.sets.distance
                        ? (
                            entry.exercise.sets.duration /
                            entry.exercise.sets.distance
                          ).toFixed(2)
                        : "0"}{" "}
                      min/km
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
