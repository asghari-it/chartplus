import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiComplete, guideSystemPrompt } from "@/lib/ai";
import { getQuotes } from "@/lib/market";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ارسال پیام به هوش مصنوعی و ذخیره در تاریخچه
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string = (body.message ?? "").trim();
    let sessionId: string | undefined = body.sessionId;

    if (!message) {
      return NextResponse.json({ error: "پیام خالی است" }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "پیام طولانی است" }, { status: 400 });
    }

    // ساخت یا یافتن جلسه
    let session = sessionId ? await db.chatSession.findUnique({ where: { id: sessionId } }) : null;
    if (!session) {
      session = await db.chatSession.create({
        data: { title: message.slice(0, 40) },
      });
      sessionId = session.id;
    }

    // تاریخچه گفتگو (۱۲ پیام آخر)
    const history = await db.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    // زمینه مختصر بازار
    const { quotes } = await getQuotes();
    const marketLines = quotes
      .filter((q) => ["BTC", "ETH", "SOL", "GOLD", "SPX"].includes(q.symbol))
      .map((q) => `${q.symbol}: ${q.price.toFixed(q.decimals)} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`)
      .join(" | ");

    const profile = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });

    const system =
      guideSystemPrompt(profile) +
      "\n\nقیمت لحظه‌ای مرجع بازار:\n" +
      marketLines +
      "\nاگر کاربر درباره قیمت پرسید، از همین داده‌ها استفاده کن و تصریح کن داده‌ها لحظه‌ای است.";

    const messages = [
      ...history.map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.content })),
      { role: "user" as const, content: message },
    ];

    const ai = await aiComplete(system, messages);
    const reply = ai.ok
      ? ai.content
      : "متاسفانه سرویس هوش مصنوعی موقتاً در دسترس نیست. لطفاً چند لحظه بعد دوباره تلاش کنید.";

    const [userMsg, assistantMsg] = await Promise.all([
      db.chatMessage.create({ data: { sessionId: session.id, role: "user", content: message } }),
      db.chatMessage.create({ data: { sessionId: session.id, role: "assistant", content: reply } }),
    ]);
    await db.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

    return NextResponse.json({
      sessionId: session.id,
      user: { id: userMsg.id, role: "user", content: userMsg.content, createdAt: userMsg.createdAt },
      assistant: { id: assistantMsg.id, role: "assistant", content: assistantMsg.content, createdAt: assistantMsg.createdAt },
    });
  } catch (e) {
    return NextResponse.json({ error: "خطا در پردازش پیام" }, { status: 500 });
  }
}
