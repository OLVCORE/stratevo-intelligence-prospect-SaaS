/**
 * DigitalSignals - Lista sinais digitais coletados
 * SEM MOCKS - se vazio, mostra empty state claro
 */
'use client';
import { useEffect, useState } from 'react';

type DigitalSignal = {
  id: string;
  url: string;
  title?: string;
  snippet?: string;
  type: string;
  source: string;
  latency_ms?: number;
  confidence: number;
  collected_at: string;
};

export default function DigitalSignals({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<DigitalSignal[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/company/${companyId}/digital?limit=12`, { cache: 'no-store' });
      const j = await r.json();
      if (r.ok) setItems(j.items || []);
    } catch (e) {
      console.error('Erro ao carregar sinais digitais:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  if (loading) {
    return <div className="text-sm opacity-70">Carregando sinais digitais...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Sem sinais digitais coletados ainda.
        </p>
        <p className="text-xs text-muted-foreground">
          Clique em <strong>"Atualizar Digital"</strong> acima para coletar dados reais da homepage.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {items.map((it) => (
        <a
          key={it.id}
          href={it.url}
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded p-3 hover:shadow transition-shadow"
        >
          <div className="font-medium text-sm truncate">{it.title || it.url}</div>
          <div className="text-xs mt-2 opacity-70 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{it.source}</span>
            {it.latency_ms && <span>{it.latency_ms} ms</span>}
            <span>conf {it.confidence}</span>
          </div>
          <div className="text-xs mt-1 opacity-50">
            {new Date(it.collected_at).toLocaleString('pt-BR')}
          </div>
        </a>
      ))}
    </div>
  );
}

