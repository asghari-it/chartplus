"use client";

import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import type {
  AlertDTO,
  AnalysisDTO,
  Candle,
  DailyBrief,
  ProfileDTO,
  Quote,
  Timeframe,
} from "@/lib/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "خطای شبکه");
  return data as T;
}

// ---------- پروفایل ----------
export function useProfile(): UseQueryResult<{ profile: ProfileDTO | null }> {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchJSON<{ profile: ProfileDTO | null }>("/api/profile"),
    staleTime: 60_000,
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; level: string; goal: string }) =>
      fetchJSON<{ profile: ProfileDTO }>("/api/profile", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ProfileDTO>) =>
      fetchJSON<{ profile: ProfileDTO }>("/api/profile", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useResetApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchJSON<{ ok: boolean }>("/api/profile", { method: "DELETE" }),
    onSuccess: () => qc.clear(),
  });
}

// ---------- بازار ----------
export function useMarket(refreshMs = 10_000) {
  return useQuery({
    queryKey: ["market"],
    queryFn: () => fetchJSON<{ quotes: Quote[]; updatedAt: number }>("/api/market"),
    refetchInterval: refreshMs,
    refetchIntervalInBackground: false,
  });
}

export function useCandles(symbol: string, tf: Timeframe) {
  return useQuery({
    queryKey: ["candles", symbol, tf],
    queryFn: () =>
      fetchJSON<{ candles: Candle[]; live: boolean; price: number }>(
        `/api/market/candles?symbol=${symbol}&tf=${tf}`
      ),
    staleTime: 20_000,
  });
}

// ---------- تحلیل هوش مصنوعی ----------
export function useAnalysisHistory() {
  return useQuery({
    queryKey: ["analysis-history"],
    queryFn: () => fetchJSON<{ records: AnalysisDTO[] }>("/api/analysis"),
  });
}

export function useRunAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      source: "image" | "symbol";
      symbol?: string;
      timeframe?: string;
      imageData?: string;
      note?: string;
    }) => fetchJSON<{ record: AnalysisDTO }>("/api/analysis", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analysis-history"] }),
  });
}

export function useDeleteAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON<{ ok: boolean }>(`/api/analysis/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analysis-history"] }),
  });
}

export function useDailyBrief() {
  return useQuery({
    queryKey: ["daily-brief"],
    queryFn: () => fetchJSON<DailyBrief>("/api/ai/daily"),
    staleTime: 1000 * 60 * 30,
  });
}

// ---------- چت ----------
export type ChatSessionItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export function useChatSessions() {
  return useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => fetchJSON<{ sessions: ChatSessionItem[] }>("/api/chat/sessions"),
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", sessionId],
    queryFn: () =>
      fetchJSON<{
        session: { id: string; title: string };
        messages: { id: string; role: "user" | "assistant"; content: string; createdAt: string }[];
      }>(`/api/chat/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { sessionId?: string; message: string }) =>
      fetchJSON<{
        sessionId: string;
        user: { id: string; role: "user"; content: string; createdAt: string };
        assistant: { id: string; role: "assistant"; content: string; createdAt: string };
      }>("/api/chat", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });
}

export function useDeleteChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON<{ ok: boolean }>(`/api/chat/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });
}

// ---------- آموزش ----------
export function useLessonProgress() {
  return useQuery({
    queryKey: ["lesson-progress"],
    queryFn: () => fetchJSON<{ progress: Record<string, boolean>; total: number }>("/api/lessons"),
  });
}

export function useToggleLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { lessonId: string; completed: boolean }) =>
      fetchJSON<{ ok: boolean }>("/api/lessons", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-progress"] }),
  });
}

// ---------- هشدار قیمت ----------
export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => fetchJSON<{ alerts: AlertDTO[] }>("/api/alerts"),
    refetchInterval: 30_000,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { symbol: string; condition: "above" | "below"; price: number }) =>
      fetchJSON<{ alert: AlertDTO }>("/api/alerts", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; triggered?: boolean; read?: boolean }) =>
      fetchJSON<{ alert: AlertDTO }>("/api/alerts", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) =>
      fetchJSON<{ ok: boolean }>(`/api/alerts${id ? `?id=${id}` : ""}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
