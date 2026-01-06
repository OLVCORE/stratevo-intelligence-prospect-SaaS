// src/components/icp/LinkedInLeadCollector.tsx
// Coletor de Leads via URL do LinkedIn - Estilo Summitfy

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Download, Loader2, ExternalLink, CheckCircle2, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface LinkedInLeadCollectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  onLeadsCollected?: (count: number) => void;
}

// ✅ NOVO: Interface para origem de leads
interface LeadSource {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

const MAX_URL_LEADS = 50; // Máximo 50 leads por URL (conforme solicitado)

export function LinkedInLeadCollector({
  open,
  onOpenChange,
  companyId,
  onLeadsCollected
}: LinkedInLeadCollectorProps) {
  const { tenant } = useTenant();
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [numberOfLeads, setNumberOfLeads] = useState<number>(25);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedLeads, setCollectedLeads] = useState<any[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [existingSources, setExistingSources] = useState<LeadSource[]>([]);
  const [showCreateSource, setShowCreateSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceDescription, setNewSourceDescription] = useState('');

  // Carregar origens existentes
  useEffect(() => {
    if (open) {
      loadExistingSources();
    }
  }, [open, tenant]);

  const loadExistingSources = async () => {
    try {
      // Buscar origens únicas da tabela decision_makers
      const { data, error } = await supabase
        .from('decision_makers')
        .select('source_name')
        .not('source_name', 'is', null)
        .neq('source_name', '');

      if (error) throw error;

      // Extrair origens únicas
      const uniqueSources = Array.from(new Set(data?.map(d => d.source_name).filter(Boolean) || []));
      setExistingSources(uniqueSources.map((name, idx) => ({
        id: `source-${idx}`,
        name: name as string,
        created_at: new Date().toISOString()
      })));
    } catch (error) {
      console.error('[LINKEDIN-COLLECTOR] Erro ao carregar origens:', error);
    }
  };

  const handleCreateSource = async () => {
    if (!newSourceName.trim()) {
      toast.error('Nome da origem é obrigatório');
      return;
    }

    setSourceName(newSourceName);
    setShowCreateSource(false);
    setNewSourceName('');
    setNewSourceDescription('');
    toast.success(`Origem "${newSourceName}" será usada para esta coleta`);
  };

  const validateLinkedInUrl = (url: string): boolean => {
    const linkedInSearchPattern = /^https?:\/\/(www\.)?linkedin\.com\/search\/results\/people\/.*/i;
    return linkedInSearchPattern.test(url);
  };

  const handleCollectLeads = async () => {
    // Validações
    if (!linkedInUrl.trim()) {
      toast.error('URL do LinkedIn é obrigatória');
      return;
    }

    if (!validateLinkedInUrl(linkedInUrl)) {
      toast.error('URL inválida! Use uma URL de busca do LinkedIn.', {
        description: 'Exemplo: https://www.linkedin.com/search/results/people/?keywords=...'
      });
      return;
    }

    if (numberOfLeads < 1 || numberOfLeads > MAX_URL_LEADS) {
      toast.error(`Número de leads deve estar entre 1 e ${MAX_URL_LEADS}`);
      return;
    }

    setIsCollecting(true);

    try {
      // ✅ Determinar nome da origem
      const finalSourceName = sourceName || `LinkedIn - Coleta Manual - ${new Date().toLocaleDateString('pt-BR')}`;
      
      // Chamar Edge Function para coletar leads
      const { data, error } = await supabase.functions.invoke('collect-linkedin-leads', {
        body: {
          linkedin_search_url: linkedInUrl,
          max_leads: numberOfLeads,
          company_id: companyId,
          source_name: finalSourceName, // ✅ Passar nome da origem
          tenant_id: tenant?.id // ✅ Passar tenant_id
        }
      });

      if (error) throw error;

      const leads = data?.leads || [];
      setCollectedLeads(leads);

      // ✅ Salvar leads no banco com origem nomeada e TODOS os campos
      if (leads.length > 0) {
        const finalSourceName = sourceName || `LinkedIn - Coleta Manual - ${new Date().toLocaleDateString('pt-BR')}`;
        
        // Converter leads para formato decision_makers com TODOS os campos do template
        const decisionMakersToInsert = leads.map((lead: any) => ({
          // Identificação
          name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          first_name: lead.first_name,
          last_name: lead.last_name,
          
          // Cargo e Empresa
          title: lead.title || lead.headline || lead.position,
          headline: lead.headline,
          company_name: lead.company || lead.currentCompany || lead.organization_name,
          
          // Contato
          linkedin_url: lead.linkedin_url || lead.profileUrl,
          email: lead.email || null,
          phone: lead.phone || null,
          location: lead.location || lead.city || null,
          
          // Origem e Metadata
          source_name: finalSourceName, // ✅ NOME DA ORIGEM
          raw_linkedin_data: lead,
          
          // Se tiver company_id, associar
          ...(companyId && { company_id: companyId })
        }));

        // Inserir em lote
        const { error: insertError } = await supabase
          .from('decision_makers')
          .upsert(decisionMakersToInsert, {
            onConflict: 'linkedin_url',
            ignoreDuplicates: false
          });

        if (insertError) {
          console.error('[LINKEDIN-COLLECTOR] Erro ao salvar leads:', insertError);
          toast.warning('Leads coletados, mas houve erro ao salvar alguns', {
            description: insertError.message
          });
        } else {
          toast.success(`${leads.length} leads salvos com origem "${finalSourceName}"!`, {
            description: 'Os leads aparecerão na tabela de Decisores com esta origem.'
          });
        }
      }

      // Toast já foi exibido no bloco de salvamento acima

      onLeadsCollected?.(leads.length);

      // Limpar formulário após sucesso
      setTimeout(() => {
        setLinkedInUrl('');
        setNumberOfLeads(25);
        setCollectedLeads([]);
        onOpenChange(false);
      }, 2000);

    } catch (error: any) {
      console.error('[LINKEDIN-COLLECTOR] Erro:', error);
      toast.error('Erro ao coletar leads', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Coletar Leads do LinkedIn
          </DialogTitle>
          <DialogDescription>
            Extrair leads dos resultados de pesquisa do LinkedIn e construir sua base de prospects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ✅ NOVO: Nome da Origem */}
          <div className="space-y-2">
            <Label htmlFor="source-name">Nome da Origem dos Leads *</Label>
            <div className="flex gap-2">
              <Select value={selectedSourceId} onValueChange={(value) => {
                if (value === 'new') {
                  setShowCreateSource(true);
                } else {
                  setSelectedSourceId(value);
                  const source = existingSources.find(s => s.id === value);
                  if (source) setSourceName(source.name);
                }
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione ou crie uma origem" />
                </SelectTrigger>
                <SelectContent>
                  {existingSources.map(source => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Criar Nova Origem
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Formulário para criar nova origem */}
            {showCreateSource && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border space-y-2">
                <Input
                  placeholder="Nome da origem (ex: LinkedIn - Recrutadores SP)"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                />
                <Input
                  placeholder="Descrição (opcional)"
                  value={newSourceDescription}
                  onChange={(e) => setNewSourceDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateSource} disabled={!newSourceName.trim()}>
                    Criar Origem
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowCreateSource(false);
                    setNewSourceName('');
                    setNewSourceDescription('');
                  }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            
            {sourceName && !showCreateSource && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <Building2 className="w-3 h-3 mr-1" />
                Origem: {sourceName}
              </Badge>
            )}
            
            <p className="text-xs text-muted-foreground">
              💡 Dica: Dê um nome descritivo para identificar esta coleta (ex: "LinkedIn - Recrutadores SP - Jan/2025")
            </p>
          </div>

          {/* URL de Pesquisa */}
          <div className="space-y-2">
            <Label htmlFor="linkedin-url">URL de Pesquisa do LinkedIn *</Label>
            <Input
              id="linkedin-url"
              placeholder="Copie e cole a URL de pesquisa do LinkedIn do seu navegador. Ex: https://www.linkedin.com/search/results/people/?keywords=recrutadores"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              disabled={isCollecting}
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Faça uma busca no LinkedIn, copie a URL completa da página de resultados
            </p>
          </div>

          {/* Número de Leads */}
          <div className="space-y-2">
            <Label htmlFor="number-of-leads">Quantos leads coletar? *</Label>
            <Input
              id="number-of-leads"
              type="number"
              min={1}
              max={MAX_URL_LEADS}
              value={numberOfLeads}
              onChange={(e) => setNumberOfLeads(Math.min(MAX_URL_LEADS, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={isCollecting}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mínimo: 1 | Máximo: {MAX_URL_LEADS}</span>
              <Badge variant="outline">{numberOfLeads} leads</Badge>
            </div>
          </div>

          {/* Aviso de Limite */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Limite de Segurança
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Para evitar bloqueio do LinkedIn, recomendamos coletar no máximo {MAX_URL_LEADS} leads por URL e fazer pausas entre coletas.
                </p>
              </div>
            </div>
          </div>

          {/* Resultado da Coleta */}
          {collectedLeads.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {collectedLeads.length} leads coletados com sucesso!
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCollecting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCollectLeads}
            disabled={isCollecting || !linkedInUrl.trim() || numberOfLeads < 1 || (!sourceName.trim() && !selectedSourceId)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCollecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Coletando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Iniciar Coleta de Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

