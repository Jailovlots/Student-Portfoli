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
import { ProgressTracker } from "@/components/ProgressTracker";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { portfolio } = usePortfolio();

  if (!portfolio) return null;

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
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Upload Documents</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Upload all required enrollment documents
            </Text>
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <ProgressTracker documents={portfolio.documents} />
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Required Documents</Text>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Accepted formats: PDF, JPG, PNG (max 10MB)
          </Text>
        </View>

        <View style={styles.docList}>
          {portfolio.documents.map((doc) => (
            <DocumentCard key={doc.type} document={doc} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  backBtn: { marginTop: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  progressCard: { padding: 16, borderWidth: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  note: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  docList: { gap: 12 },
});
