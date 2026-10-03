/**
 * DATA CONTOH — scripted assistant answers.
 *
 * Nothing here calls a model. Each question maps to a fixed, pre-written
 * answer so the PoC can demonstrate the shape of a sourced response — prose,
 * a table, a chart, a projection callout and citations — without an API key,
 * a backend, or the risk of a model inventing figures on stage.
 */

import { HOLDINGS } from "@/data/holdings";

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

/**
 * Answers reachable only through the conversation history. Kept separate from
 * ANSWERS so the composer's four suggestion chips stay as designed.
 */
const SCREENED = HOLDINGS.filter((h) => h.per !== null && h.per < 12 && h.roe > 15).sort((a, b) => b.roe - a.roe);

export const HISTORY_ANSWERS: ChatAnswer[] = [
  {
    id: "ckpn-naik",
    question: "Emiten mana yang beban CKPN-nya naik lebih dari 10% QoQ?",
    seconds: "1,6",
    blocks: [
      {
        type: "text",
        text: "Tiga bank portofolio mencatat kenaikan beban CKPN di atas 10% QoQ pada Q3-2026. BBTN paling tajam, sejalan dengan NPL gross yang naik ke 3,4%.",
      },
      {
        type: "table",
        head: ["Emiten", "CKPN Q2-26", "CKPN Q3-26", "QoQ"],
        rows: [
          { cells: ["BBTN", "Rp 1.084 M", "Rp 1.238 M", "+14,2%"], tone: "neg" },
          { cells: ["BRIS", "Rp 912 M", "Rp 1.020 M", "+11,8%"], tone: "neg" },
          { cells: ["BBRI", "Rp 8.904 M", "Rp 9.846 M", "+10,6%"], tone: "neg" },
        ],
      },
      {
        type: "note",
        text: "Ambang 10% QoQ dipilih pengguna, bukan batas kebijakan. Rp dalam miliar, belum diaudit.",
      },
    ],
    citations: ["XBRL Q2–Q3 2026 · 3 bank", "Siaran pers BBRI 24 Sep 2026"],
  },
  {
    id: "ringkasan-tlkm",
    question: "Ringkas laporan keuangan Q3-2026 TLKM.",
    seconds: "2,2",
    blocks: [
      {
        type: "text",
        text: "Pendapatan TLKM tumbuh tipis 2,4% YoY, tetapi margin EBITDA turun 1,1 pp karena beban interkoneksi dan penyusutan jaringan fiber. Manajemen memangkas belanja modal 6% untuk menjaga arus kas bebas.",
      },
      {
        type: "table",
        head: ["Pos", "Q3-25", "Q3-26", "YoY"],
        rows: [
          { cells: ["Pendapatan", "Rp 37,8 T", "Rp 38,7 T", "+2,4%"] },
          { cells: ["EBITDA", "Rp 19,6 T", "Rp 19,6 T", "+0,1%"] },
          { cells: ["Margin EBITDA", "51,8%", "50,7%", "-1,1 pp"], tone: "neg" },
          { cells: ["Laba bersih", "Rp 6,1 T", "Rp 5,8 T", "-4,9%"], tone: "neg" },
          { cells: ["Belanja modal", "Rp 7,4 T", "Rp 6,9 T", "-6,0%"] },
        ],
      },
      {
        type: "callout",
        label: "ROE terkini · TLKM",
        value: "17,6%",
        href: "/laporan-keuangan",
        cta: "BUKA LAPORAN KEUANGAN",
      },
    ],
    citations: ["XBRL TLKM Q3-2026 §L/R", "Paparan publik TLKM 2026"],
  },
  {
    id: "screener",
    question: "Saring emiten portofolio dengan PER di bawah 12x dan ROE di atas 15%.",
    seconds: "0,9",
    blocks: [
      {
        type: "text",
        text: `${SCREENED.length} emiten lolos saringan, semuanya dengan yield dividen di atas rata-rata portofolio 3,4%.`,
      },
      {
        type: "table",
        head: ["Emiten", "PER", "ROE", "Yield", "Bobot NAV"],
        rows: SCREENED.map((h) => ({
          cells: [
            h.ticker,
            `${h.per!.toFixed(1).replace(".", ",")}x`,
            `${h.roe.toFixed(1).replace(".", ",")}%`,
            `${h.dividendYield.toFixed(1).replace(".", ",")}%`,
            `${h.weight.toFixed(1).replace(".", ",")}%`,
          ],
        })),
      },
      {
        type: "note",
        text: "Dihitung langsung dari tabel Holdings. BBRI nyaris lolos — PER 12,4x.",
      },
    ],
    citations: ["Tabel Holdings · 23 emiten", "IDX API · harga 26 Sep 2026"],
  },
  {
    id: "nikel-antm",
    question: "Seberapa besar dampak harga nikel terhadap laba ANTM?",
    seconds: "2,7",
    blocks: [
      {
        type: "text",
        text: "Setiap perubahan 10% harga nikel LME menggeser laba bersih ANTM sekitar 6,8% ke arah yang sama. Kontrak pasokan jangka panjang dengan mitra Korea mengunci sekitar 35% volume, sehingga sensitivitasnya lebih rendah dari tahun lalu.",
      },
      {
        type: "table",
        head: ["Harga nikel", "Laba bersih 2027F", "Perubahan"],
        rows: [
          { cells: ["-20%", "Rp 3,1 T", "-13,6%"], tone: "neg" },
          { cells: ["-10%", "Rp 3,4 T", "-6,8%"], tone: "neg" },
          { cells: ["Dasar", "Rp 3,6 T", "—"] },
          { cells: ["+10%", "Rp 3,9 T", "+6,8%"] },
        ],
      },
      {
        type: "note",
        text: "Elastisitas dari regresi 36 bulan. Tidak memodelkan kebijakan larangan ekspor bijih.",
      },
    ],
    citations: ["XBRL ANTM 2023–Q3 2026", "Siaran pers ANTM · kontrak nikel", "Data harga LME"],
  },
  {
    id: "dividen-2027",
    question: "Berapa proyeksi dividen yang diterima Danantara pada 2027?",
    seconds: "3,4",
    blocks: [
      {
        type: "text",
        text: "Dividen tunai yang diterima Danantara dari emiten tercatat diproyeksikan Rp 118 T pada 2027, naik 7,3% dari estimasi 2026. Empat bank Himbara dan TLKM menyumbang sekitar 78%.",
      },
      {
        type: "bars",
        labels: ["BBRI", "BMRI", "TLKM", "BBNI", "PTBA"],
        max: 40,
        unit: "Rp T",
        series: [
          { name: "2026E", color: "var(--text-secondary)", values: [31.2, 26.4, 12.8, 9.6, 5.1] },
          { name: "2027F", color: "var(--accent-amber)", values: [33.8, 28.9, 13.1, 10.4, 4.6] },
        ],
      },
      {
        type: "callout",
        label: "Total dividen diterima 2027F",
        value: "Rp 118 T",
        delta: "+7,3% YoY",
        intervalLabel: "Rentang skenario",
        interval: "Rp 104 T — Rp 129 T",
      },
    ],
    citations: ["Model dividen v1.2", "Kebijakan dividen RUPS 2026 · 5 emiten"],
  },
];

/** Every scripted answer, for matching typed questions. */
export const ALL_ANSWERS: ChatAnswer[] = [...ANSWERS, ...HISTORY_ANSWERS];

export interface Conversation {
  id: string;
  group: string;
  title: string;
  /** Scripted answers replayed in order when the conversation is opened. */
  answerIds: string[];
}

/** Earlier conversations in the history panel; opening one replays it. */
export const CONVERSATIONS: Conversation[] = [
  { id: "c-roe", group: "Hari ini", title: "Perbandingan ROE Himbara Q3-26", answerIds: ["roe-himbara", "yield-himbara"] },
  { id: "c-ckpn", group: "Hari ini", title: "Emiten dengan CKPN naik >10% QoQ", answerIds: ["ckpn-naik"] },
  { id: "c-bi", group: "Hari ini", title: "Sensitivitas NAV terhadap BI rate", answerIds: ["sensitivitas-bi"] },
  { id: "c-tlkm", group: "Kemarin", title: "Ringkasan laporan Q3 TLKM", answerIds: ["ringkasan-tlkm"] },
  { id: "c-screener", group: "Kemarin", title: "Screener PER < 12 dan ROE > 15%", answerIds: ["screener"] },
  { id: "c-nikel", group: "Minggu ini", title: "Dampak harga nikel ke ANTM", answerIds: ["nikel-antm"] },
  { id: "c-dividen", group: "Minggu ini", title: "Proyeksi dividen 2027", answerIds: ["dividen-2027"] },
];

/** Files the composer accepts. They stay in the browser as object URLs. */
export type AttachmentKind = "image" | "audio" | "video" | "document";

/** Document extensions accepted alongside image/audio/video MIME types. */
export const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt", "md", "rtf", "odt", "ods", "odp", "json"];

/** Documents a browser tab can show itself; the rest are downloaded. */
export const VIEWABLE_DOCUMENTS = ["pdf", "txt", "md", "csv", "json"];

export interface ChatAttachment {
  name: string;
  kind: AttachmentKind;
  /** Bytes. */
  size: number;
}

export const ATTACHMENT_LIMITS = { maxFiles: 6, maxBytes: 100 * 1024 * 1024 };

export const ATTACHMENT_LABEL: Record<AttachmentKind, string> = {
  image: "Gambar",
  audio: "Suara",
  video: "Video",
  document: "Dokumen",
};

/** "1,4 MB" — Indonesian decimal comma, like every other figure here. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v.toFixed(v < 10 ? 1 : 0).replace(".", ",")} ${units[u]}`;
}

/** Scripted reply to a message with attachments: acknowledge, never analyse. */
export function mediaAnswer(files: ChatAttachment[], question: string): ChatAnswer {
  const kinds = Array.from(new Set(files.map((f) => ATTACHMENT_LABEL[f.kind].toLowerCase())));
  return {
    id: "media",
    question,
    seconds: "0,3",
    blocks: [
      {
        type: "text",
        text: `${files.length} lampiran diterima (${kinds.join(", ")}). PoC ini belum menganalisis isi lampiran, jadi yang bisa ditampilkan baru daftar berkasnya. Lampiran hanya diputar di browser Anda — tidak diunggah ke server mana pun.`,
      },
      {
        type: "table",
        head: ["Berkas", "Jenis", "Ukuran"],
        rows: files.map((f) => ({ cells: [f.name, ATTACHMENT_LABEL[f.kind], formatBytes(f.size)] })),
      },
      {
        type: "note",
        text: "Pada implementasi penuh: gambar (tangkapan layar grafik, tabel laporan) dibaca lewat OCR/vision, rekaman suara dan video (paparan publik, RUPS) ditranskripsi, dokumen (PDF, Word, Excel, PowerPoint) diekstrak teks dan tabelnya, lalu isinya diindeks agar bisa dirujuk dalam jawaban.",
      },
    ],
    citations: [],
  };
}

export const FALLBACK: ChatAnswer = {
  id: "fallback",
  question: "",
  seconds: "0,4",
  blocks: [
    {
      type: "text",
      text: "PoC ini memakai jawaban terskrip, jadi hanya pertanyaan contoh di bawah dan percakapan di Riwayat yang punya jawaban lengkap. Pilih salah satunya untuk melihat bentuk jawaban bersumber: prosa, tabel, grafik, proyeksi, dan rujukan.",
    },
    {
      type: "note",
      text: "Pada implementasi penuh, pertanyaan bebas diproses lewat RAG: dokumen diambil lebih dulu, lalu jawaban disusun dengan rujukan yang bisa diaudit.",
    },
  ],
  citations: [],
};
