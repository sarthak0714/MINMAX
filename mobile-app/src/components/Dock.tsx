import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

export interface DockItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  active?: boolean;
  color?: {
    light: string;
    dark: string;
  };
}

interface DockProps {
  items: DockItem[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Dock({ items }: DockProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.dockContainer}>
        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <DockButton key={index} item={item} />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

function DockButton({ item }: { item: DockItem }) {
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(1, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  // Get border color with opacity
  const getBorderColor = () => {
    if (item.active && item.color) {
      // Convert hex to rgba with 25% opacity
      const hex = item.color.light.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.25)`;
    }
    return "transparent";
  };

  // Get icon color
  const getIconColor = () => {
    if (item.active && item.color) {
      return item.color.dark;
    }
    return "rgba(255, 255, 255, 0.6)";
  };

  // Get shadow for inner glow effect
  const getShadowStyle = () => {
    if (item.active && item.color) {
      const hex = item.color.light.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return {
        shadowColor: `rgba(${r}, ${g}, ${b}, 1)`,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      };
    }
    return {};
  };

  return (
    <AnimatedPressable
      onPress={item.onPress}
      style={[
        styles.button,
        buttonStyle,
        {
          borderColor: getBorderColor(),
          borderWidth: 1,
        },
        getShadowStyle(),
      ]}
    >
      <Ionicons
        name={item.icon}
        size={18}
        color={getIconColor()}
        style={styles.icon}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  dockContainer: {
    backgroundColor: "rgba(20, 20, 30, 0.5)",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
  },
  itemsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  button: {
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    minWidth: 62,
  },
  icon: {
    zIndex: 1,
  },
});
