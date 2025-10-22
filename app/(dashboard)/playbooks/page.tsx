/**
 * Página: Playbooks (Lista básica)
 * Editor completo seria próximo ciclo - aqui apenas lista e ações básicas
 */
'use client';
import { useEffect, useState } from 'react';

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/playbooks', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setPlaybooks(json.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPlaybook() {
    const name = prompt('Nome do playbook:');
    if (!name) return;

    const persona = prompt('Persona (ex: CIO, CFO):');
    const goal = prompt('Objetivo (ex: Agendar discovery):');

    try {
      const res = await fetch('/api/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, persona, goal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      alert('Playbook criado! (Editor visual em desenvolvimento)');
      await load();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    try {
      const res = await fetch(`/api/playbooks/${id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.message || 'Erro');
      }
      alert(action === 'activate' ? 'Playbook ativado!' : 'Playbook desativado!');
      await load();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Playbooks</h1>
          <p className="text-sm text-muted-foreground">Sequências de outreach multicanal</p>
        </div>
        <button
          onClick={createPlaybook}
          className="border rounded px-4 py-2 hover:bg-accent"
        >
          Criar Playbook
        </button>
      </div>

      {loading && playbooks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Carregando playbooks...</div>
      )}

      {!loading && playbooks.length === 0 && (
        <div className="border rounded-lg p-12 text-center space-y-3">
          <p className="text-muted-foreground">Nenhum playbook criado ainda.</p>
          <p className="text-sm text-muted-foreground">
            Playbooks são sequências de mensagens multicanal (e-mail + WhatsApp) com A/B testing integrado.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {playbooks.map((pb) => (
          <div key={pb.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{pb.name}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      pb.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : pb.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {pb.status}
                  </span>
                </div>
                {pb.persona && <div className="text-sm text-muted-foreground mt-1">Persona: {pb.persona}</div>}
                {pb.goal && <div className="text-sm text-muted-foreground">Objetivo: {pb.goal}</div>}
                {pb.owner && <div className="text-xs text-muted-foreground mt-2">Owner: {pb.owner}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(pb.id, pb.status)}
                  className="text-xs border rounded px-3 py-1 hover:bg-accent"
                >
                  {pb.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-6 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Editor visual de playbooks</strong> com passos, variantes A/B e analytics detalhado será implementado no próximo refinamento.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Por enquanto, playbooks podem ser criados e gerenciados via API. A estrutura completa está pronta (steps, variants, bindings, ab_results).
        </p>
      </div>
    </main>
  );
}
