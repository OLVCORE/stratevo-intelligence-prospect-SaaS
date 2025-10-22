/**
 * RefreshButtons - Botões para atualizar Digital e Tech Stack
 * SEM MOCKS - chama APIs reais e mostra erros explícitos
 */
'use client';
import { useState } from 'react';

export function RefreshButtons({
  companyId,
  onDone,
}: {
  companyId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState<'digital' | 'tech' | null>(null);

  async function run(kind: 'digital' | 'tech') {
    setLoading(kind);
    try {
      const endpoint =
        kind === 'digital'
          ? `/api/company/${companyId}/digital/refresh`
          : `/api/company/${companyId}/tech-stack/refresh`;

      const res = await fetch(endpoint, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || 'Erro de atualização');

      onDone();
      alert(kind === 'digital' ? 'Digital atualizado!' : 'Tech Stack atualizado!');
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={!!loading}
        onClick={() => run('digital')}
        className="border rounded px-3 py-2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'digital' ? 'Atualizando Digital…' : 'Atualizar Digital'}
      </button>
      <button
        disabled={!!loading}
        onClick={() => run('tech')}
        className="border rounded px-3 py-2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'tech' ? 'Atualizando Tech…' : 'Atualizar Tech Stack'}
      </button>
    </div>
  );
}

