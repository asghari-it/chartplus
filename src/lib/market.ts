// موتور بازار — قیمت زنده (بایننس) با فالبک شبیه‌سازی واقع‌گرایانه
import type { Asset, Candle, Quote, Timeframe } from "./types";

// ---------- رجیستری دارایی‌ها ----------
export const ASSETS: Asset[] = [
  // ارزهای دیجیتال
  { symbol: "BTC", faName: "بیت‌کوین", enName: "Bitcoin", category: "crypto", basePrice: 97250, volatility: 0.022, decimals: 2, binance: "BTCUSDT", icon: "BTC" },
  { symbol: "ETH", faName: "اتریوم", enName: "Ethereum", category: "crypto", basePrice: 3412, volatility: 0.028, decimals: 2, binance: "ETHUSDT", icon: "ETH" },
  { symbol: "SOL", faName: "سولانا", enName: "Solana", category: "crypto", basePrice: 194.5, volatility: 0.035, decimals: 2, binance: "SOLUSDT", icon: "SOL" },
  { symbol: "BNB", faName: "بی‌ان‌بی", enName: "BNB", category: "crypto", basePrice: 645, volatility: 0.024, decimals: 2, binance: "BNBUSDT", icon: "BNB" },
  { symbol: "XRP", faName: "ریپل", enName: "XRP", category: "crypto", basePrice: 2.38, volatility: 0.032, decimals: 4, binance: "XRPUSDT", icon: "XRP" },
  { symbol: "DOGE", faName: "دوج‌کوین", enName: "Dogecoin", category: "crypto", basePrice: 0.318, volatility: 0.045, decimals: 4, binance: "DOGEUSDT", icon: "DOGE" },
  { symbol: "SHIB", faName: "شیبا اینو", enName: "Shiba Inu", category: "crypto", basePrice: 0.0000221, volatility: 0.05, decimals: 7, binance: "SHIBUSDT", icon: "SHIB" },
  { symbol: "ADA", faName: "کاردانو", enName: "Cardano", category: "crypto", basePrice: 0.962, volatility: 0.034, decimals: 4, binance: "ADAUSDT", icon: "ADA" },
  { symbol: "AVAX", faName: "آوالانچ", enName: "Avalanche", category: "crypto", basePrice: 38.7, volatility: 0.038, decimals: 2, binance: "AVAXUSDT", icon: "AVAX" },
  { symbol: "TON", faName: "تون‌کوین", enName: "Toncoin", category: "crypto", basePrice: 5.14, volatility: 0.03, decimals: 3, binance: "TONUSDT", icon: "TON" },
  { symbol: "LINK", faName: "چین‌لینک", enName: "Chainlink", category: "crypto", basePrice: 22.4, volatility: 0.033, decimals: 2, binance: "LINKUSDT", icon: "LINK" },
  { symbol: "DOT", faName: "پولکادات", enName: "Polkadot", category: "crypto", basePrice: 6.92, volatility: 0.031, decimals: 3, binance: "DOTUSDT", icon: "DOT" },
  // فلزات
  { symbol: "GOLD", faName: "طلا (اونس)", enName: "Gold", category: "metals", basePrice: 2648, volatility: 0.006, decimals: 2 },
  { symbol: "SILVER", faName: "نقره (اونس)", enName: "Silver", category: "metals", basePrice: 30.85, volatility: 0.011, decimals: 2 },
  // شاخص‌ها
  { symbol: "SPX", faName: "اس‌اند‌پی ۵۰۰", enName: "S&P 500", category: "indices", basePrice: 5921, volatility: 0.008, decimals: 1 },
  { symbol: "NDX", faName: "نزدک ۱۰۰", enName: "Nasdaq 100", category: "indices", basePrice: 21045, volatility: 0.01, decimals: 1 },
  { symbol: "DJI", faName: "داو جونز", enName: "Dow Jones", category: "indices", basePrice: 43520, volatility: 0.007, decimals: 1 },
  // فارکس
  { symbol: "EURUSD", faName: "یورو / دلار", enName: "EUR/USD", category: "forex", basePrice: 1.0524, volatility: 0.0035, decimals: 4 },
  { symbol: "GBPUSD", faName: "پوند / دلار", enName: "GBP/USD", category: "forex", basePrice: 1.2631, volatility: 0.004, decimals: 4 },
  { symbol: "USDJPY", faName: "دلار / ین", enName: "USD/JPY", category: "forex", basePrice: 154.32, volatility: 0.004, decimals: 2 },
];

const ASSET_MAP = new Map(ASSETS.map((a) => [a.symbol, a]));

export function getAsset(symbol: string): Asset | undefined {
  return ASSET_MAP.get(symbol.toUpperCase());
}

// ---------- ابزار تصادفی قابل تکرار ----------
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- وضعیت شبیه‌سازی در حافظه ----------
type SimState = {
  price: number;
  dayOpen: number;
  spark: number[];
  lastTick: number;
  day: string;
};

const simStates = new Map<string, SimState>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function initSim(asset: Asset): SimState {
  const rnd = mulberry32(hashSeed(asset.symbol + todayKey()));
  // قیمت بازِ روز با انحراف تصادفی از قیمت پایه
  const dayOpen = asset.basePrice * (1 + (rnd() - 0.5) * asset.volatility * 1.6);
  const spark: number[] = [];
  let p = dayOpen;
  for (let i = 0; i < 32; i++) {
    p *= 1 + (rnd() - 0.5) * asset.volatility * 0.35;
    spark.push(p);
  }
  const now = Date.now();
  return { price: p, dayOpen, spark, lastTick: now, day: todayKey() };
}

function tickSim(asset: Asset, state: SimState): SimState {
  const now = Date.now();
  const day = todayKey();
  if (state.day !== day) {
    return initSim(asset);
  }
  const elapsed = Math.min(now - state.lastTick, 60_000);
  if (elapsed < 2500) return state;
  // قدم تصادفی متناسب با زمان گذشته
  const steps = Math.max(1, Math.round(elapsed / 2500));
  let p = state.price;
  const rnd = mulberry32(hashSeed(asset.symbol + Math.floor(now / 2500)));
  for (let i = 0; i < steps; i++) {
    p *= 1 + (rnd() - 0.5) * asset.volatility * 0.09;
  }
  const spark = [...state.spark, p].slice(-32);
  return { ...state, price: p, spark, lastTick: now, day };
}

// ---------- تلاش برای قیمت زنده بایننس ----------
type LiveCache = { data: Map<string, { price: number; changePercent: number; high: number; low: number; volume: number }>; ts: number };
let liveCache: LiveCache | null = null;
const LIVE_TTL = 15_000;

async function fetchBinanceLive(symbols: Asset[]): Promise<LiveCache | null> {
  if (liveCache && Date.now() - liveCache.ts < LIVE_TTL) return liveCache;
  const pairs = symbols.filter((a) => a.binance).map((a) => a.binance!);
  if (pairs.length === 0) return null;
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    if (!res.ok) throw new Error("binance http " + res.status);
    const rows = (await res.json()) as Array<{ symbol: string; lastPrice: string; priceChangePercent: string; highPrice: string; lowPrice: string; quoteVolume: string }>;
    const data = new Map<string, { price: number; changePercent: number; high: number; low: number; volume: number }>();
    for (const r of rows) {
      data.set(r.symbol, {
        price: parseFloat(r.lastPrice),
        changePercent: parseFloat(r.priceChangePercent),
        high: parseFloat(r.highPrice),
        low: parseFloat(r.lowPrice),
        volume: parseFloat(r.quoteVolume),
      });
    }
    liveCache = { data, ts: Date.now() };
    return liveCache;
  } catch {
    return null;
  }
}

// ---------- خروجی کوت (قیمت) ----------
export async function getQuotes(): Promise<{ quotes: Quote[]; updatedAt: number }> {
  const cryptos = ASSETS.filter((a) => a.category === "crypto");
  const live = await fetchBinanceLive(cryptos);
  const now = Date.now();
  const quotes: Quote[] = ASSETS.map((asset) => {
    const liveRow = asset.binance ? live?.data.get(asset.binance) : undefined;
    if (liveRow) {
      const sparkBase = simStates.get(asset.symbol);
      const spark = sparkBase ? sparkBase.spark : Array.from({ length: 32 }, (_, i) => liveRow.price * (1 + Math.sin(i / 4) * 0.004));
      return {
        symbol: asset.symbol,
        name: asset.faName,
        enName: asset.enName,
        category: asset.category,
        price: liveRow.price,
        change: (liveRow.price * liveRow.changePercent) / 100,
        changePercent: liveRow.changePercent,
        high24h: liveRow.high,
        low24h: liveRow.low,
        volume24h: liveRow.volume,
        marketCap: null,
        spark,
        decimals: asset.decimals,
        live: true,
      };
    }
    // شبیه‌سازی
    let state = simStates.get(asset.symbol);
    if (!state) {
      state = initSim(asset);
      simStates.set(asset.symbol, state);
    }
    state = tickSim(asset, state);
    simStates.set(asset.symbol, state);
    const change = state.price - state.dayOpen;
    const changePercent = (change / state.dayOpen) * 100;
    return {
      symbol: asset.symbol,
      name: asset.faName,
      enName: asset.enName,
      category: asset.category,
      price: state.price,
      change,
      changePercent,
      high24h: Math.max(state.dayOpen, ...state.spark) * 1.001,
      low24h: Math.min(state.dayOpen, ...state.spark) * 0.999,
      volume24h: null,
      marketCap: null,
      spark: state.spark,
      decimals: asset.decimals,
      live: false,
    };
  });
  return { quotes, updatedAt: now };
}

// ---------- کندل‌ها ----------
const TF_TO_BINANCE: Record<Timeframe, string> = { "1H": "1h", "4H": "4h", "1D": "1d", "1W": "1w" };
const TF_MINUTES: Record<Timeframe, number> = { "1H": 60, "4H": 240, "1D": 1440, "1W": 10080 };

async function fetchBinanceKlines(asset: Asset, tf: Timeframe, limit: number): Promise<Candle[] | null> {
  if (!asset.binance) return null;
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${asset.binance}&interval=${TF_TO_BINANCE[tf]}&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500), cache: "no-store" });
    if (!res.ok) throw new Error("klines http " + res.status);
    const rows = (await res.json()) as unknown[][];
    return rows.map((r) => ({
      t: Number(r[0]),
      o: parseFloat(String(r[1])),
      h: parseFloat(String(r[2])),
      l: parseFloat(String(r[3])),
      c: parseFloat(String(r[4])),
      v: parseFloat(String(r[5])),
    }));
  } catch {
    return null;
  }
}

// تولید کندل شبیه‌سازی‌شده با سید ثابت (در طول روز پایدار است)
function simulateCandles(asset: Asset, tf: Timeframe, limit: number, endPrice: number): Candle[] {
  const rnd = mulberry32(hashSeed(asset.symbol + tf + todayKey()));
  const candles: Candle[] = [];
  const stepMs = TF_MINUTES[tf] * 60_000;
  const now = Math.floor(Date.now() / stepMs) * stepMs;
  let price = 100;
  let trend = 0;
  const count = limit + 20;
  for (let i = 0; i < count; i++) {
    if (rnd() < 0.06) trend = (rnd() - 0.48) * asset.volatility * 1.4;
    const drift = trend + (rnd() - 0.5) * asset.volatility * 0.9;
    const o = price;
    const c = o * (1 + drift);
    const wick = asset.volatility * 0.5 * rnd();
    const h = Math.max(o, c) * (1 + wick);
    const l = Math.min(o, c) * (1 - wick * rnd());
    const range = Math.abs(c - o) / o;
    const v = (0.4 + range * 40 + rnd()) * 1000;
    candles.push({ t: now - (count - 1 - i) * stepMs, o, h, l, c, v });
    price = c;
  }
  // مقیاس‌دهی تا آخرین کندل با قیمت فعلی برابر شود
  const factor = endPrice / candles[candles.length - 1].c;
  return candles
    .slice(-limit)
    .map((k) => ({ t: k.t, o: k.o * factor, h: k.h * factor, l: k.l * factor, c: k.c * factor, v: k.v }));
}

export async function getCandles(symbol: string, tf: Timeframe, limit = 120): Promise<{ candles: Candle[]; live: boolean; price: number }> {
  const asset = getAsset(symbol);
  if (!asset) throw new Error("نماد یافت نشد");
  // قیمت فعلی (زنده یا شبیه‌سازی)
  const { quotes } = await getQuotes();
  const q = quotes.find((x) => x.symbol === asset.symbol);
  const currentPrice = q?.price ?? asset.basePrice;

  const liveKlines = await fetchBinanceKlines(asset, tf, limit);
  if (liveKlines && liveKlines.length > 10) {
    return { candles: liveKlines, live: true, price: currentPrice };
  }
  return { candles: simulateCandles(asset, tf, limit, currentPrice), live: false, price: currentPrice };
}

// برای تحلیل AI: خلاصه متنی از وضعیت بازار یک دارایی
export function buildMarketContext(symbol: string, candles: Candle[], quote?: Quote): string {
  const asset = getAsset(symbol);
  if (!asset) return "";
  const recent = candles.slice(-30);
  const first = recent[0]?.c ?? asset.basePrice;
  const last = recent[recent.length - 1]?.c ?? asset.basePrice;
  const periodChange = ((last - first) / first) * 100;
  const highs = recent.map((c) => c.h);
  const lows = recent.map((c) => c.l);
  const hi = Math.max(...highs);
  const lo = Math.min(...lows);
  const avgVol = recent.reduce((s, c) => s + c.v, 0) / recent.length;
  const lines = [
    `نماد: ${asset.symbol} (${asset.faName} / ${asset.enName})`,
    `قیمت فعلی: ${last.toFixed(asset.decimals)} دلار`,
    quote ? `تغییر ۲۴ ساعت: ${quote.changePercent.toFixed(2)}%` : "",
    `تغییر در بازه ${candles.length} کندل اخیر: ${periodChange.toFixed(2)}%`,
    `بیشترین قیمت بازه: ${hi.toFixed(asset.decimals)} — کمترین قیمت بازه: ${lo.toFixed(asset.decimals)}`,
    `فاصله از سقف بازه: ${(((last - hi) / hi) * 100).toFixed(2)}% — فاصله از کف بازه: ${(((last - lo) / lo) * 100).toFixed(2)}%`,
    `میانگین حجم: ${avgVol.toFixed(0)}`,
  ];
  return lines.filter(Boolean).join("\n");
}
