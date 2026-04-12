import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Pressable, Animated, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useToast, ToastType, ToastInfo } from "@/context/ToastContext";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOAST_ICON = {
  success: "check-circle",
  error: "alert-circle",
  info: "info",
} as const;

function ToastItem({ toast }: { toast: ToastInfo }) {
  const colors = useColors();
  const { hideToast } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const getStatusColor = () => {
    switch (toast.type) {
      case "success": return colors.primary;
      case "error": return colors.destructive;
      case "info": return colors.mutedForeground;
      default: return colors.foreground;
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // The ToastContext handles the auto-dismiss via hideToast(id) which
    // unmounts this component. For a smoother exit, we rely on the
    // context unmounting, though standard Animated doesn't have a 
    // built-in "exit" animation like Reanimated or Framer Motion
    // without more complexity. For reliability, we stick to mount animation.
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.accent }]}>
        <Feather name={TOAST_ICON[toast.type]} size={18} color={getStatusColor()} />
      </View>
      <Text style={[styles.message, { color: colors.foreground }]}>{toast.message}</Text>
      <Pressable onPress={() => hideToast(toast.id)} style={styles.closeBtn}>
        <Feather name="x" size={14} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
  },
});
