import React, { useEffect, useMemo, useState } from "react";
import VolumeBubbles, { type VolumeMode } from "./VolumeBubbles";
import AddWorkoutDrawer from "./AddWorkoutDrawer";
import {
  ensureSeedWorkouts,
  getMockExercises,
  getMockWorkouts,
  addMockWorkout,
} from "../lib/mockData";
import type { Workout } from "../lib/workouts";
import {
  MdOutlineTrendingUp,
  MdTrendingDown,
  MdOutlineTrendingFlat,
} from "react-icons/md";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkoutsPage() {
  const [mode, setMode] = useState<VolumeMode>("month-grid");
  const [open, setOpen] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [userId] = useState("demo");

  useEffect(() => {
    ensureSeedWorkouts();
    setWorkouts(getMockWorkouts());
  }, []);

  const todays = useMemo(
    () => workouts.filter((w) => w.date.slice(0, 10) === todayISO()),
    [workouts]
  );

  const exercises = useMemo(
    () =>
      getMockExercises().map((e) => ({
        _id: e._id,
        name: e.name,
        slug: e.slug,
      })),
    []
  );

  const trend = useMemo(() => {
    if (!todays.length) return null;
    // Aggregate by date
    const byDate = new Map<string, { volume: number; sets: number }>();
    for (const w of workouts) {
      const key = w.date.slice(0, 10);
      const v = w.metrics?.totalVolume ?? 0;
      const s =
        w.metrics?.numSets ??
        w.exercises.reduce((n, ex) => n + ex.sets.length, 0);
      const prev = byDate.get(key) || { volume: 0, sets: 0 };
      byDate.set(key, { volume: prev.volume + v, sets: prev.sets + s });
    }
    const todayKey = todayISO();
    const todayAgg = byDate.get(todayKey) || { volume: 0, sets: 0 };
    const prevKey =
      Array.from(byDate.keys())
        .filter((d) => d < todayKey)
        .sort()
        .pop() || null;
    if (!prevKey) return null;
    const prevAgg = byDate.get(prevKey)!;

    const volDiff = todayAgg.volume - prevAgg.volume;
    const setsDiff = todayAgg.sets - prevAgg.sets;
    const volPct = prevAgg.volume > 0 ? (volDiff / prevAgg.volume) * 100 : 0;
    const direction =
      volDiff > 0 || setsDiff > 0
        ? "up"
        : volDiff < 0 || setsDiff < 0
        ? "down"
        : "flat";
    const prevLabel = new Date(prevKey).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    return {
      volDiff,
      setsDiff,
      volPct,
      direction,
      prevLabel,
      todayAgg,
      prevAgg,
    };
  }, [workouts, todays]);

  const handleSaved = (
    w: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
  ) => {
    addMockWorkout(w);
    setWorkouts(getMockWorkouts());
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-semibold">Workouts</h2>
        <button
          onClick={() => setOpen(true)}
          className="px-4 h-10 rounded-full bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 backdrop-blur-md"
        >
          Log workout
        </button>
      </div>

      <VolumeBubbles
        workouts={workouts}
        mode={mode}
        onModeChange={setMode}
        className="mb-3"
      />

      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white/90 font-medium">Today</div>
          <div className="text-white/60 text-sm">{todayISO()}</div>
        </div>
        {todays.length === 0 ? (
          <div className="text-white/60 text-sm">
            No workouts yet. Log your first workout today.
          </div>
        ) : (
          <div className="space-y-3">
            {todays.map((w) => {
              const v = w.metrics?.totalVolume ?? 0;
              const s = w.metrics?.numSets ?? 0;
              const isUp = trend?.direction === "up";
              const isDown = trend?.direction === "down";
              const isFlat = trend?.direction === "flat";

              return (
                <div
                  key={w._id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white/90 font-medium flex items-center gap-2">
                      {w.title || "Workout"}
                      {trend && (
                        <span
                          className={`${
                            isUp
                              ? "text-green-400"
                              : isDown
                              ? "text-red-400"
                              : "text-yellow-400"
                          } text-xs flex items-center gap-1`}
                        >
                          {isUp && (
                            <MdOutlineTrendingUp className="w-3.5 h-3.5" />
                          )}
                          {isDown && <MdTrendingDown className="w-3.5 h-3.5" />}
                          {isFlat && (
                            <MdOutlineTrendingFlat className="w-3.5 h-3.5" />
                          )}
                          {trend.volDiff > 0 ? "+" : ""}
                          {trend.volDiff}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">{s} sets</span>
                      <span className="text-white/40">·</span>
                      <span
                        className={`font-medium ${
                          isUp
                            ? "text-green-400"
                            : isDown
                            ? "text-red-400"
                            : "text-white/70"
                        }`}
                      >
                        {v}
                      </span>
                    </div>
                  </div>

                  {/* Chips */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {w.exercises.map((ex, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs"
                      >
                        {ex.name}
                      </span>
                    ))}
                  </div>

                  {/* Sub-info chip */}
                  {trend && (
                    <div className="mt-3 text-xs text-white/70">
                      Volume {trend.volDiff > 0 ? "+" : ""}
                      {trend.volDiff}{" "}
                      {trend.volPct ? `(${trend.volPct.toFixed(1)}%)` : ""}
                      {"; "}Sets {trend.setsDiff > 0 ? "+" : ""}
                      {trend.setsDiff}{" "}
                      <span className="text-white/50">
                        (from {trend.prevAgg.volume} vol / {trend.prevAgg.sets}{" "}
                        sets to {trend.todayAgg.volume} / {trend.todayAgg.sets})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddWorkoutDrawer
        open={open}
        onClose={() => setOpen(false)}
        dateISO={todayISO()}
        userId={userId}
        exerciseOptions={exercises}
        onSave={handleSaved}
      />
    </div>
  );
}
