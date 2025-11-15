import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "./src/lib/auth";
import AuthScreen from "./src/screens/AuthScreen";
import WorkoutsScreen from "./src/screens/WorkoutsScreen";
import ExercisesScreen from "./src/screens/ExercisesScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import BackgroundGradient from "./src/components/BackgroundGradient";
import Dock, { DockItem } from "./src/components/Dock";

const queryClient = new QueryClient();

type Screen = "Today" | "Exercises" | "Progress";

// Color mapping for each tab
const TAB_COLORS: Record<Screen, string> = {
  Today: "#ff6b9d",
  Exercises: "#ffcc00",
  Progress: "#00ff48",
};

const TAB_COLORS_DARK: Record<Screen, string> = {
  Today: "#ff4d87",
  Exercises: "#ff9500",
  Progress: "#00cc3e",
};

function MainNavigator() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Today");
  const [activeColor, setActiveColor] = useState(TAB_COLORS.Today);

  const handleScreenChange = (screen: Screen) => {
    setActiveScreen(screen);
    setActiveColor(TAB_COLORS[screen]);
  };

  const dockItems: DockItem[] = [
    {
      label: "Today",
      icon: "today",
      active: activeScreen === "Today",
      onPress: () => handleScreenChange("Today"),
      color: {
        light: TAB_COLORS.Today,
        dark: TAB_COLORS_DARK.Today,
      },
    },
    {
      label: "Exercises",
      icon: "barbell",
      active: activeScreen === "Exercises",
      onPress: () => handleScreenChange("Exercises"),
      color: {
        light: TAB_COLORS.Exercises,
        dark: TAB_COLORS_DARK.Exercises,
      },
    },
    {
      label: "Progress",
      icon: "analytics",
      active: activeScreen === "Progress",
      onPress: () => handleScreenChange("Progress"),
      color: {
        light: TAB_COLORS.Progress,
        dark: TAB_COLORS_DARK.Progress,
      },
    },
  ];

  const renderScreen = () => {
    switch (activeScreen) {
      case "Today":
        return <WorkoutsScreen />;
      case "Exercises":
        return <ExercisesScreen />;
      case "Progress":
        return <ProgressScreen />;
      default:
        return <WorkoutsScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Background Gradient - fades to black at bottom 2/3 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BackgroundGradient color={activeColor} keyId={activeScreen} />
      </View>

      {/* Screen Content */}
      <View style={{ flex: 1 }}>{renderScreen()}</View>

      {/* Custom Dock */}
      <Dock items={dockItems} />
    </View>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await auth.isAuthenticated();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthScreen onAuthenticated={handleAuthenticated} />
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <MainNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
});
