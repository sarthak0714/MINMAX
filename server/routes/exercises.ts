import { Router } from 'express';
import { Exercise } from '../models/Exercise.js';
import type { Exercise as ExerciseType } from '../types.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const docs = await Exercise.find({}, null, { lean: true })
      .sort({ name: 1 })
      .limit(500)
      .exec();
    
    const documents: ExerciseType[] = docs.map((doc: any) => ({
      _id: doc._id.toString(),
      name: doc.name,
      targetMuscle: doc.targetMuscle || [],
      meta: doc.meta || [],
      slug: doc.slug,
      createdAt: doc.createdAt.toISOString(),
    }));

    return res.status(200).json({ documents });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, targetMuscle, meta } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if exercise with same slug already exists
    const existing = await Exercise.findOne({ slug });
    if (existing) {
      return res.status(409).json({ 
        error: 'Exercise with this name already exists',
        document: {
          _id: existing._id.toString(),
          name: existing.name,
          targetMuscle: existing.targetMuscle || [],
          meta: existing.meta || [],
          slug: existing.slug,
          createdAt: existing.createdAt.toISOString(),
        }
      });
    }

    const doc = await Exercise.create({
      name,
      targetMuscle: targetMuscle || [],
      meta: meta || [],
      slug,
      createdAt: new Date(),
    });

    const document: ExerciseType = {
      _id: doc._id.toString(),
      name: doc.name,
      targetMuscle: doc.targetMuscle || [],
      meta: doc.meta || [],
      slug: doc.slug,
      createdAt: doc.createdAt.toISOString(),
    };

    return res.status(201).json({ document });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Exercise with this slug already exists' });
    }
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
});

export default router;

