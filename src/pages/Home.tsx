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
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          New Workout
        </Link>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleExport}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Export History
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
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
                className="px-4 py-2 bg-gray-200 rounded-lg"
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
                className="px-4 py-2 bg-gray-200 rounded-lg"
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
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
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteWorkout(showConfirmDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
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
                    className="flex-1 hover:text-blue-500"
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
                    className="text-red-500 hover:text-red-700 p-2"
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
