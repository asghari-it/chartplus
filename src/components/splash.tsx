"use client";

import { LogoWordmark } from "@/components/logo";

export function Splash({ label = "در حال بارگذاری..." }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      role="status"
      aria-label="در حال بارگذاری chartplus"
    >
      {/* هاله نور پس‌زمینه */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="ambient-blob w-[420px] h-[420px] -top-24 start-1/4 bg-brand/40" />
        <div className="ambient-blob w-[300px] h-[300px] bottom-0 -end-10 bg-brand2/30" />
      </div>

      <div className="relative flex flex-col items-center gap-10">
        <div className="animate-fade-up">
          <LogoWordmark size={110} animated />
        </div>

        <div className="flex flex-col items-center gap-4 w-44" aria-hidden="true">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand-gradient" style={{ animation: "cp-loading 1.4s ease-in-out infinite" }} />
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>

      <p className="absolute bottom-8 text-xs text-muted-foreground/60">تحلیل و ترید هوشمند بازار جهانی</p>
    </div>
  );
}
