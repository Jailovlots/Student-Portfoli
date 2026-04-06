import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { DocumentItem } from "@/context/PortfolioContext";

interface Props {
  documents: DocumentItem[];
}

export function ProgressTracker({ documents }: Props) {
  const colors = useColors();
  const uploaded = documents.filter((d) => d.status !== "missing").length;
  const total = documents.length;
  const percent = Math.round((uploaded / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.foreground }]}>Portfolio Progress</Text>
        <Text style={[styles.percent, { color: colors.primary }]}>{percent}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: percent === 100 ? colors.success : colors.primary,
              width: `${percent}%` as any,
              borderRadius: 4,
            },
          ]}
        />
      </View>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        {uploaded} of {total} documents uploaded
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  percent: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
