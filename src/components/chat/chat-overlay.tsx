"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, History, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogoMark } from "@/components/logo";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/lib/store";
import {
  useChatMessages,
  useChatSessions,
  useDeleteChatSession,
  useSendMessage,
} from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import type { ProfileDTO } from "@/lib/types";
import { LEVEL_LABELS } from "@/lib/types";

type LocalMessage = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "وضعیت بیت‌کوین امروز چطوره؟",
  "اندیکاتور RSI چیه و چطور استفاده کنم؟",
  "حد ضرر رو چطور تعیین کنم؟",
  "یه پلن معاملاتی ساده پیشنهاد بده",
];

export function ChatOverlay({ profile }: { profile: ProfileDTO }) {
  const { chatOpen, closeChat, chatPrefill, clearChatPrefill } = useAppStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const { data: serverMessages } = useChatMessages(chatOpen ? sessionId : null);
  const { data: sessionsData } = useChatSessions();
  const deleteSession = useDeleteChatSession();
  const send = useSendMessage();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // پیام‌ها: سمت سرور + پیام‌های بهینه محلی (بدون تکرار بر اساس id یا محتوا)
  const messages: LocalMessage[] = useMemo(() => {
    const server = (serverMessages?.messages ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content }));
    const serverKeys = new Set(server.map((m) => m.id));
    const serverContents = new Set(server.map((m) => `${m.role}:${m.content}`));
    const extra = localMessages.filter((m) => !serverKeys.has(m.id) && !serverContents.has(`${m.role}:${m.content}`));
    return [...server, ...extra];
  }, [serverMessages, localMessages]);

  // پاک‌کردن وضعیت هنگام بستن
  useEffect(() => {
    if (!chatOpen) {
      setLocalMessages([]);
      setInput("");
    }
  }, [chatOpen]);

  // پیش‌پرکردن ورودی
  useEffect(() => {
    if (chatOpen && chatPrefill) {
      setInput(chatPrefill);
      clearChatPrefill();
      inputRef.current?.focus();
    }
  }, [chatOpen, chatPrefill, clearChatPrefill]);

  // اسکرول به پایین
  useEffect(() => {
    if (chatOpen) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages.length, chatOpen, send.isPending]);

  const submit = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || send.isPending) return;
    setInput("");
    const optimisticId = `local-${Date.now()}`;
    setLocalMessages((prev) => [
      ...prev,
      { id: optimisticId, role: "user", content: msg },
      { id: `${optimisticId}-typing`, role: "assistant", content: "__TYPING__" },
    ]);
    send.mutate(
      { sessionId: sessionId ?? undefined, message: msg },
      {
        onSuccess: (res) => {
          setSessionId(res.sessionId);
          setLocalMessages((prev) => [
            ...prev.filter((m) => m.id !== `${optimisticId}-typing`),
            { id: res.assistant.id, role: "assistant", content: res.assistant.content },
          ]);
        },
        onError: () => {
          setLocalMessages((prev) => [
            ...prev.filter((m) => m.id !== `${optimisticId}-typing`),
            { id: `${optimisticId}-err`, role: "assistant", content: "ارسال پیام ممکن نشد؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید." },
          ]);
        },
      }
    );
  };

  return (
    <>
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[80] flex flex-col bg-background"
            role="dialog"
            aria-label="گفتگو با دستیار هوشمند"
          >
            <div className="mx-auto flex h-full w-full max-w-md flex-col">
            {/* هدر */}
            <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
              <button
                onClick={closeChat}
                aria-label="بستن گفتگو"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
              >
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <LogoMark size={30} />
              <div className="flex-1">
                <h2 className="text-sm font-extrabold">دستیار هوشمند chartplus</h2>
                <p className="text-[10px] text-muted-foreground">تحلیل بازار · پاسخ به سؤال · آموزش</p>
              </div>
              <button
                onClick={() => setSessionsOpen(true)}
                aria-label="تاریخچه گفتگوها"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-brand"
              >
                <History className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => {
                  setSessionId(null);
                  setLocalMessages([]);
                }}
                aria-label="گفتگوی جدید"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-[0_4px_14px_-4px_var(--brand)]"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </header>

            {/* پیام‌ها */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4" dir="rtl">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                  <div className="animate-pulse-glow">
                    <LogoMark size={64} />
                  </div>
                  <div>
                    <p className="font-extrabold">سلام {profile.name}! چطور می‌تونم کمکت کنم؟</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      دستیار تو با سطح «{LEVEL_LABELS[profile.level]}» تنظیم شده است.
                    </p>
                  </div>
                  <div className="flex w-full max-w-xs flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold transition hover:border-brand/50 hover:bg-brand/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {messages.map((m) =>
                    m.content === "__TYPING__" ? (
                      <li key={m.id} className="flex items-start gap-2">
                        <span className="flex items-center gap-1 rounded-2xl rounded-ss-sm border border-border bg-card px-4 py-3">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </span>
                      </li>
                    ) : (
                      <li key={m.id} className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}>
                        {m.role === "user" ? (
                          <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ss-sm bg-brand-gradient px-4 py-2.5 text-sm font-medium leading-relaxed text-primary-foreground">
                            {m.content}
                          </div>
                        ) : (
                          <div className="max-w-[88%] rounded-2xl rounded-se-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed [&_li]:ms-4 [&_li]:list-disc [&_ol]:mt-2 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1 [&_p]:mt-2 [&_p:first-child]:mt-0 [&_strong]:font-bold [&_ul]:mt-2 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            {/* ورودی */}
            <footer className="border-t border-border bg-card/80 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="mx-auto flex max-w-md items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="سوالت را بپرس..."
                  aria-label="متن پیام"
                  className="h-12 flex-1 rounded-2xl border-input bg-background/70"
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || send.isPending}
                  aria-label="ارسال"
                  className="h-12 w-12 shrink-0 rounded-2xl bg-brand-gradient text-primary-foreground shadow-[0_6px_18px_-6px_var(--brand)] disabled:opacity-40"
                >
                  <Send className="h-5 w-5 -scale-x-100" />
                </Button>
              </form>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                پاسخ‌ها صرفاً آموزشی است و توصیه سرمایه‌گذاری نیست.
              </p>
            </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* کشوی تاریخچه */}
      <Sheet open={sessionsOpen} onOpenChange={setSessionsOpen}>
        <SheetContent side="right" className="w-full max-w-sm border-border bg-card p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base font-extrabold">
              <History className="h-4.5 w-4.5 text-brand" /> تاریخچه گفتگوها
            </SheetTitle>
          </SheetHeader>
          <div className="max-h-full overflow-y-auto p-4">
            <Button
              onClick={() => {
                setSessionId(null);
                setLocalMessages([]);
                setSessionsOpen(false);
              }}
              className="mb-4 w-full rounded-xl bg-brand-gradient font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> گفتگوی جدید
            </Button>
            {(sessionsData?.sessions.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-xs text-muted-foreground">
                <Sparkles className="h-8 w-8 opacity-40" />
                هنوز گفتگویی نداشته‌اید.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {sessionsData!.sessions.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-xl border p-3 transition",
                      sessionId === s.id ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"
                    )}
                  >
                    <button
                      onClick={() => {
                        setLocalMessages([]);
                        setSessionId(s.id);
                        setSessionsOpen(false);
                      }}
                      className="flex-1 text-start"
                    >
                      <p className="line-clamp-1 text-xs font-bold">{s.title}</p>
                      <p className="num mt-1 text-[10px] text-muted-foreground">
                        {s.messageCount} پیام · {new Date(s.updatedAt).toLocaleDateString("fa-IR")}
                      </p>
                    </button>
                    <button
                      onClick={() => deleteSession.mutate(s.id)}
                      aria-label={`حذف گفتگوی ${s.title}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
