import { useState, useEffect } from "react";
import { FaHeartbeat, FaChartLine, FaRunning } from "react-icons/fa";
import { RiChatAiFill } from "react-icons/ri";
import Dock from "./components/Dock";
import BackgroundAura from "./components/BackgroundGrad";
import "./App.css";
import WorkoutsPage from "./components/WorkoutsPage";
import List from "./components/List";
import AuthScreen from "./components/AuthScreen";
import { listExercises, createExercise, type Exercise } from "./lib/workouts";
import { checkAuth } from "./lib/auth";

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [active, setActive] = useState("Progress");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    setAuthenticated(checkAuth());
  }, []);

  useEffect(() => {
    async function loadExercises() {
      try {
        setExercisesLoading(true);
        const exs = await listExercises();
        setExercises(exs);
        setExercisesError(null);
      } catch (err) {
        setExercisesError(err instanceof Error ? err.message : String(err));
      } finally {
        setExercisesLoading(false);
      }
    }
    if (active === "Workouts") {
      loadExercises();
    }
  }, [active]);

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
      color: { light: "#ff5555", dark: "#ff1a1a" },
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
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="relative p-0 m=0 aspect-[9/19.5] h-screen max-h-[844px] overflow-hidden flex flex-col justify-end">
        <div className="flex-1 relative overflow-hidden">
          {active === "Today" ? (
            <div className="h-full overflow-y-auto no-scrollbar">
              <WorkoutsPage />
            </div>
          ) : active === "Workouts" ? (
            <div className="h-full overflow-y-auto no-scrollbar">
              {exercisesLoading ? (
                <div className="flex items-center justify-center h-full text-white/60">
                  Loading exercises...
                </div>
              ) : exercisesError ? (
                <div className="flex items-center justify-center h-full text-red-400">
                  Error: {exercisesError}
                </div>
              ) : (
                <List
                  items={exercises}
                  displayScrollbar={false}
                  showGradients={true}
                  onItemAdd={handleExerciseAdd}
                  onItemUpdate={handleExerciseUpdate}
                  onItemDelete={handleExerciseDelete}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white opacity-70">
              <p className="text-lg">{active}</p>
              <p className="text-sm text-gray-400">
                This is your {active} view.
              </p>
            </div>
          )}
        </div>

        {/* 🌈 Background Component */}
        <BackgroundAura color={activeColor} keyId={active} />

        {/* Dock */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <Dock items={items} />
        </div>
      </div>
    </div>
  );
};

export default App;
