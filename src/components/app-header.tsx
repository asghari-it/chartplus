"use client";

import { Bell, MessageCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAlerts } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import type { ProfileDTO } from "@/lib/types";
import { LEVEL_LABELS } from "@/lib/types";

const TAB_TITLES: Record<string, string> = {
  market: "بازار",
  analysis: "تحلیل هوشمند",
  learn: "آموزش",
  settings: "تنظیمات",
};

export function AppHeader({ profile }: { profile: ProfileDTO | null }) {
  const { activeTab, setNotificationsOpen, openChat } = useAppStore();
  const { data: alertsData } = useAlerts();

  const unread =
    alertsData?.alerts.filter((a) => a.triggered && !a.read).length ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {activeTab === "home" ? (
          <div>
            <h1 className="text-lg font-extrabold leading-snug">
              سلام، <span className="text-brand-gradient">{profile?.name ?? "تریدر"}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">
              سطح {LEVEL_LABELS[profile?.level ?? "beginner"]} · {profile ? "" : "بازار منتظر توئه"}
              {profile?.goal === "learning" && "مسیر یادگیری‌ات را ادامه بده"}
              {profile?.goal === "investing" && "فرصت‌های امروز را ببین"}
              {profile?.goal === "trading" && "سشن امروز چطور بود؟"}
            </p>
          </div>
        ) : (
          <h1 className="text-lg font-extrabold">{TAB_TITLES[activeTab] ?? "chartplus"}</h1>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => openChat()}
            aria-label="گفتگو با هوش مصنوعی"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-brand hover:border-brand/40"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => setNotificationsOpen(true)}
            aria-label={`اعلان‌ها${unread ? `، ${unread} اعلان خوانده‌نشده` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="num absolute -top-0.5 -end-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-down px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
