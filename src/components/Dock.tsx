import React from "react";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
export interface DockItem {
  label: string;
  icon: IconType;
  onClick?: () => void;
  active?: boolean;
  color?: {
    light: string;
    dark: string;
  };
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
            className={`flex flex-col items-center justify-center text-xs font-medium rounded-full px-4 py-3 transition-all duration-300 relative ${
              item.active
                ? "text-gray-300"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            style={{
              border:
                item.active && item.color
                  ? `1px solid ${item.color.light}40` // 40 = 25% opacity in hex
                  : "1px solid transparent",
              boxShadow:
                item.active && item.color
                  ? `inset 0 0 20px ${item.color.light}20, inset 0 0 40px ${item.color.light}10` // Inner glow effect
                  : "none",
              background: "transparent",
            }}
          >
            {/* Text/Icon with dark color fill */}
            <div
              className="flex flex-col items-center justify-center"
              style={{
                color: item.active && item.color ? item.color.dark : undefined,
              }}
            >
              <item.icon
                size={18}
                className="transition-colors duration-300"
                style={{
                  color:
                    item.active && item.color ? item.color.dark : undefined,
                }}
              />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
export default Dock;
