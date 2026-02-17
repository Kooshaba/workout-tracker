import { createContext, useContext, useEffect, useMemo, useState } from "react";

type TimerState = {
  isOpen: boolean;
  isActive: boolean;
  exerciseName: string;
  duration: number;
  endAt: number | null;
};

type RestTimerContextValue = {
  state: TimerState;
  remainingSeconds: number;
  isBlinking: boolean;
  openForExercise: (exerciseName: string) => void;
  close: () => void;
  toggleStartPause: () => void;
  reset: () => void;
  adjustTime: (deltaSeconds: number) => void;
};

const STORAGE_KEY = "globalRestTimerState";
const EXERCISE_TIMES_KEY = "exerciseRestTimes";
const DEFAULT_TIME = 90;

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

function readInitialState(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        isOpen: false,
        isActive: false,
        exerciseName: "",
        duration: DEFAULT_TIME,
        endAt: null,
      };
    }
    const parsed = JSON.parse(raw) as TimerState;
    return {
      isOpen: parsed.isOpen ?? false,
      isActive: parsed.isActive ?? false,
      exerciseName: parsed.exerciseName ?? "",
      duration: parsed.duration ?? DEFAULT_TIME,
      endAt: parsed.endAt ?? null,
    };
  } catch {
    return {
      isOpen: false,
      isActive: false,
      exerciseName: "",
      duration: DEFAULT_TIME,
      endAt: null,
    };
  }
}

function readExerciseTime(exerciseName: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(EXERCISE_TIMES_KEY) || "{}");
    return saved[exerciseName] || DEFAULT_TIME;
  } catch {
    return DEFAULT_TIME;
  }
}

function saveExerciseTime(exerciseName: string, seconds: number) {
  try {
    const saved = JSON.parse(localStorage.getItem(EXERCISE_TIMES_KEY) || "{}");
    saved[exerciseName] = seconds;
    localStorage.setItem(EXERCISE_TIMES_KEY, JSON.stringify(saved));
  } catch {
    // noop
  }
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(() => readInitialState());
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!state.isActive || !state.endAt) return state.duration;
    return Math.max(0, Math.ceil((state.endAt - nowMs) / 1000));
  }, [state, nowMs]);

  useEffect(() => {
    if (state.isActive && remainingSeconds === 0) {
      setState((prev) => ({ ...prev, isActive: false, endAt: null }));
    }
  }, [state.isActive, remainingSeconds]);

  const isBlinking = remainingSeconds > 0 && remainingSeconds <= 5;

  function openForExercise(exerciseName: string) {
    const seconds = readExerciseTime(exerciseName);
    setState({
      isOpen: true,
      isActive: false,
      exerciseName,
      duration: seconds,
      endAt: null,
    });
  }

  function close() {
    setState((prev) => ({ ...prev, isOpen: false, isActive: false, endAt: null }));
  }

  function toggleStartPause() {
    setState((prev) => {
      if (!prev.exerciseName) return prev;

      if (!prev.isActive) {
        saveExerciseTime(prev.exerciseName, remainingSeconds);
        if (remainingSeconds <= 0) {
          return {
            ...prev,
            isActive: true,
            duration: prev.duration,
            endAt: Date.now() + prev.duration * 1000,
          };
        }
        return {
          ...prev,
          isActive: true,
          duration: remainingSeconds,
          endAt: Date.now() + remainingSeconds * 1000,
        };
      }

      return {
        ...prev,
        isActive: false,
        duration: remainingSeconds,
        endAt: null,
      };
    });
  }

  function reset() {
    setState((prev) => ({ ...prev, isActive: false, duration: DEFAULT_TIME, endAt: null }));
  }

  function adjustTime(deltaSeconds: number) {
    setState((prev) => {
      const base = prev.isActive ? remainingSeconds : prev.duration;
      const next = Math.max(0, base + deltaSeconds);
      if (prev.isActive) {
        return { ...prev, duration: next, endAt: Date.now() + next * 1000 };
      }
      return { ...prev, duration: next };
    });
  }

  const value: RestTimerContextValue = {
    state,
    remainingSeconds,
    isBlinking,
    openForExercise,
    close,
    toggleStartPause,
    reset,
    adjustTime,
  };

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>;
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error("useRestTimer must be used within RestTimerProvider");
  return ctx;
}
