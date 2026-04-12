import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/(auth)/login");
      } else if (user.role === "admin") {
        router.replace("/(admin)/admin");
      } else {
        router.replace("/(student)/dashboard");
      }
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
