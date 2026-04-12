import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "./ToastContext";

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
  fetchPortfolioDetail: (userId: string) => Promise<Portfolio | null>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { type: "birth_certificate", label: "Birth Certificate", description: "Clear copy of your PSA Birth Certificate", status: "missing" },
  { type: "good_moral", label: "Good Moral Certificate", description: "Certificate of Good Moral Character", status: "missing" },
  { type: "psa", label: "PSA / Marriage Contract", description: "PSA copy of Marriage Contract (if applicable)", status: "missing" },
  { type: "tor", label: "Transcript of Records", description: "Official Transcript of Records or Form 137", status: "missing" },
];

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [allPortfolios, setAllPortfolios] = useState<Portfolio[]>([]);
  const { showToast } = useToast();

  const mergeDocuments = useCallback((data: Portfolio): Portfolio => {
    const documents = DEFAULT_DOCUMENTS.map(def => {
      const existing = data.documents?.find(d => d.type === def.type);
      if (existing) {
        return {
          ...def,
          ...existing,
          // Ensure label and description are preserved/fallback
          label: def.label,
          description: def.description
        };
      }
      return def;
    });
    return { ...data, documents };
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await customFetch<Portfolio>("/api/portfolio");
      setPortfolio(mergeDocuments(data));
    } catch (e) {
      console.error("Failed to fetch portfolio", e);
    }
  }, [mergeDocuments]);

  const fetchPortfolioDetail = useCallback(async (userId: string) => {
    try {
      const data = await customFetch<Portfolio>(`/api/admin/portfolios/${userId}`);
      return mergeDocuments(data);
    } catch (e) {
      console.error("Failed to fetch portfolio detail", e);
      return null;
    }
  }, [mergeDocuments]);

  const refreshAllPortfolios = useCallback(async () => {
    try {
      const data = await customFetch<Portfolio[]>("/api/admin/portfolios");
      setAllPortfolios(data.map(p => mergeDocuments(p)));
    } catch (e) {
      console.error("Failed to fetch all portfolios", e);
    }
  }, [mergeDocuments]);

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
    const formData = new FormData();
    
    if (Platform.OS === "web") {
      // In web, we need to fetch the blob from the uri to send raw file data
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append("file", blob, fileName);
    } else {
      // In React Native, the native bridge handles the uri automatically
      const fileToUpload = {
        uri: uri,
        name: fileName,
        type: mimeType,
      } as any;
      formData.append("file", fileToUpload);
    }

    formData.append("type", type);

    try {
      await customFetch("/api/portfolio/documents", {
        method: "POST",
        body: formData as any,
      });
      await fetchPortfolio();
      showToast("Document uploaded successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to upload document", "error");
      throw e;
    }
  }, [fetchPortfolio, showToast]);

  const removeDocument = useCallback(async (type: DocumentType) => {
    try {
      await customFetch(`/api/portfolio/documents/${type}`, {
        method: "DELETE",
      });
      await fetchPortfolio();
      showToast("Document removed", "info");
    } catch (e: any) {
      showToast(e.message || "Failed to remove document", "error");
      throw e;
    }
  }, [fetchPortfolio, showToast]);

  const submitPortfolio = useCallback(async () => {
    try {
      await customFetch("/api/portfolio/submit", {
        method: "POST",
      });
      await fetchPortfolio();
      showToast("Portfolio submitted for review", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to submit portfolio", "error");
      throw e;
    }
  }, [fetchPortfolio, showToast]);

  const markNotificationRead = useCallback(async (id: string) => {
    await customFetch(`/api/portfolio/notifications/${id}/read`, {
      method: "PATCH",
    });
    await fetchPortfolio();
  }, [fetchPortfolio]);

  const adminUpdateDocument = useCallback(async (userId: string, type: DocumentType, status: DocumentStatus, note?: string) => {
    try {
      await customFetch(`/api/admin/portfolios/${userId}/documents/${type}/status`, {
        method: "POST",
        body: JSON.stringify({ status, note }),
      });
      await refreshAllPortfolios();
      showToast("Document status updated", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update status", "error");
      throw e;
    }
  }, [refreshAllPortfolios, showToast]);

  const adminUpdateSubmission = useCallback(async (userId: string, status: SubmissionStatus, note?: string) => {
    try {
      await customFetch(`/api/admin/portfolios/${userId}/status`, {
        method: "POST",
        body: JSON.stringify({ status, note }),
      });
      await refreshAllPortfolios();
      showToast("Submission status updated", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update status", "error");
      throw e;
    }
  }, [refreshAllPortfolios, showToast]);

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
      fetchPortfolioDetail,
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
