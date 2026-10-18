"use client";

import { useState } from "react";
import {
  Bell,
  ChevronLeft,
  Globe,
  Info,
  LogOut,
  Moon,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/lib/store";
import {
  useAlerts,
  useCreateAlert,
  useDeleteAlert,
  useMarket,
  useResetApp,
  useUpdateProfile,
} from "@/hooks/use-queries";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GOAL_LABELS, LEVEL_LABELS, type ProfileDTO } from "@/lib/types";

export function SettingsTab({ profile }: { profile: ProfileDTO }) {
  const { theme, setTheme } = useTheme();
  const { setActiveTab, setAnalysisSymbol } = useAppStore();
  const updateProfile = useUpdateProfile();
  const resetApp = useResetApp();
  const { data: alertsData } = useAlerts();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const { data: marketData } = useMarket(20_000);
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: profile.name, email: profile.email, level: profile.level, goal: profile.goal });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ symbol: "BTC", condition: "above" as "above" | "below", price: "" });
  const [securityOpen, setSecurityOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const cryptos = (marketData?.quotes ?? []).filter((q) => q.category === "crypto");

  const saveProfile = () => {
    if (form.name.trim().length < 2) {
      toast({ title: "نام کوتاه است", variant: "destructive" });
      return;
    }
    updateProfile.mutate(
      { name: form.name.trim(), email: form.email.trim(), level: form.level, goal: form.goal },
      {
        onSuccess: () => {
          toast({ title: "پروفایل به‌روزرسانی شد" });
          setEditOpen(false);
        },
      }
    );
  };

  const addAlert = () => {
    const price = parseFloat(alertForm.price.replace(/,/g, ""));
    if (!isFinite(price) || price <= 0) {
      toast({ title: "قیمت نامعتبر است", variant: "destructive" });
      return;
    }
    createAlert.mutate(
      { symbol: alertForm.symbol, condition: alertForm.condition, price },
      {
        onSuccess: () => {
          toast({ title: `هشدار قیمت ${alertForm.symbol} ثبت شد` });
          setAlertOpen(false);
          setAlertForm({ symbol: "BTC", condition: "above", price: "" });
        },
        onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
      }
    );
  };

  const doReset = () => {
    resetApp.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "همه داده‌ها پاک شد", description: "اپ به حالت اول بازگشت." });
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* کارت پروفایل */}
      <Card className="card-glow border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-extrabold text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)]">
            {profile.name.trim().charAt(0) || "C"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold">{profile.name}</p>
            <p className="num truncate text-xs text-muted-foreground" dir="ltr">
              {profile.email || "guest@chartplus.app"}
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
              <Star className="h-3 w-3" /> سطح {LEVEL_LABELS[profile.level]}
            </span>
          </div>
          <button
            onClick={() => {
              setForm({ name: profile.name, email: profile.email, level: profile.level, goal: profile.goal });
              setEditOpen(true);
            }}
            aria-label="ویرایش پروفایل"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-brand/50 hover:text-brand"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>

      {/* حساب کاربری */}
      <SettingsGroup title="حساب کاربری">
        <SettingsRow
          icon={<Pencil className="h-4.5 w-4.5" />}
          label="ویرایش پروفایل"
          hint={`${LEVEL_LABELS[profile.level]} · هدف: ${GOAL_LABELS[profile.goal]}`}
          onClick={() => {
            setForm({ name: profile.name, email: profile.email, level: profile.level, goal: profile.goal });
            setEditOpen(true);
          }}
        />
        <SettingsRow
          icon={<Bell className="h-4.5 w-4.5" />}
          label="هشدارهای قیمت"
          hint={`${alertsData?.alerts.length ?? 0} هشدار ثبت‌شده`}
          onClick={() => setAlertOpen(true)}
        />
      </SettingsGroup>

      {/* شخصی‌سازی */}
      <SettingsGroup title="شخصی‌سازی">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              {theme === "light" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </span>
            <div>
              <p className="text-sm font-bold">ظاهر (تیره / روشن)</p>
              <p className="text-[11px] text-muted-foreground">حالت نمایش اپ را انتخاب کن</p>
            </div>
          </div>
          <div className="flex rounded-xl border border-border bg-secondary/60 p-1" role="group" aria-label="انتخاب تم">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition",
                  theme === t ? "bg-brand-gradient text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {t === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                {t === "dark" ? "تیره" : "روشن"}
              </button>
            ))}
          </div>
        </div>
        <SettingsRow icon={<Globe className="h-4.5 w-4.5" />} label="زبان" hint="فارسی" onClick={() => {}} trailing="فارسی" />
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Bell className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">اعلان‌ها</p>
              <p className="text-[11px] text-muted-foreground">اعلان‌های تحلیل و اپ</p>
            </div>
          </div>
          <Switch
            checked={profile.notifications}
            onCheckedChange={(v) => updateProfile.mutate({ notifications: v })}
            aria-label="فعال بودن اعلان‌ها"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Bell className="h-4.5 w-4.5 text-up" />
            </span>
            <div>
              <p className="text-sm font-bold">هشدار قیمت</p>
              <p className="text-[11px] text-muted-foreground">اعلان عبور قیمت از آستانه</p>
            </div>
          </div>
          <Switch
            checked={profile.priceAlerts}
            onCheckedChange={(v) => updateProfile.mutate({ priceAlerts: v })}
            aria-label="فعال بودن هشدار قیمت"
          />
        </div>
      </SettingsGroup>

      {/* فهرست هشدارها */}
      {(alertsData?.alerts.length ?? 0) > 0 && (
        <SettingsGroup title="هشدارهای من">
          {alertsData!.alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn("h-2 w-2 rounded-full", a.triggered ? "bg-down" : "bg-up")} />
              <div className="flex-1 text-xs">
                <span className="num font-bold">{a.symbol}</span>{" "}
                <span className="text-muted-foreground">
                  {a.condition === "above" ? "بالاتر از" : "پایین‌تر از"}{" "}
                  <span className="num" dir="ltr">${a.price.toLocaleString("en-US")}</span>
                </span>
                {a.triggered && <span className="ms-2 rounded bg-down/10 px-1.5 py-0.5 text-[10px] font-bold text-down">فعال شد</span>}
              </div>
              <button
                onClick={() => deleteAlert.mutate(a.id)}
                aria-label={`حذف هشدار ${a.symbol}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </SettingsGroup>
      )}

      {/* امنیت و درباره */}
      <SettingsGroup title="عمومی">
        <SettingsRow icon={<ShieldCheck className="h-4.5 w-4.5" />} label="امنیت" hint="داده‌ها و حریم خصوصی" onClick={() => setSecurityOpen(true)} />
        <SettingsRow icon={<Info className="h-4.5 w-4.5" />} label="درباره chartplus" hint="نسخه ۱.۰.۰" onClick={() => setAboutOpen(true)} />
      </SettingsGroup>

      {/* خروج از حساب */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4.5 w-4.5 -scale-x-100" /> خروج و پاک‌کردن داده‌های من
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>پاک‌کردن همه داده‌ها؟</AlertDialogTitle>
            <AlertDialogDescription>
              پروفایل، تاریخچه چت، تحلیل‌ها و هشدارهای قیمت به‌طور کامل حذف می‌شوند و اپ به صفحه خوش‌آمد بازمی‌گردد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={doReset} className="bg-destructive text-white hover:bg-destructive/90">
              بله، پاک کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="pb-2 text-center text-[10px] text-muted-foreground/60">
        chartplus · نسخه ۱.۰.۰ · ساخته‌شده برای یادگیری و تحلیل
      </p>

      {/* دیالوگ ویرایش پروفایل */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>ویرایش پروفایل</DialogTitle>
            <DialogDescription>اطلاعات و هدف خود را به‌روزرسانی کن.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              نام
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl bg-secondary/60" />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              ایمیل
              <Input dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl bg-secondary/60 text-start" />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              سطح تجربه
              <div className="grid grid-cols-3 gap-2">
                {(["beginner", "intermediate", "professional"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setForm({ ...form, level: l })}
                    className={cn(
                      "rounded-xl border py-2 text-[11px] font-bold transition",
                      form.level === l ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground"
                    )}
                  >
                    {LEVEL_LABELS[l]}
                  </button>
                ))}
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              هدف
              <div className="grid grid-cols-3 gap-2">
                {(["learning", "investing", "trading"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setForm({ ...form, goal: g })}
                    className={cn(
                      "rounded-xl border py-2 text-[11px] font-bold transition",
                      form.goal === g ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground"
                    )}
                  >
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button onClick={saveProfile} disabled={updateProfile.isPending} className="w-full rounded-xl bg-brand-gradient font-bold text-primary-foreground">
              {updateProfile.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ ساخت هشدار */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>ساخت هشدار قیمت</DialogTitle>
            <DialogDescription>وقتی قیمت از آستانه عبور کند، اعلان می‌گیری.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              دارایی
              <select
                value={alertForm.symbol}
                onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value })}
                className="h-11 rounded-xl border border-input bg-secondary/60 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
              >
                {cryptos.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol} — {q.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "above", label: "بالاتر از" },
                  { id: "below", label: "پایین‌تر از" },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAlertForm({ ...alertForm, condition: c.id })}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-bold transition",
                    alertForm.condition === c.id ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
              قیمت (دلار)
              <Input
                dir="ltr"
                inputMode="decimal"
                value={alertForm.price}
                onChange={(e) => setAlertForm({ ...alertForm, price: e.target.value })}
                placeholder="مثلاً 100000"
                className="h-11 rounded-xl bg-secondary/60 text-start"
              />
            </label>
            {(() => {
              const q = cryptos.find((c) => c.symbol === alertForm.symbol);
              return q ? (
                <p className="num text-[11px] text-muted-foreground" dir="ltr">
                  قیمت فعلی: ${q.price.toFixed(q.decimals)}
                </p>
              ) : null;
            })()}
          </div>
          <DialogFooter>
            <Button onClick={addAlert} disabled={createAlert.isPending} className="w-full rounded-xl bg-brand-gradient font-bold text-primary-foreground">
              {createAlert.isPending ? "در حال ثبت..." : "ثبت هشدار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ امنیت */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-up" /> امنیت و حریم خصوصی
            </DialogTitle>
            <DialogDescription asChild>
              <ul className="mt-2 flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
                <li>• همه داده‌های شما (پروفایل، چت، تحلیل‌ها) فقط روی همین دستگاه ذخیره می‌شود.</li>
                <li>• هیچ کلید یا اطلاعات حساب صرافی در اپ وارد یا ذخیره نمی‌شود.</li>
                <li>• داده‌های بازار از منابع عمومی دریافت و تحلیل‌ها توسط هوش مصنوعی تولید می‌شوند.</li>
                <li>• می‌توانید هر زمان از گزینه «خروج» همه داده‌ها را برای همیشه پاک کنید.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecurityOpen(false)} className="w-full rounded-xl">
              متوجه شدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ درباره */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>درباره chartplus</DialogTitle>
            <DialogDescription>
              chartplus یک اپلیکیشن فارسی برای ترید و تحلیل بازارهای جهانی است؛ با قیمت زنده، چارت کندل‌استیک، تحلیل تکنیکال هوش مصنوعی، آموزش مرحله‌ای و هشدار قیمت.
              این نسخه به‌عنوان پروژه نمایشی ساخته شده و تحلیل‌های آن صرفاً آموزشی است و توصیه سرمایه‌گذاری نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setAboutOpen(false);
                setAnalysisSymbol("BTC");
                setActiveTab("analysis");
              }}
              className="w-full rounded-xl bg-brand-gradient font-bold text-primary-foreground"
            >
              شروع تحلیل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دکمه شناور ساخت هشدار سریع */}
      <button
        onClick={() => setAlertOpen(true)}
        className="fixed bottom-24 end-4 z-40 flex h-12 items-center gap-1.5 rounded-full bg-brand-gradient px-4 text-xs font-extrabold text-primary-foreground shadow-[0_10px_28px_-8px_var(--brand)] transition hover:opacity-90 sm:hidden"
      >
        <Plus className="h-4 w-4" /> هشدار قیمت
      </button>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 px-1 text-xs font-bold text-muted-foreground">{title}</h2>
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col divide-y divide-border p-0">{children}</CardContent>
      </Card>
    </section>
  );
}

function SettingsRow({
  icon,
  label,
  hint,
  onClick,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  trailing?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition hover:bg-secondary/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      {trailing && <span className="text-xs text-muted-foreground">{trailing}</span>}
      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
    </button>
  );
}
