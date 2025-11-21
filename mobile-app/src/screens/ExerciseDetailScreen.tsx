import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { Exercise } from "../lib/api";

// Predefined muscle types
const MUSCLE_TYPES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Obliques",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Traps",
  "Lats",
];

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
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(exercise.name === "New Exercise");
  const [editedExercise, setEditedExercise] = useState<Exercise>(exercise);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMuscleIndex, setSelectedMuscleIndex] = useState<number | null>(null);

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
      targetMuscle: [...editedExercise.targetMuscle, MUSCLE_TYPES[0]],
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
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.container, { paddingTop: insets.top }]}
    >
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
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveButton}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
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
                  <TouchableOpacity
                    style={styles.customPicker}
                    onPress={() => {
                      setSelectedMuscleIndex(index);
                      setDropdownVisible(true);
                    }}
                  >
                    <Text style={styles.customPickerText}>{muscle}</Text>
                    <Ionicons name="chevron-down" size={20} color="#10b981" />
                  </TouchableOpacity>
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

      {/* Custom Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Muscle Group</Text>
            <FlatList
              data={MUSCLE_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (selectedMuscleIndex !== null) {
                      updateTargetMuscle(selectedMuscleIndex, item);
                    }
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                  {selectedMuscleIndex !== null &&
                    editedExercise.targetMuscle[selectedMuscleIndex] === item && (
                      <Ionicons name="checkmark" size={20} color="#10b981" />
                    )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  saveButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
    padding: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  editButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 100,
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 100,
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 100,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    height: 48,
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
    paddingHorizontal: 12,
  },
  removeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 100,
    padding: 12,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 100,
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
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 100,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FCA5A5",
    fontSize: 16,
    fontWeight: "500",
  },
  customPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    height: 48,
  },
  customPickerText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  dropdownTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
