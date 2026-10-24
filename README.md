# PLN KPI Dashboard — UPT Bengkulu (v2, rebuild)

Static SPA (Vite + React + TypeScript + Tailwind + Recharts, jsPDF for PDF export). No backend.
All data is fetched **client-side from public Google Sheets** at page load and on **Refresh Data** (cache-busting, `cache: no-store`).

| Page | Route | Source spreadsheet | Tab(s) |
|---|---|---|---|
| Dashboard (HOME) | `/` | all below | — |
| Kinerja NKO | `/kinerja` | `1GcyqF-CRESZyPRbeSObV7SWF-MseWjJtOmofF_4nPjQ` | `1.JAN` … `12.DES` (auto-detected) |
| Tegakan (NS) | `/tegakan` | `1w-AVZFdqKP7MOTAsn42bIqLtH9A5zfg2lq4qSiyH1ms` | `TARIKAN NEW SRINTAMI`, `TREN KRITIS/BAHAYA 1/BAHAYA 2/NORMAL` |
| Realisasi Penebangan | `/penebangan` | `11W9Ozw_JMKq4_nezHlQ9l7aLxY0x-8wwaufzNZRtO-A` | `ULTG PEKALONGAN 2024-2026`, `ULTG LAHAT 2024-2026` |
| Kerawanan Transmisi | `/kerawanan` | `1klVILSFsrBGMvkmj6y84QRk3ax69knShhdw-_0MsJ2Y` | `SELURUH DATA` |
| Monitoring Gangguan | `/gangguan` | `1HHv9iiUom0jxtqFcUtF79orS1s8j-x-sW3nxvOXAMaE` | `UPTBKU` |
| Kinerja ULTG | `/ultg` | placeholder (SOON) | — |

Tabs are discovered by name from the sheet's public `htmlview` (fallback gids in `src/lib/sheets.ts`), so new monthly tabs (e.g. `11.NOV`) appear automatically.
Sheets must stay shared as "Anyone with the link can view".

```bash
npm install
npm run dev     # local
npm run build   # -> dist/
```
Vercel: `vercel.json` (framework vite, output `dist`, SPA rewrites).
