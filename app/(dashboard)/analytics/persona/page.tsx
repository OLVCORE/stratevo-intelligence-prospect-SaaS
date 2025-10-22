'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PersonaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/persona')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData(res.items || []);
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">👥 Eficiência por Persona</h1>
            <p className="text-sm text-muted-foreground">
              Performance por perfil (C-level, Compras, TI, etc.)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              className="underline text-sm"
              href="/api/analytics/persona"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver dados (JSON) →
            </a>
            <Link href="/analytics" className="text-sm underline">
              ← Voltar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="border rounded-lg p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            Nenhum dado coletado ainda.
            <br />
            <span className="text-xs">
              Defina personas nos leads para popular esta análise.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.slice(0, 6).map((item) => {
                const replyRate =
                  item.sends > 0 ? ((item.replies / item.sends) * 100).toFixed(1) : '0.0';
                const meetingRate =
                  item.sends > 0 ? ((item.meetings / item.sends) * 100).toFixed(1) : '0.0';

                return (
                  <div key={item.persona} className="border rounded-lg p-4">
                    <div className="font-semibold text-lg mb-2 capitalize">
                      {item.persona === 'unknown' ? '❓ Não Definido' : `🎯 ${item.persona}`}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Runs:</span>
                        <strong>{item.runs}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Envios:</span>
                        <strong>{item.sends}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Respostas:</span>
                        <strong>{item.replies}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa Resposta:</span>
                        <strong>{replyRate}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reuniões:</span>
                        <strong>{item.meetings}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa Reunião:</span>
                        <strong>{meetingRate}%</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Todas as Personas ({data.length} registros)</h3>
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="border-b sticky top-0 bg-background">
                    <tr>
                      <th className="text-left p-2">Persona</th>
                      <th className="text-right p-2">Runs</th>
                      <th className="text-right p-2">Envios</th>
                      <th className="text-right p-2">Respostas</th>
                      <th className="text-right p-2">Taxa %</th>
                      <th className="text-right p-2">Reuniões</th>
                      <th className="text-right p-2">Conv %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => {
                      const replyRate =
                        row.sends > 0 ? ((row.replies / row.sends) * 100).toFixed(1) : '0.0';
                      const meetingRate =
                        row.sends > 0 ? ((row.meetings / row.sends) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={row.persona} className="border-b">
                          <td className="p-2 capitalize">{row.persona}</td>
                          <td className="text-right p-2">{row.runs}</td>
                          <td className="text-right p-2">{row.sends}</td>
                          <td className="text-right p-2">{row.replies}</td>
                          <td className="text-right p-2">{replyRate}%</td>
                          <td className="text-right p-2">{row.meetings}</td>
                          <td className="text-right p-2">{meetingRate}%</td>
                        </tr>
                      );
                    })}
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

