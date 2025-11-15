import express from "express";
import { Workout } from "../models/Workout";

const router = express.Router();

// Get volume progression data
router.get("/volume", async (req, res) => {
  try {
    const userId = "single"; // TODO: get from auth
    const { range = "last-30-days" } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case "last-7-days":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "last-30-days":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "last-3-months":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "all-time":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Aggregate volume by date
    const volumeData = await Workout.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          totalVolume: { $sum: "$metrics.totalVolume" },
          workoutCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const formattedData = volumeData.map((item) => ({
      date: item._id,
      volume: item.totalVolume,
      workouts: item.workoutCount,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching volume data:", error);
    res.status(500).json({ error: "Failed to fetch volume data" });
  }
});

// Get muscle group distribution
router.get("/muscle-distribution", async (req, res) => {
  try {
    const userId = "single";
    const { range = "last-30-days" } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Default to 30 days

    // This is simplified - you'd need to map exercises to muscle groups
    // For now, return mock data structure
    const muscleData = [
      { name: "Chest", value: 25 },
      { name: "Legs", value: 30 },
      { name: "Back", value: 20 },
      { name: "Shoulders", value: 15 },
      { name: "Arms", value: 10 },
    ];

    res.json(muscleData);
  } catch (error) {
    console.error("Error fetching muscle distribution:", error);
    res.status(500).json({ error: "Failed to fetch muscle distribution" });
  }
});

// Get quick stats
router.get("/stats", async (req, res) => {
  try {
    const userId = "single";
    const { range = "last-7-days" } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Get current period stats
    const currentStats = await Workout.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$metrics.totalVolume" },
          totalSets: { $sum: "$metrics.numSets" },
          workoutCount: { $sum: 1 },
          avgWeight: { $avg: "$metrics.avgWeight" },
        },
      },
    ]);

    // Get previous period for comparison
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevStats = await Workout.aggregate([
      {
        $match: {
          userId,
          date: { $gte: prevStart, $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$metrics.totalVolume" },
          workoutCount: { $sum: 1 },
        },
      },
    ]);

    const current = currentStats[0] || {
      totalVolume: 0,
      workoutCount: 0,
      totalSets: 0,
      avgWeight: 0,
    };
    const previous = prevStats[0] || { totalVolume: 0, workoutCount: 0 };

    const volumeChange =
      previous.totalVolume > 0
        ? ((current.totalVolume - previous.totalVolume) /
            previous.totalVolume) *
          100
        : 0;

    const workoutChange =
      previous.workoutCount > 0
        ? ((current.workoutCount - previous.workoutCount) /
            previous.workoutCount) *
          100
        : 0;

    res.json({
      totalVolume: Math.round(current.totalVolume),
      workouts: current.workoutCount,
      avgWeight: Math.round(current.avgWeight),
      volumeChange: Math.round(volumeChange),
      workoutChange: Math.round(workoutChange),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get strength trends per exercise
router.get("/strength-trends", async (req, res) => {
  try {
    const userId = "single";
    const { exerciseId, range = "last-30-days" } = req.query;

    const endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const matchStage: any = {
      userId,
      date: { $gte: startDate, $lte: endDate },
    };

    // Unwind exercises array to work with individual exercises
    const trends = await Workout.aggregate([
      { $match: matchStage },
      { $unwind: "$exercises" },
      {
        $group: {
          _id: {
            exerciseId: "$exercises.exerciseId",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          },
          maxWeight: { $max: "$exercises.sets.weight" },
          totalVolume: {
            $sum: {
              $reduce: {
                input: "$exercises.sets",
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    { $multiply: ["$$this.weight", "$$this.reps"] },
                  ],
                },
              },
            },
          },
          name: { $first: "$exercises.name" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Group by exercise
    const groupedByExercise: any = {};
    trends.forEach((item) => {
      const exId = item._id.exerciseId;
      if (!groupedByExercise[exId]) {
        groupedByExercise[exId] = {
          exerciseId: exId,
          name: item.name,
          data: [],
        };
      }
      groupedByExercise[exId].data.push({
        date: item._id.date,
        maxWeight: item.maxWeight,
        volume: item.totalVolume,
      });
    });

    const result = Object.values(groupedByExercise);
    res.json(result);
  } catch (error) {
    console.error("Error fetching strength trends:", error);
    res.status(500).json({ error: "Failed to fetch strength trends" });
  }
});

// Get PR tracking and detection
router.get("/prs", async (req, res) => {
  try {
    const userId = "single";

    // Get all workouts and find PRs (max weight per exercise)
    const prs = await Workout.aggregate([
      { $match: { userId } },
      { $unwind: "$exercises" },
      { $unwind: "$exercises.sets" },
      {
        $group: {
          _id: "$exercises.exerciseId",
          name: { $first: "$exercises.name" },
          maxWeight: { $max: "$exercises.sets.weight" },
          maxWeightDate: {
            $max: {
              $cond: [
                {
                  $eq: [
                    "$exercises.sets.weight",
                    { $max: "$exercises.sets.weight" },
                  ],
                },
                "$date",
                null,
              ],
            },
          },
          totalSessions: { $sum: 1 },
        },
      },
      { $sort: { maxWeight: -1 } },
    ]);

    res.json(prs);
  } catch (error) {
    console.error("Error fetching PRs:", error);
    res.status(500).json({ error: "Failed to fetch PRs" });
  }
});

// Get workout frequency heatmap data
router.get("/heatmap", async (req, res) => {
  try {
    const userId = "single";
    const { range = "last-90-days" } = req.query;

    const endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);

    const workouts = await Workout.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
          totalVolume: { $sum: "$metrics.totalVolume" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const heatmapData = workouts.map((item) => ({
      date: item._id,
      count: item.count,
      volume: item.totalVolume,
      intensity: Math.min(item.count * 20, 100), // Scale intensity 0-100
    }));

    res.json(heatmapData);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
});

// Get insights (plateaus, streaks, recommendations)
router.get("/insights", async (req, res) => {
  try {
    const userId = "single";
    const insights = [];

    // Get recent workouts
    const recentWorkouts = await Workout.find({ userId })
      .sort({ date: -1 })
      .limit(30);

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentWorkouts.length; i++) {
      const workoutDate = new Date(recentWorkouts[i].date);
      workoutDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (workoutDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    if (streak >= 3) {
      insights.push({
        type: "success",
        title: "Amazing Streak!",
        message: `You've worked out ${streak} days in a row. Keep it up!`,
      });
    }

    // Check for plateaus (no volume increase in last 4 weeks)
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

      if (volumeChange < 5) {
        insights.push({
          type: "warning",
          title: "Potential Plateau",
          message:
            "Your volume hasn't increased much in 4 weeks. Consider progressive overload.",
        });
      } else if (volumeChange > 15) {
        insights.push({
          type: "success",
          title: "Great Progress!",
          message: `Your volume is up ${volumeChange.toFixed(
            1
          )}% in the last 4 weeks!`,
        });
      }
    }

    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

export default router;
