import { Link } from "react-router-dom";
import { Workout } from "../types/workout";
import { format } from "date-fns";
import { useState, useRef } from "react";

export function Home() {
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>(() =>
    JSON.parse(localStorage.getItem("workoutHistory") || "[]")
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );
  const [showExport, setShowExport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);

  const recentWorkouts = workoutHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const deleteWorkout = (workoutId: string) => {
    const updatedWorkouts = workoutHistory.filter((w) => w.id !== workoutId);
    setWorkoutHistory(updatedWorkouts);
    localStorage.setItem("workoutHistory", JSON.stringify(updatedWorkouts));
    setShowConfirmDelete(null);
  };

  const handleExport = () => {
    setShowExport(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setWorkoutHistory(importedData);
          localStorage.setItem("workoutHistory", JSON.stringify(importedData));
          alert("Workout history imported successfully!");
        } else {
          alert("Invalid file format. Please upload a valid JSON file.");
        }
      } catch (error) {
        alert("Error importing workout history. Please check the file format.");
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };

  const handleImportFromText = (jsonText: string) => {
    try {
      const importedData = JSON.parse(jsonText);
      if (Array.isArray(importedData)) {
        setWorkoutHistory(importedData);
        localStorage.setItem("workoutHistory", JSON.stringify(importedData));
        alert("Workout history imported successfully!");
        setShowImport(false);
      } else {
        alert("Invalid format. Please provide a valid JSON array.");
      }
    } catch (error) {
      alert("Error parsing JSON. Please check the format.");
      console.error(error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Workout Tracker</h1>
          <h3 className="text-sm text-gray-500">Version 0.1.2</h3>
        </div>
        <Link
          to="/workout"
          className="inline-flex items-center justify-center rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
        >
          New Workout
        </Link>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleExport}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5"
        >
          Export History
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="rounded-xl border border-amber-900/80 bg-amber-950/60 px-4 py-2 font-semibold text-amber-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-900/50 active:translate-y-0.5"
        >
          Import History
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
      </div>

      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4">
            <h2 className="font-semibold">Export Workout History</h2>
            <textarea
              className="w-full h-96 border rounded-lg p-2 font-mono text-sm"
              value={JSON.stringify(workoutHistory, null, 2)}
              readOnly
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowExport(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4">
            <h2 className="font-semibold">Import Workout History</h2>
            <p className="text-sm text-gray-600">
              Paste your workout history JSON data below:
            </p>
            <textarea
              className="w-full h-96 border rounded-lg p-2 font-mono text-sm"
              placeholder="Paste JSON here..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImport(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const textarea = (e.target as HTMLElement)
                    .closest(".bg-white")
                    ?.querySelector("textarea");
                  if (textarea) {
                    handleImportFromText(textarea.value);
                  }
                }}
                className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="font-semibold">Delete Workout</h2>
            <p>Are you sure you want to delete this workout?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteWorkout(showConfirmDelete)}
                className="rounded-xl border border-rose-900/80 bg-rose-950/50 px-4 py-2 font-semibold text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-900/50 active:translate-y-0.5"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Workouts</h2>
        {recentWorkouts.length === 0 ? (
          <p className="text-gray-500">No workouts recorded yet</p>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/workout/${workout.id}`}
                    className="flex-1 transition-colors hover:text-sky-200"
                  >
                    <h3 className="font-semibold">{workout.name}</h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(workout.date), "MMM d, yyyy")}
                    </span>
                    <div className="text-sm text-gray-600">
                      {workout.exercises.length} exercises
                    </div>
                    <div className="text-sm">
                      {workout.exercises
                        .map((exercise) => exercise.name)
                        .join(", ")}
                    </div>
                  </Link>
                  <button
                    onClick={() => setShowConfirmDelete(workout.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-900/80 bg-rose-950/50 px-3 py-2 text-rose-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-900/50 active:translate-y-0.5"
                    aria-label="Delete workout"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
