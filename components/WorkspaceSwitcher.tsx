/**
 * WorkspaceSwitcher
 * Permite trocar entre tenants/workspaces
 */
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tenant = {
  id: string;
  name: string;
};

export default function WorkspaceSwitcher() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Carregar tenants disponíveis
    fetch('/api/tenants/list')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setTenants(json.items || []);
      })
      .catch(() => setTenants([]));

    // Carregar workspace atual
    fetch('/api/workspaces/current')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setCurrent(json.tenantId);
      })
      .catch(() => setCurrent(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleChange(tenantId: string) {
    try {
      const res = await fetch('/api/workspaces/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });

      const json = await res.json();
      if (json.ok) {
        setCurrent(tenantId);
        // Refresh para aplicar novo contexto
        router.refresh();
        // Opcional: limpar Company Context ao trocar workspace
        if (typeof window !== 'undefined') {
          localStorage.removeItem('olv.company');
        }
      } else {
        alert('Erro ao trocar workspace');
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">
        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">Sem workspaces</div>
    );
  }

  if (tenants.length === 1) {
    return (
      <div className="text-xs px-2 py-1 rounded border bg-background">
        {tenants[0].name}
      </div>
    );
  }

  return (
    <select
      className="text-xs px-2 py-1 rounded border bg-background cursor-pointer"
      value={current || ''}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="">Selecione workspace...</option>
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

