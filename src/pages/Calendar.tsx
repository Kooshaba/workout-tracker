import { useState } from "react";
import Calendar from "react-calendar";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Workout } from "../types/workout";
import "react-calendar/dist/Calendar.css";

export function CalendarPage() {
  const [workouts] = useState<Workout[]>(() =>
    JSON.parse(localStorage.getItem("workoutHistory") || "[]")
  );

  // Create a Set of dates that have workouts
  const workoutDates = new Set(
    workouts.map((workout) => format(new Date(workout.date), "yyyy-MM-dd"))
  );

  const tileClassName = ({ date }: { date: Date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return workoutDates.has(formattedDate) ? "bg-blue-200 rounded-lg" : "";
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Calendar</h1>

      <div className="calendar-container">
        <Calendar
          tileClassName={tileClassName}
          className="w-full border-0 rounded-lg"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Workout History</h2>
        {workouts
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((workout) => (
            <Link
              key={workout.id}
              to={`/workout/${workout.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{workout.name}</h3>
                  <span className="text-sm text-gray-500">
                    {format(new Date(workout.date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {workout.exercises.length} exercises
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
