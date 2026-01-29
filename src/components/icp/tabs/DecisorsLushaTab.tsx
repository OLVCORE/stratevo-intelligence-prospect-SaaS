/**
 * Aba exclusiva Lusha: contatos com email/telefone (enriquecidos com Lusha quando disponível).
 */
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface DecisorsLushaTabProps {
  companyId?: string;
  savedData?: any;
  onDataChange?: (data: any) => void;
}

/** Carrega decisores que têm email ou telefone (Lusha complementa após Apollo). */
async function loadLushaContacts(companyId: string) {
  const { data: rows } = await supabase
    .from('decision_makers')
    .select('*')
    .eq('company_id', companyId);

  const withContact = (rows || []).filter(
    (d: any) => (d.email != null && d.email !== '') || (d.phone != null && d.phone !== '') || (d.mobile_phone != null && d.mobile_phone !== '')
  );

  return withContact.map((d: any) => ({
    id: d.id,
    name: d.name || '',
    title: d.title || '',
    email: d.email,
    phone: d.phone || d.mobile_phone,
    linkedin_url: d.linkedin_url,
    company_name: d.company_name,
    enriched_with: 'lusha',
  }));
}

export function DecisorsLushaTab({ companyId, savedData, onDataChange }: DecisorsLushaTabProps) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const result = await loadLushaContacts(companyId);
      setList(result);
      onDataChange?.({ ...savedData, lusha: { decisors: result } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  const handleRefresh = async () => {
    if (!companyId) return;
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.success('Contatos com email/telefone recarregados');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">L</span>
            <div>
              <h4 className="font-semibold">Decisores Lusha</h4>
              <p className="text-xs text-muted-foreground">Contatos com email ou telefone (Lusha complementa após Apollo)</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </Card>

      {loading && (
        <Card className="p-6 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Carregando contatos com email/telefone...</p>
        </Card>
      )}

      {!loading && list.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum contato com email/telefone ainda.</p>
          <p className="text-sm mt-1">Use o botão &quot;Extrair decisores (domínio + localização)&quot; no topo da aba Decisores: Apollo traz as pessoas e Lusha complementa os contatos automaticamente.</p>
        </Card>
      )}

      {!loading && list.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{list.length} contato(s) com email ou telefone</span>
          </div>
          <div className="grid gap-2">
            {list.map((d: any) => (
              <Card key={d.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    {d.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {d.email}</span>}
                    {d.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {d.phone}</span>}
                  </p>
                </div>
                {d.linkedin_url && (
                  <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-sm shrink-0">
                    LinkedIn
                  </a>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
