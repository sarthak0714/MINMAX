import { useState } from "react";
import { FaHeartbeat, FaChartLine, FaRunning } from "react-icons/fa";
import { RiChatAiFill } from "react-icons/ri";
import Dock from "./components/Dock";
import BackgroundAura from "./components/BackgroundGrad";
import "./App.css";

const App = () => {
  const [active, setActive] = useState("Progress");

  const items = [
    {
      label: "Today",
      icon: FaHeartbeat,
      active: active === "Today",
      onClick: () => setActive("Today"),
      color: { light: "#00c6ff", dark: "#007aff" },
    },
    {
      label: "Progress",
      icon: FaChartLine,
      active: active === "Progress",
      onClick: () => setActive("Progress"),
      color: { light: "#ff9500", dark: "#ff3b30" },
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
      color: { light: "#00ff48", dark: "#00cc3e" },
    },
  ];

  const activeColor = items.find((i) => i.active)?.color?.light ?? "#ffffff";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* 🌈 Background Component */}
      <BackgroundAura color={activeColor} keyId={active} />

      {/* Dock */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <Dock items={items} />
      </div>
    </div>
  );
};

export default App;
