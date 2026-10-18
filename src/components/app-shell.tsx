"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Splash } from "@/components/splash";
import { Onboarding } from "@/components/onboarding";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ChatOverlay } from "@/components/chat/chat-overlay";
import { NotificationsPanel } from "@/components/notifications-panel";
import { HomeTab } from "@/components/tabs/home-tab";
import { MarketTab } from "@/components/tabs/market-tab";
import { AnalysisTab } from "@/components/tabs/analysis-tab";
import { LearnTab } from "@/components/tabs/learn-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { useAppStore } from "@/lib/store";
import { useAlerts, useMarket, useProfile, useUpdateAlert } from "@/hooks/use-queries";
import { useToast } from "@/hooks/use-toast";
import type { AlertDTO, ProfileDTO } from "@/lib/types";

export const GUEST_PROFILE: ProfileDTO = {
  id: "guest",
  name: "تریدر",
  email: "",
  level: "beginner",
  goal: "learning",
  notifications: true,
  priceAlerts: true,
};

export function AppShell() {
  const { splashVisible, hideSplash, activeTab, chatOpen, onboardingSkipped } = useAppStore();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const [minSplashPassed, setMinSplashPassed] = useState(false);

  // اسپلش همیشه هنگام اجرا نمایش داده می‌شود
  useEffect(() => {
    const t = setTimeout(() => setMinSplashPassed(true), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (minSplashPassed && !profileLoading) {
      hideSplash();
    }
  }, [minSplashPassed, profileLoading, hideSplash]);

  const profile = profileData?.profile ?? null;
  const activeProfile = profile ?? (onboardingSkipped ? GUEST_PROFILE : null);
  const showSplash = splashVisible;
  const showOnboarding = !showSplash && !profileLoading && !profile && !onboardingSkipped;

  return (
    <div className="relative min-h-screen bg-background">
      {/* پس‌زمینه محیطی دسکتاپ */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-blob w-[480px] h-[480px] -top-32 start-1/2 -translate-x-1/2 bg-brand/25" />
        <div className="ambient-blob w-[380px] h-[380px] bottom-0 -start-32 bg-brand2/15" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-2xl shadow-black/40 sm:border-x sm:border-border/60">
        {showOnboarding ? (
          <Onboarding onDone={() => {}} key="onboarding" />
        ) : activeProfile ? (
          <>
            <AppHeader profile={activeProfile} />
            <main className="flex-1 px-4 pb-6 pt-4" id="main-content">
              {activeTab === "home" && <HomeTab profile={activeProfile} />}
              {activeTab === "market" && <MarketTab />}
              {activeTab === "analysis" && <AnalysisTab />}
              {activeTab === "learn" && <LearnTab />}
              {activeTab === "settings" && <SettingsTab profile={activeProfile} />}
            </main>
            <BottomNav />
          </>
        ) : (
          !showSplash && (
            <div className="flex min-h-[60vh] flex-1 items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="در حال بارگذاری" />
            </div>
          )
        )}
      </div>

      {activeProfile && <ChatOverlay profile={activeProfile} />}
      {activeProfile && <NotificationsPanel profile={activeProfile} />}
      {activeProfile && <AlertWatcher />}
      <AnimateSplash show={showSplash} />
    </div>
  );
}

function AnimateSplash({ show }: { show: boolean }) {
  if (!show) return null;
  return <Splash />;
}

// پایش هشدارهای قیمت: وقتی قیمت از آستانه عبور کرد، اعلان داده می‌شود
function AlertWatcher() {
  const { data: marketData } = useMarket(15_000);
  const { data: alertsData } = useAlerts();
  const updateAlert = useUpdateAlert();
  const { toast } = useToast();
  const checkedRef = useRef<Set<string>>(new Set());
  const qc = useQueryClient();
  const { notificationsOpen } = useAppStore();

  useEffect(() => {
    if (!marketData?.quotes || !alertsData?.alerts) return;
    const priceOf = new Map(marketData.quotes.map((q) => [q.symbol, q.price]));
    for (const alert of alertsData.alerts as AlertDTO[]) {
      if (alert.triggered || checkedRef.current.has(alert.id)) continue;
      const price = priceOf.get(alert.symbol);
      if (price === undefined) continue;
      const hit = alert.condition === "above" ? price >= alert.price : price <= alert.price;
      if (hit) {
        checkedRef.current.add(alert.id);
        updateAlert.mutate(
          { id: alert.id, triggered: true },
          {
            onSuccess: () => {
              toast({
                title: `هشدار قیمت ${alert.symbol}`,
                description: `قیمت از ${alert.price.toLocaleString("en-US")} دلار ${alert.condition === "above" ? "بالاتر" : "پایین‌تر"} رفت.`,
              });
              qc.invalidateQueries({ queryKey: ["alerts"] });
            },
          }
        );
      }
    }
  }, [marketData, alertsData, updateAlert, toast, qc, notificationsOpen]);

  return null;
}
