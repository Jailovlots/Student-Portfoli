import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { DocumentItem, DocumentType } from "@/context/PortfolioContext";
import { DocumentStatusBadge } from "./StatusBadge";
import { usePortfolio } from "@/context/PortfolioContext";

interface Props {
  document: DocumentItem;
  readonly?: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function DocumentCard({ document, readonly = false }: Props) {
  const colors = useColors();
  const { uploadDocument, removeDocument } = usePortfolio();
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    if (readonly) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await uploadDocument(
        document.type as DocumentType,
        asset.uri,
        asset.name,
        asset.size ?? 0,
        asset.mimeType ?? "application/octet-stream"
      );
    } catch {
      Alert.alert("Upload Failed", "Could not upload the document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert("Remove Document", "Are you sure you want to remove this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await removeDocument(document.type as DocumentType);
        },
      },
    ]);
  };

  const hasFile = document.status !== "missing";
  const isRevision = document.status === "revision_needed";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: isRevision ? colors.warning : hasFile ? colors.border : colors.border,
          borderWidth: isRevision ? 2 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: hasFile ? colors.accent : colors.muted,
              borderRadius: colors.radius - 4,
            },
          ]}
        >
          <Feather
            name={hasFile ? "file-text" : "file-plus"}
            size={22}
            color={hasFile ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>{document.label}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
            {document.description}
          </Text>
          <View style={styles.metaRow}>
            <DocumentStatusBadge status={document.status} />
            {document.fileSize !== undefined && document.fileSize > 0 && (
              <Text style={[styles.size, { color: colors.mutedForeground }]}>
                {formatBytes(document.fileSize)}
              </Text>
            )}
          </View>
        </View>
        {!readonly && (
          <View style={styles.actions}>
            <Pressable
              onPress={handlePick}
              disabled={uploading}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.accent, borderRadius: 8, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name={hasFile ? "refresh-cw" : "upload"} size={16} color={colors.primary} />
              )}
            </Pressable>
            {hasFile && (
              <Pressable
                onPress={handleRemove}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: "#fee2e2", borderRadius: 8, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </Pressable>
            )}
          </View>
        )}
      </View>
      {document.adminNote && (
        <View style={[styles.noteBox, { backgroundColor: isRevision ? "#fef3c7" : colors.muted, borderRadius: 8 }]}>
          <Feather name="message-square" size={13} color={isRevision ? colors.warning : colors.mutedForeground} />
          <Text style={[styles.noteText, { color: isRevision ? "#92400e" : colors.mutedForeground }]}>
            {document.adminNote}
          </Text>
        </View>
      )}
      {document.uploadedAt && (
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  size: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  actionBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  noteBox: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    alignItems: "flex-start",
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
});
