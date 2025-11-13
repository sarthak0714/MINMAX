import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Workout } from "../lib/workouts";

export type VolumeMode = "month-grid" | "week-timeline";

type Props = {
  workouts: Workout[];
  mode: VolumeMode;
  onModeChange?: (m: VolumeMode) => void;
  className?: string;
};

function dayISO(d: Date): string {
  // Use local date, not UTC, to avoid timezone issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthMatrix(base: Date): Date[] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7)); // start Monday
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function rangeDays(endExclusive: Date, length: number): Date[] {
  const days: Date[] = [];
  for (let i = length - 1; i >= 0; i--) {
    const d = new Date(endExclusive);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function VolumeBubbles({
  workouts,
  mode,
  onModeChange,
  className = "",
}: Props) {
  // Recalculate today on each render to ensure it's current
  const today = new Date();

  const volumeByDay = useMemo(() => {
    const map = new Map<string, { volume: number; sets: number }>();
    for (const w of workouts) {
      const key = w.date.slice(0, 10);
      const v = w.metrics?.totalVolume ?? 0;
      const s =
        w.metrics?.numSets ??
        w.exercises.reduce((n, ex) => n + ex.sets.length, 0);
      const prev = map.get(key) || { volume: 0, sets: 0 };
      map.set(key, { volume: prev.volume + v, sets: prev.sets + s });
    }
    return map;
  }, [workouts]);

  const days = useMemo(() => {
    if (mode === "month-grid") return getMonthMatrix(today);
    return rangeDays(today, 21); // 3-week strip by default
  }, [mode, today]);

  const maxVolume = useMemo(() => {
    let max = 0;
    for (const d of days) {
      const k = dayISO(d);
      const v = volumeByDay.get(k)?.volume ?? 0;
      if (v > max) max = v;
    }
    return max || 1;
  }, [days, volumeByDay]);

  const Bubble = ({ d }: { d: Date }) => {
    const k = dayISO(d);
    const v = volumeByDay.get(k)?.volume ?? 0;
    const s = volumeByDay.get(k)?.sets ?? 0;
    const ratio = Math.min(1, Math.sqrt(v / maxVolume));

    const minSize = mode === "month-grid" ? 20 : 24;
    const maxSize = mode === "month-grid" ? 56 : 64;
    const size = Math.round(minSize + ratio * (maxSize - minSize));
    const active = v > 0;

    // ✅ Smaller negative margins for overlap
    const overlap =
      mode === "week-timeline" ? `-${Math.round(size * 0.4)}px` : "0";

    return (
      <motion.div
        layout
        title={`${k}\nSets: ${s}\nVolume: ${v}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          marginLeft: overlap,
          zIndex: active ? 2 : 1,
        }}
      >
        {/* ✅ Only show a visible circle if active */}
        {active ? (
          <div
            className="relative flex items-center justify-center rounded-full backdrop-blur-md"
            style={{
              width: size,
              height: size,
              background: active
                ? "linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.10) 100%)"
                : "transparent",
            }}
          >
            <span className="text-[10px] text-white/90 font-bold select-none">
              {d.getDate()}
            </span>
          </div>
        ) : (
          // ✅ Just show date number (no background)
          <span className="text-[10px] text-white/60 select-none">
            {d.getDate() || ""}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => onModeChange?.("month-grid")}
          className={`px-4 py-2 rounded-full border backdrop-blur-md transition-all ${
            mode === "month-grid"
              ? "bg-white/15 border-white/40 text-white"
              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => onModeChange?.("week-timeline")}
          className={`px-4 py-2 rounded-full border backdrop-blur-md transition-all ${
            mode === "week-timeline"
              ? "bg-white/15 border-white/40 text-white"
              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
          }`}
        >
          Week
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "month-grid" ? (
          <motion.div
            key="month"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            {days.map((d, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 justify-center"
              >
                <Bubble d={d} />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4"
          >
            {/* Inner scroller — only this part scrolls */}
            <div
              ref={(el) => {
                if (el) {
                  // ✅ Scroll to the end (latest date)
                  requestAnimationFrame(() => {
                    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
                  });
                }
              }}
              className="flex items-end gap-2 overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar"
            >
              {days.map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 min-w-[44px] shrink-0"
                >
                  <Bubble d={d} />
                  <span className="text-[10px] text-white/50 whitespace-nowrap">
                    {d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
