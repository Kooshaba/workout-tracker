import { useRestTimer } from "../../context/RestTimerContext";

export function RestTimer() {
  const {
    state,
    remainingSeconds,
    isBlinking,
    close,
    toggleStartPause,
    reset,
    adjustTime,
  } = useRestTimer();

  if (!state.isOpen) return null;

  const progress = state.duration > 0 ? (remainingSeconds / state.duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 left-0 right-0 bg-white shadow-lg p-1 z-50 transition-colors duration-100">
      <div className="max-w-3xl mx-auto">
        <div className="w-full h-1 bg-gray-200 rounded-full mb-1">
          <div
            className={`h-full transition-all duration-200 ease-linear rounded-full ${
              isBlinking ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="min-w-[90px] text-center">
            <div className="text-[1.6rem] font-bold leading-none">
              {Math.floor(remainingSeconds / 60)}:
              {(remainingSeconds % 60).toString().padStart(2, "0")}
            </div>
            <div className="text-[10px] text-gray-500 truncate max-w-[90px]">
              {state.exerciseName || "Rest"}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustTime(-30)}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium touch-manipulation"
            >
              -30s
            </button>
            <button
              onClick={() => adjustTime(30)}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium touch-manipulation"
            >
              +30s
            </button>
            <button
              onClick={reset}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium touch-manipulation"
              title="Reset to 90s"
            >
              ↺
            </button>
            <button
              onClick={toggleStartPause}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium touch-manipulation ${
                state.isActive
                  ? "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
              }`}
            >
              {state.isActive ? "Pause" : "Start"}
            </button>
            <button
              onClick={close}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium touch-manipulation"
              aria-label="Close timer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
