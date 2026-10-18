// لایه هوش مصنوعی — فقط سمت سرور (z-ai-web-dev-sdk)
import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export type AIMessage = { role: "user" | "assistant"; content: string };

export type AIResult = { ok: true; content: string } | { ok: false; error: string };

export async function aiComplete(
  system: string,
  messages: AIMessage[],
  opts?: { json?: boolean; maxTokens?: number }
): Promise<AIResult> {
  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [{ role: "assistant", content: system }, ...messages],
      thinking: { type: "disabled" },
    });
    const content = completion?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) throw new Error("پاسخ خالی از مدل");
    return { ok: true, content };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطای ناشناخته هوش مصنوعی" };
  }
}

export async function aiVision(imageDataUrl: string, prompt: string): Promise<AIResult> {
  try {
    const zai = await getZAI();
    const completion = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const content = completion?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) throw new Error("پاسخ خالی از مدل بینایی");
    return { ok: true, content };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطای تحلیل تصویر" };
  }
}

// استخراج JSON از پاسخ مدل (با تحمل محصور‌کردن در ```json)
export function extractJSON<T>(raw: string): T | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// پرامپت سیستم راهنمای chartplus
export function guideSystemPrompt(profile?: { name?: string; level?: string; goal?: string } | null): string {
  const levelFa = profile?.level === "beginner" ? "مبتدی" : profile?.level === "intermediate" ? "متوسط" : "حرفه‌ای";
  const goalFa =
    profile?.goal === "learning" ? "یادگیری" : profile?.goal === "investing" ? "سرمایه‌گذاری" : "معامله‌گری";
  return [
    "تو «راهنمای chartplus» هستی؛ دستیار هوشمند تحلیل بازارهای مالی (ارزهای دیجیتال، فلزات گران‌بها، شاخص‌ها و فارکس).",
    "همیشه فقط به زبان فارسی، روان و حرفه‌ای پاسخ بده. از ایموجی استفاده نکن.",
    profile?.name
      ? `کاربر: ${profile.name} | سطح دانش: ${levelFa} | هدف: ${goalFa} — لحن و عمق پاسخ را متناسب با این سطح تنظیم کن.`
      : "",
    "اصول پاسخ‌دهی:",
    "- برای تحلیل، همیشه به حمایت، مقاومت، روند و سناریوها اشاره کن و اعداد مشخص بده.",
    "- هیچ‌گاه تضمین سود نده و یادآوری کن که تحلیل تو صرفاً آموزشی است و سیگنال قطعی نیست.",
    "- پاسخ‌ها را کوتاه، ساختارمند و کاربردی بنویس؛ در صورت نیاز از فهرست استفاده کن.",
    "- اگر سؤال خارج از حوزه بازارهای مالی بود، مودبانه به حوزه تخصصی خودت برگرد.",
  ]
    .filter(Boolean)
    .join("\n");
}

// پرامپت سیستم برای تحلیل تکنیکال ساختاریافته
export const ANALYST_SYSTEM_PROMPT = [
  "تو یک تحلیلگر ارشد تکنیکال بازارهای مالی هستی که برای اپ فارسی «chartplus» تحلیل تولید می‌کند.",
  "پاسخ را دقیقاً در قالب JSON زیر بده، بدون هیچ متن اضافه:",
  "{",
  '  "trend": "bullish" | "bearish" | "neutral",',
  '  "confidence": عدد ۰ تا ۱۰۰,',
  '  "support": عدد قیمت حمایت,',
  '  "resistance": عدد قیمت مقاومت,',
  '  "target": عدد قیمت هدف,',
  '  "stopLoss": عدد قیمت حد ضرر,',
  '  "summary": "خلاصه دو تا سه جمله‌ای فارسی",',
  '  "fullText": "تحلیل کامل فارسی با ساختار پاراگرافی (۴ تا ۸ پاراگراف شامل روند، حمایت/مقاومت، اندیکاتورها، سناریوها، مدیریت ریسک)",',
  '  "points": ["نکته کلیدی ۱", "نکته کلیدی ۲", "نکته کلیدی ۳"]',
  "}",
  "همه اعداد قیمتی باید عددی و منطقی (نزدیک قیمت فعلی) باشند. متن‌ها فارسی حرفه‌ای و بدون ایموجی باشند.",
  "یادداشت پایانی داخل fullText: این تحلیل صرفاً آموزشی است و توصیه سرمایه‌گذاری نیست.",
].join("\n");
