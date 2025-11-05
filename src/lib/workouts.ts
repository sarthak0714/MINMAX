import { MongoDataApi } from "./mongoDataApi";

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

const APP_ID = import.meta.env.VITE_MONGO_APP_ID as string;
const DATA_SOURCE =
  (import.meta.env.VITE_MONGO_DATA_SOURCE as string) || "Cluster0";
const BASE_URL =
  (import.meta.env.VITE_MONGO_BASE_URL as string) ||
  "https://data.mongodb-api.com/app";
const DATABASE = "minmax";

function buildClientWithAccessToken(accessToken: string) {
  return new MongoDataApi({ appId: APP_ID, baseUrl: BASE_URL, accessToken });
}

function computeMetrics(exercises: WorkoutExercise[]): WorkoutMetrics {
  let totalVolume = 0;
  let numSets = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      numSets += 1;
      if (
        s.weight != null &&
        Number.isFinite(s.weight) &&
        Number.isFinite(s.reps)
      ) {
        totalVolume += s.weight * s.reps;
      }
    }
  }
  return { totalVolume, numSets };
}

export async function listExercises(accessToken: string): Promise<Exercise[]> {
  const client = buildClientWithAccessToken(accessToken);
  const { documents } = await client.find<Exercise>({
    dataSource: DATA_SOURCE,
    database: DATABASE,
    collection: "exercises",
    sort: { name: 1 },
    limit: 500,
  });
  return documents;
}

export async function createWorkout(
  accessToken: string,
  workout: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
): Promise<string> {
  const client = buildClientWithAccessToken(accessToken);
  const now = new Date().toISOString();
  const metrics = computeMetrics(workout.exercises);
  const { insertedId } = await client.insertOne<Workout>({
    dataSource: DATA_SOURCE,
    database: DATABASE,
    collection: "workouts",
    document: { ...workout, createdAt: now, updatedAt: now, metrics },
  });
  return insertedId;
}

export async function getWorkoutsByDate(
  accessToken: string,
  userId: string,
  dateIso: string
): Promise<Workout[]> {
  const client = buildClientWithAccessToken(accessToken);
  const { documents } = await client.find<Workout>({
    dataSource: DATA_SOURCE,
    database: DATABASE,
    collection: "workouts",
    filter: {
      userId,
      date: { $gte: dateIso.slice(0, 10), $lte: dateIso.slice(0, 10) },
    },
    sort: { date: -1 },
    limit: 20,
  } as any);
  return documents;
}

export async function updateWorkout(
  accessToken: string,
  id: string,
  update: Partial<Pick<Workout, "title" | "notes" | "exercises" | "metrics">>
): Promise<void> {
  const client = buildClientWithAccessToken(accessToken);
  const toSet: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (update.title !== undefined) toSet.title = update.title;
  if (update.notes !== undefined) toSet.notes = update.notes;
  if (update.exercises !== undefined) {
    toSet.exercises = update.exercises;
    toSet.metrics = computeMetrics(update.exercises);
  }
  await client.updateOne({
    dataSource: DATA_SOURCE,
    database: DATABASE,
    collection: "workouts",
    filter: { _id: { $oid: id } },
    update: { $set: toSet },
  });
}
