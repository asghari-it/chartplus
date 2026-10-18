"use client";

// آیکون دارایی‌ها — دایره رنگی با نماد (مطابق دیزاین)
const ICON_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  BTC: { bg: "bg-amber-500/15", fg: "text-amber-400", label: "₿" },
  ETH: { bg: "bg-violet-500/15", fg: "text-violet-300", label: "Ξ" },
  SOL: { bg: "bg-cyan-500/15", fg: "text-cyan-300", label: "S" },
  BNB: { bg: "bg-yellow-500/15", fg: "text-yellow-300", label: "B" },
  XRP: { bg: "bg-slate-400/15", fg: "text-slate-300", label: "X" },
  DOGE: { bg: "bg-lime-500/15", fg: "text-lime-300", label: "D" },
  SHIB: { bg: "bg-orange-600/15", fg: "text-orange-300", label: "SH" },
  ADA: { bg: "bg-blue-500/15", fg: "text-blue-300", label: "A" },
  AVAX: { bg: "bg-rose-500/15", fg: "text-rose-300", label: "AV" },
  TON: { bg: "bg-sky-500/15", fg: "text-sky-300", label: "T" },
  LINK: { bg: "bg-indigo-500/15", fg: "text-indigo-300", label: "L" },
  DOT: { bg: "bg-pink-500/15", fg: "text-pink-300", label: "•" },
  GOLD: { bg: "bg-amber-400/15", fg: "text-amber-300", label: "Au" },
  SILVER: { bg: "bg-zinc-400/15", fg: "text-zinc-300", label: "Ag" },
  SPX: { bg: "bg-emerald-500/15", fg: "text-emerald-300", label: "SP" },
  NDX: { bg: "bg-teal-500/15", fg: "text-teal-300", label: "ND" },
  DJI: { bg: "bg-cyan-600/15", fg: "text-cyan-300", label: "DJ" },
  EURUSD: { bg: "bg-blue-400/15", fg: "text-blue-200", label: "€" },
  GBPUSD: { bg: "bg-fuchsia-500/15", fg: "text-fuchsia-300", label: "£" },
  USDJPY: { bg: "bg-red-400/15", fg: "text-red-200", label: "¥" },
};

const FALLBACK_COLORS = ["bg-brand/15 text-brand", "bg-chart-2/15 text-chart-2", "bg-chart-3/15 text-chart-3", "bg-chart-4/15 text-chart-4"];

export function AssetIcon({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const s = ICON_STYLES[symbol] ?? FALLBACK_COLORS[symbol.length % FALLBACK_COLORS.length];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${s.bg} ${s.fg}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {s.label}
    </span>
  );
}
