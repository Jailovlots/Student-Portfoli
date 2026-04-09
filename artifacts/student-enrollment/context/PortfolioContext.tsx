import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { customFetch } from "@workspace/api-client-react";

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

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [allPortfolios, setAllPortfolios] = useState<Portfolio[]>([]);

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await customFetch<Portfolio>("/api/portfolio");
      setPortfolio(data);
    } catch (e) {
      console.error("Failed to fetch portfolio", e);
    }
  }, []);

  const refreshAllPortfolios = useCallback(async () => {
    try {
      const data = await customFetch<Portfolio[]>("/api/admin/portfolios");
      setAllPortfolios(data);
    } catch (e) {
      console.error("Failed to fetch all portfolios", e);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === "student") {
      fetchPortfolio();
    } else if (user && user.role === "admin") {
      refreshAllPortfolios();
    } else {
      setPortfolio(null);
      setAllPortfolios([]);
    }
  }, [user, fetchPortfolio, refreshAllPortfolios]);

  const uploadDocument = useCallback(async (type: DocumentType, uri: string, fileName: string, fileSize: number, mimeType: string) => {
    await customFetch("/api/portfolio/documents", {
      method: "POST",
      body: JSON.stringify({ type, uri, fileName, fileSize, mimeType }),
    });
    await fetchPortfolio();
  }, [fetchPortfolio]);

  const removeDocument = useCallback(async (type: DocumentType) => {
    console.warn("Remove document not yet implemented in API");
  }, []);

  const submitPortfolio = useCallback(async () => {
    await customFetch("/api/portfolio/submit", {
      method: "POST",
    });
    await fetchPortfolio();
  }, [fetchPortfolio]);

  const markNotificationRead = useCallback(async (id: string) => {
    console.warn("Mark notification read not yet implemented in API");
  }, []);

  const adminUpdateDocument = useCallback(async (userId: string, type: DocumentType, status: DocumentStatus, note?: string) => {
    console.warn("Admin update document not yet specifically implemented in API");
  }, []);

  const adminUpdateSubmission = useCallback(async (userId: string, status: SubmissionStatus, note?: string) => {
    await customFetch(`/api/admin/portfolios/${userId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, note }),
    });
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
