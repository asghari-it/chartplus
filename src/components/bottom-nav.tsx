"use client";

import { BarChart3, BookOpen, Home, Settings, CandlestickChart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AppTab } from "@/lib/types";

const TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "خانه", icon: Home },
  { id: "market", label: "بازار", icon: BarChart3 },
  { id: "analysis", label: "تحلیل", icon: CandlestickChart },
  { id: "learn", label: "آموزش", icon: BookOpen },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

export function BottomNav() {
  const { activeTab, setActiveTab, chatOpen } = useAppStore();

  return (
    <nav
      aria-label="ناوبری اصلی"
      className={cn(
        "sticky bottom-0 z-30 mt-auto border-t border-border bg-card/95 backdrop-blur-xl transition-all duration-300",
        "pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2",
        chatOpen && "translate-y-full"
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => setActiveTab(id)}
                aria-current={active ? "page" : undefined}
                className="group flex w-full flex-col items-center gap-1 rounded-xl py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "flex h-9 w-14 items-center justify-center rounded-full transition-all duration-300",
                    active
                      ? "bg-brand-gradient text-primary-foreground shadow-[0_6px_18px_-6px_var(--brand)]"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className={cn("text-[10.5px] font-semibold transition-colors", active ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
