/**
 * FitCards - Cards de FIT TOTVS por área
 * SEM MOCKS - se vazio, mostra empty state com CTA
 */
'use client';
import { useEffect, useState } from 'react';

type FitArea = {
  area: string;
  fit: number;
  signals: Array<{
    signal: string;
    weight: number;
    source: string;
  }>;
  next_steps: string;
};

export default function FitCards({ companyId }: { companyId: string }) {
  const [areas, setAreas] = useState<FitArea[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/${companyId}/fit-totvs`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setAreas(json.areas || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/${companyId}/fit-totvs/refresh`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      alert(`FIT TOTVS calculado para ${json.areas.length} áreas!`);
      await load();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading && areas.length === 0) {
    return <div className="text-sm opacity-70">Calculando FIT TOTVS...</div>;
  }

  if (areas.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Sem avaliação de FIT TOTVS ainda.</p>
        <p className="text-xs text-muted-foreground">
          Colete dados primeiro e depois clique em <strong>"Atualizar FIT TOTVS"</strong>.
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="border rounded px-4 py-2 hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Calculando...' : 'Atualizar FIT TOTVS'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">FIT TOTVS por Área/Linha de Produto</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="border rounded px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Recalculando...' : 'Atualizar FIT TOTVS'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area) => (
          <div key={area.area} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="font-medium">{area.area}</div>
              <div className="text-2xl font-bold">
                <span
                  className={
                    area.fit >= 70
                      ? 'text-green-600'
                      : area.fit >= 40
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                >
                  {area.fit}%
                </span>
              </div>
            </div>

            {/* Sinais */}
            {area.signals && area.signals.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium opacity-70">Sinais detectados:</div>
                {area.signals.map((s: any, i: number) => (
                  <div key={i} className="text-xs opacity-60">
                    • {s.signal} (+{s.weight})
                  </div>
                ))}
              </div>
            )}

            {/* Próximos passos */}
            {area.next_steps && (
              <div className="pt-3 border-t">
                <div className="text-xs font-medium mb-1">Próximos passos:</div>
                <div className="text-xs text-muted-foreground">{area.next_steps}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

