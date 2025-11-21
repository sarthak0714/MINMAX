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
  PieChart,
  Pie,
  Cell,
} from "recharts";

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Types
interface Stats {
  totalVolume: number;
  workouts: number;
  avgWeight: number;
  volumeChange: number;
  workoutChange: number;
}

interface MuscleData {
  name: string;
  value: number;
  color: string;
}

// Mock data for strength trends (TODO: add API)
const mockStrengthData = [
  { exercise: "Bench Press", maxWeight: 80 },
  { exercise: "Squats", maxWeight: 100 },
  { exercise: "Deadlifts", maxWeight: 120 },
];

// Animated Counter Component (inspired by React Bits)
function AnimatedCounter({
  value,
  duration = 2,
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
  const [dateRange, setDateRange] = useState("last-7-days");
  const [volumeData, setVolumeData] = useState([]);
  const [stats, setStats] = useState<Stats>({
    totalVolume: 0,
    workouts: 0,
    avgWeight: 0,
    volumeChange: 0,
    workoutChange: 0,
  });
  const [muscleData, setMuscleData] = useState<MuscleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [volumeRes, statsRes, muscleRes] = await Promise.all([
        fetch(`${API_BASE}/api/progress/volume?range=${dateRange}`),
        fetch(`${API_BASE}/api/progress/stats?range=${dateRange}`),
        fetch(
          `${API_BASE}/api/progress/muscle-distribution?range=${dateRange}`
        ),
      ]);

      const volume = await volumeRes.json();
      const statsData = await statsRes.json();
      const muscle = await muscleRes.json();

      setVolumeData(volume);
      setStats(statsData);
      setMuscleData(
        muscle.map((item: any, index: number) => ({
          ...item,
          color: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"][
            index % 5
          ],
        }))
      );
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 pb-24 flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 pb-24">
      {/* Header with date range */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">Progress Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <option
            value="last-7-days"
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            Last 7 Days
          </option>
          <option
            value="last-30-days"
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            Last 30 Days
          </option>
          <option
            value="last-3-months"
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            Last 3 Months
          </option>
          <option
            value="all-time"
            style={{ backgroundColor: "#000", color: "#fff" }}
          >
            All Time
          </option>
        </select>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/60 text-sm">Total Volume</div>
          <div className="text-white text-2xl font-bold">
            <AnimatedCounter value={stats.totalVolume || 0} /> kg
          </div>
          <div
            className={`text-sm ${
              stats.volumeChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {stats.volumeChange >= 0 ? "+" : ""}
            {stats.volumeChange || 0}% vs last week
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/60 text-sm">Workouts</div>
          <div className="text-white text-2xl font-bold">
            <AnimatedCounter value={stats.workouts || 0} />
          </div>
          <div
            className={`text-sm ${
              stats.workoutChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {stats.workoutChange >= 0 ? "+" : ""}
            {stats.workoutChange || 0}% vs last week
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/60 text-sm">Avg Weight</div>
          <div className="text-white text-2xl font-bold">
            {stats.avgWeight || 0} kg
          </div>
          <div className="text-yellow-400 text-sm">No change</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/60 text-sm">PRs This Month</div>
          <div className="text-white text-2xl font-bold">3</div>
          <div className="text-green-400 text-sm">New records!</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Volume Progression */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">Volume Progression</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#00000080",
                  border: "1px solid #ffffff20",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Bar dataKey="volume" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Strength Trends */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">Strength Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockStrengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="exercise" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#00000080",
                  border: "1px solid #ffffff20",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Muscle Group Distribution */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">
            Muscle Group Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={muscleData as any}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {muscleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#00000080",
                  border: "1px solid #ffffff20",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Insights Panel */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">
            Insights & Recommendations
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30">
              <div className="text-green-400 font-medium">Great Progress!</div>
              <div className="text-white/80 text-sm">
                Your volume is up 12% this week. Keep it up!
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
              <div className="text-yellow-400 font-medium">Focus Area</div>
              <div className="text-white/80 text-sm">
                Shoulders are underrepresented. Add more overhead presses.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/30">
              <div className="text-blue-400 font-medium">PR Alert</div>
              <div className="text-white/80 text-sm">
                You're close to a new squat PR. Push for 105kg next session!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
