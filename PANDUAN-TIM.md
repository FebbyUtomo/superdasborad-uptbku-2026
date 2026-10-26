# Panduan Tim — Dashboard KPI PLN UPT Bengkulu

Website: https://plnuptbengkulu.web.id
Repo: pln-uptbku/superdasborad-uptbku-2026 · Hosting: Vercel (project `uptbku-1`), auto-deploy dari branch `main`.
Pengelola: Febby P. Utomo & Putri (Owner organization `pln-uptbku`).

## 1. Teknologi
- Vite + React + TypeScript + Tailwind CSS (website statis / SPA).
- Data dibaca langsung (live) dari Google Sheets publik lewat export CSV — tidak ada database.
- PDF dibuat di browser dengan jsPDF.
- Satu serverless function: `api/galeri.js` (baca folder Google Drive untuk Galeri).

## 2. Struktur folder
```
src/
  App.tsx              routing + sidebar/menu + footer
  components/ui.tsx    komponen umum (Card, StatCard, PageHeader, LoadingScreen, logo)
  components/charts.tsx grafik
  components/AnalisaNko.tsx panel Analisa Perubahan NKO
  lib/sheets.ts        ID spreadsheet + daftar tab cadangan (gid) + fungsi ambil CSV
  lib/parsers.ts       mengubah isi sheet menjadi data siap tampil
  lib/data.tsx         penyedia data (cache, tombol Refresh Data)
  lib/nkoAnalysis.ts   logika analisa NKO
  lib/ultg.ts          logika Kinerja ULTG (rekap gangguan + mapping ULTG)
  lib/ultgPdf.ts       poster PDF ULTG + tema nasional bulanan (themeFor)
  pages/*.tsx          satu file per halaman
public/
  logo-uptbku.png      logo resmi (transparan)
  pdf/                 aset PDF & banner: hdr-<bulan>.jpg, danantara.png, upt.png, pln.png
api/galeri.js          serverless Galeri Kegiatan
.github/workflows/auto-backup.yml  backup otomatis tiap update main
```

## 3. Halaman & sumber data
| Halaman | Route | File | Sumber data |
|---|---|---|---|
| Dashboard | `/` | pages/Home.tsx | ringkasan dari semua sheet |
| Kinerja NKO | `/kinerja` | pages/Kinerja.tsx | Sheet NKO (tab bulanan 1.JAN … 12.DES) |
| Tegakan (NS) | `/tegakan` | pages/Tegakan.tsx | Sheet Tegakan |
| Realisasi Penebangan | `/penebangan` | pages/Penebangan.tsx | Sheet Penebangan (tab per ULTG) |
| Kerawanan Transmisi | `/kerawanan` | pages/Kerawanan.tsx | Sheet Kerawanan, tab SELURUH DATA |
| Monitoring Gangguan | `/gangguan` | pages/Gangguan.tsx | Sheet Gangguan, tab UPTBKU |
| Galeri Kegiatan | `/galeri` | pages/Galeri.tsx | Google Drive (folder bulan › bidang › foto) |
| Kinerja ULTG | `/ultg` | pages/Ultg.tsx | Sheet NKO: kolom REKAP GANGGUAN tiap bulan + tab ASET |

ID spreadsheet ada di `src/lib/sheets.ts` (objek `SHEETS`). Semua sheet harus tetap "Siapa saja yang memiliki link dapat melihat", kalau tidak, dashboard kosong.

**Update data cukup di Google Sheets** — website otomatis membaca data terbaru (klik "Refresh Data"). Jangan ubah nama tab/kolom tanpa menyesuaikan parser.

## 4. Menjalankan di komputer sendiri
```
git clone https://github.com/pln-uptbku/superdasborad-uptbku-2026.git
cd superdasborad-uptbku-2026
npm install
npm run dev        # buka http://localhost:5173
npm run build      # cek tidak ada error sebelum push
```

## 5. Alur update yang aman
1. Buat branch baru: `git checkout -b nama-perubahan`.
2. Ubah kode, jalankan `npm run build` (harus sukses).
3. Push branch → Vercel membuat **link preview**. Cek tampilan desktop & HP.
4. Kalau sudah OK, merge ke `main` (lewat Pull Request). Website live otomatis update ±1–2 menit.
5. Setiap update `main`, versi sebelumnya otomatis disimpan sebagai tag `backup-YYYY-MM-DD-HHMM-<sha>`.
6. Untuk perubahan besar, buat juga tag manual sebelum mulai: `backup-YYYY-MM-DD-<deskripsi>`.

## 6. Rollback (kembali ke versi lama)
- Cepat: Vercel › project uptbku-1 › Deployments › pilih deploy lama › **Instant Rollback**.
- Permanen: lihat tab **Tags** di GitHub, ambil commit backup, lalu kembalikan `main` ke commit tersebut.

## 7. Pekerjaan rutin
- **Artwork bulanan**: banner ULTG & PDF memakai `public/pdf/hdr-<nomor bulan>.jpg` (mis. `hdr-11.jpg` untuk November). Siapkan sebelum bulan berjalan; kalau belum ada, otomatis tampil navy polos. Tema teks bulanan diatur di `themeFor()` (`src/lib/ultgPdf.ts`).
- **Tab bulan baru di Sheet NKO**: otomatis terbaca; tambahkan gid ke daftar cadangan di `sheets.ts` bila perlu.

## 8. Jangan
- Jangan hapus record DNS TXT `_vercel` di Sumopod (domain plnuptbengkulu.web.id).
- Jangan push langsung perubahan besar ke `main` tanpa preview.
- Jangan simpan password/token di repo (repo publik).
