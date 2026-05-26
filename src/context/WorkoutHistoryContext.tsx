import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Workout } from "../types/workout";
import { useAuth } from "./useAuth";
import { fetchRemoteWorkouts, saveRemoteWorkouts } from "../lib/api";
import {
  mergeWorkoutHistory,
  readWorkoutHistory,
  writeWorkoutHistory,
} from "../lib/workoutHistory";

type SyncStatus = "local-only" | "loading" | "synced" | "syncing" | "error";

export type WorkoutHistoryContextValue = {
  workouts: Workout[];
  syncStatus: SyncStatus;
  addWorkout: (workout: Workout) => void;
  deleteWorkout: (workoutId: string) => void;
  replaceWorkouts: (workouts: Workout[]) => void;
};

export const WorkoutHistoryContext =
  createContext<WorkoutHistoryContextValue | null>(null);

export function WorkoutHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status: authStatus } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>(readWorkoutHistory);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local-only");
  const hasLoadedRemoteRef = useRef(false);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    writeWorkoutHistory(workouts);
  }, [workouts]);

  useEffect(() => {
    hasLoadedRemoteRef.current = false;
    skipNextSyncRef.current = false;

    if (!user) {
      setSyncStatus(authStatus === "loading" ? "loading" : "local-only");
      return;
    }

    let isActive = true;
    setSyncStatus("loading");

    fetchRemoteWorkouts()
      .then(({ workouts: remoteWorkouts }) => {
        if (!isActive) return;

        setWorkouts((localWorkouts) => {
          const merged = mergeWorkoutHistory(localWorkouts, remoteWorkouts);
          skipNextSyncRef.current = true;
          void saveRemoteWorkouts(merged).catch((error) => {
            console.error("Could not save merged workout history.", error);
            if (isActive) setSyncStatus("error");
          });
          return merged;
        });
        hasLoadedRemoteRef.current = true;
        setSyncStatus("synced");
      })
      .catch((error) => {
        console.error("Could not load remote workout history.", error);
        if (isActive) setSyncStatus("error");
      });

    return () => {
      isActive = false;
    };
  }, [authStatus, user]);

  useEffect(() => {
    if (!user || !hasLoadedRemoteRef.current) return;

    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    setSyncStatus("syncing");
    const timeoutId = window.setTimeout(() => {
      saveRemoteWorkouts(workouts)
        .then(() => setSyncStatus("synced"))
        .catch((error) => {
          console.error("Could not sync workout history.", error);
          setSyncStatus("error");
        });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [user, workouts]);

  const addWorkout = useCallback((workout: Workout) => {
    setWorkouts((current) => [...current, workout]);
  }, []);

  const deleteWorkout = useCallback((workoutId: string) => {
    setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
  }, []);

  const replaceWorkouts = useCallback((nextWorkouts: Workout[]) => {
    setWorkouts(nextWorkouts);
  }, []);

  const value = useMemo<WorkoutHistoryContextValue>(
    () => ({
      workouts,
      syncStatus,
      addWorkout,
      deleteWorkout,
      replaceWorkouts,
    }),
    [addWorkout, deleteWorkout, replaceWorkouts, syncStatus, workouts]
  );

  return (
    <WorkoutHistoryContext.Provider value={value}>
      {children}
    </WorkoutHistoryContext.Provider>
  );
}
