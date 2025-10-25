import { useState } from "react";
import { FaHeartbeat, FaChartLine, FaRunning } from "react-icons/fa";
import { RiChatAiFill } from "react-icons/ri";
import Dock from "./components/Dock";
import "./App.css";

const App = () => {
  const [active, setActive] = useState("Progress");

  const gradientOpacity = 0.5; // Change opacity as needed (0.0 to 1.0)
  const rgb = (hex: string) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };
  const linearGradient = (
    angle: string,
    color1: string,
    color2: string,
    opacity: number
  ) =>
    `linear-gradient(${angle}, rgba(${rgb(color1).join(
      ","
    )},${opacity}), rgba(${rgb(color2).join(",")},${opacity}))`;

  const items = [
    {
      label: "Today",
      icon: FaHeartbeat,
      active: active === "Today",
      onClick: () => setActive("Today"),
      color: linearGradient("135deg", "#007aff", "#00c6ff", gradientOpacity),
    },
    {
      label: "Progress",
      icon: FaChartLine,
      active: active === "Progress",
      onClick: () => setActive("Progress"),
      color: linearGradient("135deg", "#ff3b30", "#ff9500", gradientOpacity),
    },
    {
      label: "Workouts",
      icon: FaRunning,
      active: active === "Workouts",
      onClick: () => setActive("Workouts"),
      color: linearGradient("135deg", "#ffcc00", "#ff9500", gradientOpacity),
    },
    {
      label: "Chat",
      icon: RiChatAiFill,
      active: active === "Chat",
      onClick: () => setActive("Chat"),
      color: linearGradient("135deg", "#00ff48", "#00ff48", gradientOpacity),
    },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Dock items={items} />
    </div>
  );
};

export default App;
