import { useState } from "react";
import { WorkoutExercise } from "../types/workout";
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
import { useI18n } from "../i18nContext";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import { formatWorkoutDisplayName } from "../utils/exerciseUtils";

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
  const { t, dateLocale } = useI18n();
  const { workouts } = useWorkoutHistory();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [timeRange, setTimeRange] = useState<number>(30); // days

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
      format(new Date(data!.date), "PP", { locale: dateLocale })
    ),
    datasets: [
      {
        label: formatWorkoutDisplayName(selectedExercise),
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
        text: t("progress.chartTitle"),
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
      <h1 className="text-2xl font-bold">{t("progress.title")}</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("progress.exercise")}
          </label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">{t("progress.selectExercise")}</option>
            {exerciseNames.map((name) => (
              <option key={name} value={name}>
                {formatWorkoutDisplayName(name)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t("progress.timeRange")}
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value={7}>{t("progress.last7")}</option>
            <option value={30}>{t("progress.last30")}</option>
            <option value={90}>{t("progress.last90")}</option>
            <option value={365}>{t("progress.lastYear")}</option>
          </select>
        </div>

        {selectedExercise && exerciseData.length > 0 ? (
          <div className="border rounded-lg p-4">
            <Line options={chartOptions} data={chartData} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            {selectedExercise
              ? t("progress.noData")
              : t("progress.prompt")}
          </div>
        )}
      </div>
    </div>
  );
}
