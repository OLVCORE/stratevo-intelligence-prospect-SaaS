/**
 * Aba exclusiva LinkedIn: decisores/contatos com raw_linkedin_data (PhantomBuster / Coletor LinkedIn).
 */
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Mail, Phone, Linkedin, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LinkedInLeadCollector } from '@/components/icp/LinkedInLeadCollector';

export interface DecisorsLinkedInTabProps {
  companyId?: string;
  companyName?: string;
  savedData?: any;
  onDataChange?: (data: any) => void;
}

async function loadLinkedInDecisors(companyId: string) {
  const { data: rows } = await supabase
    .from('decision_makers')
    .select('*')
    .eq('company_id', companyId);

  const linkedInOnly = (rows || []).filter((d: any) => d.raw_linkedin_data != null);
  return linkedInOnly.map((d: any) => {
    const raw = d.raw_linkedin_data || {};
    return {
      id: d.id,
      name: d.name || '',
      title: d.title || raw.title || raw.headline || '',
      email: d.email,
      phone: d.phone,
      linkedin_url: d.linkedin_url || raw.linkedin_url || raw.profileUrl,
      location: d.city || d.state || raw.location,
      source_name: (d as any).source_name,
      enriched_with: 'linkedin',
    };
  });
}

export function DecisorsLinkedInTab({ companyId, companyName, savedData, onDataChange }: DecisorsLinkedInTabProps) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collectorOpen, setCollectorOpen] = useState(false);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const result = await loadLinkedInDecisors(companyId);
      setList(result);
      onDataChange?.({ ...savedData, linkedin: { decisors: result } });
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
    toast.success('Dados LinkedIn recarregados');
  };

  const handleLeadsCollected = (count: number) => {
    toast.success(`${count} leads salvos do LinkedIn`);
    setCollectorOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-[#0A66C2]/5 border-[#0A66C2]/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#0A66C2]/20 text-[#0A66C2] font-semibold">in</span>
            <div>
              <h4 className="font-semibold">Decisores LinkedIn</h4>
              <p className="text-xs text-muted-foreground">Contatos extraídos via pesquisa LinkedIn / PhantomBuster</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
            <Button onClick={() => setCollectorOpen(true)} className="gap-2">
              <Download className="h-4 w-4" />
              Coletar do LinkedIn
            </Button>
          </div>
        </div>
      </Card>

      <LinkedInLeadCollector
        open={collectorOpen}
        onOpenChange={setCollectorOpen}
        companyId={companyId}
        onLeadsCollected={handleLeadsCollected}
      />

      {loading && (
        <Card className="p-6 text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin text-[#0A66C2]" />
          <p className="text-sm text-muted-foreground">Carregando decisores LinkedIn...</p>
        </Card>
      )}

      {!loading && list.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Linkedin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum contato do LinkedIn ainda.</p>
          <p className="text-sm mt-1">Use &quot;Coletar do LinkedIn&quot; para extrair leads de uma pesquisa do LinkedIn.</p>
        </Card>
      )}

      {!loading && list.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{list.length} contato(s) LinkedIn</span>
          </div>
          <div className="grid gap-2">
            {list.map((d: any) => (
              <Card key={d.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{d.title}</p>
                  {(d.email || d.phone) && (
                    <p className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                      {d.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {d.email}</span>}
                      {d.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {d.phone}</span>}
                    </p>
                  )}
                  {d.source_name && <Badge variant="outline" className="mt-1 text-xs">{d.source_name}</Badge>}
                </div>
                {d.linkedin_url && (
                  <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline flex items-center gap-1 text-sm shrink-0">
                    <Linkedin className="h-4 w-4" /> Perfil
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
