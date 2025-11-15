export type Exercise = {
  _id: string;
  name: string;
  targetMuscle: string[];
  meta: string[];
  slug: string;
  createdAt: string;
};

export type WorkoutSet = {
  setNumber: number;
  reps: number;
  weight: number | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
  isWarmup: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  name: string;
  slug: string;
  sets: WorkoutSet[];
};

export type WorkoutMetrics = {
  totalVolume: number;
  numSets: number;
  durationMin?: number | null;
};

export type Workout = {
  _id?: string;
  userId: string;
  date: string; // ISO
  title?: string;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt?: string;
  updatedAt?: string;
  metrics?: WorkoutMetrics;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

export async function listExercises(bustCache = false): Promise<Exercise[]> {
  const url = `${API_BASE}/exercises${bustCache ? `?_t=${Date.now()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listExercises failed: ${res.status}`);
  const { documents } = await res.json();
  return documents as Exercise[];
}

export async function createExercise(
  exercise: Omit<Exercise, "_id" | "slug" | "createdAt">
): Promise<Exercise> {
  const res = await fetch(`${API_BASE}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `createExercise failed: ${res.status}`);
  }
  const { document } = await res.json();
  return document as Exercise;
}

export async function updateExercise(
  _id: string,
  _exercise: Partial<Omit<Exercise, "_id" | "slug" | "createdAt">>
): Promise<Exercise> {
  // Note: Update endpoint not yet implemented in backend
  // For now, we'll need to add it or handle updates differently
  throw new Error("updateExercise not yet implemented");
}

export async function createWorkout(
  workout: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
): Promise<string> {
  const res = await fetch(`${API_BASE}/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workout),
  });
  if (!res.ok) throw new Error(`createWorkout failed: ${res.status}`);
  const { insertedId } = await res.json();
  return insertedId as string;
}

export async function getWorkoutsByDate(
  userId: string,
  dateIso: string
): Promise<Workout[]> {
  const u = new URL(`${API_BASE}/workouts`, window.location.origin);
  u.searchParams.set("userId", userId);
  u.searchParams.set("date", dateIso.slice(0, 10));
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`getWorkoutsByDate failed: ${res.status}`);
  const { documents } = await res.json();
  return documents as Workout[];
}

export async function getAllWorkouts(userId: string): Promise<Workout[]> {
  const u = new URL(`${API_BASE}/workouts`, window.location.origin);
  u.searchParams.set("userId", userId);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`getAllWorkouts failed: ${res.status}`);
  const { documents } = await res.json();
  return documents as Workout[];
}

export async function updateWorkout(
  id: string,
  workout: Partial<Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">>
): Promise<Workout> {
  const res = await fetch(`${API_BASE}/workouts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workout),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `updateWorkout failed: ${res.status}`);
  }
  const { document } = await res.json();
  return document as Workout;
}
