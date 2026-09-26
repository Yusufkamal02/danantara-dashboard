/**
 * DATA CONTOH — sample market data for the PoC.
 *
 * Every number here is generated or hand-written for layout purposes only.
 * Nothing is sourced from IDX, XBRL or any market feed. Replace this module
 * wholesale when wiring real data; nothing else imports raw numbers.
 *
 * Series are produced by a seeded PRNG so the server render and the client
 * render agree — a Math.random() series would hydrate mismatched.
 */

export interface Candle {
  /** Short month label, e.g. "Sep". */
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Traded lots, in thousands. */
  volume: number;
  /** Relative Strength Index, 14 periods. */
  rsi: number;
  /** MACD histogram (12, 26, 9). */
  macd: number;
}

export interface Quote {
  ticker: string;
  price: number;
  changePct: number;
}

/** Mulberry32 — small deterministic PRNG. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller transform over the seeded uniform stream. */
function gaussian(rnd: () => number): number {
  const u = Math.max(rnd(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

const MONTHS = ["Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"];

export type RangeKey = "1M" | "3M" | "6M" | "1T" | "5T";

export const RANGES: { key: RangeKey; label: string; points: number }[] = [
  { key: "1M", label: "1M", points: 22 },
  { key: "3M", label: "3M", points: 38 },
  { key: "6M", label: "6M", points: 50 },
  { key: "1T", label: "1T", points: 62 },
  { key: "5T", label: "5T", points: 80 },
];

/**
 * Build a candle series ending at roughly `last`, long enough for `points`
 * bars. Longer ranges start further back so the right-hand edge stays put.
 */
export function buildSeries(points: number, seed = 7, last = 4820): Candle[] {
  const rnd = seeded(seed);
  const drift = 0.0032;
  const vol = 0.014;

  // Walk forward from a starting level, then rescale so the final close lands
  // on `last` — keeps the headline quote consistent across ranges.
  const closes: number[] = [];
  let v = 3980;
  for (let i = 0; i < points; i += 1) {
    v *= 1 + gaussian(rnd) * vol + drift;
    closes.push(v);
  }
  const scale = last / closes[closes.length - 1];

  const out: Candle[] = [];
  for (let i = 0; i < points; i += 1) {
    const close = closes[i] * scale;
    const open = i === 0 ? close * 0.995 : closes[i - 1] * scale;
    const high = Math.max(open, close) * (1 + Math.abs(gaussian(rnd)) * 0.006);
    const low = Math.min(open, close) * (1 - Math.abs(gaussian(rnd)) * 0.006);
    const rsi = Math.max(8, Math.min(92, 50 + 28 * Math.sin(i / 6.5) + gaussian(rnd) * 4));
    const macd = Math.sin(i / 7) * 26 + gaussian(rnd) * 4;
    const volume = (Math.abs(gaussian(rnd)) + 0.25) * 1_240;

    out.push({
      label: MONTHS[Math.floor((i / points) * MONTHS.length)] ?? "Sep",
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume: Math.round(volume),
      rsi: Number(rsi.toFixed(1)),
      macd: Number(macd.toFixed(2)),
    });
  }
  return out;
}

function round(n: number): number {
  return Math.round(n);
}

/** Simple moving average, aligned to the right edge of the window. */
export function sma(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let k = i - window + 1; k <= i; k += 1) sum += values[k];
    return sum / window;
  });
}

/** The market-pulse strip across the top of every screen. */
export const TICKER_TAPE: Quote[] = [
  { ticker: "IHSG", price: 8142.6, changePct: 0.74 },
  { ticker: "BBRI", price: 4820, changePct: 1.26 },
  { ticker: "BMRI", price: 6075, changePct: 0.83 },
  { ticker: "TLKM", price: 3190, changePct: -0.47 },
  { ticker: "ANTM", price: 2140, changePct: 2.11 },
  { ticker: "PGAS", price: 1685, changePct: -0.29 },
];

/** Aggregate revenue growth, year over year, last 12 months. */
export const YOY_GROWTH: { label: string; value: number }[] = [
  { label: "Okt", value: 4.2 },
  { label: "Nov", value: 5.1 },
  { label: "Des", value: 3.8 },
  { label: "Jan", value: -1.4 },
  { label: "Feb", value: 2.6 },
  { label: "Mar", value: 6.2 },
  { label: "Apr", value: 5.4 },
  { label: "Mei", value: 7.1 },
  { label: "Jun", value: 6.3 },
  { label: "Jul", value: 8.4 },
  { label: "Agu", value: 7.2 },
  { label: "Sep", value: 9.6 },
];

/** Danantara's share of Himbara lending. */
export const HIMBARA_SHARE = [
  { name: "BBRI", pct: 34, color: "var(--accent-amber)" },
  { name: "BMRI", pct: 31, color: "var(--accent-orange)" },
  { name: "BBNI", pct: 20, color: "var(--accent-blue)" },
  { name: "BBTN", pct: 15, color: "var(--accent-violet)" },
];

/** BBRI revenue split, 9M-2026. */
export const REVENUE_SEGMENTS = [
  { name: "Mikro", pct: 41, color: "var(--accent-amber)" },
  { name: "Korporasi", pct: 24, color: "var(--accent-orange)" },
  { name: "Konsumer", pct: 17, color: "var(--accent-blue)" },
  { name: "Treasury", pct: 11, color: "var(--accent-violet)" },
  { name: "Fee", pct: 7, color: "var(--status-positive)" },
];

/** Region / sector treemap on the global filter panel. */
export const FILTER_TREEMAP = [
  { name: "Himbara", pct: 44, color: "var(--accent-amber)" },
  { name: "Energi", pct: 21, color: "var(--accent-orange)" },
  { name: "Telko", pct: 13, color: "var(--accent-blue)" },
  { name: "Tambang", pct: 12, color: "var(--accent-violet)" },
  { name: "Infra", pct: 10, color: "var(--status-positive)" },
];
