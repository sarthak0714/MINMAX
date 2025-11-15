import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { MdOutlineTrendingUp, MdTrendingDown } from "react-icons/md";
import { IoRemove } from "react-icons/io5";
import { ChartSkeleton, ErrorDisplay, InsightCard } from "./ProgressComponents";

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// Utility function to format numbers
function formatNumber(value: number, includeUnit = false): string {
  if (isNaN(value) || value === null || value === undefined) {
    return "-";
  }
  if (value >= 10000) {
    return `${(value / 1000).toFixed(1)}k${includeUnit ? " kg" : ""}`;
  }
  return `${value.toFixed(0)}${includeUnit ? " kg" : ""}`;
}

// Format percentage
function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return "-";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// Types
interface Stats {
  totalVolume: number;
  workouts: number;
  avgWeight: number;
  volumeChange: number;
  workoutChange: number;
}

interface Insight {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
}

interface StrengthTrend {
  exerciseId: string;
  name: string;
  targetMuscle?: string[];
  data: { date: string; maxWeight: number; volume: number }[];
}

interface Exercise {
  _id: string;
  name: string;
  targetMuscle: string[];
}

// Animated Counter Component
function AnimatedCounter({
  value,
  duration = 1.5,
}: {
  value: number;
  duration?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, count, duration]);

  return <motion.span>{rounded}</motion.span>;
}

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "strength" | "consistency"
  >("overview");
  const [volumeData, setVolumeData] = useState([]);
  const [stats, setStats] = useState<Stats>({
    totalVolume: 0,
    workouts: 0,
    avgWeight: 0,
    volumeChange: 0,
    workoutChange: 0,
  });
  const [strengthTrends, setStrengthTrends] = useState<StrengthTrend[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetchData();
    fetchMuscleGroups();
  }, []);

  const fetchMuscleGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/exercises`);
      const data = await res.json();

      // Handle response format - may be array or {documents: array}
      const exercises = Array.isArray(data) ? data : data.documents || [];

      if (!Array.isArray(exercises) || exercises.length === 0) {
        console.log("No exercises found");
        return;
      }

      setExercises(exercises);

      // Extract unique muscle groups from all exercises
      const allMuscles = exercises.flatMap(
        (ex: Exercise) => ex.targetMuscle || []
      );
      const uniqueMuscles = Array.from(new Set(allMuscles)).filter(
        Boolean
      ) as string[];
      setMuscleGroups(uniqueMuscles);
    } catch (error) {
      console.error("Error fetching muscle groups:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [volumeRes, statsRes, strengthRes, insightsRes] = await Promise.all(
        [
          fetch(`${API_BASE}/progress/volume?range=last-30-days`),
          fetch(`${API_BASE}/progress/stats?range=last-7-days`),
          fetch(`${API_BASE}/progress/strength-trends?range=last-30-days`),
          fetch(`${API_BASE}/progress/insights`),
        ]
      );

      const volume = await volumeRes.json();
      const statsData = await statsRes.json();
      const strength = await strengthRes.json();
      const insightsData = await insightsRes.json();

      console.log("Strength trends data:", strength);

      setVolumeData(volume);
      setStats(statsData);
      setStrengthTrends(strength);
      setInsights(insightsData);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-black p-4 pb-24">
        <div className="mb-6">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-white text-2xl font-bold mb-2">Progress</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6 flex justify-center overflow-x-auto no-scrollbar">
        <div className="inline-flex gap-1 p-1 bg-[#1a1a2e] backdrop-blur-md rounded-full border border-white/10 min-w-fit">
          {["overview", "strength", "consistency"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#2d2d44] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 mb-6">
          <ErrorDisplay message={error} />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="px-4 space-y-6">
          {/* Key Metrics - Large Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Volume */}
            <div
              className="col-span-2 p-6 rounded-3xl backdrop-blur-md border border-white/10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                boxShadow: "inset 0 0 20px rgba(168, 85, 247, 0.15)",
              }}
            >
              <div className="text-white/60 text-sm mb-2">Total Volume</div>
              <div className="text-white text-4xl font-bold mb-2">
                {formatNumber(stats.totalVolume)}{" "}
                <span className="text-2xl">kg</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80">
                  {stats.volumeChange > 0 ? (
                    <MdOutlineTrendingUp className="w-3.5 h-3.5" />
                  ) : stats.volumeChange < 0 ? (
                    <MdTrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <IoRemove className="w-3.5 h-3.5" />
                  )}
                  {formatPercent(stats.volumeChange)}
                </div>
                <span className="text-white/40 text-xs">vs last week</span>
              </div>
            </div>

            {/* Workouts */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="text-white/60 text-xs mb-1">Workouts</div>
              <div className="text-white text-3xl font-bold">
                {formatNumber(stats.workouts)}
              </div>
              <div className="text-green-400 text-xs mt-1">
                {formatPercent(stats.workoutChange)}
              </div>
            </div>

            {/* Avg Weight */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="text-white/60 text-xs mb-1">Avg Weight</div>
              <div className="text-white text-3xl font-bold">
                {formatNumber(stats.avgWeight)}{" "}
                <span className="text-lg">kg</span>
              </div>
              <div className="text-white/40 text-xs mt-1">per set</div>
            </div>
          </div>

          {/* Volume Trend Chart */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Volume Trend</h3>
              <span className="text-white/40 text-xs">Last 30 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff10"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  tick={{ fontSize: 10, fill: "#ffffff40" }}
                  tickFormatter={(value) =>
                    new Date(value).getDate().toString()
                  }
                />
                <YAxis
                  stroke="#ffffff40"
                  tick={{ fontSize: 10, fill: "#ffffff40" }}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000dd",
                    border: "1px solid #ffffff20",
                    borderRadius: "12px",
                    color: "#ffffff",
                  }}
                  cursor={{ fill: "#ffffff10" }}
                />
                <Bar
                  dataKey="volume"
                  fill="rgba(236, 72, 153, 0.6)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Insights</h3>
              {insights.slice(0, 3).map((insight, index) => (
                <InsightCard key={index} {...insight} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strength Tab */}
      {activeTab === "strength" && (
        <div className="px-4 space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            {/* Muscle Group Filter */}
            <div>
              <label className="block text-white/60 text-xs mb-2">
                Muscle Group
              </label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => {
                  setSelectedMuscleGroup(e.target.value);
                  setSelectedExercise("");
                }}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-white/20 transition-all"
                style={{ backgroundColor: "#000", color: "#fff" }}
              >
                <option value="all">All Muscles</option>
                {muscleGroups.map((group) => (
                  <option
                    key={group}
                    value={group}
                    style={{ backgroundColor: "#000", color: "#fff" }}
                  >
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Selector - Only show when muscle group selected */}
            <div>
              <label className="block text-white/60 text-xs mb-2">
                Specific Exercise (Optional)
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-white/20 transition-all"
                style={{ backgroundColor: "#000", color: "#fff" }}
              >
                <option
                  value=""
                  style={{ backgroundColor: "#000", color: "#fff" }}
                >
                  Show group summary
                </option>
                {(() => {
                  const filtered = strengthTrends.filter((t) => {
                    if (selectedMuscleGroup === "all") return true;
                    const exercise = exercises.find(
                      (ex) => ex._id === t.exerciseId || ex.name === t.name
                    );
                    const hasMatch =
                      exercise?.targetMuscle?.includes(selectedMuscleGroup);
                    console.log(`Checking ${t.name}:`, {
                      exerciseId: t.exerciseId,
                      foundExercise: exercise?.name,
                      targetMuscles: exercise?.targetMuscle,
                      selectedMuscle: selectedMuscleGroup,
                      hasMatch,
                    });
                    return hasMatch;
                  });
                  console.log("Filtered exercises:", filtered.length);
                  return filtered.map((trend) => (
                    <option
                      key={trend.exerciseId}
                      value={trend.exerciseId}
                      style={{ backgroundColor: "#000", color: "#fff" }}
                    >
                      {trend.name}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          {/* Show muscle group analytics when no specific exercise selected */}
          {!selectedExercise &&
            selectedMuscleGroup !== "all" &&
            (() => {
              const groupExercises = strengthTrends.filter((t) => {
                const exercise = exercises.find(
                  (ex) => ex._id === t.exerciseId || ex.name === t.name
                );
                return exercise?.targetMuscle?.includes(selectedMuscleGroup);
              });

              if (groupExercises.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="text-white/40 mb-2">
                      No data for {selectedMuscleGroup}
                    </div>
                    <div className="text-white/60 text-sm">
                      Start logging exercises for this muscle group
                    </div>
                  </div>
                );
              }

              // Calculate group stats
              const totalVolume = groupExercises.reduce(
                (sum, trend) =>
                  sum + trend.data.reduce((s, d) => s + d.volume, 0),
                0
              );
              const totalSets = groupExercises.reduce(
                (sum, trend) => sum + trend.data.length,
                0
              );

              return (
                <div className="space-y-4">
                  {/* Muscle Group Header */}
                  <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <h3 className="text-white font-semibold text-xl mb-4">
                      {selectedMuscleGroup} Analytics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-white/40 text-xs mb-1">
                          Exercises
                        </div>
                        <div className="text-white text-2xl font-bold">
                          {groupExercises.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-1">
                          Total Volume
                        </div>
                        <div className="text-white text-xl font-bold">
                          {formatNumber(totalVolume)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-1">
                          Total Sets
                        </div>
                        <div className="text-white text-2xl font-bold">
                          {totalSets}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exercises in this group */}
                  <h4 className="text-white/80 font-medium">Exercises</h4>
                  {groupExercises.map((trend) => {
                    const latestWeight =
                      trend.data[trend.data.length - 1]?.maxWeight || 0;
                    const previousWeight = trend.data[0]?.maxWeight || 0;
                    const change =
                      previousWeight > 0
                        ? ((latestWeight - previousWeight) / previousWeight) *
                          100
                        : 0;

                    return (
                      <div
                        key={trend.exerciseId}
                        onClick={() => setSelectedExercise(trend.exerciseId)}
                        className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-white/12 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold">
                              {trend.name}
                            </h3>
                            <div className="text-white/40 text-xs mt-1">
                              Current: {formatNumber(latestWeight)} kg
                            </div>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/80">
                            {change > 0 ? (
                              <MdOutlineTrendingUp className="w-3.5 h-3.5" />
                            ) : change < 0 ? (
                              <MdTrendingDown className="w-3.5 h-3.5" />
                            ) : (
                              <IoRemove className="w-3.5 h-3.5" />
                            )}
                            {change > 0 ? "+" : ""}
                            {change.toFixed(1)}%
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                          <LineChart data={trend.data}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#ffffff40"
                              tick={{ fontSize: 10, fill: "#ffffff40" }}
                              tickFormatter={(value) =>
                                new Date(value).getDate().toString()
                              }
                            />
                            <YAxis
                              stroke="#ffffff40"
                              tick={{ fontSize: 10, fill: "#ffffff40" }}
                              width={35}
                              domain={["dataMin - 5", "dataMax + 5"]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#000000dd",
                                border: "1px solid #ffffff20",
                                borderRadius: "12px",
                                color: "#ffffff",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="maxWeight"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ fill: "#10b981", r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {/* Single Exercise Details */}
          {selectedExercise &&
            (() => {
              const trend = strengthTrends.find(
                (t) => t.exerciseId === selectedExercise
              );

              console.log("Selected exercise:", selectedExercise);
              console.log("Found trend:", trend);

              if (!trend || !trend.data || trend.data.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="text-white/40 mb-2">
                      No data available for this exercise
                    </div>
                    <div className="text-white/60 text-sm">
                      Start logging workouts to see your progress
                    </div>
                  </div>
                );
              }

              const latestWeight =
                trend.data[trend.data.length - 1]?.maxWeight || 0;
              const previousWeight = trend.data[0]?.maxWeight || 0;
              const change =
                previousWeight > 0
                  ? ((latestWeight - previousWeight) / previousWeight) * 100
                  : 0;
              const maxWeight = Math.max(...trend.data.map((d) => d.maxWeight));
              const totalVolume = trend.data.reduce(
                (sum, d) => sum + d.volume,
                0
              );
              const avgVolume = totalVolume / trend.data.length;

              return (
                <div className="space-y-4">
                  {/* Exercise Header */}
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <h3 className="text-white font-semibold text-lg mb-3">
                      {trend.name}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-white/40 text-xs mb-1">
                          Current
                        </div>
                        <div className="text-white text-xl font-bold">
                          {formatNumber(latestWeight)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-1">PR</div>
                        <div className="text-white text-xl font-bold">
                          {formatNumber(maxWeight)} kg
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-1">
                          Progress
                        </div>
                        <div className="flex items-center gap-1 text-xl font-bold text-white/80">
                          {change > 0 ? (
                            <MdOutlineTrendingUp className="w-4 h-4" />
                          ) : change < 0 ? (
                            <MdTrendingDown className="w-4 h-4" />
                          ) : (
                            <IoRemove className="w-4 h-4" />
                          )}
                          {formatPercent(change)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Max Weight Trend */}
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <h4 className="text-white/80 font-medium mb-3">
                      Max Weight Progression
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={trend.data}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#ffffff40"
                          tick={{ fontSize: 10, fill: "#ffffff40" }}
                          tickFormatter={(value) =>
                            new Date(value).getDate().toString()
                          }
                        />
                        <YAxis
                          stroke="#ffffff40"
                          tick={{ fontSize: 10, fill: "#ffffff40" }}
                          width={35}
                          domain={["dataMin - 5", "dataMax + 5"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#000000dd",
                            border: "1px solid #ffffff20",
                            borderRadius: "12px",
                            color: "#ffffff",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxWeight"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981", r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Volume Trend */}
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <h4 className="text-white/80 font-medium mb-3">
                      Volume Progression
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={trend.data}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#ffffff40"
                          tick={{ fontSize: 10, fill: "#ffffff40" }}
                          tickFormatter={(value) =>
                            new Date(value).getDate().toString()
                          }
                        />
                        <YAxis
                          stroke="#ffffff40"
                          tick={{ fontSize: 10, fill: "#ffffff40" }}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#000000dd",
                            border: "1px solid #ffffff20",
                            borderRadius: "12px",
                            color: "#ffffff",
                          }}
                        />
                        <Bar
                          dataKey="volume"
                          fill="rgba(236, 72, 153, 0.6)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Average Volume */}
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                    <div className="text-white/40 text-xs mb-1">
                      Avg Volume per Session
                    </div>
                    <div className="text-white text-2xl font-bold">
                      {formatNumber(avgVolume)} kg
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Show all exercises when "all" muscle group selected and no exercise picked */}
          {!selectedExercise && selectedMuscleGroup === "all" && (
            <>
              <div className="text-center py-8">
                <div className="text-white/60 mb-2">
                  Select a muscle group to view analytics
                </div>
                <div className="text-white/40 text-sm">
                  or choose a specific exercise from the dropdown
                </div>
              </div>

              {/* Top Exercise Progress */}
              {strengthTrends.slice(0, 3).map((trend) => {
                const latestWeight =
                  trend.data[trend.data.length - 1]?.maxWeight || 0;
                const previousWeight = trend.data[0]?.maxWeight || 0;
                const change =
                  previousWeight > 0
                    ? ((latestWeight - previousWeight) / previousWeight) * 100
                    : 0;

                return (
                  <div
                    key={trend.exerciseId}
                    onClick={() => setSelectedExercise(trend.exerciseId)}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-white/12 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">
                          {trend.name}
                        </h3>
                        <div className="text-white/40 text-xs mt-1">
                          Current: {formatNumber(latestWeight)} kg
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/80">
                        {change > 0 ? (
                          <MdOutlineTrendingUp className="w-3.5 h-3.5" />
                        ) : change < 0 ? (
                          <MdTrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <IoRemove className="w-3.5 h-3.5" />
                        )}
                        {formatPercent(change)}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={trend.data}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff10"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#ffffff40"
                          tick={{ fontSize: 10, fill: "#ffffff40" }}
                          tickFormatter={(value) =>
                            new Date(value).getDate().toString()
                          }
                        />
                        <YAxis
                          stroke="#ffffff40"
                          tick={{ fontSize: 10, fill: "#ffffff40" }}
                          width={35}
                          domain={["dataMin - 5", "dataMax + 5"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#000000dd",
                            border: "1px solid #ffffff20",
                            borderRadius: "12px",
                            color: "#ffffff",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxWeight"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981", r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </>
          )}

          {strengthTrends.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/40 mb-2">No strength data yet</div>
              <div className="text-white/60 text-sm">
                Start logging workouts to see your progress
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consistency Tab */}
      {activeTab === "consistency" && (
        <div className="px-4 space-y-6">
          {/* Weekly Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-white/60 text-xs mb-2">This Week</div>
              <div className="text-white text-2xl font-bold">
                {formatNumber(stats.workouts)}
              </div>
              <div className="text-white/40 text-xs mt-1">sessions</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-white/60 text-xs mb-2">Streak</div>
              <div className="text-white text-2xl font-bold">
                {insights
                  .find((i) => i.title.includes("Streak"))
                  ?.message.match(/\d+/)?.[0] || 0}
              </div>
              <div className="text-white/40 text-xs mt-1">days</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-white/60 text-xs mb-2">Avg/Week</div>
              <div className="text-white text-2xl font-bold">
                {Math.round((stats.workouts / 7) * 7)}
              </div>
              <div className="text-white/40 text-xs mt-1">sessions</div>
            </div>
          </div>

          {/* Workout Frequency Chart */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <h3 className="text-white font-semibold mb-4">Workout Frequency</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff10"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  tick={{ fontSize: 10, fill: "#ffffff40" }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .substring(0, 2);
                  }}
                />
                <YAxis
                  stroke="#ffffff40"
                  tick={{ fontSize: 10, fill: "#ffffff40" }}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000dd",
                    border: "1px solid #ffffff20",
                    borderRadius: "12px",
                    color: "#ffffff",
                  }}
                />
                <Bar
                  dataKey="workouts"
                  fill="rgba(168, 85, 247, 0.6)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Consistency Insights */}
          {insights
            .filter(
              (i) => i.title.includes("Streak") || i.title.includes("Back")
            )
            .map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
        </div>
      )}
    </div>
  );
}
