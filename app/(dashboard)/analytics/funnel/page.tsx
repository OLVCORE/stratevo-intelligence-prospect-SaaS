'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FunnelPage() {
  const [companyId, setCompanyId] = useState<string>('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetch(`/api/analytics/funnel?companyId=${companyId}&days=${days}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData(res.items || []);
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [companyId, days]);

  const totals = data.reduce(
    (acc, curr) => ({
      searched: acc.searched + (curr.searched || 0),
      enriched: acc.enriched + (curr.enriched || 0),
      decisioned: acc.decisioned + (curr.decisioned || 0),
      contacted: acc.contacted + (curr.contacted || 0),
      replied: acc.replied + (curr.replied || 0),
      meeting: acc.meeting + (curr.meeting || 0),
    }),
    { searched: 0, enriched: 0, decisioned: 0, contacted: 0, replied: 0, meeting: 0 }
  );

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">📊 Funil de Conversão</h1>
            <p className="text-sm text-muted-foreground">
              Busca → Enriquecimento → Decisores → Contato → Resposta → Reunião
            </p>
          </div>
          <Link href="/analytics" className="text-sm underline">
            ← Voltar
          </Link>
        </div>

        <div className="border rounded-lg p-4 bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="border px-3 py-2 rounded w-[380px]"
              placeholder="companyId (UUID)"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
            <select
              className="border px-3 py-2 rounded"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
            {companyId && (
              <a
                className="underline ml-auto text-sm"
                href={`/api/analytics/funnel?companyId=${companyId}&days=${days}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver dados (JSON) →
              </a>
            )}
          </div>
        </div>

        {!companyId ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            Informe um companyId para visualizar o funil.
          </div>
        ) : loading ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            Nenhum dado coletado para a janela selecionada ({days} dias).
            <br />
            <span className="text-xs">
              Execute a primeira carga das materialized views no Supabase ou aguarde o refresh
              automático.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.searched}</div>
                <div className="text-sm text-muted-foreground">Buscados</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.enriched}</div>
                <div className="text-sm text-muted-foreground">Enriquecidos</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.decisioned}</div>
                <div className="text-sm text-muted-foreground">Decisores</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.contacted}</div>
                <div className="text-sm text-muted-foreground">Contatados</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.replied}</div>
                <div className="text-sm text-muted-foreground">Responderam</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.meeting}</div>
                <div className="text-sm text-muted-foreground">Reuniões</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Dados Brutos ({data.length} registros)</h3>
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="border-b sticky top-0 bg-background">
                    <tr>
                      <th className="text-left p-2">Data</th>
                      <th className="text-right p-2">Buscados</th>
                      <th className="text-right p-2">Enriquecidos</th>
                      <th className="text-right p-2">Decisores</th>
                      <th className="text-right p-2">Contatados</th>
                      <th className="text-right p-2">Responderam</th>
                      <th className="text-right p-2">Reuniões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">
                          {new Date(row.d).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="text-right p-2">{row.searched || 0}</td>
                        <td className="text-right p-2">{row.enriched || 0}</td>
                        <td className="text-right p-2">{row.decisioned || 0}</td>
                        <td className="text-right p-2">{row.contacted || 0}</td>
                        <td className="text-right p-2">{row.replied || 0}</td>
                        <td className="text-right p-2">{row.meeting || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

