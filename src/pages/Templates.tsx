import { useState } from "react";
import { Workout, WorkoutTemplate } from "../types/workout";
import { TemplateEditor } from "../components/workout/TemplateEditor";

export function Templates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() =>
    JSON.parse(localStorage.getItem("workoutTemplates") || "[]")
  );
  const [workouts] = useState<Workout[]>(() =>
    JSON.parse(localStorage.getItem("workoutHistory") || "[]")
  );
  const [showWorkoutSelect, setShowWorkoutSelect] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<WorkoutTemplate | null>(null);

  const saveTemplate = (template: WorkoutTemplate) => {
    let newTemplates: WorkoutTemplate[];
    const existingTemplate = templates.find((t) => t.id === template.id);
    if (existingTemplate) {
      const updatedTemplates = templates.map((t) =>
        t.id === template.id ? template : t
      );
      newTemplates = updatedTemplates;
    } else {
      newTemplates = [...templates, template];
    }
    setTemplates(newTemplates);
    localStorage.setItem("workoutTemplates", JSON.stringify(newTemplates));
    setEditingTemplate(null);
  };

  const createTemplateFromWorkout = (workout: Workout) => {
    const template: WorkoutTemplate = {
      id: Date.now().toString(),
      name: `Template from ${workout.name}`,
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        type: Array.isArray(exercise.sets) ? "strength" : "cardio",
        notes: exercise.notes,
      })),
    };
    setEditingTemplate(template);
    setShowWorkoutSelect(false);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem("workoutTemplates", JSON.stringify(updatedTemplates));
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Templates</h1>
        <button
          onClick={() => setShowWorkoutSelect(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Create Template
        </button>
      </div>

      {showWorkoutSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="font-semibold">Select Workout</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => createTemplateFromWorkout(workout)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  {workout.name} ({workout.exercises.length} exercises)
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWorkoutSelect(false)}
              className="w-full py-2 text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onSave={saveTemplate}
          onCancel={() => setEditingTemplate(null)}
        />
      )}

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{template.name}</h3>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="text-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {template.exercises.map((exercise) => exercise.name).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
