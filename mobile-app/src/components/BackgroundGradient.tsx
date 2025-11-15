import React, { useMemo } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface BackgroundGradientProps {
  color: string;
  keyId: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BackgroundGradient({
  color,
  keyId,
}: BackgroundGradientProps) {
  // Random offset per change for natural glow variation
  const { x, y } = useMemo(() => {
    const xOffset = 40 + Math.random() * 20; // 40–60%
    const yOffset = 50 + Math.random() * 15; // 50–65%
    return { x: xOffset, y: yOffset };
  }, [keyId]);

  // Convert hex color to rgba with different opacity levels
  const getColorWithOpacity = (hexColor: string, opacity: number) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const gradientColors: [string, string, string, string] = [
    getColorWithOpacity(color, 0.7),
    getColorWithOpacity(color, 0.4),
    getColorWithOpacity(color, 0.1),
    "rgba(0, 0, 0, 1)",
  ];

  return (
    <Animated.View
      key={keyId}
      entering={FadeIn.duration(1200)}
      style={styles.container}
      pointerEvents="none"
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        locations={[0, 0.2, 0.4, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
