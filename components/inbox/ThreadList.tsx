/**
 * ThreadList - Lista de threads (conversas) do lead
 * SEM MOCKS - se vazio, mostra CTA para criar thread
 */
'use client';
import { useEffect, useState } from 'react';

type Thread = {
  id: string;
  channel: string;
  subject?: string;
  created_at: string;
  last_message?: any;
};

export default function ThreadList({
  leadId,
  selectedThreadId,
  onSelectThread,
}: {
  leadId: string;
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/threads/list`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setThreads(json.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  if (loading) return <div className="p-4 text-sm opacity-70">Carregando threads...</div>;

  if (threads.length === 0) {
    return (
      <div className="p-4 space-y-2 text-sm">
        <p className="text-muted-foreground">Nenhuma conversa iniciada ainda.</p>
        <p className="text-xs text-muted-foreground">
          Clique em <strong>"Nova Thread"</strong> para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelectThread(thread.id)}
          className={`w-full text-left p-3 hover:bg-accent transition-colors ${
            selectedThreadId === thread.id ? 'bg-accent' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {thread.channel === 'email' ? '📧' : '💬'} {thread.channel}
            </span>
          </div>
          {thread.subject && <div className="font-medium text-sm truncate">{thread.subject}</div>}
          {thread.last_message && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {thread.last_message.direction === 'inbound' ? '← ' : '→ '}
              {thread.last_message.body?.substring(0, 50) || '(sem corpo)'}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(thread.created_at).toLocaleDateString('pt-BR')}
          </div>
        </button>
      ))}
    </div>
  );
}

