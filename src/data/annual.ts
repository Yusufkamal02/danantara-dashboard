/**
 * DATA CONTOH — non-financial performance by function, as an issuer's annual
 * report (laporan tahunan) would disclose it: operations, technology, human
 * capital, risk management, marketing and sustainability.
 *
 * No figure here is taken from a published annual report. Each indicator has
 * a hand-picked base value for a BBRI-sized issuer; other issuers are scaled
 * by position size and varied with a ticker-seeded PRNG, so values are stable
 * across renders. Replace this module with extracted report data when the
 * ingestion pipeline exists.
 */

import { HOLDINGS, type Sector } from "@/data/holdings";
import { seeded, gaussian, seedOf } from "@/data/prng";

/** Fiscal years with data; the first one only feeds the YoY of the second. */
export const ANNUAL_YEARS = [2022, 2023, 2024, 2025];
/** Years the user can pick; 2025 is the latest published report. */
export const SELECTABLE_YEARS = [2023, 2024, 2025];

export type BidangKey = "operasional" | "teknologi" | "sdm" | "risiko" | "pemasaran" | "esg";

export interface Indicator {
  id: string;
  label: string;
  /** Glossary key, when the label has a tooltip. */
  term?: string;
  prefix?: string;
  suffix?: string;
  decimals: number;
  /** Which direction is an improvement; "none" for size measures. */
  better: "up" | "down" | "none";
  /** Latest-year value for a BBRI-sized issuer. */
  base: number;
  /** Absolute measures grow with the issuer; ratios do not. */
  scaled?: boolean;
  /** Relative dispersion between issuers. */
  spread: number;
  /** Typical yearly relative change. */
  drift: number;
  min?: number;
  max?: number;
  /** Multiplier by sector, e.g. a miner emits far more than a bank. */
  sectorFactor?: Partial<Record<Sector, number>>;
}

export interface Bidang {
  key: BidangKey;
  title: string;
  /** Annual-report chapter the indicators are read from. */
  chapter: string;
  color: string;
  indicators: Indicator[];
}

export const BIDANG: Bidang[] = [
  {
    key: "operasional",
    title: "Operasional",
    chapter: "Bab 5 · Tinjauan Operasional",
    color: "var(--accent-amber)",
    indicators: [
      { id: "prod", label: "Pendapatan per karyawan", prefix: "Rp ", suffix: " M", decimals: 2, better: "up", base: 2.61, spread: 0.35, drift: 0.07 },
      { id: "opex", label: "Rasio beban operasional", suffix: "%", decimals: 1, better: "down", base: 44.2, spread: 0.18, drift: 0.03 },
      { id: "util", label: "Utilisasi kapasitas", suffix: "%", decimals: 1, better: "up", base: 82.4, spread: 0.1, drift: 0.03, max: 98 },
      { id: "uptime", label: "Ketersediaan sistem inti", suffix: "%", decimals: 2, better: "up", base: 99.82, spread: 0.001, drift: 0.0005, max: 99.99 },
    ],
  },
  {
    key: "teknologi",
    title: "Teknologi / IT",
    chapter: "Bab 6 · Teknologi Informasi",
    color: "var(--accent-blue)",
    indicators: [
      { id: "itcapex", label: "Belanja TI", prefix: "Rp ", suffix: " T", decimals: 2, better: "up", base: 4.8, scaled: true, spread: 0.3, drift: 0.12 },
      { id: "itshare", label: "Belanja TI terhadap pendapatan", suffix: "%", decimals: 1, better: "up", base: 3.6, spread: 0.3, drift: 0.06 },
      { id: "digital", label: "Porsi transaksi digital", suffix: "%", decimals: 1, better: "up", base: 78.4, spread: 0.18, drift: 0.06, max: 99 },
      { id: "cyber", label: "Insiden siber material", suffix: " kasus", decimals: 0, better: "down", base: 2, spread: 0.8, drift: 0.3, min: 0 },
    ],
  },
  {
    key: "sdm",
    title: "MSDM / HRD",
    chapter: "Bab 7 · Sumber Daya Manusia",
    color: "var(--accent-violet)",
    indicators: [
      { id: "headcount", label: "Jumlah karyawan", suffix: " orang", decimals: 0, better: "none", base: 79_400, scaled: true, spread: 0.25, drift: 0.02 },
      { id: "turnover", label: "Turnover karyawan", term: "Turnover", suffix: "%", decimals: 1, better: "down", base: 4.8, spread: 0.3, drift: 0.08 },
      { id: "training", label: "Jam pelatihan per karyawan", suffix: " jam", decimals: 0, better: "up", base: 52, spread: 0.3, drift: 0.08 },
      { id: "women", label: "Perempuan di posisi manajerial", suffix: "%", decimals: 1, better: "up", base: 31.2, spread: 0.3, drift: 0.04, max: 60 },
    ],
  },
  {
    key: "risiko",
    title: "Risk",
    chapter: "Bab 8 · Manajemen Risiko",
    color: "var(--status-negative)",
    indicators: [
      { id: "profile", label: "Peringkat profil risiko", term: "Profil Risiko", decimals: 0, better: "down", base: 2, spread: 0.3, drift: 0.2, min: 1, max: 5 },
      { id: "oploss", label: "Kerugian risiko operasional", prefix: "Rp ", suffix: " M", decimals: 0, better: "down", base: 410, scaled: true, spread: 0.4, drift: 0.12 },
      { id: "audit", label: "Temuan audit belum ditindaklanjuti", suffix: " temuan", decimals: 0, better: "down", base: 14, spread: 0.5, drift: 0.2, min: 0 },
      { id: "limit", label: "Kepatuhan limit risiko", suffix: "%", decimals: 1, better: "up", base: 97.6, spread: 0.02, drift: 0.01, max: 100 },
    ],
  },
  {
    key: "pemasaran",
    title: "Marketing / Sales",
    chapter: "Bab 5.3 · Pemasaran & Penjualan",
    color: "var(--accent-orange)",
    indicators: [
      { id: "customers", label: "Jumlah pelanggan", suffix: " jt", decimals: 1, better: "up", base: 142, scaled: true, spread: 0.35, drift: 0.06 },
      { id: "custgrowth", label: "Pertumbuhan pelanggan", suffix: "%", decimals: 1, better: "up", base: 6.2, spread: 0.4, drift: 0.12 },
      { id: "nps", label: "Net Promoter Score", term: "NPS", decimals: 0, better: "up", base: 48, spread: 0.25, drift: 0.06, min: -100, max: 100 },
      { id: "share", label: "Pangsa pasar", suffix: "%", decimals: 1, better: "up", base: 17.5, spread: 0.5, drift: 0.04, max: 80 },
    ],
  },
  {
    key: "esg",
    title: "ESG & Sustainability",
    chapter: "Laporan Keberlanjutan",
    color: "var(--status-positive)",
    indicators: [
      {
        id: "emission",
        label: "Emisi GRK cakupan 1+2",
        term: "GRK",
        suffix: " rb tCO₂e",
        decimals: 0,
        better: "down",
        base: 420,
        scaled: true,
        spread: 0.3,
        drift: 0.05,
        sectorFactor: { Telekomunikasi: 2.5, Energi: 24, Pertambangan: 18, Infrastruktur: 11, "Industri dasar": 30, Kesehatan: 2 },
      },
      { id: "renewable", label: "Porsi energi terbarukan", suffix: "%", decimals: 1, better: "up", base: 12.4, spread: 0.5, drift: 0.15, max: 90 },
      { id: "green", label: "Pembiayaan & belanja berkelanjutan", prefix: "Rp ", suffix: " T", decimals: 1, better: "up", base: 92, scaled: true, spread: 0.4, drift: 0.14 },
      { id: "esgrisk", label: "Skor risiko ESG", term: "Risiko ESG", decimals: 1, better: "down", base: 22.1, spread: 0.3, drift: 0.05, min: 5, max: 50 },
    ],
  },
];

export interface IndicatorSeries {
  indicator: Indicator;
  /** One value per ANNUAL_YEARS entry. */
  values: number[];
}

export interface AnnualReport {
  ticker: string;
  name: string;
  sector: Sector;
  published: string;
  pages: number;
  bidang: { bidang: Bidang; series: IndicatorSeries[] }[];
}

const clampTo = (v: number, i: Indicator) => Math.min(i.max ?? Infinity, Math.max(i.min ?? -Infinity, v));
const roundTo = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
const BBRI_VALUE = HOLDINGS[0].value;

/**
 * Annual-report indicators for any holding. Values for the latest year come
 * from the indicator base, scaled for size and sector; earlier years walk
 * backwards, improving in roughly three years out of four.
 */
export function buildAnnual(ticker: string): AnnualReport {
  const h = HOLDINGS.find((x) => x.ticker === ticker) ?? HOLDINGS[0];
  const rnd = seeded(seedOf(`annual-${h.ticker}`));
  const size = Math.pow(h.value / BBRI_VALUE, 0.6);

  const bidang = BIDANG.map((b) => ({
    bidang: b,
    series: b.indicators.map((ind) => {
      const factor = (ind.scaled ? size : 1) * (ind.sectorFactor?.[h.sector] ?? 1);
      // BBRI is the reference issuer, so it sits exactly on the base values.
      const jitter = h.ticker === "BBRI" ? 1 : 1 + gaussian(rnd) * ind.spread * 0.5;
      const values = [clampTo(ind.base * factor * Math.max(0.2, jitter), ind)];
      for (let y = 1; y < ANNUAL_YEARS.length; y += 1) {
        const improving = rnd() < 0.75;
        const step = ind.drift * (0.4 + rnd() * 1.2);
        const up = ind.better === "down" ? !improving : improving;
        // Walking backwards: an improvement upward means last year was lower.
        const prev = up ? values[0] / (1 + step) : values[0] * (1 + step);
        values.unshift(clampTo(prev, ind));
      }
      return { indicator: ind, values: values.map((v) => roundTo(v, ind.decimals)) };
    }),
  }));

  const day = 10 + Math.floor(rnd() * 18);
  return {
    ticker: h.ticker,
    name: h.name,
    sector: h.sector,
    published: `${day} Mar 2026`,
    pages: 280 + Math.floor(rnd() * 260),
    bidang,
  };
}

/** Formats an indicator value with its unit, Indonesian style. */
export function formatIndicator(ind: Indicator, v: number): string {
  const n = v.toLocaleString("id-ID", { minimumFractionDigits: ind.decimals, maximumFractionDigits: ind.decimals });
  return `${ind.prefix ?? ""}${n}${ind.suffix ?? ""}`;
}

/**
 * Year-over-year change as display text plus its tone. Percent indicators
 * change in percentage points; everything else in relative percent.
 */
export function indicatorChange(ind: Indicator, now: number, before: number): { text: string; tone: "pos" | "neg" | "dim" } {
  const diff = now - before;
  let text: string;
  if (ind.suffix === "%") text = `${diff >= 0 ? "+" : ""}${diff.toFixed(ind.decimals === 2 ? 2 : 1).replace(".", ",")} pp`;
  else if (ind.decimals === 0 && Math.abs(before) < 20) text = `${diff >= 0 ? "+" : ""}${diff}`;
  else if (before === 0) text = "—";
  else text = `${diff >= 0 ? "+" : ""}${((diff / Math.abs(before)) * 100).toFixed(1).replace(".", ",")}%`;
  if (diff === 0 || ind.better === "none") return { text: diff === 0 ? "0" : text, tone: "dim" };
  const good = ind.better === "up" ? diff > 0 : diff < 0;
  return { text, tone: good ? "pos" : "neg" };
}
