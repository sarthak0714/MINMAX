import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { Exercise } from "../lib/api";

interface ExerciseDetailScreenProps {
  exercise: Exercise;
  onBack: () => void;
  onSave: (exercise: Exercise) => void;
  onDelete?: () => void;
}

export default function ExerciseDetailScreen({
  exercise,
  onBack,
  onSave,
  onDelete,
}: ExerciseDetailScreenProps) {
  const [isEditing, setIsEditing] = useState(exercise.name === "New Exercise");
  const [editedExercise, setEditedExercise] = useState<Exercise>(exercise);

  const handleSave = () => {
    onSave(editedExercise);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedExercise(exercise);
    setIsEditing(false);
  };

  const addTargetMuscle = () => {
    setEditedExercise({
      ...editedExercise,
      targetMuscle: [...editedExercise.targetMuscle, ""],
    });
  };

  const removeTargetMuscle = (index: number) => {
    setEditedExercise({
      ...editedExercise,
      targetMuscle: editedExercise.targetMuscle.filter((_, i) => i !== index),
    });
  };

  const updateTargetMuscle = (index: number, value: string) => {
    const updated = [...editedExercise.targetMuscle];
    updated[index] = value;
    setEditedExercise({ ...editedExercise, targetMuscle: updated });
  };

  const addMeta = () => {
    setEditedExercise({
      ...editedExercise,
      meta: [...editedExercise.meta, ""],
    });
  };

  const removeMeta = (index: number) => {
    setEditedExercise({
      ...editedExercise,
      meta: editedExercise.meta.filter((_, i) => i !== index),
    });
  };

  const updateMeta = (index: number, value: string) => {
    const updated = [...editedExercise.meta];
    updated[index] = value;
    setEditedExercise({ ...editedExercise, meta: updated });
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(),
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <Pressable onPress={handleCancel} style={styles.cancelButton}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveButton}>
                  <Ionicons name="checkmark" size={20} color="#22C55E" />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Exercise Name */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <Text style={styles.label}>Exercise Name</Text>
          {isEditing ? (
            <TextInput
              value={editedExercise.name}
              onChangeText={(text) =>
                setEditedExercise({ ...editedExercise, name: text })
              }
              style={styles.input}
              placeholder="Enter exercise name"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
            />
          ) : (
            <Text style={styles.title}>{exercise.name}</Text>
          )}
        </Animated.View>

        {/* Target Muscles */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.label}>Target Muscles</Text>
          {isEditing ? (
            <View style={styles.listContainer}>
              {editedExercise.targetMuscle.map((muscle, index) => (
                <View key={index} style={styles.listItem}>
                  <TextInput
                    value={muscle}
                    onChangeText={(text) => updateTargetMuscle(index, text)}
                    style={styles.listInput}
                    placeholder="Enter muscle group"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  />
                  <Pressable
                    onPress={() => removeTargetMuscle(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={16} color="#FCA5A5" />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addTargetMuscle} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Muscle Group</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.tagContainer}>
              {exercise.targetMuscle.map((muscle, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{muscle}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Meta Information */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.label}>Meta Information</Text>
          {isEditing ? (
            <View style={styles.listContainer}>
              {editedExercise.meta.map((meta, index) => (
                <View key={index} style={styles.listItem}>
                  <TextInput
                    value={meta}
                    onChangeText={(text) => updateMeta(index, text)}
                    style={styles.listInput}
                    placeholder="Enter meta info (e.g., Equipment, Difficulty)"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  />
                  <Pressable
                    onPress={() => removeMeta(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={16} color="#FCA5A5" />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addMeta} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Meta Info</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.tagContainer}>
              {exercise.meta.map((meta, index) => (
                <View key={index} style={styles.metaTag}>
                  <Text style={styles.tagText}>{meta}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Delete Button */}
        {onDelete && !isEditing && (
          <View style={styles.deleteSection}>
            <Pressable onPress={handleDeletePress} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Exercise</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Animated.View>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
    padding: 12,
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 50,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  saveButton: {
    backgroundColor: "transparent",
    borderRadius: 50,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
  },
  editButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
    padding: 12,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  deleteSection: {
    marginTop: 32,
    paddingTop: 24,
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FCA5A5",
    fontSize: 16,
    fontWeight: "500",
  },
});
