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
import { ProgressTracker } from "@/components/ProgressTracker";
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { portfolio } = usePortfolio();

  const unread = portfolio?.notifications.filter((n) => !n.read).length ?? 0;

  const actions = [
    { label: "Upload Documents", icon: "upload-cloud" as const, route: "/(student)/upload" as const, color: colors.primary },
    { label: "Review Portfolio", icon: "edit-3" as const, route: "/(student)/review" as const, color: "#7c3aed" },
    { label: "Preview & Submit", icon: "send" as const, route: "/(student)/preview" as const, color: "#059669" },
    { label: "Track Status", icon: "activity" as const, route: "/(student)/status" as const, color: "#dc2626" },
  ];

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
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good day,</Text>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {user?.name}
            </Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => router.push("/(student)/notifications")}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="bell" size={20} color={colors.foreground} />
              {unread > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.badgeText}>{unread}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="log-out" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Status Card */}
        {portfolio && (
          <Card style={[styles.statusCard, { backgroundColor: colors.navy }]} elevated>
            <Text style={[styles.statusLabel, { color: "rgba(255,255,255,0.7)" }]}>Enrollment Status</Text>
            <View style={{ marginVertical: 8 }}>
              <SubmissionStatusBadge status={portfolio.submissionStatus} large />
            </View>
            {portfolio.studentId && (
              <Text style={[styles.studentId, { color: "rgba(255,255,255,0.6)" }]}>
                ID: {user?.studentId}
              </Text>
            )}
          </Card>
        )}

        {/* Progress */}
        {portfolio && (
          <Card style={styles.progressCard} elevated>
            <ProgressTracker documents={portfolio.documents} />
          </Card>
        )}

        {/* Admin Note */}
        {portfolio?.adminNote && portfolio.submissionStatus === "revisions_needed" && (
          <View style={[styles.revisionBanner, { backgroundColor: "#fef3c7", borderRadius: colors.radius, borderColor: "#f59e0b" }]}>
            <Feather name="alert-triangle" size={18} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.revisionTitle, { color: "#92400e" }]}>Action Required</Text>
              <Text style={[styles.revisionNote, { color: "#78350f" }]}>{portfolio.adminNote}</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as any)}
                style={({ pressed }) => [
                  styles.actionTile,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + "18", borderRadius: 12 }]}>
                  <Feather name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Documents Summary */}
        {portfolio && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents</Text>
            <View style={styles.docSummary}>
              {portfolio.documents.map((doc) => (
                <View
                  key={doc.type}
                  style={[
                    styles.docRow,
                    {
                      backgroundColor: colors.card,
                      borderRadius: colors.radius,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={doc.status !== "missing" ? "check-circle" : "circle"}
                    size={18}
                    color={doc.status === "approved" ? colors.success : doc.status !== "missing" ? colors.primary : colors.border}
                  />
                  <Text style={[styles.docLabel, { color: colors.foreground }]}>{doc.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, maxWidth: 200 },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  statusCard: {
    padding: 20,
    gap: 4,
  },
  statusLabel: { fontFamily: "Inter_500Medium", fontSize: 12, letterSpacing: 0.5 },
  studentId: { fontFamily: "Inter_400Regular", fontSize: 12 },
  progressCard: {},
  revisionBanner: {
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderWidth: 1.5,
  },
  revisionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  revisionNote: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionTile: {
    width: "47%",
    padding: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: "flex-start",
  },
  actionIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  docSummary: { gap: 8 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
  },
  docLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
