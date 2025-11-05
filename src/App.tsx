import { useState } from "react";
import { FaHeartbeat, FaChartLine, FaRunning } from "react-icons/fa";
import { RiChatAiFill } from "react-icons/ri";
import Dock from "./components/Dock";
import BackgroundAura from "./components/BackgroundGrad";
import "./App.css";
import WorkoutsPage from "./components/WorkoutsPage";
import List from "./components/List";
import exersieItems from "./items/exersise.json";

const App = () => {
  const [active, setActive] = useState("Progress");

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
              <List items={exersieItems} displayScrollbar={false} showGradients={true} />
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
