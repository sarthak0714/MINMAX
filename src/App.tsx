import { useState } from "react";
import { FaHeartbeat, FaChartLine, FaRunning } from "react-icons/fa";
import { RiChatAiFill } from "react-icons/ri";
import Dock from "./components/Dock";
import "./App.css";

const App = () => {
  const [active, setActive] = useState("Progress");

  const items = [
    {
      label: "Today",
      icon: FaHeartbeat,
      active: active === "Today",
      onClick: () => setActive("Today"),
      color: {
        light: "#00c6ff", // Lighter blue for border
        dark: "#007aff", // Darker blue for text fill
      },
    },
    {
      label: "Progress",
      icon: FaChartLine,
      active: active === "Progress",
      onClick: () => setActive("Progress"),
      color: {
        light: "#ff9500", // Lighter orange for border
        dark: "#ff3b30", // Darker red-orange for text fill
      },
    },
    {
      label: "Workouts",
      icon: FaRunning,
      active: active === "Workouts",
      onClick: () => setActive("Workouts"),
      color: {
        light: "#ffcc00", // Yellow for border
        dark: "#ff9500", // Darker orange for text fill
      },
    },
    {
      label: "Chat",
      icon: RiChatAiFill,
      active: active === "Chat",
      onClick: () => setActive("Chat"),
      color: {
        light: "#00ff48", // Green for border
        dark: "#00cc3e", // Darker green for text fill
      },
    },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Dock items={items} />
    </div>
  );
};

export default App;
