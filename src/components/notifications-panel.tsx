"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useAlerts, useDeleteAlert, useUpdateAlert } from "@/hooks/use-queries";
import { AssetIcon } from "@/components/asset-icon";
import { cn } from "@/lib/utils";
import type { ProfileDTO } from "@/lib/types";

export function NotificationsPanel({ profile }: { profile: ProfileDTO }) {
  const { notificationsOpen, setNotificationsOpen } = useAppStore();
  const { data } = useAlerts();
  const deleteAlert = useDeleteAlert();
  const updateAlert = useUpdateAlert();

  const alerts = data?.alerts ?? [];
  const active = alerts.filter((a) => !a.triggered);
  const triggered = alerts.filter((a) => a.triggered);

  const open = () => {
    setNotificationsOpen(true);
    // علامت‌گذاری همه به‌عنوان خوانده‌شده
    const unread = triggered.filter((a) => !a.read);
    unread.forEach((a) => updateAlert.mutate({ id: a.id, read: true }));
  };

  return (
    <Sheet open={notificationsOpen} onOpenChange={(o) => (o ? open() : setNotificationsOpen(false))}>
      <SheetContent side="left" className="w-full max-w-sm border-border bg-card p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base font-extrabold">
            <Bell className="h-4.5 w-4.5 text-brand" /> اعلان‌ها و هشدارها
          </SheetTitle>
        </SheetHeader>

        <div className="flex h-[calc(100%-64px)] flex-col gap-4 overflow-y-auto p-4">
          {!profile.notifications && (
            <div className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <BellOff className="h-4 w-4" /> اعلان‌ها در تنظیمات غیرفعال شده است.
            </div>
          )}

          {/* هشدارهای فعال */}
          <section aria-label="هشدارهای فعال">
            <h3 className="mb-2 text-xs font-bold text-muted-foreground">هشدارهای فعال ({active.length})</h3>
            {active.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                هشدار فعالی ندارید. از بخش تنظیمات می‌توانید هشدار قیمت بسازید.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {active.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
                    <AssetIcon symbol={a.symbol} size={34} />
                    <div className="flex-1 text-xs">
                      <p className="font-bold">
                        {a.symbol} {a.condition === "above" ? "بالاتر از" : "پایین‌تر از"}{" "}
                        <span className="num" dir="ltr">${a.price.toLocaleString("en-US")}</span>
                      </p>
                      <p className="mt-0.5 text-muted-foreground">در انتظار عبور قیمت</p>
                    </div>
                    <button
                      onClick={() => deleteAlert.mutate(a.id)}
                      aria-label={`حذف هشدار ${a.symbol}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* هشدارهای فعال‌شده */}
          <section aria-label="اعلان‌های خوانده‌نشده">
            <h3 className="mb-2 text-xs font-bold text-muted-foreground">اعلان‌ها ({triggered.length})</h3>
            {triggered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                فعلاً اعلانی ندارید.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {triggered.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3",
                      a.read ? "border-border bg-background/60" : "border-brand/50 bg-brand/5"
                    )}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", a.read ? "bg-muted-foreground" : "bg-brand")} />
                    <div className="flex-1 text-xs">
                      <p className="font-bold">هشدار قیمت {a.symbol}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        قیمت از <span className="num" dir="ltr">${a.price.toLocaleString("en-US")}</span>{" "}
                        {a.condition === "above" ? "عبور کرد (بالا)" : "عبور کرد (پایین)"}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteAlert.mutate(a.id)}
                      aria-label="حذف اعلان"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {alerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-auto"
              onClick={() => {
                deleteAlert.mutate(undefined);
              }}
            >
              <Trash2 className="h-4 w-4" /> پاک‌کردن همه
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
