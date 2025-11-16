import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorMessage}>{message}</Text>
    </View>
  );
}

interface InsightCardProps {
  type?: string;
  title: string;
  message: string;
}

export function InsightCard({ title, message }: InsightCardProps) {
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightMessage}>{message}</Text>
    </View>
  );
}

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.spinner} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#f87171",
    fontWeight: "600",
    marginBottom: 4,
    fontSize: 14,
  },
  errorMessage: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
  },
  insightCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
  },
  insightTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    fontSize: 14,
  },
  insightMessage: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderTopColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 12,
  },
});
