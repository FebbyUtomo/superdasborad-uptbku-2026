import { Grid } from './sheets';

export type Ultg = 'PEKALONGAN' | 'LAHAT';
export interface UltgEvent { date: string; time: string; line: string; type: 'Reclose' | 'Trip'; cause: string; cluster: string; raw: string; ultg: Ultg | null; kinerja?: string }

const NAME_CODE: [RegExp, string][] = [
  [/suka\s*merindu/i, 'SKMDU'], [/pekalongan/i, 'PKLNG'], [/ketahun/i, 'KTAUN'], [/\btes\b/i, 'TES'], [/musi/i, 'MUSI'],
  [/lubuk\s*linggau/i, 'LBGAU'], [/pulau\s*baai/i, 'PBAAI'], [/arga\s*makmur/i, 'ARMUR'], [/empat\s*lawang/i, 'EPLWG'],
  [/lahat/i, 'LAHAT'], [/pagar\s*alam/i, 'PGLAM'], [/manna/i, 'MANNA'], [/banjar\s*sari/i, 'BJSRI'], [/keban\s*agung/i, 'KBANG'],
  [/bintuhan/i, 'BNTHN'], [/bukit\s*asam/i, 'BKSAM'], [/lumut\s*balai/i, 'LMBAI'], [/pendopo/i, 'PNDPO'], [/pltu\s*bengkulu/i, 'PLTUB'], [/air\s*putih/i, 'ARPTH'],
];
const codesOfName = (s: string) => new Set(NAME_CODE.filter(([re]) => re.test(s)).map(([, c]) => c));
const codesOfEvent = (s: string) => new Set((s.toUpperCase().match(/[A-Z]{3,6}/g) || []));

export interface AsetMap { lines: { name: string; codes: Set<string>; ultg: Ultg }[]; gi: Map<string, Ultg> }

/** Read the penghantar (col L) and GI (col C) lists per ULTG from tab ASET. */
export function parseAset(grid: Grid): AsetMap {
  const lines: AsetMap['lines'] = []; const gi = new Map<string, Ultg>();
  let lu: Ultg | null = null, gu: Ultg | null = null;
  for (const r of grid) {
    const c = (r[2] || '').trim(), l = (r[11] || '').trim();
    if (/ULTG PEKALONGAN/i.test(c)) gu = 'PEKALONGAN'; else if (/ULTG LAHAT/i.test(c)) gu = 'LAHAT';
    else if (c && gu && !/^TOTAL|^JUMLAH/i.test(c)) codesOfName(c).forEach((k) => gi.has(k) || gi.set(k, gu!));
    if (/ULTG PEKALONGAN/i.test(l)) lu = 'PEKALONGAN'; else if (/ULTG LAHAT/i.test(l)) lu = 'LAHAT';
    else if (/^Jumlah/i.test(l)) { if (/LAHAT/i.test(l)) lu = null; }
    else if (l && lu) { const codes = codesOfName(l.replace(/\(.*?\)/g, '')); if (codes.size >= 2) lines.push({ name: l, codes, ultg: lu }); }
  }
  return { lines, gi };
}

export function ultgOf(line: string, aset: AsetMap): Ultg | null {
  const ev = codesOfEvent(line);
  // 1) penghantar match: both ends of an ASET line appear in the event
  let best: { u: Ultg; n: number } | null = null;
  for (const l of aset.lines) {
    const n = [...l.codes].filter((c) => ev.has(c)).length;
    if (n >= 2 && (!best || n > best.n)) best = { u: l.ultg, n };
  }
  if (best) return best.u;
  // 2) fallback: first GI code found
  for (const c of ev) { const u = aset.gi.get(c); if (u) return u; }
  return null;
}

const cap = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/^\w/, (c) => c.toUpperCase());
function clusterOf(cause: string, tags: string) {
  if (/pengujian/i.test(cause)) return /ABOF/i.test(tags) ? 'Pengujian (ABOF)' : 'Pengujian';
  if (/^nsf/i.test(cause)) return 'NSF';
  if (/appl/i.test(cause)) return cause.match(/appl\s*(\(.*?\))?/i)![0].replace(/^appl/i, 'APPL');
  return cap(cause.split(/[=,]/)[0]) || 'Lainnya';
}
export function kinerjaLabel(e: UltgEvent): string {
  if (/ABOF/i.test(e.raw)) return 'ABOF';
  if (/NSF|\bSI\b/i.test(e.raw)) return 'SI & MTTR TL';
  if (/APPL|pihak lain/i.test(e.raw)) return 'Implementasi EAM – Gangguan Akibat Pekerjaan Pihak Lain';
  if (/pohon/i.test(e.raw)) return 'Gangguan Akibat Pohon';
  return 'Pengurang Kinerja';
}

function parseEvent(raw: string, aset: AsetMap): UltgEvent | null {
  let parts = raw.split(';').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[1].includes(',')) { const [t, ...rest] = parts[1].split(','); parts = [parts[0], t.trim(), rest.join(',').trim(), ...parts.slice(2)]; }
  const ti = parts.findIndex((p, i) => i >= 2 && /^(reclose|trip)$/i.test(p));
  if (ti < 0 || !/^\d{4}\.\d{2}\.\d{2}/.test(parts[0])) return null;
  const type = /trip/i.test(parts[ti]) ? 'Trip' : 'Reclose';
  const line = parts.slice(2, ti).join(' ');
  const cause = parts[ti + 1] || '';
  const tags = parts.slice(ti + 2).join(' ');
  return { date: parts[0], time: parts[1], line, type, cause: [cause, tags].filter(Boolean).join(' · '), cluster: clusterOf(cause, tags), raw, ultg: ultgOf(line, aset) };
}

/** Parse the REKAP GANGGUAN column of an NKO month tab. */
export function parseRekap(grid: Grid, aset: AsetMap): { title: string; events: UltgEvent[]; kinerja: UltgEvent[] } {
  let col = -1, start = 0, title = 'REKAP GANGGUAN';
  for (let i = 0; i < Math.min(grid.length, 20) && col < 0; i++) {
    const j = (grid[i] || []).findIndex((c) => /REKAP GANGGUAN/i.test(c || ''));
    if (j >= 0) { col = j; start = i + 1; title = grid[i][j].trim(); }
  }
  if (col < 0) return { title, events: [], kinerja: [] };
  const events: UltgEvent[] = [], kinerja: UltgEvent[] = [];
  let sec: 'all' | 'kin' = 'all';
  for (let i = start; i < grid.length; i++) {
    const raw = (grid[i]?.[col] || '').replace(/\s+/g, ' ').trim();
    if (!raw) continue;
    if (/pengurang kinerja/i.test(raw)) { sec = 'kin'; continue; }
    const e = parseEvent(raw, aset);
    if (!e) continue;
    if (sec === 'all') events.push(e); else { e.kinerja = kinerjaLabel(e); kinerja.push(e); }
  }
  return { title, events, kinerja };
}
