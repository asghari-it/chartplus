"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronLeft, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetIcon } from "@/components/asset-icon";
import { Sparkline } from "@/components/charts/sparkline";
import { Gauge } from "@/components/charts/gauge";
import { useDailyBrief, useMarket } from "@/hooks/use-queries";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ProfileDTO, Quote } from "@/lib/types";

export function HomeTab({ profile }: { profile: ProfileDTO }) {
  const { data: marketData, isLoading } = useMarket(10_000);
  const { data: brief, isLoading: briefLoading } = useDailyBrief();
  const { setActiveTab, setAnalysisSymbol } = useAppStore();

  const stats = useMemo(() => {
    const quotes = marketData?.quotes ?? [];
    const cryptos = quotes.filter((q) => q.category === "crypto");
    const avgChange = cryptos.length ? cryptos.reduce((s, q) => s + q.changePercent, 0) / cryptos.length : 0;
    const totalCap = 2_487_632_391_450 * (1 + avgChange / 100);
    // اسپارک ترکیبی از میانگین نرمال‌شده اسپارک‌ها
    const spark = cryptos.length
      ? Array.from({ length: 32 }, (_, i) =>
          cryptos.reduce((s, q) => s + (q.spark?.[i] ?? 0) / (q.price || 1), 0) / cryptos.length
        )
      : [];
    const gainers = [...cryptos].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
    const losers = [...cryptos].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
    return { avgChange, totalCap, spark, gainers, losers };
  }, [marketData]);

  const openAnalysis = (symbol: string) => {
    setAnalysisSymbol(symbol);
    setActiveTab("analysis");
  };

  const sentimentFa =
    brief?.sentiment === "bullish" ? "صعودی" : brief?.sentiment === "bearish" ? "نزولی" : "خنثی";
  const sentimentColor =
    brief?.sentiment === "bullish" ? "text-up" : brief?.sentiment === "bearish" ? "text-down" : "text-brand";

  return (
    <div className="flex flex-col gap-5">
      {/* کارت وضعیت کلی بازار */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="card-glow overflow-hidden border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">ارزش کل بازار رمزارزها</p>
                <p className="num mt-1 text-2xl font-extrabold tracking-tight" dir="ltr">
                  ${(stats.totalCap / 1e12).toFixed(2)}T
                </p>
                <span
                  className={cn(
                    "num mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                    stats.avgChange >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down"
                  )}
                  dir="ltr"
                >
                  {stats.avgChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stats.avgChange >= 0 ? "+" : ""}
                  {stats.avgChange.toFixed(2)}%
                </span>
              </div>
              <Sparkline data={stats.spark} up={stats.avgChange >= 0} width={150} height={64} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* چیپ‌های سریع دارایی‌ها */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        aria-label="دارایی‌های پرطرفدار"
      >
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {(marketData?.quotes ?? []).slice(0, 6).map((q) => (
            <button
              key={q.symbol}
              onClick={() => openAnalysis(q.symbol)}
              className="flex min-w-[86px] flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-3 transition hover:border-brand/50 hover:bg-brand/5"
            >
              <AssetIcon symbol={q.symbol} size={38} />
              <span className="num text-xs font-extrabold">{q.symbol}</span>
              <span className="num text-[10px] text-muted-foreground" dir="ltr">
                ${q.price.toFixed(q.decimals)}
              </span>
              <span className={cn("num text-[10px] font-bold", q.changePercent >= 0 ? "text-up" : "text-down")} dir="ltr">
                {q.changePercent >= 0 ? "+" : ""}
                {q.changePercent.toFixed(1)}%
              </span>
            </button>
          ))}
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[118px] min-w-[86px] animate-pulse rounded-2xl bg-secondary/50" />
            ))}
        </div>
      </motion.section>

      {/* پرسودترین‌ها و پرضررترین‌ها */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoverList title="پرسودترین‌ها" icon={<TrendingUp className="h-4 w-4 text-up" />} quotes={stats.gainers} onSelect={openAnalysis} loading={isLoading} />
        <MoverList title="پرضررترین‌ها" icon={<TrendingDown className="h-4 w-4 text-down" />} quotes={stats.losers} onSelect={openAnalysis} loading={isLoading} />
      </div>

      {/* تحلیل روزانه هوش مصنوعی */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        aria-label="تحلیل روزانه هوش مصنوعی"
      >
        <Card className="card-glow border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <Brain className="h-4.5 w-4.5 text-brand" /> تحلیل هوش مصنوعی
              </h2>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                امروز
              </span>
            </div>

            {briefLoading ? (
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 animate-pulse rounded-full bg-secondary/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-secondary/60" />
                  <div className="h-3 w-full animate-pulse rounded bg-secondary/50" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-secondary/50" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <Gauge
                  value={brief?.confidence ?? 50}
                  size={92}
                  label={`${brief?.confidence ?? 50}%`}
                  sublabel={sentimentFa}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-extrabold", sentimentColor)}>{brief?.title ?? "چشم‌انداز امروز"}</p>
                  <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{brief?.text}</p>
                  {brief?.points && brief.points.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {brief.points.slice(0, 3).map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                          <span className="line-clamp-1">{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveTab("analysis")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient py-2.5 text-xs font-bold text-primary-foreground shadow-[0_6px_18px_-6px_var(--brand)] transition hover:opacity-90"
              >
                تحلیل کامل بازار <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => useAppStore.getState().openChat("تحلیل امروز بازار چطوره؟")}
                className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 text-xs font-bold transition hover:border-brand/50 hover:text-brand"
              >
                گفتگو با دستیار
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* سلام شخصی‌سازی‌شده هدف */}
      <GoalHint profile={profile} />
    </div>
  );
}

function MoverList({
  title,
  icon,
  quotes,
  onSelect,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  quotes: Quote[];
  onSelect: (symbol: string) => void;
  loading: boolean;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold">
          {icon} {title}
        </h2>
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-secondary/50" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {quotes.map((q) => (
              <li key={q.symbol}>
                <button
                  onClick={() => onSelect(q.symbol)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-start transition hover:bg-secondary/60"
                >
                  <AssetIcon symbol={q.symbol} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="num text-xs font-extrabold">{q.symbol}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{q.name}</p>
                  </div>
                  <div className="text-end">
                    <p className="num text-xs font-bold" dir="ltr">
                      ${q.price.toFixed(q.decimals)}
                    </p>
                    <p className={cn("num text-[10px] font-bold", q.changePercent >= 0 ? "text-up" : "text-down")} dir="ltr">
                      {q.changePercent >= 0 ? "+" : ""}
                      {q.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function GoalHint({ profile }: { profile: ProfileDTO }) {
  const { setActiveTab } = useAppStore();
  const hints: Record<string, { text: string; action: string; tab: "learn" | "market" | "analysis" }> = {
    learning: { text: "مسیر یادگیری تو آماده است؛ امروز با کندل‌های ژاپنی شروع کن.", action: "ادامه یادگیری", tab: "learn" },
    investing: { text: "برای سرمایه‌گذاری، دید بلندمدت مهم است؛ روند بازار را بررسی کن.", action: "دیدن بازار", tab: "market" },
    trading: { text: "قبل از معامله بعدی، تحلیل تکنیکال هوش مصنوعی را ببین.", action: "شروع تحلیل", tab: "analysis" },
  };
  const hint = hints[profile.goal] ?? hints.learning;
  return (
    <Card className="border-brand/30 bg-brand/5">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
          <Sparkles className="h-4.5 w-4.5 text-brand" />
        </span>
        <p className="flex-1 text-xs leading-relaxed">{hint.text}</p>
        <button
          onClick={() => setActiveTab(hint.tab)}
          className="shrink-0 rounded-lg bg-brand/15 px-3 py-1.5 text-[11px] font-bold text-brand transition hover:bg-brand/25"
        >
          {hint.action}
        </button>
      </CardContent>
    </Card>
  );
}
