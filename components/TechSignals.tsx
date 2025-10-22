/**
 * TechSignals - Lista tecnologias detectadas
 * SEM MOCKS - se vazio, mostra empty state claro
 */
'use client';
import { useEffect, useState } from 'react';

type TechSignal = {
  id: string;
  tech_name: string;
  category: string;
  source: string;
  latency_ms?: number;
  confidence: number;
  evidence: any;
  collected_at: string;
};

export default function TechSignals({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<TechSignal[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/company/${companyId}/tech-stack`, { cache: 'no-store' });
      const j = await r.json();
      if (r.ok) setItems(j.items || []);
    } catch (e) {
      console.error('Erro ao carregar tech signals:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  if (loading) {
    return <div className="text-sm opacity-70">Carregando tecnologias...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Sem tecnologias detectadas ainda.
        </p>
        <p className="text-xs text-muted-foreground">
          Clique em <strong>"Atualizar Tech Stack"</strong> acima para detectar tecnologias reais.
        </p>
      </div>
    );
  }

  // Agrupar por categoria
  const byCat = items.reduce((acc: any, i: any) => {
    (acc[i.category || 'other'] ||= []).push(i);
    return acc;
  }, {});
  const cats = Object.keys(byCat);

  return (
    <div className="space-y-4">
      {cats.map((cat) => (
        <div key={cat}>
          <div className="font-medium mb-2 text-sm capitalize">{cat}</div>
          <div className="flex flex-wrap gap-2">
            {byCat[cat].map((i: TechSignal) => (
              <span
                key={i.id}
                title={`Fonte: ${i.source} • ${i.latency_ms ?? '?'} ms • conf ${i.confidence}`}
                className="px-3 py-1 text-xs border rounded hover:shadow transition-shadow cursor-help"
              >
                {i.tech_name}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="text-xs text-muted-foreground mt-4">
        {items.length} tecnologia{items.length !== 1 ? 's' : ''} detectada{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

