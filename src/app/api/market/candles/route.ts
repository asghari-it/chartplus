import { NextResponse } from "next/server";
import { getCandles, getAsset } from "@/lib/market";
import type { Timeframe } from "@/lib/types";

export const dynamic = "force-dynamic";

const TFS: Timeframe[] = ["1H", "4H", "1D", "1W"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") ?? "BTC";
    const tfParam = (searchParams.get("tf") ?? "4H") as Timeframe;
    const tf = TFS.includes(tfParam) ? tfParam : "4H";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "120", 10) || 120, 40), 200);

    if (!getAsset(symbol)) {
      return NextResponse.json({ error: "نماد پشتیبانی نمی‌شود" }, { status: 404 });
    }
    const { candles, live, price } = await getCandles(symbol, tf, limit);
    return NextResponse.json(
      { symbol, tf, candles, live, price },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت کندل‌ها" }, { status: 500 });
  }
}
