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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DatePicker,
  ChartSkeleton,
  ErrorDisplay,
  ExportButton,
  InsightCard,
  HeatmapCell,
} from "./ProgressComponents";

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

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

interface Insight {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
}

interface StrengthTrend {
  exerciseId: string;
  name: string;
  data: { date: string; maxWeight: number; volume: number }[];
}

interface HeatmapData {
  date: string;
  count: number;
  volume: number;
  intensity: number;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
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
  const [strengthTrends, setStrengthTrends] = useState<StrengthTrend[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [volumeRes, statsRes, muscleRes, strengthRes, insightsRes, heatmapRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/progress/volume?range=${dateRange}`),
          fetch(`${API_BASE}/api/progress/stats?range=${dateRange}`),
          fetch(`${API_BASE}/api/progress/muscle-distribution?range=${dateRange}`),
          fetch(`${API_BASE}/api/progress/strength-trends?range=${dateRange}`),
          fetch(`${API_BASE}/api/progress/insights`),
          fetch(`${API_BASE}/api/progress/heatmap?range=${dateRange}`),
        ]);

      const volume = await volumeRes.json();
      const statsData = await statsRes.json();
      const muscle = await muscleRes.json();
      const strength = await strengthRes.json();
      const insightsData = await insightsRes.json();
      const heatmap = await heatmapRes.json();

      setVolumeData(volume);
      setStats(statsData);
      setMuscleData(
        muscle.map((item: any, index: number) => ({
          ...item,
          color: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"][index % 5],
        }))
      );
      setStrengthTrends(strength);
      setInsights(insightsData);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text("MINMAX Workout Progress Report", 20, 20);

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

      // Stats
      doc.setFontSize(14);
      doc.text("Statistics", 20, 45);
      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Value", "Change"]],
        body: [
          ["Total Volume", `${stats.totalVolume} kg`, `${stats.volumeChange >= 0 ? '+' : ''}${stats.volumeChange}%`],
          ["Workouts", String(stats.workouts), `${stats.workoutChange >= 0 ? '+' : ''}${stats.workoutChange}%`],
          ["Avg Weight", `${stats.avgWeight} kg`, "-"],
        ],
      });

      // Insights
      if (insights.length > 0) {
        doc.text("Insights", 20, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [["Type", "Title", "Message"]],
          body: insights.map((i) => [i.type, i.title, i.message]),
        });
      }

      doc.save("minmax-progress-report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to export PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Date", "Volume", "Workouts"],
      ...volumeData.map((item: any) => [item.date, item.volume, item.workouts || 0]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minmax-volume-data.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 pb-24">
        <div className="mb-6">
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 pb-24">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-white text-xl font-semibold">Progress Analytics</h2>
        <div className="flex items-center gap-3">
          <DatePicker value={dateRange} onChange={setDateRange} />
          <ExportButton onExport={exportToPDF} loading={exportingPDF} label="Export PDF" />
          <ExportButton onExport={exportToCSV} label="Export CSV" />
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorDisplay message={error} />
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="text-white/60 text-sm">Avg Weight</div>
          <div className="text-white text-2xl font-bold">{stats.avgWeight || 0} kg</div>
          <div className="text-yellow-400 text-sm">No change</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="text-white/60 text-sm">Streak</div>
          <div className="text-white text-2xl font-bold">
            {insights.find((i) => i.title.includes("Streak"))?.message.match(/\d+/)?.[0] || 0}
          </div>
          <div className="text-green-400 text-sm">days</div>
        </motion.div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">Insights & Recommendations</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* Workout Frequency Heatmap */}
      {heatmapData.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">Workout Frequency</h3>
          <div className="flex flex-wrap gap-1">
            {heatmapData.map((item) => (
              <HeatmapCell
                key={item.date}
                date={item.date}
                intensity={item.intensity}
                onClick={() => console.log(item)}
              />
            ))}
          </div>
        </div>
      )}

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
        {strengthTrends.length > 0 && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-white font-medium mb-4">Strength Trends (Top Exercises)</h3>
            <div className="space-y-4">
              {strengthTrends.slice(0, 3).map((trend) => (
                <div key={trend.exerciseId}>
                  <h4 className="text-white/80 text-sm mb-2">{trend.name}</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trend.data}>
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
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Muscle Group Distribution */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4">Muscle Group Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={muscleData as any} cx="50%" cy="50%" outerRadius={80} dataKey="value">
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
      </div>
    </div>
  );
}
