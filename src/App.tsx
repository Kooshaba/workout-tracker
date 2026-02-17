import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { RestTimer } from "./components/workout/RestTimer";
import { RestTimerProvider } from "./context/RestTimerContext";
import { Home } from "./pages/Home";
import { WorkoutLog } from "./pages/WorkoutLog";
import { Progress } from "./pages/Progress";
import { Templates } from "./pages/Templates";
import { CalendarPage } from "./pages/Calendar";
import { WorkoutDetails } from "./pages/WorkoutDetails";
import { ExerciseHistory } from "./pages/ExerciseHistory";

function App() {
  return (
    <RestTimerProvider>
      <BrowserRouter>
        <div className="dark-theme min-h-screen bg-gray-100">
          <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workout" element={<WorkoutLog />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/workout/:id" element={<WorkoutDetails />} />
              <Route path="/exercise/:name" element={<ExerciseHistory />} />
            </Routes>
            <Navigation />
            <RestTimer />
          </div>
        </div>
      </BrowserRouter>
    </RestTimerProvider>
  );
}

export default App;
