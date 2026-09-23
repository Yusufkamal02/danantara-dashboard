# Danantara Market Intelligence Dashboard — Design Spec

- **Status:** Approved for implementation planning
- **Date:** 2026-09-22
- **Author:** Yusuf & Claude (approved via brainstorming session in chat)
- **Scope:** MVP — 13 publicly listed companies under Danantara (BKI holding)

## 1. Background & Goals

Danantara (Badan Pengelola Investasi Daya Anagata Nusantara) adalah lembaga
pengelola investasi negara yang menaungi puluhan BUMN. Proyek ini membangun
dashboard internal yang menyajikan data pasar saham dan laporan keuangan
dari perusahaan-perusahaan di bawah Danantara — **bukan** platform trading
(tidak ada eksekusi order/alat perdagangan), murni untuk visualisasi
index/chart saham dan report.

**Use case pertama (MVP):** seluruh 13 perusahaan BUMN yang sahamnya (Seri
B) telah dialihkan ke PT Biro Klasifikasi Indonesia (BKI) sebagai holding
operasional Danantara, berdasarkan PP No. 15 Tahun 2025.

**Goals:**
- Menyediakan dashboard harga saham/index near-real-time (delayed ~15
  menit) untuk 13 perusahaan tersebut.
- Menyediakan report (chart + ringkasan) berbasis laporan keuangan resmi,
  dengan data yang bisa dilacak sumbernya (source of truth).
- Ingestion harga saham **dan** laporan keuangan otomatis & terjadwal
  (bukan input manual) — sesuai kebutuhan efisiensi workflow Danantara.

**Non-goals (di luar scope MVP ini):**
- Tidak ada fitur trading/order execution.
- Tidak ada akses publik/eksternal — v1 hanya internal Danantara, dengan
  login.
- Tidak ada export PDF/Excel di v1 (tampil di layar saja); bisa menyusul
  di fase berikutnya.
- Tidak mencakup seluruh portfolio BUMN Danantara, hanya 13 emiten yang
  sahamnya sudah dialihkan ke BKI.

## 2. Scope: 13 Companies (Verified List)

Diverifikasi dari sumber berita resmi tentang pengalihan saham Seri B ke
BKI per PP No. 15/2025 (per 26 Maret 2025):

| Ticker | Perusahaan | Sektor | % Saham Seri B dialihkan |
|---|---|---|---|
| BBRI | Bank Rakyat Indonesia | Perbankan | 53.19% |
| BMRI | Bank Mandiri | Perbankan | 52.00% |
| BBNI | Bank Negara Indonesia | Perbankan | 60.00% |
| BBTN | Bank Tabungan Negara | Perbankan | 60.00% |
| TLKM | Telkom Indonesia | Telekomunikasi | 52.09% |
| SMGR | Semen Indonesia | Industri | 51.20% |
| JSMR | Jasa Marga | Infrastruktur | 70.00% |
| WIKA | Wijaya Karya | Konstruksi | 91.01% |
| WSKT | Waskita Karya | Konstruksi | 75.35% |
| PTPP | PP (Persero) | Konstruksi | 51.00% |
| ADHI | Adhi Karya | Konstruksi | 64.33% |
| KRAS | Krakatau Steel | Industri | 80.00% |
| GIAA | Garuda Indonesia | Transportasi | 64.53% |

Catatan: Danareksa juga menyerahkan saham ke BKI tapi **tidak tercatat di
BEI** (tidak punya ticker), sehingga tidak relevan untuk chart harga
saham dan dikeluarkan dari scope dashboard ini.

Sumber (diverifikasi ulang langsung dari berita, bukan hasil riset
subagent yang sebelumnya keliru menyertakan ANTM/PTBA/TINS — perusahaan
tersebut adalah anak usaha MIND ID, bukan bagian dari pengalihan saham
ke BKI ini):
- [Tempo — Daftar 14 Emiten BUMN](https://www.tempo.co/ekonomi/daftar-14-emiten-bumn-yang-alihkan-saham-ke-holding-danantara-1224485)
- [CNN Indonesia — Daftar 14 BUMN](https://www.cnnindonesia.com/ekonomi/20250327112854-92-1213631/daftar-14-bumn-yang-sudah-alihkan-saham-ke-danantara)
- [Hukumonline — PT BKI Jadi Kendaraan Danantara](https://www.hukumonline.com/berita/a/pt-bki-jadi-kendaraan-danantara--berikut-14-emiten-bumn-yang-alihkan-saham-ke-holding-lt67e4e49b03a5d/)

Daftar ini disimpan sebagai seed data di tabel `companies`. Angka
finansial (revenue/laba/aset) **tidak** disimpan sebagai hasil riset
chat ini — semua ditarik oleh pipeline ingestion otomatis dari sumber
resmi (lihat §5).

## 3. Architecture Overview

Satu repo Next.js, tanpa servis backend terpisah — semua ingestion
berjalan sebagai scheduled route handlers (Vercel Cron) di repo yang
sama.

```
                Vercel Cron (scheduled route handlers, repo sama)
   ┌──────────────────────────────────────────────────────────────┐
   │ Job 1: Harga saham (±15 menit, jam bursa 09:00–16:00 WIB)     │
   │   → API pihak ketiga (GOAPI.io → upgrade Invezgo/Sectors.app) │
   │   → upsert price_snapshots                                    │
   │                                                                │
   │ Job 2: Fundamental terstruktur (mingguan)                     │
   │   → Sectors.app API (financials endpoint)                     │
   │   → upsert financial_reports (status='verified', auto-publish)│
   │                                                                │
   │ Job 3: AI-extraction dokumen resmi (mingguan, pelengkap Job 2) │
   │   → fetch filing resmi IDX / IR perusahaan                    │
   │   → LLM (provider dikonfigurasi, default Claude) ekstrak       │
   │     angka + kutipan sumber                                     │
   │   → validasi skema & anomali (lonjakan >50% ditandai)         │
   │   → upsert financial_reports (status='needs_review' default)  │
   └───────────────────────────┬────────────────────────────────────┘
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
                 │  - Supabase Auth (login)      │
                 └──────────────┬──────────────┘
                                │ HTTP (widget "Tanya AI" di
                                │ halaman dashboard yang sama)
                                ▼
                 ┌─────────────────────────────┐
                 │  AI Chatbot Service           │
                 │  (repo: danantara_ai,         │
                 │  di-host & dirawat terpisah   │
                 │  oleh tim AI Engineer)        │
                 └─────────────────────────────┘
```

Servis chatbot AI **bukan** bagian dari deployment kita — dihosting &
dirawat sepenuhnya oleh tim AI Engineer (repo terpisah:
[danantara_ai](https://github.com/fardhan248/danantara_ai)). Dashboard
Next.js hanya memanggilnya via HTTP dari widget/panel "Tanya AI" yang
menempel di halaman dashboard utama yang sama (bukan route/halaman
terpisah), tidak terlibat sama sekali dalam Job 1/2/3 di atas.

**Prinsip inti:** jalur data vendor terstruktur (Job 2, Sectors.app)
auto-publish karena sudah divalidasi pihak ketiga yang kredibel. Jalur
AI-extraction (Job 3) — untuk field yang tidak tercakup Job 2 — selalu
lewat review gate manusia sebelum tayang, karena ekstraksi LLM dari
dokumen tidak terstruktur punya risiko salah baca. Ini menjaga "otomatis"
tidak mengorbankan "valid", sesuai permintaan eksplisit Danantara.

## 4. Components

### 4.1 Frontend/App — Next.js (Vercel)
- Next.js App Router, Server Components untuk halaman dashboard (index
  chart, tabel harga, halaman report per perusahaan).
- Route Handlers untuk API internal (client-side widget refresh) **dan**
  untuk 3 scheduled ingestion job di atas (dipicu Vercel Cron).
- Autentikasi via Supabase Auth (email/password), v1 satu role (internal
  Danantara viewer) — tanpa tingkatan akses berbeda.
- Chart/visualisasi: didesain mengikuti skill `dataviz` saat tahap build
  (palet warna, aksesibilitas, konsistensi light/dark).

### 4.2 Database — Supabase (Postgres)

```sql
companies (
  ticker text primary key,
  name text not null,
  sector text not null,
  pct_shares_transferred numeric,
  logo_url text
)

price_snapshots (
  id bigserial primary key,
  ticker text references companies(ticker),
  price numeric not null,
  volume bigint,
  captured_at timestamptz not null,
  source text not null              -- nama provider API
)

financial_reports (
  id bigserial primary key,
  ticker text references companies(ticker),
  period text not null,             -- e.g. 'FY2025', 'Q3-2026'
  revenue numeric,
  net_profit numeric,
  total_assets numeric,
  source_url text not null,         -- link ke dokumen/API resmi
  extraction_method text not null,  -- 'api' | 'ai'
  as_of_date date not null,
  extracted_at timestamptz not null,
  status text not null default 'needs_review'  -- 'verified' | 'needs_review'
)
```

### 4.3 Data Source — Harga Saham
MVP: **GOAPI.io** (free tier, REST API khusus IDX) sebagai sumber awal.
Upgrade ke **Invezgo** (fitur real-time terluas: price/volume/order
book/broker summary) atau **Sectors.app** bila delay/coverage GOAPI
tidak cukup. Yahoo Finance (`.JK` ticker) **tidak** dipakai untuk data
yang ditampilkan ke user — tidak resmi, rawan rate-limit/berubah
sewaktu-waktu, hanya boleh untuk prototyping lokal.

Real-time murni (tick-by-tick) memerlukan lisensi resmi IDX Data
Services yang enterprise-grade (kontrak tahunan, biaya signifikan) — di
luar scope MVP. Delay ~15 menit standar untuk dashboard report (bukan
trading) dan akan ditampilkan jujur di UI ("data delayed ~15 min").

### 4.4 Data Source — Laporan Keuangan
- **Job 2 (utama, terstruktur):** Sectors.app — coverage 99% IDX untuk
  fundamentals/financials, data sudah terstruktur (bukan hasil ekstraksi
  teks), auto-publish karena sudah divalidasi vendor. Perlu konfirmasi
  harga plan "Insider" (butuh signup) di awal implementasi.
- **Job 3 (pelengkap, AI-extraction):** untuk field yang tidak tercakup
  Sectors.app — fetch dokumen resmi (IDX filing / laporan tahunan
  perusahaan), ekstraksi dengan output terstruktur + kutipan sumber,
  validasi skema & sanity-range check terhadap periode sebelumnya,
  default `status='needs_review'`. **Tidak tayang di dashboard sampai
  direview manual** oleh tim Danantara — berlaku untuk provider LLM
  manapun yang dipakai.
  **Provider LLM dapat dikonfigurasi** (keputusan 2026-09-23): satu
  provider aktif dalam satu waktu (bukan cross-check beberapa provider
  sekaligus), dipilih lewat env var `EXTRACTION_PROVIDER` — default
  Claude (`claude-opus-5`), bisa di-switch ke OpenAI (`gpt-6-astra`)
  atau Gemini (`gemini-3.8-flash`) tanpa ubah kode lain, lewat satu
  interface `DocumentExtractor` yang sama untuk ketiganya.

### 4.5 Tanya AI (widget chat, servis eksternal)
**Bukan route/halaman terpisah** — widget/panel chat yang menempel di
halaman dashboard utama yang sama (mis. panel geser dari samping, atau
bubble chat mengambang), supaya user tidak perlu pindah halaman untuk
tanya jawab. User bisa tanya bebas soal laporan keuangan/dokumen resmi
perusahaan, dijawab dengan sitasi nomor halaman. Backend-nya adalah
servis chatbot RAG (LangGraph + FastAPI, LLM self-hosted via Llama.cpp)
yang dibangun & dirawat tim AI Engineer di repo terpisah
[danantara_ai](https://github.com/fardhan248/danantara_ai) — bukan
bagian dari repo/deployment dashboard ini.

- Widget ini tetap di belakang login Supabase Auth yang sama dengan
  sisa dashboard (bukan akses terpisah, karena berada di halaman yang
  sama).
- Next.js memanggil endpoint FastAPI servis tersebut via HTTP, base URL
  & kredensial disimpan sebagai environment variable.
- **Status saat ini (per riset 2026-09-22):** repo & prompt sistemnya
  masih di-hardcode untuk domain modul training "Accurate Online
  Accounting Software" — belum diarahkan ke dokumen finansial Danantara.
  Tim AI Engineer yang bertanggung jawab mengarahkan ulang knowledge
  base-nya; ini dependency eksternal, bukan task kita.
- Fitur ini **tidak boleh jadi blocker rilis MVP** dashboard utama
  (harga saham + report Job 1/2). Kalau servis belum siap/kualitas
  retrieval belum memadai saat MVP rilis, widget "Tanya AI" bisa
  disembunyikan dulu dari halaman dashboard tanpa menghambat fitur lain.

## 5. Error Handling & Data Trust

- Setiap record finansial menyimpan `source_url`, `as_of_date`,
  `extraction_method`, dan `status` — dashboard menampilkan "Sumber:
  [link]" di setiap angka, dan badge status untuk angka yang masih
  `needs_review` (tidak tampil ke viewer biasa, hanya ke reviewer).
- Jika ingestion harga gagal berturut-turut, UI menampilkan indikator
  "data terakhir diperbarui [waktu]", bukan diam-diam menampilkan data
  basi seolah terkini. Data lama tidak ditimpa oleh fetch yang gagal.
- Anomali finansial (lonjakan >50% dari periode sebelumnya) otomatis
  ditandai `needs_review` + notifikasi ke tim, walau sumbernya API
  terstruktur.
- Kegagalan cron job (Vercel Cron) dikirim notifikasi ke tim (email/
  Slack via integration Vercel).
- Jika servis "Tanya AI" (§4.5) down/timeout, widget tersebut
  menampilkan pesan error yang jelas ke user — tidak mem-block atau
  memperlambat rendering sisa halaman dashboard (harga saham/report
  tetap jalan independen, widget di-load terpisah/async).

## 6. Testing Strategy

- Unit test untuk fungsi validasi/normalisasi & pengecekan anomali
  (kasus data valid, out-of-range, malformed).
- Integration test untuk Route Handlers (mock Supabase & API eksternal).
- Validasi manual: sebelum go-live, angka dashboard untuk 13 perusahaan
  dicocokkan manual terhadap laporan resmi IDX/perusahaan.
- Job 1–3 diuji di staging Supabase project terpisah sebelum dijadwalkan
  ke production.

## 7. Deployment

- Repo Git baru, terpisah dari repo Aura_Analytics lainnya.
- Next.js app + cron jobs → Vercel (custom domain menyusul).
- Supabase project (production + staging).

## 8. Open Risks

- **Harga Sectors.app API** belum dikonfirmasi (halaman pricing perlu
  login) — perlu dikonfirmasi di awal implementasi sebelum komit;
  GOAPI.io free tier bisa jadi fallback murah.
- **Kualitas Job 3 (AI-extraction)** bervariasi tergantung format
  dokumen resmi (PDF scan vs text-native) — perlu diuji dengan sample
  laporan riil di awal implementasi. Review gate manual adalah mitigasi
  utama risiko ini.
- **Delay data harga**: real-time murni perlu lisensi resmi IDX yang
  mahal; MVP pakai polling ~15 menit, ditampilkan jujur ke user.
- **Dependency eksternal "Tanya AI"**: servis & knowledge base-nya
  dikelola tim AI Engineer terpisah, di luar kendali/timeline kita.
  Konten saat ini belum diarahkan ke dokumen Danantara, dan tim mereka
  sendiri mencatat kualitas retrieval "belum terlalu memuaskan" —
  perlu dikonfirmasi kesiapannya sebelum halaman ini ditayangkan.
- Insiden proses: draft spec pertama untuk dokumen ini ditulis sepihak
  oleh subagent riset yang mengabaikan instruksi (lihat riwayat commit
  git) dan berisi daftar perusahaan yang keliru (ANTM/PTBA/TINS bukan
  bagian dari BKI/Danantara). Dokumen ini menggantikannya sepenuhnya
  setelah proses persetujuan yang benar.
