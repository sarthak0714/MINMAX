import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient, Workout, WorkoutExercise, Exercise } from "../lib/api";
import AddWorkoutModal from "../components/AddWorkoutModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CalendarMode = "month" | "week";

function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDays(): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((currentDay + 6) % 7)); // Get Monday

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

function getMonthMatrix(base: Date): Date[][] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7)); // start Monday

  const weeks: Date[][] = [];
  for (let week = 0; week < 6; week++) {
    const weekDays: Date[] = [];
    for (let day = 0; day < 7; day++) {
      const d = new Date(start);
      d.setDate(start.getDate() + week * 7 + day);
      weekDays.push(d);
    }
    weeks.push(weekDays);
  }
  return weeks;
}

function dayISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>(
    []
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const weekDays = useMemo(() => getWeekDays(), []);
  const monthMatrix = useMemo(() => getMonthMatrix(new Date()), []);
  const currentMonth = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const volumeByDay = useMemo(() => {
    const map = new Map<string, { volume: number; sets: number }>();
    for (const w of workouts) {
      const key = w.date.slice(0, 10);
      const v = w.metrics?.totalVolume ?? 0;
      const s =
        w.metrics?.numSets ??
        w.exercises.reduce((n, ex) => n + ex.sets.length, 0);
      const prev = map.get(key) || { volume: 0, sets: 0 };
      map.set(key, { volume: prev.volume + v, sets: prev.sets + s });
    }
    return map;
  }, [workouts]);

  const todaysWorkouts = useMemo(
    () => workouts.filter((w) => w.date.slice(0, 10) === selectedDate),
    [workouts, selectedDate]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workoutsRes, exercisesRes] = await Promise.all([
        apiClient.getWorkouts({}),
        apiClient.getExercises(),
      ]);
      setWorkouts(workoutsRes.documents);
      setExercises(exercisesRes.documents);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = () => {
    setEditingWorkout(null);
    setSelectedExercises([]);
    setShowAddModal(true);
  };

  const handleDatePress = (dateISO: string) => {
    setSelectedDate(dateISO);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setSelectedExercises(workout.exercises);
    setShowAddModal(true);
  };

  const handleSaveWorkout = async (
    workoutData: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
  ) => {
    try {
      if (editingWorkout) {
        await apiClient.updateWorkout(editingWorkout._id, workoutData);
      } else {
        await apiClient.createWorkout(workoutData);
      }

      await loadData();
      setShowAddModal(false);
      setEditingWorkout(null);
    } catch (error) {
      console.error("Failed to save workout:", error);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (deleteConfirmId === workoutId) {
      try {
        await apiClient.deleteWorkout(workoutId);
        await loadData();
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("Failed to delete workout:", error);
      }
    } else {
      setDeleteConfirmId(workoutId);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const getExerciseComparison = (
    exerciseId: string,
    todaySets: WorkoutExercise["sets"]
  ) => {
    const previousInstances: Array<{
      date: string;
      sets: WorkoutExercise["sets"];
    }> = [];

    for (const w of workouts) {
      const workoutDate = w.date.slice(0, 10);
      if (workoutDate >= selectedDate) continue;

      for (const ex of w.exercises) {
        if (ex.exerciseId === exerciseId) {
          previousInstances.push({ date: workoutDate, sets: ex.sets });
          break;
        }
      }
    }

    if (previousInstances.length === 0) return null;

    const last = previousInstances.sort((a, b) =>
      a.date < b.date ? 1 : -1
    )[0];

    const todayVolume = todaySets.reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
      0
    );
    const todayReps = todaySets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
    const todayWeight = todaySets.reduce((sum, s) => sum + (s.weight ?? 0), 0);

    const lastVolume = last.sets.reduce(
      (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
      0
    );
    const lastReps = last.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
    const lastWeight = last.sets.reduce((sum, s) => sum + (s.weight ?? 0), 0);

    const volDiff = todayVolume - lastVolume;
    const repsDiff = todayReps - lastReps;
    const weightDiff = todayWeight - lastWeight;
    const volPct = lastVolume > 0 ? (volDiff / lastVolume) * 100 : 0;
    const direction = volDiff > 0 ? "up" : volDiff < 0 ? "down" : "flat";

    const prevLabel = new Date(last.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      volDiff,
      repsDiff,
      weightDiff,
      volPct,
      direction,
      prevLabel,
      todayVolume,
      lastVolume,
      todayReps,
      lastReps,
      todayWeight,
      lastWeight,
    };
  };

  const maxVolume = useMemo(() => {
    let max = 0;
    const allDays = calendarMode === "month" ? monthMatrix.flat() : weekDays;

    for (const day of allDays) {
      const k = dayISO(day);
      const v = volumeByDay.get(k)?.volume ?? 0;
      if (v > max) max = v;
    }
    return max || 1;
  }, [calendarMode, weekDays, monthMatrix, volumeByDay]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedDate === todayISO()
              ? "Today"
              : new Date(selectedDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
          </Text>
          <Pressable onPress={handleAddWorkout} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Calendar View Toggle and Header */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarControls}>
            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => setCalendarMode("week")}
                style={[
                  styles.modeButton,
                  calendarMode === "week" && styles.modeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    calendarMode === "week" && styles.modeButtonTextActive,
                  ]}
                >
                  Week
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setCalendarMode("month")}
                style={[
                  styles.modeButton,
                  calendarMode === "month" && styles.modeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    calendarMode === "month" && styles.modeButtonTextActive,
                  ]}
                >
                  Month
                </Text>
              </Pressable>
            </View>
            {calendarMode === "month" && (
              <Text style={styles.monthLabel}>{currentMonth}</Text>
            )}
          </View>

          <View style={styles.calendarHeader}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Text key={i} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {calendarMode === "week" ? (
            <View style={styles.calendarDays}>
              {weekDays.map((day, i) => {
                const k = dayISO(day);
                const data = volumeByDay.get(k);
                const volume = data?.volume ?? 0;
                const isToday = k === todayISO();
                const isSelected = k === selectedDate;
                const ratio = volume > 0 ? Math.sqrt(volume / maxVolume) : 0;
                const size = 40 + ratio * 24;

                return (
                  <Animated.View
                    key={i}
                    entering={FadeIn.delay(i * 50)}
                    style={[
                      styles.dayContainer,
                      { zIndex: volume > 0 ? 10 : 1 },
                    ]}
                  >
                    <Pressable onPress={() => handleDatePress(k)}>
                      {volume > 0 ? (
                        <View
                          style={[
                            styles.dayBubble,
                            {
                              width: size,
                              height: size,
                              backgroundColor: isToday
                                ? "rgba(255, 77, 135, 0.35)"
                                : "rgba(255, 255, 255, 0.15)",
                              borderWidth: isSelected ? 2 : 0,
                              borderColor: isSelected
                                ? "rgba(255, 107, 157, 0.8)"
                                : "transparent",
                            },
                          ]}
                        >
                          <Text style={styles.dayNumber}>{day.getDate()}</Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.dayEmpty,
                            isSelected && {
                              borderWidth: 2,
                              borderColor: "rgba(255, 107, 157, 0.6)",
                            },
                          ]}
                        >
                          <Text style={styles.dayNumberEmpty}>
                            {day.getDate()}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={styles.monthGrid}>
              {monthMatrix.map((week, weekIdx) => (
                <View key={weekIdx} style={styles.weekRow}>
                  {week.map((day, dayIdx) => {
                    const k = dayISO(day);
                    const data = volumeByDay.get(k);
                    const volume = data?.volume ?? 0;
                    const isToday = k === todayISO();
                    const isSelected = k === selectedDate;
                    const isCurrentMonth =
                      day.getMonth() === new Date().getMonth();
                    const ratio =
                      volume > 0 ? Math.sqrt(volume / maxVolume) : 0;
                    const baseSize = 36;
                    const maxSize = 56;
                    const size = baseSize + ratio * (maxSize - baseSize);

                    return (
                      <Animated.View
                        key={dayIdx}
                        entering={FadeIn.delay((weekIdx * 7 + dayIdx) * 20)}
                        style={[
                          styles.monthDayContainer,
                          { zIndex: volume > 0 ? 10 : 1 },
                        ]}
                      >
                        <Pressable onPress={() => handleDatePress(k)}>
                          {volume > 0 ? (
                            <View
                              style={[
                                styles.monthDayBubble,
                                {
                                  width: size,
                                  height: size,
                                  backgroundColor: isToday
                                    ? "rgba(255, 77, 135, 0.35)"
                                    : "rgba(255, 255, 255, 0.15)",
                                  borderWidth: isSelected ? 2 : 0,
                                  borderColor: isSelected
                                    ? "rgba(255, 107, 157, 0.8)"
                                    : "transparent",
                                },
                              ]}
                            >
                              <Text style={styles.monthDayNumber}>
                                {day.getDate()}
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.monthDayEmpty,
                                isSelected && {
                                  borderWidth: 2,
                                  borderColor: "rgba(255, 107, 157, 0.6)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.monthDayNumberEmpty,
                                  !isCurrentMonth && styles.otherMonthDay,
                                ]}
                              >
                                {day.getDate()}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Today's Workouts */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayDate}>{todayISO()}</Text>
          </View>

          {todaysWorkouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No workouts yet today</Text>
              <Text style={styles.emptySubtext}>Tap + to log your workout</Text>
            </View>
          ) : (
            <View style={styles.workoutsList}>
              {todaysWorkouts.map((workout, idx) => {
                const v = workout.metrics?.totalVolume ?? 0;
                const s = workout.metrics?.numSets ?? 0;

                return (
                  <Animated.View
                    key={workout._id}
                    entering={FadeInDown.delay(idx * 100)}
                  >
                    <Pressable
                      onPress={() => handleEditWorkout(workout)}
                      style={styles.workoutCard}
                    >
                      <View style={styles.workoutHeader}>
                        <Text style={styles.workoutTitle}>
                          {workout.title || "Workout"}
                        </Text>
                        <Pressable
                          onPress={() => handleDeleteWorkout(workout._id)}
                          style={[
                            styles.deleteButton,
                            deleteConfirmId === workout._id &&
                              styles.deleteButtonConfirm,
                          ]}
                        >
                          {deleteConfirmId === workout._id ? (
                            <Text style={styles.deleteConfirmText}>
                              Tap again
                            </Text>
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="rgba(255, 100, 100, 0.8)"
                            />
                          )}
                        </Pressable>
                      </View>

                      <View style={styles.workoutStats}>
                        <Text style={styles.statText}>
                          <Text style={styles.statValue}>{v}</Text> kg
                        </Text>
                        <Text style={styles.statDivider}>·</Text>
                        <Text style={styles.statText}>
                          <Text style={styles.statValue}>{s}</Text> sets
                        </Text>
                      </View>

                      {/* Exercise Details */}
                      <View style={styles.exercisesList}>
                        {workout.exercises.map((ex, i) => {
                          const comparison = getExerciseComparison(
                            ex.exerciseId,
                            ex.sets
                          );
                          const exVolume = ex.sets.reduce(
                            (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
                            0
                          );
                          const exSets = ex.sets.length;

                          return (
                            <View key={i} style={styles.exerciseCard}>
                              <View style={styles.exerciseHeader}>
                                <Text style={styles.exerciseName}>
                                  {ex.name}
                                </Text>
                                {comparison && (
                                  <View style={styles.comparisonBadge}>
                                    <Ionicons
                                      name={
                                        comparison.direction === "up"
                                          ? "trending-up"
                                          : comparison.direction === "down"
                                          ? "trending-down"
                                          : "remove"
                                      }
                                      size={12}
                                      color={
                                        comparison.direction === "up"
                                          ? "#4ADE80"
                                          : comparison.direction === "down"
                                          ? "#F87171"
                                          : "#FCD34D"
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.comparisonText,
                                        {
                                          color:
                                            comparison.direction === "up"
                                              ? "#4ADE80"
                                              : comparison.direction === "down"
                                              ? "#F87171"
                                              : "#FCD34D",
                                        },
                                      ]}
                                    >
                                      {comparison.volDiff > 0 ? "+" : ""}
                                      {comparison.volDiff} V
                                    </Text>
                                    {comparison.repsDiff !== 0 && (
                                      <>
                                        <Text style={styles.comparisonDot}>
                                          ·
                                        </Text>
                                        <Text
                                          style={[
                                            styles.comparisonText,
                                            {
                                              color:
                                                comparison.direction === "up"
                                                  ? "#4ADE80"
                                                  : comparison.direction ===
                                                    "down"
                                                  ? "#F87171"
                                                  : "#FCD34D",
                                            },
                                          ]}
                                        >
                                          {comparison.repsDiff > 0 ? "+" : ""}
                                          {comparison.repsDiff} R
                                        </Text>
                                      </>
                                    )}
                                  </View>
                                )}
                              </View>
                              <View style={styles.exerciseStats}>
                                <Text style={styles.exerciseStatText}>
                                  <Text style={styles.exerciseStatValue}>
                                    {exVolume}
                                  </Text>{" "}
                                  kg
                                </Text>
                                <Text style={styles.statDivider}>·</Text>
                                <Text style={styles.exerciseStatText}>
                                  <Text style={styles.exerciseStatValue}>
                                    {exSets}
                                  </Text>{" "}
                                  sets
                                </Text>
                              </View>
                              {comparison && (
                                <Text style={styles.comparisonDetail}>
                                  (
                                  {comparison.volPct
                                    ? `${
                                        comparison.volPct > 0 ? "+" : ""
                                      }${comparison.volPct.toFixed(1)}% volume`
                                    : "no change"}{" "}
                                  vs {comparison.prevLabel})
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Workout Modal */}
      <AddWorkoutModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingWorkout(null);
        }}
        dateISO={selectedDate}
        userId="single"
        exerciseOptions={exercises}
        workout={editingWorkout || undefined}
        onSave={handleSaveWorkout}
      />
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  calendarControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 100,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  modeButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modeButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  modeButtonTextActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    width: (SCREEN_WIDTH - 48) / 7,
    textAlign: "center",
  },
  calendarDays: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: -4,
  },
  dayContainer: {
    width: (SCREEN_WIDTH - 48) / 7,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBubble: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  dayEmpty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberEmpty: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  monthGrid: {
    gap: 4,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -8,
  },
  monthDayContainer: {
    width: (SCREEN_WIDTH - 48) / 7,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDayBubble: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDayNumber: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  monthDayEmpty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  monthDayNumberEmpty: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
  },
  otherMonthDay: {
    color: "rgba(255, 255, 255, 0.2)",
  },
  todaySection: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  todayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  todayLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  todayDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
  },
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 16,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 100, 100, 0.1)",
    borderRadius: 100,
  },
  deleteButtonConfirm: {
    backgroundColor: "rgba(255, 68, 68, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.5)",
  },
  deleteConfirmText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  workoutStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  statText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  statValue: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  statDivider: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  exercisesList: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 12,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    flex: 1,
  },
  comparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  comparisonDot: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.3)",
  },
  exerciseStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  exerciseStatText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
  },
  exerciseStatValue: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  comparisonDetail: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
  },
});
