import { useState } from "react";
import Calendar from "react-calendar";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Workout } from "../types/workout";
import { useI18n } from "../i18nContext";
import "react-calendar/dist/Calendar.css";

export function CalendarPage() {
  const { language, t, dateLocale } = useI18n();
  const [workouts] = useState<Workout[]>(() =>
    JSON.parse(localStorage.getItem("workoutHistory") || "[]")
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Create a Set of dates that have workouts
  const workoutDates = new Set(
    workouts.map((workout) => format(new Date(workout.date), "yyyy-MM-dd"))
  );

  // Get workouts for selected date
  const selectedWorkouts = workouts.filter(
    (workout) =>
      format(new Date(workout.date), "yyyy-MM-dd") ===
      format(selectedDate, "yyyy-MM-dd")
  );

  const tileClassName = ({ date }: { date: Date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return workoutDates.has(formattedDate)
      ? "!bg-green-500 !rounded-lg font-bold"
      : "";
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>

      <div className="calendar-container">
        <Calendar
          onChange={(value) => setSelectedDate(value as Date)}
          value={selectedDate}
          tileClassName={tileClassName}
          locale={language === "ja" ? "ja-JP" : "en-US"}
          className="w-full border-0 rounded-lg"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("calendar.workoutsOn", {
            date: format(selectedDate, "PP", { locale: dateLocale }),
          })}
        </h2>
        {selectedWorkouts.length === 0 ? (
          <p className="text-gray-500">{t("calendar.noWorkouts")}</p>
        ) : (
          selectedWorkouts.map((workout) => (
            <Link
              key={workout.id}
              to={`/workout/${workout.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{workout.name}</h3>
                  <span className="text-sm text-gray-500">
                    {format(new Date(workout.date), "p", {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {t("common.exerciseCount", {
                    count: workout.exercises.length,
                  })}
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {workout.exercises.map((exercise) => exercise.name).join(", ")}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
