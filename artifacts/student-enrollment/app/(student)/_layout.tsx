import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function StudentLayout() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="review" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="status" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
