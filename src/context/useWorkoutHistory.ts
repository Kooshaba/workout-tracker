import { useContext } from "react";
import { WorkoutHistoryContext } from "./WorkoutHistoryContext";

export function useWorkoutHistory() {
  const context = useContext(WorkoutHistoryContext);
  if (!context) {
    throw new Error(
      "useWorkoutHistory must be used within WorkoutHistoryProvider"
    );
  }
  return context;
}
