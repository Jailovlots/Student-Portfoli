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
import { DocumentStatusBadge, SubmissionStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { key: "draft", label: "Portfolio Started", icon: "edit-3" as const },
  { key: "pending_review", label: "Submitted for Review", icon: "send" as const },
  { key: "approved", label: "Documents Approved", icon: "check-circle" as const },
  { key: "enrolled", label: "Enrollment Confirmed", icon: "award" as const },
];

const STEP_ORDER = ["draft", "pending_review", "approved", "revisions_needed", "enrolled"];

export default function StatusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { portfolio } = usePortfolio();

  if (!portfolio) return null;

  const currentIdx = STEP_ORDER.indexOf(portfolio.submissionStatus);
  const isEnrolled = portfolio.submissionStatus === "enrolled";
  const isRevision = portfolio.submissionStatus === "revisions_needed";

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
            <Text style={[styles.title, { color: colors.foreground }]}>Application Status</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Track your enrollment progress
            </Text>
          </View>
        </View>

        {isEnrolled && (
          <View style={[styles.enrolledBanner, { backgroundColor: "#7c3aed", borderRadius: colors.radius * 1.5 }]}>
            <Feather name="award" size={40} color="#fff" />
            <Text style={styles.enrolledTitle}>Congratulations!</Text>
            <Text style={styles.enrolledSub}>You are now officially admitted.</Text>
            <Text style={[styles.enrolledSub, { opacity: 0.8, marginTop: 4 }]}>Student is Admitted</Text>
          </View>
        )}

        {/* Current Status */}
        <Card elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Current Status</Text>
          <SubmissionStatusBadge status={portfolio.submissionStatus} large />
          {portfolio.submittedAt && (
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              Submitted: {new Date(portfolio.submittedAt).toLocaleDateString()}
            </Text>
          )}
          {portfolio.reviewedAt && (
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              Reviewed: {new Date(portfolio.reviewedAt).toLocaleDateString()}
            </Text>
          )}
          {portfolio.adminNote && (
            <View style={[styles.adminNote, { backgroundColor: isRevision ? "#fef3c7" : colors.muted, borderRadius: 8 }]}>
              <Feather name="message-circle" size={14} color={isRevision ? "#92400e" : colors.mutedForeground} />
              <Text style={[styles.adminNoteText, { color: isRevision ? "#78350f" : colors.mutedForeground }]}>
                {portfolio.adminNote}
              </Text>
            </View>
          )}
        </Card>

        {/* Stepper */}
        <Card elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Progress Timeline</Text>
          <View style={styles.stepper}>
            {STEPS.map((step, i) => {
              const stepIdx = STEP_ORDER.indexOf(step.key);
              const isDone = currentIdx >= stepIdx && !isRevision;
              const isCurrent = step.key === portfolio.submissionStatus;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: isDone ? colors.primary : isCurrent ? colors.primary : colors.muted,
                          borderColor: isDone || isCurrent ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {isDone ? (
                        <Feather name="check" size={12} color="#fff" />
                      ) : (
                        <Feather name={step.icon} size={12} color={isCurrent ? "#fff" : colors.mutedForeground} />
                      )}
                    </View>
                    {i < STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          { backgroundColor: isDone ? colors.primary : colors.muted },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.stepLabel, { color: isDone || isCurrent ? colors.foreground : colors.mutedForeground }]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Document Status */}
        <Card elevated>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Document Status</Text>
          <View style={styles.docList}>
            {portfolio.documents.map((doc, i) => (
              <View key={doc.type}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.docRow}>
                  <Text style={[styles.docLabel, { color: colors.foreground }]}>{doc.label}</Text>
                  <DocumentStatusBadge status={doc.status} />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {isRevision && (
          <Button
            title="Re-upload Documents"
            onPress={() => router.push("/(student)/upload" as any)}
            variant="primary"
            fullWidth
          />
        )}
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
  enrolledBanner: {
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  enrolledTitle: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 22 },
  enrolledSub: { color: "rgba(255,255,255,0.9)", fontFamily: "Inter_400Regular", fontSize: 14 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 14 },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 8 },
  adminNote: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    marginTop: 12,
    alignItems: "flex-start",
  },
  adminNoteText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  stepper: { gap: 0 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 50 },
  stepLeft: { alignItems: "center", width: 28 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  stepLine: { flex: 1, width: 2, minHeight: 20, marginTop: 2 },
  stepLabel: { fontFamily: "Inter_500Medium", fontSize: 14, paddingTop: 4, flex: 1 },
  docList: { gap: 0 },
  docRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  docLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  divider: { height: 1 },
});
