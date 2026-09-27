/**
 * DATA CONTOH — portfolio holdings for the PoC.
 * Issuer names are real Indonesian state-owned listings; every figure is made
 * up for layout purposes. See src/data/market.ts for the same caveat.
 */

export type Sector =
  | "Perbankan"
  | "Energi"
  | "Infrastruktur"
  | "Telekomunikasi"
  | "Pertambangan"
  | "Industri dasar"
  | "Kesehatan";

export const SECTORS: Sector[] = [
  "Perbankan",
  "Energi",
  "Infrastruktur",
  "Telekomunikasi",
  "Pertambangan",
  "Industri dasar",
  "Kesehatan",
];

/** Compact sector labels for narrow lists. */
export const SECTOR_SHORT: Record<Sector, string> = {
  Perbankan: "Bank",
  Energi: "Energi",
  Infrastruktur: "Infra",
  Telekomunikasi: "Telko",
  Pertambangan: "Tambang",
  "Industri dasar": "Ind. dasar",
  Kesehatan: "Kesehatan",
};

export interface Holding {
  ticker: string;
  name: string;
  sector: Sector;
  /** Danantara's stake, percent. */
  owned: number;
  price: number;
  changePct: number;
  /** Position value, trillions of rupiah. */
  value: number;
  /** Share of portfolio NAV, percent. */
  weight: number;
  /** Return on equity, percent. Negative means loss-making. */
  roe: number;
  /** Price / earnings. Null where equity is negative — "PER tidak bermakna". */
  per: number | null;
  /** Dividend yield, percent. */
  dividendYield: number;
}

export const HOLDINGS: Holding[] = [
  { ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", owned: 53.2, price: 4820, changePct: 1.26, value: 1842.1, weight: 18.7, roe: 16.8, per: 12.4, dividendYield: 3.3 },
  { ticker: "BMRI", name: "Bank Mandiri", sector: "Perbankan", owned: 52.0, price: 6075, changePct: 0.83, value: 1410.6, weight: 14.3, roe: 19.4, per: 11.1, dividendYield: 4.1 },
  { ticker: "BBNI", name: "Bank Negara Indonesia", sector: "Perbankan", owned: 60.0, price: 5325, changePct: 0.38, value: 742.3, weight: 7.5, roe: 14.1, per: 9.8, dividendYield: 4.6 },
  { ticker: "TLKM", name: "Telkom Indonesia", sector: "Telekomunikasi", owned: 52.1, price: 3190, changePct: -0.47, value: 684.9, weight: 7.0, roe: 17.6, per: 13.2, dividendYield: 5.2 },
  { ticker: "PGAS", name: "Perusahaan Gas Negara", sector: "Energi", owned: 56.9, price: 1685, changePct: -0.29, value: 312.4, weight: 3.2, roe: 9.2, per: 8.4, dividendYield: 6.1 },
  { ticker: "ANTM", name: "Aneka Tambang", sector: "Pertambangan", owned: 65.0, price: 2140, changePct: 2.11, value: 289.7, weight: 2.9, roe: 11.8, per: 15.6, dividendYield: 2.2 },
  { ticker: "PTBA", name: "Bukit Asam", sector: "Pertambangan", owned: 65.9, price: 2980, changePct: 0.68, value: 214.5, weight: 2.2, roe: 21.3, per: 6.9, dividendYield: 8.4 },
  { ticker: "SMGR", name: "Semen Indonesia", sector: "Infrastruktur", owned: 51.0, price: 3410, changePct: -1.02, value: 178.2, weight: 1.8, roe: 4.6, per: 24.1, dividendYield: 1.4 },
  { ticker: "JSMR", name: "Jasa Marga", sector: "Infrastruktur", owned: 70.0, price: 4760, changePct: 0.42, value: 161.8, weight: 1.6, roe: 12.9, per: 10.7, dividendYield: 2.8 },
  { ticker: "BBTN", name: "Bank Tabungan Negara", sector: "Perbankan", owned: 60.0, price: 1395, changePct: 1.09, value: 132.6, weight: 1.3, roe: 8.7, per: 7.2, dividendYield: 3.9 },
  { ticker: "BRIS", name: "Bank Syariah Indonesia", sector: "Perbankan", owned: 50.8, price: 2870, changePct: 1.77, value: 132.8, weight: 1.3, roe: 13.4, per: 17.2, dividendYield: 1.8 },
  { ticker: "PGEO", name: "Pertamina Geothermal", sector: "Energi", owned: 82.6, price: 1265, changePct: 0.8, value: 104.7, weight: 1.1, roe: 10.2, per: 13.9, dividendYield: 3.1 },
  { ticker: "MTEL", name: "Dayamitra Telekomunikasi", sector: "Telekomunikasi", owned: 72.0, price: 645, changePct: 0.31, value: 53.9, weight: 0.5, roe: 6.8, per: 21.3, dividendYield: 2.4 },
  { ticker: "TINS", name: "Timah", sector: "Pertambangan", owned: 65.0, price: 1045, changePct: 1.45, value: 48.3, weight: 0.5, roe: 5.2, per: 14.8, dividendYield: 1.1 },
  { ticker: "PTPP", name: "PP (Persero)", sector: "Infrastruktur", owned: 51.0, price: 428, changePct: -1.84, value: 41.2, weight: 0.4, roe: 2.1, per: 18.9, dividendYield: 0 },
  { ticker: "WIKA", name: "Wijaya Karya", sector: "Infrastruktur", owned: 65.0, price: 312, changePct: -2.19, value: 33.8, weight: 0.3, roe: -6.1, per: null, dividendYield: 0 },
  { ticker: "KRAS", name: "Krakatau Steel", sector: "Industri dasar", owned: 80.0, price: 184, changePct: -0.54, value: 28.4, weight: 0.3, roe: -2.4, per: null, dividendYield: 0 },
  { ticker: "ELSA", name: "Elnusa", sector: "Energi", owned: 41.1, price: 396, changePct: 0.76, value: 19.6, weight: 0.2, roe: 7.4, per: 6.1, dividendYield: 5.4 },
  { ticker: "ADHI", name: "Adhi Karya", sector: "Infrastruktur", owned: 51.0, price: 268, changePct: -1.47, value: 19.1, weight: 0.2, roe: 1.8, per: 22.4, dividendYield: 0 },
  { ticker: "WSKT", name: "Waskita Karya", sector: "Infrastruktur", owned: 75.4, price: 158, changePct: -2.47, value: 14.2, weight: 0.1, roe: -11.3, per: null, dividendYield: 0 },
  { ticker: "INAF", name: "Indofarma", sector: "Kesehatan", owned: 80.7, price: 246, changePct: 3.36, value: 12.1, weight: 0.1, roe: -8.9, per: null, dividendYield: 0 },
  { ticker: "SMBR", name: "Semen Baturaja", sector: "Infrastruktur", owned: 75.5, price: 142, changePct: -0.7, value: 8.6, weight: 0.1, roe: 1.2, per: 28.6, dividendYield: 0 },
  { ticker: "KAEF", name: "Kimia Farma", sector: "Kesehatan", owned: 87.0, price: 428, changePct: 2.15, value: 9.8, weight: 0.1, roe: -5.4, per: null, dividendYield: 0 },
];

/** Portfolio-wide totals. Stated, not derived, because the 23 rows above are a
 *  sample of a 42-issuer portfolio — summing them would understate the whole. */
export const PORTFOLIO_TOTALS = {
  issuers: 42,
  shown: HOLDINGS.length,
  sectors: 7,
  /** Aggregate market capitalisation of portfolio issuers, trillions Rp. */
  marketCap: 16_850,
  /** Net asset value of Danantara's stakes, trillions Rp. */
  nav: 9_842,
  avgOwned: 58.4,
  dayChangePct: 0.62,
  dividendYield: 3.4,
  weightedRoe: 16.8,
  medianPer: 12.1,
  returnYtd: 18.6,
};

/** Share of portfolio value by sector. */
export const SECTOR_ALLOCATION: { name: string; pct: number; color: string }[] = [
  { name: "Perbankan", pct: 38.4, color: "var(--accent-amber)" },
  { name: "Energi", pct: 19.2, color: "var(--accent-orange)" },
  { name: "Telekomunikasi", pct: 12.6, color: "var(--accent-blue)" },
  { name: "Pertambangan", pct: 11.1, color: "var(--accent-violet)" },
  { name: "Infrastruktur", pct: 9.8, color: "var(--status-positive)" },
  { name: "Konsumsi", pct: 5.3, color: "var(--text-secondary)" },
  { name: "Lainnya", pct: 3.6, color: "var(--text-secondary)" },
];

/** Sector mix used on the Holdings screen — by position value, not NAV. */
export const SECTOR_BY_VALUE: { name: string; pct: number; color: string }[] = [
  { name: "Perbankan", pct: 41.8, color: "var(--accent-amber)" },
  { name: "Energi", pct: 18.4, color: "var(--accent-orange)" },
  { name: "Telekomunikasi", pct: 12.6, color: "var(--accent-blue)" },
  { name: "Pertambangan", pct: 11.2, color: "var(--accent-violet)" },
  { name: "Infrastruktur", pct: 10.4, color: "var(--status-positive)" },
  { name: "Lainnya", pct: 5.6, color: "var(--text-secondary)" },
];

export const SECTOR_COUNTS: Record<Sector, number> = {
  Perbankan: 8,
  Energi: 6,
  Infrastruktur: 11,
  Telekomunikasi: 4,
  Pertambangan: 7,
  "Industri dasar": 4,
  Kesehatan: 2,
};

/** The four state-owned banks. BRIS is a state-linked bank but not Himbara. */
export const HIMBARA = ["BBRI", "BMRI", "BBNI", "BBTN"];

export type ViewSortKey = "value" | "roe" | "weight" | "dividendYield";

/**
 * Saved table presets on the Holdings screen. Applying one replaces the
 * search, sector, minimum-stake and sort controls; `rule` adds a threshold
 * that the manual controls cannot express.
 */
export interface SavedView {
  id: string;
  label: string;
  /** Empty means every sector. */
  sectors: Sector[];
  minOwned: number;
  tickers?: string[];
  rule?: { key: "roe" | "weight"; op: "lt" | "gt"; value: number; label: string };
  sortKey: ViewSortKey;
  sortDir: "asc" | "desc";
}

export const SAVED_VIEWS: SavedView[] = [
  { id: "all", label: "Seluruh portofolio", sectors: [], minOwned: 0, sortKey: "value", sortDir: "desc" },
  { id: "himbara", label: "Himbara saja", sectors: ["Perbankan"], minOwned: 0, tickers: HIMBARA, sortKey: "value", sortDir: "desc" },
  {
    id: "roe-low",
    label: "ROE di bawah 10%",
    sectors: [],
    minOwned: 0,
    rule: { key: "roe", op: "lt", value: 10, label: "ROE < 10%" },
    sortKey: "roe",
    sortDir: "asc",
  },
  {
    id: "weight-high",
    label: "Bobot NAV > 5%",
    sectors: [],
    minOwned: 0,
    rule: { key: "weight", op: "gt", value: 5, label: "Bobot NAV > 5%" },
    sortKey: "weight",
    sortDir: "desc",
  },
  { id: "yield-top", label: "Yield dividen tertinggi", sectors: [], minOwned: 0, sortKey: "dividendYield", sortDir: "desc" },
];

/** Top-5 concentration, Holdings screen. */
export const CONCENTRATION = [
  { ticker: "BBRI", pct: 18.7, color: "var(--accent-amber)" },
  { ticker: "BMRI", pct: 14.3, color: "var(--accent-orange)" },
  { ticker: "BBNI", pct: 7.5, color: "var(--accent-blue)" },
  { ticker: "TLKM", pct: 7.0, color: "var(--accent-violet)" },
  { ticker: "PGAS", pct: 3.2, color: "var(--status-positive)" },
];

export const CONCENTRATION_TOP5 = 50.7;
export const HHI = 0.11;

/**
 * Groups on the Ikhtisar "Filter Global" treemap. Selecting groups narrows the
 * whole overview; the KPI figures below are stated per group (the 23 sample
 * rows are not the full 42-issuer portfolio, so they cannot be summed from
 * HOLDINGS). With several groups selected the page weights them by market cap.
 */
export interface FilterGroup {
  key: string;
  /** Share of portfolio market cap, percent — the treemap cell size. */
  pct: number;
  color: string;
  /** Matching rule: an explicit ticker list wins over the sector. */
  sector: Sector;
  tickers?: string[];
  /** Name of the matching row in SECTOR_ALLOCATION. */
  allocationName: string;
  issuers: number;
  marketCap: number;
  marketCapMoM: number;
  returnYtd: number;
  dividendYield: number;
  dividendYieldYoY: number;
  weightedRoe: number;
  weightedRoeQoQ: number;
}

export const FILTER_GROUPS: FilterGroup[] = [
  { key: "Himbara", pct: 44, color: "var(--accent-amber)", sector: "Perbankan", tickers: HIMBARA, allocationName: "Perbankan", issuers: 4, marketCap: 7_414, marketCapMoM: 2.9, returnYtd: 21.4, dividendYield: 3.9, dividendYieldYoY: 0.4, weightedRoe: 17.6, weightedRoeQoQ: -0.8 },
  { key: "Energi", pct: 21, color: "var(--accent-orange)", sector: "Energi", allocationName: "Energi", issuers: 6, marketCap: 3_539, marketCapMoM: 1.8, returnYtd: 14.2, dividendYield: 5.6, dividendYieldYoY: 0.2, weightedRoe: 9.9, weightedRoeQoQ: 0.2 },
  { key: "Telko", pct: 13, color: "var(--accent-blue)", sector: "Telekomunikasi", allocationName: "Telekomunikasi", issuers: 4, marketCap: 2_190, marketCapMoM: -0.6, returnYtd: 9.8, dividendYield: 5.2, dividendYieldYoY: -0.1, weightedRoe: 16.1, weightedRoeQoQ: -0.3 },
  { key: "Tambang", pct: 12, color: "var(--accent-violet)", sector: "Pertambangan", allocationName: "Pertambangan", issuers: 7, marketCap: 2_022, marketCapMoM: 4.1, returnYtd: 26.3, dividendYield: 4.8, dividendYieldYoY: 0.6, weightedRoe: 15.4, weightedRoeQoQ: 0.6 },
  { key: "Infra", pct: 10, color: "var(--status-positive)", sector: "Infrastruktur", allocationName: "Infrastruktur", issuers: 11, marketCap: 1_685, marketCapMoM: 1.2, returnYtd: 11.6, dividendYield: 1.6, dividendYieldYoY: -0.2, weightedRoe: 5.1, weightedRoeQoQ: -0.9 },
];

/** Return of the benchmark over the same period, for the "vs IHSG" delta. */
export const IHSG_RETURN_YTD = 12.5;

export function inGroup(g: FilterGroup, h: Pick<Holding, "ticker" | "sector">): boolean {
  return g.tickers ? g.tickers.includes(h.ticker) : h.sector === g.sector;
}
