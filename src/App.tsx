import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { RestTimer } from "./components/workout/RestTimer";
import { AuthProvider } from "./context/AuthContext";
import { RestTimerProvider } from "./context/RestTimerContext";
import { WorkoutHistoryProvider } from "./context/WorkoutHistoryContext";
import { I18nProvider } from "./i18n";
import { Home } from "./pages/Home";
import { WorkoutLog } from "./pages/WorkoutLog";
import { Progress } from "./pages/Progress";
import { Templates } from "./pages/Templates";
import { CalendarPage } from "./pages/Calendar";
import { WorkoutDetails } from "./pages/WorkoutDetails";
import { ExerciseHistory } from "./pages/ExerciseHistory";
import { Coach } from "./pages/Coach";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <WorkoutHistoryProvider>
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
                    <Route path="/coach" element={<Coach />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/workout/:id" element={<WorkoutDetails />} />
                    <Route path="/exercise/:name" element={<ExerciseHistory />} />
                  </Routes>
                  <Navigation />
                  <RestTimer />
                </div>
              </div>
            </BrowserRouter>
          </RestTimerProvider>
        </WorkoutHistoryProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
