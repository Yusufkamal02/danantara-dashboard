/**
 * DATA CONTOH — fundamentals for the Laporan Keuangan screen.
 * Figures are illustrative; none are taken from a filed financial statement.
 */

import { HOLDINGS, type Holding } from "@/data/holdings";
import { seeded, gaussian, seedOf } from "@/data/prng";

export const QUARTERS = [
  "Q3-24",
  "Q4-24",
  "Q1-25",
  "Q2-25",
  "Q3-25",
  "Q4-25",
  "Q1-26",
  "Q2-26",
  "Q3-26",
];

export interface RatioTile {
  key: string;
  label: string;
  value: string;
  qoq: string;
  yoy: string;
  /** Direction of the QoQ move, which drives the accent colour. */
  up: boolean;
  series: number[];
}

export const RATIOS: RatioTile[] = [
  {
    key: "roe",
    label: "ROE",
    value: "16,8%",
    qoq: "-0,7 pp QoQ",
    yoy: "+1,2 pp YoY",
    up: false,
    series: [14.1, 14.9, 15.2, 16.0, 15.6, 16.4, 17.1, 17.5, 16.8],
  },
  {
    key: "roa",
    label: "ROA",
    value: "2,74%",
    qoq: "+0,04 pp QoQ",
    yoy: "+0,21 pp YoY",
    up: true,
    series: [2.31, 2.4, 2.44, 2.52, 2.49, 2.58, 2.66, 2.7, 2.74],
  },
  {
    key: "roi",
    label: "ROI",
    value: "12,1%",
    qoq: "+0,3 pp QoQ",
    yoy: "+0,9 pp YoY",
    up: true,
    series: [10.4, 10.8, 11.0, 11.3, 11.1, 11.4, 11.7, 11.8, 12.1],
  },
  {
    key: "nim",
    label: "NIM",
    value: "6,92%",
    qoq: "-0,11 pp QoQ",
    yoy: "-0,34 pp YoY",
    up: false,
    series: [7.4, 7.32, 7.28, 7.26, 7.18, 7.1, 7.04, 7.03, 6.92],
  },
  {
    key: "cir",
    label: "CIR",
    value: "41,6%",
    qoq: "-0,8 pp QoQ",
    yoy: "-1,9 pp YoY",
    // A falling cost-to-income ratio is an improvement, so this reads positive.
    up: true,
    series: [45.1, 44.6, 44.0, 43.6, 43.1, 42.8, 42.4, 42.4, 41.6],
  },
];

/** The three series plotted on the profitability trend chart. */
export const TREND_SERIES = [
  { key: "ROE", color: "var(--accent-amber)", values: RATIOS[0].series },
  { key: "ROI", color: "var(--accent-blue)", values: RATIOS[2].series },
  { key: "ROA", color: "var(--status-positive)", values: RATIOS[1].series },
];

export interface IncomeRow {
  label: string;
  q3: string;
  q2: string;
  qoq: string;
  q3Prev: string;
  yoy: string;
  m9: string;
  yoy9: string;
  strong?: boolean;
}

/** Rupiah in billions, unaudited. */
export const INCOME_STATEMENT: IncomeRow[] = [
  { label: "Pendapatan bunga bersih", q3: "38.412", q2: "37.106", qoq: "+3,5%", q3Prev: "35.902", yoy: "+7,0%", m9: "112.640", yoy9: "+6,4%" },
  { label: "Pendapatan operasional lain", q3: "11.284", q2: "10.902", qoq: "+3,5%", q3Prev: "9.874", yoy: "+14,3%", m9: "32.418", yoy9: "+12,1%" },
  { label: "Total pendapatan operasional", q3: "49.696", q2: "48.008", qoq: "+3,5%", q3Prev: "45.776", yoy: "+8,6%", m9: "145.058", yoy9: "+7,7%", strong: true },
  { label: "Beban operasional", q3: "(20.674)", q2: "(20.356)", qoq: "+1,6%", q3Prev: "(19.612)", yoy: "+5,4%", m9: "(60.842)", yoy9: "+4,1%" },
  { label: "PPOP", q3: "29.022", q2: "27.652", qoq: "+5,0%", q3Prev: "26.164", yoy: "+10,9%", m9: "84.216", yoy9: "+10,4%", strong: true },
  { label: "Beban CKPN", q3: "(9.846)", q2: "(8.904)", qoq: "+10,6%", q3Prev: "(8.210)", yoy: "+19,9%", m9: "(27.412)", yoy9: "+16,8%" },
  { label: "Laba sebelum pajak", q3: "19.176", q2: "18.748", qoq: "+2,3%", q3Prev: "17.954", yoy: "+6,8%", m9: "56.804", yoy9: "+7,4%", strong: true },
  { label: "Laba bersih", q3: "15.104", q2: "14.802", qoq: "+2,0%", q3Prev: "13.806", yoy: "+9,4%", m9: "44.912", yoy9: "+9,1%", strong: true },
  { label: "Laba per saham (Rp)", q3: "99,6", q2: "97,6", qoq: "+2,0%", q3Prev: "91,1", yoy: "+9,3%", m9: "296,2", yoy9: "+9,1%" },
];

export const DUPONT = [
  { label: "Margin laba bersih", value: "30,4%", delta: "+0,4 pp", up: true },
  { label: "Perputaran aset", value: "0,090x", delta: "-0,002x", up: false },
  { label: "Pengganda ekuitas", value: "6,14x", delta: "-0,21x", up: false },
];

export const PEER_ROE = [
  { name: "BMRI", value: 19.4, color: "var(--accent-orange)" },
  { name: "BBRI", value: 16.8, color: "var(--accent-amber)" },
  { name: "BBNI", value: 14.1, color: "var(--text-secondary)" },
  { name: "BBTN", value: 8.7, color: "var(--text-secondary)" },
  { name: "Median Himbara", value: 15.5, color: "var(--accent-blue)" },
];

export const FUNDAMENTAL_SCORE = {
  total: 74,
  factors: [
    { label: "Profitabilitas", value: 82, good: true },
    { label: "Kualitas aset", value: 71, good: true },
    { label: "Likuiditas", value: 88, good: true },
    { label: "Solvabilitas", value: 64, good: false },
    { label: "Kualitas laba", value: 57, good: false },
  ],
};

/**
 * Danantara's stake in the selected issuer. Trimmed to the two figures the
 * review asked to keep — average cost, unrealised gain, trailing dividend and
 * effective yield were dropped from this panel.
 */
export const OWNERSHIP_PANEL = {
  ownedPct: 53.2,
  stats: [
    { label: "Nilai posisi", value: "Rp 1.842,1 T" },
    { label: "Lembar saham", value: "80,6 mrd" },
  ],
};

export const DATA_SOURCES = [
  { label: "API Harga Saham IDX", freshness: "real-time", live: true },
  { label: "Laporan Keuangan XBRL", freshness: "T+1", live: true },
  { label: "Konsensus Analis", freshness: "mingguan", live: true },
  { label: "Siaran Pers Emiten", freshness: "real-time", live: true },
];

export const AI_SUMMARY = [
  "Laba bersih Q3-2026 naik 9,4% YoY, ditopang pendapatan berbasis komisi (+14,3% YoY). Pertumbuhan QoQ melambat ke 2,0% karena beban CKPN naik 10,6% QoQ.",
  "ROE turun 0,7 pp QoQ semata karena pengganda ekuitas menyusut setelah penambahan modal inti — margin laba bersih justru menguat 0,4 pp.",
];

export const AI_SUMMARY_SOURCES = ["XBRL Q3-26", "IDX API", "Konsensus 14 analis"];

/* ------------------------------------------------------------------ */
/* Per-issuer fundamentals                                              */
/* ------------------------------------------------------------------ */


export interface Fundamentals {
  ticker: string;
  name: string;
  isBank: boolean;
  ratios: RatioTile[];
  trend: { key: string; color: string; values: number[] }[];
  income: IncomeRow[];
  dupont: { label: string; value: string; delta: string; up: boolean }[];
  dupontRoe: string;
  peers: { name: string; value: number; color: string }[];
  peerLabel: string;
  score: typeof FUNDAMENTAL_SCORE;
  ownership: typeof OWNERSHIP_PANEL;
  summary: string[];
  summarySources: string[];
  meta: string;
}

const d1 = (n: number) => n.toFixed(1).replace(".", ",");
const d2 = (n: number) => n.toFixed(2).replace(".", ",");
const signed = (n: number, f: (n: number) => string, unit: string) => `${n >= 0 ? "+" : ""}${f(n)}${unit}`;
const rp = (n: number) => Math.round(n).toLocaleString("id-ID");
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** A ratio tile from a nine-quarter series; `lowerIsBetter` flips the colour. */
function tile(key: string, series: number[], unit: "%" | "x", digits: 1 | 2, lowerIsBetter = false): RatioTile {
  const f = digits === 1 ? d1 : d2;
  const last = series[series.length - 1];
  const qoq = last - series[series.length - 2];
  const yoy = last - series[series.length - 5];
  const u = unit === "%" ? " pp" : "x";
  return {
    key: key.toLowerCase(),
    label: key,
    value: `${f(last)}${unit}`,
    qoq: `${signed(qoq, f, u)} QoQ`,
    yoy: `${signed(yoy, f, u)} YoY`,
    up: lowerIsBetter ? qoq <= 0 : qoq >= 0,
    series,
  };
}

/** Nine quarters ending exactly on `last`, walking backwards with drift. */
function walk(rnd: () => number, last: number, vol: number, digits: number): number[] {
  const drift = (rnd() - 0.4) * vol * 0.6;
  const out = [last];
  for (let i = 0; i < 8; i += 1) out.unshift(out[0] - drift + gaussian(rnd) * vol);
  const k = 10 ** digits;
  return out.map((v) => Math.round(v * k) / k);
}

/**
 * Income-statement lines for one quarter, driven by a revenue figure and a
 * few margins. Banks and non-banks report different line items.
 */
function quarterLines(isBank: boolean, revenue: number, m: { a: number; b: number; loss: boolean }): number[] {
  if (isBank) {
    const nii = revenue * 0.77;
    const other = revenue - nii;
    const opex = revenue * m.a;
    const ppop = revenue - opex;
    const ckpn = ppop * (m.loss ? 1.35 : m.b);
    const pbt = ppop - ckpn;
    const net = pbt * 0.79;
    return [nii, other, revenue, -opex, ppop, -ckpn, pbt, net];
  }
  const cogs = revenue * (1 - m.a);
  const gross = revenue - cogs;
  const opex = gross * (m.loss ? 1.28 : m.b);
  const op = gross - opex;
  const fin = Math.abs(op) * 0.14 + revenue * 0.01;
  const pbt = op - fin;
  const net = pbt * (pbt > 0 ? 0.78 : 1);
  return [revenue, -cogs, gross, -opex, op, -fin, pbt, net];
}

const BANK_LINES = [
  "Pendapatan bunga bersih",
  "Pendapatan operasional lain",
  "Total pendapatan operasional",
  "Beban operasional",
  "PPOP",
  "Beban CKPN",
  "Laba sebelum pajak",
  "Laba bersih",
];
const CORP_LINES = [
  "Pendapatan usaha",
  "Beban pokok pendapatan",
  "Laba kotor",
  "Beban usaha",
  "Laba usaha",
  "Beban keuangan",
  "Laba sebelum pajak",
  "Laba bersih",
];
const STRONG = new Set([2, 4, 6, 7]);

function pctChange(now: number, before: number): string {
  if (before === 0 || Math.sign(now) !== Math.sign(before)) return "—";
  return signed(((Math.abs(now) - Math.abs(before)) / Math.abs(before)) * 100, d1, "%");
}

const shown = (n: number) => (n < 0 ? `(${rp(-n)})` : rp(n));

function buildIncome(h: Holding, isBank: boolean, rnd: () => number): IncomeRow[] {
  const marketCap = h.value / (h.owned / 100); // Rp T
  const netAnnual = h.per !== null ? (marketCap * 1000) / h.per : -marketCap * 1000 * 0.03; // Rp miliar
  const loss = netAnnual < 0;
  // Margins are a trait of the issuer; quarters only wobble around them, or
  // net profit would swing far more than revenue does.
  const baseA = isBank ? 0.4 + rnd() * 0.12 : 0.24 + rnd() * 0.18;
  const baseB = isBank ? 0.3 + rnd() * 0.1 : 0.42 + rnd() * 0.12;
  const marg = () => ({ a: baseA + gaussian(rnd) * 0.006, b: baseB + gaussian(rnd) * 0.008, loss });

  // Solve revenue so the latest quarter's net profit matches the annual figure.
  const m3 = marg();
  const probe = quarterLines(isBank, 1000, m3)[7];
  const rev3 = Math.abs((netAnnual / 4 / probe) * 1000);

  const gQoQ = 0.01 + gaussian(rnd) * 0.03;
  const gYoY = 0.05 + gaussian(rnd) * 0.05;
  const rev = {
    q3: rev3,
    q2: rev3 / (1 + gQoQ),
    q1: rev3 / (1 + gQoQ) ** 2,
    q3p: rev3 / (1 + gYoY),
    q2p: rev3 / (1 + gQoQ) / (1 + gYoY),
    q1p: rev3 / (1 + gQoQ) ** 2 / (1 + gYoY),
  };
  const L = {
    q3: quarterLines(isBank, rev.q3, m3),
    q2: quarterLines(isBank, rev.q2, marg()),
    q1: quarterLines(isBank, rev.q1, marg()),
    q3p: quarterLines(isBank, rev.q3p, marg()),
    q2p: quarterLines(isBank, rev.q2p, marg()),
    q1p: quarterLines(isBank, rev.q1p, marg()),
  };

  const labels = isBank ? BANK_LINES : CORP_LINES;
  const rows: IncomeRow[] = labels.map((label, i) => {
    const m9 = L.q3[i] + L.q2[i] + L.q1[i];
    const m9p = L.q3p[i] + L.q2p[i] + L.q1p[i];
    return {
      label,
      q3: shown(L.q3[i]),
      q2: shown(L.q2[i]),
      qoq: pctChange(L.q3[i], L.q2[i]),
      q3Prev: shown(L.q3p[i]),
      yoy: pctChange(L.q3[i], L.q3p[i]),
      m9: shown(m9),
      yoy9: pctChange(m9, m9p),
      strong: STRONG.has(i),
    };
  });

  // Earnings per share from the position: shares = market cap / price.
  const shares = (marketCap * 1e12) / h.price;
  const eps = (n: number) => (n * 1e9) / shares;
  const epsQ3 = eps(L.q3[7]);
  const epsQ2 = eps(L.q2[7]);
  const epsP = eps(L.q3p[7]);
  const epsM9 = eps(L.q3[7] + L.q2[7] + L.q1[7]);
  const epsM9p = eps(L.q3p[7] + L.q2p[7] + L.q1p[7]);
  const e = (n: number) => (n < 0 ? `(${d1(-n)})` : d1(n));
  rows.push({
    label: "Laba per saham (Rp)",
    q3: e(epsQ3),
    q2: e(epsQ2),
    qoq: pctChange(epsQ3, epsQ2),
    q3Prev: e(epsP),
    yoy: pctChange(epsQ3, epsP),
    m9: e(epsM9),
    yoy9: pctChange(epsM9, epsM9p),
  });
  return rows;
}

/**
 * Fundamentals for any holding. BBRI returns the hand-written figures the
 * screen was designed around; every other issuer is derived from its row in
 * the Holdings table (ROE, PER, price, stake) plus a ticker-seeded PRNG, so
 * the numbers stay consistent with the rest of the dashboard and identical
 * between server and client renders.
 */
export function buildFundamentals(ticker: string): Fundamentals {
  const h = HOLDINGS.find((x) => x.ticker === ticker) ?? HOLDINGS[0];
  const isBank = h.sector === "Perbankan";

  if (h.ticker === "BBRI") {
    return {
      ticker: h.ticker,
      name: h.name,
      isBank,
      ratios: RATIOS,
      trend: TREND_SERIES,
      income: INCOME_STATEMENT,
      dupont: DUPONT,
      dupontRoe: "16,8%",
      peers: PEER_ROE,
      peerLabel: "Himbara",
      score: FUNDAMENTAL_SCORE,
      ownership: OWNERSHIP_PANEL,
      summary: AI_SUMMARY,
      summarySources: AI_SUMMARY_SOURCES,
      meta: "ROE 16,8% · ROA 2,74% · ROI 12,1% · PERIODE Q3-2026",
    };
  }

  const rnd = seeded(seedOf(h.ticker));
  const roe = walk(rnd, h.roe, 0.55, 1);
  const leverage = isBank ? 6 + rnd() * 1.5 : 1.6 + rnd() * 1.2;
  const roa = roe.map((v) => Math.round((v / leverage) * 100) / 100);
  const roi = roe.map((v) => Math.round(v * 0.72 * 10) / 10);

  const ratios: RatioTile[] = [tile("ROE", roe, "%", 1), tile("ROA", roa, "%", 2), tile("ROI", roi, "%", 1)];
  if (isBank) {
    ratios.push(tile("NIM", walk(rnd, 4 + rnd() * 2.5, 0.06, 2), "%", 2));
    ratios.push(tile("CIR", walk(rnd, 40 + rnd() * 12, 0.5, 1), "%", 1, true));
  } else {
    const npm = h.roe < 0 ? -(3 + rnd() * 9) : 6 + rnd() * 16;
    ratios.push(tile("NPM", walk(rnd, npm, 0.6, 1), "%", 1));
    ratios.push(tile("DER", walk(rnd, h.roe < 0 ? 2.2 + rnd() * 2 : 0.4 + rnd() * 1.1, 0.04, 2), "x", 2, true));
  }

  const trend = [
    { key: "ROE", color: "var(--accent-amber)", values: roe },
    { key: "ROI", color: "var(--accent-blue)", values: roi },
    { key: "ROA", color: "var(--status-positive)", values: roa },
  ];

  // DuPont: margin × turnover × multiplier reproduces the latest ROE.
  const roeNow = roe[8];
  const margin = isBank ? 22 + rnd() * 12 : Number(ratios[3].series[8]);
  const multiplier = leverage;
  const turnover = roeNow / 100 / (margin / 100) / multiplier;
  const dm = gaussian(rnd) * 0.6;
  const dt = gaussian(rnd) * 0.004;
  const dx = gaussian(rnd) * 0.15;
  const dupont = [
    { label: "Margin laba bersih", value: `${d1(margin)}%`, delta: signed(dm, d1, " pp"), up: dm >= 0 },
    { label: "Perputaran aset", value: `${turnover.toFixed(3).replace(".", ",")}x`, delta: `${dt >= 0 ? "+" : ""}${dt.toFixed(3).replace(".", ",")}x`, up: dt >= 0 },
    { label: "Pengganda ekuitas", value: `${d2(multiplier)}x`, delta: signed(dx, d2, "x"), up: dx >= 0 },
  ];

  // Peers: the four largest positions in the same sector plus its median.
  const sector = HOLDINGS.filter((x) => x.sector === h.sector);
  const top = [...sector].sort((a, b) => b.value - a.value).slice(0, 4);
  if (!top.some((x) => x.ticker === h.ticker)) top[top.length - 1] = h;
  const peers = [
    ...top.sort((a, b) => b.roe - a.roe).map((x) => ({
      name: x.ticker,
      value: x.roe,
      color: x.ticker === h.ticker ? "var(--accent-amber)" : "var(--text-secondary)",
    })),
    ...(sector.length > 1
      ? [{ name: `Median ${h.sector.toLowerCase()}`, value: Math.round(median(sector.map((x) => x.roe)) * 10) / 10, color: "var(--accent-blue)" }]
      : []),
  ];

  const clamp = (v: number) => Math.max(8, Math.min(96, Math.round(v)));
  const factors = [
    { label: "Profitabilitas", value: clamp(45 + h.roe * 2.2) },
    { label: "Kualitas aset", value: clamp(55 + gaussian(rnd) * 12) },
    { label: "Likuiditas", value: clamp(62 + gaussian(rnd) * 12) },
    { label: "Solvabilitas", value: clamp(h.roe < 0 ? 28 + rnd() * 15 : 55 + gaussian(rnd) * 12) },
    { label: "Kualitas laba", value: clamp(50 + h.roe * 1.2 + gaussian(rnd) * 8) },
  ].map((f) => ({ ...f, good: f.value >= 65 }));
  const total = Math.round(factors.reduce((s, f) => s + f.value, 0) / factors.length);

  const income = buildIncome(h, isBank, rnd);
  const net = income[7];
  const top1 = income[isBank ? 1 : 0];

  const summary =
    h.roe < 0
      ? [
          `${h.ticker} masih mencatat rugi bersih Rp ${net.q3.replace(/[()]/g, "")} miliar pada Q3-2026. Beban usaha melampaui laba kotor, sehingga ekuitas terus tergerus dan PER tidak bermakna.`,
          `ROE ${d1(roeNow)}% dengan DER ${ratios[4].value} — solvabilitas menjadi faktor terlemah pada skor fundamental (${factors[3].value}/100).`,
        ]
      : [
          `Laba bersih Q3-2026 ${net.yoy === "—" ? "berbalik arah" : `bergerak ${net.yoy} YoY`} ke Rp ${net.q3} miliar, dengan ${top1.label.toLowerCase()} ${top1.yoy} YoY. Secara kuartalan laba ${net.qoq.startsWith("-") ? "melemah" : "tumbuh"} ${net.qoq.replace(/^[+-]/, "")}.`,
          `ROE ${ratios[0].qoq.startsWith("-") ? "turun" : "naik"} ${ratios[0].qoq.replace(/^[+-]/, "").replace(" QoQ", "")} QoQ ke ${ratios[0].value}; ${peers[0].name === h.ticker ? "tertinggi" : `di bawah ${peers[0].name}`} di antara sejawat ${h.sector.toLowerCase()}.`,
        ];

  return {
    ticker: h.ticker,
    name: h.name,
    isBank,
    ratios,
    trend,
    income,
    dupont,
    dupontRoe: `${d1(roeNow)}%`,
    peers,
    peerLabel: h.sector,
    score: { total, factors },
    ownership: {
      ownedPct: h.owned,
      stats: [
        { label: "Nilai posisi", value: `Rp ${h.value.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} T` },
        { label: "Lembar saham", value: `${d1((h.value * 1000) / h.price)} mrd` },
      ],
    },
    summary,
    summarySources: [`XBRL ${h.ticker} Q3-26`, "IDX API", "Tabel Holdings"],
    meta: `ROE ${ratios[0].value} · ROA ${ratios[1].value} · ROI ${ratios[2].value} · PERIODE Q3-2026`,
  };
}
