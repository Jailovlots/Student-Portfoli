import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type DocumentType = "birth_certificate" | "good_moral" | "psa" | "tor";
export type DocumentStatus = "missing" | "uploaded" | "approved" | "revision_needed";
export type SubmissionStatus = "draft" | "pending_review" | "approved" | "revisions_needed" | "enrolled";

export interface DocumentItem {
  type: DocumentType;
  label: string;
  description: string;
  uri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  status: DocumentStatus;
  adminNote?: string;
}

export interface Portfolio {
  userId: string;
  userName: string;
  userEmail: string;
  studentId?: string;
  documents: DocumentItem[];
  submissionStatus: SubmissionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  adminNote?: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "info" | "success" | "warning" | "error";
}

const DOCUMENT_TEMPLATES: Omit<DocumentItem, "status">[] = [
  {
    type: "birth_certificate",
    label: "Birth Certificate",
    description: "Official PSA-issued birth certificate",
  },
  {
    type: "good_moral",
    label: "Good Moral Certificate",
    description: "Certificate of good moral character from previous school",
  },
  {
    type: "psa",
    label: "PSA Document",
    description: "Philippine Statistics Authority issued document",
  },
  {
    type: "tor",
    label: "Transcript of Records",
    description: "Official academic transcript from previous institution",
  },
];

interface PortfolioContextValue {
  portfolio: Portfolio | null;
  allPortfolios: Portfolio[];
  uploadDocument: (type: DocumentType, uri: string, fileName: string, fileSize: number, mimeType: string) => Promise<void>;
  removeDocument: (type: DocumentType) => Promise<void>;
  submitPortfolio: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  adminUpdateDocument: (userId: string, type: DocumentType, status: DocumentStatus, note?: string) => Promise<void>;
  adminUpdateSubmission: (userId: string, status: SubmissionStatus, note?: string) => Promise<void>;
  refreshAllPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const PORTFOLIO_PREFIX = "portfolio_";
const ALL_USER_IDS_KEY = "all_portfolio_user_ids";

function makeEmptyPortfolio(user: { id: string; name: string; email: string; studentId?: string }): Portfolio {
  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    studentId: user.studentId,
    documents: DOCUMENT_TEMPLATES.map((d) => ({ ...d, status: "missing" })),
    submissionStatus: "draft",
    notifications: [],
  };
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [allPortfolios, setAllPortfolios] = useState<Portfolio[]>([]);

  const loadPortfolio = useCallback(async (userId: string, name: string, email: string, studentId?: string) => {
    const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + userId);
    if (raw) {
      setPortfolio(JSON.parse(raw));
    } else {
      const fresh = makeEmptyPortfolio({ id: userId, name, email, studentId });
      await AsyncStorage.setItem(PORTFOLIO_PREFIX + userId, JSON.stringify(fresh));
      setPortfolio(fresh);
      const idsRaw = await AsyncStorage.getItem(ALL_USER_IDS_KEY);
      const ids: string[] = idsRaw ? JSON.parse(idsRaw) : [];
      if (!ids.includes(userId)) {
        ids.push(userId);
        await AsyncStorage.setItem(ALL_USER_IDS_KEY, JSON.stringify(ids));
      }
    }
  }, []);

  const refreshAllPortfolios = useCallback(async () => {
    const idsRaw = await AsyncStorage.getItem(ALL_USER_IDS_KEY);
    const ids: string[] = idsRaw ? JSON.parse(idsRaw) : [];
    const portfolios: Portfolio[] = [];
    for (const id of ids) {
      const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + id);
      if (raw) portfolios.push(JSON.parse(raw));
    }
    setAllPortfolios(portfolios);
  }, []);

  useEffect(() => {
    if (user && user.role === "student") {
      loadPortfolio(user.id, user.name, user.email, user.studentId);
    } else if (user && user.role === "admin") {
      refreshAllPortfolios();
    } else {
      setPortfolio(null);
      setAllPortfolios([]);
    }
  }, [user, loadPortfolio, refreshAllPortfolios]);

  const savePortfolio = async (updated: Portfolio) => {
    await AsyncStorage.setItem(PORTFOLIO_PREFIX + updated.userId, JSON.stringify(updated));
    setPortfolio(updated);
  };

  const uploadDocument = useCallback(async (type: DocumentType, uri: string, fileName: string, fileSize: number, mimeType: string) => {
    if (!portfolio) return;
    const updated: Portfolio = {
      ...portfolio,
      documents: portfolio.documents.map((d) =>
        d.type === type
          ? { ...d, uri, fileName, fileSize, mimeType, uploadedAt: new Date().toISOString(), status: "uploaded" }
          : d
      ),
    };
    await savePortfolio(updated);
  }, [portfolio]);

  const removeDocument = useCallback(async (type: DocumentType) => {
    if (!portfolio) return;
    const updated: Portfolio = {
      ...portfolio,
      documents: portfolio.documents.map((d) =>
        d.type === type
          ? { type: d.type, label: d.label, description: d.description, status: "missing" }
          : d
      ),
    };
    await savePortfolio(updated);
  }, [portfolio]);

  const submitPortfolio = useCallback(async () => {
    if (!portfolio) return;
    const updated: Portfolio = {
      ...portfolio,
      submissionStatus: "pending_review",
      submittedAt: new Date().toISOString(),
      notifications: [
        ...portfolio.notifications,
        {
          id: Date.now().toString(),
          title: "Portfolio Submitted",
          message: "Your enrollment portfolio has been submitted for review. You will be notified once reviewed.",
          read: false,
          createdAt: new Date().toISOString(),
          type: "info",
        },
      ],
    };
    await savePortfolio(updated);
    const idsRaw = await AsyncStorage.getItem(ALL_USER_IDS_KEY);
    const ids: string[] = idsRaw ? JSON.parse(idsRaw) : [];
    if (!ids.includes(portfolio.userId)) {
      ids.push(portfolio.userId);
      await AsyncStorage.setItem(ALL_USER_IDS_KEY, JSON.stringify(ids));
    }
  }, [portfolio]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (!portfolio) return;
    const updated: Portfolio = {
      ...portfolio,
      notifications: portfolio.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    };
    await savePortfolio(updated);
  }, [portfolio]);

  const adminUpdateDocument = useCallback(async (userId: string, type: DocumentType, status: DocumentStatus, note?: string) => {
    const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + userId);
    if (!raw) return;
    const p: Portfolio = JSON.parse(raw);
    const updated: Portfolio = {
      ...p,
      documents: p.documents.map((d) =>
        d.type === type ? { ...d, status, adminNote: note } : d
      ),
    };
    await AsyncStorage.setItem(PORTFOLIO_PREFIX + userId, JSON.stringify(updated));
    await refreshAllPortfolios();
  }, [refreshAllPortfolios]);

  const adminUpdateSubmission = useCallback(async (userId: string, status: SubmissionStatus, note?: string) => {
    const raw = await AsyncStorage.getItem(PORTFOLIO_PREFIX + userId);
    if (!raw) return;
    const p: Portfolio = JSON.parse(raw);
    let notif: Notification;
    if (status === "approved") {
      notif = {
        id: Date.now().toString(),
        title: "Portfolio Approved!",
        message: "Congratulations! Your enrollment portfolio has been approved. You are now admitted.",
        read: false,
        createdAt: new Date().toISOString(),
        type: "success",
      };
    } else if (status === "revisions_needed") {
      notif = {
        id: Date.now().toString(),
        title: "Revisions Needed",
        message: note || "Some documents need revision. Please review the feedback and re-upload.",
        read: false,
        createdAt: new Date().toISOString(),
        type: "warning",
      };
    } else if (status === "enrolled") {
      notif = {
        id: Date.now().toString(),
        title: "Enrollment Confirmed",
        message: "You are officially enrolled! Welcome to the institution.",
        read: false,
        createdAt: new Date().toISOString(),
        type: "success",
      };
    } else {
      notif = {
        id: Date.now().toString(),
        title: "Status Updated",
        message: "Your enrollment status has been updated.",
        read: false,
        createdAt: new Date().toISOString(),
        type: "info",
      };
    }
    const updated: Portfolio = {
      ...p,
      submissionStatus: status,
      reviewedAt: new Date().toISOString(),
      adminNote: note,
      notifications: [...p.notifications, notif],
    };
    await AsyncStorage.setItem(PORTFOLIO_PREFIX + userId, JSON.stringify(updated));
    await refreshAllPortfolios();
  }, [refreshAllPortfolios]);

  return (
    <PortfolioContext.Provider value={{
      portfolio,
      allPortfolios,
      uploadDocument,
      removeDocument,
      submitPortfolio,
      markNotificationRead,
      adminUpdateDocument,
      adminUpdateSubmission,
      refreshAllPortfolios,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
