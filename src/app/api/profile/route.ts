import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ProfileDTO } from "@/lib/types";

function toDTO(p: { id: string; name: string; email: string; level: string; goal: string; notifications: boolean; priceAlerts: boolean }): ProfileDTO {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    level: p.level as ProfileDTO["level"],
    goal: p.goal as ProfileDTO["goal"],
    notifications: p.notifications,
    priceAlerts: p.priceAlerts,
  };
}

export async function GET() {
  try {
    const profile = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ profile: profile ? toDTO(profile) : null });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت پروفایل" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, level, goal } = body ?? {};
    if (!name?.trim() || !email?.trim() || !level || !goal) {
      return NextResponse.json({ error: "همه فیلدها الزامی است" }, { status: 400 });
    }
    const existing = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });
    if (existing) {
      const updated = await db.profile.update({
        where: { id: existing.id },
        data: { name: name.trim(), email: email.trim(), level, goal },
      });
      return NextResponse.json({ profile: toDTO(updated) });
    }
    const created = await db.profile.create({
      data: { name: name.trim(), email: email.trim(), level, goal },
    });
    return NextResponse.json({ profile: toDTO(created) });
  } catch (e) {
    return NextResponse.json({ error: "خطا در ذخیره پروفایل" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const existing = await db.profile.findFirst({ orderBy: { createdAt: "asc" } });
    if (!existing) return NextResponse.json({ error: "پروفایل یافت نشد" }, { status: 404 });
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.email === "string" && body.email.trim()) data.email = body.email.trim();
    if (["beginner", "intermediate", "professional"].includes(body.level)) data.level = body.level;
    if (["learning", "investing", "trading"].includes(body.goal)) data.goal = body.goal;
    if (typeof body.notifications === "boolean") data.notifications = body.notifications;
    if (typeof body.priceAlerts === "boolean") data.priceAlerts = body.priceAlerts;
    const updated = await db.profile.update({ where: { id: existing.id }, data });
    return NextResponse.json({ profile: toDTO(updated) });
  } catch (e) {
    return NextResponse.json({ error: "خطا در به‌روزرسانی پروفایل" }, { status: 500 });
  }
}

// پاک‌کردن کامل داده‌ها (بازگشت به آنبوردینگ)
export async function DELETE() {
  try {
    await db.chatMessage.deleteMany({});
    await db.chatSession.deleteMany({});
    await db.analysisRecord.deleteMany({});
    await db.lessonProgress.deleteMany({});
    await db.priceAlert.deleteMany({});
    await db.profile.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "خطا در پاک‌کردن داده‌ها" }, { status: 500 });
  }
}
