'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Rule = {
  id: string;
  company_id: string | null;
  name: string;
  event: string;
  conditions: any;
  channels: Array<{ type: string; to: string }>;
  status: string;
  created_at: string;
};

type Occurrence = {
  id: string;
  rule_id: string;
  company_id: string;
  detected_at: string;
  payload: any;
  notified: boolean;
  alert_rules?: { name: string; event: string };
};

export default function AlertsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    event: 'delivery_error' as const,
    companyId: '',
    emailTo: '',
    status: 'active' as const,
    conditions: '{}',
  });

  useEffect(() => {
    loadRules();
    loadOccurrences();
  }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts/rules');
      const json = await res.json();
      if (json.ok) setRules(json.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadOccurrences() {
    // Simulação - em produção, criar endpoint GET /api/alerts/occurrences
    // Por ora, deixamos vazio
    setOccurrences([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      let conditions = {};
      try {
        conditions = JSON.parse(formData.conditions || '{}');
      } catch {}

      const payload = {
        id: formData.id || undefined,
        name: formData.name,
        event: formData.event,
        companyId: formData.companyId || null,
        channels: [{ type: 'email', to: formData.emailTo }],
        status: formData.status,
        conditions,
      };

      const res = await fetch('/api/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) {
        alert('Regra salva com sucesso!');
        setShowForm(false);
        setFormData({
          id: '',
          name: '',
          event: 'delivery_error',
          companyId: '',
          emailTo: '',
          status: 'active',
          conditions: '{}',
        });
        loadRules();
      } else {
        alert(`Erro: ${json.code || 'Erro ao salvar'}`);
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  async function triggerScan() {
    const secret = prompt('Informe o ALERTS_SCAN_SECRET:');
    if (!secret) return;

    try {
      const res = await fetch('/api/alerts/scan', {
        method: 'POST',
        headers: { 'x-alerts-secret': secret },
      });
      const json = await res.json();
      if (json.ok) {
        alert(`Scan executado! ${json.created} ocorrências criadas.`);
        loadOccurrences();
      } else {
        alert('Erro ao executar scan');
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  async function triggerNotify() {
    const secret = prompt('Informe o ALERTS_SCAN_SECRET:');
    if (!secret) return;

    try {
      const res = await fetch('/api/alerts/notify', {
        method: 'POST',
        headers: { 'x-alerts-secret': secret },
      });
      const json = await res.json();
      if (json.ok) {
        alert(`Notificações enviadas! ${json.sent} alertas enviados.`);
        loadOccurrences();
      } else {
        alert('Erro ao enviar notificações');
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">🔔 Alertas & Watchers</h1>
            <p className="text-sm text-muted-foreground">
              Regras de alerta, notificações e digests
            </p>
          </div>
          <Link href="/" className="text-sm underline">
            ← Dashboard
          </Link>
        </div>

        <div className="border rounded-lg p-4 bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="border rounded px-3 py-2 hover:bg-muted"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancelar' : '+ Criar Regra'}
            </button>
            <button className="border rounded px-3 py-2 hover:bg-muted" onClick={triggerScan}>
              🔍 Disparar Scan
            </button>
            <button className="border rounded px-3 py-2 hover:bg-muted" onClick={triggerNotify}>
              📤 Enviar Notificações
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-background">
            <h3 className="font-medium">Nova Regra de Alerta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Evento</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.event}
                  onChange={(e) => setFormData({ ...formData, event: e.target.value as any })}
                >
                  <option value="delivery_error">Erro de Entrega</option>
                  <option value="sdr_reply">Resposta SDR</option>
                  <option value="tech_detected">Tecnologia Detectada</option>
                  <option value="company_status_change">Mudança de Status</option>
                  <option value="news_spike">Pico de Notícias</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Company ID (opcional)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="UUID ou vazio para global"
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail para Notificação</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={formData.emailTo}
                  onChange={(e) => setFormData({ ...formData, emailTo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Condições (JSON)</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="{}"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
              Salvar Regra
            </button>
          </form>
        )}

        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h3 className="font-medium">Regras de Alerta ({rules.length})</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma regra criada ainda. Clique em "Criar Regra" para começar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Evento</th>
                    <th className="text-left p-3">Company</th>
                    <th className="text-left p-3">Canais</th>
                    <th className="text-center p-3">Status</th>
                    <th className="text-left p-3">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-1 rounded bg-muted">{r.event}</span>
                      </td>
                      <td className="p-3 text-xs">{r.company_id || 'Global'}</td>
                      <td className="p-3">
                        {r.channels.map((ch, i) => (
                          <span key={i} className="text-xs mr-2">
                            {ch.type}: {ch.to}
                          </span>
                        ))}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            r.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <h3 className="font-medium mb-2">📝 Como Usar</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>Criar Regra:</strong> Define evento, canais de notificação e condições
            </li>
            <li>
              <strong>Disparar Scan:</strong> Executa manualmente todas as regras ativas
            </li>
            <li>
              <strong>Enviar Notificações:</strong> Envia alertas não notificados por e-mail
            </li>
            <li>
              <strong>Automação:</strong> Configure cron no Supabase para scan/notify a cada 5-15
              min
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

