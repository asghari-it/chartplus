"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  FileUp,
  History,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  ScanLine,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetIcon } from "@/components/asset-icon";
import { CandleChart } from "@/components/charts/candle-chart";
import { Gauge } from "@/components/charts/gauge";
import {
  useAnalysisHistory,
  useCandles,
  useDeleteAnalysis,
  useMarket,
  useRunAnalysis,
} from "@/hooks/use-queries";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AnalysisDTO, Timeframe } from "@/lib/types";

const TFS: Timeframe[] = ["1H", "4H", "1D", "1W"];

export function AnalysisTab() {
  const { analysisSymbol, setAnalysisSymbol, openChat, setActiveTab } = useAppStore();
  const [mode, setMode] = useState<"symbol" | "image">("symbol");
  const [tf, setTf] = useState<Timeframe>("4H");
  const [record, setRecord] = useState<AnalysisDTO | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: marketData } = useMarket(15_000);
  const { data: candleData, isLoading: candlesLoading } = useCandles(mode === "symbol" ? analysisSymbol : "BTC", tf);
  const { data: historyData } = useAnalysisHistory();
  const runAnalysis = useRunAnalysis();
  const deleteAnalysis = useDeleteAnalysis();
  const { toast } = useToast();

  const quote = useMemo(
    () => (marketData?.quotes ?? []).find((q) => q.symbol === analysisSymbol),
    [marketData, analysisSymbol]
  );

  const cryptos = useMemo(() => (marketData?.quotes ?? []).filter((q) => q.category === "crypto"), [marketData]);

  const levels = record
    ? {
        support: record.support,
        resistance: record.resistance,
        target: record.target,
        stopLoss: record.stopLoss,
      }
    : undefined;

  // ریست تحلیل هنگام تغییر نماد (الگوی تنظیم state هنگام رندر)
  const [prevSymbol, setPrevSymbol] = useState(analysisSymbol);
  if (prevSymbol !== analysisSymbol) {
    setPrevSymbol(analysisSymbol);
    setRecord(null);
    setShowFull(false);
  }

  const analyzeSymbol = () => {
    setRecord(null);
    runAnalysis.mutate(
      { source: "symbol", symbol: analysisSymbol, timeframe: tf },
      {
        onSuccess: (res) => {
          setRecord(res.record);
          toast({ title: "تحلیل آماده شد", description: `تحلیل تکنیکال ${res.record.assetName} با موفقیت تولید شد.` });
        },
        onError: (e: Error) => toast({ title: "تحلیل ناموفق", description: e.message, variant: "destructive" }),
      }
    );
  };

  const analyzeImage = () => {
    if (!imageData) {
      toast({ title: "تصویری انتخاب نشده", description: "ابتدا تصویر چارت را بارگذاری کنید.", variant: "destructive" });
      return;
    }
    setRecord(null);
    runAnalysis.mutate(
      { source: "image", imageData, note, assetName: "چارت آپلودی", timeframe: tf },
      {
        onSuccess: (res) => {
          setRecord(res.record);
          toast({ title: "تحلیل تصویر آماده شد" });
        },
        onError: (e: Error) => toast({ title: "تحلیل ناموفق", description: e.message, variant: "destructive" }),
      }
    );
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "فایل نامعتبر", description: "فقط تصویر قابل قبول است.", variant: "destructive" });
      return;
    }
    if (file.size > 3_500_000) {
      toast({ title: "حجم زیاد", description: "حجم تصویر باید کمتر از ۳ مگابایت باشد.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result));
    reader.readAsDataURL(file);
  };

  const trendFa = record?.trend === "bullish" ? "صعودی" : record?.trend === "bearish" ? "نزولی" : "خنثی";
  const trendColor = record?.trend === "bullish" ? "text-up" : record?.trend === "bearish" ? "text-down" : "text-brand";

  return (
    <div className="flex flex-col gap-4">
      {/* سوییچ حالت */}
      <div className="flex rounded-2xl border border-border bg-card p-1" role="tablist" aria-label="حالت تحلیل">
        <button
          role="tab"
          aria-selected={mode === "symbol"}
          onClick={() => setMode("symbol")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-xs font-extrabold transition",
            mode === "symbol" ? "bg-brand-gradient text-primary-foreground shadow" : "text-muted-foreground"
          )}
        >
          انتخاب ارز
        </button>
        <button
          role="tab"
          aria-selected={mode === "image"}
          onClick={() => setMode("image")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-xs font-extrabold transition",
            mode === "image" ? "bg-brand-gradient text-primary-foreground shadow" : "text-muted-foreground"
          )}
        >
          بارگذاری چارت
        </button>
      </div>

      {/* حالت انتخاب ارز */}
      {mode === "symbol" && (
        <Card className="card-glow border-border bg-card">
          <CardContent className="p-4">
            {/* انتخاب نماد */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AssetIcon symbol={quote?.symbol ?? analysisSymbol} size={40} />
                <div>
                  <p className="num text-sm font-extrabold">
                    {analysisSymbol} <span className="text-[11px] font-normal text-muted-foreground">{quote?.name ?? ""}</span>
                  </p>
                  <p className="num text-xs font-bold" dir="ltr">
                    ${quote ? quote.price.toFixed(quote.decimals) : "—"}{" "}
                    {quote && (
                      <span className={quote.changePercent >= 0 ? "text-up" : "text-down"}>
                        {quote.changePercent >= 0 ? "+" : ""}
                        {quote.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <select
                value={analysisSymbol}
                onChange={(e) => setAnalysisSymbol(e.target.value)}
                aria-label="انتخاب نماد"
                className="h-10 rounded-xl border border-input bg-secondary/60 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-ring"
              >
                {cryptos.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol} — {q.name}
                  </option>
                ))}
              </select>
            </div>

            {/* تایم‌فریم */}
            <div className="mt-4 flex gap-2" role="tablist" aria-label="تایم‌فریم">
              {TFS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tf === t}
                  onClick={() => setTf(t)}
                  className={cn(
                    "num flex-1 rounded-xl py-2 text-xs font-bold transition",
                    tf === t ? "bg-brand text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* چارت با سطوح */}
            <div className="mt-3 rounded-2xl border border-border bg-background/40 p-2">
              <CandleChart
                candles={candleData?.candles ?? []}
                decimals={quote?.decimals ?? 2}
                tf={tf}
                loading={candlesLoading}
                levels={levels}
                height={280}
              />
            </div>

            <button
              onClick={analyzeSymbol}
              disabled={runAnalysis.isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3.5 text-sm font-extrabold text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)] transition hover:opacity-90 disabled:opacity-60"
            >
              {runAnalysis.isPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> در حال تحلیل چارت...
                </>
              ) : (
                <>
                  <Brain className="h-4.5 w-4.5" /> تحلیل تکنیکال با هوش مصنوعی
                </>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* حالت آپلود تصویر */}
      {mode === "image" && (
        <Card className="card-glow border-border bg-card">
          <CardContent className="p-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {imageData ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img src={imageData} alt="پیش‌نمایش چارت آپلود شده" className="max-h-64 w-full object-contain bg-black/30" />
                <div className="absolute end-2 top-2 flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-lg bg-background/85 px-3 py-1.5 text-[11px] font-bold backdrop-blur transition hover:bg-background"
                  >
                    تغییر تصویر
                  </button>
                  <button
                    onClick={() => setImageData(null)}
                    aria-label="حذف تصویر"
                    className="rounded-lg bg-destructive/85 px-2 py-1.5 text-white backdrop-blur"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files?.[0]);
                }}
                className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand/40 bg-brand/5 py-10 transition hover:border-brand hover:bg-brand/10"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15">
                  <FileUp className="h-6 w-6 text-brand" />
                </span>
                <span className="text-sm font-extrabold">تصویر چارت را بارگذاری کنید</span>
                <span className="text-[11px] text-muted-foreground">از تریدینگ‌ویو یا هر پلتفرم دیگر — تا ۳ مگابایت</span>
              </button>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="یادداشت اختیاری: نماد، تایم‌فریم یا سوال خاص شما..."
              aria-label="یادداشت برای تحلیل"
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              maxLength={300}
            />

            <button
              onClick={analyzeImage}
              disabled={runAnalysis.isPending || !imageData}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3.5 text-sm font-extrabold text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)] transition hover:opacity-90 disabled:opacity-50"
            >
              {runAnalysis.isPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> هوش مصنوعی در حال خواندن چارت...
                </>
              ) : (
                <>
                  <ScanLine className="h-4.5 w-4.5" /> تحلیل تصویر با هوش مصنوعی
                </>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* کارت نتیجه تحلیل */}
      <AnimatePresence>
        {record && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
            <Card className="card-glow border-brand/30 bg-card">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-extrabold">
                    <Brain className="h-4.5 w-4.5 text-brand" /> تحلیل هوش مصنوعی
                  </h2>
                  <span className="num rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                    {record.timeframe} · {record.source === "image" ? "تصویر" : record.symbol}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <Gauge value={record.confidence} size={92} label={`${record.confidence}%`} sublabel={trendFa} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-extrabold", trendColor)}>
                      روند {trendFa} — اعتماد {record.confidence}٪
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{record.summary}</p>
                  </div>
                </div>

                {/* سطوح کلیدی */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <LevelBox label="حمایت" value={record.support} color="up" />
                  <LevelBox label="مقاومت" value={record.resistance} color="down" />
                  <LevelBox label="هدف" value={record.target} color="up" />
                  <LevelBox label="حد ضرر" value={record.stopLoss} color="down" />
                </div>

                {/* متن کامل */}
                {record.fullText && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowFull((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5 text-xs font-bold transition hover:bg-secondary"
                    >
                      تحلیل کامل
                      {showFull ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                      {showFull && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                            {record.fullText}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* اقدامات */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      openChat(
                        `درباره تحلیل ${record.assetName || record.symbol} (روند ${trendFa}، حمایت ${record.support ?? "-"}، مقاومت ${record.resistance ?? "-"}) یک سوال دارم: `
                      )
                    }
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 py-2.5 text-[11px] font-bold transition hover:border-brand/50 hover:text-brand"
                  >
                    <MessageCircleQuestion className="h-4 w-4" /> پرسش و پاسخ
                  </button>
                  <button
                    onClick={record.source === "image" ? analyzeImage : analyzeSymbol}
                    disabled={runAnalysis.isPending}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 py-2.5 text-[11px] font-bold transition hover:border-brand/50 hover:text-brand disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-4 w-4", runAnalysis.isPending && "animate-spin")} /> بازتولید
                  </button>
                  <button
                    onClick={() => setActiveTab("market")}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 py-2.5 text-[11px] font-bold transition hover:border-brand/50 hover:text-brand"
                  >
                    <ScanLine className="h-4 w-4" /> دیدن چارت
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* تاریخچه تحلیل‌ها */}
      {(historyData?.records.length ?? 0) > 0 && (
        <section aria-label="تاریخچه تحلیل‌ها">
          <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-extrabold">
            <History className="h-4 w-4 text-brand" /> تحلیل‌های اخیر
          </h2>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {historyData!.records.map((r) => (
              <div
                key={r.id}
                className="group w-44 shrink-0 rounded-2xl border border-border bg-card p-3 transition hover:border-brand/40"
              >
                <button
                  onClick={() => {
                    setRecord(r);
                    setShowFull(false);
                    if (r.symbol !== "uploaded-chart" && r.symbol !== "chart") setAnalysisSymbol(r.symbol);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full text-start"
                >
                  <div className="flex items-center justify-between">
                    <span className="num text-xs font-extrabold">{r.assetName || r.symbol}</span>
                    <span className={cn("text-[10px] font-bold", r.trend === "bullish" ? "text-up" : r.trend === "bearish" ? "text-down" : "text-brand")}>
                      {r.trend === "bullish" ? "صعودی" : r.trend === "bearish" ? "نزولی" : "خنثی"}
                    </span>
                  </div>
                  <p className="num mt-1 text-[10px] text-muted-foreground" dir="ltr">
                    {new Date(r.createdAt).toLocaleDateString("en-CA")} · {r.timeframe}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{r.summary}</p>
                </button>
                <button
                  onClick={() => deleteAnalysis.mutate(r.id)}
                  aria-label="حذف تحلیل"
                  className="mt-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* نوار پرسش سریع مثل دیزاین */}
      <button
        onClick={() => openChat("سلام! می‌خوام درباره بازار امروز بپرسم.")}
        className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-start text-xs text-muted-foreground transition hover:border-brand/40"
      >
        <MessageCircleQuestion className="h-4.5 w-4.5 text-brand" />
        سوالات با پرسش از دستیار هوشمند...
        <span className="ms-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground">
          <Brain className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}

function LevelBox({ label, value, color }: { label: string; value: number | null; color: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-2.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", color === "up" ? "bg-up" : "bg-down")} />
        <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
      </div>
      <p className={cn("num mt-1 text-sm font-extrabold", color === "up" ? "text-up" : "text-down")} dir="ltr">
        {value != null ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
      </p>
    </div>
  );
}
