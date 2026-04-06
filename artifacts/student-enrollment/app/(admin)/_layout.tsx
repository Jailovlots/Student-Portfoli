import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function AdminLayout() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="admin" />
      <Stack.Screen name="submission" />
    </Stack>
  );
}
