'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HeatmapPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/heatmap')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData(res.items || []);
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const getCell = (dow: number, hh: number) => {
    return data.find((item) => item.dow === dow && item.hh === hh);
  };

  const maxSends = Math.max(...data.map((item) => item.sends || 0), 1);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">🔥 Heatmap de Engajamento</h1>
            <p className="text-sm text-muted-foreground">
              Horário × Dia útil de envios e respostas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              className="underline text-sm"
              href="/api/analytics/heatmap"
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
              Aguarde envios de mensagens para popular o heatmap.
            </span>
          </div>
        ) : (
          <>
            <div className="border rounded-lg p-4 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="text-xs font-medium text-center">Hora</div>
                  {DAYS.map((day) => (
                    <div key={day} className="text-xs font-medium text-center">
                      {day}
                    </div>
                  ))}
                </div>
                {HOURS.map((hh) => (
                  <div key={hh} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="text-xs text-center py-2">{hh}h</div>
                    {DAYS.map((_, dow) => {
                      const cell = getCell(dow, hh);
                      const sends = cell?.sends || 0;
                      const opacity = Math.min((sends / maxSends) * 100, 100);
                      return (
                        <div
                          key={dow}
                          className="text-xs text-center py-2 rounded border"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${opacity / 100})`,
                            color: opacity > 50 ? 'white' : 'inherit',
                          }}
                          title={`${DAYS[dow]} ${hh}h: ${sends} envios, ${cell?.replies || 0} respostas`}
                        >
                          {sends > 0 ? sends : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">📊 Estatísticas</h3>
                <div className="text-sm space-y-1">
                  <div>
                    Total de envios:{' '}
                    <strong>{data.reduce((acc, curr) => acc + (curr.sends || 0), 0)}</strong>
                  </div>
                  <div>
                    Total de respostas:{' '}
                    <strong>{data.reduce((acc, curr) => acc + (curr.replies || 0), 0)}</strong>
                  </div>
                  <div>
                    Horário mais ativo:{' '}
                    <strong>
                      {
                        data.reduce((max, item) => (item.sends > max.sends ? item : max), {
                          dow: 0,
                          hh: 0,
                          sends: 0,
                        }).hh
                      }
                      h
                    </strong>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">💡 Legenda</h3>
                <div className="text-sm space-y-1">
                  <div>• Cor mais escura = mais envios</div>
                  <div>• Passe o mouse para ver detalhes</div>
                  <div>• Atualizado via materialized view (5 min)</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

