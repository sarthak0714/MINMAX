import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { apiClient, Exercise } from "../lib/api";
import ExerciseDetailScreen from "./ExerciseDetailScreen";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDetailScreen, setShowDetailScreen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const { documents } = await apiClient.getExercises();
      setExercises(documents);
    } catch (error) {
      console.error("Failed to load exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscle.some((muscle) =>
        muscle.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollTop = contentOffset.y;
    const scrollHeight = contentSize.height;
    const clientHeight = layoutMeasurement.height;

    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  };

  const handleExercisePress = (exercise: Exercise, index: number) => {
    setSelectedExercise(exercise);
    setSelectedIndex(index);
    setShowDetailScreen(true);
  };

  const handleExerciseSave = async (updatedExercise: Exercise) => {
    try {
      const isNewExercise = updatedExercise._id.includes("T"); // Temporary IDs contain 'T' from ISO string

      if (isNewExercise) {
        // Create new exercise in database
        const { document } = await apiClient.createExercise({
          name: updatedExercise.name,
          targetMuscle: updatedExercise.targetMuscle,
          meta: updatedExercise.meta,
        });

        // Refresh the exercise list from server
        const { documents } = await apiClient.getExercises();
        setExercises(documents);
      } else {
        // Update existing exercise
        await apiClient.updateExercise(updatedExercise._id, {
          name: updatedExercise.name,
          targetMuscle: updatedExercise.targetMuscle,
          meta: updatedExercise.meta,
        });

        // Update local state
        const updatedExercises = [...exercises];
        const index = updatedExercises.findIndex(
          (ex) => ex._id === updatedExercise._id
        );
        if (index >= 0) {
          updatedExercises[index] = updatedExercise;
          setExercises(updatedExercises);
        }
      }

      setShowDetailScreen(false);
    } catch (error) {
      console.error("Failed to save exercise:", error);
      // Still close the screen even if save fails
      setShowDetailScreen(false);
    }
  };

  const handleExerciseDelete = async () => {
    if (selectedExercise) {
      try {
        const isNewExercise = selectedExercise._id.includes("T"); // Temporary IDs contain 'T'

        if (!isNewExercise) {
          // Only delete from database if it's an existing exercise
          await apiClient.deleteExercise(selectedExercise._id);
        }

        // Update local state
        setExercises(exercises.filter((ex) => ex._id !== selectedExercise._id));
      } catch (error) {
        console.error("Failed to delete exercise:", error);
        // Still remove from local state even if API call fails
        setExercises(exercises.filter((ex) => ex._id !== selectedExercise._id));
      }
    }
    setShowDetailScreen(false);
  };

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      _id: new Date().toISOString(),
      slug: "new-exercise",
      createdAt: new Date().toISOString(),
      name: "New Exercise",
      targetMuscle: ["Muscle Group"],
      meta: ["Equipment", "Difficulty"],
    };

    setExercises([...exercises, newExercise]);
    setSelectedExercise(newExercise);
    setSelectedIndex(exercises.length);
    setShowDetailScreen(true);
  };

  const handleBackToList = () => {
    setShowDetailScreen(false);
    setSelectedExercise(null);
    setSelectedIndex(-1);
  };

  if (showDetailScreen && selectedExercise) {
    return (
      <ExerciseDetailScreen
        exercise={selectedExercise}
        onBack={handleBackToList}
        onSave={handleExerciseSave}
        onDelete={handleExerciseDelete}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar and Add Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable onPress={handleAddExercise} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.map((exercise, index) => (
            <Animated.View
              key={exercise._id}
              entering={FadeIn.duration(200).delay(index * 50)}
            >
              <Pressable
                onPress={() => handleExercisePress(exercise, index)}
                onPressIn={() => setSelectedIndex(index)}
                style={[
                  styles.exerciseCard,
                  selectedIndex === index && styles.exerciseCardSelected,
                ]}
              >
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.targetMuscle.length > 0 && (
                    <View style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>
                        {exercise.targetMuscle[0]}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))}

          {filteredExercises.length === 0 && (
            <Text style={styles.emptyText}>No exercises found</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: 16,
    height: 60,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 100,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listWrapper: {
    flex: 1,
    position: "relative",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 160,
  },
  exerciseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
  },
  exerciseCardSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  exerciseContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  muscleTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleTagText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: 32,
    fontSize: 16,
  },
});
