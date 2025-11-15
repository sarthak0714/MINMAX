import cron from "node-cron";
import { Workout } from "../models/Workout";
import mongoose from "mongoose";

// Define Insight schema
const insightSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true }, // 'success', 'warning', 'info'
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }, // 7 days
});

const Insight = mongoose.model("Insight", insightSchema);

// Daily analytics job - runs at 2 AM
export function startAnalyticsJobs() {
  console.log("📊 Starting analytics jobs...");

  // Run daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("🔄 Running daily analytics job...");
    await processAnalytics();
  });

  // Also run on startup (comment out in production)
  processAnalytics().catch(console.error);
}

async function processAnalytics() {
  try {
    const userId = "single"; // TODO: Loop through all users
    const insights: any[] = [];

    // Get all workouts
    const allWorkouts = await Workout.find({ userId }).sort({ date: -1 });
    const recentWorkouts = allWorkouts.slice(0, 30);

    // 1. Calculate streak
    const streak = calculateStreak(recentWorkouts);
    if (streak >= 3) {
      insights.push({
        userId,
        type: "success",
        title: "Amazing Streak!",
        message: `You've worked out ${streak} days in a row. Keep it up!`,
      });
    } else if (streak === 0 && recentWorkouts.length > 0) {
      const lastWorkout = recentWorkouts[0];
      const daysSince = Math.floor(
        (Date.now() - new Date(lastWorkout.date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysSince > 3) {
        insights.push({
          userId,
          type: "warning",
          title: "Time to Get Back!",
          message: `It's been ${daysSince} days since your last workout. Let's get moving!`,
        });
      }
    }

    // 2. Detect plateaus per exercise
    const plateaus = await detectPlateaus(userId);
    insights.push(...plateaus);

    // 3. Detect PRs
    const prs = await detectRecentPRs(userId);
    insights.push(...prs);

    // 4. Volume analysis
    const volumeInsight = await analyzeVolume(userId);
    if (volumeInsight) insights.push(volumeInsight);

    // Clear old insights
    await Insight.deleteMany({ userId, expiresAt: { $lt: new Date() } });

    // Store new insights
    if (insights.length > 0) {
      await Insight.insertMany(insights);
      console.log(
        `✅ Generated ${insights.length} insights for user ${userId}`
      );
    }
  } catch (error) {
    console.error("❌ Error processing analytics:", error);
  }
}

function calculateStreak(workouts: any[]): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < workouts.length; i++) {
    const workoutDate = new Date(workouts[i].date);
    workoutDate.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (workoutDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function detectPlateaus(userId: string) {
  const insights: any[] = [];
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Get exercises with no progress in 4 weeks
  const exerciseProgress = await Workout.aggregate([
    { $match: { userId, date: { $gte: fourWeeksAgo } } },
    { $unwind: "$exercises" },
    { $unwind: "$exercises.sets" },
    {
      $group: {
        _id: "$exercises.exerciseId",
        name: { $first: "$exercises.name" },
        maxWeight: { $max: "$exercises.sets.weight" },
        firstDate: { $min: "$date" },
        lastDate: { $max: "$date" },
      },
    },
  ]);

  for (const exercise of exerciseProgress) {
    const daysBetween = Math.floor(
      (new Date(exercise.lastDate).getTime() -
        new Date(exercise.firstDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysBetween >= 21) {
      // If tracked for 3+ weeks with no progress
      insights.push({
        userId,
        type: "info",
        title: `${exercise.name} Plateau`,
        message: `Your ${exercise.name} hasn't progressed in 4 weeks. Try a deload or new variation.`,
      });
    }
  }

  return insights;
}

async function detectRecentPRs(userId: string) {
  const insights: any[] = [];
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const recentWorkouts = await Workout.find({
    userId,
    date: { $gte: lastWeek },
  });

  for (const workout of recentWorkouts) {
    for (const exercise of workout.exercises) {
      const maxWeight = Math.max(...exercise.sets.map((s:any) => s.weight || 0));

      // Check if this is a PR
      const historicalMax = await Workout.aggregate([
        { $match: { userId, date: { $lt: workout.date } } },
        { $unwind: "$exercises" },
        { $match: { "exercises.exerciseId": exercise.exerciseId } },
        { $unwind: "$exercises.sets" },
        {
          $group: {
            _id: null,
            maxWeight: { $max: "$exercises.sets.weight" },
          },
        },
      ]);

      if (
        historicalMax.length === 0 ||
        maxWeight > historicalMax[0].maxWeight
      ) {
        insights.push({
          userId,
          type: "success",
          title: "New PR!",
          message: `Congrats! You hit a new PR on ${exercise.name} with ${maxWeight}kg!`,
        });
      }
    }
  }

  return insights;
}

async function analyzeVolume(userId: string) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentVolume = await Workout.aggregate([
    { $match: { userId, date: { $gte: fourWeeksAgo } } },
    { $group: { _id: null, avgVolume: { $avg: "$metrics.totalVolume" } } },
  ]);

  const olderVolume = await Workout.aggregate([
    {
      $match: {
        userId,
        date: {
          $lt: fourWeeksAgo,
          $gte: new Date(fourWeeksAgo.getTime() - 28 * 24 * 60 * 60 * 1000),
        },
      },
    },
    { $group: { _id: null, avgVolume: { $avg: "$metrics.totalVolume" } } },
  ]);

  if (recentVolume[0] && olderVolume[0]) {
    const volumeChange =
      ((recentVolume[0].avgVolume - olderVolume[0].avgVolume) /
        olderVolume[0].avgVolume) *
      100;

    if (volumeChange > 15) {
      return {
        userId,
        type: "success",
        title: "Great Progress!",
        message: `Your volume is up ${volumeChange.toFixed(
          1
        )}% in the last 4 weeks!`,
      };
    } else if (volumeChange < -10) {
      return {
        userId,
        type: "warning",
        title: "Volume Declining",
        message: `Your volume dropped ${Math.abs(volumeChange).toFixed(
          1
        )}% recently. Consider increasing intensity.`,
      };
    }
  }

  return null;
}

export { Insight };
