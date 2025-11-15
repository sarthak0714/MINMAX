import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  PanResponder,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Workout, WorkoutExercise, WorkoutSet, Exercise } from "../lib/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  dateISO: string;
  userId: string;
  exerciseOptions: Exercise[];
  workout?: Workout;
  onSave: (
    workout: Omit<Workout, "_id" | "createdAt" | "updatedAt" | "metrics">
  ) => void;
};

function newSet(index: number): WorkoutSet {
  return {
    setNumber: index + 1,
    reps: 8,
    weight: 40,
    rir: null,
    tempo: null,
    notes: null,
    isWarmup: false,
  };
}

export default function AddWorkoutModal({
  visible,
  onClose,
  dateISO,
  userId,
  exerciseOptions,
  workout,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<WorkoutExercise[]>([]);
  const [dateValue, setDateValue] = useState(dateISO);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle swipe down when scroll is at top
        return gestureState.dy > 5 && !isScrolling;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only trigger close if swiping down significantly
        if (gestureState.dy > 100) {
          onClose();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      if (workout) {
        setTitle(workout.title || "");
        setNote(workout.notes || "");
        setDateValue(workout.date.slice(0, 10));
        setItems(workout.exercises || []);
      } else {
        setDateValue(dateISO);
        setTitle("");
        setNote("");
        setItems([]);
      }
      setSearch("");
    }
  }, [visible, dateISO, workout]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exerciseOptions;
    return exerciseOptions.filter((e) => e.name.toLowerCase().includes(q));
  }, [exerciseOptions, search]);

  const addExercise = (opt: Exercise) => {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: opt._id,
        name: opt.name,
        slug: opt.slug,
        sets: [{ ...newSet(0), isWarmup: true }, newSet(1)],
      },
    ]);
    setSearch("");
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    patch: Partial<WorkoutSet>
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], ...patch } as WorkoutSet;
      ex.sets = sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const addSetRow = (exIdx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = [...ex.sets, newSet(ex.sets.length)];
      next[exIdx] = ex;
      return next;
    });
  };

  const removeSetRow = (exIdx: number, setIdx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = ex.sets
        .filter((_, i) => i !== setIdx)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const removeExercise = (exIdx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const handleSave = () => {
    const workoutData: Omit<
      Workout,
      "_id" | "createdAt" | "updatedAt" | "metrics"
    > = {
      userId,
      date: dateValue,
      title: title || undefined,
      notes: note || undefined,
      exercises: items,
    };
    onSave(workoutData);
    setItems([]);
    setTitle("");
    setNote("");
    setSearch("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Dimmed background overlay with gradient */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          <LinearGradient
            colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.7)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Pressable>

        <View style={styles.drawer} {...panResponder.panHandlers}>
          <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
              {/* Handle bar - drag to dismiss */}
              <View style={styles.handleBarArea}>
                <View style={styles.handleBar} />
              </View>

              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {workout ? "Edit Workout" : "Log Workout"}
                </Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons
                    name="close"
                    size={20}
                    color="rgba(255, 255, 255, 0.8)"
                  />
                </Pressable>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => setIsScrolling(true)}
                onScrollEndDrag={() => setIsScrolling(false)}
                onMomentumScrollBegin={() => setIsScrolling(true)}
                onMomentumScrollEnd={() => setIsScrolling(false)}
              >
                {/* Title and Date */}
                <View style={styles.section}>
                  <TextInput
                    style={styles.input}
                    placeholder="Title (optional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Date (YYYY-MM-DD)"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={dateValue}
                    onChangeText={setDateValue}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Notes (optional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={note}
                    onChangeText={setNote}
                  />
                </View>

                {/* Exercise Search */}
                <View style={styles.section}>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search exercises..."
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                  <View style={styles.exerciseGrid}>
                    {filtered.map((ex, idx) => (
                      <Animated.View
                        key={ex._id}
                        entering={FadeInDown.delay(idx * 20)}
                        style={styles.exerciseOptionWrapper}
                      >
                        <Pressable
                          onPress={() => addExercise(ex)}
                          style={styles.exerciseOption}
                        >
                          <Text style={styles.exerciseOptionText}>
                            {ex.name}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                </View>

                {/* Selected Exercises */}
                <View style={styles.section}>
                  {items.map((ex, exIdx) => (
                    <Animated.View
                      key={`${ex.slug}-${exIdx}`}
                      entering={FadeInDown}
                      style={styles.exerciseCard}
                    >
                      <View style={styles.exerciseCardHeader}>
                        <Text style={styles.exerciseCardTitle}>{ex.name}</Text>
                        <Pressable
                          onPress={() => removeExercise(exIdx)}
                          style={styles.removeExerciseButton}
                        >
                          <Text style={styles.removeExerciseButtonText}>
                            Remove
                          </Text>
                        </Pressable>
                      </View>

                      {/* Sets */}
                      <View style={styles.setsContainer}>
                        {ex.sets.map((s, setIdx) => (
                          <View key={setIdx} style={styles.setRow}>
                            <Text style={styles.setLabel}>
                              Set {setIdx + 1}
                            </Text>
                            <TextInput
                              style={styles.setInput}
                              placeholder="Reps"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              value={String(s.reps)}
                              onChangeText={(text) =>
                                updateSet(exIdx, setIdx, {
                                  reps: Number(text) || 0,
                                })
                              }
                              keyboardType="numeric"
                            />
                            <TextInput
                              style={styles.setInput}
                              placeholder="Weight"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              value={String(s.weight ?? 0)}
                              onChangeText={(text) =>
                                updateSet(exIdx, setIdx, {
                                  weight: Number(text) || 0,
                                })
                              }
                              keyboardType="numeric"
                            />
                            <Pressable
                              onPress={() =>
                                updateSet(exIdx, setIdx, {
                                  isWarmup: !s.isWarmup,
                                })
                              }
                              style={styles.warmupButton}
                            >
                              <Ionicons
                                name={s.isWarmup ? "water-outline" : "flame"}
                                size={16}
                                color={
                                  s.isWarmup
                                    ? "rgba(255, 255, 255, 0.8)"
                                    : "rgba(255, 150, 100, 0.9)"
                                }
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => removeSetRow(exIdx, setIdx)}
                              style={styles.removeSetButton}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color="rgba(255, 255, 255, 0.7)"
                              />
                            </Pressable>
                          </View>
                        ))}
                        <Pressable
                          onPress={() => addSetRow(exIdx)}
                          style={styles.addSetButton}
                        >
                          <Text style={styles.addSetButtonText}>+ Add set</Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  ))}
                </View>

                <View style={{ height: 100 }} />
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Pressable
                  onPress={handleSave}
                  disabled={items.length === 0}
                  style={[
                    styles.saveButton,
                    items.length === 0 && styles.disabled,
                  ]}
                >
                  <Text style={styles.saveButtonText}>
                    {workout ? "Update Workout" : "Save Workout"}
                  </Text>
                </Pressable>
                <Pressable onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    position: "relative",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    height: "75%",
    backgroundColor: "transparent",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 107, 157, 0.3)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(15, 10, 20, 0.85)",
    overflow: "hidden",
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 107, 157, 0.5)",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  handleBarArea: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255, 107, 157, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.3)",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: "#FFFFFF",
    fontSize: 15,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: "#FFFFFF",
    fontSize: 15,
  },
  exerciseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exerciseOptionWrapper: {
    width: "48%",
  },
  exerciseOption: {
    padding: 8,
    backgroundColor: "rgba(255, 107, 157, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.2)",
    borderRadius: 20,
    alignItems: "flex-start",
  },
  exerciseOptionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
  },
  exerciseCard: {
    backgroundColor: "rgba(255, 107, 157, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  exerciseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseCardTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    flex: 1,
  },
  removeExerciseButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeExerciseButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setLabel: {
    width: 44,
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  setInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  warmupButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  removeSetButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addSetButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    marginTop: 4,
  },
  addSetButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 24,
    gap: 8,
    borderTopWidth: 0,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: "rgba(255, 107, 157, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.4)",
    borderRadius: 100,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 100,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});
