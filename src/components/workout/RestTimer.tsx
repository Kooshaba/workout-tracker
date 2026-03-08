import { useRestTimer } from "../../context/RestTimerContext";

export function RestTimer() {
  const {
    state,
    remainingSeconds,
    isBlinking,
    acknowledge,
    close,
    toggleStartPause,
    reset,
    adjustTime,
  } = useRestTimer();

  if (!state.isOpen) return null;

  const progress = state.duration > 0 ? (remainingSeconds / state.duration) * 100 : 0;
  const isExpired = state.isExpired;

  return (
    <div
      className={`fixed bottom-24 left-0 right-0 bg-white shadow-lg p-1 z-50 transition-colors duration-100 ${
        isExpired ? "border-y border-red-500/60 bg-red-950/60 animate-blink" : ""
      }`}
    >
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
            <div
              className={`text-[1.6rem] font-bold leading-none ${
                isExpired ? "text-red-200" : ""
              }`}
            >
              {Math.floor(remainingSeconds / 60)}:
              {(remainingSeconds % 60).toString().padStart(2, "0")}
            </div>
            <div
              className={`text-[10px] truncate max-w-[90px] ${
                isExpired ? "text-red-200" : "text-gray-500"
              }`}
            >
              {isExpired ? "Timer done" : state.exerciseName || "Rest"}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isExpired ? (
              <>
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5 touch-manipulation"
                  title="Reset to saved rest time"
                >
                  Reset
                </button>
                <button
                  onClick={acknowledge}
                  className="rounded-xl border border-red-400 bg-red-500 px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-400 active:translate-y-0.5 touch-manipulation"
                >
                  Acknowledge
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => adjustTime(-30)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5 touch-manipulation"
                >
                  -30s
                </button>
                <button
                  onClick={() => adjustTime(30)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5 touch-manipulation"
                >
                  +30s
                </button>
                <button
                  onClick={reset}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0.5 touch-manipulation"
                  title="Reset to 90s"
                >
                  ↺
                </button>
                <button
                  onClick={toggleStartPause}
                  className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 touch-manipulation ${
                    state.isActive
                      ? "border-rose-900/80 bg-rose-950/50 text-rose-100 hover:bg-rose-900/50"
                      : "border-sky-800 bg-sky-950/60 text-sky-100 hover:bg-sky-900/70"
                  }`}
                >
                  {state.isActive ? "Pause" : "Start"}
                </button>
                <button
                  onClick={close}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800/70 hover:text-slate-100 active:translate-y-0.5 touch-manipulation"
                  aria-label="Close timer"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
