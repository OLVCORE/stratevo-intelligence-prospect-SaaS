/**
 * Composer - Editor de mensagens com templates
 * SEM MOCKS - usa templates reais do banco
 */
'use client';
import { useEffect, useState } from 'react';

type Template = {
  id: string;
  name: string;
  subject?: string;
  body_md: string;
  channel: string;
};

export default function Composer({
  threadId,
  channel,
  defaultTo,
  onSent,
}: {
  threadId: string;
  channel: 'email' | 'whatsapp';
  defaultTo?: string;
  onSent: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [to, setTo] = useState(defaultTo || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Carregar templates do canal
    async function loadTemplates() {
      const res = await fetch(`/api/templates?channel=${channel}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setTemplates(json.items || []);
    }
    loadTemplates();
  }, [channel]);

  useEffect(() => {
    // Quando selecionar template, preencher body/subject
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setBody(template.body_md);
        if (template.subject) setSubject(template.subject);
      }
    }
  }, [selectedTemplateId, templates]);

  async function handleSend() {
    if (!to || !body) {
      alert('Preencha destinatário e mensagem');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: channel === 'email' ? subject : undefined,
          bodyText: body,
          templateId: selectedTemplateId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro ao enviar');

      alert('Mensagem enviada com sucesso!');
      setBody('');
      setSubject('');
      setSelectedTemplateId('');
      onSent();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="flex-1 border rounded px-2 py-1 bg-background text-sm"
          placeholder={channel === 'email' ? 'Para (e-mail)' : 'Para (WhatsApp +55...)'}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1 bg-background text-sm"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          <option value="">Sem template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {channel === 'email' && (
        <input
          className="w-full border rounded px-2 py-1 bg-background text-sm"
          placeholder="Assunto"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      )}

      <textarea
        className="w-full border rounded px-2 py-2 bg-background text-sm min-h-[120px]"
        placeholder="Digite sua mensagem..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          💡 Use variáveis: {'{'}
          {'{'}company.name{'}'}, {'{'}
          {'{'}person.first_name{'}'}
          {'}'}
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !to || !body}
          className="border rounded px-4 py-2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

