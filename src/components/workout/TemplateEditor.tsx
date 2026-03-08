import { useState } from "react";
import { WorkoutTemplate } from "../../types/workout";

type Props = {
  template: WorkoutTemplate;
  onSave: (template: WorkoutTemplate) => void;
  onCancel: () => void;
};

export function TemplateEditor({ template, onSave, onCancel }: Props) {
  const [name, setName] = useState(template.name);
  const [exercises, setExercises] = useState(template.exercises);

  const handleSave = () => {
    onSave({
      ...template,
      name,
      exercises: exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        type: exercise.type,
        notes: exercise.notes || "",
      })),
    });
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
        <h2 className="font-semibold">Edit Template</h2>
        <div>
          <label className="block text-sm font-medium mb-1">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Exercises</label>
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <div>
                <div className="font-medium">{exercise.name}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {exercise.type}
                </div>
              </div>
              <button
                onClick={() => removeExercise(index)}
                className="text-rose-300 transition-colors hover:text-rose-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl border border-sky-800 bg-sky-950/60 px-4 py-2 font-semibold text-sky-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-900/70 active:translate-y-0.5"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
