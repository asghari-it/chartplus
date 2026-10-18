import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getQuotes } from "@/lib/market";
import { aiComplete, guideSystemPrompt } from "@/lib/ai";
import type { AssetCategory } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// کش تحلیل روزانه در حافظه
let dailyCache: { date: string; data: unknown } | null = null;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

type DailyJSON = {
  sentiment?: string;
  confidence?: number;
  title?: string;
  text?: string;
  points?: string[];
};

export async function GET() {
  try {
    const today = todayKey();
    if (dailyCache && dailyCache.date === today) {
      return NextResponse.json(dailyCache.data);
    }

    const profile = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });

    // زمینه بازار
    const { quotes } = await getQuotes();
    const topGainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
    const topLosers = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);
    const marketLines = quotes
      .filter((q) => q.category === ("crypto" as AssetCategory))
      .slice(0, 8)
      .map((q) => `${q.symbol}: ${q.price.toFixed(q.decimals)} دلار (${q.changePercent.toFixed(2)}%)`)
      .join("\n");
    const movers = [
      "پرسودترین‌ها:",
      ...topGainers.map((q) => `${q.symbol} ${q.changePercent.toFixed(2)}%`),
      "پرضررترین‌ها:",
      ...topLosers.map((q) => `${q.symbol} ${q.changePercent.toFixed(2)}%`),
    ].join("\n");

    const userPrompt = [
      "وضعیت امروز بازارهای جهانی را به‌صورت یک تحلیل روزانه کوتاه برای صفحه اصلی اپ بنویس.",
      "",
      "داده‌های لحظه‌ای بازار:",
      marketLines,
      "",
      movers,
      "",
      "پاسخ را دقیقاً در قالب JSON بده:",
      '{"sentiment": "bullish|bearish|neutral", "confidence": عدد ۰تا۱۰۰, "title": "عنوان کوتاه", "text": "متن ۳ تا ۵ جمله‌ای تحلیل وضعیت کلی بازار امروز", "points": ["نکته ۱", "نکته ۲", "نکته ۳"]}',
    ].join("\n");

    const ai = await aiComplete(
      guideSystemPrompt(profile) +
        "\nبرای این درخواست، فقط JSON خواسته‌شده را برگردان و هیچ متن دیگری ننویس.",
      [{ role: "user", content: userPrompt }]
    );

    let data: DailyJSON | null = null;
    if (ai.ok) {
      const start = ai.content.indexOf("{");
      const end = ai.content.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try {
          data = JSON.parse(ai.content.slice(start, end + 1)) as DailyJSON;
        } catch {
          data = null;
        }
      }
    }

    const payload =
      data && data.title && data.text
        ? {
            date: today,
            sentiment: data.sentiment === "bullish" || data.sentiment === "bearish" ? data.sentiment : "neutral",
            confidence: Math.min(Math.max(Math.round(data.confidence ?? 60), 0), 100),
            title: data.title,
            text: data.text,
            points: Array.isArray(data.points) ? data.points.slice(0, 4).map(String) : [],
            aiGenerated: ai.ok,
          }
        : {
            date: today,
            sentiment: "neutral",
            confidence: 55,
            title: "چشم‌انداز امروز بازار",
            text: "بازار در وضعیت انتظار به سر می‌برد؛ نوسان‌ها در محدوده بسته انجام می‌شود و شرکت‌کنندگان بازار منتظر داده‌های کلان اقتصادی هستند. مدیریت ریسک و رعایت حد ضرر همچنان مهم‌ترین اولویت است.",
            points: ["مراقب شکست سطوح کلیدی باشید", "حجم پوزیشن را کنترل کنید", "این تحلیل صرفاً آموزشی است"],
            aiGenerated: false,
          };

    dailyCache = { date: today, data: payload };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ error: "خطا در تولید تحلیل روزانه" }, { status: 500 });
  }
}
