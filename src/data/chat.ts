/**
 * DATA CONTOH — scripted assistant answers.
 *
 * Nothing here calls a model. Each question maps to a fixed, pre-written
 * answer so the PoC can demonstrate the shape of a sourced response — prose,
 * a table, a chart, a projection callout and citations — without an API key,
 * a backend, or the risk of a model inventing figures on stage.
 */

export type AnswerBlock =
  | { type: "text"; text: string }
  | { type: "note"; text: string }
  | {
      type: "table";
      head: string[];
      rows: { cells: string[]; tone?: "neg" | "pos" }[];
    }
  | {
      type: "bars";
      /** Category labels along the x axis. */
      labels: string[];
      series: { name: string; color: string; values: number[] }[];
      /** Axis maximum; bars are drawn as a fraction of this. */
      max: number;
      unit: string;
    }
  | {
      type: "callout";
      label: string;
      value: string;
      delta?: string;
      intervalLabel?: string;
      interval?: string;
      href?: string;
      cta?: string;
    };

export interface ChatAnswer {
  id: string;
  question: string;
  /** Rendered as "dijawab dalam X dtk". */
  seconds: string;
  blocks: AnswerBlock[];
  citations: string[];
}

export const ANSWERS: ChatAnswer[] = [
  {
    id: "roe-himbara",
    question:
      "Bandingkan ROE BBRI dan BMRI untuk 4 kuartal terakhir, lalu proyeksikan laba bersih BBRI di Q4-2026.",
    seconds: "2,4",
    blocks: [
      {
        type: "text",
        text: "BMRI unggul secara konsisten atas BBRI di seluruh empat kuartal terakhir, dengan selisih ROE stabil di kisaran 2,1–2,6 pp. Keduanya mencatat puncak pada Q2-2026 lalu terkoreksi di Q3-2026 karena kenaikan beban CKPN.",
      },
      {
        type: "table",
        head: ["Metrik", "Q4-25", "Q1-26", "Q2-26", "Q3-26"],
        rows: [
          { cells: ["ROE BBRI", "16,4%", "17,1%", "17,5%", "16,8%"] },
          { cells: ["ROE BMRI", "18,9%", "19,2%", "19,8%", "19,4%"] },
          { cells: ["Selisih (pp)", "-2,5", "-2,1", "-2,3", "-2,6"], tone: "neg" },
        ],
      },
      {
        type: "bars",
        labels: ["Q4-25", "Q1-26", "Q2-26", "Q3-26"],
        max: 22,
        unit: "%",
        series: [
          { name: "BBRI", color: "var(--accent-amber)", values: [16.4, 17.1, 17.5, 16.8] },
          { name: "BMRI", color: "var(--accent-blue)", values: [18.9, 19.2, 19.8, 19.4] },
        ],
      },
      {
        type: "callout",
        label: "Proyeksi laba bersih Q4-2026 · BBRI",
        value: "Rp 15,8 T",
        delta: "+4,6% QoQ",
        intervalLabel: "Interval keyakinan 80%",
        interval: "Rp 14,6 T — Rp 17,1 T",
        href: "/prediksi",
        cta: "BUKA MESIN PREDIKSI",
      },
      {
        type: "note",
        text: "Proyeksi memakai model ensemble dengan MAPE historis 6,8%. Angka bukan rekomendasi investasi.",
      },
    ],
    citations: [
      "XBRL BBRI Q3-2026 §L/R",
      "XBRL BMRI Q3-2026 §L/R",
      "IDX API · harga 26 Sep 2026",
      "Model ensemble v2.4",
    ],
  },
  {
    id: "roe-turun",
    question: "Emiten mana yang ROE-nya turun dua kuartal beruntun?",
    seconds: "1,8",
    blocks: [
      {
        type: "text",
        text: "Empat emiten portofolio mencatat penurunan ROE dua kuartal berturut-turut. SMGR paling tajam, dan sudah berada di bawah ambang mandat internal.",
      },
      {
        type: "table",
        head: ["Emiten", "Q1-26", "Q2-26", "Q3-26", "Total"],
        rows: [
          { cells: ["SMGR", "7,1%", "5,8%", "4,6%", "-2,5 pp"], tone: "neg" },
          { cells: ["BBTN", "9,8%", "9,2%", "8,7%", "-1,1 pp"], tone: "neg" },
          { cells: ["MTEL", "7,6%", "7,1%", "6,8%", "-0,8 pp"], tone: "neg" },
          { cells: ["TINS", "6,0%", "5,6%", "5,2%", "-0,8 pp"], tone: "neg" },
        ],
      },
      {
        type: "bars",
        labels: ["Q1-26", "Q2-26", "Q3-26"],
        max: 12,
        unit: "%",
        series: [
          { name: "SMGR", color: "var(--status-negative)", values: [7.1, 5.8, 4.6] },
          { name: "BBTN", color: "var(--accent-orange)", values: [9.8, 9.2, 8.7] },
        ],
      },
      {
        type: "note",
        text: "Ambang mandat internal belum didefinisikan formal pada Knowledge Base — angka 8% dipakai sebagai asumsi PoC.",
      },
    ],
    citations: ["XBRL Q1–Q3 2026 · 4 emiten", "Kebijakan mandat internal (draf)"],
  },
  {
    id: "sensitivitas-bi",
    question: "Hitung sensitivitas NAV portofolio bila BI rate naik 50 bps.",
    seconds: "3,1",
    blocks: [
      {
        type: "text",
        text: "Kenaikan BI rate 50 bps menekan NAV portofolio sekitar 3,4%, terutama lewat sektor perbankan yang menguasai 38,4% NAV. Sektor energi dan pertambangan relatif tahan karena pendapatannya berbasis komoditas.",
      },
      {
        type: "table",
        head: ["Sektor", "Bobot NAV", "Sensitivitas", "Dampak NAV"],
        rows: [
          { cells: ["Perbankan", "38,4%", "-5,8%", "-2,23 pp"], tone: "neg" },
          { cells: ["Infrastruktur", "9,8%", "-4,1%", "-0,40 pp"], tone: "neg" },
          { cells: ["Telekomunikasi", "12,6%", "-2,6%", "-0,33 pp"], tone: "neg" },
          { cells: ["Energi", "19,2%", "-1,2%", "-0,23 pp"], tone: "neg" },
          { cells: ["Pertambangan", "11,1%", "-1,0%", "-0,11 pp"], tone: "neg" },
        ],
      },
      {
        type: "callout",
        label: "Estimasi dampak total terhadap NAV",
        value: "-3,4%",
        delta: "≈ -Rp 335 T",
        intervalLabel: "Rentang model",
        interval: "-2,1% sampai -4,8%",
        href: "/prediksi",
        cta: "UJI SKENARIO LAIN",
      },
      {
        type: "note",
        text: "Sensitivitas dihitung dari elastisitas historis 36 bulan. Guncangan kebijakan mendadak tidak dimodelkan.",
      },
    ],
    citations: ["Data Makro BI · BI rate 2019–2026", "Model faktor fundamental v1.8", "IDX API"],
  },
  {
    id: "yield-himbara",
    question: "Bandingkan yield dividen seluruh Himbara.",
    seconds: "1,2",
    blocks: [
      {
        type: "text",
        text: "BBNI memimpin yield dividen Himbara di 4,6%, disusul BMRI 4,1%. BBRI justru paling rendah meski labanya terbesar, karena rasio pembayaran dividennya lebih konservatif.",
      },
      {
        type: "bars",
        labels: ["BBNI", "BMRI", "BBTN", "BBRI"],
        max: 6,
        unit: "%",
        series: [
          {
            name: "Yield dividen",
            color: "var(--accent-amber)",
            values: [4.6, 4.1, 3.9, 3.3],
          },
        ],
      },
      {
        type: "table",
        head: ["Emiten", "Yield", "PER", "ROE", "Bobot NAV"],
        rows: [
          { cells: ["BBNI", "4,6%", "9,8x", "14,1%", "7,5%"] },
          { cells: ["BMRI", "4,1%", "11,1x", "19,4%", "14,3%"] },
          { cells: ["BBTN", "3,9%", "7,2x", "8,7%", "1,3%"] },
          { cells: ["BBRI", "3,3%", "12,4x", "16,8%", "18,7%"] },
        ],
      },
      {
        type: "note",
        text: "Formula Dividend Yield belum ditetapkan pada Knowledge Base; PoC memakai dividen 12 bulan dibagi harga penutupan terakhir.",
      },
    ],
    citations: ["XBRL Q3-2026 · 4 bank", "IDX API · harga 26 Sep 2026"],
  },
];

/** Shown as clickable prompts under the composer. */
export const SUGGESTIONS = ANSWERS.map((a) => a.question);

export const FALLBACK: ChatAnswer = {
  id: "fallback",
  question: "",
  seconds: "0,4",
  blocks: [
    {
      type: "text",
      text: "PoC ini memakai jawaban terskrip, jadi hanya empat pertanyaan contoh di bawah yang punya jawaban lengkap. Pilih salah satunya untuk melihat bentuk jawaban bersumber: prosa, tabel, grafik, proyeksi, dan rujukan.",
    },
    {
      type: "note",
      text: "Pada implementasi penuh, pertanyaan bebas diproses lewat RAG: dokumen diambil lebih dulu, lalu jawaban disusun dengan rujukan yang bisa diaudit.",
    },
  ],
  citations: [],
};
