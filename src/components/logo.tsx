"use client";

// لوگوی chartplus — حرف C از کندل‌ها به‌همراه علامت +
export function LogoMark({ size = 96, animated = false }: { size?: number; animated?: boolean }) {
  const uid = animated ? "a" : "s";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="لوگوی chartplus"
      className={animated ? "animate-pulse-glow" : undefined}
    >
      <defs>
        <linearGradient id={`cp-ring-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id={`cp-bull-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={`cp-bear-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
      </defs>

      {/* حلقه C با گاف سمت راست-بالا برای علامت + */}
      <path
        d="M 87 29.8 A 42 42 0 1 0 87 94.2"
        stroke={`url(#cp-ring-${uid})`}
        strokeWidth="8"
        strokeLinecap="round"
        className={animated ? "logo-line" : undefined}
        style={animated ? undefined : { opacity: 0.95 }}
      />

      {/* کندل‌ها داخل C */}
      <g>
        {/* کندل ۱ (صعودی) */}
        <rect x="30" y="66" width="9" height="26" rx="2.5" fill={`url(#cp-bull-${uid})`} />
        <line x1="34.5" y1="58" x2="34.5" y2="66" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        <line x1="34.5" y1="92" x2="34.5" y2="98" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        {/* کندل ۲ (نزولی) */}
        <rect x="46" y="52" width="9" height="22" rx="2.5" fill={`url(#cp-bear-${uid})`} opacity="0.95" />
        <line x1="50.5" y1="45" x2="50.5" y2="52" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
        <line x1="50.5" y1="74" x2="50.5" y2="80" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
        {/* کندل ۳ (صعودی بلند) */}
        <rect x="62" y="38" width="9" height="30" rx="2.5" fill={`url(#cp-bull-${uid})`} />
        <line x1="66.5" y1="30" x2="66.5" y2="38" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        <line x1="66.5" y1="68" x2="66.5" y2="74" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        {/* کندل ۴ (کوچک نزولی) */}
        <rect x="78" y="46" width="9" height="14" rx="2.5" fill={`url(#cp-bear-${uid})`} opacity="0.9" />
        <line x1="82.5" y1="40" x2="82.5" y2="46" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* علامت + */}
      <g fill="#22d3ee">
        <rect x="94" y="10" width="22" height="7" rx="3.5" />
        <rect x="101.5" y="2.5" width="7" height="22" rx="3.5" />
      </g>
    </svg>
  );
}

export function LogoWordmark({ size = 96, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <div dir="ltr" className="flex flex-col items-center gap-3 select-none">
      <LogoMark size={size} animated={animated} />
      <div className="flex items-baseline gap-1.5 font-extrabold" style={{ fontSize: size * 0.3 }}>
        <span className="text-glow text-foreground">chart</span>
        <span className="text-brand-gradient">plus</span>
      </div>
    </div>
  );
}
