import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

const USERS_KEY = "enrolled_users";
const SESSION_KEY = "enrolled_session";

const DEFAULT_ADMIN: User = {
  id: "admin-001",
  name: "Admin User",
  email: "admin@school.edu",
  role: "admin",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        if (session) {
          setUser(JSON.parse(session));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (email === "admin@school.edu" && password === "admin123") {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(DEFAULT_ADMIN));
      setUser(DEFAULT_ADMIN);
      return;
    }
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users: Array<User & { password: string }> = raw ? JSON.parse(raw) : [];
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password.");
    const { password: _p, ...userWithoutPw } = found;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPw));
    setUser(userWithoutPw);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, studentId: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users: Array<User & { password: string }> = raw ? JSON.parse(raw) : [];
    if (users.find((u) => u.email === email)) throw new Error("Email already registered.");
    const newUser: User & { password: string } = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: "student",
      studentId,
      password,
    };
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password: _p, ...userWithoutPw } = newUser;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPw));
    setUser(userWithoutPw);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
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
