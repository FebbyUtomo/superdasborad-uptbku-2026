import React from 'react';
import { Zap } from 'lucide-react';
import { usePageSources } from '../lib/data';
import { Card, PageHeader } from '../components/ui';

export default function Ultg() {
  usePageSources([]);
  return (
    <div className="space-y-5">
      <PageHeader title="Kinerja ULTG" subtitle="Halaman berikutnya — segera hadir" />
      <Card className="flex flex-col items-center text-center gap-3 py-16">
        <Zap size={56} color="#FFC940" style={{ filter: 'drop-shadow(0 0 12px #FFC940)' }} />
        <div className="h-title text-2xl">COMING SOON</div>
        <div className="t-muted max-w-lg">Placeholder untuk dashboard Kinerja ULTG Pekalongan &amp; ULTG Lahat. Sumber data akan ditambahkan pada tahap berikutnya.</div>
        <span className="badge badge-warn">SOON</span>
      </Card>
    </div>
  );
}
