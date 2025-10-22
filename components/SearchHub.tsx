/**
 * SearchHub - Busca única por CNPJ ou Website
 */
'use client';
import { useState } from 'react';
import { useCompany } from '@/lib/state/company';

export default function SearchHub() {
  const [mode, setMode] = useState<'cnpj' | 'website'>('cnpj');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const setCompany = useCompany((s) => s.setCompany);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    setLoading(true);
    try {
      const res = await fetch('/api/companies/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'cnpj' ? { cnpj: value } : { website: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.code || 'Erro');
      setCompany({
        id: json.company.id,
        name: json.company.name,
        cnpj: json.company.cnpj,
        website: json.company.website,
      });
      alert('Empresa selecionada com sucesso.');
      setValue('');
    } catch (e: any) {
      alert(`Falha: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full flex gap-2 items-center">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as any)}
        className="border rounded px-2 py-1 bg-background"
      >
        <option value="cnpj">CNPJ</option>
        <option value="website">Website</option>
      </select>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={mode === 'cnpj' ? '18.627.195/0001-60' : 'empresa.com.br'}
        className="flex-1 border rounded px-3 py-2 bg-background"
      />
      <button
        disabled={loading}
        className="px-3 py-2 border rounded hover:bg-accent disabled:opacity-50"
      >
        {loading ? 'Buscando…' : 'Buscar'}
      </button>
    </form>
  );
}

