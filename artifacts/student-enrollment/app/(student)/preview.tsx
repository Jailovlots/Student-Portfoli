import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DocumentStatusBadge, SubmissionStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

export default function PreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { portfolio, submitPortfolio } = usePortfolio();
  const [submitting, setSubmitting] = useState(false);

  if (!portfolio) return null;

  const allUploaded = portfolio.documents.every((d) => d.status !== "missing");
  const alreadySubmitted = portfolio.submissionStatus !== "draft" && portfolio.submissionStatus !== "revisions_needed";

  const handleSubmit = () => {
    if (!allUploaded) {
      Alert.alert("Missing Documents", "Please upload all required documents before submitting.");
      return;
    }
    Alert.alert(
      "Submit Portfolio",
      "Once submitted, your portfolio will be sent to the admin for review. Are you ready?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setSubmitting(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await submitPortfolio();
            setSubmitting(false);
            router.push("/(student)/status" as any);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Preview Submission</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Review before final submission
            </Text>
          </View>
        </View>

        {/* Student Info */}
        <Card elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Student Information</Text>
          <View style={styles.infoRows}>
            <View style={styles.infoRow}>
              <Feather name="user" size={15} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Name</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.name}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Feather name="mail" size={15} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.email}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Feather name="credit-card" size={15} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Student ID</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.studentId ?? "N/A"}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Feather name="activity" size={15} color={colors.mutedForeground} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Status</Text>
              <SubmissionStatusBadge status={portfolio.submissionStatus} />
            </View>
          </View>
        </Card>

        {/* Documents Summary */}
        <Card elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Documents Summary</Text>
          <View style={styles.docList}>
            {portfolio.documents.map((doc, i) => (
              <View key={doc.type}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.docRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.docTitle, { color: colors.foreground }]}>{doc.label}</Text>
                    {doc.fileName && (
                      <Text style={[styles.docFile, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {doc.fileName}
                      </Text>
                    )}
                  </View>
                  <DocumentStatusBadge status={doc.status} />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {!allUploaded && !alreadySubmitted && (
          <View style={[styles.warningBox, { backgroundColor: "#fef3c7", borderRadius: colors.radius, borderColor: colors.warning }]}>
            <Feather name="alert-triangle" size={18} color={colors.warning} />
            <Text style={[styles.warningText, { color: "#78350f" }]}>
              Some documents are missing. Upload all documents before submitting.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {!alreadySubmitted && (
        <View style={[
          styles.submitBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
          }
        ]}>
          <Button
            title={allUploaded ? "Submit Portfolio" : "Upload Missing Documents First"}
            onPress={allUploaded ? handleSubmit : () => router.push("/(student)/upload" as any)}
            variant={allUploaded ? "primary" : "outline"}
            loading={submitting}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 14 },
  infoRows: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 13, width: 70 },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  divider: { height: 1 },
  docList: { gap: 0 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  docTitle: { fontFamily: "Inter_500Medium", fontSize: 13 },
  docFile: { fontFamily: "Inter_400Regular", fontSize: 12 },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderWidth: 1.5,
    alignItems: "flex-start",
  },
  warningText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  submitBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
