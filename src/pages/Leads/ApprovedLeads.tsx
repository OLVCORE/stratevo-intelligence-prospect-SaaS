import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { TOTVSStatusBadge } from '@/components/totvs/TOTVSStatusBadge';
import { 
  CheckCircle2, 
  Rocket, 
  Search,
  Building2,
  TrendingUp,
  Users,
  Zap,
  Filter,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { DealFormDialog } from '@/components/sdr/DealFormDialog';
import { UnifiedEnrichButton } from '@/components/companies/UnifiedEnrichButton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { enrichment360Simplificado } from '@/services/enrichment360';
import { searchApolloOrganizations, searchApolloPeople } from '@/services/apolloDirect';

interface ApprovedLead {
  id: string;
  company_id: string;
  cnpj: string;
  razao_social: string;
  icp_score: number;
  temperatura: 'hot' | 'warm' | 'cold';
  segmento?: string;
  status: string;
  created_at: string;
  [key: string]: any; // Para propriedades dinâmicas (source_name, raw_data, etc.)
}

export default function ApprovedLeads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [leads, setLeads] = useState<ApprovedLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<ApprovedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<ApprovedLead | null>(null);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [uniqueSources, setUniqueSources] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(50); // 🔢 Paginação configurável
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Para UnifiedEnrichButton
  const [apolloSearchQuery, setApolloSearchQuery] = useState<string>(''); // Busca Apollo
  
  // 🔍 FILTROS INTELIGENTES POR COLUNA
  const [filterCNPJStatus, setFilterCNPJStatus] = useState<string[]>([]);
  const [filterSector, setFilterSector] = useState<string[]>([]);
  const [filterUF, setFilterUF] = useState<string[]>([]);
  const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]);

  useEffect(() => {
    loadApprovedLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, temperatureFilter, sourceFilter, leads, apolloSearchQuery, filterCNPJStatus, filterSector, filterUF, filterAnalysisStatus]);

  useEffect(() => {
    // Extrair origens únicas dos leads
    const sources = Array.from(new Set(leads.map(l => (l as any).source_name).filter(Boolean)));
    setUniqueSources(sources as string[]);
  }, [leads]);

  const loadApprovedLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'aprovado')
        .order('icp_score', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as ApprovedLead[]);
    } catch (error) {
      console.error('Error loading approved leads:', error);
      toast.error('Erro ao carregar leads aprovados');
    } finally {
      setLoading(false);
    }
  };

  // Handlers de enriquecimento (similar à Quarentena)
  const enrichReceitaMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis?.cnpj) throw new Error('CNPJ não disponível');

      const result = await consultarReceitaFederal(analysis.cnpj);
      if (!result.success || !result.data) throw new Error(result.error || 'Erro ao buscar Receita');

      const rawData = ((analysis as any).raw_data && typeof (analysis as any).raw_data === 'object' && !Array.isArray((analysis as any).raw_data)) 
        ? (analysis as any).raw_data as Record<string, any>
        : {};

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_data: {
            ...rawData,
            receita_federal: result.data as any, // Type assertion para Json
            receita_source: result.source,
          } as any,
        })
        .eq('id', analysisId);

      return result;
    },
    onSuccess: () => {
      toast.success('✅ Receita Federal atualizada!');
      loadApprovedLeads();
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer Receita Federal', { description: error.message });
    },
  });

  const enrich360Mutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');

      const rawData = ((analysis as any).raw_data && typeof (analysis as any).raw_data === 'object' && !Array.isArray((analysis as any).raw_data)) 
        ? (analysis as any).raw_data as Record<string, any>
        : {};

      const result = await enrichment360Simplificado({
        razao_social: analysis.razao_social,
        website: (analysis as any).website,
        domain: (analysis as any).domain,
        uf: (analysis as any).uf,
        porte: (analysis as any).porte,
        cnae: (analysis as any).cnae_principal,
        raw_data: rawData,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao calcular 360°');

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_data: {
            ...rawData,
            enrichment_360: {
              scores: result.scores,
              analysis: result.analysis,
              calculated_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', analysisId);

      return result;
    },
    onSuccess: () => {
      toast.success('✅ Enriquecimento 360° concluído!');
      loadApprovedLeads();
    },
    onError: (error: any) => {
      toast.error('Erro no enriquecimento 360°', { description: error.message });
    },
  });

  const handleEnrichReceita = async (id: string) => {
    await enrichReceitaMutation.mutateAsync(id).catch(() => {});
  };

  const handleEnrich360 = async (id: string) => {
    await enrich360Mutation.mutateAsync(id).catch(() => {});
  };

  // Mutation para enriquecimento Apollo
  const enrichApolloMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');

      const rawData = ((analysis as any).raw_data && typeof (analysis as any).raw_data === 'object' && !Array.isArray((analysis as any).raw_data)) 
        ? (analysis as any).raw_data as Record<string, any>
        : {};

      // Buscar organização Apollo
      const orgResult = await searchApolloOrganizations(
        analysis.razao_social,
        (analysis as any).domain || (analysis as any).website
      );

      if (!orgResult.success || !orgResult.organizations?.[0]) {
        throw new Error('Organização não encontrada no Apollo');
      }

      const org = orgResult.organizations[0];

      // Buscar pessoas da organização
      const peopleResult = await searchApolloPeople(org.id, 50);

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_data: {
            ...rawData,
            apollo_organization: {
              id: org.id,
              name: org.name,
              website: org.website,
              linkedin_url: org.linkedin_url,
              people: peopleResult.people || [],
              enriched_at: new Date().toISOString(),
            },
            apollo_organization_id: org.id,
          },
        })
        .eq('id', analysisId);

      return { org, people: peopleResult.people || [] };
    },
    onSuccess: () => {
      toast.success('✅ Apollo enriquecido com sucesso!');
      loadApprovedLeads();
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer Apollo', { description: error.message });
    },
  });

  // Mutation para enriquecimento completo (Receita + Apollo + 360°)
  const enrichCompletoMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      // 1. Receita Federal
      await handleEnrichReceita(analysisId);
      
      // 2. Apollo (apenas se status GO)
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();
      
      const totvsStatus = (analysis as any)?.totvs_status;
      const isGO = totvsStatus === 'go' || totvsStatus === 'GO';
      
      if (isGO) {
        await enrichApolloMutation.mutateAsync(analysisId).catch(() => {});
      }
      
      // 3. 360°
      await handleEnrich360(analysisId);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('✅ Enriquecimento completo concluído!');
      loadApprovedLeads();
    },
    onError: (error: any) => {
      toast.error('Erro no enriquecimento completo', { description: error.message });
    },
  });

  const handleEnrichApollo = async (id: string) => {
    await enrichApolloMutation.mutateAsync(id).catch(() => {});
  };

  const handleEnrichCompleto = async (id: string) => {
    await enrichCompletoMutation.mutateAsync(id).catch(() => {});
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // 🔍 BUSCA GERAL: nome e CNPJ (PRESERVADA)
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cnpj?.includes(searchTerm)
      );
    }
    
    // 👥 BUSCA APOLLO DECISORES (NOVA - ADICIONAL)
    if (apolloSearchQuery) {
      const query = apolloSearchQuery.toLowerCase();
      
      filtered = filtered.filter(lead => {
        const rawData = (lead as any).raw_data || {};
        
        // Busca em dados Apollo (decisores/colaboradores)
        const apolloData = rawData.apollo_organization || rawData.enrichment_360?.apollo || {};
        const apolloPeople = apolloData.people || [];
        
        return apolloPeople.some((person: any) => {
          return person.name?.toLowerCase().includes(query) ||
            person.title?.toLowerCase().includes(query) ||
            person.email?.toLowerCase().includes(query) ||
            person.departments?.some((dept: string) => dept.toLowerCase().includes(query));
        });
      });
    }

    // Filtro de temperatura (mantido)
    if (temperatureFilter !== 'all') {
      filtered = filtered.filter(lead => lead.temperatura === temperatureFilter);
    }

    // Filtro de origem (mantido)
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => (lead as any).source_name === sourceFilter);
    }

    // 🔍 FILTROS INTELIGENTES ADICIONAIS
    
    // Filtro por Status CNPJ
    if (filterCNPJStatus.length > 0) {
      filtered = filtered.filter(lead => {
        const rawData = (lead as any).raw_data?.receita_federal || (lead as any).raw_data || {};
        let status = 'PENDENTE';
        
        if (rawData.situacao || rawData.status) {
          status = rawData.situacao || rawData.status;
          
          if (status.toUpperCase().includes('ATIVA') || status === '02') status = 'ATIVA';
          else if (status.toUpperCase().includes('SUSPENSA') || status === '03') status = 'SUSPENSA';
          else if (status.toUpperCase().includes('INAPTA') || status === '04') status = 'INAPTA';
          else if (status.toUpperCase().includes('BAIXADA') || status === '08') status = 'BAIXADA';
          else if (status.toUpperCase().includes('NULA') || status === '01') status = 'NULA';
        }
        
        return filterCNPJStatus.includes(status);
      });
    }
    
    // Filtro por Setor
    if (filterSector.length > 0) {
      filtered = filtered.filter(lead => {
        const sector = lead.segmento || (lead as any).raw_data?.setor_amigavel || (lead as any).raw_data?.atividade_economica || 'N/A';
        return filterSector.includes(sector);
      });
    }
    
    // Filtro por UF
    if (filterUF.length > 0) {
      filtered = filtered.filter(lead => {
        const uf = (lead as any).uf || (lead as any).raw_data?.uf || '';
        return filterUF.includes(uf);
      });
    }
    
    // Filtro por Status Análise
    if (filterAnalysisStatus.length > 0) {
      filtered = filtered.filter(lead => {
        const rawData = (lead as any).raw_data || {};
        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj);
        const hasDecisionMakers = ((lead as any).decision_makers_count || 0) > 0;
        const hasDigitalPresence = !!(rawData.digital_intelligence);
        const hasLegalData = !!(rawData.totvs_report);
        
        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
        
        let statusLabel = '0-25%';
        if (percentage > 75) statusLabel = '76-100%';
        else if (percentage > 50) statusLabel = '51-75%';
        else if (percentage > 25) statusLabel = '26-50%';
        
        return filterAnalysisStatus.includes(statusLabel);
      });
    }

    setFilteredLeads(filtered);
  };

  const handleCreateDeal = (lead: ApprovedLead) => {
    setSelectedLead(lead);
    setDealFormOpen(true);
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'bg-red-600';
      case 'warm': return 'bg-yellow-600';
      case 'cold': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  const getTemperatureLabel = (temp: string) => {
    switch (temp) {
      case 'hot': return 'QUENTE';
      case 'warm': return 'MORNO';
      case 'cold': return 'FRIO';
      default: return 'N/A';
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              Leads Aprovados
            </h1>
            <p className="text-muted-foreground mt-2">
              Empresas qualificadas pelo ICP, prontas para criar deals
            </p>
          </div>
          <div className="flex gap-3">
            {/* UnifiedEnrichButton - Visível quando 1 lead selecionado */}
            {selectedIds.length === 1 && (() => {
              const selectedLead = filteredLeads.find(l => selectedIds.includes(l.id));
              if (!selectedLead) return null;
              
              const totvsStatus = (selectedLead as any)?.totvs_status;
              const isGO = totvsStatus === 'go' || totvsStatus === 'GO';
              
              return (
                <UnifiedEnrichButton
                  onQuickRefresh={async () => {
                    const id = selectedIds[0];
                    await handleEnrichReceita(id);
                  }}
                  onFullEnrich={async () => {
                    const id = selectedIds[0];
                    // ✅ FLUXO CORRETO: Sempre enriquecer Receita primeiro (sem verificar GO/NO-GO)
                    // Depois o usuário vai para Relatório STC → Aba TOTVS → Define GO/NO-GO
                    // Só então pode enriquecer Apollo se for GO
                    await handleEnrichReceita(id);
                    toast.info('✅ Receita Federal atualizada! Agora abra o Relatório STC → Aba TOTVS para verificar GO/NO-GO. Se GO, você poderá enriquecer Apollo.');
                  }}
                  onReceita={async () => {
                    const id = selectedIds[0];
                    await handleEnrichReceita(id).catch(() => {});
                  }}
                  onApollo={isGO ? async () => {
                    const id = selectedIds[0];
                    await handleEnrichApollo(id).catch(() => {});
                  } : undefined}
                  on360={async () => {
                    const id = selectedIds[0];
                    await handleEnrich360(id).catch(() => {});
                  }}
                  isProcessing={enrichReceitaMutation.isPending || enrichApolloMutation.isPending || enrich360Mutation.isPending || enrichCompletoMutation.isPending}
                  hasCNPJ={!!selectedLead?.cnpj}
                  hasApolloId={!!((selectedLead as any)?.raw_data?.apollo_organization_id)}
                  variant="default"
                  size="sm"
                />
              );
            })()}
            
            <Button 
              variant="outline"
              onClick={() => navigate('/comando')}
            >
              ← Voltar ao Comando
            </Button>
            <Button 
              onClick={() => navigate('/sdr/workspace')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Ir para Pipeline
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Aprovados</p>
                  <p className="text-2xl font-bold">{leads.length}</p>
                  {filteredLeads.length !== leads.length && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredLeads.length} filtrados
                    </p>
                  )}
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Quentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {leads.filter(l => l.temperatura === 'hot').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Médio</p>
                  <p className="text-2xl font-bold">
                    {leads.length > 0
                      ? Math.round(leads.reduce((sum, l) => sum + (l.icp_score || 0), 0) / leads.length)
                      : 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deals Criados</p>
                  <p className="text-2xl font-bold text-slate-600">0</p>
                </div>
                <Zap className="h-8 w-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              
              {/* 🔢 DROPDOWN DE PAGINAÇÃO */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar por página:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                    <SelectItem value="9999">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="🔍 Buscar: nome, CNPJ, decisor, cargo, departamento, email, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={temperatureFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('all')}
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={temperatureFilter === 'hot' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('hot')}
                    size="sm"
                    className={temperatureFilter === 'hot' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Quentes
                  </Button>
                  <Button
                    variant={temperatureFilter === 'warm' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('warm')}
                    size="sm"
                    className={temperatureFilter === 'warm' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    Mornos
                  </Button>
                  <Button
                    variant={temperatureFilter === 'cold' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('cold')}
                    size="sm"
                    className={temperatureFilter === 'cold' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Frios
                  </Button>
                </div>
                
                {/* FILTRO POR ORIGEM */}
                {uniqueSources.length > 0 && (
                  <div className="flex gap-2 border-l pl-4">
                    <Button
                      variant={sourceFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setSourceFilter('all')}
                      size="sm"
                    >
                      Todas Origens
                    </Button>
                    {uniqueSources.map(source => (
                      <Button
                        key={source}
                        variant={sourceFilter === source ? 'default' : 'outline'}
                        onClick={() => setSourceFilter(source)}
                        size="sm"
                        className={sourceFilter === source ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {source}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 👥 BUSCA APOLLO DECISORES (NOVA - ADICIONAL) */}
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Users className="h-5 w-5" />
                <span className="font-semibold text-sm">Buscar Decisores/Colaboradores Apollo:</span>
              </div>
              <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cyan-400" />
                <Input
                  placeholder="👥 Digite: nome do decisor, cargo, departamento, email..."
                  value={apolloSearchQuery}
                  onChange={(e) => setApolloSearchQuery(e.target.value)}
                  className="pl-10 border-cyan-500/30 focus:border-cyan-500"
                />
              </div>
              {apolloSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setApolloSearchQuery('')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
            {apolloSearchQuery && (
              <p className="text-xs text-cyan-400/70 mt-2 ml-7">
                🔍 Filtrando empresas que têm decisores com: "{apolloSearchQuery}"
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lista de Leads */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Carregando leads aprovados...
              </CardContent>
            </Card>
          ) : filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum lead aprovado encontrado
                </p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/leads/icp-quarantine')}
                  className="mt-2"
                >
                  Ir para Quarentena ICP →
                </Button>
              </CardContent>
            </Card>
          ) : (
            (pageSize === 9999 ? filteredLeads : filteredLeads.slice(0, pageSize)).map((lead) => (
              <Card 
                key={lead.id}
                className={`hover:border-primary/50 transition-all cursor-pointer ${selectedIds.includes(lead.id) ? 'border-primary border-2' : ''}`}
                onClick={() => {
                  // Toggle seleção ao clicar
                  setSelectedIds(prev => 
                    prev.includes(lead.id) 
                      ? prev.filter(id => id !== lead.id)
                      : [...prev, lead.id]
                  );
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Checkbox para seleção */}
                      <Checkbox
                        checked={selectedIds.includes(lead.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(prev => [...prev, lead.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== lead.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <Building2 className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            CNPJ: {lead.cnpj}
                          </Badge>
                          
                          {/* ✅ BADGE STATUS CNPJ (IDÊNTICO QUARENTENA) */}
                          <QuarantineCNPJStatusBadge 
                            cnpj={lead.cnpj} 
                            cnpjStatus={(lead as any).cnpj_status || 'ativa'} 
                          />
                          
                          {/* ✅ BADGE STATUS ANÁLISE (IDÊNTICO QUARENTENA) */}
                          <QuarantineEnrichmentStatusBadge 
                            rawAnalysis={(lead as any).raw_data || {}}
                            totvsStatus={(lead as any).totvs_status}
                            showProgress={true}
                          />
                          
                          {/* ✅ BADGE STATUS TOTVS */}
                          <TOTVSStatusBadge
                            status={
                              (lead as any).raw_data?.stc_verification_history?.status || 
                              (lead as any).raw_data?.totvs_check?.status || 
                              (lead as any).totvs_status || 
                              null
                            }
                            confidence={
                              (lead as any).raw_data?.stc_verification_history?.confidence || 
                              (lead as any).raw_data?.totvs_check?.confidence || 
                              undefined
                            }
                            tripleMatches={
                              (lead as any).raw_data?.stc_verification_history?.triple_matches || 
                              (lead as any).raw_data?.totvs_check?.triple_matches || 
                              0
                            }
                            doubleMatches={
                              (lead as any).raw_data?.stc_verification_history?.double_matches || 
                              (lead as any).raw_data?.totvs_check?.double_matches || 
                              0
                            }
                            size="sm"
                            showDetails={true}
                          />
                          
                          {(lead as any).source_name && (
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs"
                            >
                              {(lead as any).source_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {lead.segmento || (lead as any).raw_data?.apollo_organization?.industry || (lead as any).raw_data?.receita_federal?.atividade_principal?.[0]?.text || 'Segmento não identificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">ICP Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {lead.icp_score || 0}
                        </p>
                      </div>

                      <Badge className={getTemperatureColor(lead.temperatura)}>
                        {getTemperatureLabel(lead.temperatura)}
                      </Badge>

                      <div className="flex items-center gap-2">
                        {/* Botão de ação rápida: Ver Detalhes */}
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 🎯 NAVEGAR PARA RELATÓRIO COMPLETO (9 ABAS) DA EMPRESA
                            if (lead.company_id) {
                              navigate(`/company/${lead.company_id}`);
                            } else {
                              toast.error('Empresa sem ID vinculado');
                            }
                          }}
                        >
                          Ver Detalhes
                        </Button>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 🎯 ABRIR MODAL DE DEAL (mantido)
                            handleCreateDeal(lead);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Rocket className="mr-2 h-4 w-4" />
                          Criar Deal
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para criar deal */}
        <DealFormDialog
          open={dealFormOpen}
          onOpenChange={setDealFormOpen}
        />
      </div>
    </AppLayout>
  );
}

