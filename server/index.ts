import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectMongo } from "./db.js";
import exercisesRouter from "./routes/exercises.js";
import workoutsRouter from "./routes/workouts.js";
import progressRouter from "./routes/progress.js";
import { startAnalyticsJobs } from "./jobs/analytics.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectMongo().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// Start analytics background jobs
startAnalyticsJobs();

// Routes
app.use("/api/exercises", exercisesRouter);
app.use("/api/workouts", workoutsRouter);
app.use("/api/progress", progressRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Export for Vercel serverless
export default app;

// Start server locally (only if not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
