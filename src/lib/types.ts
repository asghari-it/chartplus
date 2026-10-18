// تایپ‌های مشترک اپ chartplus

export type AppTab = "home" | "market" | "analysis" | "learn" | "settings";

export type AssetCategory = "crypto" | "metals" | "indices" | "forex";

export type Asset = {
  symbol: string;
  faName: string;
  enName: string;
  category: AssetCategory;
  basePrice: number;
  volatility: number; // نوسان روزانه نسبی
  decimals: number;
  binance?: string; // نماد در صرافی بایننس
  icon?: string; // شناسه آیکون برای رندر
};

export type Quote = {
  symbol: string;
  name: string;
  enName: string;
  category: AssetCategory;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number | null;
  marketCap: number | null;
  spark: number[];
  decimals: number;
  live: boolean;
};

export type Candle = {
  t: number; // timestamp (ms)
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type Timeframe = "1H" | "4H" | "1D" | "1W";

export type ProfileDTO = {
  id: string;
  name: string;
  email: string;
  level: "beginner" | "intermediate" | "professional";
  goal: "learning" | "investing" | "trading";
  notifications: boolean;
  priceAlerts: boolean;
};

export type AnalysisLevels = {
  support: number | null;
  resistance: number | null;
  target: number | null;
  stopLoss: number | null;
};

export type AnalysisDTO = {
  id: string;
  symbol: string;
  assetName: string;
  source: "image" | "symbol";
  imageData: string | null;
  trend: "bullish" | "bearish" | "neutral";
  confidence: number; // 0..100
  timeframe: string;
  support: number | null;
  resistance: number | null;
  target: number | null;
  stopLoss: number | null;
  summary: string;
  fullText: string;
  createdAt: string;
};

export type ChatMessageDTO = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatSessionDTO = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type DailyBrief = {
  date: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  title: string;
  text: string;
  points: string[];
};

export type AlertDTO = {
  id: string;
  symbol: string;
  condition: "above" | "below";
  price: number;
  triggered: boolean;
  read: boolean;
  createdAt: string;
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  professional: "حرفه‌ای",
};

export const GOAL_LABELS: Record<string, string> = {
  learning: "یادگیری",
  investing: "سرمایه‌گذاری",
  trading: "معامله‌گری",
};
