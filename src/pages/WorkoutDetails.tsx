import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Workout } from "../types/workout";

export function WorkoutDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    const workouts: Workout[] = JSON.parse(
      localStorage.getItem("workoutHistory") || "[]"
    );
    const foundWorkout = workouts.find((w) => w.id === id);
    if (foundWorkout) {
      setWorkout(foundWorkout);
    }
  }, [id]);

  if (!workout) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">Workout not found</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-blue-500">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{workout.name}</h1>
      </div>

      <div className="text-gray-500">
        {format(new Date(workout.date), "MMMM d, yyyy 'at' h:mm a")}
      </div>

      <div className="space-y-6">
        {workout.exercises.map((exercise) => (
          <div key={exercise.id} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{exercise.name}</h3>

            {Array.isArray(exercise.sets) ? (
              // Strength exercise
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm font-medium">
                  <div>Set</div>
                  <div>Weight</div>
                  <div>Reps</div>
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
              // Cardio exercise
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div>{exercise.sets.duration} min</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Distance</div>
                  <div>{exercise.sets.distance} km</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Pace</div>
                  <div>
                    {exercise.sets.duration && exercise.sets.distance
                      ? (
                          exercise.sets.duration / exercise.sets.distance
                        ).toFixed(2)
                      : "0"}{" "}
                    min/km
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
