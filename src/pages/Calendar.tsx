import { useState } from "react";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/dist/esm/shared/types.js";
import { Link } from "react-router-dom";
import { format, isSameMonth } from "date-fns";
import {
  CalendarDaysIcon,
  ClockIcon,
  FireIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import type { Workout } from "../types/workout";
import { useI18n } from "../i18nContext";
import "react-calendar/dist/Calendar.css";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import { formatWorkoutDisplayName } from "../utils/exerciseUtils";

export function CalendarPage() {
  const { language, t, dateLocale } = useI18n();
  const { workouts } = useWorkoutHistory();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());

  // Create a Set of dates that have workouts
  const workoutDates = new Set(
    workouts.map((workout) => format(new Date(workout.date), "yyyy-MM-dd"))
  );

  const workoutsByDate = workouts.reduce<Record<string, Workout[]>>(
    (groupedWorkouts, workout) => {
      const key = format(new Date(workout.date), "yyyy-MM-dd");
      return {
        ...groupedWorkouts,
        [key]: [...(groupedWorkouts[key] || []), workout],
      };
    },
    {}
  );

  // Get workouts for selected date
  const selectedWorkouts = workouts.filter(
    (workout) =>
      format(new Date(workout.date), "yyyy-MM-dd") ===
      format(selectedDate, "yyyy-MM-dd")
  );

  const activeMonthWorkouts = workouts.filter((workout) =>
    isSameMonth(new Date(workout.date), activeStartDate)
  );
  const activeMonthWorkoutDays = new Set(
    activeMonthWorkouts.map((workout) =>
      format(new Date(workout.date), "yyyy-MM-dd")
    )
  ).size;
  const selectedExerciseCount = selectedWorkouts.reduce(
    (count, workout) => count + workout.exercises.length,
    0
  );

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const formattedDate = format(date, "yyyy-MM-dd");
    return workoutDates.has(formattedDate) ? "has-workout" : null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const workoutCount = workoutsByDate[format(date, "yyyy-MM-dd")]?.length;
    return workoutCount ? (
      <span
        className="workout-indicator"
        aria-label={t("calendar.workoutCountLabel", { count: workoutCount })}
      >
        {workoutCount}
      </span>
    ) : null;
  };

  return (
    <div className="min-h-screen space-y-6 px-4 pb-24 pt-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-800/60 bg-sky-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
          <CalendarDaysIcon className="h-4 w-4" />
          {t("nav.calendar")}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">
              {t("calendar.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {format(activeStartDate, "MMMM yyyy", { locale: dateLocale })}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-right">
            <div className="text-2xl font-bold text-emerald-100">
              {activeMonthWorkouts.length}
            </div>
            <div className="text-xs text-emerald-300/80">
              {t("calendar.thisMonth")}
            </div>
          </div>
        </div>
      </header>

      <section className="calendar-panel">
        <Calendar
          onChange={handleDateChange}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              setActiveStartDate(activeStartDate);
            }
          }}
          value={selectedDate}
          tileClassName={tileClassName}
          tileContent={tileContent}
          locale={language === "ja" ? "ja-JP" : "en-US"}
          calendarType="gregory"
          className="workout-calendar"
        />
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3">
          <FireIcon className="mb-2 h-5 w-5 text-amber-300" />
          <div className="text-lg font-bold text-slate-50">
            {activeMonthWorkoutDays}
          </div>
          <div className="text-xs text-slate-400">
            {t("calendar.activeDays")}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3">
          <ListBulletIcon className="mb-2 h-5 w-5 text-sky-300" />
          <div className="text-lg font-bold text-slate-50">
            {selectedWorkouts.length}
          </div>
          <div className="text-xs text-slate-400">
            {t("calendar.selected")}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3">
          <CalendarDaysIcon className="mb-2 h-5 w-5 text-emerald-300" />
          <div className="text-lg font-bold text-slate-50">
            {selectedExerciseCount}
          </div>
          <div className="text-xs text-slate-400">{t("common.exercises")}</div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">
            {t("calendar.workoutsOn", {
              date: format(selectedDate, "PP", { locale: dateLocale }),
            })}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {selectedWorkouts.length > 0
              ? t("common.exerciseCount", { count: selectedExerciseCount })
              : t("calendar.noWorkouts")}
          </p>
        </div>
        {selectedWorkouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
            <CalendarDaysIcon className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-400">{t("calendar.noWorkouts")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedWorkouts.map((workout) => (
              <Link
                key={workout.id}
                to={`/workout/${workout.id}`}
                className="block rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-700/70 hover:bg-slate-800/90"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-50">
                      {formatWorkoutDisplayName(workout.name)}
                    </h3>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                      <ClockIcon className="h-4 w-4" />
                      {format(new Date(workout.date), "p", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                  <div className="shrink-0 rounded-full border border-sky-700/60 bg-sky-950/50 px-3 py-1 text-xs font-semibold text-sky-100">
                    {t("common.exerciseCount", {
                      count: workout.exercises.length,
                    })}
                  </div>
                </div>
                <div className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {workout.exercises
                    .map((exercise) => formatWorkoutDisplayName(exercise.name))
                    .join(", ")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
