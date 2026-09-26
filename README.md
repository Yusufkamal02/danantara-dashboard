# Danantara Analytics Terminal — Mockup PoC

Dashboard statis interaktif untuk **Danantara Investment Intelligence Platform**.
Dibangun dari lima layar desain yang sudah disetujui dan dari
`docs/Danantara_Dashboard_Investment_Intelligence_Platform_Knowledge_Base.md`.

> **Seluruh angka di aplikasi ini adalah DATA CONTOH.** Nama emiten nyata,
> nilainya tidak. Tidak ada koneksi ke IDX, XBRL, Supabase, atau model apa pun.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
```

Build statis (tanpa server, bisa ditaruh di hosting statis mana pun):

```bash
npm run build    # keluarannya di out/
```

## Lima layar

| Rute | Layar | Pertanyaan yang dijawab (KB §4) |
|---|---|---|
| `/` | Ikhtisar | Apa yang sedang terjadi pada portfolio? |
| `/holdings` | Holdings | Apa yang dimiliki dan apa yang harus ditindaklanjuti? |
| `/laporan-keuangan` | Laporan Keuangan | Bagaimana kesehatan fundamental perusahaan? |
| `/prediksi` | Prediksi & Skenario | Apa yang mungkin terjadi ke depan? |
| `/chat` | Chat AI | Apa yang dikatakan data dan dokumen? |

## Yang benar-benar interaktif

- **Grafik harga** (`/`) — crosshair dengan pembacaan OHLC, volume, RSI, dan
  MACD pada titik yang di-hover; tombol rentang 1M/3M/6M/1T/5T menyusun ulang
  seri.
- **Tren rasio profitabilitas** (`/laporan-keuangan`) — hover membaca ROE, ROI,
  dan ROA sekaligus pada kuartal yang sama.
- **Fan chart proyeksi** (`/prediksi`) — hover membedakan leg realisasi dan
  proyeksi, lengkap dengan batas interval 50% dan 80%.
- **Pertumbuhan YoY** (`/`) — hover membaca nilai per bulan.
- **Tabel holdings** (`/holdings`) — pencarian, filter sektor, batas
  kepemilikan minimum, dan sortir per kolom. KPI dan baris TOTAL dihitung ulang
  dari baris yang sedang tampil, bukan angka tetap.
- **Chat AI** (`/chat`) — empat pertanyaan contoh dengan jawaban terskrip:
  prosa, tabel, grafik, kotak proyeksi, dan rujukan sumber.
- **Tooltip glosarium** — istilah seperti NAV, TWR, RSI, MACD, DuPont, SHAP,
  HHI, PER bisa di-hover atau di-Tab untuk memunculkan definisi yang ditarik
  dari Knowledge Base, lengkap dengan nomor bagiannya.

## Struktur

```
src/app/            satu folder per layar + globals.css (token desain)
src/components/     Shell, Panel, KpiTile, BarRow, AlertRow, Treemap, Term
src/components/charts/  PricePanel, ForecastChart, MiniCharts
src/data/           seluruh data contoh, terpisah dari komponen
```

Mengganti data contoh dengan data nyata berarti mengubah isi `src/data/`
saja — tidak ada komponen yang menulis angka secara langsung.

## Catatan dari Knowledge Base

KB menandai beberapa hal sebagai **belum didefinisikan sumbernya** dan harus
ditetapkan sebelum produksi:

- formula lengkap Fundamental Score 74/100 (§26);
- definisi Effective Yield dan Dividend Yield (§10.5, §66.3);
- cara menghitung probabilitas skenario Bearish/Base/Bullish (§55);
- algoritma sentiment analysis (§12.2);
- fitur dan hyperparameter model prediksi (§41–46);
- detail formula tiap risk threshold (§17).

Selain itu, beberapa aturan bisnis pada layar Holdings **dikarang untuk PoC ini**
dan perlu divalidasi: pagu internal sektor 40%, ambang mandat ROE, dan pemakaian
HHI sebagai ukuran konsentrasi.

## Hubungan dengan branch lain

Branch ini sengaja terpisah dari `danantara-dashboard-mvp`, yang merupakan
aplikasi berbasis data nyata (Supabase, cron harga, review queue). PoC ini
tidak berbagi kode dengan branch tersebut dan tidak dimaksudkan untuk digabung
begitu saja.
