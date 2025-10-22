/**
 * CompaniesTable - Lista de empresas com paginação, filtros e ordenação
 */
'use client';
import { useEffect, useState } from 'react';
import { useCompany } from '@/lib/state/company';

type Item = {
  id: string;
  name?: string;
  trade_name?: string;
  cnpj?: string;
  domain?: string;
  capital_social?: number | null;
  status?: string;
  updated_at?: string;
  source?: string;
};

export default function CompaniesTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'updated_at' | 'created_at' | 'name' | 'capital_social'>(
    'updated_at'
  );
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const setCompany = useCompany((s) => s.setCompany);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort,
        order,
      });
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const res = await fetch(`/api/companies/list?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      setItems(json.items);
      setTotal(json.total);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sort, order]);

  function makeActive(it: Item) {
    setCompany({
      id: it.id,
      name: it.name || it.trade_name,
      cnpj: it.cnpj,
      website: it.domain ? `https://${it.domain}` : undefined,
    });
    alert('Empresa definida como ativa.');
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-2 py-1 bg-background"
          placeholder="Buscar por nome/CNPJ/domínio"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1 bg-background"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Status (todos)</option>
          <option value="ATIVA">ATIVA</option>
          <option value="BAIXADA">BAIXADA</option>
        </select>
        <select
          className="border rounded px-2 py-1 bg-background"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="updated_at">Atualizado Em</option>
          <option value="created_at">Criado Em</option>
          <option value="name">Nome</option>
          <option value="capital_social">Capital</option>
        </select>
        <select
          className="border rounded px-2 py-1 bg-background"
          value={order}
          onChange={(e) => setOrder(e.target.value as any)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <button
          className="border rounded px-3 py-1 hover:bg-accent disabled:opacity-50"
          onClick={() => {
            setPage(1);
            load();
          }}
          disabled={loading}
        >
          Filtrar
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">Empresa</th>
              <th className="text-left p-2">CNPJ</th>
              <th className="text-left p-2">Domínio</th>
              <th className="text-right p-2">Capital</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Fonte</th>
              <th className="text-left p-2">Atualizado</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-center" colSpan={8}>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      Nenhuma empresa cadastrada ainda.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      💡 Use o <strong>SearchHub</strong> na página inicial para buscar e carregar
                      dados reais.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-t hover:bg-muted/50">
                <td className="p-2">
                  <a
                    href={`/companies/${it.id}`}
                    className="hover:underline text-primary"
                  >
                    {it.name || it.trade_name || '-'}
                  </a>
                </td>
                <td className="p-2 font-mono text-xs">{it.cnpj || '-'}</td>
                <td className="p-2 text-xs">{it.domain || '-'}</td>
                <td className="p-2 text-right">
                  {typeof it.capital_social === 'number'
                    ? it.capital_social.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'}
                </td>
                <td className="p-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      it.status === 'ATIVA'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {it.status || '-'}
                  </span>
                </td>
                <td className="p-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {it.source || '-'}
                  </span>
                </td>
                <td className="p-2 text-xs">
                  {it.updated_at ? new Date(it.updated_at).toLocaleString('pt-BR') : '-'}
                </td>
                <td className="p-2">
                  <button
                    className="text-xs underline hover:no-underline text-primary"
                    onClick={() => makeActive(it)}
                  >
                    Tornar Ativa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="border rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {page} de {pages} ({total} empresas)
        </span>
        <button
          className="border rounded px-2 py-1 hover:bg-accent disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page >= pages || loading}
        >
          Próxima
        </button>
        <select
          className="border rounded px-2 py-1 ml-2 bg-background"
          value={pageSize}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/página
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

