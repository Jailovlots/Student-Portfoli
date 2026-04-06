import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: colors.primary, text: colors.primaryForeground, border: colors.primary };
      case "secondary":
        return { bg: colors.secondary, text: colors.secondaryForeground, border: colors.secondary };
      case "outline":
        return { bg: "transparent", text: colors.primary, border: colors.primary };
      case "destructive":
        return { bg: colors.destructive, text: colors.destructiveForeground, border: colors.destructive };
      case "ghost":
        return { bg: "transparent", text: colors.mutedForeground, border: "transparent" };
    }
  };

  const getSizes = () => {
    switch (size) {
      case "sm":
        return { height: 36, px: 12, fontSize: 13 };
      case "md":
        return { height: 48, px: 20, fontSize: 15 };
      case "lg":
        return { height: 56, px: 24, fontSize: 16 };
    }
  };

  const c = getColors();
  const s = getSizes();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: colors.radius,
          opacity: pressed ? 0.8 : disabled || loading ? 0.5 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: c.text, fontSize: s.fontSize }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
  },
});
