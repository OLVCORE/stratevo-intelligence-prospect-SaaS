'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PlaybooksPage() {
  const [playbookId, setPlaybookId] = useState<string>('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playbookId) return;
    setLoading(true);
    fetch(`/api/analytics/playbooks?playbookId=${playbookId}&days=${days}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData(res.items || []);
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [playbookId, days]);

  const totals = data.reduce(
    (acc, curr) => ({
      sends: acc.sends + (curr.sends || 0),
      replies: acc.replies + (curr.replies || 0),
      errors: acc.errors + (curr.errors || 0),
    }),
    { sends: 0, replies: 0, errors: 0 }
  );

  const replyRate = totals.sends > 0 ? ((totals.replies / totals.sends) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">🎯 Playbooks Performance</h1>
            <p className="text-sm text-muted-foreground">
              Desempenho por step/variante + evolução temporal
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
              placeholder="playbookId (UUID)"
              value={playbookId}
              onChange={(e) => setPlaybookId(e.target.value)}
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
            {playbookId && (
              <a
                className="underline ml-auto text-sm"
                href={`/api/analytics/playbooks?playbookId=${playbookId}&days=${days}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver dados (JSON) →
              </a>
            )}
          </div>
        </div>

        {!playbookId ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            Informe um playbookId para visualizar performance.
          </div>
        ) : loading ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            Nenhum dado coletado para este playbook na janela de {days} dias.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.sends}</div>
                <div className="text-sm text-muted-foreground">Envios</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.replies}</div>
                <div className="text-sm text-muted-foreground">Respostas</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{replyRate}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Resposta</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-2xl font-bold">{totals.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">
                Performance por Step/Variante ({data.length} registros)
              </h3>
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="border-b sticky top-0 bg-background">
                    <tr>
                      <th className="text-left p-2">Data</th>
                      <th className="text-center p-2">Step</th>
                      <th className="text-center p-2">Variante</th>
                      <th className="text-right p-2">Envios</th>
                      <th className="text-right p-2">Respostas</th>
                      <th className="text-right p-2">Taxa %</th>
                      <th className="text-right p-2">Avg MS</th>
                      <th className="text-right p-2">Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{new Date(row.d).toLocaleDateString('pt-BR')}</td>
                        <td className="text-center p-2">{row.step_index}</td>
                        <td className="text-center p-2">{row.variant}</td>
                        <td className="text-right p-2">{row.sends || 0}</td>
                        <td className="text-right p-2">{row.replies || 0}</td>
                        <td className="text-right p-2">
                          {row.sends > 0
                            ? ((row.replies / row.sends) * 100).toFixed(1)
                            : '0.0'}
                          %
                        </td>
                        <td className="text-right p-2">
                          {row.avg_ms ? Math.round(row.avg_ms) : '-'}
                        </td>
                        <td className="text-right p-2">{row.errors || 0}</td>
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

