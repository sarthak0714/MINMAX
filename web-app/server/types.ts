// Shared types matching frontend src/lib/workouts.ts

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

