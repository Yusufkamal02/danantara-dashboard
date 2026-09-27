@AGENTS.md

# Danantara Analytics Terminal — Mockup PoC

Dashboard statis interaktif bergaya terminal Bloomberg untuk portofolio
Danantara. Next.js 16 (App Router) + React 19 + TypeScript, `output: "export"`
— tidak ada server, tidak ada database, tidak ada API. Semua grafik SVG buatan
sendiri, tanpa library grafik.

**Seluruh angka adalah DATA CONTOH.** Nama emiten nyata (BBRI, BMRI, TLKM, …),
nilainya fiktif. Situsnya publik bagi yang memegang tautan, jadi ini penting.

## Perintah

- `npm run dev` — pratinjau lokal di http://localhost:3000
- `npm run build` — build statis ke `out/`; wajib lolos sebelum push
- `npx eslint .` dan `npx tsc --noEmit` — harus bersih

## Struktur

- `src/app/<rute>/page.tsx` — enam layar: `/` Ikhtisar, `/holdings`,
  `/laporan-keuangan`, `/laporan-tahunan`, `/prediksi`, `/chat`
- `src/components/Shell.tsx` — app bar, pita meta, tab, banner disclaimer
- `src/components/chat/` — `ChatContext` (satu percakapan untuk seluruh app,
  dipasang di `layout.tsx`), `ChatPopup` (tombol mengambang di setiap layar,
  disembunyikan di `/chat`), `Transcript` (transkrip + composer bersama)
- `src/components/EmitenList.tsx` — daftar emiten yang bisa dipilih
- `src/components/Panel.tsx` — Panel, KpiTile, BarRow, AlertRow, Treemap
- `src/components/Term.tsx` — tooltip glosarium; di-portal ke `<body>` dengan
  posisi `fixed` dan dijepit ke viewport (mengikuti kursor, pindah sisi bila
  mentok tepi layar)
- `src/components/charts/` — PricePanel (candlestick + volume + RSI + MACD),
  ForecastChart (fan chart), MiniCharts (tren rasio, YoY, donat, sparkline)
- `src/data/` — **semua** data contoh. Komponen tidak boleh menulis angka
  langsung; ganti data di sini saja.
- `src/data/glossary.ts` — definisi istilah, diringkas dari Knowledge Base;
  field `ref` menunjuk nomor bagiannya. Istilah tambahan PoC tanpa `ref`
  otomatis diberi label "belum ada di Knowledge Base".
- `src/data/prng.ts` — PRNG ber-seed bersama (`seeded`, `gaussian`, `seedOf`)
- `src/data/fundamentals.ts` — `buildFundamentals(ticker)`: BBRI memakai angka
  tulisan tangan; emiten lain diturunkan dari barisnya di Holdings + PRNG
- `src/data/annual.ts` — indikator laporan tahunan per bidang (Operasional,
  Teknologi/IT, MSDM/HRD, Risk, Marketing/Sales, ESG) lewat `buildAnnual(ticker)`
- `src/app/globals.css` — token desain dan seluruh aturan responsif

## Aturan yang tidak boleh dilanggar

- **Banner "MOCKUP PoC / data contoh" di `Shell.tsx` wajib tetap ada** dan
  tidak boleh dibuat bisa ditutup. Begitu juga `robots` noindex di
  `layout.tsx` dan `public/robots.txt`. Situs ini mengaitkan angka fiktif ke
  institusi dan emiten nyata.
- **Ukuran font di style inline ditulis `calc(Npx * var(--fs-scale))`**, bukan
  angka biasa. `--fs-scale` bernilai 1 di desktop dan 1,18 di ponsel. Atribut
  `fontSize={n}` pada `<text>` SVG dikecualikan — satuannya viewBox.
- **Tata letak lewat kelas CSS, bukan inline style.** Inline style tidak bisa
  kena media query. Kelas yang dipakai: `main-grid`, `col col-left|col-main|col-right`,
  `tile-row`, `split-row`, `chart-slot`, `panel-grow`, `panel-chart`.
  Lebar kolom samping diatur per halaman lewat `--col-left` / `--col-right`.
- Panel yang isinya grafik pengisi-kotak wajib diberi `className="panel-chart"`;
  tanpa itu grafiknya menciut jadi nol di ponsel.
- Jangan menaruh tombol di dalam tombol — `<Term>` adalah `<button>`, jadi
  jangan membungkusnya dengan `<button>` lain (memicu hydration error).
- Warna hanya lewat token `var(--…)` dari `:root` di `globals.css`.
- Seri data dibangkitkan dengan PRNG ber-seed (`src/data/prng.ts`) agar render
  server dan klien sama. Jangan pakai `Math.random()` atau `Date.now()` saat render.
- Emiten terpilih di Laporan Keuangan dan Laporan Tahunan disimpan di URL
  (`?emiten=TLKM`). `useSearchParams` wajib di dalam `<Suspense>` yang
  fallback-nya merender BBRI, supaya HTML statis tidak kosong.

## Responsif

Breakpoint: ≥1280 tiga kolom · 960–1279 dua kolom (rail kanan turun) ·
≤959 satu kolom · ≤640 ponsel. Ponsel lanskap dideteksi lewat
`(pointer: coarse) and (max-height: 500px)`, bukan lebar.
Setelah mengubah layout, cek tidak ada overflow horizontal di lebar 390px.

## Deploy

Push ke `main` di GitHub (`Yusufkamal02/danantara-dashboard`) otomatis
memicu build Vercel. Setelan proyek Vercel: Framework Preset **Next.js**,
Output Directory **dikosongkan**. Mengisi Output Directory dengan `out` membuat
build gagal (`NEXT_NO_ROUTES_MANIFEST`).

## Belum divalidasi — jangan dianggap fakta

- Tiga aturan bisnis di layar Holdings dikarang untuk PoC: pagu sektor 40%,
  ambang mandat ROE, dan HHI sebagai ukuran konsentrasi.
- Elastisitas slider asumsi di Prediksi (BI rate -6%/pp, kredit +1,5%/pp,
  NPL -4%/pp terhadap target harga) dikarang, bukan hasil model.
- KPI per grup Filter Global di Ikhtisar (`FILTER_GROUPS`) dan seluruh
  indikator Laporan Tahunan — termasuk pemilihan indikatornya — adalah
  asumsi PoC; belum ada definisi baku dari Knowledge Base.
- Knowledge Base sendiri menyatakan formula berikut belum ditetapkan:
  Fundamental Score, Effective Yield / Dividend Yield, probabilitas skenario,
  algoritma sentimen, hyperparameter model prediksi.

## Catatan sesi

Keputusan yang sudah diambil, lokasi penting, dan pekerjaan terbuka:
@SESSION_NOTES.md
