import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from './_db.js';
import { Exercise } from './models/Exercise.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    await connectMongo();
    const docs = await Exercise.find({}, null, { lean: true }).sort({ name: 1 }).limit(500).exec();
    return res.status(200).json({ documents: docs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err?.message });
  }
}


