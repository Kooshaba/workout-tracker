import { useState, useEffect } from "react";

type Props = {
  onClose: () => void;
  exerciseName: string;
};

export function RestTimer({ onClose, exerciseName }: Props) {
  const DEFAULT_TIME = 90;

  const [seconds, setSeconds] = useState(() => {
    const savedTimes = JSON.parse(
      localStorage.getItem("exerciseRestTimes") || "{}"
    );
    return savedTimes[exerciseName] || DEFAULT_TIME;
  });
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(seconds);

  const progress = (seconds / totalSeconds) * 100;

  const handleStart = () => {
    if (!isActive) {
      const savedTimes = JSON.parse(
        localStorage.getItem("exerciseRestTimes") || "{}"
      );
      savedTimes[exerciseName] = seconds;
      localStorage.setItem("exerciseRestTimes", JSON.stringify(savedTimes));
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setSeconds(DEFAULT_TIME);
    setTotalSeconds(DEFAULT_TIME);
    setIsActive(false);
    setIsBlinking(false);
  };

  useEffect(() => {
    let interval: number;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((seconds: number) => seconds - 1);
      }, 1000);

      if (seconds <= 5) {
        setIsBlinking(true);
      }
    } else if (seconds === 0) {
      setIsActive(false);
      setIsBlinking(false);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const adjustTime = (adjustment: number) => {
    const newTime = Math.max(0, seconds + adjustment);
    setSeconds(newTime);
    setTotalSeconds(newTime);
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 bg-white shadow-lg p-1 z-50">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full mb-1">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isBlinking ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-1">
          {/* Timer display */}
          <div
            style={{
              fontSize: "1.75rem",
            }}
            className="font-bold min-w-[80px] text-center"
          >
            {Math.floor(seconds / 60)}:
            {(seconds % 60).toString().padStart(2, "0")}
          </div>

          {/* Control buttons */}
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
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium touch-manipulation"
              title="Reset to 90s"
            >
              ↺
            </button>
            <button
              onClick={handleStart}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium touch-manipulation ${
                isActive
                  ? "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
              }`}
            >
              {isActive ? "Pause" : "Start"}
            </button>
            <button
              onClick={onClose}
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
