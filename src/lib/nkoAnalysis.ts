import { NkoMonth, NkoRow } from './parsers';
import { MONTHS_LONG } from './sheets';

export interface NkoChange {
  row: NkoRow;
  prev: NkoRow | undefined;
  delta: number;
  detail: string;
}
export interface NkoAlert { level: 'crit' | 'warn'; title: string; detail: string }
export interface NkoAnalysis {
  cur: NkoMonth;
  cmp: NkoMonth;
  d110: number | null;
  d100: number | null;
  up: NkoChange[];
  down: NkoChange[];
  alerts: NkoAlert[];
}

const r2 = (v: number | null | undefined) => (v == null ? 0 : v);
const cap = (v: number | null) => (v == null ? null : Math.min(110, v));
const indicators = (m: NkoMonth) => m.rows.filter((r) => r.kind === 'indicator');
export const monthName = (m: NkoMonth) => { const n = MONTHS_LONG[m.monthNo - 1] ?? m.tab; return n.charAt(0) + n.slice(1).toLowerCase(); };
const short = (r: NkoRow) => `${r.no} ${r.short}`;

/** True when every indicator's realisasi in `a` equals `b` (tab likely copied, not updated). */
export function identicalData(a: NkoMonth, b: NkoMonth): boolean {
  const ia = indicators(a);
  if (!ia.length) return false;
  return ia.every((r) => (b.rows.find((x) => x.no === r.no && x.kind === 'indicator')?.realSdRaw ?? '#') === r.realSdRaw);
}

export function analyseNko(months: NkoMonth[], curNo: number, cmpNo: number): NkoAnalysis | null {
  const cur = months.find((m) => m.monthNo === curNo);
  const cmp = months.find((m) => m.monthNo === cmpNo);
  if (!cur || !cmp) return null;
  const changes: NkoChange[] = indicators(cur).map((row) => {
    const prev = cmp.rows.find((x) => x.no === row.no && x.kind === 'indicator');
    const delta = r2(row.nilai110) - r2(prev?.nilai110);
    let detail: string;
    if (row.penalty) detail = `realisasi ${row.realSdRaw || '0'}`;
    else if (delta < 0) detail = `${row.realSdRaw || '—'} (${monthName(cmp)} ${prev?.realSdRaw || '—'})`;
    else detail = `${row.realSdRaw || '—'} vs target ${row.targetSdRaw || '—'}`;
    return { row, prev, delta, detail };
  });
  const up = changes.filter((c) => c.delta > 0.005).sort((a, b) => b.delta - a.delta);
  const down = changes.filter((c) => c.delta < -0.005).sort((a, b) => a.delta - b.delta);

  const alerts: NkoAlert[] = [];
  // MASALAH indicators, with "cannot recover this year" when cumulative realisasi already breaches the year-end target
  for (const row of indicators(cur)) {
    if (row.penalty || row.status !== 'MASALAH') continue;
    let since = cur;
    for (const m of [...months].sort((a, b) => b.monthNo - a.monthNo)) {
      if (m.monthNo > cur.monthNo) continue;
      const r = m.rows.find((x) => x.no === row.no && x.kind === 'indicator');
      if (r?.status === 'MASALAH') since = m; else break;
    }
    const yearEnd = row.monthly[11]?.target ?? null;
    const lost = r2(cur.rows.find((x) => x.no === row.no)?.bobotNum) * 1.1;
    const merah = cur.merah.find((k) => k.indikator.toUpperCase().includes(row.short.toUpperCase()));
    const stuck = row.lowerBetter && yearEnd != null && row.realSd != null && row.realSd > yearEnd;
    let detail = `Realisasi ${row.realSdRaw} vs target ${row.targetSdRaw}`;
    if (stuck) detail += ` · melewati target akhir tahun (${String(yearEnd).replace('.', ',')}), ±${lost.toFixed(2).replace('.', ',')} poin tidak bisa pulih tahun ini`;
    if (merah?.penyebab) detail += ` · Penyebab: ${merah.penyebab.replace(/\s+/g, ' ').slice(0, 160)}`;
    alerts.push({ level: 'crit', title: `${short(row)} berstatus MASALAH sejak ${monthName(since)}`, detail });
  }
  // copied / not-updated tabs
  for (const m of [cur, cmp]) {
    const before = months.find((x) => x.monthNo === m.monthNo - 1);
    if (before && identicalData(m, before) && !alerts.some((a) => a.title.startsWith(`Data ${monthName(m)}`))) {
      alerts.push({ level: 'warn', title: `Data ${monthName(m)} identik dengan ${monthName(before)}`, detail: `Semua realisasi tidak berubah, hanya target yang bergeser. Cek apakah tab ${m.tab} sudah di-update.` });
    }
  }
  const c110 = cap(cur.total110), p110 = cap(cmp.total110);
  return {
    cur, cmp,
    d110: c110 != null && p110 != null ? c110 - p110 : null,
    d100: cur.total100 != null && cmp.total100 != null ? cur.total100 - cmp.total100 : null,
    up, down, alerts,
  };
}
