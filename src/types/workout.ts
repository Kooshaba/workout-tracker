export type Exercise = {
  id: string;
  name: string;
  type: "strength" | "cardio";
  notes?: string;
};

export type StrengthSet = {
  reps: number;
  weight: number;
  completed: boolean;
};

export type CardioSession = {
  duration: number; // in minutes
  distance: number; // in kilometers
  pace: number; // calculated field (min/km)
};

export type WorkoutExercise = {
  id: string;
  name: string;
  exerciseId: string;
  sets: StrengthSet[] | CardioSession;
  notes?: string;
};

export type Workout = {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  notes?: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: Exercise[];
};
