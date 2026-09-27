# Catatan Sesi — Keputusan & Pekerjaan Terbuka

Ringkasan dari sesi pembuatan PoC (26–27 Sep 2026) agar sesi baru bisa
melanjutkan tanpa membaca ulang percakapan panjang. Aturan teknis yang tetap
ada di `CLAUDE.md`; file ini berisi *mengapa*, *di mana*, dan *apa selanjutnya*.

## Lokasi penting

| Apa | Di mana |
|---|---|
| Folder kerja lokal (pakai ini) | `/Users/yusufkamal/Documents/Aura_Analytics/danantara-dashboard` |
| Repo GitHub | `github.com/Yusufkamal02/danantara-dashboard` — branch `main` |
| Situs live | https://danantara-dashboard-poc.vercel.app |
| Knowledge Base (di luar repo ini) | `…/Aura_Analytics/Danantara/docs/Danantara_Dashboard_Investment_Intelligence_Platform_Knowledge_Base.md` |
| Desain acuan | Canvas "Danantara Analytics Terminal" di claude.ai (5 artboard) dan file Figma **Aura**, halaman "Danantara Dashboard Analytics" |

**Jangan edit di folder lain.** `…/Danantara/.worktrees/danantara-dashboard-poc`
adalah worktree lama tempat PoC dibangun — sudah digantikan clone di atas.
Folder `…/Danantara` sendiri ada di branch `main` lokal dengan riwayat yang
sama sekali berbeda; push dari sana akan bentrok. Branch
`danantara-dashboard-mvp` (aplikasi Supabase + data nyata) adalah arah produk
terpisah, hanya ada lokal, belum pernah di-push.

## Keputusan yang sudah disetujui

**Desain**
- Gaya terminal Bloomberg, gelap saja (tidak ada tema terang), IBM Plex Mono
  untuk angka + IBM Plex Sans Condensed untuk label.
- Lima layar: Ikhtisar, Holdings, Laporan Keuangan, Prediksi, Chat AI.
  Holdings dirancang belakangan — tidak ada di desain awal.
- KPI Ikhtisar: "NAV Portofolio" → **Market Cap** (Rp 16.850 T, agregat
  42 emiten) dan "Dividen Diterima" → **Dividend Yield** (3,4%). Keduanya di
  tingkat portofolio, bukan per emiten — ini asumsi, belum dikonfirmasi.
- Panel "Kepemilikan Danantara" di Laporan Keuangan dipangkas jadi
  Nilai posisi + Lembar saham saja.

**Interaksi**
- Hover pada semua grafik: OHLC + volume + RSI + MACD di grafik harga,
  nilai per kuartal di tren rasio, interval 50%/80% di fan chart, nilai
  per bulan di YoY.
- Tabel Holdings: cari, filter sektor, batas kepemilikan minimum, sortir
  semua kolom. KPI dan baris TOTAL dihitung dari baris yang tampil.
- Chat AI **terskrip** (4 pertanyaan di `src/data/chat.ts`), tidak memanggil
  model apa pun.

**Responsif**
- Reflow sungguhan, bukan kanvas yang dikecilkan. Tabel lebar tetap
  mempertahankan lebar kolom dan digeser horizontal, tidak diremas.
- Teks di ponsel ×1,18, termasuk ponsel lanskap. Tampilan desktop dan
  tablet tidak berubah.

**Publikasi**
- Situs dibuka untuk siapa pun yang memegang tautan (paket Vercel Hobby
  tidak punya proteksi yang tetap mengizinkan orang luar tim). Sebagai
  gantinya: banner permanen, noindex, `robots.txt`, dan judul halaman
  bertanda "Mockup PoC". Opsi lain yang ditolak: mengganti nama emiten jadi
  fiktif, upgrade ke Pro, atau hanya lokal.

**Git di mesin ini**
- Identitas global: `Yusuf Kamal <yusufkml.developer@gmail.com>`.
  Commit lama tercatat sebagai `yusufkamal@Mac.lan` (identitas tebakan
  macOS). Kalau ingin commit tertaut ke avatar GitHub, email ini harus
  terverifikasi di akun `Yusufkamal02`.
- Push lewat HTTPS memakai credential helper dari `gh auth setup-git`.

## Pelajaran dari masalah yang sudah terjadi

- **Vercel Authentication bisa menyala lagi sendiri** — terjadi saat proyek
  disambungkan ke GitHub lewat dashboard. Gejalanya: situs mengembalikan
  302 ke `vercel.com/sso-api`. Matikan di Settings → Deployment Protection.
- **Output Directory di Vercel harus kosong.** Mengisinya `out` membuat build
  gagal dengan `NEXT_NO_ROUTES_MANIFEST`. Framework Preset yang kosong
  (`null`) membuat build "READY" tapi semua halaman 404.
- `public/vercel.json` (`cleanUrls`) hanya diperlukan untuk deploy manual
  `vercel deploy out`. Deploy lewat Git memakai builder Next.js dan tidak
  bergantung padanya.
- Status "READY" di Vercel belum tentu berarti situsnya bisa dibuka —
  selalu cek URL-nya langsung.

## Pekerjaan terbuka

**Perlu keputusan Anda**
- [ ] **Visibilitas repo** — masih publik, sehingga kode beserta angka
      fiktif yang menempel ke nama Danantara bisa ditemukan lewat pencarian.
      Pertimbangkan menjadikannya privat.
- [ ] Validasi tiga aturan bisnis karangan: pagu sektor 40%, ambang mandat
      ROE, dan HHI sebagai ukuran konsentrasi.
- [ ] Tetapkan formula yang menurut KB belum terdefinisi: Fundamental Score,
      Effective/Dividend Yield, probabilitas skenario, algoritma sentimen,
      hyperparameter model.
- [ ] Konfirmasi asumsi Market Cap dan Dividend Yield di tingkat portofolio.

**Kebersihan Vercel**
- [ ] Proyek yang tersambung ke GitHub masih bernama `out`. Ada juga proyek
      sisa bernama `danantara-dashboard-poc` dari deploy CLI pertama yang
      tidak dipakai lagi — hapus atau rapikan supaya tidak membingungkan.
- [ ] Opsional: domain kustom.

**Pengembangan berikutnya**
- [ ] Ganti data contoh dengan data nyata (IDX, XBRL) — cukup ubah isi
      `src/data/`. Branch MVP Supabase punya pipeline data nyata yang bisa
      dijadikan acuan.
- [ ] Chat AI sungguhan (RAG dengan rujukan sumber) menggantikan jawaban
      terskrip.
- [ ] Figma: layar Ikhtisar dan Holdings sudah disusun ulang dari komponen;
      Laporan Keuangan, Prediksi, dan Chat AI belum. Ada dua versi Ikhtisar di
      halaman Figma (hasil capture dan versi komponen) — pilih salah satu.
