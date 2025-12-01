import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Loader2, Building2, CheckCircle2, MapPin, 
  Briefcase, DollarSign, Calendar, AlertTriangle, Plus, X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InlineCompanySearchProps {
  onCompanyAdded?: () => void;
}

export function InlineCompanySearch({ onCompanyAdded }: InlineCompanySearchProps) {
  const { tenantId } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detectar se é CNPJ ou nome
  const detectSearchType = (query: string): 'cnpj' | 'name' => {
    const cleaned = query.replace(/\D/g, '');
    return cleaned.length >= 11 ? 'cnpj' : 'name';
  };

  // Buscar empresa
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Digite um CNPJ ou nome para buscar');
      return;
    }

    const searchType = detectSearchType(searchQuery);
    setIsSearching(true);
    setPreviewData(null);

    try {
      if (searchType === 'cnpj') {
        // Busca por CNPJ na Receita Federal
        const cleanCnpj = searchQuery.replace(/\D/g, '');
        
        if (cleanCnpj.length !== 14) {
          toast.error('CNPJ inválido. Deve ter 14 dígitos.');
          return;
        }

        // Verificar se já existe
        const { data: existing } = await supabase
          .from('leads_quarantine')
          .select('id, name')
          .eq('cnpj', cleanCnpj)
          .maybeSingle();

        if (existing) {
          toast.info(`Empresa já existe: ${existing.name}`);
          return;
        }

        // Consultar Receita Federal via BrasilAPI
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        
        if (!response.ok) {
          // Tentar ReceitaWS como fallback
          const receitawsResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
          if (receitawsResponse.ok) {
            const data = await receitawsResponse.json();
            if (data.status !== 'ERROR') {
              setPreviewData({
                cnpj: cleanCnpj,
                razao_social: data.nome,
                nome_fantasia: data.fantasia,
                situacao: data.situacao,
                uf: data.uf,
                municipio: data.municipio,
                capital_social: data.capital_social,
                porte: data.porte,
                cnae_principal: data.atividade_principal?.[0]?.code,
                cnae_descricao: data.atividade_principal?.[0]?.text,
                data_abertura: data.abertura,
                raw_data: data,
                source: 'receitaws'
              });
              setShowPreview(true);
              return;
            }
          }
          throw new Error('CNPJ não encontrado na Receita Federal');
        }

        const data = await response.json();
        setPreviewData({
          cnpj: cleanCnpj,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          situacao: data.descricao_situacao_cadastral,
          uf: data.uf,
          municipio: data.municipio,
          capital_social: data.capital_social,
          porte: data.porte,
          cnae_principal: data.cnae_fiscal?.toString(),
          cnae_descricao: data.cnae_fiscal_descricao,
          data_abertura: data.data_inicio_atividade,
          raw_data: data,
          source: 'brasilapi'
        });
        setShowPreview(true);

      } else {
        // Busca por nome - mostrar toast informativo
        toast.info('Para busca por nome, use o Upload em Massa com a planilha modelo');
      }
    } catch (error: any) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar empresa', {
        description: error.message || 'Tente novamente'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Salvar empresa na tabela de qualificação
  const handleSaveToQualification = async () => {
    if (!previewData || !tenantId) return;

    setIsSaving(true);
    try {
      // Calcular score ICP básico
      let icpScore = 50; // Base
      
      // Ajustes baseados em dados
      if (previewData.situacao?.toUpperCase().includes('ATIVA')) icpScore += 15;
      if (previewData.capital_social > 100000) icpScore += 10;
      if (previewData.capital_social > 1000000) icpScore += 10;
      if (previewData.porte?.toUpperCase().includes('MEDIO') || previewData.porte?.toUpperCase().includes('GRANDE')) icpScore += 10;
      
      icpScore = Math.min(100, icpScore);

      const temperatura = icpScore >= 70 ? 'hot' : icpScore >= 40 ? 'warm' : 'cold';

      const { error } = await supabase
        .from('leads_quarantine')
        .insert({
          tenant_id: tenantId,
          cnpj: previewData.cnpj,
          name: previewData.razao_social,
          razao_social: previewData.razao_social,
          nome_fantasia: previewData.nome_fantasia,
          uf: previewData.uf,
          municipio: previewData.municipio,
          capital_social: previewData.capital_social,
          porte: previewData.porte,
          cnae_principal: previewData.cnae_principal,
          situacao_cadastral: previewData.situacao,
          icp_score: icpScore,
          temperatura: temperatura,
          validation_status: 'pending',
          source_type: 'manual',
          source_name: 'Busca Qualificação',
          raw_data: previewData.raw_data
        });

      if (error) throw error;

      toast.success('✅ Empresa adicionada para qualificação!', {
        description: `Score ICP: ${icpScore} | Temperatura: ${temperatura.toUpperCase()}`
      });

      setShowPreview(false);
      setPreviewData(null);
      setSearchQuery('');
      onCompanyAdded?.();

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Empresa já existe na base');
      } else {
        toast.error('Erro ao adicionar empresa', {
          description: error.message
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Search className="h-4 w-4" />
            Busca Unificada
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Digite CNPJ ou nome da empresa - detecção automática
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="00.000.000/0000-00 ou Nome da Empresa"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Receita Federal
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Score ICP Automático
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Direto p/ Qualificação
            </Badge>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Preview da Empresa
            </DialogTitle>
            <DialogDescription>
              Revise os dados antes de adicionar à qualificação
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              {/* Header com situação */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <h3 className="font-semibold text-lg">{previewData.razao_social}</h3>
                  {previewData.nome_fantasia && (
                    <p className="text-sm text-muted-foreground">{previewData.nome_fantasia}</p>
                  )}
                  <Badge variant="outline" className="mt-1 font-mono">
                    {previewData.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                  </Badge>
                </div>
                <Badge 
                  variant={previewData.situacao?.toUpperCase().includes('ATIVA') ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {previewData.situacao || 'N/A'}
                </Badge>
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="font-medium">{previewData.municipio}/{previewData.uf}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Capital Social</p>
                    <p className="font-medium">
                      {previewData.capital_social 
                        ? `R$ ${Number(previewData.capital_social).toLocaleString('pt-BR')}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Porte</p>
                    <p className="font-medium">{previewData.porte || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Abertura</p>
                    <p className="font-medium">
                      {previewData.data_abertura 
                        ? new Date(previewData.data_abertura).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="col-span-2 flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">CNAE Principal</p>
                    <p className="font-medium text-sm">
                      {previewData.cnae_principal} - {previewData.cnae_descricao || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso se não ativa */}
              {previewData.situacao && !previewData.situacao.toUpperCase().includes('ATIVA') && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Atenção: CNPJ não está ATIVO</p>
                    <p className="text-sm">A empresa pode ter restrições ou estar inativa.</p>
                  </div>
                </div>
              )}

              {/* Fonte */}
              <p className="text-xs text-muted-foreground text-right">
                Fonte: {previewData.source === 'brasilapi' ? 'Brasil API' : 'ReceitaWS'}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveToQualification} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar à Qualificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

