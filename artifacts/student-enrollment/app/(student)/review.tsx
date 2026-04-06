import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DocumentCard } from "@/components/DocumentCard";
import { Button } from "@/components/ui/Button";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { portfolio } = usePortfolio();

  if (!portfolio) return null;

  const missingCount = portfolio.documents.filter((d) => d.status === "missing").length;
  const revisionCount = portfolio.documents.filter((d) => d.status === "revision_needed").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Review & Edit</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Review your uploaded documents
            </Text>
          </View>
        </View>

        {(missingCount > 0 || revisionCount > 0) && (
          <View style={[styles.alertBox, {
            backgroundColor: revisionCount > 0 ? "#fef3c7" : "#f0f9ff",
            borderColor: revisionCount > 0 ? colors.warning : colors.primary,
            borderRadius: colors.radius,
          }]}>
            <Feather
              name={revisionCount > 0 ? "alert-triangle" : "info"}
              size={18}
              color={revisionCount > 0 ? colors.warning : colors.primary}
            />
            <Text style={[styles.alertText, { color: revisionCount > 0 ? "#78350f" : "#1e40af" }]}>
              {revisionCount > 0
                ? `${revisionCount} document(s) need revision. Please re-upload them.`
                : `${missingCount} document(s) are still missing.`}
            </Text>
          </View>
        )}

        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Documents</Text>
        </View>

        <View style={styles.docList}>
          {portfolio.documents.map((doc) => (
            <DocumentCard key={doc.type} document={doc} />
          ))}
        </View>

        <Button
          title="Upload / Replace Documents"
          onPress={() => router.push("/(student)/upload" as any)}
          variant="outline"
          fullWidth
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  alertBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderWidth: 1.5,
    alignItems: "flex-start",
  },
  alertText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  docList: { gap: 12 },
});
