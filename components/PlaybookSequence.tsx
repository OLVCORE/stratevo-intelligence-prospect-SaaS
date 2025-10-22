/**
 * PlaybookSequence - Aba de sequência no lead
 * SEM MOCKS - lista playbooks ativos e executa sequências
 */
'use client';
import { useEffect, useState } from 'react';
import RunTimeline from './RunTimeline';

export default function PlaybookSequence({ leadId }: { leadId: string }) {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPlaybooks() {
    const res = await fetch('/api/playbooks?status=active', { cache: 'no-store' });
    const json = await res.json();
    if (res.ok) setPlaybooks(json.items || []);
  }

  async function loadRuns() {
    // Buscar runs do lead (simplificado - melhorar com endpoint específico)
    const supabase = (await import('@/lib/supabase/browser')).supabaseBrowser;
    const { data } = await supabase.from('runs').select('*,playbooks(name)').eq('lead_id', leadId);
    setRuns(data || []);
  }

  useEffect(() => {
    loadPlaybooks();
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function instantiate(playbookId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      alert('Playbook instanciado! Clique "Executar Próximo" para começar.');
      await loadRuns();
      setSelectedRunId(json.runId);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function executeNext(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}/next`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      if (json.finished) {
        alert('Sequência finalizada!');
      } else {
        alert(`Passo ${json.nextStep || '?'} executado!`);
      }
      await loadRuns();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function skipStep(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}/skip`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao pular');
      alert('Passo pulado!');
      await loadRuns();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function stopRun(runId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao parar');
      alert('Sequência encerrada!');
      await loadRuns();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Instanciar novo playbook */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="font-medium">Instanciar Playbook</div>
        {playbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum playbook ativo. Crie e publique playbooks em /playbooks
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {playbooks.map((pb) => (
              <button
                key={pb.id}
                onClick={() => instantiate(pb.id)}
                disabled={loading}
                className="border rounded p-3 text-left hover:bg-accent transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-sm">{pb.name}</div>
                {pb.persona && <div className="text-xs text-muted-foreground mt-1">{pb.persona}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Runs ativos */}
      <div className="space-y-3">
        <div className="font-medium">Sequências Ativas ({runs.length})</div>
        {runs.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhuma sequência iniciada ainda.</div>
        )}
        {runs.map((run) => {
          const pbData: any = Array.isArray(run.playbooks) ? run.playbooks[0] : run.playbooks;
          return (
            <div key={run.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{pbData?.name || 'Playbook'}</div>
                  <div className="text-xs text-muted-foreground">
                    Status: {run.status} • Passo: {run.step_index + 1}
                  </div>
                </div>
                <div className="flex gap-2">
                  {run.status === 'active' && (
                    <>
                      <button
                        onClick={() => executeNext(run.id)}
                        disabled={loading}
                        className="border rounded px-3 py-1 text-xs hover:bg-accent disabled:opacity-50"
                      >
                        Executar Próximo
                      </button>
                      <button
                        onClick={() => skipStep(run.id)}
                        disabled={loading}
                        className="border rounded px-3 py-1 text-xs hover:bg-accent disabled:opacity-50"
                      >
                        Pular
                      </button>
                      <button
                        onClick={() => stopRun(run.id)}
                        disabled={loading}
                        className="border rounded px-3 py-1 text-xs hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                      >
                        Parar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedRunId === run.id && <RunTimeline runId={run.id} />}
              {selectedRunId !== run.id && (
                <button
                  onClick={() => setSelectedRunId(run.id)}
                  className="text-xs underline hover:no-underline"
                >
                  Ver timeline
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

