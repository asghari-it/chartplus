"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Candle } from "@/lib/types";

export type ChartLevels = {
  support?: number | null;
  resistance?: number | null;
  target?: number | null;
  stopLoss?: number | null;
};

const PAD = { top: 10, right: 52, bottom: 20, left: 8 };
const VOLUME_H = 0.16;

function fmtPrice(v: number, decimals: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: Math.min(decimals, 2), maximumFractionDigits: decimals });
}

function fmtTime(t: number, tf: string) {
  const d = new Date(t);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (tf === "1H" || tf === "4H") {
    const hh = String(d.getHours()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:00`;
  }
  return `${mm}/${dd}`;
}

export function CandleChart({
  candles,
  decimals,
  tf = "4H",
  height = 264,
  levels,
  loading,
}: {
  candles: Candle[];
  decimals: number;
  tf?: string;
  height?: number;
  levels?: ChartLevels;
  loading?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  const [hover, setHover] = useState<{ x: number; idx: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 340;
      setWidth(Math.max(w, 260));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const chart = useMemo(() => {
    if (!candles.length) return null;
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const priceH = innerH * (1 - VOLUME_H);

    let min = Math.min(...candles.map((c) => c.l));
    let max = Math.max(...candles.map((c) => c.h));
    if (levels) {
      const lv = [levels.support, levels.resistance, levels.target, levels.stopLoss].filter(
        (v): v is number => typeof v === "number" && isFinite(v)
      );
      if (lv.length) {
        min = Math.min(min, ...lv);
        max = Math.max(max, ...lv);
      }
    }
    const span = max - min || 1;
    min -= span * 0.04;
    max += span * 0.04;

    const y = (p: number) => PAD.top + priceH - ((p - min) / (max - min)) * priceH;
    const stepX = innerW / candles.length;
    const bodyW = Math.max(stepX * 0.6, 1.5);
    const x = (i: number) => PAD.left + stepX * i + stepX / 2;

    const maxVol = Math.max(...candles.map((c) => c.v)) || 1;
    const volY0 = PAD.top + innerH;
    const volH = innerH * VOLUME_H;
    const vy = (v: number) => volY0 - (v / maxVol) * volH;

    // خطوط شبکه و برچسب قیمت
    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const price = min + ((max - min) / 4) * i;
      return { price, y: y(price) };
    });

    // برچسب‌های زمانی
    const timeIdx: number[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      timeIdx.push(Math.round((i * (candles.length - 1)) / (count - 1)));
    }

    const last = candles[candles.length - 1];

    return { innerW, innerH, priceH, min, max, y, x, stepX, bodyW, vy, volY0, gridLines, timeIdx, last };
  }, [candles, width, height, levels]);

  if (loading) {
    return (
      <div ref={containerRef} className="flex items-center justify-center rounded-xl bg-secondary/40" style={{ height }}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          در حال دریافت چارت...
        </div>
      </div>
    );
  }

  if (!chart || !candles.length) {
    return (
      <div ref={containerRef} className="flex items-center justify-center rounded-xl bg-secondary/40 text-sm text-muted-foreground" style={{ height }}>
        چارتی برای نمایش نیست
      </div>
    );
  }

  const { y, x, bodyW, vy, volY0, gridLines, timeIdx, last } = chart;

  const levelLine = (value: number | null | undefined, color: string, label: string) => {
    if (typeof value !== "number" || !isFinite(value)) return null;
    const ly = y(value);
    if (ly < PAD.top - 4 || ly > PAD.top + chart.priceH + 4) return null;
    return (
      <g key={label}>
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={ly}
          y2={ly}
          stroke={color}
          strokeWidth="1.2"
          strokeDasharray="5 4"
          opacity="0.85"
        />
        <text x={PAD.left + 6} y={ly - 5} fontSize="10" fill={color} fontWeight="600">
          {label}
        </text>
        <rect x={width - PAD.right + 2} y={ly - 8} rx="3" width={PAD.right - 4} height={16} fill={color} opacity="0.16" />
        <text
          x={width - PAD.right + 6}
          y={ly + 4}
          fontSize="9.5"
          fill={color}
          fontWeight="600"
          style={{ direction: "ltr" }}
        >
          {fmtPrice(value, decimals)}
        </text>
      </g>
    );
  };

  const hoverCandle = hover ? candles[hover.idx] : null;

  return (
    <div ref={containerRef} className="relative select-none" dir="ltr">
      <svg
        width={width}
        height={height}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = e.clientX - rect.left;
          const idx = Math.min(Math.max(Math.floor((px - PAD.left) / chart.stepX), 0), candles.length - 1);
          setHover({ x: px, idx });
        }}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`چارت کندل‌استیک با ${candles.length} کندل`}
      >
        {/* شبکه */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={width - PAD.right} y1={g.y} y2={g.y} stroke="var(--border)" strokeWidth="0.6" opacity="0.55" />
            <text x={width - PAD.right + 6} y={g.y + 3.5} fontSize="9.5" fill="var(--muted-foreground)" style={{ direction: "ltr" }}>
              {fmtPrice(g.price, decimals)}
            </text>
          </g>
        ))}

        {/* حجم‌ها */}
        {candles.map((c, i) => (
          <rect
            key={`v${i}`}
            x={x(i) - bodyW / 2}
            y={vy(c.v)}
            width={bodyW}
            height={Math.max(volY0 - vy(c.v), 0.5)}
            fill={c.c >= c.o ? "var(--up)" : "var(--down)"}
            opacity="0.28"
            rx="0.5"
          />
        ))}

        {/* کندل‌ها */}
        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const color = up ? "var(--up)" : "var(--down)";
          const top = y(Math.max(c.o, c.c));
          const bottom = y(Math.min(c.o, c.c));
          return (
            <g key={i}>
              <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" />
              <rect
                x={x(i) - bodyW / 2}
                y={top}
                width={bodyW}
                height={Math.max(bottom - top, 1)}
                fill={color}
                rx="1"
                opacity={up ? 0.95 : 0.9}
              />
            </g>
          );
        })}

        {/* سطوح تحلیل */}
        {levels && levelLine(levels.resistance, "var(--down)", "مقاومت")}
        {levels && levelLine(levels.support, "var(--up)", "حمایت")}
        {levels && levelLine(levels.target, "var(--up)", "هدف")}
        {levels && levelLine(levels.stopLoss, "var(--down)", "حد ضرر")}

        {/* قیمت فعلی */}
        <g>
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(last.c)}
            y2={y(last.c)}
            stroke="var(--brand)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          <rect x={width - PAD.right + 1} y={y(last.c) - 9} rx="4" width={PAD.right - 3} height={18} fill="var(--brand)" />
          <text
            x={width - PAD.right + 6}
            y={y(last.c) + 4}
            fontSize="9.5"
            fill="var(--primary-foreground)"
            fontWeight="700"
            style={{ direction: "ltr" }}
          >
            {fmtPrice(last.c, decimals)}
          </text>
        </g>

        {/* برچسب زمان */}
        {timeIdx.map((idx) => (
          <text
            key={`t${idx}`}
            x={x(idx)}
            y={height - 6}
            fontSize="9"
            fill="var(--muted-foreground)"
            textAnchor="middle"
            style={{ direction: "ltr" }}
          >
            {fmtTime(candles[idx].t, tf)}
          </text>
        ))}

        {/* کراس‌هیر */}
        {hover && (
          <g>
            <line x1={x(hover.idx)} x2={x(hover.idx)} y1={PAD.top} y2={volY0} stroke="var(--muted-foreground)" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.6" />
          </g>
        )}
      </svg>

      {/* تولتیپ */}
      {hover && hoverCandle && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-border bg-popover/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur"
          style={{ left: hover.x > width / 2 ? 8 : undefined, right: hover.x > width / 2 ? undefined : 8, direction: "ltr" }}
        >
          <div className="mb-1 num text-muted-foreground">{fmtTime(hoverCandle.t, tf)}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 num">
            <span className="text-muted-foreground">O</span>
            <span>{fmtPrice(hoverCandle.o, decimals)}</span>
            <span className="text-muted-foreground">H</span>
            <span className="text-up">{fmtPrice(hoverCandle.h, decimals)}</span>
            <span className="text-muted-foreground">L</span>
            <span className="text-down">{fmtPrice(hoverCandle.l, decimals)}</span>
            <span className="text-muted-foreground">C</span>
            <span className={hoverCandle.c >= hoverCandle.o ? "text-up" : "text-down"}>{fmtPrice(hoverCandle.c, decimals)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
