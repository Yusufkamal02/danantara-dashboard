/**
 * DATA CONTOH — news feed, corporate calendar, risk alerts and the scripted
 * AI conversation. No headline here was published anywhere; they exist to show
 * the layout and the sentiment colouring.
 */

export type Tone = "up" | "down" | "neutral";

export interface NewsItem {
  time: string;
  ticker: string;
  headline: string;
  tone: Tone;
}

export const NEWS: NewsItem[] = [
  { time: "16:02", ticker: "BBRI", headline: "Laba bersih kuartal III tumbuh 9,4% ditopang kredit mikro", tone: "up" },
  { time: "15:47", ticker: "MAKRO", headline: "BI tahan suku bunga acuan di 4,75%, sesuai konsensus", tone: "neutral" },
  { time: "15:31", ticker: "ANTM", headline: "Kontrak pasokan nikel jangka panjang diteken dengan mitra Korea", tone: "up" },
  { time: "15:12", ticker: "TLKM", headline: "Belanja modal dipangkas 6% untuk jaga arus kas bebas", tone: "down" },
  { time: "14:58", ticker: "PGAS", headline: "Volume distribusi gas industri naik 4,1% QoQ", tone: "up" },
  { time: "14:40", ticker: "SMGR", headline: "Utilisasi pabrik turun ke 62% akibat pelemahan permintaan", tone: "down" },
  { time: "14:22", ticker: "JSMR", headline: "Trafik tol ruas Trans-Jawa naik 7,8% YoY", tone: "up" },
  { time: "14:03", ticker: "PTBA", headline: "Harga jual rata-rata batu bara terkoreksi 2,3% MoM", tone: "down" },
];

export const CALENDAR = [
  { date: "29 Sep", ticker: "BMRI", event: "Rilis laporan Q3-2026" },
  { date: "02 Okt", ticker: "BBRI", event: "Cum date dividen interim" },
  { date: "07 Okt", ticker: "TLKM", event: "Paparan publik tahunan" },
  { date: "14 Okt", ticker: "ANTM", event: "RUPS Luar Biasa" },
  { date: "21 Okt", ticker: "JSMR", event: "Rilis laporan Q3-2026" },
];

export type AlertLevel = "kritis" | "perhatian" | "info";

export interface Alert {
  level: AlertLevel;
  label: string;
  body: string;
}

export const RISK_ALERTS: Alert[] = [
  { level: "kritis", label: "KRITIS", body: "SMGR — margin EBITDA turun 3,1 pp QoQ, di bawah kovenan internal" },
  { level: "perhatian", label: "PERHATIAN", body: "PGAS — rasio DER 1,42x mendekati batas 1,50x" },
  { level: "perhatian", label: "PERHATIAN", body: "BBTN — NPL gross naik ke 3,4% (+0,4 pp QoQ)" },
  { level: "info", label: "INFO", body: "ANTM — konsensus analis direvisi naik oleh 4 sekuritas" },
];

export const FOLLOW_UPS: Alert[] = [
  { level: "kritis", label: "TINJAU", body: "SMGR — ROE 4,6% di bawah ambang mandat, usulkan kajian ulang" },
  { level: "perhatian", label: "REBALANS", body: "Bobot Perbankan 41,8% melampaui pagu internal 40%" },
  { level: "perhatian", label: "VERIFIKASI", body: "WIKA & KRAS — ekuitas negatif, PER tidak bermakna" },
  { level: "info", label: "AGENDA", body: "RUPS ANTM 14 Okt — tentukan arah suara Danantara" },
];

/** Knowledge sources the assistant can draw on, with RBAC state. */
export const KNOWLEDGE_SOURCES = [
  { label: "API Harga Saham IDX", meta: "42 emiten · real-time", enabled: true },
  { label: "Laporan Keuangan XBRL", meta: "2019–Q3 2026 · 1.284 dok", enabled: true },
  { label: "Siaran Pers & Keterbukaan", meta: "3.912 dokumen", enabled: true },
  { label: "Riset Analis Eksternal", meta: "486 laporan", enabled: true },
  { label: "Data Makro BPS & BI", meta: "84 seri waktu", enabled: false },
  { label: "Notulen Rapat Internal", meta: "akses terbatas", enabled: false, locked: true },
];

export const CHAT_HISTORY = [
  {
    group: "Hari ini",
    items: [
      "Perbandingan ROE Himbara Q3-26",
      "Emiten dengan CKPN naik >10% QoQ",
      "Sensitivitas NAV terhadap BI rate",
    ],
  },
  {
    group: "Kemarin",
    items: ["Ringkasan laporan Q3 TLKM", "Screener PER < 12 dan ROE > 15%"],
  },
  {
    group: "Minggu ini",
    items: ["Dampak harga nikel ke ANTM", "Proyeksi dividen 2027"],
  },
];

export const RETRIEVED_DOCS = [
  { tag: "XBRL", title: "BBRI — Laporan Keuangan Q3-2026", snippet: "Catatan 18: Pendapatan bunga bersih", score: 0.94 },
  { tag: "XBRL", title: "BMRI — Laporan Keuangan Q3-2026", snippet: "Catatan 12: Ikhtisar rasio keuangan", score: 0.91 },
  { tag: "API", title: "IDX Market Data — BBRI, BMRI", snippet: "Harga penutupan 5 tahun, harian", score: 0.88 },
  { tag: "RISET", title: "Konsensus analis — sektor perbankan", snippet: "Revisi target harga Sep-2026", score: 0.72 },
  { tag: "PERS", title: "BBRI — Siaran pers 24 Sep 2026", snippet: "Penyesuaian panduan CKPN 2026", score: 0.68 },
];

export const LINEAGE = [
  { step: "Pertanyaan diuraikan", detail: "2 entitas, 3 metrik, 1 horizon" },
  { step: "Sumber dipilih", detail: "XBRL + IDX API + model prediksi" },
  { step: "Kueri dijalankan", detail: "3 panggilan · 412 ms" },
  { step: "Jawaban disusun", detail: "dengan 4 rujukan terverifikasi" },
];

export const GENERATED_QUERY = `GET /api/v1/fundamentals
  ?tickers=BBRI,BMRI
  &metrics=roe,roa,roi
  &period=Q4-25..Q3-26
  &source=xbrl_audited

POST /api/v1/forecast
  { "ticker": "BBRI",
    "target": "net_income",
    "horizon": "Q4-2026",
    "model": "ensemble_v2.4" }`;

export const TOKEN_USAGE = [
  { label: "Konteks", pct: 42, value: "38,2 rb" },
  { label: "Jawaban", pct: 18, value: "6,4 rb" },
  { label: "Kuota harian", pct: 61, value: "61%" },
];
