// src/components/icp/LinkedInLeadCollector.tsx
// Coletor de Leads via URL do LinkedIn - Estilo Summitfy

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInLeadCollectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  onLeadsCollected?: (count: number) => void;
}

const MAX_URL_LEADS = 50; // Máximo 50 leads por URL (conforme solicitado)

export function LinkedInLeadCollector({
  open,
  onOpenChange,
  companyId,
  onLeadsCollected
}: LinkedInLeadCollectorProps) {
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [numberOfLeads, setNumberOfLeads] = useState<number>(25);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedLeads, setCollectedLeads] = useState<any[]>([]);

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
      // Chamar Edge Function para coletar leads
      const { data, error } = await supabase.functions.invoke('collect-linkedin-leads', {
        body: {
          linkedin_search_url: linkedInUrl,
          max_leads: numberOfLeads,
          company_id: companyId
        }
      });

      if (error) throw error;

      const leads = data?.leads || [];
      setCollectedLeads(leads);

      // Salvar leads no banco
      if (leads.length > 0 && companyId) {
        // Converter leads para formato decision_makers
        const decisionMakersToInsert = leads.map((lead: any) => ({
          company_id: companyId,
          name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          first_name: lead.first_name,
          last_name: lead.last_name,
          title: lead.title || lead.headline,
          linkedin_url: lead.linkedin_url,
          headline: lead.headline,
          location: lead.location,
          raw_linkedin_data: lead
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
        }
      }

      toast.success(`${leads.length} leads coletados com sucesso!`, {
        description: 'Os leads foram adicionados à sua base de decisores.'
      });

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
            disabled={isCollecting || !linkedInUrl.trim() || numberOfLeads < 1}
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

