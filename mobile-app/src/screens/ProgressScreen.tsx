import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

export default function ProgressScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Progress</Text>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Volume</Text>
          <Text style={styles.statValue}>0 kg</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Workouts This Week</Text>
          <Text style={styles.statValue}>0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volume Trends</Text>
          <Text style={styles.emptyText}>Chart coming soon</Text>
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
  statCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
  },
});
