import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// پیام‌های یک جلسه
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await db.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
    });
    if (!session) return NextResponse.json({ error: "گفتگو یافت نشد" }, { status: 404 });
    return NextResponse.json({
      session: { id: session.id, title: session.title },
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت پیام‌ها" }, { status: 500 });
  }
}

// حذف جلسه
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.chatSession.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "حذف گفتگو ممکن نشد" }, { status: 500 });
  }
}
