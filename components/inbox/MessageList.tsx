/**
 * MessageList - Timeline de mensagens da thread
 * SEM MOCKS - se vazio, mostra empty state
 */
'use client';
import { useEffect, useState } from 'react';

type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  from_addr: string;
  to_addr: string;
  body?: string;
  status: string;
  provider: string;
  latency_ms?: number;
  created_at: string;
};

export default function MessageList({ threadId }: { threadId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!threadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setMessages(json.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  if (!threadId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Selecione uma thread à esquerda</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm opacity-70">Carregando mensagens...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          <p className="text-xs text-muted-foreground">
            Use o composer abaixo para enviar a primeira mensagem
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              msg.direction === 'outbound'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">
              {msg.body || '(corpo não armazenado - LGPD)'}
            </div>
            <div className="text-xs mt-2 opacity-70 flex items-center gap-2">
              <span>{msg.direction === 'outbound' ? '→' : '←'}</span>
              <span>{msg.provider}</span>
              <span>{msg.status}</span>
              {msg.latency_ms && <span>{msg.latency_ms}ms</span>}
              <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

