import type { jsPDF as JsPDF } from 'jspdf';
import type { Ultg, UltgEvent } from './ultg';
import type { NkoMonth, NkoRow } from './parsers';

type RGB = [number, number, number];
const RED: RGB = [206, 17, 38], NAVY: RGB = [11, 35, 74], PLN: RGB = [0, 114, 206], YEL: RGB = [255, 201, 64], WHITE: RGB = [255, 255, 255];
const GREEN: RGB = [46, 125, 50], ORANGE: RGB = [245, 124, 0], DRED: RGB = [220, 38, 38];

/** National theme per calendar month (bulan berjalan). `art` = header illustration in /pdf/hdr-<m>.jpg when available. */
export interface PdfTheme { month: number; badge: string; badgeSub: string; slogan: string; quote: string; primary: RGB; accent: RGB }
export function themeFor(d: Date): PdfTheme {
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const T: Record<number, Omit<PdfTheme, 'month' | 'primary' | 'accent'> & { primary?: RGB; accent?: RGB }> = {
    1: { badge: 'Selamat Tahun Baru ' + y, badgeSub: 'Semangat baru, keandalan baru', slogan: 'Awali tahun dengan sistem andal', quote: 'Terang untuk negeri' },
    2: { badge: 'Hari Pers Nasional', badgeSub: '9 Februari ' + y, slogan: 'Informasi akurat, kinerja hebat', quote: 'Data bicara, kinerja nyata' },
    3: { badge: 'Hari Musik Nasional', badgeSub: '9 Maret ' + y, slogan: 'Harmoni kerja, harmoni energi', quote: 'Selaras untuk negeri' },
    4: { badge: 'Selamat Hari Kartini', badgeSub: '21 April ' + y, slogan: 'Habis gelap terbitlah terang', quote: 'Perempuan hebat, energi hebat' },
    5: { badge: 'Hari Kebangkitan Nasional ke-' + (y - 1908), badgeSub: '20 Mei ' + y, slogan: 'Bangkit bersama, energi untuk bangsa', quote: 'Bangkit untuk negeri' },
    6: { badge: 'Hari Lahir Pancasila', badgeSub: '1 Juni ' + y, slogan: 'Bersatu dalam Pancasila', quote: 'Energi untuk Indonesia' },
    7: { badge: 'Hari Anak Nasional', badgeSub: '23 Juli ' + y, slogan: 'Terang untuk generasi penerus', quote: 'Energi masa depan' },
    8: { badge: 'Dirgahayu ke-' + (y - 1945) + ' Republik Indonesia', badgeSub: '17 Agustus ' + y, slogan: 'Merdeka! Energi untuk negeri', quote: 'Terangi kemerdekaan' },
    9: { badge: 'Hari Olahraga Nasional', badgeSub: '9 September ' + y, slogan: 'Sehat, sigap, andal', quote: 'Sportif dalam kinerja' },
    10: { badge: 'Selamat Hari Sumpah Pemuda ke-' + (y - 1928), badgeSub: '28 Oktober ' + y + ' · Hari Listrik Nasional ke-' + (y - 1945), slogan: 'Pemuda, Energi Perubahan untuk Negeri', quote: 'Satu Semangat, Satu Energi untuk Indonesia Maju' },
    11: { badge: 'Selamat Hari Pahlawan', badgeSub: '10 November ' + y, slogan: 'Pahlawan energi untuk negeri', quote: 'Teruskan perjuangan' },
    12: { badge: 'Selamat Hari Ibu', badgeSub: '22 Desember ' + y, slogan: 'Kasih ibu, energi tanpa batas', quote: 'Terima kasih, Ibu' },
  };
  const t = T[m];
  return { month: m, primary: t.primary ?? NAVY, accent: t.accent ?? RED, ...t } as PdfTheme;
}

export interface UltgPdfPart { name: Ultg; events: UltgEvent[]; kinerja: UltgEvent[] }
export interface PdfAssets { hdr?: string; danantara?: string; upt?: string; pln?: string }
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const COLORS: Record<string, string> = { Petir: '#2563EB', Monyet: '#DC2626', Hewan: '#2E7D32', Topskor: '#F57C00', Ular: '#7C4DFF', 'Pengujian (ABOF)': '#6E6E6E', Pengujian: '#6E6E6E', NSF: '#00ACC1', 'APPL (Excavator)': '#FFC107', APPL: '#FFC107', Layang: '#FF6FB5', Pohon: '#795548' };
const EXTRA = ['#36CFC9', '#9BE15D', '#5B8CFF', '#FF6FB5', '#B37FEB', '#8D6E63'];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const colorOf = (n: string, i: number) => hex(COLORS[n] ?? EXTRA[i % EXTRA.length]);
const pct = (a: number, b: number) => (b ? Math.round((a * 100) / b) : 0);
const fmt = (v: number | null | undefined, d = 2) => (v == null ? '-' : v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }));
const title = (u: string) => u.charAt(0) + u.slice(1).toLowerCase();
const W = 595.28, H = 841.89, M = 16;

function clusters(ev: UltgEvent[]) {
  const m = new Map<string, number>(); ev.forEach((e) => m.set(e.cluster, (m.get(e.cluster) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
function img(doc: JsPDF, data: string | undefined, x: number, y: number, w: number, h: number) {
  if (!data) return; try { doc.addImage(data, /jpe?g/i.test(data.slice(0, 30)) ? 'JPEG' : 'PNG', x, y, w, h, undefined, 'FAST'); } catch { /* ignore */ }
}
function plate(doc: JsPDF, x: number, y: number, w: number, h: number, r = 8) { doc.setFillColor(255, 255, 255); doc.roundedRect(x, y, w, h, r, r, 'F'); }
function outlined(doc: JsPDF, text: string, x: number, y: number, size: number, fill: RGB, opts: { align?: 'left' | 'right' | 'center'; font?: string; stroke?: RGB; sw?: number } = {}) {
  doc.setFont('helvetica', opts.font ?? 'bolditalic'); doc.setFontSize(size);
  doc.setLineWidth(opts.sw ?? size / 7); doc.setDrawColor(...(opts.stroke ?? WHITE)); doc.setTextColor(...fill);
  doc.text(text, x, y, { align: opts.align, renderingMode: 'stroke' } as any);
  doc.text(text, x, y, { align: opts.align, renderingMode: 'fill' } as any);
}

/* ---------------- poster header (art + logos + title) ---------------- */
function posterHeader(doc: JsPDF, th: PdfTheme, a: PdfAssets, heading: [string, string, string], bulan: string, year: number, upd: string) {
  const ih = W / 1.49;
  if (a.hdr) img(doc, a.hdr, 0, 0, W, ih);
  else { doc.setFillColor(...th.primary); doc.rect(0, 0, W, ih, 'F'); }
  // logos
  plate(doc, M, 12, 128, 38); img(doc, a.danantara, M + 6, 17, 116, 29);
  plate(doc, W / 2 - 34, 8, 68, 74); img(doc, a.upt, W / 2 - 26, 12, 52, 66);
  plate(doc, W - M - 52, 10, 52, 70); img(doc, a.pln, W - M - 46, 14, 40, 60);
  // theme badge
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(11);
  const bl: string[] = doc.splitTextToSize(th.badge.toUpperCase(), 196);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6); const sl: string[] = doc.splitTextToSize(th.badgeSub.toUpperCase(), 196);
  const bh = 12 + bl.length * 12 + sl.length * 8;
  doc.setFillColor(...RED); doc.roundedRect(M, 56, 212, bh, 6, 6, 'F');
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(11); doc.setTextColor(255, 255, 255); doc.text(bl, M + 8, 69, { lineHeightFactor: 1.05 });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6); doc.setTextColor(...YEL); doc.text(sl, M + 8, 69 + bl.length * 12);
  // title (upper-right sky)
  const tx = W - M - 4;
  outlined(doc, heading[0], tx, 118, 30, NAVY, { align: 'right' });
  outlined(doc, heading[1], tx, 152, 34, RED, { align: 'right' });
  outlined(doc, heading[2], tx, 180, 22, NAVY, { align: 'right' });
  // month ribbon
  const rw = 180, rx = tx - rw, ry = 190;
  doc.setFillColor(...RED); doc.triangle(rx - 10, ry, rx, ry, rx, ry + 26, 'F'); doc.rect(rx, ry, rw, 26, 'F');
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(17); doc.setTextColor(255, 255, 255); doc.text(`${bulan} ${year}`, rx + rw / 2, ry + 19, { align: 'center' });
  outlined(doc, `Update s.d. ${upd}`, tx, ry + 42, 10, NAVY, { align: 'right', sw: 2.4 });
  // quote
  outlined(doc, `"${th.quote}"`, W - M - 4, 262, 9.5, NAVY, { align: 'right', sw: 2.4, font: 'bolditalic' });
  return ih;
}

/* ---------------- NKO gauge ---------------- */
function gauge(doc: JsPDF, cx: number, cy: number, r: number, value: number | null) {
  const segs: RGB[] = [[220, 38, 38], [245, 124, 0], [255, 193, 7], [139, 195, 74], [46, 125, 50]];
  segs.forEach((c, i) => {
    const a0 = Math.PI + (i / segs.length) * Math.PI, a1 = Math.PI + ((i + 1) / segs.length) * Math.PI;
    doc.setFillColor(...c);
    for (let s = 0; s < 12; s++) {
      const b0 = a0 + ((a1 - a0) * s) / 12, b1 = a0 + ((a1 - a0) * (s + 1)) / 12 + 0.01;
      doc.triangle(cx, cy, cx + r * Math.cos(b0), cy + r * Math.sin(b0), cx + r * Math.cos(b1), cy + r * Math.sin(b1), 'F');
    }
  });
  doc.setFillColor(...NAVY); doc.circle(cx, cy, r * 0.62, 'F'); doc.rect(cx - r - 1, cy, 2 * r + 2, r, 'F');
  const v = Math.max(0, Math.min(110, value ?? 0)), ang = Math.PI + (v / 110) * Math.PI;
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(2.4); doc.line(cx, cy, cx + r * 0.85 * Math.cos(ang), cy + r * 0.85 * Math.sin(ang));
  doc.setFillColor(255, 255, 255); doc.circle(cx, cy, 3.5, 'F');
}

function nkoRow(doc: JsPDF, th: PdfTheme, y: number, nko: NkoMonth | undefined, bulan: string, year: number, upd: string) {
  // NKO card
  const w1 = 262; doc.setFillColor(...NAVY); doc.roundedRect(M, y, w1, 92, 10, 10, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text(`NILAI KINERJA BULAN ${bulan.toUpperCase()} ${year}`, M + 12, y + 18);
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.4); doc.line(M + 12, y + 24, M + w1 - 12, y + 24);
  gauge(doc, M + 52, y + 78, 40, nko?.total110 ?? null);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(27); doc.setTextColor(...YEL); doc.text(fmt(nko?.total100), M + 104, y + 60);
  const vw = doc.getTextWidth(fmt(nko?.total100)); doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.text(`/ ${fmt(nko?.total110)}`, M + 108 + vw, y + 60);
  doc.setFillColor(...YEL); doc.roundedRect(M + 112, y + 67, 80, 18, 5, 5, 'F'); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text('(CAP. 110)', M + 152, y + 80, { align: 'center' });
  // greeting card
  const x2 = M + w1 + 10, w2 = W - M - x2; plate(doc, x2, y, w2, 92, 10); doc.setDrawColor(210, 218, 228); doc.setLineWidth(0.6); doc.roundedRect(x2, y, w2, 92, 10, 10, 'S');
  doc.setFillColor(...YEL); doc.circle(x2 + 18, y + 17, 6, 'F');
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(13); doc.setTextColor(...RED); doc.text('Semangat Pagi!', x2 + 30, y + 22);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6); doc.setTextColor(40);
  doc.text(doc.splitTextToSize(`Berikut kami sampaikan Monitoring KINERJA UPT BENGKULU Bulan ${bulan} ${year} dan Rekap Gangguan ULTG sampai tgl ${upd}.`, w2 - 24), x2 + 12, y + 36);
  doc.setFillColor(...RED); doc.roundedRect(x2 + 12, y + 58, w2 - 24, 15, 4, 4, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text('DETAIL DATA', x2 + w2 / 2, y + 69, { align: 'center' });
  doc.link(x2 + 12, y + 58, w2 - 24, 15, { url: 'https://plnuptbengkulu.web.id/kinerja' });
  doc.setFontSize(10); doc.setTextColor(...NAVY); doc.textWithLink('plnuptbengkulu.web.id', x2 + w2 / 2, y + 86, { url: 'https://plnuptbengkulu.web.id', align: 'center' } as any);
  return y + 92;
}

/* ---------------- KINERJA (bermasalah / waspada / pengurang) ---------------- */
function sectionName(rows: NkoRow[], r: NkoRow) {
  const top = r.no.split('.')[0]; const s = rows.find((x) => x.kind === 'section' && x.no.split('.')[0] === top) ?? rows.find((x) => x.kind === 'indicator' && x.no === top);
  return (s?.name || s?.short || '').replace(/^\d+\.?\s*/, '').toUpperCase();
}
function kinerjaBlock(doc: JsPDF, y: number, nko: NkoMonth | undefined) {
  const rows = nko?.rows ?? [];
  const ind = rows.filter((r) => r.kind === 'indicator');
  const bad = ind.filter((r) => r.status === 'MASALAH');
  const warn = ind.filter((r) => r.status === 'HATI-HATI');
  const pen = rows.filter((r) => r.penalty && (r.nilai110 ?? 0) < 0);
  doc.setFillColor(...NAVY); doc.roundedRect(M, y, W - 2 * M, 20, 6, 6, 'F'); doc.rect(M, y + 10, W - 2 * M, 10, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.text('KINERJA', W / 2, y + 15, { align: 'center' });
  const top = y + 20, h = 84, cw = (W - 2 * M) / 3;
  plate(doc, M, top, W - 2 * M, h, 0); doc.setDrawColor(210, 218, 228); doc.setLineWidth(0.6); doc.rect(M, top, W - 2 * M, h, 'S'); doc.line(M + cw, top, M + cw, top + h); doc.line(M + 2 * cw, top, M + 2 * cw, top + h);
  const tag = (x: number, label: string, bg: RGB, fg: RGB) => {
    doc.setFillColor(...bg); doc.roundedRect(x + 8, top + 7, cw - 16, 17, 4, 4, 'F');
    doc.setFillColor(...fg); doc.circle(x + 19, top + 15.5, 5.5, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...bg); doc.text('!', x + 19, top + 18.5, { align: 'center' });
    doc.setFontSize(label.length > 22 ? 7.6 : 9.5); doc.setTextColor(...fg); doc.text(label, x + 29, top + 19);
  };
  // bermasalah
  tag(M, 'BERMASALAH', DRED, WHITE);
  let yy = top + 35; doc.setTextColor(30);
  if (!bad.length) { doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('1.  NIHIL', M + 12, yy); }
  bad.slice(0, 2).forEach((r, i) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(30); doc.text(`${i + 1}.  ${r.short.replace(/…$/, '')}`, M + 12, yy, { maxWidth: cw - 24 });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6);
    doc.text('Target', M + 24, yy + 10); doc.text(`: ${r.targetSdRaw || '-'}`, M + 70, yy + 10);
    doc.text('Realisasi', M + 24, yy + 19); doc.setTextColor(...DRED); doc.setFont('helvetica', 'bold'); doc.text(`: ${r.realSdRaw || '-'}`, M + 70, yy + 19);
    if (bad.length === 1) {
      doc.setFillColor(...DRED); doc.roundedRect(M + 12, top + h - 21, cw - 24, 15, 4, 4, 'F');
      doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text(`NILAI = ${fmt(r.nilai110, 0)} / ${(r.bobot || '').replace(/[^\d.,]/g, '') || '-'}`, M + cw / 2, top + h - 10, { align: 'center' });
    }
    yy += 32;
  });
  if (bad.length > 2) { doc.setFontSize(7); doc.setTextColor(110); doc.text(`+${bad.length - 2} indikator lain`, M + 12, top + h - 6); }
  // waspada
  const x2 = M + cw; tag(x2, 'WASPADA', YEL, NAVY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30);
  if (!warn.length) { doc.setFontSize(10); doc.text('1.  NIHIL', x2 + 12, top + 38); doc.setDrawColor(...YEL); doc.setLineWidth(3); doc.lines([[8, 8], [16, -16]], x2 + cw - 52, top + 70); }
  warn.slice(0, 4).forEach((r, i) => doc.text(`${i + 1}.  ${r.short.replace(/…$/, '')}`, x2 + 12, top + 38 + i * 15, { maxWidth: cw - 24 }));
  // pengurang
  const x3 = M + 2 * cw; tag(x3, 'HATI-HATI KINERJA PENGURANG', PLN, WHITE);
  if (!pen.length) { doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30); doc.text('1.  NIHIL', x3 + 12, top + 38); }
  pen.slice(0, 3).forEach((r, i) => {
    const yy2 = top + 35 + i * 23;
    const eq = [r.status, r.targetSdRaw, r.realSdRaw].find((t) => /=/.test(t || ''));
    const sub = eq ? eq.split('=')[0].trim() : r.name.replace(/^[a-z]\.\s*/i, '');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.3); doc.setTextColor(30); doc.text(`${i + 1}.  ${sectionName(rows, r)}`, x3 + 12, yy2, { maxWidth: cw - 60 });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.2); doc.text(doc.splitTextToSize(`- ${sub}`, cw - 64)[0], x3 + 22, yy2 + 9);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DRED); doc.text(`= ${fmt(r.nilai110, 3).replace(/0+$/, '').replace(/,$/, '')}`, x3 + cw - 10, yy2 + 5, { align: 'right' });
  });
  return top + h;
}

/* ---------------- ULTG panel ---------------- */
function donut(doc: JsPDF, cx: number, cy: number, r: number, ri: number, data: [string, number][], total: number) {
  let a0 = -Math.PI / 2;
  data.forEach(([n, v], i) => {
    const a1 = a0 + (v / total) * Math.PI * 2; doc.setFillColor(...colorOf(n, i));
    const steps = Math.max(2, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 90));
    for (let s = 0; s < steps; s++) {
      const b0 = a0 + ((a1 - a0) * s) / steps, b1 = a0 + ((a1 - a0) * (s + 1)) / steps + 0.004;
      doc.triangle(cx, cy, cx + r * Math.cos(b0), cy + r * Math.sin(b0), cx + r * Math.cos(b1), cy + r * Math.sin(b1), 'F');
    }
    const am = (a0 + a1) / 2, p = pct(v, total);
    if (p >= 8) { doc.setFont('helvetica', 'bold'); doc.setFontSize(r > 50 ? 9 : 7); doc.setTextColor(255, 255, 255); doc.text(`${p}%`, cx + ((r + ri) / 2) * Math.cos(am), cy + ((r + ri) / 2) * Math.sin(am) + 2.5, { align: 'center' }); }
    a0 = a1;
  });
  doc.setFillColor(255, 255, 255); doc.circle(cx, cy, ri, 'F');
  doc.setTextColor(60); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.text('TOTAL', cx, cy - ri * 0.38, { align: 'center' });
  doc.setTextColor(20); doc.setFontSize(ri * 0.62); doc.text(String(total), cx, cy + ri * 0.22, { align: 'center' });
  doc.setTextColor(60); doc.setFontSize(6); doc.text('KEJADIAN', cx, cy + ri * 0.58, { align: 'center' });
}

function trend(doc: JsPDF, p: UltgPdfPart, x: number, y: number, w: number, monthNo: number) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...PLN); doc.text('TREN GANGGUAN PER BULAN', x + 10, y);
  const ms = Array.from({ length: monthNo }, (_, i) => i + 1);
  const cnt = ms.map((m) => { const ev = p.events.filter((e) => Number(e.date.slice(5, 7)) === m); return { rc: ev.filter((e) => e.type === 'Reclose').length, tr: ev.filter((e) => e.type === 'Trip').length }; });
  const max = Math.max(1, ...cnt.map((c) => c.rc + c.tr)), ch = 36, base = y + 14 + ch, slot = (w - 40) / ms.length, bw = Math.min(26, slot * 0.6);
  doc.setDrawColor(210, 218, 228); doc.setLineWidth(0.5); doc.line(x + 20, base, x + w - 20, base);
  cnt.forEach((c, i) => {
    const bx = x + 20 + i * slot + (slot - bw) / 2, hr = (c.rc / max) * ch, ht = (c.tr / max) * ch;
    doc.setFillColor(...GREEN); if (hr) doc.rect(bx, base - hr, bw, hr, 'F');
    doc.setFillColor(...ORANGE); if (ht) doc.rect(bx, base - hr - ht, bw, ht, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30); if (c.rc + c.tr) doc.text(String(c.rc + c.tr), bx + bw / 2, base - hr - ht - 3, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(90); doc.text(MONTHS[i].slice(0, 3).toUpperCase(), bx + bw / 2, base + 10, { align: 'center' });
  });
  doc.setFillColor(...GREEN); doc.rect(x + w - 130, y - 7, 7, 7, 'F'); doc.setFillColor(...ORANGE); doc.rect(x + w - 70, y - 7, 7, 7, 'F');
  doc.setFontSize(7.5); doc.setTextColor(60); doc.text('Re-close', x + w - 120, y); doc.text('Trip', x + w - 60, y);
  return base + 14;
}

function ultgPanel(doc: JsPDF, p: UltgPdfPart, x: number, y: number, w: number, h: number, big = false, monthNo = 0) {
  const total = p.events.length, rc = p.events.filter((e) => e.type === 'Reclose').length, tr = total - rc;
  plate(doc, x, y, w, h, 10); doc.setDrawColor(200, 210, 225); doc.setLineWidth(0.6); doc.roundedRect(x, y, w, h, 10, 10, 'S');
  doc.setFillColor(...NAVY); doc.roundedRect(x, y, w, 26, 10, 10, 'F'); doc.rect(x, y + 13, w, 13, 'F');
  doc.setFillColor(...YEL); doc.triangle(x + 16, y + 5, x + 10, y + 15, x + 15, y + 15, 'F'); doc.triangle(x + 14, y + 12, x + 20, y + 12, x + 12, y + 22, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(big ? 12 : 10); doc.setTextColor(255, 255, 255); doc.text(`MONITORING KINERJA ULTG ${p.name}`, x + 26, y + 17.5);
  let yy = y + (big ? 42 : 38);
  doc.setFontSize(big ? 11 : 9.5); doc.setTextColor(...NAVY); doc.text('RINGKASAN GANGGUAN', x + w / 2, yy, { align: 'center' });
  const bw = (w - 20 - 9) / 4, bh = big ? 56 : 42; yy += 6;
  ([['TOTAL GANGGUAN', total, 'Kejadian', PLN], ['RE-CLOSE', rc, `Kejadian (${pct(rc, total)}%)`, GREEN], ['TRIP', tr, `Kejadian (${pct(tr, total)}%)`, ORANGE], ['MASUK KINERJA', p.kinerja.length, 'Kejadian', DRED]] as [string, number, string, RGB][]).forEach(([l, v, s, c], i) => {
    const bx = x + 10 + i * (bw + 3);
    doc.setDrawColor(...(i === 3 ? DRED : ([200, 215, 235] as RGB))); doc.setLineWidth(i === 3 ? 1.2 : 0.6); doc.setFillColor(255, 255, 255); doc.roundedRect(bx, yy, bw, bh, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold'); let fs = big ? 7.5 : 6.4; doc.setFontSize(fs); while (doc.getTextWidth(l) > bw - 6 && fs > 4.5) { fs -= 0.2; doc.setFontSize(fs); } doc.setTextColor(...(i === 3 ? DRED : PLN)); doc.text(l, bx + bw / 2, yy + 10, { align: 'center' });
    doc.setFontSize(big ? 22 : 16); doc.setTextColor(...c); doc.text(String(v), bx + bw / 2, yy + bh * 0.66, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(big ? 7.5 : 6.3); doc.setTextColor(60); doc.text(s, bx + bw / 2, yy + bh - 5, { align: 'center' });
  });
  yy += bh + (big ? 18 : 13);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(big ? 11 : 8.5); doc.setTextColor(...PLN); doc.text('CLUSTER GANGGUAN BERDASARKAN PENYEBAB', x + w / 2, yy, { align: 'center' });
  const cl = clusters(p.events), r = big ? 52 : 40;
  yy += 8;
  if (!total) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110); doc.text('Belum ada gangguan.', x + w / 2, yy + 30, { align: 'center' }); }
  else {
    donut(doc, x + 14 + r, yy + r + 2, r, r * 0.55, cl, total);
    const lx = x + 30 + 2 * r, rowH = Math.min(big ? 18 : 12.5, (2 * r) / cl.length), ly0 = yy + r + 2 - (rowH * (cl.length - 1)) / 2;
    cl.forEach(([n, v], i) => {
      const ly = ly0 + i * rowH; doc.setFillColor(...colorOf(n, i)); doc.rect(lx, ly - 6, 7, 7, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(big ? 10 : 7.6); doc.setTextColor(30); doc.text(n, lx + 11, ly);
      const rx = x + w - 12; doc.text(`(${pct(v, total)}%)`, rx, ly, { align: 'right' }); doc.text(`:   ${v}`, rx - (big ? 50 : 34), ly, { align: 'right' });
    });
  }
  yy += 2 * r + (big ? 18 : 12);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(big ? 11 : 8.5); doc.setTextColor(...PLN); doc.text('GANGGUAN YANG MASUK KINERJA', x + 10, yy);
  yy += 6; const boxTop = yy;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(big ? 8.5 : 6.6); doc.setTextColor(30);
  let ky = yy + 11;
  if (!p.kinerja.length) { doc.text('Tidak ada gangguan pengurang kinerja.', x + 16, ky); ky += 12; }
  const tw = w * 0.58;
  p.kinerja.forEach((e, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${e.date}; ${e.time}; ${e.line}; ${e.type}; ${e.cause}`, tw);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(big ? 8.5 : 6.6); doc.setTextColor(30); doc.text(lines, x + 16, ky);
    const ax = x + 22 + tw; doc.setDrawColor(...DRED); doc.setFillColor(...DRED); doc.setLineWidth(1.2); doc.line(ax, ky - 2, ax + 16, ky - 2); doc.triangle(ax + 16, ky - 5, ax + 16, ky + 1, ax + 21, ky - 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(big ? 8.5 : 6.8); doc.setTextColor(...DRED); const kl = doc.splitTextToSize(e.kinerja || '', x + w - (ax + 25) - 8); doc.text(kl, ax + 25, ky);
    ky += Math.max(lines.length, kl.length) * (big ? 10.5 : 8.2) + 5;
  });
  doc.setDrawColor(200, 215, 235); doc.setLineWidth(0.6); doc.roundedRect(x + 8, boxTop, w - 16, Math.max(ky - boxTop - 2, 20), 4, 4, 'S');
  if (big && monthNo) ky = trend(doc, p, x, ky + 12, w, monthNo);
  return ky;
}

function footerArt(doc: JsPDF, th: PdfTheme, note: string) {
  const y = H - 46;
  doc.setFillColor(...RED); doc.rect(0, y, W, 46, 'F'); doc.setFillColor(255, 255, 255); doc.triangle(0, y, W, y, 0, y + 14, 'F');
  doc.setFillColor(255, 255, 255); doc.roundedRect(M, y + 14, 220, 26, 4, 4, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6); doc.setTextColor(...NAVY); doc.text('CATATAN :', M + 6, y + 22);
  doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(note, 208), M + 6, y + 30);
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(11); doc.setTextColor(255, 255, 255); doc.text(th.slogan, W - M, y + 28, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.text('PT PLN (Persero) UPT Bengkulu · plnuptbengkulu.web.id', W - M, y + 39, { align: 'right' });
}

function listPages(doc: JsPDF, autoTable: any, th: PdfTheme, p: UltgPdfPart) {
  doc.addPage();
  const head = () => { doc.setFillColor(...NAVY); doc.rect(0, 0, W, 44, 'F'); doc.setFillColor(...RED); doc.rect(0, 44, W / 2, 4, 'F'); doc.setFillColor(255, 255, 255); doc.rect(W / 2, 44, W / 2, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.text(`DAFTAR SELURUH GANGGUAN · ULTG ${p.name} (${p.events.length})`, M + 8, 28); };
  autoTable(doc, {
    startY: 60, margin: { left: M + 8, right: M + 8, top: 60, bottom: 40 },
    head: [['No', 'Tanggal', 'Jam', 'Penghantar / Bay', 'Jenis', 'Penyebab']],
    body: p.events.map((e, i) => [i + 1, e.date, e.time, e.line, e.type, e.cause]),
    styles: { fontSize: 7.5, cellPadding: 3.2, overflow: 'linebreak' },
    headStyles: { fillColor: PLN, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    columnStyles: { 0: { cellWidth: 24, halign: 'center' }, 1: { cellWidth: 58 }, 2: { cellWidth: 34 }, 4: { cellWidth: 44 } },
    willDrawPage: head,
    didParseCell: (d: any) => { if (d.section === 'body' && d.column.index === 4) d.cell.styles.textColor = d.cell.raw === 'Trip' ? ORANGE : GREEN; },
  });
}

/** Build the ULTG poster PDF. mode: 'ALL' (poster with both ULTG) or a single ULTG. Appendix pages list every gangguan. */
export async function buildUltgPdf(opts: { parts: UltgPdfPart[]; mode: 'ALL' | Ultg; monthNo: number; year: number; nko?: NkoMonth; assets?: PdfAssets; now?: Date }) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const now = opts.now ?? new Date(); const th = themeFor(now); const a = opts.assets ?? {};
  const bulan = MONTHS[opts.monthNo - 1];
  const upd = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const parts = opts.mode === 'ALL' ? opts.parts : opts.parts.filter((p) => p.name === opts.mode);
  const last = opts.parts.flatMap((p) => p.events).map((e) => e.date).sort().pop() ?? '-';
  const note = `Data gangguan per tanggal ${last}. Sumber: Link Kinerja (REKAP GANGGUAN) & tab ASET.`;
  doc.setFillColor(238, 244, 251); doc.rect(0, 0, W, H, 'F');
  if (opts.mode === 'ALL') {
    const ih = posterHeader(doc, th, a, ['MONITORING', 'KINERJA', 'UPT BENGKULU'], bulan, opts.year, upd);
    let y = nkoRow(doc, th, ih - 96, opts.nko, bulan, opts.year, upd);
    y = kinerjaBlock(doc, y + 6, opts.nko);
    const pw = (W - 2 * M - 8) / 2, ph = H - 50 - (y + 6) - 2;
    ultgPanel(doc, opts.parts[0], M, y + 6, pw, ph); ultgPanel(doc, opts.parts[1], M + pw + 8, y + 6, pw, ph);
  } else {
    const p = parts[0];
    const ih = posterHeader(doc, th, a, ['MONITORING', 'KINERJA', `ULTG ${p.name}`], bulan, opts.year, upd);
    const y = nkoRow(doc, th, ih - 96, opts.nko, bulan, opts.year, upd);
    ultgPanel(doc, p, M, y + 10, W - 2 * M, H - 50 - (y + 10) - 4, true, opts.monthNo);
  }
  footerArt(doc, th, note);
  parts.forEach((p) => listPages(doc, autoTable, th, p));
  const n = doc.getNumberOfPages();
  for (let i = 2; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(110); doc.text(`PT PLN (Persero) UPT Bengkulu · plnuptbengkulu.web.id · Kinerja ULTG ${bulan} ${opts.year}`, M + 8, H - 20); doc.text(`Hal ${i}/${n}`, W - M - 8, H - 20, { align: 'right' }); }
  const fname = `Kinerja_ULTG_${opts.mode === 'ALL' ? 'UPT_Bengkulu' : opts.mode}_${bulan}_${opts.year}.pdf`;
  return { doc, fname };
}
