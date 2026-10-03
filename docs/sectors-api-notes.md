# Catatan Proyek: Sectors API (override untuk skill `sectors-agent-skills`)

Berkas ini MENIMPA skill `sectors-api` dari repo supertypeai/sectors-agent-skills bila ada konflik.
Alasan: skill menulis API v1 dan tidak menyebut credit; proyek ini memakai **v2** dengan kuota credit.
Rujukan resmi: https://docs.sectors.app/llms.txt (halaman API reference v2).

## Aturan wajib
1. Gunakan **v2** (`https://api.sectors.app/v2/...`). Jangan memakai contoh `/v1` dari skill.
2. API key hanya dari environment variable `SECTORS_API_KEY` (`.env` masuk `.gitignore`). Jangan pernah commit key.
3. Header autentikasi memakai key mentah tanpa "Bearer" (menurut skill; **verifikasi** di v2).
4. Ticker disimpan tanpa `.JK`. Sectors mengembalikan simbol dengan `.JK`.
5. Cakupan hanya 13 emiten milik Danantara (tabel `companies`). Jangan memanggil seluruh universe.
6. Setiap panggilan harus dicatat di `ingestion_runs` (jumlah credit terpakai).
7. Jangan retry buta. Cek status HTTP dulu; 403 = autentikasi/kuota, 404 = tidak ada.

## Biaya credit (kuota 5.000/bulan, reset bulanan)
| Endpoint | Biaya | Catatan |
| --- | --- | --- |
| `GET /v2/daily/{symbol}` | 1 per panggilan | Jendela maks 90 hari. Hari kosong tetap dihitung. |
| `GET /v2/financials/quarterly/{symbol}` | 1 per kuartal yang dikembalikan | Gunakan filter agar hanya meminta kuartal baru. |
| News | 1 per panggilan | 30 artikel per halaman. |
| Tanggal kuartal terbaru | 1 per halaman (30 emiten) | Pakai filter `since`; sekitar 1 credit/hari. |
| Full-Universe Close | sekitar 32 credit/hari | Tidak lebih murah, hanya harga tutup. Jangan dipakai. |

Backfill: harga 5 tahun = 21 panggilan per ticker (273 credit untuk 13 emiten); fundamental 9 kuartal = 117 credit.

## Aturan data
- Harga end-of-day: jalankan job harian **setelah bursa tutup**; lewati hari libur BEI (kalender perdagangan + cek ticker sentinel).
- Berita: kunci unik = URL `source` (tidak ada ID artikel). Timestamp tanpa zona waktu (kemungkinan WIB). Jangan mengandalkan `next_offset`. Kolom `symbols` bisa kosong.
- Satuan: respons laporan keuangan dalam rupiah penuh; UI PoC menampilkan miliar. Volume dari Sectors dalam lembar; UI PoC memakai lot (ribuan). Konversi di lapisan tampilan. **Skill menyebut market cap IDX dalam miliar rupiah (v1); cek satuan di v2 sebelum menyimpan.**
- RSI, MACD, MA dihitung internal; tidak disimpan.
- Rasio yang tidak disediakan Sectors (ROE, ROA, ROI, NIM, CIR, NPL, CAR, DuPont) dihitung internal dengan `formula_version`. Beberapa rumus belum terdefinisi di Knowledge Base.

## Belum terverifikasi (uji dengan data nyata sebelum dipakai)
1. Data kuartalan kumulatif (YTD) atau per kuartal.
2. Harga disesuaikan (split/dividen) atau tidak.
3. Isi `revenue` dan `operating_expense` untuk bank; apakah beban operasional sudah termasuk provisi.
4. Apakah kuartal lama direvisi oleh Sectors.
5. Format header autentikasi v2 dan satuan market cap v2.
6. Apakah panggilan lewat MCP memakai kuota credit yang sama.
7. Legal: penggunaan komersial pada plan Insider, penyimpanan/redistribusi data, ringkasan LLM atas berita, batas rate, jadwal Enterprise.

## Cara memakai skill bersama berkas ini
- Pasang lewat plugin: `claude plugin install sectors-api@sectors-agent-skills`.
- Skill dipakai untuk contoh pemanggilan dan skrip `check_setup.py`.
- Jika skill dan berkas ini berbeda, ikuti berkas ini, lalu dokumentasi v2 resmi.
- Periksa lisensi repo skill sebelum menyalin isinya ke repo proyek.
