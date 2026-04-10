import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { customFetch, setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// In development, the API is served on localhost:5000
// For production, this should be the production URL
setBaseUrl("http://localhost:5000");

setAuthTokenGetter(async () => {
  return await AsyncStorage.getItem("auth_token");
});

export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, studentId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "enrolled_session";
const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        if (session && session !== "undefined" && session !== "null") {
          try {
            setUser(JSON.parse(session));
          } catch (e) {
            console.error("Failed to parse session", e);
            await AsyncStorage.removeItem(SESSION_KEY);
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await customFetch<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.token) await AsyncStorage.setItem(TOKEN_KEY, res.token);
    if (res.user) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
    setUser(res.user);
    router.replace("/");
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, studentId: string) => {
    const res = await customFetch<{ user: User; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, studentId }),
    });

    if (res.token) await AsyncStorage.setItem(TOKEN_KEY, res.token);
    if (res.user) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
    setUser(res.user);
    router.replace("/");
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    router.replace("/(auth)/login");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
