import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// فهرست جلسه‌های چت (تاریخچه هوش مصنوعی)
export async function GET() {
  try {
    const sessions = await db.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s._count.messages,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت تاریخچه گفتگوها" }, { status: 500 });
  }
}

// ساخت جلسه جدید
export async function POST() {
  try {
    const session = await db.chatSession.create({ data: { title: "گفتگوی جدید" } });
    return NextResponse.json({ session: { id: session.id, title: session.title } });
  } catch (e) {
    return NextResponse.json({ error: "خطا در ساخت گفتگو" }, { status: 500 });
  }
}
