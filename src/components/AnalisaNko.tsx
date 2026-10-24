import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { NkoMonth } from '../lib/parsers';
import { analyseNko, monthName, NkoChange } from '../lib/nkoAnalysis';
import { fmtNum } from '../lib/sheets';
import { C, Card } from './ui';

const sign = (v: number | null, d = 2) => (v == null ? '—' : `${v > 0 ? '▲ +' : v < 0 ? '▼ −' : ''}${fmtNum(Math.abs(v), d)}`);
const dColor = (v: number | null) => (v == null || Math.abs(v) < 0.005 ? 'var(--text2)' : v > 0 ? C.ok : C.crit);

function ChangeList({ items, color, max }: { items: NkoChange[]; color: string; max: number }) {
  if (!items.length) return <div className="text-xs t-muted py-3">Tidak ada.</div>;
  const shown = items.slice(0, 6);
  const rest = items.slice(6);
  const restSum = rest.reduce((a, c) => a + c.delta, 0);
  const Row = ({ name, detail, v }: { name: string; detail?: string; v: number }) => (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold truncate" style={{ color: 'var(--heading)' }}>{name}</div>
        {detail && <div className="text-[11px] t-muted truncate">{detail}</div>}
      </div>
      <div className="w-[110px] shrink-0 flex items-center gap-2">
        <div className="h-2.5 rounded" style={{ width: `${Math.max(4, Math.min(1, Math.abs(v) / max) * 64)}px`, background: color }} />
        <span className="text-xs font-bold" style={{ color }}>{v > 0 ? '+' : '−'}{fmtNum(Math.abs(v), 2)}</span>
      </div>
    </div>
  );
  return (
    <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
      {shown.map((c) => <Row key={c.row.no} name={`${c.row.no}. ${c.row.short}`} detail={c.detail} v={c.delta} />)}
      {rest.length > 0 && <Row name={`+${rest.length} indikator lain`} v={restSum} />}
    </div>
  );
}

export default function AnalisaNko({ months, sel }: { months: NkoMonth[]; sel: number }) {
  const earlier = months.filter((m) => m.monthNo < sel).sort((a, b) => b.monthNo - a.monthNo);
  const [cmpRaw, setCmp] = useState<number | null>(null);
  useEffect(() => setCmp(null), [sel]);
  const cmpNo = cmpRaw ?? earlier[0]?.monthNo ?? null;
  const a = useMemo(() => (cmpNo ? analyseNko(months, sel, cmpNo) : null), [months, sel, cmpNo]);

  return (
    <Card id="analisa-nko" className="scroll-mt-24">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div className="flex-1 min-w-[220px]">
          <div className="text-base font-extrabold tracking-wide" style={{ color: 'var(--heading)' }}>ANALISA PERUBAHAN NKO</div>
          <div className="text-xs t-muted">{a ? <>{monthName(a.cur)} dibanding {monthName(a.cmp)} · otomatis dari sheet NKO</> : 'Pilih bulan setelah Januari untuk melihat perbandingan.'}</div>
        </div>
        {earlier.length > 0 && (
          <label className="flex items-center gap-2 text-xs font-semibold t-muted">
            Bandingkan dengan
            <select className="inp" value={cmpNo ?? ''} onChange={(e) => setCmp(+e.target.value)}>
              {earlier.map((m) => <option key={m.monthNo} value={m.monthNo}>{monthName(m)}</option>)}
            </select>
          </label>
        )}
      </div>
      {a && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            {[
              { l: 'NKO cap 110%', v: fmtNum(a.cur.total110 != null ? Math.min(110, a.cur.total110) : null, 2), s: sign(a.d110), c: dColor(a.d110) },
              { l: 'NKO cap 100%', v: fmtNum(a.cur.total100, 2), s: sign(a.d100), c: dColor(a.d100) },
              { l: 'Indikator naik', v: String(a.up.length), s: 'nilai bertambah', c: C.ok },
              { l: 'Indikator turun', v: String(a.down.length), s: 'nilai berkurang', c: C.crit },
            ].map((x) => (
              <div key={x.l} className="rounded-xl p-3" style={{ border: '1px solid var(--card-border)' }}>
                <div className="t-label">{x.l}</div>
                <div className="text-2xl font-extrabold" style={{ color: 'var(--heading)' }}>{x.v}</div>
                <div className="text-xs font-bold" style={{ color: x.c }}>{x.s}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold mb-1" style={{ color: C.ok }}><TrendingUp size={15} /> PENYUMBANG KENAIKAN</div>
              <ChangeList items={a.up} color={C.ok} max={0.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold mb-1" style={{ color: C.crit }}><TrendingDown size={15} /> PENYUMBANG PENURUNAN</div>
              <ChangeList items={a.down} color={C.crit} max={0.5} />
            </div>
          </div>
          {a.alerts.length > 0 && (
            <div className="mt-5 space-y-2">
              {a.alerts.map((al) => {
                const col = al.level === 'crit' ? C.crit : C.warn;
                return (
                  <div key={al.title} className="rounded-xl px-4 py-3 flex gap-3" style={{ border: `1px solid ${col}55`, background: `${col}12` }}>
                    {al.level === 'crit' ? <AlertTriangle size={18} color={col} className="shrink-0 mt-0.5" /> : <Info size={18} color={col} className="shrink-0 mt-0.5" />}
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: col }}>{al.title}</div>
                      <div className="text-xs t-muted">{al.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-[11px] t-muted mt-4">Perubahan dihitung dari nilai cap 110% tiap indikator. Peringatan muncul otomatis untuk indikator MASALAH dan tab bulan yang datanya sama persis dengan bulan sebelumnya.</div>
        </>
      )}
    </Card>
  );
}

/** One-line summary for the Dashboard, linking to the Kinerja panel. */
export function AnalisaNkoLine({ months, sel, onOpen }: { months: NkoMonth[]; sel: number; onOpen: () => void }) {
  const prev = months.filter((m) => m.monthNo < sel).sort((a, b) => b.monthNo - a.monthNo)[0];
  const a = prev ? analyseNko(months, sel, prev.monthNo) : null;
  if (!a) return null;
  const d = a.d110 ?? 0;
  const top = (d >= 0 ? a.up : a.down).slice(0, 2).map((c) => c.row.short).join(', ');
  const masalah = a.alerts.filter((x) => x.level === 'crit').map((x) => x.title.split(' berstatus')[0].replace(/^[\d.a-z]+\s/i, ''));
  return (
    <Card hover className="cursor-pointer flex flex-wrap items-center gap-x-3 gap-y-2 py-3" onClick={onOpen}>
      <b style={{ color: dColor(d) }}>{monthName(a.cur)} {Math.abs(d) < 0.005 ? 'stabil' : d > 0 ? 'naik' : 'turun'} {Math.abs(d) >= 0.005 && <>{d > 0 ? '+' : '−'}{fmtNum(Math.abs(d), 2)} poin</>}</b>
      <span className="text-sm" style={{ color: 'var(--heading)' }}>
        {top && <>· penyumbang utama: {top}</>}
        {masalah.length > 0 && <> · {masalah.join(', ')} masih MASALAH</>}
      </span>
      <span className="badge badge-info ml-auto">Lihat analisa →</span>
    </Card>
  );
}
