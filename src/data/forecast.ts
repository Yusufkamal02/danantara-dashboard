/**
 * DATA CONTOH — prediction and scenario inputs.
 * Model names are real techniques; the numbers are illustrative only and no
 * model was trained to produce them.
 */

export interface ForecastPoint {
  label: string;
  /** Realised close, present only on the historical leg. */
  actual?: number;
  /** Central projection, present only on the forecast leg. */
  base?: number;
  /** 50% interval. */
  lo50?: number;
  hi50?: number;
  /** 80% interval. */
  lo80?: number;
  hi80?: number;
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rnd: () => number): number {
  const u = Math.max(rnd(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

const AXIS = ["Okt-24", "Apr-25", "Okt-25", "Apr-26", "Okt-26", "Apr-27", "Okt-27"];

/**
 * 30 realised months then 14 projected, with widening intervals. The two legs
 * share the point where history ends so the lines meet cleanly.
 */
export function buildForecast(): { points: ForecastPoint[]; splitIndex: number; target: number } {
  const rnd = seeded(11);
  const history = 30;
  const horizon = 14;

  const actuals: number[] = [];
  let v = 3560;
  for (let i = 0; i < history; i += 1) {
    v *= 1 + gaussian(rnd) * 0.03 + 0.0105;
    actuals.push(Math.round(v));
  }
  const last = actuals[actuals.length - 1];

  const points: ForecastPoint[] = actuals.map((actual, i) => ({
    label: monthLabel(i, history + horizon),
    actual,
  }));

  // The split point carries both legs so the dashed line starts on the solid one.
  points[points.length - 1].base = last;
  points[points.length - 1].lo50 = last;
  points[points.length - 1].hi50 = last;
  points[points.length - 1].lo80 = last;
  points[points.length - 1].hi80 = last;

  for (let i = 0; i < horizon; i += 1) {
    const base = Math.round(last * Math.pow(1.009, i + 1));
    const t = Math.pow((i + 1) / horizon, 0.62);
    points.push({
      label: monthLabel(history + i, history + horizon),
      base,
      lo50: Math.round(base * (1 - 0.07 * t)),
      hi50: Math.round(base * (1 + 0.07 * t)),
      lo80: Math.round(base * (1 - 0.15 * t)),
      hi80: Math.round(base * (1 + 0.15 * t)),
    });
  }

  return { points, splitIndex: history - 1, target: points[points.length - 1].base! };
}

function monthLabel(i: number, total: number): string {
  const slot = Math.round((i / (total - 1)) * (AXIS.length - 1));
  return AXIS[slot];
}

export const MODELS = [
  { name: "Ensemble LSTM + XGBoost", status: "aktif", active: true },
  { name: "Prophet multivarian", status: "siap", active: false },
  { name: "ARIMA-GARCH", status: "siap", active: false },
  { name: "Model faktor fundamental", status: "siap", active: false },
];

export const HORIZONS = ["3B", "6B", "12B", "24B"];

export const ASSUMPTIONS = [
  { id: "bi-rate", label: "Asumsi BI rate", value: "4,50%", position: 45 },
  { id: "kredit", label: "Pertumbuhan kredit", value: "9,0%", position: 60 },
  { id: "npl", label: "NPL gross", value: "2,8%", position: 32 },
];

export interface Scenario {
  name: string;
  probability: string;
  target: string;
  ret: string;
  roe: string;
  growth: string;
  tone: "neg" | "base" | "pos";
  assumption: string;
}

export const SCENARIOS: Scenario[] = [
  {
    name: "Bearish",
    probability: "18%",
    target: "Rp 4.150",
    ret: "-13,9%",
    roe: "11,2%",
    growth: "+2,1%",
    tone: "neg",
    assumption: "NIM tertekan, CKPN naik, kredit tumbuh 5%",
  },
  {
    name: "Dasar",
    probability: "57%",
    target: "Rp 5.480",
    ret: "+13,7%",
    roe: "16,4%",
    growth: "+7,8%",
    tone: "base",
    assumption: "Suku bunga stabil, kredit tumbuh 9%",
  },
  {
    name: "Bullish",
    probability: "25%",
    target: "Rp 6.320",
    ret: "+31,1%",
    roe: "19,1%",
    growth: "+12,4%",
    tone: "pos",
    assumption: "Pemangkasan BI rate 75 bps, kredit tumbuh 13%",
  },
];

/** Normalised SHAP contributions; sign shows direction of influence. */
export const DRIVERS = [
  { label: "Pertumbuhan kredit mikro", value: 0.86 },
  { label: "Suku bunga acuan BI", value: -0.62 },
  { label: "NIM proyeksi", value: 0.54 },
  { label: "Rasio CKPN terhadap kredit", value: -0.41 },
  { label: "Pertumbuhan PDB nominal", value: 0.33 },
  { label: "Harga komoditas ekspor", value: 0.21 },
  { label: "Nilai tukar USD/IDR", value: -0.18 },
];

export const MODEL_QUALITY = [
  { label: "MAPE 12 bulan", value: "6,8%", good: true, term: "MAPE" },
  { label: "Akurasi arah", value: "74,2%", good: true, term: "Akurasi arah" },
  { label: "Cakupan interval 80%", value: "81,4%", good: true, term: "Cakupan interval" },
  { label: "Terakhir dilatih", value: "24 Sep 2026", good: null, term: null },
];

export const COMBINED_SIGNAL = {
  verdict: "BELI",
  consensus: "9 Beli · 4 Tahan · 1 Jual",
  analysts: 14,
  rows: [
    { label: "Teknikal", value: 72, verdict: "Bullish", up: true },
    { label: "Fundamental", value: 78, verdict: "Kuat", up: true },
    { label: "Sentimen berita", value: 61, verdict: "Positif", up: true },
    { label: "Aliran asing", value: 38, verdict: "Keluar", up: false },
  ],
};

export const ACCURACY_HISTORY = [
  { ticker: "BBRI", note: "Proyeksi Sep-26 vs realisasi", error: "-2,1%", tone: "good" },
  { ticker: "BMRI", note: "Proyeksi Sep-26 vs realisasi", error: "+3,8%", tone: "warn" },
  { ticker: "TLKM", note: "Proyeksi Sep-26 vs realisasi", error: "+11,4%", tone: "bad" },
  { ticker: "ANTM", note: "Proyeksi Sep-26 vs realisasi", error: "-1,6%", tone: "good" },
];

export const PORTFOLIO_FORECAST = [
  { ticker: "BBRI", target: "5.480", upside: "+13,7%", confidence: 57, up: true },
  { ticker: "BMRI", target: "7.120", upside: "+17,2%", confidence: 61, up: true },
  { ticker: "TLKM", target: "3.050", upside: "-4,4%", confidence: 48, up: false },
  { ticker: "ANTM", target: "2.640", upside: "+23,4%", confidence: 44, up: true },
  { ticker: "PGAS", target: "1.610", upside: "-4,5%", confidence: 52, up: false },
  { ticker: "PTBA", target: "3.240", upside: "+8,7%", confidence: 55, up: true },
  { ticker: "SMGR", target: "2.980", upside: "-12,6%", confidence: 63, up: false },
  { ticker: "JSMR", target: "5.410", upside: "+13,7%", confidence: 58, up: true },
];

export const METHODOLOGY_NOTE =
  "Proyeksi bersifat statistik, bukan rekomendasi investasi. Interval keyakinan mengasumsikan volatilitas historis 36 bulan tetap berlaku dan tidak memodelkan guncangan kebijakan mendadak.";
