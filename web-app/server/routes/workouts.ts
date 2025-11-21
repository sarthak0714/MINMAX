import { Router } from 'express';
import { Workout } from '../models/Workout.js';
import type { Workout as WorkoutType } from '../types.js';

const router = Router();

function computeMetrics(exercises: any[]) {
  let totalVolume = 0;
  let numSets = 0;
  for (const ex of exercises || []) {
    for (const s of ex.sets || []) {
      numSets += 1;
      if (s && typeof s.weight === 'number' && typeof s.reps === 'number') {
        totalVolume += s.weight * s.reps;
      }
    }
  }
  return { totalVolume, numSets };
}

router.get('/', async (req, res) => {
  try {
    const { userId, date } = req.query as { userId?: string; date?: string };
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (date) {
      // Parse date string (YYYY-MM-DD) and create date range in local timezone
      const [year, month, day] = date.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    
    const docs = await Workout.find(filter, null, { lean: true })
      .sort({ date: -1 })
      .limit(50)
      .exec();
    
    const documents: WorkoutType[] = docs.map((doc: any) => {
      // Convert date to local YYYY-MM-DD format to avoid timezone issues
      const date = doc.date instanceof Date ? doc.date : new Date(doc.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      return {
        _id: doc._id.toString(),
        userId: doc.userId,
        date: dateStr,
        title: doc.title,
        notes: doc.notes,
        exercises: doc.exercises.map((ex: any) => ({
          exerciseId: ex.exerciseId.toString(),
          name: ex.name,
          slug: ex.slug,
          sets: ex.sets,
        })),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        metrics: doc.metrics,
      };
    });

    return res.status(200).json({ documents });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const now = new Date();
    const metrics = computeMetrics(body.exercises);
    
    // Parse date string (YYYY-MM-DD) to avoid timezone issues
    let workoutDate: Date;
    if (body.date) {
      const [year, month, day] = body.date.split('-').map(Number);
      workoutDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid timezone edge cases
    } else {
      workoutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    }
    
    const doc = await Workout.create({
      userId: body.userId || 'single',
      date: workoutDate,
      title: body.title || undefined,
      notes: body.notes || undefined,
      exercises: body.exercises || [],
      createdAt: now,
      updatedAt: now,
      metrics,
    });
    
    return res.status(201).json({ insertedId: (doc as any)._id.toString() });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const now = new Date();
    const metrics = computeMetrics(body.exercises || []);
    
    // Parse date string (YYYY-MM-DD) if provided
    let workoutDate: Date | undefined;
    if (body.date) {
      const [year, month, day] = body.date.split('-').map(Number);
      workoutDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    
    const update: any = {
      updatedAt: now,
      metrics,
    };
    
    if (body.title !== undefined) update.title = body.title || undefined;
    if (body.notes !== undefined) update.notes = body.notes || undefined;
    if (body.exercises !== undefined) update.exercises = body.exercises;
    if (workoutDate) update.date = workoutDate;
    
    const doc = await Workout.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, lean: true }
    );
    
    if (!doc) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    // Convert date to local YYYY-MM-DD format
    const date = doc.date instanceof Date ? doc.date : new Date(doc.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const document: WorkoutType = {
      _id: doc._id.toString(),
      userId: doc.userId,
      date: dateStr,
      title: doc.title,
      notes: doc.notes,
      exercises: doc.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId.toString(),
        name: ex.name,
        slug: ex.slug,
        sets: ex.sets,
      })),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      metrics: doc.metrics,
    };
    
    return res.status(200).json({ document });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
});

export default router;

