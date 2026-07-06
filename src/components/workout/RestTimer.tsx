import { useEffect, useRef, useState } from "react";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useRestTimer } from "../../context/RestTimerContext";
import { playRestTimerDoneSound } from "../../utils/restTimerAudio";
import { useI18n } from "../../i18nContext";

const RING_SIZE = 96;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RestTimer() {
  const { t } = useI18n();
  const [isMinimized, setIsMinimized] = useState(true);
  const {
    state,
    remainingSeconds,
    isBlinking,
    acknowledge,
    close,
    toggleStartPause,
    restart,
    reset,
    adjustTime,
  } = useRestTimer();
  const wasExpiredRef = useRef(state.isExpired);

  useEffect(() => {
    if (!state.isOpen) {
      setIsMinimized(true);
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (!state.isExpired || wasExpiredRef.current) {
      wasExpiredRef.current = state.isExpired;
      return;
    }

    playRestTimerDoneSound();

    if ("vibrate" in navigator) {
      navigator.vibrate([160, 80, 160]);
    }
  }, [state.isExpired]);

  if (!state.isOpen) return null;

  const progress = state.duration > 0 ? (remainingSeconds / state.duration) * 100 : 0;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset =
    RING_CIRCUMFERENCE * (1 - clampedProgress / 100);
  const isExpired = state.isExpired;
  const statusLabel = isExpired
    ? t("timer.complete")
    : state.isActive
      ? t("timer.resting")
      : t("timer.paused");
  const helperText = isExpired
    ? t("timer.completeHelp")
    : state.isActive
      ? t("timer.activeHelp")
      : t("timer.pausedHelp");
  const primaryActionLabel = isExpired
    ? t("timer.startAnother")
    : state.isActive
      ? t("timer.pause")
      : t("timer.resume");
  const confirmTimer = isExpired ? acknowledge : close;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 px-4">
      <section
        className={`pointer-events-auto mx-auto w-full overflow-hidden border shadow-2xl backdrop-blur transition-all duration-300 ${
          isMinimized ? "max-w-xs rounded-3xl p-3" : "max-w-md rounded-[2rem] p-4"
        } ${
          isExpired
            ? "border-emerald-300/50 bg-emerald-950/95 text-emerald-50"
            : "border-slate-700/80 bg-slate-950/95 text-slate-50"
        }`}
        aria-label={t("exercise.restTitle")}
      >
        {isMinimized ? (
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                isExpired ? "bg-emerald-900/70 text-emerald-100" : "bg-slate-900 text-sky-200"
              }`}
              aria-hidden="true"
            >
              <ClockIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p
                className="text-2xl font-black leading-none tabular-nums"
                aria-live={isExpired ? "assertive" : "polite"}
              >
                {formatTime(remainingSeconds)}
              </p>
            </div>

            <button
              onClick={() => setIsMinimized(false)}
              className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 transition-all duration-200 hover:bg-white/10 active:scale-95 ${
                isExpired ? "text-emerald-100" : "text-slate-200"
              }`}
              aria-label={t("timer.maximizeLabel")}
              title={t("timer.maximizeLabel")}
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>

            <button
              onClick={confirmTimer}
              className={`grid h-11 w-11 place-items-center rounded-full border transition-all duration-200 active:scale-95 ${
                isExpired
                  ? "border-emerald-200/30 bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                  : "border-sky-200/30 bg-sky-300 text-sky-950 hover:bg-sky-200"
              }`}
              aria-label={t("timer.confirmLabel")}
              title={t("timer.confirmLabel")}
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
        <div className="flex items-center gap-4">
          <button
            onClick={isExpired ? restart : toggleStartPause}
            className={`relative grid h-24 w-24 shrink-0 place-items-center rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
              isExpired ? "bg-emerald-900/70" : "bg-slate-900"
            }`}
            aria-label={primaryActionLabel}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="-rotate-90"
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="transparent"
                strokeWidth={RING_STROKE}
                className={isExpired ? "stroke-emerald-800" : "stroke-slate-800"}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="transparent"
                strokeLinecap="round"
                strokeWidth={RING_STROKE}
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-300 ease-linear ${
                  isExpired
                    ? "stroke-emerald-300"
                    : isBlinking
                      ? "stroke-amber-300"
                      : "stroke-sky-300"
                }`}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tabular-nums leading-none tracking-tight">
                {formatTime(remainingSeconds)}
              </span>
              <span
                className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  isExpired ? "text-emerald-100/70" : "text-slate-400"
                }`}
              >
                {isExpired
                  ? t("timer.done")
                  : state.isActive
                    ? t("timer.tapPause")
                    : t("timer.tapStart")}
              </span>
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                    isExpired ? "text-emerald-200" : "text-sky-200"
                  }`}
                  aria-live={isExpired ? "assertive" : "polite"}
                >
                  {statusLabel}
                </p>
                <h2 className="mt-1 truncate text-lg font-bold">
                  {state.exerciseName || t("exercise.rest")}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className={`grid h-8 w-8 place-items-center rounded-full border border-white/10 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 ${
                    isExpired ? "text-emerald-100/80" : "text-slate-300"
                  }`}
                  aria-label={t("timer.minimizeLabel")}
                  title={t("timer.minimizeLabel")}
                >
                  <ArrowsPointingInIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={confirmTimer}
                  className={`rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 ${
                    isExpired ? "text-emerald-100/80" : "text-slate-300"
                  }`}
                  aria-label={t("timer.closeLabel")}
                >
                  {t("common.close")}
                </button>
              </div>
            </div>

            <p
              className={`mt-2 text-sm leading-snug ${
                isExpired ? "text-emerald-100/80" : "text-slate-300"
              }`}
            >
              {helperText}
            </p>

            {isExpired ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={restart}
                  className="rounded-2xl border border-emerald-200/30 bg-emerald-300 px-4 py-3 text-sm font-bold text-emerald-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-200 active:translate-y-0"
                >
                  {t("timer.startAnother")}
                </button>
                <button
                  onClick={acknowledge}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0"
                >
                  {t("timer.done")}
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => adjustTime(-15)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                  >
                    -15s
                  </button>
                  <button
                    onClick={() => adjustTime(15)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                  >
                    +15s
                  </button>
                  <button
                    onClick={() => adjustTime(30)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                  >
                    +30s
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                  <button
                    onClick={toggleStartPause}
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                      state.isActive
                        ? "border-rose-200/30 bg-rose-400 text-rose-950 hover:bg-rose-300"
                        : "border-sky-200/30 bg-sky-300 text-sky-950 hover:bg-sky-200"
                    }`}
                  >
                    {primaryActionLabel}
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                    title={t("timer.resetTitle")}
                  >
                    {t("common.reset")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
