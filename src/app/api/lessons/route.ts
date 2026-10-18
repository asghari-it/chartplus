import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allLessons } from "@/lib/lessons";

// پیشرفت درس‌ها
export async function GET() {
  try {
    const rows = await db.lessonProgress.findMany();
    const progress: Record<string, boolean> = {};
    for (const r of rows) progress[r.lessonId] = r.completed;
    return NextResponse.json({ progress, total: allLessons.length });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت پیشرفت" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lessonId: string = body.lessonId;
    if (!lessonId || !allLessons.some((l) => l.id === lessonId)) {
      return NextResponse.json({ error: "درس نامعتبر است" }, { status: 400 });
    }
    const row = await db.lessonProgress.upsert({
      where: { lessonId },
      create: { lessonId, completed: true },
      update: { completed: body.completed === false ? false : true },
    });
    return NextResponse.json({ ok: true, lessonId: row.lessonId, completed: row.completed });
  } catch (e) {
    return NextResponse.json({ error: "خطا در ذخیره پیشرفت" }, { status: 500 });
  }
}
