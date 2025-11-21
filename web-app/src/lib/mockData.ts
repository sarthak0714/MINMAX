import rawExercises from '../items/exersise.json';
import type { Exercise as DbExercise, Workout, WorkoutExercise, WorkoutSet, WorkoutMetrics } from './workouts';
import { readStorage, writeStorage } from './storage';

const WORKOUTS_KEY = 'workouts';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function idFromSlug(slug: string): string {
  return `ex_${slug}`;
}

function computeMetrics(exercises: WorkoutExercise[]): WorkoutMetrics {
  let totalVolume = 0;
  let numSets = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      numSets += 1;
      const weight = s.weight ?? 0;
      const reps = s.reps ?? 0;
      if (Number.isFinite(weight) && Number.isFinite(reps)) {
        totalVolume += weight * reps;
      }
    }
  }
  return { totalVolume, numSets };
}

export function getMockExercises(): DbExercise[] {
  const now = new Date().toISOString();
  return (rawExercises as Array<{ name: string; targetMuscle: string[]; meta: string[] }>).map(
    (e) => {
      const slug = slugify(e.name);
      return {
        _id: idFromSlug(slug),
        name: e.name,
        targetMuscle: e.targetMuscle || [],
        meta: e.meta || [],
        slug,
        createdAt: now,
      } as DbExercise;
    }
  );
}

export function getMockWorkouts(): Workout[] {
  return readStorage<Workout[]>(WORKOUTS_KEY, []);
}

export function saveMockWorkouts(workouts: Workout[]): void {
  writeStorage<Workout[]>(WORKOUTS_KEY, workouts);
}

export function addMockWorkout(
  input: Omit<Workout, '_id' | 'createdAt' | 'updatedAt' | 'metrics'>
): string {
  const now = new Date().toISOString();
  const metrics = computeMetrics(input.exercises);
  const id = `wo_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const next: Workout = { ...input, _id: id, createdAt: now, updatedAt: now, metrics };
  const curr = getMockWorkouts();
  const updated = [next, ...curr].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  saveMockWorkouts(updated);
  return id;
}

// Optional: seed a few demo workouts if none exist
export function ensureSeedWorkouts(): void {
  const curr = getMockWorkouts();
  if (curr.length > 0) return;
  const exercises = getMockExercises();
  const pick = (name: string) => exercises.find((x) => x.name === name)!;
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  const mkSets = (rep: number, w: number, n: number): WorkoutSet[] =>
    Array.from({ length: n }, (_, i) => ({
      setNumber: i + 1,
      reps: rep,
      weight: w,
      rir: null,
      tempo: null,
      notes: null,
      isWarmup: false,
    }));

  const seed: Workout[] = [
    {
      _id: `wo_seed_${Date.now() - 1}`,
      userId: 'demo',
      date: daysAgo(0),
      title: 'Upper Body',
      notes: '',
      exercises: [
        (() => {
          const ex = pick('Bench Press');
          return { exerciseId: ex._id, name: ex.name, slug: ex.slug, sets: mkSets(8, 60, 4) };
        })(),
        (() => {
          const ex = pick('Rows');
          return { exerciseId: ex._id, name: ex.name, slug: ex.slug, sets: mkSets(10, 50, 3) };
        })(),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: { totalVolume: 0, numSets: 0 },
    },
    {
      _id: `wo_seed_${Date.now() - 2}`,
      userId: 'demo',
      date: daysAgo(2),
      title: 'Lower Body',
      notes: '',
      exercises: [
        (() => {
          const ex = pick('Squats');
          return { exerciseId: ex._id, name: ex.name, slug: ex.slug, sets: mkSets(5, 80, 5) };
        })(),
        (() => {
          const ex = pick('Deadlifts');
          return { exerciseId: ex._id, name: ex.name, slug: ex.slug, sets: mkSets(3, 100, 3) };
        })(),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: { totalVolume: 0, numSets: 0 },
    },
  ];

  // compute metrics for seeds
  for (const w of seed) {
    w.metrics = computeMetrics(w.exercises);
  }
  saveMockWorkouts(seed);
}


