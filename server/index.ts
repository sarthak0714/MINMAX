import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './db.js';
import exercisesRouter from './routes/exercises.js';
import workoutsRouter from './routes/workouts.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectMongo().catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Routes
app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

