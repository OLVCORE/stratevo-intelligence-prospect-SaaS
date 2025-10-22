'use client';
import { useState } from 'react';

export default function ReportsPage() {
  const [companyId, setCompanyId] = useState<string>('');
  const [to, setTo] = useState('');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Relatórios & Export</h1>

      <div className="space-y-2">
        <h2 className="font-medium">Gerar PDF (empresa)</h2>
        <input
          className="border rounded px-2 py-1 w-[420px]"
          placeholder="companyId"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        />
        <button
          className="border rounded px-3 py-1 ml-2"
          onClick={async () => {
            const r = await fetch('/api/reports/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companyId,
                sections: ['maturidade', 'fit', 'decisores', 'digital'],
              }),
            });
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OLV-Inteligencia360-${companyId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Gerar PDF
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Exportar CSV</h2>
        <div className="space-x-2">
          <a className="underline" href="/api/export/companies">
            Empresas
          </a>
          <a className="underline" href={`/api/export/decision-makers?companyId=${companyId || ''}`}>
            Decisores (empresa)
          </a>
          <a className="underline" href={`/api/export/runs?companyId=${companyId || ''}`}>
            Runs & Eventos (empresa)
          </a>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Agendar envio por e-mail</h2>
        <input
          className="border rounded px-2 py-1 w-[420px]"
          placeholder="to@empresa.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button
          className="border rounded px-3 py-1 ml-2"
          onClick={async () => {
            const in15 = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            const r = await fetch('/api/reports/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ companyId, to, template: 'inteligencia360', when: in15 }),
            });
            alert(await r.text());
          }}
        >
          Agendar para +15min
        </button>
      </div>
    </div>
  );
}

