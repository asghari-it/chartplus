"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Brain, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AssetIcon } from "@/components/asset-icon";
import { Sparkline } from "@/components/charts/sparkline";
import { CandleChart } from "@/components/charts/candle-chart";
import { useCandles, useMarket } from "@/hooks/use-queries";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AssetCategory, Quote, Timeframe } from "@/lib/types";

const CATEGORIES: { id: AssetCategory | "all"; label: string }[] = [
  { id: "crypto", label: "ارزهای دیجیتال" },
  { id: "metals", label: "فلزات" },
  { id: "indices", label: "شاخص‌ها" },
  { id: "forex", label: "فارکس" },
];

const TFS: Timeframe[] = ["1H", "4H", "1D", "1W"];

export function MarketTab() {
  const { data, isLoading } = useMarket(10_000);
  const [category, setCategory] = useState<AssetCategory>("crypto");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Quote | null>(null);
  const { setActiveTab, setAnalysisSymbol } = useAppStore();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.quotes ?? []).filter((item) => {
      if (item.category !== category) return false;
      if (!q) return true;
      return item.symbol.toLowerCase().includes(q) || item.name.includes(q) || item.enName.toLowerCase().includes(q);
    });
  }, [data, category, query]);

  const goAnalysis = (symbol: string) => {
    setAnalysisSymbol(symbol);
    setActiveTab("analysis");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* جستجو */}
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نماد... مثل BTC یا بیت‌کوین"
          aria-label="جستجوی دارایی"
          className="h-11 rounded-2xl border-input bg-card ps-10 text-sm"
        />
      </div>

      {/* دسته‌بندی‌ها */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="دسته‌بندی بازار">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all",
              category === c.id
                ? "bg-brand-gradient text-primary-foreground shadow-[0_4px_14px_-4px_var(--brand)]"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* لیست دارایی‌ها */}
      <section aria-label="فهرست دارایی‌ها">
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="text-sm font-extrabold">{CATEGORIES.find((c) => c.id === category)?.label}</h2>
          <span className="num text-[10px] text-muted-foreground">{filtered.length} دارایی</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            دارایی‌ای با این نام پیدا نشد.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((q, i) => (
              <motion.li
                key={q.symbol}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              >
                <button
                  onClick={() => setSelected(q)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-start transition hover:border-brand/40 hover:bg-brand/5"
                >
                  <AssetIcon symbol={q.symbol} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="num text-sm font-extrabold">{q.symbol}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {q.name} · {q.enName}
                    </p>
                  </div>
                  <Sparkline data={q.spark} up={q.changePercent >= 0} width={70} height={30} />
                  <div className="text-end">
                    <p className="num text-sm font-extrabold" dir="ltr">
                      ${q.price.toFixed(q.decimals)}
                    </p>
                    <span
                      className={cn(
                        "num inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                        q.changePercent >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down"
                      )}
                      dir="ltr"
                    >
                      {q.changePercent >= 0 ? "+" : ""}
                      {q.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      {/* نمایه چارت دارایی انتخابی */}
      <AnimatePresence>
        {selected && (
          <AssetChartPanel
            quote={selected}
            onClose={() => setSelected(null)}
            onAnalyze={() => {
              goAnalysis(selected.symbol);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AssetChartPanel({ quote, onClose, onAnalyze }: { quote: Quote; onClose: () => void; onAnalyze: () => void }) {
  const [tf, setTf] = useState<Timeframe>("4H");
  const { data, isLoading } = useCandles(quote.symbol, tf);
  const live = data?.live ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[70] flex flex-col bg-background"
      role="dialog"
      aria-label={`چارت ${quote.name}`}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onClose}
          aria-label="بازگشت"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
        >
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
        <AssetIcon symbol={quote.symbol} size={38} />
        <div className="flex-1">
          <p className="num text-sm font-extrabold">
            {quote.symbol} <span className="text-xs font-normal text-muted-foreground">{quote.name}</span>
          </p>
          <p className="num text-xs font-bold" dir="ltr">
            ${quote.price.toFixed(quote.decimals)}{" "}
            <span className={quote.changePercent >= 0 ? "text-up" : "text-down"}>
              {quote.changePercent >= 0 ? "+" : ""}
              {quote.changePercent.toFixed(2)}%
            </span>
            <span className={cn("ms-2 rounded px-1.5 py-0.5 text-[9px] font-bold", live ? "bg-up/10 text-up" : "bg-secondary text-muted-foreground")}>
              {live ? "زنده" : "شبیه‌سازی"}
            </span>
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* تایم‌فریم‌ها */}
        <div className="mb-3 flex gap-2" role="tablist" aria-label="تایم‌فریم">
          {TFS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tf === t}
              onClick={() => setTf(t)}
              className={cn(
                "num flex-1 rounded-xl py-2 text-xs font-bold transition",
                tf === t ? "bg-brand text-primary-foreground shadow-[0_4px_14px_-4px_var(--brand)]" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* چارت کندل */}
        <div className="rounded-2xl border border-border bg-card p-3">
          <CandleChart candles={data?.candles ?? []} decimals={quote.decimals} tf={tf} loading={isLoading} height={300} />
        </div>

        {/* آمار */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBox label="بالاترین ۲۴س" value={`$${quote.high24h.toFixed(quote.decimals)}`} />
          <StatBox label="پایین‌ترین ۲۴س" value={`$${quote.low24h.toFixed(quote.decimals)}`} />
          <StatBox label="تغییر روز" value={`${quote.changePercent.toFixed(2)}%`} up={quote.changePercent >= 0} />
        </div>

        <button
          onClick={onAnalyze}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3.5 text-sm font-extrabold text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)] transition hover:opacity-90"
        >
          <Brain className="h-4.5 w-4.5" /> تحلیل تکنیکال با هوش مصنوعی
        </button>
      </div>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("num mt-1 text-xs font-extrabold", up !== undefined && (up ? "text-up" : "text-down"))} dir="ltr">
        {value}
      </p>
    </div>
  );
}
