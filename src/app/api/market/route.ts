import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { quotes, updatedAt } = await getQuotes();
    return NextResponse.json(
      { quotes, updatedAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت داده‌های بازار" }, { status: 500 });
  }
}
