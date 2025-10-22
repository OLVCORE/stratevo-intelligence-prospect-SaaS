/**
 * RunTimeline - Timeline de execução de playbook
 * SEM MOCKS - mostra eventos reais da sequência
 */
'use client';
import { useEffect, useState } from 'react';

type RunEvent = {
  id: string;
  step_index: number;
  variant?: string;
  action: string;
  channel?: string;
  provider?: string;
  latency_ms?: number;
  created_at: string;
  meta?: any;
};

type RunData = {
  id: string;
  step_index: number;
  status: string;
  next_due_at?: string;
  variant_map?: any;
  playbooks?: { name: string; persona?: string };
};

export default function RunTimeline({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunData | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setRun(json.run);
        setEvents(json.events || []);
        setSteps(json.steps || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  if (loading) return <div className="text-sm opacity-70">Carregando sequência...</div>;

  if (!run) return <div className="text-sm text-muted-foreground">Run não encontrado</div>;

  const playbookData: any = Array.isArray(run.playbooks) ? run.playbooks[0] : run.playbooks;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">{playbookData?.name || 'Playbook'}</div>
            {playbookData?.persona && (
              <div className="text-xs text-muted-foreground mt-1">Persona: {playbookData.persona}</div>
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              run.status === 'active'
                ? 'bg-green-100 text-green-800'
                : run.status === 'finished'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {run.status}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="opacity-70">Passo atual:</span> {run.step_index + 1}/{steps.length}
          </div>
          {run.next_due_at && (
            <div>
              <span className="opacity-70">Próxima execução:</span>{' '}
              {new Date(run.next_due_at).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      {/* Timeline de eventos */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Timeline de Eventos</div>
        {events.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhum evento ainda. Execute o primeiro passo.</div>
        )}
        {events.map((event) => (
          <div key={event.id} className="border rounded p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Passo {event.step_index + 1}</span>
                {event.variant && <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">Variante {event.variant}</span>}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    event.action === 'send'
                      ? 'bg-blue-100 text-blue-800'
                      : event.action === 'reply'
                      ? 'bg-green-100 text-green-800'
                      : event.action === 'skip'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.action}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            {event.channel && (
              <div className="text-xs text-muted-foreground mt-2">
                {event.channel} • {event.provider}
                {event.latency_ms && ` • ${event.latency_ms}ms`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

