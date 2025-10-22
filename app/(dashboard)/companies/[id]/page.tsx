/**
 * Página: Detalhes da Empresa (CICLO 3)
 * Digital Signals + Tech Stack com dados reais on-demand
 * SEM MOCKS - empty states claros
 */
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshButtons } from '@/components/RefreshButtons';
import DigitalSignals from '@/components/DigitalSignals';
import TechSignals from '@/components/TechSignals';
import DecisionMakers from '@/components/DecisionMakers';
import MaturityRadar from '@/components/MaturityRadar';
import FitCards from '@/components/FitCards';

type Company = {
  id: string;
  name?: string;
  trade_name?: string;
  cnpj?: string;
  domain?: string;
  website?: string;
};

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [tab, setTab] = useState<'digital' | 'tech' | 'decisores' | 'maturidade'>('digital');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Buscar dados da empresa
    async function loadCompany() {
      const res = await fetch(`/api/companies/list?page=1&pageSize=1`, { cache: 'no-store' });
      const json = await res.json();
      if (json.ok && json.items?.length > 0) {
        // Por simplicidade, buscar da lista (melhorar com endpoint específico no futuro)
        // Aqui vamos buscar direto do supabase
        const supabase = (await import('@/lib/supabase/browser')).supabaseBrowser;
        const { data } = await supabase.from('companies').select('*').eq('id', id).single();
        if (data) setCompany(data);
      }
    }
    loadCompany();
  }, [id]);

  function handleRefreshDone() {
    // Forçar reload dos componentes
    setRefreshKey((k) => k + 1);
  }

  if (!company) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando empresa...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <button
          onClick={() => router.push('/companies')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar para lista
        </button>
        <h1 className="text-2xl font-semibold">
          {company.name || company.trade_name || 'Empresa'}
        </h1>
        {company.cnpj && (
          <p className="text-sm text-muted-foreground font-mono">{company.cnpj}</p>
        )}
        {company.domain && (
          <p className="text-sm text-muted-foreground">
            <a
              href={company.website || `https://${company.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              {company.domain}
            </a>
          </p>
        )}
      </div>

      <RefreshButtons companyId={id} onDone={handleRefreshDone} />

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab('digital')}
          className={`pb-2 px-1 ${
            tab === 'digital'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Digital
        </button>
        <button
          onClick={() => setTab('tech')}
          className={`pb-2 px-1 ${
            tab === 'tech'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Tech Stack
        </button>
        <button
          onClick={() => setTab('decisores')}
          className={`pb-2 px-1 ${
            tab === 'decisores'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Decisores
        </button>
        <button
          onClick={() => setTab('maturidade')}
          className={`pb-2 px-1 ${
            tab === 'maturidade'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Maturidade & Fit
        </button>
      </div>

      {/* Content */}
      <div key={refreshKey}>
        {tab === 'digital' && <DigitalSignals companyId={id} />}
        {tab === 'tech' && <TechSignals companyId={id} />}
        {tab === 'decisores' && <DecisionMakers companyId={id} />}
        {tab === 'maturidade' && (
          <div className="space-y-8">
            <MaturityRadar companyId={id} />
            <FitCards companyId={id} />
          </div>
        )}
      </div>
    </main>
  );
}

