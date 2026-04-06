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
import { Notification, usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";

function NotifItem({ notif }: { notif: Notification }) {
  const colors = useColors();
  const { markNotificationRead } = usePortfolio();

  const iconMap = {
    info: { icon: "info" as const, color: colors.primary, bg: colors.accent },
    success: { icon: "check-circle" as const, color: colors.success, bg: "#dcfce7" },
    warning: { icon: "alert-triangle" as const, color: colors.warning, bg: "#fef3c7" },
    error: { icon: "x-circle" as const, color: colors.destructive, bg: "#fee2e2" },
  };
  const ic = iconMap[notif.type];

  return (
    <Pressable
      onPress={() => markNotificationRead(notif.id)}
      style={({ pressed }) => [
        styles.notifCard,
        {
          backgroundColor: notif.read ? colors.card : colors.secondary,
          borderRadius: colors.radius,
          borderColor: notif.read ? colors.border : colors.primary + "40",
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.notifIcon, { backgroundColor: ic.bg, borderRadius: 10 }]}>
        <Feather name={ic.icon} size={20} color={ic.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, { color: colors.foreground }]}>{notif.title}</Text>
          {!notif.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[styles.notifMsg, { color: colors.mutedForeground }]}>{notif.message}</Text>
        <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { portfolio } = usePortfolio();

  const notifications = [...(portfolio?.notifications ?? [])].reverse();

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
            <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {notifications.filter((n) => !n.read).length} unread
            </Text>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((n) => (
              <NotifItem key={n.id} notif={n} />
            ))}
          </View>
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
  empty: { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  list: { gap: 10 },
  notifCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  notifIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: { flex: 1, gap: 4 },
  notifHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  notifMsg: { fontFamily: "Inter_400Regular", fontSize: 13 },
  notifTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
