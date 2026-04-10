import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { SubmissionStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { Portfolio, usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { allPortfolios, refreshAllPortfolios } = usePortfolio();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshAllPortfolios();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAllPortfolios();
    setRefreshing(false);
  };

  const byStatus = {
    pending: allPortfolios?.filter((p) => p?.submissionStatus === "pending_review")?.length ?? 0,
    approved: allPortfolios?.filter((p) => p?.submissionStatus === "approved")?.length ?? 0,
    enrolled: allPortfolios?.filter((p) => p?.submissionStatus === "enrolled")?.length ?? 0,
    revision: allPortfolios?.filter((p) => p?.submissionStatus === "revisions_needed")?.length ?? 0,
  };

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
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Admin Panel</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>Student Submissions</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="refresh-cw" size={18} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={logout}
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="log-out" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Pending", count: byStatus.pending, color: colors.warning, icon: "clock" as const },
            { label: "Approved", count: byStatus.approved, color: colors.success, icon: "check-circle" as const },
            { label: "Revisions", count: byStatus.revision, color: colors.destructive, icon: "alert-circle" as const },
            { label: "Enrolled", count: byStatus.enrolled, color: "#7c3aed", icon: "award" as const },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <Feather name={stat.icon} size={20} color={stat.color} />
              <Text style={[styles.statCount, { color: colors.foreground }]}>{stat.count}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          All Submissions ({(allPortfolios ?? []).length})
        </Text>

        {(!allPortfolios || allPortfolios.length === 0) ? (
          <Card>
            <View style={styles.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No submissions yet</Text>
              <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                Students will appear here once they submit their portfolios.
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.list}>
            {allPortfolios.map((p) => (
              <SubmissionCard key={p.userId} portfolio={p} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SubmissionCard({ portfolio }: { portfolio: Portfolio }) {
  const colors = useColors();
  const uploadedCount = (portfolio.documents ?? []).filter((d) => d.status !== "missing").length;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(admin)/submission", params: { userId: portfolio.userId } })}
      style={({ pressed }) => [
        styles.submissionCard,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: portfolio.submissionStatus === "pending_review" ? colors.warning + "60" : colors.border,
          borderWidth: portfolio.submissionStatus === "pending_review" ? 2 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.submissionRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20", borderRadius: 24 }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {portfolio.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.studentName, { color: colors.foreground }]}>{portfolio.userName}</Text>
          <Text style={[styles.studentEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
            {portfolio.userEmail}
          </Text>
          {portfolio.studentId && (
            <Text style={[styles.studentId, { color: colors.mutedForeground }]}>ID: {portfolio.studentId}</Text>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
      <View style={styles.submissionMeta}>
        <SubmissionStatusBadge status={portfolio.submissionStatus} />
        <Text style={[styles.docCount, { color: colors.mutedForeground }]}>
          {uploadedCount}/4 docs
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22 },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%",
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statCount: { fontFamily: "Inter_700Bold", fontSize: 26 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 24 },
  emptyText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  emptySubText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  list: { gap: 10 },
  submissionCard: { padding: 14, gap: 10 },
  submissionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 18 },
  studentName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  studentEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  studentId: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  submissionMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  docCount: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
