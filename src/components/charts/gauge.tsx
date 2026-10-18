"use client";

// گیج دایره‌ای برای درصد اعتماد / پیشرفت
export function Gauge({
  value,
  size = 96,
  stroke = 9,
  label,
  sublabel,
  color,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const v = Math.min(Math.max(value, 0), 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  const ringColor = color ?? (v >= 65 ? "var(--up)" : v >= 40 ? "var(--brand)" : "var(--down)");

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {label !== undefined && <span className="num text-lg font-bold leading-none" style={{ fontSize: size * 0.24 }}>{label}</span>}
        {sublabel && <span className="text-muted-foreground" style={{ fontSize: Math.max(size * 0.11, 9) }}>{sublabel}</span>}
      </div>
    </div>
  );
}
