# Aturan Update & Backup

1. Setiap push ke `main` otomatis membuat tag backup dari versi sebelumnya: `backup-YYYY-MM-DD-HHMM-<sha>` (GitHub Action "Auto backup sebelum update").
2. Untuk perubahan besar, buat juga backup manual sebelum mulai: tag `backup-YYYY-MM-DD-<deskripsi>` di commit `main` saat ini.
3. Rollback: lihat daftar tag di GitHub (Tags), lalu kembalikan `main` ke commit tag tersebut, atau gunakan Instant Rollback di Vercel.
4. Kerjakan di branch, cek link preview Vercel, baru merge ke `main`.
5. Repo: pln-uptbku/superdasborad-uptbku-2026 (Owner: Febby & Putri). Vercel project uptbku-1 auto-deploy dari main.
