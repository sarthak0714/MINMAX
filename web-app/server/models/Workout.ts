import mongoose, { Schema } from 'mongoose';

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
  exerciseId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  sets: WorkoutSet[];
};

export type WorkoutDoc = {
  userId: string;
  date: Date;
  title?: string;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
  metrics?: { totalVolume: number; numSets: number; durationMin?: number | null };
};

const SetSchema = new Schema<WorkoutSet>({
  setNumber: { type: Number, required: true },
  reps: { type: Number, required: true },
  weight: { type: Number, default: null },
  rir: { type: Number, default: null },
  tempo: { type: String, default: null },
  notes: { type: String, default: null },
  isWarmup: { type: Boolean, default: false },
});

const WorkoutExerciseSchema = new Schema<WorkoutExercise>({
  exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  sets: { type: [SetSchema], default: [] },
});

const WorkoutSchema = new Schema<WorkoutDoc>({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  title: { type: String },
  notes: { type: String },
  exercises: { type: [WorkoutExerciseSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
  metrics: {
    totalVolume: { type: Number, default: 0 },
    numSets: { type: Number, default: 0 },
    durationMin: { type: Number, default: null },
  } as any,
});

WorkoutSchema.index({ userId: 1, date: -1 });
WorkoutSchema.index({ 'exercises.exerciseId': 1 });

export const Workout =
  mongoose.models.Workout || mongoose.model<WorkoutDoc>('Workout', WorkoutSchema, 'workouts');

