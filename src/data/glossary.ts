/**
 * Glossary shown as hover tooltips on dashboard terms.
 *
 * Definitions are condensed from
 * docs/Danantara_Dashboard_Investment_Intelligence_Platform_Knowledge_Base.md
 * (v1.0). The `ref` field points back at the section so a reader can find the
 * fuller explanation. Where the knowledge base states that a formula is NOT
 * defined by the source, the entry says so rather than inventing one.
 */

export interface GlossaryEntry {
  /** Expanded name, when the term is an abbreviation. */
  full?: string;
  body: string;
  /** Knowledge-base section number. */
  ref: string;
  /** Flagged where production must still pin down a formula. */
  undefinedFormula?: boolean;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  IHSG: {
    full: "Indeks Harga Saham Gabungan",
    body: "Indikator pergerakan pasar saham Indonesia secara keseluruhan. Dipakai sebagai benchmark: portofolio naik 2% belum berarti unggul kalau IHSG naik 5% pada periode yang sama.",
    ref: "§5.1",
  },
  "IJ EQUITY": {
    body: "Konvensi terminal data: BBRI = ticker, IJ = kode pasar Indonesia, EQUITY = jenis instrumen saham.",
    ref: "§5.3",
  },
  CHG: {
    full: "Change",
    body: "Perubahan harga terhadap basis pembanding yang dipakai sistem.",
    ref: "§5.4",
  },
  YTD: {
    full: "Year to Date",
    body: "Periode sejak awal tahun sampai tanggal pengukuran. Return YTD di September berarti kinerja Januari sampai September.",
    ref: "§6.1",
  },
  MoM: {
    full: "Month over Month",
    body: "Perbandingan bulan berjalan dengan bulan sebelumnya.",
    ref: "§6.2",
  },
  QoQ: {
    full: "Quarter over Quarter",
    body: "Perbandingan kuartal berjalan dengan kuartal sebelumnya, misalnya Q3-26 vs Q2-26.",
    ref: "§6.3",
  },
  YoY: {
    full: "Year over Year",
    body: "Perbandingan terhadap periode yang sama satu tahun sebelumnya, misalnya Q3-26 vs Q3-25.",
    ref: "§6.4",
  },
  pp: {
    full: "percentage points",
    body: "Selisih antar nilai persentase, bukan perubahan relatif. ROE 15% → 16% adalah +1 pp, bukan +1%.",
    ref: "§6.5",
  },
  NAV: {
    full: "Net Asset Value",
    body: "Nilai bersih portofolio. Dipakai sebagai basis bobot: NAV Rp 9.842 T dengan perbankan 38,4% berarti eksposur sektor itu sekitar Rp 3.779 T.",
    ref: "§8.2",
  },
  "Market Cap": {
    full: "Market Capitalisation",
    body: "Nilai pasar seluruh saham beredar emiten portofolio, bukan hanya porsi yang dimiliki Danantara. Berbeda dari NAV, yang hanya menghitung nilai kepemilikan.",
    ref: "interpretasi konseptual",
  },
  TWR: {
    full: "Time-Weighted Return",
    body: "Metode pengukuran kinerja yang meredam pengaruh setoran dan penarikan dana, sehingga fokus pada performa aset, bukan perubahan nilai akun.",
    ref: "§10.3",
  },
  "Dividend Yield": {
    body: "Dividen relatif terhadap harga atau basis nilai tertentu. Formula persisnya belum ditetapkan sumber dan harus didefinisikan saat implementasi.",
    ref: "§66.3",
    undefinedFormula: true,
  },
  "Weighted ROE": {
    body: "Agregasi ROE portofolio yang memperhitungkan bobot tiap perusahaan.",
    ref: "§10.6",
  },
  ROE: {
    full: "Return on Equity",
    body: "Laba bersih relatif terhadap ekuitas. Mengukur seberapa produktif modal pemegang saham menghasilkan laba.",
    ref: "§20.1",
  },
  ROA: {
    full: "Return on Assets",
    body: "Laba relatif terhadap total aset. Menunjukkan efisiensi aset dalam menghasilkan laba.",
    ref: "§20.2",
  },
  ROI: {
    full: "Return on Investment",
    body: "Imbal hasil relatif terhadap nilai investasi.",
    ref: "§20.3",
  },
  NIM: {
    full: "Net Interest Margin",
    body: "Selisih pendapatan dan beban bunga relatif terhadap aset produktif — ukuran inti profitabilitas bank.",
    ref: "§20.4",
  },
  CIR: {
    full: "Cost to Income Ratio",
    body: "Beban operasional dibanding pendapatan operasional. Angka yang turun berarti efisiensi membaik.",
    ref: "§20.5",
  },
  RSI: {
    full: "Relative Strength Index",
    body: "Indikator momentum harga; (14) adalah periode perhitungan. Tidak sebaiknya dipakai sendirian sebagai dasar keputusan investasi.",
    ref: "§11.8",
  },
  MACD: {
    full: "Moving Average Convergence Divergence",
    body: "Membantu membaca momentum, arah tren, dan perubahan momentum. Parameter 12, 26, 9 adalah konfigurasi periodenya.",
    ref: "§11.9",
  },
  Volume: {
    body: "Jumlah lot yang diperdagangkan pada periode tersebut. Lonjakan volume menandai minat pasar yang tidak biasa.",
    ref: "§11.7",
  },
  PPOP: {
    full: "Pre-Provision Operating Profit",
    body: "Laba operasional sebelum beban pencadangan. Memperlihatkan daya hasil inti sebelum efek CKPN.",
    ref: "§23.5",
  },
  CKPN: {
    full: "Cadangan Kerugian Penurunan Nilai",
    body: "Pencadangan untuk mengantisipasi potensi kerugian aset, terutama kredit. Kenaikan CKPN menekan laba bersih walau pendapatan tumbuh.",
    ref: "§23.6",
  },
  EPS: {
    full: "Earnings Per Share",
    body: "Laba yang dialokasikan per lembar saham.",
    ref: "§23.9",
  },
  DuPont: {
    body: "Menguraikan ROE menjadi margin laba bersih × perputaran aset × pengganda ekuitas, untuk menjawab: ROE terbentuk dari komponen apa?",
    ref: "§24",
  },
  PER: {
    full: "Price to Earnings Ratio",
    body: "Harga saham dibanding laba per saham. Kalau EPS negatif, PER tidak bermakna dan ditampilkan sebagai —.",
    ref: "§66.2",
  },
  DER: {
    full: "Debt to Equity Ratio",
    body: "Mengukur hubungan utang terhadap ekuitas.",
    ref: "§18",
  },
  "NPL Gross": {
    full: "Non-Performing Loan",
    body: "Tingkat kredit bermasalah pada basis gross.",
    ref: "§18",
  },
  Covenant: {
    body: "Ketentuan atau batas yang harus dipenuhi berdasarkan perjanjian pembiayaan, kebijakan internal, atau mandat tertentu.",
    ref: "§18",
  },
  HHI: {
    full: "Herfindahl-Hirschman Index",
    body: "Ukuran konsentrasi, HHI = Σ(bobot²). Portofolio yang tersebar menghasilkan HHI rendah; terpusat di sedikit aset menghasilkan HHI tinggi.",
    ref: "§71",
  },
  SHAP: {
    full: "SHapley Additive exPlanations",
    body: "Menjelaskan kontribusi tiap faktor terhadap keluaran model. Ternormalisasi berarti nilainya diskalakan agar antar faktor bisa dibandingkan.",
    ref: "§57",
  },
  MAPE: {
    full: "Mean Absolute Percentage Error",
    body: "Rata-rata besar kesalahan proyeksi dalam persentase absolut. Makin kecil, makin dekat proyeksi ke realisasi.",
    ref: "§50",
  },
  "Akurasi arah": {
    body: "Seberapa sering model benar menebak arah perubahan, naik atau turun. 74,2% bukan berarti harganya tepat 74,2%.",
    ref: "§51",
  },
  "Cakupan interval": {
    body: "Seberapa sering nilai realisasi jatuh di dalam interval prediksi yang ditetapkan, diukur pada level 80%.",
    ref: "§52",
  },
  LSTM: {
    full: "Long Short-Term Memory",
    body: "Arsitektur jaringan saraf untuk data berurutan; dipakai menangkap pola deret waktu harga.",
    ref: "§41",
  },
  XGBoost: {
    body: "Model gradient boosting berbasis pohon keputusan, kuat untuk data tabular seperti faktor fundamental dan makro.",
    ref: "§42",
  },
  Ensemble: {
    body: "Menggabungkan beberapa model agar kelemahan satu model tertutup oleh model lain.",
    ref: "§43",
  },
  RUPS: {
    full: "Rapat Umum Pemegang Saham",
    body: "Forum pengambilan keputusan pemegang saham. Danantara perlu menentukan arah suara pada agenda yang dibahas.",
    ref: "§13.3",
  },
  "Cum Date": {
    body: "Batas tanggal kepemilikan saham agar berhak atas dividen yang dibagikan.",
    ref: "§13.1",
  },
  Himbara: {
    body: "Himpunan Bank Milik Negara — kelompok bank BUMN yang jadi basis peer comparison portofolio.",
    ref: "§15.1",
  },
  RBAC: {
    full: "Role-Based Access Control",
    body: "Pembatasan akses data berdasarkan peran pengguna. Analis membaca data pasar dan laporan publik; notulen internal butuh persetujuan lebih tinggi.",
    ref: "§31",
  },
  RAG: {
    full: "Retrieval Augmented Generation",
    body: "Jawaban AI disusun dari dokumen yang diambil lebih dulu, sehingga setiap pernyataan bisa dirujuk ke sumbernya.",
    ref: "§34",
  },
  "T+1": {
    body: "Data tersedia satu hari kerja setelah periode terjadi — lazim untuk laporan keuangan terstruktur.",
    ref: "§27",
  },
};

/** Terms sorted longest-first so multi-word matches win over their fragments. */
export const GLOSSARY_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
