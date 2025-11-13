import mongoose, { Schema } from 'mongoose';

export type ExerciseDoc = {
  name: string;
  targetMuscle: string[];
  meta: string[];
  slug: string;
  createdAt: Date;
};

const ExerciseSchema = new Schema<ExerciseDoc>({
  name: { type: String, required: true },
  targetMuscle: { type: [String], required: true },
  meta: { type: [String], required: true },
  slug: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: () => new Date(), immutable: true },
});

ExerciseSchema.index({ name: 1 });

export const Exercise =
  mongoose.models.Exercise || mongoose.model<ExerciseDoc>('Exercise', ExerciseSchema, 'exercises');

