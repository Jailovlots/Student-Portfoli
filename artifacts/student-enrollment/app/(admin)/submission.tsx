import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DocumentStatusBadge, SubmissionStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DocumentStatus,
  DocumentType,
  Portfolio,
  SubmissionStatus,
  usePortfolio,
} from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PORTFOLIO_PREFIX = "portfolio_";

export default function SubmissionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { adminUpdateDocument, adminUpdateSubmission, refreshAllPortfolios } = usePortfolio();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + userId);
      if (raw) {
        const p: Portfolio = JSON.parse(raw);
        setPortfolio(p);
        setAdminNote(p.adminNote ?? "");
      }
    })();
  }, [userId]);

  if (!portfolio) return null;

  const handleDocStatus = async (type: DocumentType, status: DocumentStatus, note?: string) => {
    await adminUpdateDocument(userId, type, status, note);
    const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + userId);
    if (raw) setPortfolio(JSON.parse(raw));
  };

  const handleSubmissionStatus = async (status: SubmissionStatus) => {
    setUpdating(true);
    await adminUpdateSubmission(userId, status, adminNote || undefined);
    await refreshAllPortfolios();
    const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + userId);
    if (raw) setPortfolio(JSON.parse(raw));
    setUpdating(false);
    Alert.alert("Updated", `Status updated to ${status.replace(/_/g, " ")}.`);
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>{portfolio.userName}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{portfolio.userEmail}</Text>
          </View>
        </View>

        {/* Student Info */}
        <Card elevated>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Student ID</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{portfolio.studentId ?? "N/A"}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Status</Text>
            <SubmissionStatusBadge status={portfolio.submissionStatus} />
          </View>
          {portfolio.submittedAt && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Submitted</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {new Date(portfolio.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Documents */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents</Text>
        {portfolio.documents.map((doc) => (
          <Card key={doc.type} elevated style={{ gap: 12 }}>
            <View style={styles.docHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.docTitle, { color: colors.foreground }]}>{doc.label}</Text>
                {doc.fileName && (
                  <Text style={[styles.docFile, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                )}
              </View>
              <DocumentStatusBadge status={doc.status} />
            </View>
            {doc.status !== "missing" && (
              <View style={styles.docActions}>
                <Pressable
                  onPress={() => handleDocStatus(doc.type as DocumentType, "approved", undefined)}
                  style={({ pressed }) => [
                    styles.docActionBtn,
                    { backgroundColor: "#dcfce7", borderRadius: 8, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="check" size={14} color="#16a34a" />
                  <Text style={[styles.docActionText, { color: "#16a34a" }]}>Approve</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.prompt("Revision Note", "Enter feedback for the student:", (note) => {
                      handleDocStatus(doc.type as DocumentType, "revision_needed", note || undefined);
                    });
                  }}
                  style={({ pressed }) => [
                    styles.docActionBtn,
                    { backgroundColor: "#fef3c7", borderRadius: 8, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="alert-circle" size={14} color="#d97706" />
                  <Text style={[styles.docActionText, { color: "#d97706" }]}>Needs Revision</Text>
                </Pressable>
              </View>
            )}
          </Card>
        ))}

        {/* Admin Note */}
        <Card elevated>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Admin Note</Text>
          <View style={[styles.noteInput, { borderColor: colors.border, borderRadius: 8, backgroundColor: colors.muted }]}>
            <TextInput
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="Add feedback or notes for the student..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[styles.noteText, { color: colors.foreground }]}
            />
          </View>
        </Card>

        {/* Submission Actions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Update Status</Text>
        <View style={styles.actionButtons}>
          <Button
            title="Approve Portfolio"
            onPress={() => handleSubmissionStatus("approved")}
            variant="primary"
            loading={updating}
            fullWidth
          />
          <Button
            title="Request Revisions"
            onPress={() => handleSubmissionStatus("revisions_needed")}
            variant="outline"
            loading={updating}
            fullWidth
          />
          <Button
            title="Mark as Enrolled"
            onPress={() => handleSubmissionStatus("enrolled")}
            variant="secondary"
            loading={updating}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 13 },
  divider: { height: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  docHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  docTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  docFile: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  docActions: { flexDirection: "row", gap: 8 },
  docActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  docActionText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  noteInput: {
    padding: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlignVertical: "top" },
  actionButtons: { gap: 10 },
});
