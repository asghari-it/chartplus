"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, CandlestickChart, CheckCircle2, ChevronLeft, Lightbulb, LineChart, PiggyBank, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge } from "@/components/charts/gauge";
import { useLessonProgress, useToggleLesson } from "@/hooks/use-queries";
import { useAppStore } from "@/lib/store";
import { allLessons, lessonCategories, type Lesson } from "@/lib/lessons";
import { dailyTips } from "@/lib/tips";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof CandlestickChart> = {
  candles: CandlestickChart,
  indicators: LineChart,
  money: Wallet,
  psychology: Brain,
};

const CATEGORY_TINTS: Record<string, string> = {
  candles: "text-brand bg-brand/15",
  indicators: "text-chart-4 bg-chart-4/15",
  money: "text-up bg-up/15",
  psychology: "text-chart-3 bg-chart-3/15",
};

export function LearnTab() {
  const { data: progressData } = useLessonProgress();
  const toggleLesson = useToggleLesson();
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const { openChat } = useAppStore();

  const progress = progressData?.progress ?? {};
  const completed = useMemo(() => Object.values(progress).filter(Boolean).length, [progress]);
  const percent = Math.round((completed / allLessons.length) * 100);

  // نکته روز — بر اساس روز سال
  const tip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return dailyTips[dayOfYear % dailyTips.length];
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* کارت پیشرفت کلی */}
      <Card className="card-glow border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <Gauge value={percent || 4} size={96} label={`${percent}%`} sublabel="میزان بازار" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold">از مدرسه تریدینگ chartplus</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {completed > 0
                ? `${completed} درس از ${allLessons.length} درس را کامل کرده‌ای. ادامه بده!`
                : "سفر یادگیری‌ات را با اولین درس شروع کن؛ بازار منتظر توئه."}
            </p>
            <button
              onClick={() => openChat("یه نقشه راه برای یادگیری ترید پیشنهاد بده")}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand transition hover:bg-brand/20"
            >
              <Brain className="h-3.5 w-3.5" /> نقشه راه با دستیار
            </button>
          </div>
        </CardContent>
      </Card>

      {/* نکته روز */}
      <Card className="border-amber-400/30 bg-amber-400/5">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
            <Lightbulb className="h-4.5 w-4.5 text-amber-400" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-amber-400">نکته روز — {tip.category}</p>
            <p className="mt-1 text-sm font-bold leading-relaxed">{tip.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tip.text}</p>
          </div>
        </CardContent>
      </Card>

      {/* دوره‌های آموزشی */}
      <section aria-label="دوره‌های آموزشی">
        <h2 className="mb-3 px-1 text-sm font-extrabold">دوره‌های آموزشی</h2>
        <div className="flex flex-col gap-3">
          {lessonCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon] ?? BookOpen;
            const done = cat.lessons.filter((l) => progress[l.id]).length;
            const total = cat.lessons.length;
            return (
              <Card key={cat.id} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", CATEGORY_TINTS[cat.icon])}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold">{cat.title}</p>
                      <p className="num text-[11px] text-muted-foreground">درس {done} از {total}</p>
                    </div>
                    <span className="num rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      {total > 0 ? Math.round((done / total) * 100) : 0}٪
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand-gradient transition-all duration-700"
                      style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                    />
                  </div>

                  {/* فهرست درس‌ها */}
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {cat.lessons.map((lesson) => {
                      const isDone = !!progress[lesson.id];
                      return (
                        <li key={lesson.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border p-2.5 transition",
                              isDone ? "border-up/30 bg-up/5" : "border-border bg-background/40 hover:border-brand/40"
                            )}
                          >
                            <button
                              onClick={() => setOpenLesson(lesson)}
                              className="flex min-w-0 flex-1 items-center gap-2.5 text-start"
                              aria-label={`مشاهده درس ${lesson.title}`}
                            >
                              <span
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                  isDone ? "bg-up/20 text-up" : "bg-secondary text-muted-foreground"
                                )}
                              >
                                {isDone ? <CheckCircle2 className="h-4 w-4" /> : lesson.id.split("-")[1]}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={cn("block truncate text-xs font-bold", isDone && "text-muted-foreground line-through")}>
                                  {lesson.title}
                                </span>
                                <span className="num mt-0.5 block text-[10px] text-muted-foreground">
                                  {lesson.duration} دقیقه · {lesson.difficulty}
                                </span>
                              </span>
                              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* نمایشگر درس */}
      <AnimatePresence>
        {openLesson && (
          <LessonViewer
            lesson={openLesson}
            completed={!!progress[openLesson.id]}
            onToggle={() => toggleLesson.mutate({ lessonId: openLesson.id, completed: !progress[openLesson.id] })}
            onClose={() => setOpenLesson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonViewer({
  lesson,
  completed,
  onToggle,
  onClose,
}: {
  lesson: Lesson;
  completed: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[75] flex flex-col bg-background"
      role="dialog"
      aria-label={`درس ${lesson.title}`}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onClose}
          aria-label="بستن درس"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
        >
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-extrabold">{lesson.title}</h2>
          <p className="num text-[10px] text-muted-foreground">
            {lesson.duration} دقیقه · {lesson.difficulty}
          </p>
        </div>
        <PiggyBank className="h-5 w-5 text-brand/60" aria-hidden="true" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <p className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">{lesson.description}</p>

        {lesson.sections.map((sec, i) => (
          <section key={i} className="mt-5" aria-label={sec.heading}>
            <h3 className="flex items-center gap-2 text-sm font-extrabold">
              <span className="num flex h-6 w-6 items-center justify-center rounded-lg bg-brand/15 text-[10px] font-bold text-brand">
                {i + 1}
              </span>
              {sec.heading}
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              {sec.body.map((p, j) => (
                <p key={j} className="text-xs leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
            {sec.bullets && (
              <ul className="mt-3 flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3">
                {sec.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {sec.example && (
              <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
                <p className="text-[10px] font-extrabold text-brand">مثال کاربردی</p>
                <p className="mt-1 text-xs leading-relaxed">{sec.example}</p>
              </div>
            )}
          </section>
        ))}

        {/* جمع‌بندی */}
        <div className="mt-6 rounded-2xl border border-up/30 bg-up/5 p-4">
          <p className="text-xs font-extrabold text-up">نکات کلیدی که باید به خاطر بسپاری</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {lesson.keyTakeaways.map((k, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-up" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="border-t border-border bg-card/80 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl">
        <button
          onClick={onToggle}
          className={cn(
            "w-full rounded-2xl py-3.5 text-sm font-extrabold transition",
            completed
              ? "border border-up/40 bg-up/10 text-up"
              : "bg-brand-gradient text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)] hover:opacity-90"
          )}
        >
          {completed ? "کامل شد — برگرد به فهرست" : "این درس را کامل خواندم"}
        </button>
      </footer>
      </div>
    </motion.div>
  );
}
