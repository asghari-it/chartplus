"use client";

import { create } from "zustand";
import type { AppTab } from "@/lib/types";

type AppState = {
  // تب فعال
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // اسپلش
  splashVisible: boolean;
  hideSplash: () => void;

  // آنبوردینگ (رد کردن)
  onboardingSkipped: boolean;
  skipOnboarding: () => void;

  // پنل اعلان‌ها
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  // چت هوش مصنوعی
  chatOpen: boolean;
  openChat: (prefill?: string) => void;
  closeChat: () => void;
  chatPrefill: string | null;
  clearChatPrefill: () => void;

  // نماد انتخابی برای تب تحلیل
  analysisSymbol: string;
  setAnalysisSymbol: (symbol: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),

  splashVisible: true,
  hideSplash: () => set({ splashVisible: false }),

  onboardingSkipped: false,
  skipOnboarding: () => set({ onboardingSkipped: true }),

  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  chatOpen: false,
  chatPrefill: null,
  openChat: (prefill) => set({ chatOpen: true, chatPrefill: prefill ?? null }),
  closeChat: () => set({ chatOpen: false, chatPrefill: null }),
  clearChatPrefill: () => set({ chatPrefill: null }),

  analysisSymbol: "BTC",
  setAnalysisSymbol: (symbol) => set({ analysisSymbol: symbol }),
}));
