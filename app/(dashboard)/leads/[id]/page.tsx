/**
 * Página: Lead Inbox (SDR OLV)
 * Inbox unificado com e-mail + WhatsApp (Spotter-like)
 * SEM MOCKS - dados reais sempre
 */
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThreadList from '@/components/inbox/ThreadList';
import MessageList from '@/components/inbox/MessageList';
import Composer from '@/components/inbox/Composer';
import PlaybookSequence from '@/components/PlaybookSequence';

type Lead = {
  id: string;
  company_id: string;
  person_id?: string;
  stage: string;
  companies?: { name?: string; trade_name?: string };
  people?: { full_name?: string };
};

export default function LeadInboxPage({ params }: { params: { id: string } }) {
  const leadId = params.id;
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'whatsapp'>('email');
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<'inbox' | 'sequencia'>('inbox');

  useEffect(() => {
    async function loadLead() {
      const supabase = (await import('@/lib/supabase/browser')).supabaseBrowser;
      const { data } = await supabase
        .from('leads')
        .select('*,companies(name,trade_name),people(full_name)')
        .eq('id', leadId)
        .single();
      if (data) setLead(data);
    }
    loadLead();
  }, [leadId]);

  async function createThread(channel: 'email' | 'whatsapp') {
    try {
      const res = await fetch(`/api/leads/${leadId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          subject: channel === 'email' ? `Contato - ${lead?.companies?.name || 'Empresa'}` : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      setSelectedThreadId(json.threadId);
      setSelectedChannel(channel);
      setShowNewThreadDialog(false);
      setRefreshKey((k) => k + 1);
      alert('Thread criada!');
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  if (!lead) {
    return (
      <main className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando lead...</p>
        </div>
      </main>
    );
  }

  const companyName =
    (lead.companies as any)?.name || (lead.companies as any)?.trade_name || 'Empresa';
  const personName = (lead.people as any)?.full_name || 'Decisor';

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <button
          onClick={() => router.push('/companies')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-semibold">SDR Inbox</h1>
        <p className="text-sm text-muted-foreground">
          {companyName} • {personName} • Stage: {lead.stage}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab('inbox')}
          className={`pb-2 px-1 ${
            tab === 'inbox'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setTab('sequencia')}
          className={`pb-2 px-1 ${
            tab === 'sequencia'
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sequência
        </button>
      </div>

      {/* Content */}
      {tab === 'inbox' && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNewThreadDialog(true);
                setSelectedChannel('email');
                createThread('email');
              }}
              className="border rounded px-3 py-2 hover:bg-accent"
            >
              📧 Nova Thread E-mail
            </button>
            <button
              onClick={() => {
                setShowNewThreadDialog(true);
                setSelectedChannel('whatsapp');
                createThread('whatsapp');
              }}
              className="border rounded px-3 py-2 hover:bg-accent"
            >
              💬 Nova Thread WhatsApp
            </button>
          </div>

          <div className="grid md:grid-cols-[300px_1fr] gap-4 border rounded-lg overflow-hidden">
        {/* Left: Thread List */}
        <div className="border-r bg-muted/20">
          <div className="p-3 border-b font-medium">Conversas</div>
          <div key={refreshKey}>
            <ThreadList
              leadId={leadId}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
            />
          </div>
        </div>

        {/* Right: Messages + Composer */}
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-hidden">
            <MessageList threadId={selectedThreadId || ''} />
          </div>
          {selectedThreadId && (
            <Composer
              threadId={selectedThreadId}
              channel={selectedChannel}
              defaultTo=""
              onSent={() => setRefreshKey((k) => k + 1)}
            />
          )}
        </div>
      </div>
        </>
      )}

      {tab === 'sequencia' && <PlaybookSequence leadId={leadId} />}
    </main>
  );
}

