"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, User, Target, Gauge as GaugeIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/logo";
import { AssetIcon } from "@/components/asset-icon";
import { Sparkline } from "@/components/charts/sparkline";
import { useCreateProfile, useMarket } from "@/hooks/use-queries";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LEVELS = [
  { id: "beginner", title: "مبتدی", desc: "تازه وارد دنیای بازار شدم" },
  { id: "intermediate", title: "متوسط", desc: "مفاهیم پایه را می‌دانم" },
  { id: "professional", title: "حرفه‌ای", desc: "به‌صورت جدی معامله می‌کنم" },
];

const GOALS = [
  { id: "learning", title: "یادگیری", desc: "می‌خواهم تحلیل را از صفر یاد بگیرم" },
  { id: "investing", title: "سرمایه‌گذاری", desc: "دنبال فرصت‌های بلندمدت هستم" },
  { id: "trading", title: "معامله‌گری", desc: "به‌دنبال معاملات فعال روزانه‌ام" },
];

type Step = 0 | 1 | 2 | 3;

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [error, setError] = useState("");

  const createProfile = useCreateProfile();
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);
  const { data: marketData } = useMarket(20_000);
  const { toast } = useToast();

  const movers = useMemo(() => {
    const q = marketData?.quotes ?? [];
    const gainers = [...q].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
    const losers = [...q].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);
    return { gainers, losers };
  }, [marketData]);

  const validate = (): boolean => {
    setError("");
    if (step === 0 && name.trim().length < 2) {
      setError("لطفاً نام خود را وارد کنید (حداقل ۲ حرف)");
      return false;
    }
    if (step === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("لطفاً یک ایمیل معتبر وارد کنید");
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 2 && !level) {
      setError("سطح تجربه خود را انتخاب کنید");
      return;
    }
    if (step === 3 && !goal) {
      setError("هدف خود را انتخاب کنید");
      return;
    }
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    createProfile.mutate(
      { name: name.trim(), email: email.trim(), level: level!, goal: goal! },
      {
        onSuccess: () => {
          toast({ title: `خوش آمدی ${name.trim()}!`, description: "پروفایل شما ساخته شد. بازار در انتظار شماست." });
          onDone();
        },
        onError: (e: Error) => setError(e.message),
      }
    );
  };

  const canSkip = step < 2;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-blob w-[360px] h-[360px] -top-20 -start-24 bg-brand/30" />
        <div className="ambient-blob w-[260px] h-[260px] bottom-24 -end-16 bg-brand2/25" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground",
            step === 0 && "invisible"
          )}
          aria-label="مرحله قبل"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5" aria-label={`مرحله ${step + 1} از ۴`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-7 bg-brand" : "w-1.5 bg-secondary"
              )}
            />
          ))}
        </div>
        <span className="num w-10 text-center text-xs text-muted-foreground">{step + 1} / ۴</span>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-6 pt-8 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {step === 0 && (
              <div className="flex flex-1 flex-col">
                <div className="mb-8 flex items-center gap-3">
                  <LogoMark size={44} />
                  <h1 className="text-2xl font-extrabold leading-relaxed">بیشتر با تو آشنا شویم</h1>
                </div>
                <label htmlFor="ob-name" className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <User className="h-4 w-4 text-brand" /> اسمت چیه؟
                </label>
                <Input
                  id="ob-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام کامل خود را وارد کنید"
                  className="h-12 rounded-xl bg-secondary/60 border-input text-base"
                  autoComplete="name"
                />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-1 flex-col">
                <h1 className="mb-8 text-2xl font-extrabold leading-relaxed">
                  خوش آمدی <span className="text-brand-gradient">{name.trim() || "دوست من"}</span>
                </h1>
                <label htmlFor="ob-email" className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Mail className="h-4 w-4 text-brand" /> جیمیلت چیه؟
                </label>
                <Input
                  id="ob-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="h-12 rounded-xl bg-secondary/60 border-input text-start text-base"
                  autoComplete="email"
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  از ایمیل فقط برای شناسایی حساب و اعلان‌های مهم استفاده می‌کنیم.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col">
                <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold leading-relaxed">
                  <GaugeIcon className="h-6 w-6 text-brand" /> سطح تجربه‌ات چقدره؟
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">محتوای اپ را متناسب با سطح شما شخصی‌سازی می‌کنیم.</p>
                <div className="flex flex-col gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLevel(l.id);
                        setError("");
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border p-4 text-start transition-all",
                        level === l.id
                          ? "border-brand bg-brand/10 shadow-[0_0_20px_-6px_var(--brand)]"
                          : "border-border bg-card hover:border-brand/40"
                      )}
                      aria-pressed={level === l.id}
                    >
                      <span>
                        <span className="block font-bold">{l.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{l.desc}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border transition",
                          level === l.id ? "border-brand bg-brand text-primary-foreground" : "border-border"
                        )}
                      >
                        {level === l.id && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-1 flex-col">
                <h1 className="mb-2 flex items-center gap-2 text-2xl font-extrabold leading-relaxed">
                  <Target className="h-6 w-6 text-brand" /> هدف از استفاده چیه؟
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">صفحه اصلی و تحلیل‌ها حول همین هدف ساخته می‌شوند.</p>
                <div className="flex flex-col gap-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setGoal(g.id);
                        setError("");
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border p-4 text-start transition-all",
                        goal === g.id
                          ? "border-brand bg-brand/10 shadow-[0_0_20px_-6px_var(--brand)]"
                          : "border-border bg-card hover:border-brand/40"
                      )}
                      aria-pressed={goal === g.id}
                    >
                      <span>
                        <span className="block font-bold">{g.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{g.desc}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border transition",
                          goal === g.id ? "border-brand bg-brand text-primary-foreground" : "border-border"
                        )}
                      >
                        {goal === g.id && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  ))}
                </div>

                {/* پیش‌نمایش حرکت‌های بازار مثل دیزاین */}
                <div className="mt-7">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-up" /> پرسودترین‌ها
                  </p>
                  <div className="flex flex-col gap-2">
                    {(movers.gainers.length ? movers.gainers : []).map((q) => (
                      <div key={q.symbol} className="flex items-center gap-3 rounded-xl border border-border bg-card/70 px-3 py-2.5">
                        <AssetIcon symbol={q.symbol} size={34} />
                        <div className="flex-1">
                          <p className="num text-sm font-bold">{q.symbol}</p>
                          <p className="text-[11px] text-muted-foreground">{q.name}</p>
                        </div>
                        <Sparkline data={q.spark} up={q.changePercent >= 0} width={64} height={24} />
                        <p className="num w-20 text-end text-sm font-bold" dir="ltr">
                          ${q.price.toFixed(q.decimals)}
                        </p>
                        <span className="num rounded-md bg-up/10 px-1.5 py-0.5 text-xs font-bold text-up" dir="ltr">
                          +{q.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="relative z-10 px-6 pb-8 pt-2">
        <Button
          onClick={next}
          disabled={createProfile.isPending}
          className="h-13 w-full rounded-2xl bg-brand-gradient text-base font-bold text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)] transition hover:opacity-90"
        >
          {createProfile.isPending ? "در حال ذخیره..." : step === 3 ? "شروع کنیم" : "ادامه"}
        </Button>
        {canSkip && (
          <button
            onClick={skipOnboarding}
            className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            رد کردن
          </button>
        )}
      </footer>
    </div>
  );
}
