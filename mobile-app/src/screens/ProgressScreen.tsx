import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLine,
  VictoryScatter,
  VictoryPie,
  VictoryTheme,
} from "victory-native";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { ErrorDisplay, InsightCard } from "../components/ProgressComponents";
import { apiClient } from "../lib/api";
import { FontAwesome6 } from "@expo/vector-icons";

// Utility functions
function safeNumber(value: any): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function sanitizeChartData(data: any[]): any[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      // Check if required fields exist and are valid numbers
      const xValue = item.date || item.x;
      const yValue = item.maxWeight || item.volume || item.workouts || item.y;
      return xValue && safeNumber(yValue) >= 0;
    })
    .map((item) => ({
      ...item,
      maxWeight: safeNumber(item.maxWeight),
      volume: safeNumber(item.volume),
      workouts: safeNumber(item.workouts),
      y: safeNumber(item.y),
    }));
}

function formatNumber(value: number, includeUnit = false): string {
  const safeValue = safeNumber(value);
  if (safeValue === 0 && value !== 0) {
    return "-";
  }
  if (safeValue >= 10000) {
    return `${(safeValue / 1000).toFixed(1)}k${includeUnit ? " kg" : ""}`;
  }
  return `${safeValue.toFixed(0)}${includeUnit ? " kg" : ""}`;
}

function formatPercent(value: number): string {
  const safeValue = safeNumber(value);
  if (safeValue === 0 && value !== 0) {
    return "-";
  }
  return `${safeValue >= 0 ? "+" : ""}${safeValue.toFixed(1)}%`;
}

function getTimeRangeLabel(range: string): string {
  const labels: { [key: string]: string } = {
    "1w": "Last 7 Days",
    "1m": "Last 30 Days",
    "3m": "Last 90 Days",
    "6m": "Last 6 Months",
    "1y": "Last Year",
    max: "All Time",
  };
  return labels[range] || "Last 30 Days";
}

// Types
interface Stats {
  totalVolume: number;
  workouts: number;
  avgWeight: number;
  volumeChange: number;
  workoutChange: number;
  totalSets: number;
  muscleSplit: Array<{ _id: string; volume: number }>;
}

interface Insight {
  type: string;
  title: string;
  message: string;
}

interface StrengthTrend {
  exerciseId: string;
  name: string;
  targetMuscle?: string[];
  data: { date: string; maxWeight: number; volume: number; est1RM: number }[];
}

interface Exercise {
  _id: string;
  name: string;
  targetMuscle: string[];
}

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "strength" | "consistency"
  >("overview");
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVolume: 0,
    workouts: 0,
    avgWeight: 0,
    volumeChange: 0,
    workoutChange: 0,
    totalSets: 0,
    muscleSplit: [],
  });
  const [strengthTrends, setStrengthTrends] = useState<StrengthTrend[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showMuscleDropdown, setShowMuscleDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState<string>("1w");
  const [metricType, setMetricType] = useState<"maxWeight" | "est1RM">("maxWeight");
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchData();
    fetchMuscleGroups();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [timeRange]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const fetchMuscleGroups = async () => {
    try {
      const data = await apiClient.getExercises();
      const exercisesList = data.documents || [];

      if (exercisesList.length === 0) {
        console.log("No exercises found");
        return;
      }

      setExercises(exercisesList);

      const allMuscles = exercisesList.flatMap(
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
      // Map timeRange to API parameter
      const rangeMap: { [key: string]: string } = {
        "1w": "last-7-days",
        "1m": "last-30-days",
        "3m": "last-90-days",
        "6m": "last-180-days",
        "1y": "last-365-days",
        max: "all-time",
      };
      const apiRange = rangeMap[timeRange] || "last-30-days";

      const [volume, statsData, strength, insightsData] = await Promise.all([
        apiClient.getVolumeData(apiRange),
        apiClient.getStats(timeRange === "1w" ? "last-7-days" : "last-30-days"),
        apiClient.getStrengthTrends(apiRange),
        apiClient.getInsights(),
      ]);

      setVolumeData(volume);
      const totalSets =
        volume?.reduce(
          (sum: number, day: any) => sum + (day.workouts || 0) * 5,
          0
        ) || 0;
      setStats({ ...statsData, totalSets });
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const renderTrendIcon = (change: number) => {
    if (change > 0) return "↑";
    if (change < 0) return "↓";
    return "−";
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          "rgba(16, 185, 129, 0.4)",
          "rgba(5, 150, 105, 0.35)",
          "rgba(16, 185, 129, 0.15)",
          "rgba(0, 0, 0, 0.85)",
          "#000",
        ]}
        locations={[0, 0.15, 0.4, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <View style={styles.timeRangeContainer}>
            {["max", "1y", "6m", "3m", "1m", "1w"].map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === range && styles.timeRangeTextActive,
                  ]}
                >
                  {range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            {(["overview", "strength", "consistency"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error && <ErrorDisplay message={error} />}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <Animated.View
            style={[
              styles.tabContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Metrics Grid - 2x2 layout */}
            <View style={styles.metricsGrid}>
              {/* Row 1 */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Volume</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {formatNumber(stats.totalVolume / 1000)}
                  </Text>
                  <Text style={styles.metricMainUnit}>k kg</Text>
                </View>
                <View style={styles.metricStatus}>
                  <FontAwesome5
                    name={
                      stats.volumeChange >= 0
                        ? "chevron-circle-up"
                        : "chevron-circle-down"
                    }
                    size={14}
                    color="rgba(16, 185, 129, 0.9)"
                    solid
                  />
                  <Text style={styles.metricStatusText}>
                    {formatPercent(stats.volumeChange)} VS LAST WEEK
                  </Text>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Workouts</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {formatNumber(stats.workouts)}
                  </Text>
                </View>
                <View style={styles.metricStatus}>
                  <FontAwesome5
                    name={
                      stats.workoutChange >= 0
                        ? "chevron-circle-up"
                        : "chevron-circle-down"
                    }
                    size={14}
                    color="rgba(16, 185, 129, 0.9)"
                    solid
                  />
                  <Text style={styles.metricStatusText}>
                    {formatPercent(stats.workoutChange)} VS LAST WEEK
                  </Text>
                </View>
              </View>

              {/* Row 2 */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Avg Weight</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {formatNumber(stats.avgWeight)}
                  </Text>
                  <Text style={styles.metricMainUnit}>kg</Text>
                </View>
                <Text style={styles.metricStatusText}>PER SET</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Sets</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {formatNumber(stats.totalSets || 0)}
                  </Text>
                </View>
                <Text style={styles.metricStatusText}>THIS WEEK</Text>
              </View>
            </View>

            {/* Muscle Split Chart */}
            {stats.muscleSplit && stats.muscleSplit.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Muscle Split (Volume)</Text>
                <View style={styles.muscleSplitList}>
                  {stats.muscleSplit
                    .sort((a, b) => b.volume - a.volume)
                    .map((item, index) => {
                      const maxVolume = Math.max(
                        ...stats.muscleSplit.map((m) => m.volume)
                      );
                      const percentage = (item.volume / maxVolume) * 100;
                      return (
                        <View key={item._id} style={styles.muscleSplitItem}>
                          <View style={styles.muscleSplitHeader}>
                            <Text style={styles.muscleSplitName}>
                              {item._id}
                            </Text>
                            <Text style={styles.muscleSplitValue}>
                              {formatNumber(item.volume)} kg
                            </Text>
                          </View>
                          <View style={styles.progressBarContainer}>
                            <View
                              style={[
                                styles.progressBar,
                                { width: `${percentage}%` },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                </View>
              </View>
            )}

            {/* Volume Trend Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Volume Trend</Text>
                <Text style={styles.chartSubtitle}>
                  {getTimeRangeLabel(timeRange)}
                </Text>
              </View>
              <VictoryChart
                width={width - 64}
                height={220}
                theme={VictoryTheme.material}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "rgba(255, 255, 255, 0.1)" },
                    tickLabels: {
                      fill: "rgba(255, 255, 255, 0.4)",
                      fontSize: 10,
                    },
                    grid: { stroke: "transparent" },
                  }}
                  tickCount={6}
                  tickFormat={(value) => {
                    // For weekly data (format: "YYYY-WXX")
                    if (typeof value === "string" && value.includes("-W")) {
                      const week = value.split("-W")[1];
                      return `W${week}`;
                    }
                    // For monthly data (format: "YYYY-MM")
                    if (
                      typeof value === "string" &&
                      value.match(/^\d{4}-\d{2}$/)
                    ) {
                      const month = value.split("-")[1];
                      const monthNames = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      return monthNames[parseInt(month) - 1];
                    }
                    // For daily data (Date object)
                    const d = new Date(value);
                    return d.getDate().toString();
                  }}
                  scale="time"
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: {
                      fill: "rgba(255, 255, 255, 0.4)",
                      fontSize: 10,
                    },
                    grid: {
                      stroke: "rgba(255, 255, 255, 0.1)",
                      strokeDasharray: "3,3",
                    },
                  }}
                />
                <VictoryLine
                  data={volumeData}
                  x="date"
                  y="volume"
                  style={{
                    data: {
                      stroke: "rgba(16, 185, 129, 0.9)",
                      strokeWidth: 2.5,
                    },
                  }}
                  interpolation="monotoneX"
                />
                <VictoryScatter
                  data={volumeData}
                  x="date"
                  y="volume"
                  size={3}
                  style={{
                    data: { fill: "rgba(16, 185, 129, 1)" },
                  }}
                />
              </VictoryChart>
            </View>

            {/* Insights */}
            {insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Insights</Text>
                {insights.slice(0, 3).map((insight, index) => (
                  <InsightCard key={index} {...insight} />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Strength Tab */}
        {activeTab === "strength" && (
          <Animated.View
            style={[
              styles.tabContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Muscle Group Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Muscle Group</Text>
              <TouchableOpacity
                onPress={() => setShowMuscleDropdown(!showMuscleDropdown)}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedMuscleGroup === "all"
                    ? "All Muscles"
                    : selectedMuscleGroup}
                </Text>
                <Text style={styles.dropdownIcon}>
                  {showMuscleDropdown ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {showMuscleDropdown && (
                <ScrollView style={styles.dropdownMenu}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedMuscleGroup("all");
                      setSelectedExercise("");
                      setShowMuscleDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      selectedMuscleGroup === "all" &&
                        styles.dropdownItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        selectedMuscleGroup === "all" &&
                          styles.dropdownTextActive,
                      ]}
                    >
                      All Muscles
                    </Text>
                  </TouchableOpacity>
                  {muscleGroups.map((group) => (
                    <TouchableOpacity
                      key={group}
                      onPress={() => {
                        setSelectedMuscleGroup(group);
                        setSelectedExercise("");
                        setShowMuscleDropdown(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        selectedMuscleGroup === group &&
                          styles.dropdownItemActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          selectedMuscleGroup === group &&
                            styles.dropdownTextActive,
                        ]}
                      >
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Single Exercise Details */}
            {selectedExercise &&
              (() => {
                const trend = strengthTrends.find(
                  (t) => t.exerciseId === selectedExercise
                );

                if (!trend || !trend.data || trend.data.length === 0) {
                  return (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateTitle}>
                        No data available for this exercise
                      </Text>
                      <Text style={styles.emptyStateText}>
                        Start logging workouts to see your progress
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedExercise("")}
                        style={styles.backButton}
                      >
                        <Text style={styles.backButtonText}>
                          ← Back to list
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }

                const latestWeight =
                  trend.data[trend.data.length - 1]?.maxWeight || 0;
                const previousWeight = trend.data[0]?.maxWeight || 0;
                const change =
                  previousWeight > 0
                    ? ((latestWeight - previousWeight) / previousWeight) * 100
                    : 0;
                const maxWeight = Math.max(
                  ...trend.data.map((d) => safeNumber(d.maxWeight))
                );
                const totalVolume = trend.data.reduce(
                  (sum, d) => sum + (d.volume || 0),
                  0
                );

                return (
                  <View>
                    <TouchableOpacity
                      onPress={() => setSelectedExercise("")}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>← Back to list</Text>
                    </TouchableOpacity>

                    {/* Exercise Header */}
                    <View style={styles.exerciseDetailHeader}>
                      <Text style={styles.exerciseDetailTitle}>
                        {trend.name}
                      </Text>
                      <View style={styles.exerciseDetailStats}>
                        <View style={styles.detailStat}>
                          <Text style={styles.detailStatLabel}>Current</Text>
                          <Text style={styles.detailStatValue}>
                            {formatNumber(latestWeight)} kg
                          </Text>
                        </View>
                        <View style={styles.detailStat}>
                          <Text style={styles.detailStatLabel}>PR</Text>
                          <Text style={styles.detailStatValue}>
                            {formatNumber(maxWeight)} kg
                          </Text>
                        </View>
                        <View style={styles.detailStat}>
                          <Text style={styles.detailStatLabel}>Progress</Text>
                          <View style={styles.progressBadge}>
                            <Text style={styles.progressText}>
                              {renderTrendIcon(change)} {formatPercent(change)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Metric Toggle */}
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          metricType === "maxWeight" && styles.toggleButtonActive,
                        ]}
                        onPress={() => setMetricType("maxWeight")}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            metricType === "maxWeight" && styles.toggleTextActive,
                          ]}
                        >
                          Max Weight
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          metricType === "est1RM" && styles.toggleButtonActive,
                        ]}
                        onPress={() => setMetricType("est1RM")}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            metricType === "est1RM" && styles.toggleTextActive,
                          ]}
                        >
                          Est. 1RM
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Trend Chart */}
                    <View style={styles.chartCard}>
                      <Text style={styles.chartTitle}>
                        {metricType === "maxWeight"
                          ? "Max Weight Progression"
                          : "Estimated 1RM Progression"}
                      </Text>
                      <VictoryChart
                        width={width - 64}
                        height={220}
                        theme={VictoryTheme.material}
                        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                        domain={{
                          y: [
                            Math.max(
                              0,
                              Math.min(
                                ...trend.data.map((d) =>
                                  safeNumber(d[metricType])
                                )
                              ) * 0.9
                            ),
                            Math.max(
                              ...trend.data.map((d) => safeNumber(d[metricType]))
                            ) * 1.1,
                          ],
                        }}
                      >
                        <VictoryAxis
                          style={{
                            axis: { stroke: "rgba(255, 255, 255, 0.1)" },
                            tickLabels: {
                              fill: "rgba(255, 255, 255, 0.4)",
                              fontSize: 10,
                            },
                          }}
                          tickFormat={(date) =>
                            new Date(date).getDate().toString()
                          }
                        />
                        <VictoryAxis
                          dependentAxis
                          style={{
                            axis: { stroke: "transparent" },
                            tickLabels: {
                              fill: "rgba(255, 255, 255, 0.4)",
                              fontSize: 10,
                            },
                            grid: {
                              stroke: "rgba(255, 255, 255, 0.1)",
                              strokeDasharray: "3,3",
                            },
                          }}
                        />
                        <VictoryLine
                          data={sanitizeChartData(trend.data)}
                          x="date"
                          y={metricType}
                          style={{
                            data: { stroke: "#10b981", strokeWidth: 3 },
                          }}
                        />
                      </VictoryChart>
                    </View>

                    {/* Volume Trend Chart */}
                    <View style={styles.chartCard}>
                      <Text style={styles.chartTitle}>Volume Trend</Text>
                      <VictoryChart
                        width={width - 64}
                        height={220}
                        theme={VictoryTheme.material}
                        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                      >
                        <VictoryAxis
                          style={{
                            axis: { stroke: "rgba(255, 255, 255, 0.1)" },
                            tickLabels: {
                              fill: "rgba(255, 255, 255, 0.4)",
                              fontSize: 10,
                            },
                          }}
                          tickFormat={(date) =>
                            new Date(date).getDate().toString()
                          }
                        />
                        <VictoryAxis
                          dependentAxis
                          style={{
                            axis: { stroke: "transparent" },
                            tickLabels: {
                              fill: "rgba(255, 255, 255, 0.4)",
                              fontSize: 10,
                            },
                            grid: {
                              stroke: "rgba(255, 255, 255, 0.1)",
                              strokeDasharray: "3,3",
                            },
                          }}
                        />
                        <VictoryBar
                          data={sanitizeChartData(trend.data)}
                          x="date"
                          y="volume"
                          style={{
                            data: { fill: "rgba(16, 185, 129, 0.7)" },
                          }}
                          cornerRadius={{ top: 4, bottom: 0 }}
                        />
                      </VictoryChart>
                    </View>
                  </View>
                );
              })()}

            {/* Exercise List for Selected Muscle Group */}
            {!selectedExercise && selectedMuscleGroup === "all" && (
              <View>
                <Text style={styles.sectionTitle}>All Exercises</Text>
                <ScrollView>
                  {strengthTrends.map((trend) => {
                    const latestWeight =
                      trend.data[trend.data.length - 1]?.maxWeight || 0;
                    const previousWeight = trend.data[0]?.maxWeight || 0;
                    const change =
                      previousWeight > 0
                        ? ((latestWeight - previousWeight) / previousWeight) *
                          100
                        : 0;

                    return (
                      <TouchableOpacity
                        key={trend.exerciseId}
                        onPress={() => setSelectedExercise(trend.exerciseId)}
                        style={styles.exerciseCard}
                      >
                        <View style={styles.exerciseHeader}>
                          <View>
                            <Text style={styles.exerciseName}>
                              {trend.name}
                            </Text>
                            <Text style={styles.exerciseSubtext}>
                              Current: {formatNumber(latestWeight)} kg
                            </Text>
                          </View>
                          <View style={styles.changeBadge}>
                            <Text style={styles.changeText}>
                              {renderTrendIcon(change)} {formatPercent(change)}
                            </Text>
                          </View>
                        </View>
                        <VictoryChart
                          width={width - 64}
                          height={140}
                          theme={VictoryTheme.material}
                          padding={{
                            top: 10,
                            bottom: 30,
                            left: 50,
                            right: 10,
                          }}
                          domain={{
                            y: [
                              Math.max(
                                0,
                                Math.min(
                                  ...trend.data.map((d) =>
                                    safeNumber(d.maxWeight)
                                  )
                                ) * 0.9
                              ),
                              Math.max(
                                ...trend.data.map((d) =>
                                  safeNumber(d.maxWeight)
                                )
                              ) * 1.1,
                            ],
                          }}
                        >
                          <VictoryAxis
                            style={{
                              axis: {
                                stroke: "rgba(255, 255, 255, 0.1)",
                              },
                              tickLabels: {
                                fill: "rgba(255, 255, 255, 0.4)",
                                fontSize: 9,
                              },
                            }}
                            tickFormat={(date) =>
                              new Date(date).getDate().toString()
                            }
                          />
                          <VictoryAxis
                            dependentAxis
                            style={{
                              axis: { stroke: "transparent" },
                              tickLabels: {
                                fill: "rgba(255, 255, 255, 0.4)",
                                fontSize: 9,
                              },
                              grid: {
                                stroke: "rgba(255, 255, 255, 0.1)",
                              },
                            }}
                            tickCount={4}
                          />
                          <VictoryLine
                            data={sanitizeChartData(trend.data)}
                            x="date"
                            y="maxWeight"
                            style={{
                              data: { stroke: "#10b981", strokeWidth: 3 },
                            }}
                          />
                        </VictoryChart>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

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
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateTitle}>
                        No data for {selectedMuscleGroup}
                      </Text>
                      <Text style={styles.emptyStateText}>
                        Start logging exercises for this muscle group
                      </Text>
                    </View>
                  );
                }

                const totalVolume = groupExercises.reduce(
                  (sum, trend) =>
                    sum + trend.data.reduce((s, d) => s + (d.volume || 0), 0),
                  0
                );
                const totalSets = groupExercises.reduce(
                  (sum, trend) => sum + trend.data.length,
                  0
                );

                return (
                  <View>
                    {/* Muscle Group Stats */}
                    <View style={styles.muscleGroupCard}>
                      <Text style={styles.muscleGroupTitle}>
                        {selectedMuscleGroup} Analytics
                      </Text>
                      <View style={styles.muscleGroupStats}>
                        <View style={styles.muscleGroupStat}>
                          <Text style={styles.muscleGroupStatLabel}>
                            Exercises
                          </Text>
                          <Text style={styles.muscleGroupStatValue}>
                            {groupExercises.length}
                          </Text>
                        </View>
                        <View style={styles.muscleGroupStat}>
                          <Text style={styles.muscleGroupStatLabel}>
                            Total Volume
                          </Text>
                          <Text style={styles.muscleGroupStatValue}>
                            {formatNumber(totalVolume)} kg
                          </Text>
                        </View>
                        <View style={styles.muscleGroupStat}>
                          <Text style={styles.muscleGroupStatLabel}>
                            Total Sets
                          </Text>
                          <Text style={styles.muscleGroupStatValue}>
                            {totalSets}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Exercises */}
                    <Text style={styles.sectionTitle}>Exercises</Text>
                    <ScrollView>
                      {groupExercises.map((trend) => {
                        const latestWeight =
                          trend.data[trend.data.length - 1]?.maxWeight || 0;
                        const previousWeight = trend.data[0]?.maxWeight || 0;
                        const change =
                          previousWeight > 0
                            ? ((latestWeight - previousWeight) /
                                previousWeight) *
                              100
                            : 0;

                        return (
                          <TouchableOpacity
                            key={trend.exerciseId}
                            onPress={() =>
                              setSelectedExercise(trend.exerciseId)
                            }
                            style={styles.exerciseCard}
                          >
                            <View style={styles.exerciseHeader}>
                              <View>
                                <Text style={styles.exerciseName}>
                                  {trend.name}
                                </Text>
                                <Text style={styles.exerciseSubtext}>
                                  Current: {formatNumber(latestWeight)} kg
                                </Text>
                              </View>
                              <View style={styles.changeBadge}>
                                <Text style={styles.changeText}>
                                  {renderTrendIcon(change)}{" "}
                                  {formatPercent(change)}
                                </Text>
                              </View>
                            </View>
                            <VictoryChart
                              width={width - 64}
                              height={140}
                              theme={VictoryTheme.material}
                              padding={{
                                top: 10,
                                bottom: 30,
                                left: 50,
                                right: 10,
                              }}
                              domain={{
                                y: [
                                  Math.max(
                                    0,
                                    Math.min(
                                      ...trend.data.map((d) =>
                                        safeNumber(d.maxWeight)
                                      )
                                    ) * 0.9
                                  ),
                                  Math.max(
                                    ...trend.data.map((d) =>
                                      safeNumber(d.maxWeight)
                                    )
                                  ) * 1.1,
                                ],
                              }}
                            >
                              <VictoryAxis
                                style={{
                                  axis: {
                                    stroke: "rgba(255, 255, 255, 0.1)",
                                  },
                                  tickLabels: {
                                    fill: "rgba(255, 255, 255, 0.4)",
                                    fontSize: 9,
                                  },
                                }}
                                tickFormat={(date) =>
                                  new Date(date).getDate().toString()
                                }
                              />
                              <VictoryAxis
                                dependentAxis
                                style={{
                                  axis: { stroke: "transparent" },
                                  tickLabels: {
                                    fill: "rgba(255, 255, 255, 0.4)",
                                    fontSize: 9,
                                  },
                                  grid: {
                                    stroke: "rgba(255, 255, 255, 0.1)",
                                  },
                                }}
                                tickCount={4}
                              />
                              <VictoryLine
                                data={sanitizeChartData(trend.data)}
                                x="date"
                                y="maxWeight"
                                style={{
                                  data: { stroke: "#10b981", strokeWidth: 3 },
                                }}
                              />
                            </VictoryChart>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })()}

            {/* Insights */}
            {insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Insights</Text>
                {insights.slice(0, 3).map((insight, index) => (
                  <InsightCard key={index} {...insight} />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Consistency Tab */}
        {activeTab === "consistency" && (
          <Animated.ScrollView
            style={[
              styles.tabContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Metrics Grid - 2x2 layout */}
            <View style={styles.metricsGrid}>
              {/* Row 1 */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>This Week</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {formatNumber(stats.workouts)}
                  </Text>
                </View>
                <Text style={styles.metricStatusText}>SESSIONS</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Volume</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {(stats.totalVolume / 1000).toFixed(1)}
                  </Text>
                  <Text style={styles.metricMainUnit}>k kg</Text>
                </View>
                <Text style={styles.metricStatusText}>LIFTED</Text>
              </View>

              {/* Row 2 */}
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Avg Session</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {Math.round(stats.totalVolume / (stats.workouts || 1))}
                  </Text>
                  <Text style={styles.metricMainUnit}>kg</Text>
                </View>
                <Text style={styles.metricStatusText}>PER WORKOUT</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Weekly Avg</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricMainValue}>
                    {(
                      stats.workouts /
                      (timeRange === "1w"
                        ? 1
                        : timeRange === "1m"
                        ? 4
                        : timeRange === "3m"
                        ? 12
                        : timeRange === "6m"
                        ? 26
                        : 52)
                    ).toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.metricStatusText}>SESSIONS/WEEK</Text>
              </View>
            </View>

            {/* Workout Frequency Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Workout Frequency</Text>
                <Text style={styles.chartSubtitle}>
                  {getTimeRangeLabel(timeRange)}
                </Text>
              </View>
              <VictoryChart
                width={Dimensions.get("window").width - 64}
                height={200}
                theme={VictoryTheme.material}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: {
                      fill: "rgba(255, 255, 255, 0.4)",
                      fontSize: 10,
                    },
                  }}
                  tickFormat={(date) => {
                    const d = new Date(date);
                    return d
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .substring(0, 2);
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: {
                      fill: "rgba(255, 255, 255, 0.4)",
                      fontSize: 10,
                    },
                    grid: { stroke: "rgba(255, 255, 255, 0.1)" },
                  }}
                />
                <VictoryBar
                  data={sanitizeChartData(volumeData)}
                  x="date"
                  y="workouts"
                  style={{
                    data: { fill: "rgba(16, 185, 129, 0.7)" },
                  }}
                  cornerRadius={{ top: 4, bottom: 0 }}
                />
              </VictoryChart>
            </View>

            {/* Training Insights */}
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Training Analysis</Text>
              {insights.length > 0 ? (
                insights
                  .slice(0, 3)
                  .map((insight, index) => (
                    <InsightCard key={index} {...insight} />
                  ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No insights yet</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Complete more workouts to see personalized insights
                  </Text>
                </View>
              )}
            </View>
          </Animated.ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "left",
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 2,
    gap: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeRangeButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  timeRangeText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    fontWeight: "600",
  },
  timeRangeTextActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 100,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  overviewContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    marginHorizontal: 4,
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  chartCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  chartTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartSubtitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  volumeCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    marginBottom: 16,
  },
  volumeValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  volumeValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginRight: 4,
  },
  volumeUnit: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  changeText: {
    color: "rgba(16, 185, 129, 0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  changeSubtext: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  metricItem: {
    width: "47%",
    marginBottom: 8,
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    marginBottom: 8,
    fontWeight: "500",
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  metricMainValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginRight: 2,
  },
  metricMainUnit: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  metricStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricStatusIcon: {
    color: "rgba(16, 185, 129, 0.9)",
    fontSize: 14,
    fontWeight: "bold",
  },
  metricStatusText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  metricUnit: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 2,
  },
  metricChange: {
    color: "rgba(16, 185, 129, 0.8)",
    fontSize: 11,
    fontWeight: "600",
  },
  metricSubtext: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 10,
    marginTop: 2,
  },
  volumeChart: {
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterChipActive: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  filterChipText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyStateText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  muscleGroupCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
  },
  muscleGroupTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  muscleGroupStats: {
    flexDirection: "row",
    gap: 16,
  },
  muscleGroupStat: {
    flex: 1,
  },
  muscleGroupStatLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  muscleGroupStatValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  exerciseSubtext: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  insightsContainer: {
    marginTop: 16,
  },
  insightsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterItem: {
    marginBottom: 16,
  },
  filterLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownIcon: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  dropdownMenu: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginTop: 8,
    maxHeight: 250,
  },
  dropdownContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownItemActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  dropdownText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownTextActive: {
    color: "rgba(16, 185, 129, 1)",
    fontWeight: "600",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#fff",
  },
  filterButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: "#000",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
  },
  groupContainer: {
    flex: 1,
  },
  groupHeader: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  groupTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  groupStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseCurrent: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  exerciseDetailContainer: {
    flex: 1,
  },
  exerciseDetailHeader: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  exerciseDetailTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  exerciseDetailStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailStat: {
    alignItems: "center",
  },
  detailStatLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    marginBottom: 4,
  },
  detailStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  summaryLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  consistencyGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  consistencyCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    marginHorizontal: 4,
  },
  consistencyLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  consistencyValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  consistencySubtext: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 10,
    marginTop: 4,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "rgba(16, 185, 129, 0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  toggleText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  muscleSplitList: {
    marginTop: 8,
  },
  muscleSplitItem: {
    marginBottom: 12,
  },
  muscleSplitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  muscleSplitName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  muscleSplitValue: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
});
