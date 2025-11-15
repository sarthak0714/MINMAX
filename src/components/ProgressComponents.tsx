import { motion } from "framer-motion";
import { useState } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// Custom date picker component inspired by React Bits
export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: "Last 7 Days", value: "last-7-days" },
    { label: "Last 30 Days", value: "last-30-days" },
    { label: "Last 3 Months", value: "last-3-months" },
    { label: "All Time", value: "all-time" },
  ];

  return (
    <div className="relative">
      {label && <div className="text-white/60 text-sm mb-2">{label}</div>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/15 transition-all"
      >
        {presets.find((p) => p.value === value)?.label || "Select Range"}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden shadow-lg shadow-white/10 z-50"
        >
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                onChange(preset.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                value === preset.value
                  ? "bg-white/20 text-white"
                  : "text-white/80"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Skeleton loader for charts
export function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
      <div className="h-64 bg-white/5 rounded"></div>
    </div>
  );
}

// Error display component
export function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30">
      <div className="text-red-400 font-medium mb-1">Error</div>
      <div className="text-white/80 text-sm">{message}</div>
    </div>
  );
}

// Export button with loading state
export function ExportButton({
  onExport,
  loading,
  label = "Export",
}: {
  onExport: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <motion.button
      onClick={onExport}
      disabled={loading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-white hover:from-blue-500/30 hover:to-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          Exporting...
        </span>
      ) : (
        label
      )}
    </motion.button>
  );
}

// Insight card with animation
export function InsightCard({
  title,
  message,
}: {
  type?: "success" | "warning" | "info";
  title: string;
  message: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/10"
    >
      <div className="text-white/80 font-medium">{title}</div>
      <div className="text-white/60 text-sm mt-1">{message}</div>
    </motion.div>
  );
}

// Heatmap cell component
export function HeatmapCell({
  date,
  intensity,
  onClick,
}: {
  date: string;
  intensity: number;
  onClick?: () => void;
}) {
  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-white/5";
    if (intensity < 30) return "bg-green-400/20";
    if (intensity < 60) return "bg-green-400/40";
    if (intensity < 80) return "bg-green-400/60";
    return "bg-green-400/80";
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className={`w-3 h-3 rounded-sm ${getColor(
        intensity
      )} cursor-pointer border border-white/10`}
      title={`${date}: ${intensity}% activity`}
    />
  );
}
