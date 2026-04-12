import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || "Login failed.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Text style={styles.logoText}>EP</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in to your enrollment portfolio
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: colors.card, borderRadius: colors.radius * 1.5, borderColor: colors.border }]}>
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail"
              placeholder="student@school.edu"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock"
              placeholder="••••••••"
            />
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#fee2e2", borderRadius: 8 }]}>
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}
            <Button title="Sign In" onPress={handleLogin} loading={loading} fullWidth />
          </View>

          {/* Admin hint removed for security */}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.link, { color: colors.primary }]}>Create Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoText: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: {
    padding: 24,
    gap: 16,
    borderWidth: 1,
  },
  errorBox: {
    padding: 12,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  hint: { alignItems: "center" },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  link: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
