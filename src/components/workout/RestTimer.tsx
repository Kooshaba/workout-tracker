import { useState, useEffect } from "react";

type Props = {
  onClose: () => void;
};

export function RestTimer({ onClose }: Props) {
  const [seconds, setSeconds] = useState(60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: number;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-64">
        <div className="text-4xl font-bold text-center mb-4">
          {Math.floor(seconds / 60)}:
          {(seconds % 60).toString().padStart(2, "0")}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setSeconds(60)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            1:00
          </button>
          <button
            onClick={() => setSeconds(90)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            1:30
          </button>
          <button
            onClick={() => setSeconds(120)}
            className="w-full bg-gray-200 py-2 rounded-lg"
          >
            2:00
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
