import { WorkoutExercise, StrengthSet, Workout } from "../../types/workout";

type Props = {
  exercises: WorkoutExercise[];
  onUpdate: (exercises: WorkoutExercise[]) => void;
  onTimerStart: () => void;
};

export function ExerciseList({ exercises, onUpdate, onTimerStart }: Props) {
  const getLastCompletedSet = (exerciseName: string): StrengthSet | null => {
    const workoutHistory = JSON.parse(
      localStorage.getItem("workoutHistory") || "[]"
    );

    // Find the last workout that had this exercise
    const lastWorkout = workoutHistory
      .sort(
        (a: Workout, b: Workout) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .find((workout: Workout) =>
        workout.exercises.some(
          (e: WorkoutExercise) =>
            e.name === exerciseName &&
            Array.isArray(e.sets) &&
            e.sets.length > 0
        )
      );

    if (!lastWorkout) return null;

    // Find the exercise and get its last set
    const exercise = lastWorkout.exercises.find(
      (e: WorkoutExercise) => e.name === exerciseName
    );
    if (!exercise || !Array.isArray(exercise.sets)) return null;

    return exercise.sets[exercise.sets.length - 1] || null;
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (Array.isArray(exercise.sets)) {
      // Get the previous exercise's last set if it exists
      const previousExercise =
        exerciseIndex > 0 ? newExercises[exerciseIndex - 1] : null;
      const previousSet =
        previousExercise?.sets && Array.isArray(previousExercise.sets)
          ? previousExercise.sets[previousExercise.sets.length - 1]
          : null;

      // Create a new set with values from:
      // 1. Last set of current exercise (if exists)
      // 2. First set of previous exercise (if exists)
      // 3. Default values
      const newSet: StrengthSet =
        exercise.sets.length > 0
          ? {
              reps: exercise.sets[exercise.sets.length - 1].reps,
              weight: exercise.sets[exercise.sets.length - 1].weight,
              completed: false,
            }
          : previousSet && Array.isArray(previousExercise?.sets)
          ? {
              reps: previousSet.reps,
              weight: previousSet.weight,
              completed: false,
            }
          : {
              reps: 0,
              weight: 0,
              completed: false,
            };

      exercise.sets.push(newSet);
      onUpdate(newExercises);
    }
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    set: StrengthSet
  ) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (Array.isArray(exercise.sets)) {
      exercise.sets[setIndex] = set;
      onUpdate(newExercises);
    }
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];

    if (Array.isArray(exercise.sets)) {
      exercise.sets = exercise.sets.filter((_, index) => index !== setIndex);
      onUpdate(newExercises);
    }
  };

  const removeExercise = (exerciseIndex: number) => {
    const newExercises = exercises.filter(
      (_, index) => index !== exerciseIndex
    );
    onUpdate(newExercises);
  };

  return (
    <div className="space-y-4">
      {exercises.map((exercise, exerciseIndex) => (
        <div key={exercise.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{exercise.name}</h3>
            <div className="flex gap-2">
              <button onClick={onTimerStart} className="text-blue-500">
                Start Timer
              </button>

              <div className="w-4 h-4" />

              <button
                onClick={() => removeExercise(exerciseIndex)}
                className="text-red-500"
                aria-label="Remove exercise"
              >
                ✕
              </button>
            </div>
          </div>

          {Array.isArray(exercise.sets) ? (
            // Strength Exercise
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 text-sm font-medium">
                <div>Set</div>
                <div></div>
                <div>Weight</div>
                <div>Reps</div>
                <div></div>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="grid grid-cols-5 gap-2">
                  <div>{setIndex + 1}</div>
                  <button
                    onClick={() => {
                      const lastSet = getLastCompletedSet(exercise.name);
                      if (lastSet) {
                        updateSet(exerciseIndex, setIndex, {
                          ...set,
                          weight: lastSet.weight,
                          reps: lastSet.reps,
                        });
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700"
                    title="Use values from last workout"
                  >
                    ↺
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={set.weight}
                    onChange={(e) =>
                      updateSet(exerciseIndex, setIndex, {
                        ...set,
                        weight: Number(e.target.value),
                      })
                    }
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={set.reps}
                    onChange={(e) =>
                      updateSet(exerciseIndex, setIndex, {
                        ...set,
                        reps: Number(e.target.value),
                      })
                    }
                    className="border rounded px-2 py-1"
                  />
                  <button
                    onClick={() => removeSet(exerciseIndex, setIndex)}
                    className="text-red-500 px-2"
                    aria-label="Remove set"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSet(exerciseIndex)}
                className="w-full border border-blue-500 text-blue-500 rounded-lg py-2 mt-2"
              >
                Add Set
              </button>
            </div>
          ) : (
            // Cardio Exercise
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor={`duration-${exercise.id}`}
                    className="block text-sm font-medium mb-1"
                  >
                    Duration
                  </label>
                  <div className="relative">
                    <input
                      id={`duration-${exercise.id}`}
                      type="number"
                      placeholder="0"
                      value={exercise.sets.duration}
                      onChange={(e) => {
                        const newExercises = [...exercises];
                        newExercises[exerciseIndex].sets = {
                          ...exercise.sets,
                          duration: Number(e.target.value),
                        };
                        onUpdate(newExercises);
                      }}
                      className="w-full border rounded px-2 py-1"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      min
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`distance-${exercise.id}`}
                    className="block text-sm font-medium mb-1"
                  >
                    Distance
                  </label>
                  <div className="relative">
                    <input
                      id={`distance-${exercise.id}`}
                      type="number"
                      placeholder="0"
                      value={exercise.sets.distance}
                      onChange={(e) => {
                        const newExercises = [...exercises];
                        newExercises[exerciseIndex].sets = {
                          ...exercise.sets,
                          distance: Number(e.target.value),
                        };
                        onUpdate(newExercises);
                      }}
                      className="w-full border rounded px-2 py-1"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      km
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pace</label>
                  <div className="border rounded px-2 py-1 bg-gray-50">
                    {exercise.sets.duration && exercise.sets.distance
                      ? (
                          exercise.sets.duration / exercise.sets.distance
                        ).toFixed(2)
                      : "0"}{" "}
                    min/km
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
