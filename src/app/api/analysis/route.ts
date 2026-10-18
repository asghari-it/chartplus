import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAsset, getCandles, buildMarketContext, getQuotes } from "@/lib/market";
import { aiComplete, aiVision, extractJSON, ANALYST_SYSTEM_PROMPT } from "@/lib/ai";
import type { Timeframe } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type AnalysisJSON = {
  trend?: string;
  confidence?: number;
  support?: number;
  resistance?: number;
  target?: number;
  stopLoss?: number;
  summary?: string;
  fullText?: string;
  points?: string[];
};

export async function GET() {
  try {
    const records = await db.analysisRecord.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({ records });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت تاریخچه تحلیل" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const source = body.source === "image" ? "image" : "symbol";

    let resultJSON: AnalysisJSON | null = null;
    let fullTextFallback = "";
    let symbol = "BTC";
    let assetName = "";
    let timeframe: Timeframe = "4H";
    let imageData: string | null = null;

    const profile = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });

    if (source === "image") {
      const img: string = body.imageData ?? "";
      if (!img.startsWith("data:image/")) {
        return NextResponse.json({ error: "تصویر نامعتبر است" }, { status: 400 });
      }
      // محدود کردن حجم تصویر (~3MB)
      if (img.length > 4_200_000) {
        return NextResponse.json({ error: "حجم تصویر زیاد است" }, { status: 400 });
      }
      symbol = typeof body.symbol === "string" && body.symbol ? body.symbol : "uploaded-chart";
      assetName = typeof body.assetName === "string" ? body.assetName : "چارت آپلودی";
      timeframe = (["1H", "4H", "1D", "1W"].includes(body.timeframe) ? body.timeframe : "4H") as Timeframe;
      imageData = img;

      const prompt = [
        "تصویر پیوست، چارت کندل‌استیک یک دارایی مالی است. به‌عنوان تحلیلگر ارشد تکنیکال آن را بررسی کن.",
        "روند کلی، الگوهای کندلی/قیمتی، سطوح حمایت و مقاومت و مناطق ورود/خروج را تحلیل کن.",
        typeof body.note === "string" && body.note ? `یادداشت کاربر: ${body.note}` : "",
        "",
        "پاسخ خود را فقط و فقط در قالب یک آبجکت JSON زیر بده. بدون ``` و بدون هیچ متن اضافه، بدون توضیح قبل و بعد:",
        "{",
        '  "trend": "bullish" یا "bearish" یا "neutral",',
        '  "confidence": عدد صحیح ۰ تا ۱۰۰,',
        '  "support": عدد اعشاری (قیمت حمایت بر اساس محور قیمت چارت),',
        '  "resistance": عدد اعشاری (قیمت مقاومت),',
        '  "target": عدد اعشاری (هدف قیمتی),',
        '  "stopLoss": عدد اعشاری (حد ضرر),',
        '  "summary": "خلاصه ۲ تا ۳ جمله‌ای فارسی",',
        '  "fullText": "تحلیل کامل فارسی ۴ تا ۸ پاراگراف شامل روند، سطوح، سناریوها و مدیریت ریسک",',
        '  "points": ["نکته کلیدی ۱", "نکته کلیدی ۲", "نکته کلیدی ۳"]',
        "}",
        "توجه: مقادیر support/resistance/target/stopLoss فقط عدد باشند (بدون واحد و بدون متن). اگر محور قیمت خوانا نبود، مقادیر منطقی نسبی بده (مثلاً حول ۱۰۰).",
      ]
        .filter(Boolean)
        .join("\n");

      const vision = await aiVision(img, prompt);
      if (vision.ok) {
        resultJSON = extractJSON<AnalysisJSON>(vision.content);
        fullTextFallback = vision.content;
      } else {
        return NextResponse.json({ error: "تحلیل تصویر در دسترس نیست: " + vision.error }, { status: 502 });
      }
    } else {
      symbol = typeof body.symbol === "string" ? body.symbol.toUpperCase() : "BTC";
      const asset = getAsset(symbol);
      if (!asset) {
        return NextResponse.json({ error: "نماد پشتیبانی نمی‌شود" }, { status: 404 });
      }
      symbol = asset.symbol;
      assetName = asset.faName;
      timeframe = (["1H", "4H", "1D", "1W"].includes(body.timeframe) ? body.timeframe : "4H") as Timeframe;

      const [{ candles }, { quotes }] = await Promise.all([getCandles(symbol, timeframe, 130), getQuotes()]);
      const quote = quotes.find((q) => q.symbol === symbol);
      const context = buildMarketContext(symbol, candles, quote);

      const userPrompt = [
        `تحلیل تکنیکال ${asset.faName} (${asset.symbol}) در تایم‌فریم ${timeframe} را انجام بده.`,
        "",
        "داده‌های بازار:",
        context,
        "",
        profile ? `سطح کاربر: ${profile.level} — پیچیدگی متن را متناسب کن.` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const ai = await aiComplete(ANALYST_SYSTEM_PROMPT, [{ role: "user", content: userPrompt }]);
      if (ai.ok) {
        resultJSON = extractJSON<AnalysisJSON>(ai.content);
        fullTextFallback = ai.content;
      } else {
        return NextResponse.json({ error: "سرویس تحلیل موقتاً در دسترس نیست" }, { status: 502 });
      }
    }

    // اعتبارسنجی و نرمال‌سازی خروجی
    const clamp = (n: unknown, min: number, max: number) => {
      const v = typeof n === "number" && isFinite(n) ? n : null;
      return v === null ? null : Math.min(Math.max(v, min), max);
    };
    const trend = resultJSON?.trend === "bullish" || resultJSON?.trend === "bearish" ? resultJSON.trend : "neutral";
    const confidence = Math.round(clamp(resultJSON?.confidence, 0, 100) ?? 62);

    // پاک‌سازی متن از بقایای JSON و کدبلاک
    const cleanText = (s: string) =>
      s
        .replace(/```(?:json)?/g, "")
        .replace(/^\s*\{[\s\S]*?"summary"\s*:\s*"/, "")
        .replace(/",\s*"fullText"[\s\S]*?\}\s*$/, "")
        .trim();

    const summary =
      cleanText((resultJSON?.summary ?? "").trim()) ||
      (fullTextFallback ? cleanText(fullTextFallback).slice(0, 220) : "تحلیل انجام شد؛ جزئیات در متن کامل.");
    const fullText =
      cleanText((resultJSON?.fullText ?? "").trim()) || cleanText(fullTextFallback) || "تحلیل در دسترس نیست.";

    const record = await db.analysisRecord.create({
      data: {
        symbol,
        assetName,
        source,
        imageData: imageData && imageData.length < 400_000 ? imageData : null,
        trend,
        confidence,
        support: typeof resultJSON?.support === "number" ? resultJSON.support : null,
        resistance: typeof resultJSON?.resistance === "number" ? resultJSON.resistance : null,
        target: typeof resultJSON?.target === "number" ? resultJSON.target : null,
        stopLoss: typeof resultJSON?.stopLoss === "number" ? resultJSON.stopLoss : null,
        summary: summary.slice(0, 500),
        fullText: fullText.slice(0, 12_000),
        timeframe,
      },
    });

    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json({ error: "خطای غیرمنتظره در تحلیل" }, { status: 500 });
  }
}
