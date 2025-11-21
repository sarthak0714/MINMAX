import mockDataTemplate from "./mockData.json";

// Generate dynamic mock data based on today's date
export function generateDynamicMockData() {
  const today = new Date();
  
  // Helper to format date as ISO string (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper to get date N days ago
  const getDaysAgo = (days: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date;
  };

  // Workout templates - one for each day of the week
  const workoutTemplates = [
    {
      title: "Push Day",
      exercises: [
        {
          exerciseId: "mock-1",
          name: "Bench Press",
          slug: "bench-press",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 6, weight: 165, rir: 0, tempo: null, notes: "PR!", isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-9",
          name: "Dumbbell Incline Press",
          slug: "dumbbell-incline-press",
          sets: [
            { setNumber: 1, reps: 10, weight: 70, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 75, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 8, weight: 75, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-15",
          name: "Tricep Pushdown",
          slug: "tricep-pushdown",
          sets: [
            { setNumber: 1, reps: 12, weight: 60, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 12, weight: 70, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 10, weight: 70, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 12850,
    },
    {
      title: "Pull Day",
      exercises: [
        {
          exerciseId: "mock-3",
          name: "Deadlift",
          slug: "deadlift",
          sets: [
            { setNumber: 1, reps: 5, weight: 225, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 5, weight: 275, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 3, weight: 315, rir: 0, tempo: null, notes: "Heavy!", isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-6",
          name: "Barbell Row",
          slug: "barbell-row",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 8, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-14",
          name: "Bicep Curl",
          slug: "bicep-curl",
          sets: [
            { setNumber: 1, reps: 12, weight: 35, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 10, weight: 40, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 10, weight: 40, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 13420,
    },
    {
      title: "Leg Day",
      exercises: [
        {
          exerciseId: "mock-2",
          name: "Squat",
          slug: "squat",
          sets: [
            { setNumber: 1, reps: 8, weight: 185, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 6, weight: 225, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 5, weight: 245, rir: 0, tempo: null, notes: "New PR!", isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-7",
          name: "Romanian Deadlift",
          slug: "romanian-deadlift",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 10, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 8, weight: 175, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-13",
          name: "Leg Curl",
          slug: "leg-curl",
          sets: [
            { setNumber: 1, reps: 12, weight: 90, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 12, weight: 100, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 10, weight: 100, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 15020,
    },
    {
      title: "Upper Body",
      exercises: [
        {
          exerciseId: "mock-1",
          name: "Bench Press",
          slug: "bench-press",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 6, weight: 155, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-6",
          name: "Barbell Row",
          slug: "barbell-row",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 8, weight: 155, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-16",
          name: "Lateral Raise",
          slug: "lateral-raise",
          sets: [
            { setNumber: 1, reps: 15, weight: 20, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 12, weight: 25, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 12, weight: 25, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 12500,
    },
    {
      title: "Full Body",
      exercises: [
        {
          exerciseId: "mock-2",
          name: "Squat",
          slug: "squat",
          sets: [
            { setNumber: 1, reps: 8, weight: 185, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 205, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 6, weight: 225, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-1",
          name: "Bench Press",
          slug: "bench-press",
          sets: [
            { setNumber: 1, reps: 10, weight: 135, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 145, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 8, weight: 145, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 11200,
    },
    {
      title: "Shoulders & Arms",
      exercises: [
        {
          exerciseId: "mock-4",
          name: "Overhead Press",
          slug: "overhead-press",
          sets: [
            { setNumber: 1, reps: 10, weight: 95, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 105, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 6, weight: 115, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-16",
          name: "Lateral Raise",
          slug: "lateral-raise",
          sets: [
            { setNumber: 1, reps: 15, weight: 20, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 12, weight: 25, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 12, weight: 25, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-14",
          name: "Bicep Curl",
          slug: "bicep-curl",
          sets: [
            { setNumber: 1, reps: 12, weight: 35, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 10, weight: 40, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 10, weight: 40, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 10800,
    },
    {
      title: "Back & Biceps",
      exercises: [
        {
          exerciseId: "mock-5",
          name: "Pull Up",
          slug: "pull-up",
          sets: [
            { setNumber: 1, reps: 10, weight: 0, rir: 2, tempo: null, notes: "Bodyweight", isWarmup: false },
            { setNumber: 2, reps: 8, weight: 25, rir: 1, tempo: null, notes: "With weight", isWarmup: false },
            { setNumber: 3, reps: 6, weight: 25, rir: 0, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-8",
          name: "Lat Pulldown",
          slug: "lat-pulldown",
          sets: [
            { setNumber: 1, reps: 12, weight: 120, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 10, weight: 140, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 10, weight: 140, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
        {
          exerciseId: "mock-14",
          name: "Bicep Curl",
          slug: "bicep-curl",
          sets: [
            { setNumber: 1, reps: 12, weight: 35, rir: 2, tempo: null, notes: null, isWarmup: false },
            { setNumber: 2, reps: 10, weight: 40, rir: 1, tempo: null, notes: null, isWarmup: false },
            { setNumber: 3, reps: 10, weight: 40, rir: 1, tempo: null, notes: null, isWarmup: false },
          ],
        },
      ],
      totalVolume: 11500,
    },
  ];

  // Create 8 workouts - today plus the past 7 days
  const workouts = [];
  for (let i = 0; i <= 7; i++) {
    const template = workoutTemplates[i % workoutTemplates.length];
    const workoutDate = formatDate(getDaysAgo(i));
    
    workouts.push({
      _id: `mock-w${i + 1}`,
      userId: "demo",
      date: workoutDate + "T00:00:00.000Z",
      title: template.title,
      exercises: template.exercises,
      metrics: { totalVolume: template.totalVolume, numSets: template.exercises.reduce((sum, e) => sum + e.sets.length, 0) },
      createdAt: workoutDate + "T00:00:00.000Z",
      updatedAt: workoutDate + "T00:00:00.000Z",
    });
  }

  // Generate volume data for the past 30 days
  const volumeData = [];
  for (let i = 29; i >= 0; i--) {
    const date = getDaysAgo(i);
    const dateStr = formatDate(date);
    
    // Find workout for this date
    const workout = workouts.find(w => w.date.startsWith(dateStr));
    
    volumeData.push({
      date: dateStr,
      volume: workout?.metrics.totalVolume || 0,
      workouts: workout ? 1 : 0,
    });
  }

  // Generate strength trends with dynamic dates
  const strengthTrends = [
    {
      exerciseId: "mock-1",
      name: "Bench Press",
      targetMuscle: ["Chest"],
      data: [
        { date: formatDate(getDaysAgo(28)), maxWeight: 155, volume: 4100, est1RM: 185 },
        { date: formatDate(getDaysAgo(24)), maxWeight: 155, volume: 4200, est1RM: 185 },
        { date: formatDate(getDaysAgo(21)), maxWeight: 160, volume: 4300, est1RM: 190 },
        { date: formatDate(getDaysAgo(17)), maxWeight: 160, volume: 4250, est1RM: 190 },
        { date: formatDate(getDaysAgo(14)), maxWeight: 155, volume: 4180, est1RM: 185 },
        { date: formatDate(getDaysAgo(10)), maxWeight: 160, volume: 4400, est1RM: 190 },
        { date: formatDate(getDaysAgo(7)), maxWeight: 155, volume: 4350, est1RM: 185 },
        { date: formatDate(getDaysAgo(3)), maxWeight: 165, volume: 4450, est1RM: 195 },
        { date: formatDate(getDaysAgo(1)), maxWeight: 165, volume: 4350, est1RM: 195 },
      ],
    },
    {
      exerciseId: "mock-2",
      name: "Squat",
      targetMuscle: ["Quads"],
      data: [
        { date: formatDate(getDaysAgo(26)), maxWeight: 225, volume: 5200, est1RM: 265 },
        { date: formatDate(getDaysAgo(19)), maxWeight: 235, volume: 5400, est1RM: 275 },
        { date: formatDate(getDaysAgo(12)), maxWeight: 235, volume: 5350, est1RM: 275 },
        { date: formatDate(getDaysAgo(5)), maxWeight: 245, volume: 5600, est1RM: 285 },
      ],
    },
    {
      exerciseId: "mock-3",
      name: "Deadlift",
      targetMuscle: ["Back", "Hamstrings"],
      data: [
        { date: formatDate(getDaysAgo(25)), maxWeight: 295, volume: 3800, est1RM: 345 },
        { date: formatDate(getDaysAgo(18)), maxWeight: 305, volume: 3950, est1RM: 355 },
        { date: formatDate(getDaysAgo(11)), maxWeight: 305, volume: 3900, est1RM: 355 },
        { date: formatDate(getDaysAgo(3)), maxWeight: 315, volume: 4100, est1RM: 365 },
      ],
    },
  ];

  return {
    exercises: mockDataTemplate.exercises,
    workouts,
    volumeData,
    stats: {
      totalVolume: 53790,
      workouts: 4,
      avgWeight: 152,
      totalSets: 48,
      volumeChange: 15.2,
      workoutChange: 2,
      muscleSplit: [
        { _id: "Chest", volume: 8500 },
        { _id: "Back", volume: 9200 },
        { _id: "Quads", volume: 7800 },
        { _id: "Shoulders", volume: 6400 },
        { _id: "Hamstrings", volume: 5900 },
        { _id: "Triceps", volume: 4200 },
        { _id: "Biceps", volume: 3800 },
        { _id: "Glutes", volume: 4500 },
      ],
    },
    strengthTrends,
    prs: [
      { _id: "mock-1", name: "Bench Press", maxWeight: 165, totalSessions: 8 },
      { _id: "mock-2", name: "Squat", maxWeight: 245, totalSessions: 4 },
      { _id: "mock-3", name: "Deadlift", maxWeight: 315, totalSessions: 4 },
      { _id: "mock-4", name: "Overhead Press", maxWeight: 115, totalSessions: 6 },
    ],
    heatmap: volumeData.map(v => ({
      date: v.date,
      count: v.workouts,
      volume: v.volume,
      intensity: v.volume > 0 ? Math.min(v.volume / 200, 5) : 0,
    })),
    insights: [
      { type: "pr", title: "New Bench Press PR!", message: "You hit 165kg for 6 reps!" },
      { type: "volume", title: "Volume Increase", message: "15.2% increase vs last week" },
      { type: "consistency", title: "Great Consistency", message: "4 workouts this week" },
    ],
  };
}
