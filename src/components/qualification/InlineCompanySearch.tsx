import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Loader2, Building2, CheckCircle2, MapPin, 
  Briefcase, DollarSign, Calendar, AlertTriangle, Plus, X,
  FileText, Scale, Users, Globe, CheckCircle, XCircle, BarChart
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { createQualificationEngine, CompanyToQualify } from '@/services/icpQualificationEngine';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LocationMap from '@/components/map/LocationMap';

interface InlineCompanySearchProps {
  onCompanyAdded?: () => void;
}

export function InlineCompanySearch({ onCompanyAdded }: InlineCompanySearchProps) {
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const tenantId = tenant?.id;
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

        // Verificar se já existe em companies
        const { data: existing } = await supabase
          .from('companies')
          .select('id, company_name')
          .eq('cnpj', cleanCnpj)
          .maybeSingle();

        if (existing) {
          toast.info(`Empresa já existe: ${existing.company_name}`);
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

  // Salvar empresa na tabela companies com qualificação REAL baseada no ICP
  const handleSaveToQualification = async () => {
    if (!previewData) return;

    setIsSaving(true);
    try {
      // ✅ Verificar se já existe em qualified_prospects (não em companies)
      const normalizedCnpj = previewData.cnpj.replace(/\D/g, '');
      const { data: existing } = await ((supabase as any).from('qualified_prospects'))
        .select('id, razao_social')
        .eq('cnpj', normalizedCnpj)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existing) {
        toast.info(`Empresa já está no estoque qualificado: ${existing.razao_social}`);
        setShowPreview(false);
        setPreviewData(null);
        setSearchQuery('');
        // ✅ Navegar para o estoque mesmo assim
        navigate('/leads/qualified-stock');
        return;
      }

      // ========== QUALIFICAÇÃO REAL BASEADA NO ICP ==========
      let icpScore = 0;
      let temperatura: 'hot' | 'warm' | 'cold' | 'out' = 'out';
      let decision = 'discard';
      let decisionReason = 'Não encontrou ICPs configurados';
      let bestIcpId = null;
      let bestIcpName = null;
      let qualificationBreakdown = null;
      let fitScore = 0;
      let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'D';

      if (tenantId) {
        try {
          // Criar motor de qualificação
          const engine = await createQualificationEngine(tenantId);
          
          // Preparar dados da empresa para qualificação
          const companyToQualify: CompanyToQualify = {
            cnpj: previewData.cnpj,
            razao_social: previewData.razao_social,
            nome_fantasia: previewData.nome_fantasia,
            cnae_principal: previewData.cnae_principal,
            cnae_principal_descricao: previewData.cnae_descricao,
            capital_social: previewData.capital_social,
            porte: previewData.porte,
            uf: previewData.uf,
            cidade: previewData.municipio,
            situacao_cadastral: previewData.situacao
          };
          
          // Executar qualificação real
          const result = await engine.qualifyCompany(companyToQualify);
          
          icpScore = result.best_icp_score;
          temperatura = result.best_temperatura;
          decision = result.decision;
          decisionReason = result.decision_reason;
          bestIcpName = result.best_icp_name;
          bestIcpId = result.best_icp_id || null;
          
          // Calcular fit_score e grade baseado no icp_score
          fitScore = icpScore; // Usar icp_score como fit_score inicial
          if (fitScore >= 90) grade = 'A+';
          else if (fitScore >= 75) grade = 'A';
          else if (fitScore >= 60) grade = 'B';
          else if (fitScore >= 40) grade = 'C';
          else grade = 'D';
          
          // Guardar breakdown para análise
          if (result.icp_scores && result.icp_scores.length > 0) {
            qualificationBreakdown = {
              best_icp: result.best_icp_name,
              score: result.best_icp_score,
              motivos: result.icp_scores[0]?.motivos || [],
              breakdown: result.icp_scores[0]?.breakdown
            };
          }
          
          console.log('[InlineSearch] ✅ Qualificação real:', {
            empresa: previewData.razao_social,
            score: icpScore,
            temperatura,
            decision,
            bestIcp: bestIcpName,
            fitScore,
            grade,
            breakdown: qualificationBreakdown
          });
          
        } catch (qualErr) {
          console.warn('[InlineSearch] ⚠️ Erro na qualificação, usando padrão:', qualErr);
          // Fallback para score básico se qualificação falhar
          icpScore = 30;
          fitScore = 30;
          grade = 'D';
          temperatura = 'cold';
          decision = 'quarantine';
          decisionReason = 'Erro na qualificação - enviado para análise manual';
        }
      } else {
        // Sem tenant, usar score neutro
        icpScore = 30;
        fitScore = 30;
        grade = 'D';
        temperatura = 'cold';
        decision = 'quarantine';
        decisionReason = 'Tenant não identificado';
      }

      // ✅ SALVAR EM qualified_prospects (não em companies) - Fluxo correto
      const { error } = await ((supabase as any).from('qualified_prospects'))
        .insert({
          tenant_id: tenantId,
          cnpj: normalizedCnpj,
          razao_social: previewData.razao_social || 'Empresa Sem Nome',
          nome_fantasia: previewData.nome_fantasia,
          cidade: previewData.municipio,
          estado: previewData.uf,
          cep: previewData.cep,
          setor: previewData.cnae_descricao,
          cnae_principal: previewData.cnae_principal,
          cnae_descricao: previewData.cnae_descricao,
          situacao_cnpj: previewData.situacao,
          porte: previewData.porte,
          capital_social: previewData.capital_social ? parseFloat(String(previewData.capital_social).replace(/[^\d,.-]/g, '').replace(',', '.')) : null,
          website: previewData.website,
          data_abertura: previewData.data_abertura,
          // ✅ Dados de qualificação (campos obrigatórios)
          icp_id: bestIcpId,
          fit_score: fitScore,
          grade: grade,
          pipeline_status: 'new', // ✅ Status 'new' para aparecer no estoque
          source_name: 'Motor de Qualificação - Busca Individual',
          // ✅ Salvar breakdown e dados adicionais em raw_data
          raw_data: {
            ...previewData.raw_data,
            icp_score: icpScore,
            temperatura: temperatura,
            qualification_breakdown: qualificationBreakdown,
            qualification_source: 'inline_search',
            qualified_at: new Date().toISOString(),
            decision: decision,
            decision_reason: decisionReason,
            best_icp_name: bestIcpName,
          }
        });

      if (error) throw error;

      // Toast com resultado real da qualificação
      const tempEmoji = temperatura === 'hot' ? '🔥' : temperatura === 'warm' ? '🌡️' : '❄️';
      
      toast.success('✅ Empresa adicionada ao Estoque Qualificado!', {
        description: `${tempEmoji} ${temperatura.toUpperCase()} | Fit Score: ${fitScore}% | Grade: ${grade}${bestIcpName ? ` | ICP: ${bestIcpName}` : ''}`,
        action: {
          label: 'Ver Estoque',
          onClick: () => navigate('/leads/qualified-stock')
        }
      });
      
      // Mostrar motivos se for COLD ou OUT
      if (temperatura === 'cold' || temperatura === 'out') {
        toast.info(`📋 Motivo: ${decisionReason}`, { duration: 5000 });
      }

      setShowPreview(false);
      setPreviewData(null);
      setSearchQuery('');
      
      // ✅ NAVEGAR PARA ESTOQUE DE EMPRESAS QUALIFICADAS (fluxo correto)
      navigate('/leads/qualified-stock');
      onCompanyAdded?.();

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Empresa já existe no estoque qualificado', {
          action: {
            label: 'Ver Estoque',
            onClick: () => navigate('/leads/qualified-stock')
          }
        });
      } else {
        toast.error('Erro ao adicionar empresa ao estoque', {
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

      {/* Preview Dialog COMPLETO - Idêntico à SearchPage */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Preview Completo dos Dados
              {/* Badge de Status do CNPJ */}
              {previewData?.situacao?.toUpperCase().includes('ATIVA') && (
                <Badge className="ml-2 bg-green-500 hover:bg-green-600 text-white border-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  CNPJ ATIVO
                </Badge>
              )}
              {previewData?.situacao && !previewData?.situacao?.toUpperCase().includes('ATIVA') && (
                <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  CNPJ INATIVO
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Revise as informações completas antes de confirmar o cadastro no funil de vendas
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-6">
              {/* Header com dados principais */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{previewData.razao_social}</CardTitle>
                      {previewData.nome_fantasia && previewData.nome_fantasia !== previewData.razao_social && (
                        <p className="text-sm text-muted-foreground">Nome Fantasia: {previewData.nome_fantasia}</p>
                      )}
                    </div>
                  </div>
                  <CardDescription className="space-y-1 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">CNPJ:</span>
                      <span className="text-sm font-mono font-semibold">
                        {previewData.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Grid com 3 colunas */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Coluna 1 - Dados Cadastrais */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Dados Cadastrais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.porte && (
                        <div>
                          <span className="text-muted-foreground">Porte:</span>
                          <p className="font-medium">{previewData.porte}</p>
                        </div>
                      )}
                      {previewData.raw_data?.tipo && (
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium">{previewData.raw_data.tipo}</p>
                        </div>
                      )}
                      {previewData.data_abertura && (
                        <div>
                          <span className="text-muted-foreground">Abertura:</span>
                          <p className="font-medium">{previewData.data_abertura}</p>
                        </div>
                      )}
                      {previewData.raw_data?.natureza_juridica && (
                        <div>
                          <span className="text-muted-foreground">Natureza Jurídica:</span>
                          <p className="font-medium text-[10px]">{previewData.raw_data.natureza_juridica}</p>
                        </div>
                      )}
                      {previewData.capital_social && (
                        <div>
                          <span className="text-muted-foreground">Capital Social:</span>
                          <p className="font-medium text-green-600">
                            R$ {Number(previewData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Situação Cadastral */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Situação Cadastral</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.situacao && (
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge 
                            className={`ml-2 ${
                              previewData.situacao.toUpperCase().includes('ATIVA')
                                ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' 
                                : 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                            }`}
                          >
                            {previewData.situacao}
                          </Badge>
                        </div>
                      )}
                      {previewData.raw_data?.data_situacao && (
                        <div>
                          <span className="text-muted-foreground">Data:</span>
                          <p className="font-medium">{previewData.raw_data.data_situacao}</p>
                        </div>
                      )}
                      {previewData.raw_data?.motivo_situacao && (
                        <div>
                          <span className="text-muted-foreground">Motivo:</span>
                          <p className="font-medium text-[10px]">{previewData.raw_data.motivo_situacao}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Regimes Especiais */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Regimes Especiais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.raw_data?.simples !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Simples Nacional:</span>
                          <Badge variant={previewData.raw_data?.simples?.optante || previewData.raw_data?.opcao_pelo_simples ? 'default' : 'secondary'} className="ml-2 text-[10px]">
                            {previewData.raw_data?.simples?.optante || previewData.raw_data?.opcao_pelo_simples ? 'Optante' : 'Não Optante'}
                          </Badge>
                        </div>
                      )}
                      {previewData.raw_data?.simei !== undefined && (
                        <div>
                          <span className="text-muted-foreground">MEI (Simei):</span>
                          <Badge variant={previewData.raw_data?.simei?.optante || previewData.raw_data?.opcao_pelo_mei ? 'default' : 'secondary'} className="ml-2 text-[10px]">
                            {previewData.raw_data?.simei?.optante || previewData.raw_data?.opcao_pelo_mei ? 'Optante' : 'Não Optante'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna 2 - Localização e Mapa */}
                <div className="space-y-4">
                  {/* Localização + Mapa */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        Localização
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs space-y-1">
                        {previewData.raw_data?.logradouro && (
                          <p>{previewData.raw_data.logradouro}, {previewData.raw_data.numero || 'S/N'}</p>
                        )}
                        {previewData.raw_data?.complemento && (
                          <p className="text-muted-foreground">{previewData.raw_data.complemento}</p>
                        )}
                        {previewData.raw_data?.bairro && <p>{previewData.raw_data.bairro}</p>}
                        <p className="font-semibold">
                          {previewData.municipio}/{previewData.uf}
                        </p>
                        {previewData.raw_data?.cep && (
                          <p className="text-muted-foreground">CEP: {previewData.raw_data.cep}</p>
                        )}
                      </div>
                      
                      {/* Mapa */}
                      {(previewData.raw_data?.cep || previewData.municipio) && (
                        <div className="h-[180px] rounded-lg overflow-hidden">
                          <LocationMap
                            address={previewData.raw_data?.logradouro}
                            municipio={previewData.municipio}
                            estado={previewData.uf}
                            cep={previewData.raw_data?.cep}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contato */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {previewData.raw_data?.email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-mono text-[10px]">{previewData.raw_data.email}</p>
                        </div>
                      )}
                      {previewData.raw_data?.telefone && (
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <p className="font-medium">{previewData.raw_data.telefone}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* QSA - Quadro de Sócios */}
                  {previewData.raw_data?.qsa && previewData.raw_data.qsa.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          Quadro de Sócios ({previewData.raw_data.qsa.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-[240px] overflow-y-auto">
                          {previewData.raw_data.qsa.map((socio: any, idx: number) => (
                            <div key={idx} className="p-2 rounded border bg-muted/30">
                              <p className="font-medium text-xs">{socio.nome}</p>
                              <Badge variant="outline" className="text-[10px] mt-1">{socio.qual}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Coluna 3 - Atividades e Scores */}
                <div className="space-y-4">
                  {/* Atividade Principal */}
                  {(previewData.raw_data?.atividade_principal || previewData.cnae_descricao) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4" />
                          Atividade Principal
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {previewData.raw_data?.atividade_principal?.map((ativ: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <Badge variant="outline" className="text-[10px] mb-1">{ativ.code}</Badge>
                              <p className="text-[10px] leading-relaxed">{ativ.text}</p>
                            </div>
                          )) || (
                            <div className="text-xs">
                              <Badge variant="outline" className="text-[10px] mb-1">{previewData.cnae_principal}</Badge>
                              <p className="text-[10px] leading-relaxed">{previewData.cnae_descricao}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Atividades Secundárias */}
                  {previewData.raw_data?.atividades_secundarias && previewData.raw_data.atividades_secundarias.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          Atividades Secundárias ({previewData.raw_data.atividades_secundarias.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-[180px] overflow-y-auto text-[10px]">
                          {previewData.raw_data.atividades_secundarias.slice(0, 5).map((ativ: any, idx: number) => (
                            <div key={idx} className="pb-1 border-b last:border-0">
                              <Badge variant="secondary" className="text-[9px]">{ativ.code}</Badge>
                              <p className="mt-0.5 leading-tight">{ativ.text}</p>
                            </div>
                          ))}
                          {previewData.raw_data.atividades_secundarias.length > 5 && (
                            <p className="text-muted-foreground text-center py-1">
                              +{previewData.raw_data.atividades_secundarias.length - 5} atividades adicionais
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Score Financeiro */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4" />
                        Score Financeiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Classificação</span>
                        <Badge variant="default" className="bg-gray-500">N/A</Badge>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span>Score de Crédito</span>
                          <span className="font-bold text-muted-foreground">N/A</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risco Preditivo</span>
                          <span className="font-medium text-muted-foreground">N/A/100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Jurídico */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Scale className="h-4 w-4" />
                        Score Jurídico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Nível de Risco</span>
                        <Badge className="bg-gray-500">N/A</Badge>
                      </div>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span>Processos Ativos</span>
                          <span className="font-bold text-muted-foreground">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de Processos</span>
                          <span className="font-medium text-muted-foreground">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Saúde Jurídica</span>
                          <span className="font-bold text-muted-foreground">0/100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Aviso se não ativa */}
              {previewData.situacao && !previewData.situacao.toUpperCase().includes('ATIVA') && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Atenção: CNPJ não está ATIVO</p>
                    <p className="text-sm">A empresa pode ter restrições ou estar inativa. Considere antes de adicionar.</p>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveToQualification} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Qualificando e Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar e Salvar no Funil
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(false)} disabled={isSaving}>
                  Cancelar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                💡 Esta busca será registrada no histórico mesmo que você não salve a empresa no funil de vendas
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

