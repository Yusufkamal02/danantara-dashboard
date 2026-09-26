/**
 * DATA CONTOH — fundamentals for the Laporan Keuangan screen.
 * Figures are illustrative; none are taken from a filed financial statement.
 */

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
