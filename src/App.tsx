import { useState, useEffect } from "react";
import { FaHeartbeat, FaChartLine, FaRunning } from "react-icons/fa";
import { RiChatAiFill } from "react-icons/ri";
import Dock from "./components/Dock";
import BackgroundAura from "./components/BackgroundGrad";
import "./App.css";
import WorkoutsPage from "./components/WorkoutsPage";
import ProgressPage from "./components/ProgressPage";
import List from "./components/List";
import AuthScreen from "./components/AuthScreen";
import { listExercises, createExercise, type Exercise } from "./lib/workouts";
import { checkAuth } from "./lib/auth";

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [active, setActive] = useState("Today");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exercisesError, setExercisesError] = useState<string | null>(null);
  const [exercisesLoaded, setExercisesLoaded] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    setAuthenticated(checkAuth());
  }, []);

  useEffect(() => {
    async function loadExercises() {
      // Only load once
      if (exercisesLoaded) return;

      try {
        setExercisesLoading(true);
        const exs = await listExercises();
        setExercises(exs);
        setExercisesError(null);
        setExercisesLoaded(true);
      } catch (err) {
        setExercisesError(err instanceof Error ? err.message : String(err));
      } finally {
        setExercisesLoading(false);
      }
    }
    if (active === "Workouts") {
      loadExercises();
    }
  }, [active, exercisesLoaded]);

  const handleExerciseAdd = async (exercise: Exercise) => {
    try {
      const created = await createExercise({
        name: exercise.name,
        targetMuscle: exercise.targetMuscle,
        meta: exercise.meta,
      });
      setExercises((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      // Force reload with cache bust to ensure fresh data
      const exs = await listExercises(true);
      setExercises(exs);
    } catch (err) {
      console.error("Failed to create exercise:", err);
      // Still add to local state for UI, but it won't persist
      setExercises((prev) =>
        [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  };

  const handleExerciseUpdate = async (exercise: Exercise, index: number) => {
    // For now, just update local state
    // TODO: Implement updateExercise API endpoint
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = exercise;
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleExerciseDelete = (index: number) => {
    // For now, just update local state
    // TODO: Implement deleteExercise API endpoint
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const items = [
    {
      label: "Today",
      icon: FaHeartbeat,
      active: active === "Today",
      onClick: () => setActive("Today"),
      color: { light: "#ff6b9d", dark: "#ff4d87" },
    },
    {
      label: "Progress",
      icon: FaChartLine,
      active: active === "Progress",
      onClick: () => setActive("Progress"),
      color: { light: "#00ff48", dark: "#00cc3e" },
    },
    {
      label: "Workouts",
      icon: FaRunning,
      active: active === "Workouts",
      onClick: () => setActive("Workouts"),
      color: { light: "#ffcc00", dark: "#ff9500" },
    },
    {
      label: "Chat",
      icon: RiChatAiFill,
      active: active === "Chat",
      onClick: () => setActive("Chat"),
      color: { light: "#00c6ff", dark: "#007aff" },
    },
  ];

  const activeColor = items.find((i) => i.active)?.color?.light ?? "#ffffff";

  // Show auth screen if not authenticated
  if (!authenticated) {
    return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      <div className="relative p-0 m-0 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {active === "Today" ? (
            <div className="h-full overflow-y-auto no-scrollbar">
              <WorkoutsPage />
            </div>
          ) : active === "Workouts" ? (
            <div className="h-full overflow-y-auto no-scrollbar relative">
              {exercisesError ? (
                <div className="flex items-center justify-center h-full text-red-400">
                  Error: {exercisesError}
                </div>
              ) : (
                <>
                  <List
                    items={exercises}
                    displayScrollbar={false}
                    showGradients={true}
                    onItemAdd={handleExerciseAdd}
                    onItemUpdate={handleExerciseUpdate}
                    onItemDelete={handleExerciseDelete}
                  />
                  {exercisesLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <div className="text-white/60">Loading exercises...</div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : active === "Progress" ? (
            <div className="h-full overflow-y-auto no-scrollbar">
              <ProgressPage />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white opacity-70">
              <p className="text-lg">{active}</p>
              <p className="text-sm text-gray-400">
                To be added through LLM support.
              </p>
            </div>
          )}
        </div>

        {/* 🌈 Background Component */}
        <BackgroundAura color={activeColor} keyId={active} />

        {/* Dock */}
        <div className="flex justify-center z-50 pb-4 px-4">
          <Dock items={items} />
        </div>
      </div>
    </div>
  );
};

export default App;
