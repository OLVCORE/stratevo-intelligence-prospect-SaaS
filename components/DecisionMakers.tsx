/**
 * DecisionMakers - Lista decisores da empresa
 * SEM MOCKS - empty state guiado quando faltam chaves
 */
'use client';
import { useEffect, useState } from 'react';

type Person = {
  id: string;
  full_name: string;
  title?: string;
  department?: string;
  seniority?: string;
  source: string;
  source_url?: string;
  confidence: number;
  person_contacts?: Array<{
    id: string;
    type: string;
    value: string;
    verified: boolean;
    source: string;
    source_url?: string;
  }>;
};

export default function DecisionMakers({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<Person[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (q) params.set('q', q);
      const r = await fetch(`/api/company/${companyId}/decision-makers?${params.toString()}`, {
        cache: 'no-store',
      });
      const j = await r.json();
      if (r.ok) {
        setItems(j.items || []);
        setTotal(j.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch(`/api/company/${companyId}/decision-makers/refresh`, {
        method: 'POST',
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || 'Falha ao atualizar decisores');

      alert(
        `Atualizado: +${j.added} novo(s), ${j.updated} atualizado(s)\n\nProvedores:\nApollo: ${j.providers.apollo} ms\nHunter: ${j.providers.hunter} ms\nPhantom: ${j.providers.phantom}`
      );
      await load();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createLead(personId: string, companyId: string) {
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, personId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || 'Falha ao criar lead');
      // Redirecionar para inbox do lead criado
      window.location.href = `/leads/${j.leadId}`;
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        <input
          className="border rounded px-2 py-1 bg-background"
          placeholder="Buscar por nome/cargo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => {
            setPage(1);
            load();
          }}
          className="border rounded px-3 py-1 hover:bg-accent disabled:opacity-50"
          disabled={loading}
        >
          Filtrar
        </button>
        <button
          onClick={refresh}
          className="border rounded px-3 py-1 hover:bg-accent disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Atualizando…' : 'Atualizar Decisores'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border rounded-lg p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Sem decisores coletados ainda.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-medium">Configure suas integrações:</p>
            <div className="grid md:grid-cols-3 gap-2">
              <div className="border rounded p-3 text-xs">
                <div className="font-medium mb-1">Apollo.io</div>
                <div className="text-muted-foreground">
                  {process.env.NEXT_PUBLIC_APOLLO_CONFIGURED
                    ? '✅ Configurado'
                    : '⚙️ Configure APOLLO_API_KEY'}
                </div>
              </div>
              <div className="border rounded p-3 text-xs">
                <div className="font-medium mb-1">Hunter.io</div>
                <div className="text-muted-foreground">
                  {process.env.NEXT_PUBLIC_HUNTER_CONFIGURED
                    ? '✅ Configurado'
                    : '⚙️ Configure HUNTER_API_KEY'}
                </div>
              </div>
              <div className="border rounded p-3 text-xs">
                <div className="font-medium mb-1">PhantomBuster</div>
                <div className="text-muted-foreground">
                  {process.env.NEXT_PUBLIC_PHANTOM_CONFIGURED
                    ? '✅ Configurado'
                    : '⚙️ Configure PHANTOM_BUSTER_API_KEY'}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Após configurar, clique em <strong>"Atualizar Decisores"</strong> acima.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Cargo</th>
                  <th className="text-left p-2">Depto</th>
                  <th className="text-left p-2">Seniority</th>
                  <th className="text-left p-2">Contatos</th>
                  <th className="text-left p-2">Fonte</th>
                  <th className="text-left p-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/50">
                    <td className="p-2">{p.full_name}</td>
                    <td className="p-2">{p.title || '-'}</td>
                    <td className="p-2">{p.department || '-'}</td>
                    <td className="p-2">{p.seniority || '-'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {(p.person_contacts || []).map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 border rounded text-xs"
                            title={`${c.type} • ${c.source}`}
                          >
                            {c.type}: {c.value}
                            {c.verified && ' ✓'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {p.source}
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        className="text-xs underline hover:no-underline text-primary"
                        onClick={() => createLead(p.id, companyId)}
                      >
                        Criar Lead + Inbox
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button
              className="border rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Anterior
            </button>
            <span>
              Página {page} de {pages} ({total} decisores)
            </span>
            <button
              className="border rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || loading}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}

