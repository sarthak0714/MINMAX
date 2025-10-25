import React from "react";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";

export interface DockItem {
  label: string;
  icon: IconType;
  onClick?: () => void;
  active?: boolean;
  color?: string;
}

interface DockProps {
  items: DockItem[];
}

const Dock: React.FC<DockProps> = ({ items }) => {
  return (
    <div className="flex justify-center w-full mt-auto mb-6">
      {/* Outer glassmorphic dock container */}
      <div className="flex items-center justify-center backdrop-blur-lg border border-[rgba(255,255,255,0.1)] rounded-full px-2 py-2 gap-0.5">
        {items.map((item, index) => (
          <motion.button
            key={index}
            onClick={item.onClick}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center justify-center text-xs font-medium rounded-full px-4 py-3 transition-all duration-300  ${
              item.active && item.color
                ? `text-${item.color}`
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            style={{
              background:
                item.active && item.color
                  ? item.color
                  : "rgba(255, 255, 255, 0)",
            }}
          >
            <item.icon size={18} className="text-white" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
export default Dock;
