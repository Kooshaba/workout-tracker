import { useState, useEffect } from "react";
import { Workout, WorkoutExercise } from "../types/workout";
import { format, subDays } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function Progress() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [timeRange, setTimeRange] = useState<number>(30); // days

  useEffect(() => {
    const workoutHistory = JSON.parse(
      localStorage.getItem("workoutHistory") || "[]"
    );
    setWorkouts(workoutHistory);
  }, []);

  // Get unique exercise names
  const exerciseNames = Array.from(
    new Set(
      workouts.flatMap((workout) =>
        workout.exercises.map((exercise) => exercise.name)
      )
    )
  );

  // Get exercise data for the selected exercise
  const exerciseData = workouts
    .filter(
      (workout) =>
        new Date(workout.date) > subDays(new Date(), timeRange) &&
        workout.exercises.some((exercise) => exercise.name === selectedExercise)
    )
    .map((workout) => {
      const exercise = workout.exercises.find(
        (e) => e.name === selectedExercise
      ) as WorkoutExercise;

      if (Array.isArray(exercise?.sets)) {
        // Strength exercise
        const maxWeight = Math.max(
          ...exercise.sets.map((set) => set.weight || 0)
        );
        return {
          date: workout.date,
          value: maxWeight,
        };
      } else if (exercise?.sets) {
        // Cardio exercise
        return {
          date: workout.date,
          value: exercise.sets.distance || 0,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());

  const chartData = {
    labels: exerciseData.map((data) =>
      format(new Date(data!.date), "MMM d, yyyy")
    ),
    datasets: [
      {
        label: selectedExercise,
        data: exerciseData.map((data) => data!.value),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Progress Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Progress</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Exercise</label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select an exercise</option>
            {exerciseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>

        {selectedExercise && exerciseData.length > 0 ? (
          <div className="border rounded-lg p-4">
            <Line options={chartOptions} data={chartData} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {selectedExercise
              ? "No data available for selected exercise and time range"
              : "Select an exercise to view progress"}
          </div>
        )}
      </div>
    </div>
  );
}
