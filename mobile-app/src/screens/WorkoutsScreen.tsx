import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function WorkoutsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Today's Workout</Text>
        <View style={styles.card}>
          <Text style={styles.emptyText}>No workout yet today</Text>
          <Text style={styles.emptySubtext}>Tap + to add exercises</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 16,
  },
  emptySubtext: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
  },
});
