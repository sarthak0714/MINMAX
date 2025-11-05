import type { VercelRequest, VercelResponse } from '@vercel/node';
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
    await connectMongo();

    if (req.method === 'POST') {
      const body = req.body || {};
      // In production, validate and auth the user; for now, trust userId in body
      const now = new Date();
      const metrics = computeMetrics(body.exercises);
      const doc = await Workout.create({
        userId: body.userId,
        date: body.date ? new Date(body.date) : new Date(now.toISOString().slice(0, 10)),
        title: body.title || undefined,
        notes: body.notes || undefined,
        exercises: body.exercises || [],
        createdAt: now,
        updatedAt: now,
        metrics,
      });
      return res.status(201).json({ insertedId: (doc as any)._id });
    }

    if (req.method === 'GET') {
      const { userId, date } = req.query as { userId?: string; date?: string };
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (date) {
        const d = new Date(date);
        const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
        const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
        filter.date = { $gte: start, $lte: end };
      }
      const docs = await Workout.find(filter, null, { lean: true }).sort({ date: -1 }).limit(50).exec();
      return res.status(200).json({ documents: docs });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
}


