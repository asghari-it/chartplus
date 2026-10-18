import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAsset } from "@/lib/market";

// هشدارهای قیمت
export async function GET() {
  try {
    const alerts = await db.priceAlert.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ alerts });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت هشدارها" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const symbol: string = (body.symbol ?? "").toUpperCase();
    const condition: string = body.condition;
    const price: number = Number(body.price);

    if (!getAsset(symbol)) return NextResponse.json({ error: "نماد نامعتبر است" }, { status: 400 });
    if (condition !== "above" && condition !== "below") {
      return NextResponse.json({ error: "شرط نامعتبر است" }, { status: 400 });
    }
    if (!isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "قیمت نامعتبر است" }, { status: 400 });
    }
    const count = await db.priceAlert.count();
    if (count >= 20) {
      return NextResponse.json({ error: "حداکثر ۲۰ هشدار فعال می‌توانید داشته باشید" }, { status: 400 });
    }
    const alert = await db.priceAlert.create({ data: { symbol, condition, price } });
    return NextResponse.json({ alert });
  } catch (e) {
    return NextResponse.json({ error: "خطا در ساخت هشدار" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "شناسه لازم است" }, { status: 400 });
    const alert = await db.priceAlert.update({
      where: { id: body.id },
      data: {
        ...(typeof body.triggered === "boolean" ? { triggered: body.triggered } : {}),
        ...(typeof body.read === "boolean" ? { read: body.read } : {}),
      },
    });
    return NextResponse.json({ alert });
  } catch (e) {
    return NextResponse.json({ error: "به‌روزرسانی هشدار ممکن نشد" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      await db.priceAlert.delete({ where: { id } });
    } else {
      await db.priceAlert.deleteMany({});
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "حذف هشدار ممکن نشد" }, { status: 500 });
  }
}
