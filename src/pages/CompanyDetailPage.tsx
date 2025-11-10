import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/common/BackButton";
import { LinkedInEnrichButton } from "@/components/common/LinkedInEnrichButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import LocationMap from "@/components/map/LocationMap";
import { 
  Building2, Users, FileText, BarChart3, Globe, Shield, 
  Calendar, MapPin, DollarSign, Briefcase, AlertCircle,
  CheckCircle, TrendingUp, Activity, Trash2, Loader2, RefreshCw, Target,
  UserPlus, TestTube, Phone, Mail, Eye, IdCard, MapPinned, ActivityIcon,
  UsersIcon, Wallet, Monitor, Brain, FileSpreadsheet, Zap, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DecisionMakerAddDialog from "@/components/companies/DecisionMakerAddDialog";
import { DecisorsCollaboratorsCard } from "@/components/companies/DecisorsCollaboratorsCard";
import { RichContactsCard } from "@/components/companies/RichContactsCard";
import { FinancialDebtCard } from "@/components/companies/FinancialDebtCard";
import { EconodataEnrichButton } from "@/components/companies/EconodataEnrichButton";
import { EnrichmentActionsCard } from '@/components/companies/EnrichmentActionsCard';
import { ApolloDataSection } from '@/components/companies/ApolloDataSection';
import { ApolloDecisorsCard } from '@/components/companies/ApolloDecisorsCard';
import { SeniorDecisorsPanel } from '@/components/companies/SeniorDecisorsPanel';
import { ApolloOrgIdDialog } from '@/components/companies/ApolloOrgIdDialog';
import { ApolloDebugDialog } from '@/components/companies/ApolloDebugDialog';
import { DiagnosticAIPanel } from '@/components/companies/DiagnosticAIPanel';
import { CompanyIntelligenceChat } from '@/components/companies/CompanyIntelligenceChat';
import { MultiLayerEnrichButton } from '@/components/canvas/MultiLayerEnrichButton';
import apolloLogo from "@/assets/logos/apollo.ico";
import phantomLogo from "@/assets/logos/phantombuster.png";
import { CompanyEnrichmentTabs } from '@/components/companies/CompanyEnrichmentTabs';
import { UpdateNowButton } from '@/components/companies/UpdateNowButton';
import { AutoEnrichButton } from '@/components/companies/AutoEnrichButton';
import { CreditsDashboard } from '@/components/companies/CreditsDashboard';
import { CreditUsageHistory } from '@/components/companies/CreditUsageHistory';
import CompanyGlobalSearch from '@/components/companies/CompanyGlobalSearch';
import { useRealtimeCompanyChanges } from '@/hooks/useRealtimeCompanyChanges';
import { CompanyActionsMenu } from '@/components/companies/CompanyActionsMenu';

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSmartRefreshing, setIsSmartRefreshing] = useState(false);
  const [isEnrichingReceita, setIsEnrichingReceita] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isTestingApollo, setIsTestingApollo] = useState(false);
  const [isRunningPhantom, setIsRunningPhantom] = useState(false);

  // ✅ MICROCICLO 2: Ativar Realtime para mudanças na empresa
  useRealtimeCompanyChanges(id);

  // Função para parsear colaboradores/decisores do formato da planilha
  const parseCollaborators = (cargosStr?: string, linkedinStr?: string) => {
    if (!cargosStr) return [];
    const cargos = cargosStr.split('\n').filter(c => c.trim());
    const linkedins = linkedinStr ? linkedinStr.split('\n').filter(l => l.trim()) : [];
    
    return cargos.map((cargo, i) => {
      const parts = cargo.split(' - ');
      return {
        name: parts[0]?.trim() || '',
        role: parts.slice(1).join(' - ').trim() || '',
        linkedin: linkedins[i]?.trim() || ''
      };
    });
  };

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: async () => {
      const { data: base, error: baseErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id!)
        .single();
      if (baseErr) throw baseErr;
      if (!base) return null;

      // AUTO-ENRIQUECIMENTO: Se não tem dados da Receita Federal, buscar agora
      if (base.cnpj && !base.raw_data?.receita && !base.raw_data?.enriched_receita) {
        console.log('🚀 [Auto-Enrich] Buscando dados da Receita Federal para:', base.cnpj);
        
        try {
          await supabase.functions.invoke('enrich-receitaws', {
            body: { cnpj: base.cnpj, company_id: id }
          });
          
          // Recarregar dados após enriquecimento
          const { data: updated } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id!)
            .single();
          
          if (updated) {
            base.raw_data = updated.raw_data;
          }
        } catch (e) {
          console.warn('⚠️ [Auto-Enrich] Falha ao enriquecer:', e);
        }
      }

      const [decisorsRes, maturityRes, insightsRes, presenceRes] = await Promise.all([
        supabase.from('decision_makers').select('*').eq('company_id', id!),
        supabase.from('digital_maturity').select('*').eq('company_id', id!),
        supabase.from('insights').select('*').eq('company_id', id!),
        supabase.from('digital_presence').select('*').eq('company_id', id!).maybeSingle(),
      ]);

      return {
        ...base,
        decision_makers: decisorsRes.data || [],
        digital_maturity: maturityRes.data || [],
        insights: insightsRes.data || [],
        digital_presence: presenceRes.data,
      } as any;
    },
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p>Empresa não encontrada</p>
      </div>
    );
  }

  const handleSmartRefresh = async () => {
    setIsSmartRefreshing(true);
    try {
      toast.info('Executando atualização inteligente...');
      
      await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj, company_id: id }
      });

      await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: id }
      });

      toast.success('Atualização completa realizada!');
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    } catch (error: any) {
      toast.error('Erro na atualização', { description: error.message });
    } finally {
      setIsSmartRefreshing(false);
    }
  };

  const handleEnrichReceita = async (companyId: string) => {
    setIsEnrichingReceita(true);
    try {
      await supabase.functions.invoke('enrich-receitaws', {
        body: { cnpj: company.cnpj, company_id: companyId }
      });

      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      toast.success('Dados da Receita Federal atualizados!');
    } catch (error: any) {
      toast.error('Erro ao enriquecer via Receita Federal', { description: error.message });
    } finally {
      setIsEnrichingReceita(false);
    }
  };

  const handleFullEnrichment = async () => {
    setIsEnriching(true);
    try {
      toast.info('Executando análise 360° completa...');
      
      await supabase.functions.invoke('batch-enrich-360', {
        body: { companyId: id, cnpj: company.cnpj }
      });

      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      toast.success('Análise 360° concluída com sucesso!');
    } catch (error: any) {
      toast.error('Erro na análise 360°', { description: error.message });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleEnrichApollo = async (apolloOrgId?: string) => {
    setIsEnriching(true);
    try {
      console.log('[CompanyDetail] 🚀 Buscando decisores Apollo para:', company.name);
      console.log('[CompanyDetail] 📋 Apollo Org ID:', apolloOrgId || 'N/A');
      
      toast.info('Buscando decisores no Apollo.io...', {
        description: apolloOrgId ? 'Usando Organization ID manual' : 'Usando nome da empresa'
      });
      
      // Salvar Apollo Org ID na empresa se fornecido
      if (apolloOrgId) {
        await supabase
          .from('companies')
          .update({ apollo_organization_id: apolloOrgId })
          .eq('id', id);
      }
      
      // Usar função simplificada enrich-apollo-decisores
      const { data, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: id,
          company_name: company.name,
          domain: company.domain || company.website,
          apollo_org_id: apolloOrgId || company.apollo_organization_id,
          modes: ['people', 'company']
        }
      });
      
      if (error) {
        console.error('[CompanyDetail] ❌ Erro Apollo:', error);
        throw error;
      }

      console.log('[CompanyDetail] ✅ Apollo retornou:', data);
      
      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
      
      toast.success('Decisores encontrados!', {
        description: `${(data as any)?.decisores_salvos || 0} decisores salvos no banco`
      });
    } catch (e: any) {
      console.error('[CompanyDetail] ❌ Erro completo:', e);
      toast.error('Erro ao buscar decisores', { 
        description: e.message || 'Verifique o Apollo Organization ID'
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleTestApollo = async () => {
    setIsTestingApollo(true);
    try {
      const searchName = company.name;
      console.log('[CompanyDetail] 🚀 Buscando decisores para:', searchName);

      const cleanDomain = (d?: string) => {
        if (!d) return undefined;
        try {
          const first = String(d).split(/\n|,|\s/)[0] || '';
          return first
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .replace(/http$/i, '')
            .replace(/\/.*$/, '')
            .trim();
        } catch { return undefined; }
      };
      const cleanedDomain = cleanDomain(company.domain || company.website);
      
      const { data: apolloData, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: id,
          company_name: searchName,
          domain: cleanedDomain,
          modes: ['people', 'company'],
          positions: ['CEO','CTO','CFO','Diretor','Gerente','VP']
        }
      });
      
      if (error) {
        console.error('[CompanyDetail] ❌ Erro ao buscar pessoas:', error);
        throw error;
      }

      const people = (apolloData as any)?.people || [];
      console.log('[CompanyDetail] ✅ Pessoas encontradas:', people.length);
      
      for (const person of people.slice(0, 5)) {
        await supabase.from('decision_makers').upsert({
          company_id: id,
          name: person.name,
          title: person.title,
          email: person.email,
          phone: person.phone_numbers?.[0]?.raw_number || null,
          linkedin_url: person.linkedin_url,
          source: 'apollo'
        } as any);
      }

      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      toast.success(`${people.length} contatos encontrados via Apollo`);
    } catch (e: any) {
      console.error('[CompanyDetail] ❌ Erro completo:', e);
      toast.error('Erro ao buscar decisores via Apollo', {
        description: e.message || 'Verifique se a API key do Apollo está configurada'
      });
    } finally {
      setIsTestingApollo(false);
    }
  };

  const handleRunPhantom = async () => {
    setIsRunningPhantom(true);
    try {
      const linkedinUrl = (company as any)?.digital_presence?.linkedin;
      if (!linkedinUrl) {
        toast.info('LinkedIn não encontrado');
        setIsRunningPhantom(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('linkedin-scrape', {
        body: { linkedin_url: linkedinUrl, company_id: id }
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      toast.success('PhantomBuster concluído');
    } catch (e: any) {
      toast.error('Erro ao executar PhantomBuster');
    } finally {
      setIsRunningPhantom(false);
    }
  };

  const receitaData = (company as any)?.raw_data?.receita;
  const decisors = (company as any)?.decision_makers || [];
  
  console.log('[CompanyDetail] 📊 Decisores carregados:', decisors.length);
  console.log('[CompanyDetail] 📋 Primeiro decisor:', decisors[0]);
  const digitalPresence = (company as any)?.digital_presence;
  const rawData = (company as any)?.raw_data || {};
  const situacaoReceita: string | undefined = receitaData?.situacao;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <BackButton to="/companies" />
        <CompanyActionsMenu 
          companyId={id!}
          companyName={company.name}
          isLoading={isSmartRefreshing || isEnriching}
          onRefresh={handleSmartRefresh}
          onEnrich={handleFullEnrichment}
        />
      </div>
      
      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-lime-400" />
                <span className="text-blue-700 dark:text-lime-300">{company.name}</span>
              </CardTitle>
              {receitaData?.fantasia && receitaData.fantasia !== company.name && (
                <p className="text-lg text-muted-foreground">Nome Fantasia: {receitaData.fantasia}</p>
              )}
            </div>
              <div className="text-right space-y-2">
              <Badge variant={situacaoReceita === 'ATIVA' ? 'success' : (situacaoReceita && ['INAPTA','SUSPENSA','INATIVA','BAIXADA'].includes(situacaoReceita) ? 'warning' : 'destructive')} className={situacaoReceita === 'ATIVA' ? 'bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:hover:bg-lime-600' : 'bg-yellow-600 text-white dark:bg-yellow-500'}>
                {situacaoReceita || 'Pendente'}
              </Badge>
              <div className="flex flex-col items-end gap-3">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => navigate(`/account-strategy?company=${id}`)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Criar Estratégia
                </Button>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleSmartRefresh}
                          disabled={isSmartRefreshing}
                        >
                          {isSmartRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Atualizar</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEnrichReceita(id!)}
                          disabled={isEnrichingReceita || !company.cnpj}
                        >
                          {isEnrichingReceita ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{company.cnpj ? 'Receita Federal' : 'Receita Federal (requer CNPJ)'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleFullEnrichment}
                          disabled={isEnriching}
                        >
                          {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enriquecimento 360° Completo + IA</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEnrichApollo()}
                          disabled={isEnriching}
                          className="relative"
                        >
                          {isEnriching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <img src={apolloLogo} alt="Apollo" className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enriquecer com Apollo.io</p>
                      </TooltipContent>
                    </Tooltip>

                    <ApolloOrgIdDialog 
                      onEnrich={handleEnrichApollo}
                      disabled={isEnriching}
                    />

                    <EconodataEnrichButton
                      companyId={id!}
                      cnpj={company.cnpj || ''}
                      variant="outline"
                      size="icon"
                    />
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Busca Dual Engine (Apollo + LinkedIn + Google) */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Busca Inteligente Dual Engine
          </CardTitle>
          <CardDescription>
            Busca paralela em Apollo, LinkedIn e Google para encontrar empresas similares e atualizar dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyGlobalSearch 
            segment={company?.industry} 
            onSelect={async (newCompanyId) => {
              // Refresh da página atual
              await queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
              await queryClient.invalidateQueries({ queryKey: ['company-people', id] });
              await queryClient.invalidateQueries({ queryKey: ['company-similar', id] });
              await queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
              toast.success('Empresa atualizada com sucesso!');
            }} 
          />
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="glass-card p-1.5 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="overview" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                    Visão Geral
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Resumo completo: Identificação, Localização, Atividade, Estrutura e Receita Federal consolidados
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="inteligencia" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <Brain className="h-4 w-4" />
                    Inteligência
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Hub analítico: empresa + decisores + similares + insights da IA
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="financeiro" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <Wallet className="h-4 w-4" />
                    Financeiro
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Capital social, faturamento, dívidas e integração com Serasa
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="apollo360" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <div className="radar-icon" aria-label="RADAR"></div>
                    <span className="font-semibold">RADAR</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  🎯 RADAR Inteligente: People, Similares, Technologies, Insights, Trends, Visitors, News, Vagas
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="credits" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Créditos
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Controle de uso de créditos Apollo.io e histórico de consumo
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="actions" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <Zap className="h-4 w-4" />
                    Ações
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Workspace de prospecção: Funil, Cadências, Comunicações, Agenda e Tarefas
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
        </ScrollArea>

        {/* TAB 1: Visão Geral */}
        <TabsContent value="overview" className="space-y-4 animate-fade-in">
          {/* Header - Informações Principais em Grid Compacto World-Class */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-lime-400" />
                  <p className="text-xs text-blue-700 dark:text-lime-300 font-semibold uppercase tracking-wide">CNPJ</p>
                </div>
                <p className="font-mono font-bold text-base text-blue-700 dark:text-lime-400 tracking-wide bg-blue-50 dark:bg-lime-500/10 px-2 py-1 rounded border border-blue-200 dark:border-lime-500/30">{company.cnpj || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle className={`h-4 w-4 ${receitaData?.descricao_situacao_cadastral === 'ATIVA' ? 'text-lime-500' : 'text-yellow-500'}`} />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Situação</p>
                </div>
                <Badge variant={receitaData?.descricao_situacao_cadastral === 'ATIVA' ? 'default' : 'secondary'} className={`text-sm px-3 py-1 ${receitaData?.descricao_situacao_cadastral === 'ATIVA' ? 'bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:hover:bg-lime-600' : 'bg-yellow-600 text-white dark:bg-yellow-500'}`}>
                  {receitaData?.descricao_situacao_cadastral || rawData?.situacao_cadastral || 'Pendente'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Porte</p>
                </div>
                <p className="font-bold text-base">{receitaData?.porte || rawData.porte_estimado || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Abertura</p>
                </div>
                <p className="font-bold text-base">
                  {receitaData?.data_inicio_atividade 
                    ? new Date(receitaData.data_inicio_atividade).toLocaleDateString('pt-BR')
                    : rawData?.data_abertura || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Funcionários</p>
                </div>
                <p className="font-bold text-base">
                  {(company as any)?.raw_data?.apollo?.employee_count || 
                   rawData?.funcionarios_presumido_matriz_cnpj || 
                   company.employees || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sócios</p>
                </div>
                <p className="font-bold text-base">
                  {receitaData?.qsa?.length || rawData?.qtd_socios || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Website</p>
                </div>
                {company.website || digitalPresence?.website ? (
                  <a 
                    href={company.website || digitalPresence?.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline truncate block font-semibold"
                  >
                    Acessar
                  </a>
                ) : (
                  <p className="text-base font-bold text-muted-foreground">N/A</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Identificação Cadastral - 4 Colunas Compactas */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" />
                Identificação Cadastral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Razão Social</p>
                  <p className="text-xs font-semibold truncate">{receitaData?.razao_social || company.name}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Nome Fantasia</p>
                  <p className="text-xs font-semibold">{receitaData?.fantasia || rawData.nome_fantasia || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Tipo Unidade</p>
                  <p className="text-xs font-semibold">{rawData.tipo_unidade || receitaData?.tipo || 'Matriz'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Natureza Jurídica</p>
                  <p className="text-xs font-semibold">{receitaData?.natureza_juridica || rawData.natureza_juridica || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização + Mapa - Grid 2 Colunas */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Localização Completa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Logradouro</p>
                    <p className="text-xs font-medium">{receitaData?.logradouro || rawData.logradouro || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Número</p>
                    <p className="text-xs font-medium">{receitaData?.numero || rawData.numero || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Complemento</p>
                    <p className="text-xs font-medium">{receitaData?.complemento || rawData.complemento || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Bairro</p>
                    <p className="text-xs font-medium">{receitaData?.bairro || rawData.bairro || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">CEP</p>
                    <p className="text-xs font-mono font-medium">{receitaData?.cep || rawData.cep || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Cidade</p>
                    <p className="text-xs font-medium">{receitaData?.municipio || rawData.cidade || (company.location as any)?.city || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Estado</p>
                    <p className="text-xs font-medium">{receitaData?.uf || rawData.uf || (company.location as any)?.state || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Microrregião</p>
                    <p className="text-xs font-medium">{rawData.microrregiao || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Mesorregião</p>
                    <p className="text-xs font-medium">{rawData.mesorregiao || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {receitaData?.cep && (
              <Card className="glass-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPinned className="h-5 w-5 text-primary" />
                    Visualização no Mapa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap
                    address={receitaData?.logradouro}
                    numero={receitaData?.numero}
                    municipio={receitaData?.municipio}
                    estado={receitaData?.uf}
                    cep={receitaData?.cep}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contatos Completos */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Telefones - Layout Compacto 4 Colunas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Melhor Telefone</p>
                  <p className="text-xs font-mono font-medium">{rawData.melhor_telefone || receitaData?.telefone || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Segundo Melhor</p>
                  <p className="text-xs font-mono font-medium">{rawData.segundo_melhor_telefone || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Assertividade</p>
                  <p className="text-xs font-medium">{rawData.assertividade || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Telefones Matriz</p>
                  <p className="text-xs font-mono font-medium">{receitaData?.ddd_telefone_1 || receitaData?.ddd_telefone_2 || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Tel. Alta Assert.</p>
                  <p className="text-xs font-mono">{rawData.telefones_alta_assertividade || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Tel. Média Assert.</p>
                  <p className="text-xs font-mono">{rawData.telefones_media_assertividade || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Tel. Baixa Assert.</p>
                  <p className="text-xs font-mono">{rawData.telefones_baixa_assertividade || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Telefones Filiais</p>
                  <p className="text-xs font-mono">{rawData.telefones_filiais || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Melhor Celular</p>
                  <p className="text-xs font-mono">{rawData.melhor_celular || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">WhatsApp</p>
                  <p className="text-xs font-mono">{rawData.whatsapp || digitalPresence?.whatsapp || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">PAT Telefone</p>
                  <p className="text-xs font-mono">{rawData.pat_telefone || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Celulares</p>
                  <p className="text-xs font-mono">{rawData.celulares || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Fixos</p>
                <ScrollArea className="h-16 border rounded-lg p-2 bg-muted/20">
                  <p className="text-xs font-mono">{rawData.fixos || 'N/A'}</p>
                </ScrollArea>
              </div>

              <Separator />

              {/* Emails - Layout Compacto 4 Colunas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">E-mails Departamentos</p>
                  <p className="text-xs truncate">{rawData.emails_validados_departamentos || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">E-mails Sócios</p>
                  <p className="text-xs truncate">{rawData.emails_validados_socios || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">E-mails Decisores</p>
                  <p className="text-xs truncate">{rawData.emails_validados_decisores || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">E-mails Colaboradores</p>
                  <p className="text-xs truncate">{rawData.emails_validados_colaboradores || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">E-mails Públicos</p>
                  <p className="text-xs truncate">{rawData.emails_publicos || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Email PAT</p>
                  <p className="text-xs truncate">{rawData.email_pat || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Email Receita Federal</p>
                  <p className="text-xs truncate">{rawData.email_receita_federal || receitaData?.email || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Econômica Completa */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Atividade Econômica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Info Rápida - 4 Colunas Compactas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Setor Amigável</p>
                  <p className="text-xs font-semibold">{rawData.setor_amigavel || company.industry || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">CNAE Principal</p>
                  <p className="text-xs font-mono font-semibold">{receitaData?.cnae_fiscal || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Regime Tributário</p>
                  <p className="text-xs font-semibold">{rawData.regime_tributario || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Importa/Exporta</p>
                  <div className="flex gap-1">
                    <Badge variant={rawData.importacao ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      I: {rawData.importacao ? 'Sim' : 'Não'}
                    </Badge>
                    <Badge variant={rawData.exportacao ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      E: {rawData.exportacao ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Descrição CNAE Principal */}
              {receitaData?.cnae_fiscal_descricao && (
                <div className="p-2 bg-muted/20 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Atividade Principal</p>
                  <p className="text-xs">{receitaData.cnae_fiscal_descricao}</p>
                </div>
              )}

              {/* Atividades Secundárias - Compacto */}
              {receitaData?.cnaes_secundarios && receitaData.cnaes_secundarios.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 text-primary">Atividades Secundárias</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {receitaData.cnaes_secundarios.map((ativ: any, i: number) => (
                      <div key={i} className="p-2 bg-muted/20 rounded border text-xs">
                        <span className="font-mono font-semibold text-primary">{ativ.codigo}</span> - <span className="text-muted-foreground">{ativ.descricao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NCM - Só mostra se tiver */}
              {rawData.cod_ncms_primarios && rawData.cod_ncms_primarios !== 'N/A' && (
                <div className="p-2 bg-muted/20 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Códigos NCM</p>
                  <p className="text-xs font-mono">{rawData.cod_ncms_primarios}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estrutura Organizacional - Grid 2 Colunas */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Quadro de Pessoal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Funcionários Total</p>
                    <p className="text-sm font-bold text-primary">{rawData.funcionarios_presumido_matriz_cnpj || company.employees || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Este CNPJ</p>
                    <p className="text-sm font-semibold">{rawData.funcionarios_presumido_este_cnpj || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">PAT Funcionários</p>
                    <p className="text-sm font-semibold">{rawData.pat_funcionarios || 'N/A'}</p>
                  </div>
                  <div className="p-2 border rounded bg-muted/10">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Qtd. Filiais</p>
                    <p className="text-sm font-semibold">{rawData.qtd_filiais || '0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Sócios e Administradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto">
                  {receitaData?.qsa && receitaData.qsa.length > 0 ? (
                    <div className="space-y-1.5">
                      {receitaData.qsa.map((socio: any, i: number) => (
                        <div key={i} className="p-2 bg-muted/20 rounded border text-xs">
                          <p className="font-semibold text-primary">{socio.nome_socio || socio.nome}</p>
                          <p className="text-muted-foreground">{socio.qualificacao_socio || socio.qual} {socio.faixa_etaria && `• ${socio.faixa_etaria}`}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum sócio cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Financeiras */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Info Financeira Principal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 bg-blue-50 dark:bg-lime-500/10 rounded border border-blue-200 dark:border-lime-500/30">
                  <p className="text-[10px] text-blue-700 dark:text-lime-300 font-semibold mb-0.5">Capital Social</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-lime-400">
                    {receitaData?.capital_social || rawData.capital_social
                      ? `R$ ${parseFloat(receitaData?.capital_social || rawData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Porte</p>
                  <p className="text-sm font-semibold">{rawData.enquadramento_porte || receitaData?.porte || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Faturamento Matriz+CNPJ</p>
                  <p className="text-xs font-semibold">{rawData.faturamento_presumido_matriz_cnpj || 'N/A'}</p>
                </div>
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Faturamento Este CNPJ</p>
                  <p className="text-xs font-semibold">{rawData.faturamento_presumido_este_cnpj || 'N/A'}</p>
                </div>
              </div>

              {/* Dívidas - Layout Compacto 4 Colunas */}
              <div>
                <p className="text-xs font-semibold mb-2 text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Dívidas e Débitos
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 bg-destructive/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">% Dív. CNPJ/Fat.</p>
                    <p className="text-xs font-semibold">{rawData.perc_dividas_cnpj_sobre_faturamento || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">% Dív. CNPJ+Sócios/Fat.</p>
                    <p className="text-xs font-semibold">{rawData.perc_dividas_cnpj_socios_sobre_faturamento || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Total Dív. CNPJ c/ União</p>
                    <p className="text-xs font-semibold text-destructive">{rawData.total_dividas_cnpj_uniao || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Total Dív. CNPJ+Sócios</p>
                    <p className="text-xs font-semibold text-destructive">{rawData.total_dividas_cnpj_socios_uniao || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-muted/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Dív. Gerais CNPJ</p>
                    <p className="text-xs">{rawData.dividas_gerais_cnpj_uniao || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-muted/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Dív. Gerais CNPJ+Sócios</p>
                    <p className="text-xs">{rawData.dividas_gerais_cnpj_socios_uniao || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-muted/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">FGTS CNPJ</p>
                    <p className="text-xs">{rawData.dividas_cnpj_fgts || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-muted/10 rounded border">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">FGTS CNPJ+Sócios</p>
                    <p className="text-xs">{rawData.dividas_cnpj_socios_fgts || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decisores Cadastrados */}
          <DecisorsCollaboratorsCard
            decisors={parseCollaborators(rawData.decisores_cargos, rawData.decisores_linkedin)}
            collaborators={parseCollaborators(rawData.colaboradores_cargos, rawData.colaboradores_linkedin)}
          />

          {decisors.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Decisores Cadastrados ({decisors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {decisors.map((dec: any) => (
                    <div key={dec.id} className="p-3 bg-muted/30 rounded-lg hover-scale">
                      <p className="font-semibold text-sm mb-1">{dec.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{dec.title}</p>
                      {dec.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" />{dec.email}</p>}
                      {dec.phone && <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{dec.phone}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 3: Financeiro */}
        <TabsContent value="financeiro" className="space-y-3">
          <FinancialDebtCard rawData={rawData} />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2 bg-blue-50 dark:bg-lime-500/10 border border-blue-200 dark:border-lime-500/30 rounded">
              <p className="text-[10px] text-blue-700 dark:text-lime-300 font-semibold mb-0.5">Capital Social</p>
              <p className="text-sm font-bold text-blue-700 dark:text-lime-400">
                {receitaData?.capital_social || rawData.capital_social
                  ? `R$ ${parseFloat(receitaData?.capital_social || rawData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'N/A'}
              </p>
            </div>

            <div className="p-2 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Recebimentos Governo</p>
              <p className="text-sm font-bold">
                {rawData.recebimentos_governo_federal
                  ? `R$ ${parseFloat(rawData.recebimentos_governo_federal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'N/A'}
              </p>
            </div>

            <div className="p-2 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Porte</p>
              <p className="text-sm font-bold">{rawData.enquadramento_porte || receitaData?.porte || 'N/A'}</p>
            </div>

            <div className="p-2 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Faturamento Matriz+CNPJ</p>
              <p className="text-xs font-semibold">{rawData.faturamento_presumido_matriz_cnpj || 'N/A'}</p>
            </div>

            <div className="p-2 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Faturamento Este CNPJ</p>
              <p className="text-xs font-semibold">{rawData.faturamento_presumido_este_cnpj || 'N/A'}</p>
            </div>

            <div className="p-2 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Crescimento</p>
              <Badge className="text-[10px]">{rawData.crescimento_empresa || 'Estável'}</Badge>
            </div>
          </div>

          {/* Dívidas - Compacto 4 Colunas */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Dívidas e Débitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 bg-destructive/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">% Dív. CNPJ/Fat.</p>
                  <p className="text-xs font-semibold">{rawData.perc_dividas_cnpj_sobre_faturamento || 'N/A'}</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">% Dív. CNPJ+Sócios/Fat.</p>
                  <p className="text-xs font-semibold">{rawData.perc_dividas_cnpj_socios_sobre_faturamento || 'N/A'}</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Total Dív. CNPJ c/ União</p>
                  <p className="text-xs font-semibold text-red-600">{rawData.total_dividas_cnpj_uniao || 'N/A'}</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Total Dív. CNPJ+Sócios</p>
                  <p className="text-xs font-semibold text-red-600">{rawData.total_dividas_cnpj_socios_uniao || 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Dív. Gerais CNPJ</p>
                  <p className="text-xs">{rawData.dividas_gerais_cnpj_uniao || 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Dív. Gerais CNPJ+Sócios</p>
                  <p className="text-xs">{rawData.dividas_gerais_cnpj_socios_uniao || 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">FGTS CNPJ</p>
                  <p className="text-xs">{rawData.dividas_cnpj_fgts || 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">FGTS CNPJ+Sócios</p>
                  <p className="text-xs">{rawData.dividas_cnpj_socios_fgts || 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Prev. CNPJ</p>
                  <p className="text-xs">{rawData.dividas_cnpj_previdencia || 'N/A'}</p>
                </div>
                <div className="p-2 bg-muted/10 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Prev. CNPJ+Sócios</p>
                  <p className="text-xs">{rawData.dividas_cnpj_socios_previdencia || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Inteligência e Análise */}
        <TabsContent value="inteligencia" className="space-y-3">
          {/* Diagnóstico 360° por IA */}
          <DiagnosticAIPanel company={company} />
          
          {/* Ações de Enriquecimento */}
          <EnrichmentActionsCard 
            company={company}
            onEnrichmentComplete={() => queryClient.invalidateQueries({ queryKey: ['company-detail', id] })}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Score Digital</p>
              <div className="text-2xl font-bold text-primary">
                {company.digital_maturity_score?.toFixed(1) || 'N/A'}
              </div>
            </div>

            <div className="p-3 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Nível de Atividade</p>
              <Badge className="mt-1">{rawData.nivel_atividade || 'N/A'}</Badge>
            </div>

            <div className="p-3 border rounded bg-muted/10">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Classificação</p>
              <p className="text-sm font-semibold">{company.classification || 'N/A'}</p>
            </div>
          </div>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Insights Capturados</CardTitle>
            </CardHeader>
            <CardContent>
              {(company as any)?.insights && (company as any).insights.length > 0 ? (
                <div className="space-y-1.5">
                  {(company as any).insights.map((insight: any) => (
                    <div key={insight.id} className="border rounded p-2 bg-muted/10">
                      <p className="text-xs font-semibold text-primary">{insight.insight_type}</p>
                      <p className="text-xs text-muted-foreground">{insight.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum insight capturado ainda</p>
              )}
            </CardContent>
          </Card>

          {/* Seção Apollo com todos os dados enriquecidos */}
          <ApolloDataSection company={company} />
          
          {/* Decisores Apollo com dados verificados */}
          <ApolloDecisorsCard decisors={decisors} />

          {/* Diagnóstico Apollo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Diagnóstico e Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApolloDebugDialog 
                companyId={id!}
                companyName={company.name}
                apolloOrgId={company.apollo_id}
                domain={company.domain || company.website}
              />
            </CardContent>
          </Card>

          {/* Painel de Decisores Seniores Filtrados */}
          <SeniorDecisorsPanel 
            decisors={decisors}
            companyName={company.name}
          />
        </TabsContent>

        {/* TAB 4: Ações */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Enriquecimento de Dados</CardTitle>
                <CardDescription>Buscar decisores e enriquecer informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MultiLayerEnrichButton
                  companyId={id!}
                  cnpj={company.cnpj}
                  onComplete={() => queryClient.invalidateQueries({ queryKey: ['company-detail', id] })}
                />

                <Separator />

                <EconodataEnrichButton 
                  companyId={id!}
                  cnpj={company.cnpj}
                  variant="default"
                  size="default"
                  className="w-full"
                />
                
                <Separator />
                
                <Button
                  onClick={handleSmartRefresh}
                  disabled={isSmartRefreshing}
                  className="w-full justify-start"
                  variant="secondary"
                >
                  {isSmartRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Atualização Inteligente (360°)
                </Button>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Buscar Decisores</p>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleTestApollo}
                          disabled={isTestingApollo}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {isTestingApollo ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <img src={apolloLogo} className="h-4 w-4 mr-2" alt="Apollo" />
                          )}
                          Apollo.io
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Busca decisores via Apollo.io (API paga)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleRunPhantom}
                          disabled={isRunningPhantom}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          {isRunningPhantom ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <img src={phantomLogo} className="h-4 w-4 mr-2" alt="PhantomBuster" />
                          )}
                          PhantomBuster
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Raspagem de perfis LinkedIn via PhantomBuster
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <LinkedInEnrichButton 
                    companyId={id!}
                    linkedinUrl={digitalPresence?.linkedin || rawData.linkedin}
                    variant="outline"
                    size="sm"
                    showLabel={true}
                  />

                  <DecisionMakerAddDialog companyId={id!} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Empresa
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Apollo 360° - RADAR */}
        <TabsContent value="apollo360" className="space-y-3 animate-fade-in">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="radar-icon" aria-label="RADAR"></div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      RADAR Inteligente
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Enriquecimento Apollo: 100% dos campos + Decisores + Similares + Tech Stack + Insights
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <UpdateNowButton
                    companyId={id!}
                    companyName={company.name}
                    companyDomain={company.domain || company.website}
                    apolloOrganizationId={company.apollo_organization_id}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
                      queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
                    }}
                  />
                  <AutoEnrichButton />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CompanyEnrichmentTabs
                companyId={id!}
                company={company}
                similarCompanies={(company.similar_companies && company.similar_companies.length > 0)
                  ? company.similar_companies
                  : ((company.raw_data?.apollo?.similar_companies || []).map((s: any) => ({
                      name: s.name,
                      apollo_url: `https://app.apollo.io/#/organizations/${s.id}`,
                      apollo_id: s.id,
                      location: (s.city && s.country) ? `${s.city}, ${s.country}` : s.country,
                      employees: s.estimated_num_employees
                    })))}
                technologiesFull={(company.technologies_full && company.technologies_full.length > 0)
                  ? company.technologies_full
                  : (company.raw_data?.apollo?.current_technologies || []).map((t: any) => ({
                      name: t.name,
                      category: t.category,
                      source: 'Apollo'
                    }))}
                employeeTrends={company.employee_trends}
                websiteVisitors={company.website_visitors}
                companyInsights={company.company_insights}
                news={company.news || []}
                jobPostings={company.job_postings || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Créditos Apollo */}
        <TabsContent value="credits" className="space-y-3 animate-fade-in">
          <div className="grid gap-3 md:grid-cols-2">
            <CreditsDashboard />
            <CreditUsageHistory />
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{company?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('companies')
                    .delete()
                    .eq('id', id);

                  if (error) throw error;

                  toast.success('Empresa excluída');
                  navigate('/companies');
                } catch (error) {
                  toast.error('Erro ao excluir empresa');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* Intelligence Copilot - Floating Chat */}
      <CompanyIntelligenceChat company={company} />
    </div>
  );
}
