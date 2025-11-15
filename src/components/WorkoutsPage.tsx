import { useEffect, useMemo, useState, useCallback } from "react";
import VolumeBubbles, { type VolumeMode } from "./VolumeBubbles";
import AddWorkoutDrawer from "./AddWorkoutDrawer";
import type { Workout, WorkoutExercise } from "../lib/workouts";
import {
  listExercises,
  getAllWorkouts,
  createWorkout,
  updateWorkout,
} from "../lib/workouts";
import {
  MdOutlineTrendingUp,
  MdTrendingDown,
  MdOutlineTrendingFlat,
} from "react-icons/md";

function todayISO(): string {
  // Use local date, not UTC, to avoid timezone issues
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10 pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <div className="text-white/60 text-sm">Loading...</div>
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  const [mode, setMode] = useState<VolumeMode>("month-grid");
  const [open, setOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const USER_ID = "single";
  const [exercises, setExercises] = useState<
    { _id: string; name: string; slug: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [exs, allWorkouts] = await Promise.all([
          listExercises(),
          getAllWorkouts(USER_ID),
        ]);
        setExercises(
          exs.map((e) => ({ _id: e._id, name: e.name, slug: e.slug }))
        );
        setWorkouts(allWorkouts);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const todays = useMemo(
    () => workouts.filter((w) => w.date.slice(0, 10) === todayISO()),
    [workouts]
  );

  // Get per-exercise comparisons
  const getExerciseComparison = useCallback(
    (exerciseId: string, todaySets: WorkoutExercise["sets"]) => {
      // Find all previous instances of this exercise, sorted by date (newest first)
      const previousInstances: Array<{
        date: string;
        sets: WorkoutExercise["sets"];
      }> = [];

      for (const w of workouts) {
        const workoutDate = w.date.slice(0, 10);
        const todayKey = todayISO();
        if (workoutDate >= todayKey) continue; // Skip today and future dates

        for (const ex of w.exercises) {
          if (ex.exerciseId === exerciseId) {
            previousInstances.push({ date: workoutDate, sets: ex.sets });
            break; // Only take first occurrence per workout
          }
        }
      }

      if (previousInstances.length === 0) return null;

      // Get the most recent instance
      const last = previousInstances.sort((a, b) =>
        a.date < b.date ? 1 : -1
      )[0];

      // Calculate volume and reps for today's sets
      const todayVolume = todaySets.reduce((sum, s) => {
        return sum + (s.weight ?? 0) * (s.reps ?? 0);
      }, 0);
      const todayReps = todaySets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
      const todayWeight = todaySets.reduce(
        (sum, s) => sum + (s.weight ?? 0),
        0
      );

      // Calculate volume and reps for last time's sets
      const lastVolume = last.sets.reduce((sum, s) => {
        return sum + (s.weight ?? 0) * (s.reps ?? 0);
      }, 0);
      const lastReps = last.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
      const lastWeight = last.sets.reduce((sum, s) => sum + (s.weight ?? 0), 0);

      const volDiff = todayVolume - lastVolume;
      const repsDiff = todayReps - lastReps;
      const weightDiff = todayWeight - lastWeight;
      const volPct = lastVolume > 0 ? (volDiff / lastVolume) * 100 : 0;
      const direction = volDiff > 0 ? "up" : volDiff < 0 ? "down" : "flat";

      const prevLabel = new Date(last.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      return {
        volDiff,
        repsDiff,
        weightDiff,
        volPct,
        direction,
        prevLabel,
        todayVolume,
        lastVolume,
        todayReps,
        lastReps,
        todayWeight,
        lastWeight,
      };
    },
    [workouts]
  );

  const handleSaved = async (
    w: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
  ) => {
    try {
      if (editingWorkout?._id) {
        // Update existing workout
        await updateWorkout(editingWorkout._id, w);
      } else {
        // Create new workout
        await createWorkout({ ...w, userId: USER_ID });
      }
      // Reload all workouts to update calendar and today's list
      const allWorkouts = await getAllWorkouts(USER_ID);
      setWorkouts(allWorkouts);
      setEditingWorkout(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setOpen(true);
  };

  const handleCloseDrawer = () => {
    setOpen(false);
    setEditingWorkout(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 pb-24">
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

      {error && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-pink-500/5 border border-pink-400/15 text-pink-200/80 text-xs">
          {error}
        </div>
      )}
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

            return (
              <div
                key={w._id}
                onClick={() => handleEditWorkout(w)}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                {/* Title */}
                <div className="text-white/90 font-medium mb-2">
                  {w.title || "Workout"}
                </div>

                {/* Stats with units */}
                <div className="flex items-center gap-3 mb-3 text-sm">
                  <span className="text-white/70">
                    <span className="font-medium text-white">{v}</span> kg
                  </span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/70">
                    <span className="font-medium text-white">{s}</span> sets
                  </span>
                </div>

                {/* Per-exercise comparisons */}
                <div className="space-y-2">
                  {w.exercises.map((ex, i) => {
                    const comparison = getExerciseComparison(
                      ex.exerciseId,
                      ex.sets
                    );
                    const exVolume = ex.sets.reduce(
                      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
                      0
                    );
                    const exSets = ex.sets.length;
                    const isUp = comparison?.direction === "up";
                    const isDown = comparison?.direction === "down";
                    const isFlat = comparison?.direction === "flat";

                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        {/* Top row: Exercise name and growth indicator */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/90 text-base font-semibold">
                            {ex.name}
                          </span>
                          {comparison && (
                            <div className="flex items-center gap-1.5 text-xs">
                              {isUp && (
                                <MdOutlineTrendingUp className="w-3.5 h-3.5 text-green-400 shrink-0" />
                              )}
                              {isDown && (
                                <MdTrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              )}
                              {isFlat && (
                                <MdOutlineTrendingFlat className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                              )}
                              <span
                                className={`${
                                  isUp
                                    ? "text-green-400"
                                    : isDown
                                    ? "text-red-400"
                                    : "text-yellow-400"
                                } font-medium`}
                              >
                                {comparison.volDiff > 0 ? "+" : ""}
                                {comparison.volDiff} V
                              </span>
                              {comparison.repsDiff !== 0 && (
                                <>
                                  <span className="text-white/30">·</span>
                                  <span
                                    className={`${
                                      isUp
                                        ? "text-green-400"
                                        : isDown
                                        ? "text-red-400"
                                        : "text-yellow-400"
                                    } font-medium`}
                                  >
                                    {comparison.repsDiff > 0 ? "+" : ""}
                                    {comparison.repsDiff} R
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Main stats */}
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-white/80">
                            <span className="font-bold text-white">
                              {exVolume}
                            </span>
                            <span className="text-white/60 text-sm ml-1">
                              kg
                            </span>
                          </span>
                          <span className="text-white/30">·</span>
                          <span className="text-white/80">
                            <span className="font-bold text-white text-lg">
                              {exSets}
                            </span>
                            <span className="text-white/60 text-sm ml-1">
                              sets
                            </span>
                          </span>
                        </div>

                        {/* Insight line */}
                        {comparison ? (
                          <div className="text-xs text-white/50 leading-tight">
                            (
                            {comparison.volPct
                              ? `${
                                  comparison.volPct > 0 ? "+" : ""
                                }${comparison.volPct.toFixed(1)}% volume`
                              : "no change"}{" "}
                            vs {comparison.prevLabel})
                          </div>
                        ) : (
                          <div className="text-xs text-white/50">
                            (first time logging this exercise)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddWorkoutDrawer
        open={open}
        onClose={handleCloseDrawer}
        dateISO={todayISO()}
        userId={USER_ID}
        exerciseOptions={exercises}
        workout={editingWorkout || undefined}
        onSave={handleSaved}
      />
      
      {isLoading && <LoadingSkeleton />}
    </div>
  );
}
