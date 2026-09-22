# Danantara Market Intelligence Dashboard — Design Spec

- **Status:** Approved for implementation planning
- **Date:** 2026-09-22
- **Author:** Yusuf (with Claude)
- **Scope:** MVP — Top 10 companies under Danantara

## 1. Background & Goals

Danantara (Badan Pengelola Investasi Daya Anagata Nusantara) adalah lembaga
pengelola investasi negara yang menaungi puluhan BUMN. Proyek ini membangun
dashboard internal yang menyajikan data pasar saham dan laporan
keuangan dari perusahaan-perusahaan di bawah Danantara — **bukan** platform
trading (tidak ada eksekusi order/alat perdagangan), murni untuk
visualisasi index/chart saham dan report.

**Use case pertama (MVP):** Top 10 perusahaan BUMN dengan kapitalisasi
pasar terbesar yang sahamnya sudah dialihkan ke Danantara (via PT BKI).

**Goals:**
- Menyediakan dashboard index/harga saham near-real-time untuk 10
  perusahaan tersebut.
- Menyediakan report (chart + narasi) berbasis laporan keuangan resmi,
  dengan data yang bisa dilacak sumbernya (source of truth).
- Data ingestion otomatis dan terjadwal, bukan input manual.

**Non-goals (di luar scope MVP ini):**
- Tidak ada fitur trading/order execution.
- Tidak ada akses publik/eksternal — v1 hanya internal Danantara.
- Tidak mencakup seluruh portfolio BUMN Danantara, hanya Top 10.

## 2. Top 10 Companies (Seed List)

Diverifikasi dari 14 emiten BUMN yang telah mengalihkan saham Seri B ke
Danantara (per Tempo, Media Indonesia, Katadata, IDN Times, Feb–Mar 2025),
dipersempit ke 10 berdasarkan kapitalisasi pasar & likuiditas:

| Ticker | Perusahaan | Sektor |
|---|---|---|
| BBRI | Bank Rakyat Indonesia | Perbankan |
| BMRI | Bank Mandiri | Perbankan |
| BBNI | Bank Negara Indonesia | Perbankan |
| BBTN | Bank Tabungan Negara | Perbankan |
| TLKM | Telkom Indonesia | Telekomunikasi |
| ANTM | Aneka Tambang (anak usaha MIND ID) | Pertambangan |
| PTBA | Bukit Asam (anak usaha MIND ID) | Pertambangan |
| TINS | Timah (anak usaha MIND ID) | Pertambangan |
| JSMR | Jasa Marga | Infrastruktur |
| SMGR | Semen Indonesia | Industri |

Daftar ini adalah **seed data**, dikonfirmasi user, disimpan sebagai
initial rows di tabel `companies`. Tidak hardcode angka finansial —
semua angka revenue/laba/aset ditarik oleh pipeline ingestion dari
sumber resmi (lihat §5), bukan dari riset chat ini.

## 3. Architecture Overview

```
                     ┌─────────────────────────────┐
                     │   GitHub Actions (cron)      │
                     │  ┌─────────────────────────┐ │
                     │  │  LangGraph ingestion job │ │
                     │  │  (Python)                │ │
                     │  └───────────┬─────────────┘ │
                     └──────────────┼───────────────┘
                                    │ writes
                                    ▼
                     ┌─────────────────────────────┐
                     │   Supabase (Postgres + Auth) │
                     └──────────────┬──────────────┘
                                    │ reads
                                    ▼
                     ┌─────────────────────────────┐
                     │  Next.js app (Vercel)        │
                     │  - Server Components (UI)    │
                     │  - Route Handlers (internal   │
                     │    API for client widgets)    │
                     │  - Supabase Auth (login)      │
                     └─────────────────────────────┘
```

Prinsip pemisahan: **ingestion (LangGraph) dan presentation (Next.js)
tidak saling memanggil langsung** — satu-satunya kontrak di antara
keduanya adalah skema database Supabase. Ini membuat masing-masing bisa
dikembangkan, di-deploy, dan di-debug independen.

## 4. Components

### 4.1 Frontend/App — Next.js (Vercel)
- Next.js App Router, Server Components untuk halaman dashboard (index
  chart, tabel harga, halaman report per perusahaan).
- Route Handlers untuk API internal yang dipakai client-side widgets
  (misal refresh chart tanpa reload halaman).
- Autentikasi via Supabase Auth (email/password), v1 satu role
  (internal Danantara viewer) — tanpa tingkatan akses berbeda.
- Chart/visualisasi: didesain mengikuti skill `dataviz` saat tahap
  build (palet warna, aksesibilitas, konsistensi light/dark).
- Export report ke PDF per perusahaan/periode.

### 4.2 Database — Supabase (Postgres)
Skema inti:

```sql
companies (
  ticker text primary key,
  name text not null,
  sector text not null,
  logo_url text
)

price_snapshots (
  id bigserial primary key,
  ticker text references companies(ticker),
  price numeric not null,
  volume bigint,
  captured_at timestamptz not null
)

financial_reports (
  id bigserial primary key,
  ticker text references companies(ticker),
  period text not null,          -- e.g. 'FY2025', 'Q3-2026'
  revenue numeric,
  net_profit numeric,
  total_assets numeric,
  source_url text not null,       -- link ke dokumen resmi
  extracted_at timestamptz not null,
  status text not null default 'needs_review'  -- 'verified' | 'needs_review'
)
```

### 4.3 Data Ingestion — LangGraph (Python, scheduled)
Dijalankan sebagai scheduled job via **GitHub Actions** (bukan server
yang nyala 24/7 — menghindari biaya & maintenance infra tambahan untuk
MVP). Dua graph terpisah:

**Graph A — Harga saham** (tiap 15 menit, jam bursa 09:00–16:00 WIB):
1. `fetch_prices` — tool call ke data API (lihat §5) untuk 10 ticker.
2. `normalize` — validasi schema & rentang wajar (sanity check).
3. `upsert_supabase` — tulis ke `price_snapshots`.
4. Retry edge: jika API gagal/rate-limited, retry dengan backoff; jika
   tetap gagal, log kegagalan (lihat §7) tanpa menulis data parsial.

**Graph B — Laporan keuangan** (mingguan):
1. `fetch_filing` — ambil dokumen resmi terbaru (IDX filing / IR
   perusahaan) per ticker.
2. `extract_financials` — LLM (Claude, via Anthropic API) mengekstrak
   revenue/laba/total aset dari dokumen tidak terstruktur (PDF/HTML),
   dengan reasoning untuk cross-check angka antar bagian laporan.
3. `validate` — schema check + sanity-range check terhadap laporan
   periode sebelumnya (mis. lonjakan >500% ditandai anomali).
4. `upsert_supabase` — simpan dengan `status='needs_review'` jika
   validasi tidak lolos penuh, `status='verified'` jika lolos semua
   check. `needs_review` tidak tampil di dashboard sampai direview
   manual — mencegah angka AI-extracted yang salah tayang tanpa cek.

### 4.4 Data Source — Harga Saham
Rekomendasi: **Sectors.app** (API khusus Indonesia, mencakup harga +
fundamentals, coverage 99% IDX) sebagai sumber utama — perlu daftar
akun untuk konfirmasi harga plan "Insider"-nya di tahap implementasi.
Yahoo Finance (`.JK` ticker via `yfinance`) boleh dipakai sebagai
fallback gratis **hanya untuk prototyping awal**, tidak untuk data yang
ditampilkan ke user karena sifatnya tidak resmi (rawan rate-limit/
berubah sewaktu-waktu).

## 5. Error Handling & Data Trust

- Setiap record finansial menyimpan `source_url` + `extracted_at` —
  dashboard bisa menampilkan "Sumber: [link]" di setiap angka.
- Extraction AI yang tidak lolos validasi masuk status `needs_review`,
  tidak otomatis tampil — mencegah AI hallucination sampai ke user
  tanpa verifikasi manusia.
- Jika ingestion harga gagal berturut-turut, UI menampilkan indikator
  "data terakhir diperbarui [waktu]" di dashboard, bukan diam-diam
  menampilkan data basi seolah terkini.
- GitHub Actions run failures mengirim notifikasi (GitHub Actions
  built-in email/Slack notification) ke tim.

## 6. Testing Strategy

- Unit test untuk fungsi `normalize` dan `validate` (kasus data
  valid, out-of-range, malformed).
- Integration test untuk Route Handlers Next.js (mock Supabase).
- Validasi manual: sebelum go-live, angka dashboard untuk 10
  perusahaan dicocokkan manual terhadap laporan resmi IDX/perusahaan.
- LangGraph graph diuji di staging Supabase project terpisah sebelum
  dijadwalkan ke production.

## 7. Deployment

- Repo Git baru, terpisah dari repo Aura_Analytics lainnya.
- Next.js app → Vercel (custom domain menyusul).
- Supabase project (production + staging).
- LangGraph ingestion → GitHub Actions scheduled workflow di repo yang
  sama, terpisah folder (`/ingestion`) dari app Next.js (`/app` atau
  root Next.js project).

## 8. Open Risks

- **Harga Sectors.app API** belum dikonfirmasi (halaman pricing
  memerlukan login) — perlu dikonfirmasi di awal implementasi sebelum
  komit ke provider ini; jika terlalu mahal, Twelve Data adalah
  alternatif (coverage IDX lebih umum, bukan Indonesia-khusus).
- **Delay data**: "real-time" murni (tick-by-tick) memerlukan lisensi
  resmi IDX yang mahal; MVP ini menggunakan polling 15 menit yang
  standar untuk dashboard report (bukan trading).
- **Kualitas ekstraksi AI** dari laporan keuangan bervariasi tergantung
  format dokumen resmi (PDF scan vs text-native) — perlu diuji dengan
  sample laporan riil di awal implementasi.
