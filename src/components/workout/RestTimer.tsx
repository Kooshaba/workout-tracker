import { useState, useEffect, useMemo } from "react";

type Props = {
  onClose: () => void;
};

export function RestTimer({ onClose }: Props) {
  const [seconds, setSeconds] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(60);

  const audioRef = useMemo(() => new Audio("/bell.mp3"), []);

  const progress = (seconds / totalSeconds) * 100;

  useEffect(() => {
    let interval: number;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);

      if (seconds <= 5) {
        setIsBlinking(true);
      }
    } else if (seconds === 0) {
      setIsActive(false);
      setIsBlinking(false);
      audioRef.play();
    }

    return () => clearInterval(interval);
  }, [audioRef, isActive, seconds]);

  const adjustTime = (adjustment: number) => {
    const newTime = Math.max(0, seconds + adjustment);
    setSeconds(newTime);
    setTotalSeconds(newTime);
  };

  const getAnimationClass = () => {
    if (seconds <= 3) return "animate-bounce";
    if (seconds <= 5) return "animate-pulse";
    return "";
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${
        isBlinking
          ? "animate-blink bg-red-500 bg-opacity-50"
          : "bg-black bg-opacity-50"
      }`}
    >
      <div className="bg-white p-6 rounded-lg w-64">
        <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => adjustTime(-10)}
            className="bg-gray-200 hover:bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold"
          >
            -10
          </button>
          <div
            className={`text-4xl font-bold text-center ${getAnimationClass()}`}
          >
            {Math.floor(seconds / 60)}:
            {(seconds % 60).toString().padStart(2, "0")}
          </div>
          <button
            onClick={() => adjustTime(10)}
            className="bg-gray-200 hover:bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold"
          >
            +10
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => adjustTime(-60)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            -1:00
          </button>
          <button
            onClick={() => adjustTime(-30)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            -0:30
          </button>
          <button
            onClick={() => adjustTime(60)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            +1:00
          </button>
          <button
            onClick={() => adjustTime(30)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            +0:30
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-full py-2 rounded-lg ${
              isActive ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}
          >
            {isActive ? "Pause" : "Start"}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
