import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { DocumentStatus, SubmissionStatus } from "@/context/PortfolioContext";

interface DocBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocBadgeProps) {
  const colors = useColors();

  const config = {
    missing: { label: "Missing", color: colors.mutedForeground, bg: colors.muted, icon: "x-circle" as const },
    uploaded: { label: "Uploaded", color: colors.primary, bg: colors.accent, icon: "upload" as const },
    approved: { label: "Approved", color: colors.success, bg: "#dcfce7", icon: "check-circle" as const },
    revision_needed: { label: "Revision Needed", color: colors.warning, bg: "#fef3c7", icon: "alert-circle" as const },
  };

  const c = config[status];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Feather name={c.icon} size={12} color={c.color} />
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

interface SubBadgeProps {
  status: SubmissionStatus;
  large?: boolean;
}

export function SubmissionStatusBadge({ status, large = false }: SubBadgeProps) {
  const colors = useColors();

  const config = {
    draft: { label: "Draft", color: colors.mutedForeground, bg: colors.muted, icon: "edit-3" as const },
    pending_review: { label: "Pending Review", color: colors.warning, bg: "#fef3c7", icon: "clock" as const },
    approved: { label: "Approved", color: colors.success, bg: "#dcfce7", icon: "check-circle" as const },
    revisions_needed: { label: "Revisions Needed", color: "#dc2626", bg: "#fee2e2", icon: "alert-circle" as const },
    enrolled: { label: "Enrolled", color: "#7c3aed", bg: "#ede9fe", icon: "award" as const },
  };

  const c = config[status];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, large && styles.large]}>
      <Feather name={c.icon} size={large ? 16 : 12} color={c.color} />
      <Text style={[styles.label, { color: c.color }, large && styles.largeText]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  large: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  largeText: {
    fontSize: 14,
  },
});
