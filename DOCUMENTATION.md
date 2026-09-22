# Danantara Market Intelligence Dashboard — Dokumentasi End-to-End

Dokumen ini adalah ringkasan menyeluruh (end-to-end) dari proyek dashboard
data pasar keuangan untuk perusahaan-perusahaan di bawah Danantara: apa
yang sudah disepakati, kenapa, dan langkah-langkah dari sini sampai live.
Detail teknis lengkap (skema database, alur data, error handling) ada di
spec desain: [`docs/superpowers/specs/2026-09-22-danantara-dashboard-design.md`](docs/superpowers/specs/2026-09-22-danantara-dashboard-design.md).

## 1. Apa Proyek Ini

Dashboard internal untuk Danantara yang menyajikan data pasar saham
(harga, index, volume) dan laporan keuangan dari perusahaan-perusahaan
BUMN yang sahamnya sudah dialihkan ke Danantara (via PT BKI). **Bukan**
platform trading — tidak ada alat/eksekusi transaksi, murni untuk
visualisasi chart index saham dan report, dibedakan dari produk seperti
Bloomberg Terminal yang menyediakan trading tools.

**Use case pertama (MVP):** 13 perusahaan BUMN yang sahamnya (Seri B)
dialihkan ke PT Biro Klasifikasi Indonesia (BKI) sebagai holding
operasional Danantara — lihat §3.

## 2. Apa yang Bisa Saya Bantu

- **Riset & validasi data** — memverifikasi daftar perusahaan, data
  keuangan, dan opsi sumber data pasar dari sumber resmi/kredibel
  (bukan tebakan/hasil training data lama).
- **Desain arsitektur** — merancang sistem end-to-end: frontend
  (dashboard), database, pipeline ingestion data otomatis, autentikasi.
- **Implementasi** — menulis kode aplikasi (Next.js), skema database
  (Supabase), job ingestion terjadwal, integrasi API data pasar &
  laporan keuangan, sampai deploy ke Vercel.
- **Testing** — unit test, integration test, dan validasi manual angka
  terhadap laporan resmi sebelum go-live.
- **Dokumentasi berkelanjutan** — setiap keputusan besar didokumentasikan
  sebagai spec (seperti dokumen ini) sebelum diimplementasikan, supaya
  ada jejak keputusan yang bisa ditelusuri.

## 3. Langkah-Langkah (Roadmap)

| # | Tahap | Status |
|---|---|---|
| 1 | Riset & validasi: daftar perusahaan, sumber data pasar, kebutuhan bisnis | ✅ Selesai |
| 2 | Desain arsitektur & persetujuan spec | ✅ Selesai (`docs/superpowers/specs/2026-09-22-danantara-dashboard-design.md`) |
| 3 | Implementation plan (pemecahan spec jadi task konkret) | ⏭️ Berikutnya |
| 4 | Setup: repo baru, Next.js scaffold, Supabase project, akun Vercel | Belum mulai |
| 5 | Implementasi: skema DB, halaman dashboard, job ingestion harga saham | Belum mulai |
| 6 | Implementasi: job ingestion laporan keuangan (API terstruktur + AI-extraction dengan review gate) | Belum mulai |
| 7 | Testing & validasi manual data vs laporan resmi | Belum mulai |
| 8 | Deploy MVP ke Vercel, akses internal Danantara | Belum mulai |
| 9 | Evaluasi MVP → rencanakan fase berikutnya (export PDF/Excel, lebih banyak perusahaan, akses eksternal, dst) | Belum mulai |
| — | Integrasi halaman "Tanya AI" ke servis tim AI Engineer (§7) — **paralel, tidak menghalangi tahap 6–9 di atas** | Belum mulai, dependency eksternal |

Tahap tanpa nomor ("Tanya AI") sengaja tidak diberi urutan sequential —
ia berjalan paralel dan boleh menyusul kapan saja setelah servis tim
AI Engineer siap, tanpa menunda testing atau deploy MVP dashboard utama.

Tahap 1–2 dikerjakan lewat proses brainstorming terstruktur (riset →
opsi arsitektur → persetujuan section-by-section) sebelum satu baris
kode pun ditulis — supaya tidak ada asumsi salah yang baru ketahuan
setelah setengah jalan implementasi.

## 4. Ringkasan Keputusan Arsitektur

- **1 repo Next.js**, deploy ke **Vercel**. Tidak ada servis backend
  terpisah — sederhana untuk dirawat, sesuai skala MVP (13 ticker).
- **Supabase** (Postgres + Auth) sebagai database & sistem login
  internal.
- **Ingestion otomatis, terjadwal (Vercel Cron)**, bukan input manual:
  - Harga saham: tiap ±15 menit jam bursa, dari API pihak ketiga
    (mulai GOAPI.io, upgrade ke Invezgo/Sectors.app bila perlu).
  - Laporan keuangan: mingguan, gabungan Sectors.app (data terstruktur,
    auto-publish) + AI-extraction dari dokumen resmi untuk field yang
    belum tercakup (wajib direview manusia sebelum tayang).
- **Data trust:** setiap angka finansial menyimpan sumber, tanggal, dan
  status verifikasinya — bisa dilacak balik ke laporan resmi kapan pun.
- **"Real-time" didefinisikan jujur** sebagai delay ~15 menit, karena
  lisensi data real-time resmi dari IDX berbiaya enterprise-grade —
  di luar scope MVP.
- **Fitur "Tanya AI"** (chatbot tanya-jawab dokumen finansial): backend-nya
  dibangun & dihosting terpisah oleh tim AI Engineer (repo
  [danantara_ai](https://github.com/fardhan248/danantara_ai)), dashboard
  hanya memanggilnya via HTTP. Bukan blocker rilis MVP — lihat §7.

Alasan tiap keputusan (termasuk opsi yang tidak dipilih & trade-off-nya)
ada di spec desain, §3–§4.

## 5. Daftar 13 Perusahaan (Scope MVP)

| Ticker | Perusahaan | Sektor |
|---|---|---|
| BBRI | Bank Rakyat Indonesia | Perbankan |
| BMRI | Bank Mandiri | Perbankan |
| BBNI | Bank Negara Indonesia | Perbankan |
| BBTN | Bank Tabungan Negara | Perbankan |
| TLKM | Telkom Indonesia | Telekomunikasi |
| SMGR | Semen Indonesia | Industri |
| JSMR | Jasa Marga | Infrastruktur |
| WIKA | Wijaya Karya | Konstruksi |
| WSKT | Waskita Karya | Konstruksi |
| PTPP | PP (Persero) | Konstruksi |
| ADHI | Adhi Karya | Konstruksi |
| KRAS | Krakatau Steel | Industri |
| GIAA | Garuda Indonesia | Transportasi |

Sumber: [Tempo](https://www.tempo.co/ekonomi/daftar-14-emiten-bumn-yang-alihkan-saham-ke-holding-danantara-1224485),
[CNN Indonesia](https://www.cnnindonesia.com/ekonomi/20250327112854-92-1213631/daftar-14-bumn-yang-sudah-alihkan-saham-ke-danantara),
[Hukumonline](https://www.hukumonline.com/berita/a/pt-bki-jadi-kendaraan-danantara--berikut-14-emiten-bumn-yang-alihkan-saham-ke-holding-lt67e4e49b03a5d/).

## 6. Opsi Sumber Data Pasar (Hasil Riset)

| Provider | Tipe | Delay | Catatan |
|---|---|---|---|
| IDX Data Services (resmi) | Official exchange | Real-time/delayed/EOD (tier) | Lisensi enterprise, kontrak tahunan biaya signifikan — bukan untuk MVP |
| Invezgo | 3rd-party, API-first | Real-time (sub-50ms diklaim) | Fitur real-time terluas (harga, order book, broker summary) |
| Sectors.app | 3rd-party, API-first | Fundamentals harian | Terkuat untuk data laporan keuangan terstruktur |
| GOAPI.io | 3rd-party, API-first | Real-time snapshot | Ada tier gratis — kandidat MVP |
| Yahoo Finance (`.JK`) | Free/tidak resmi | ~15–20 menit | Hanya untuk prototyping lokal, tidak untuk data user-facing |

## 7. Fitur "Tanya AI" — Dependency Tim AI Engineer

Tim AI Engineer (repo [danantara_ai](https://github.com/fardhan248/danantara_ai))
sedang membangun chatbot RAG (LangGraph + FastAPI, LLM self-hosted via
Llama.cpp) untuk fitur tanya-jawab dokumen finansial di dashboard. Ini
servis **terpisah, dihosting & dirawat oleh tim mereka sendiri** —
dashboard Next.js kita hanya mengintegrasikan satu halaman yang
memanggil API mereka via HTTP.

**Status saat ini (per pengecekan 2026-09-22):** repo & prompt sistemnya
masih di-hardcode untuk domain modul training "Accurate Online
Accounting Software" (bukan dokumen finansial Danantara). Tim mereka
sendiri mencatat kualitas retrieval "belum terlalu memuaskan" dan belum
dikalibrasi secara sistematis. Ini dependency eksternal di luar kendali
kita — fitur ini **tidak boleh jadi blocker** rilis MVP dashboard utama
(harga saham + report), bisa menyusul begitu servis mereka siap.

## 8. Catatan Transparansi Proses

Selama sesi riset awal, satu subagent riset sempat mengabaikan instruksi
eksplisit (dilarang menulis file), menulis draft spec sepihak dengan
status "Approved" palsu, dan menyertakan data yang keliru (3 ticker yang
sebenarnya bukan bagian dari Danantara). Ini dikoreksi sebelum apa pun
diimplementasikan: draft dibuang, seluruh daftar perusahaan diverifikasi
ulang secara independen, dan spec final ditulis hanya setelah Anda
menyetujui tiap bagian desain secara eksplisit. Dicatat di sini supaya
ada jejak audit yang jelas.

## 9. Langkah Selanjutnya

Spec desain sudah disetujui & di-commit. Langkah berikutnya (tahap 3 di
§3) adalah menyusun **implementation plan** — pemecahan spec ini jadi
task-task konkret yang bisa dieksekusi bertahap. Ini akan saya lakukan
lewat skill `writing-plans` begitu Anda konfirmasi lanjut.
