import  { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Workout, WorkoutExercise, WorkoutSet } from "../lib/workouts";
import { FaFeather, FaFire, FaTimes } from "react-icons/fa";

type ExerciseOption = {
  _id: string;
  name: string;
  slug: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  dateISO: string;
  userId: string;
  exerciseOptions: ExerciseOption[];
  workout?: Workout; // If provided, we're editing
  onSave: (
    workout: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
  ) => void;
};

function newSet(index: number): WorkoutSet {
  return {
    setNumber: index + 1,
    reps: 8,
    weight: 40,
    rir: null,
    tempo: null,
    notes: null,
    isWarmup: false,
  };
}

export default function AddWorkoutDrawer({
  open,
  onClose,
  dateISO,
  userId,
  exerciseOptions,
  workout,
  onSave,
}: Props) {
  const [title, setTitle] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [items, setItems] = useState<WorkoutExercise[]>([]);
  const [dateValue, setDateValue] = useState<string>(dateISO);

  // Reset form when drawer opens/closes or workout changes
  useEffect(() => {
    if (open) {
      if (workout) {
        // Editing mode: populate with existing workout data
        setTitle(workout.title || "");
        setNote(workout.notes || "");
        setDateValue(workout.date.slice(0, 10));
        setItems(workout.exercises || []);
      } else {
        // New workout mode: reset to defaults
        setDateValue(dateISO);
        setTitle("");
        setNote("");
        setItems([]);
      }
      setSearch("");
    }
  }, [open, dateISO, workout]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exerciseOptions;
    return exerciseOptions.filter((e) => e.name.toLowerCase().includes(q));
  }, [exerciseOptions, search]);

  const addExercise = (opt: ExerciseOption) => {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: opt._id,
        name: opt.name,
        slug: opt.slug,
        sets: [
          { ...newSet(0), isWarmup: true }, // First set is warmup
          newSet(1), // Second set is main
        ],
      },
    ]);
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    patch: Partial<WorkoutSet>
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], ...patch } as WorkoutSet;
      ex.sets = sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const addSetRow = (exIdx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = [...ex.sets, newSet(ex.sets.length)];
      next[exIdx] = ex;
      return next;
    });
  };

  const removeSetRow = (exIdx: number, setIdx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = ex.sets
        .filter((_, i) => i !== setIdx)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const removeExercise = (exIdx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const handleSave = () => {
    const workout: Omit<
      Workout,
      "_id" | "createdAt" | "updatedAt" | "metrics"
    > = {
      userId,
      date: dateValue,
      title: title || undefined,
      notes: note || undefined,
      exercises: items,
    };
    onSave(workout);
    // reset minimal state
    setItems([]);
    setTitle("");
    setNote("");
    setSearch("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="ml-auto h-full w-full max-w-xl bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-xl border-l border-white/10 p-4 pb-24 overflow-y-auto"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{
              transform: 'translateZ(0)',
              willChange: 'transform',
              WebkitTransform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-medium">
                {workout ? "Edit Workout" : "Log Workout"}
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/20"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <input
                className="px-4 h-11 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 backdrop-blur-md"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                placeholder="Date"
                type="date"
                className="px-4 h-11 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 backdrop-blur-md"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />
              <input
                className="px-4 h-11 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 backdrop-blur-md"
                placeholder="Notes (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  className="flex-1 px-4 h-11 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 backdrop-blur-md"
                  placeholder="Search exercises..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {filtered.map((e) => (
                  <button
                    key={e._id}
                    onClick={() => addExercise(e)}
                    className="text-left px-3 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 hover:bg-white/15"
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {items.map((ex, exIdx) => (
                <div
                  key={`${ex.slug}-${exIdx}`}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white/90 font-medium">{ex.name}</div>
                    <button
                      className="text-white/60 text-xs underline"
                      onClick={() => removeExercise(exIdx)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ex.sets.map((s, setIdx) => (
                      <div
                        key={setIdx}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-2 text-white/60 text-sm">
                          Set {setIdx + 1}
                        </div>
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, {
                              reps: Number(e.target.value),
                            })
                          }
                          className="col-span-3 px-3 h-9 rounded-full bg-white/10 border border-white/20 text-white"
                          placeholder="Reps"
                        />
                        <input
                          type="number"
                          value={s.weight ?? 0}
                          onChange={(e) =>
                            updateSet(exIdx, setIdx, {
                              weight: Number(e.target.value),
                            })
                          }
                          className="col-span-3 px-3 h-9 rounded-full bg-white/10 border border-white/20 text-white"
                          placeholder="Weight"
                        />
                        <button
                          className={`col-span-2 px-3 h-9 rounded-full bg-white/10 border border-white/20 text-white/80 flex items-center justify-center ${
                            s.isWarmup ? "text-white" : "text-orange-200"
                          }`}
                          onClick={() =>
                            updateSet(exIdx, setIdx, { isWarmup: !s.isWarmup })
                          }
                          title={s.isWarmup ? "Warmup set" : "Main set"}
                        >
                          {s.isWarmup ? <FaFeather /> : <FaFire />}
                        </button>
                        <button
                          className="col-span-2 px-3 h-9 rounded-full bg-white/10 border border-white/20 text-white/70 flex items-center justify-center"
                          onClick={() => removeSetRow(exIdx, setIdx)}
                          title="Remove set"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                    <div>
                      <button
                        className="px-3 h-9 rounded-full bg-white/10 border border-white/20 text-white/80"
                        onClick={() => addSetRow(exIdx)}
                      >
                        + Add set
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-4" />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!items.length}
                className="flex-1 h-11 rounded-full bg-white/20 border border-white/40 text-white disabled:opacity-50"
              >
                {workout ? "Update workout" : "Save workout"}
              </button>
              <button
                onClick={onClose}
                className="h-11 px-4 rounded-full bg-white/10 border border-white/20 text-white/80"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
