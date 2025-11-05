import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectMongo } from '../_db.js';
import { Workout } from '../models/Workout.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    await connectMongo();
    const { id } = req.query as { id: string };
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const body = req.body || {};
    const toSet: any = { updatedAt: new Date() };
    if (body.title !== undefined) toSet.title = body.title;
    if (body.notes !== undefined) toSet.notes = body.notes;
    if (body.exercises !== undefined) {
      toSet.exercises = body.exercises;
      toSet.metrics = computeMetrics(body.exercises);
    }
    const result = await Workout.updateOne({ _id: id }, { $set: toSet }).exec();
    return res.status(200).json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
}


