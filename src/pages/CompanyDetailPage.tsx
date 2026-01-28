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
import { consultarReceitaFederal } from "@/services/receitaFederal";
import { revealCorporateContact, revealPersonalContact, isVIPDecisor } from "@/services/revealContact";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DecisionMakerAddDialog from "@/components/companies/DecisionMakerAddDialog";
import { DecisorsCollaboratorsCard } from "@/components/companies/DecisorsCollaboratorsCard";
import { RichContactsCard } from "@/components/companies/RichContactsCard";
import { FinancialDebtCard } from "@/components/companies/FinancialDebtCard";
import { EnrichmentActionsCard } from '@/components/companies/EnrichmentActionsCard';
import { ApolloDataSection } from '@/components/companies/ApolloDataSection';
import { ApolloDecisorsCard } from '@/components/companies/ApolloDecisorsCard';
import { SeniorDecisorsPanel } from '@/components/companies/SeniorDecisorsPanel';
import { ApolloOrgIdDialog } from '@/components/companies/ApolloOrgIdDialog';
import { ApolloDebugDialog } from '@/components/companies/ApolloDebugDialog';
import { CollapsibleCard } from '@/components/companies/CollapsibleCard';
import { DiagnosticAIPanel } from '@/components/companies/DiagnosticAIPanel';
import { CompanyIntelligenceChat } from '@/components/companies/CompanyIntelligenceChat';
import { UnifiedEnrichButton } from '@/components/companies/UnifiedEnrichButton';
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
import { DecisionMakersTab } from '@/components/companies/DecisionMakersTab';
import { DecisionMakerSearchDialog } from '@/components/companies/DecisionMakerSearchDialog';
import { isInSalesTargetContext } from '@/lib/utils/enrichmentContextValidator';
import { CanonicalStateBadge } from '@/components/companies/CanonicalStateBadge';
import { useCanonicalState } from '@/hooks/useCanonicalState';
import { useEnrichmentOrchestration } from '@/hooks/useEnrichmentOrchestration';

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
  
  // 🔍 FILTROS DE DECISORES
  const [filterSeniority, setFilterSeniority] = useState<string>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  
  // 💸 REVEAL DE CONTATOS
  const [revealingContacts, setRevealingContacts] = useState<Set<string>>(new Set());

  // ✅ MICROCICLO 2: Ativar Realtime para mudanças na empresa
  useRealtimeCompanyChanges(id);

  // ✅ ETAPA 1 OLV: Orquestração Lock → Apollo Company → Apollo People → Receita (ponto de uso obrigatório)
  const { orchestrateEnrichment, isEnriching: isOrchestrating } = useEnrichmentOrchestration();

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

  const { data: company, isLoading, error: queryError } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('ID da empresa não fornecido');
      
      // ✅ CORRIGIR 406: Buscar empresa de forma simples primeiro
      let base: any = null;
      
      try {
        // ✅ FLUXO OFICIAL: Buscar empresa básica primeiro (evita erro 406 com joins)
        // Esta página só deve ser usada para registros que já estão em companies
        const { data: companyData, error: companyErr } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id!)
          .single();
        
        if (companyErr) {
          // ✅ FLUXO OFICIAL: CompanyDetailPage só aceita company_id real
          // Se erro 406 ou não encontrado, mostrar mensagem clara
          if (companyErr.code === 'PGRST116' || companyErr.message?.includes('406') || companyErr.message?.includes('not found')) {
            console.warn('[CompanyDetail] ⚠️ Empresa não encontrada na tabela companies:', id);
            
            // ✅ Verificar se é um ID de qualified_prospect (não deve navegar daqui)
            const { data: qualifiedData } = await ((supabase as any).from('qualified_prospects'))
              .select('id, company_id')
              .eq('id', id!)
              .maybeSingle();
            
            if (qualifiedData) {
              // É um qualified_prospect - redirecionar para Estoque
              throw new Error('QUALIFIED_PROSPECT_ID');
            }
            
            throw new Error('Empresa não encontrada');
          }
          throw companyErr;
        }
        
        if (!companyData) {
          throw new Error('Empresa não encontrada');
        }
        
        base = companyData;
        
      } catch (err: any) {
        console.error('[CompanyDetail] ❌ Erro ao buscar empresa:', err);
        
        // ✅ Se empresa não aprovada, lançar erro específico
        if (err.message === 'EMPREZA_NAO_APROVADA') {
          throw err;
        }
        
        // ✅ Outros erros: relançar
        throw err;
      }
      
      if (!base) return null;

      // AUTO-ENRIQUECIMENTO: Se não tem dados da Receita Federal, buscar agora
      if (base.cnpj && !base.raw_data?.receita_federal && !base.raw_data?.receita) {
        console.log('🚀 [Auto-Enrich] Buscando dados da Receita Federal para:', base.cnpj);
        
        try {
          // ✅ USAR MESMA FUNÇÃO DO ENRICHMENT EM MASSA (consultarReceitaFederal DIRETO)
          const result = await consultarReceitaFederal(base.cnpj);
          
          if (result.success && result.data) {
            // Atualizar dados no banco
            const rawData = (base.raw_data && typeof base.raw_data === 'object' && !Array.isArray(base.raw_data)) 
              ? base.raw_data as Record<string, any>
              : {};
            
            await supabase
              .from('companies')
              .update({
                industry: result.data.atividade_principal?.[0]?.text || base.industry,
                raw_data: {
                  ...rawData,
                  receita_federal: result.data,
                  receita_source: result.source,
                },
              })
              .eq('id', id!);
          }
          
          // Recarregar dados após enriquecimento
          const { data: updated } = await supabase
            .from('companies')
            .select('id, raw_data')
            .eq('id', id!)
            .single();
          
          if (updated) {
            base.raw_data = updated.raw_data;
          }
        } catch (e) {
          console.warn('⚠️ [Auto-Enrich] Falha ao enriquecer:', e);
        }
      }

      // ✅ Buscar relacionamentos separadamente (evita erro 406 com joins)
      let decisionMakers: any[] = base.decision_makers || [];
      let digitalMaturity: any[] = base.digital_maturity || [];
      let insights: any[] = base.insights || [];
      let digitalPresence: any = base.digital_presence || null;

      try {
        const { data: dm } = await supabase.from('decision_makers').select('*').eq('company_id', id!);
        if (dm) decisionMakers = dm;
      } catch (e: any) {
        console.warn('[CompanyDetail] ⚠️ Erro ao buscar decision_makers:', e?.message || e);
      }

      // ✅ Tabelas opcionais - ignorar erros silenciosamente
      try {
        const { data: dm } = await supabase.from('digital_maturity').select('*').eq('company_id', id!);
        if (dm) digitalMaturity = dm;
      } catch (e: any) {
        // Tabela pode não existir - ignorar
      }

      try {
        const { data: ins } = await supabase.from('insights').select('*').eq('company_id', id!);
        if (ins) insights = ins;
      } catch (e: any) {
        // Tabela pode não existir - ignorar
      }

      try {
        const { data: dp } = await supabase.from('digital_presence').select('*').eq('company_id', id!).maybeSingle();
        if (dp) digitalPresence = dp;
      } catch (e: any) {
        // Tabela pode não existir - ignorar
      }

      return {
        ...base,
        decision_makers: decisionMakers,
        digital_maturity: digitalMaturity,
        insights: insights,
        digital_presence: digitalPresence,
      } as any;
    },
    staleTime: 0,
  });

  // 🚨 MICROCICLO 4: Estado canônico da empresa
  const companyState = useCanonicalState({ 
    entity: company, 
    entityType: 'company' 
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ✅ FLUXO OFICIAL: Tratar erros específicos
  if (queryError) {
    const errorMessage = (queryError as any)?.message || '';
    
    // ✅ Se for ID de qualified_prospect, redirecionar para Estoque
    if (errorMessage.includes('QUALIFIED_PROSPECT_ID')) {
      return (
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Empresa ainda no Estoque Qualificado</h2>
          <p className="text-muted-foreground">
            Esta empresa ainda está no Estoque de Empresas Qualificadas. Envie-a para o Banco de Empresas para acessar os detalhes completos.
          </p>
          <Button onClick={() => navigate('/leads/qualified-stock')}>
            Ir para Estoque Qualificado
          </Button>
        </div>
      );
    }
    
    if (errorMessage.includes('EMPREZA_NAO_APROVADA') || errorMessage.includes('não foi aprovada')) {
      return (
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Empresa ainda não aprovada</h2>
          <p className="text-muted-foreground">
            Esta empresa está na quarentena e precisa ser aprovada antes de acessar os detalhes completos.
          </p>
          <Button onClick={() => navigate('/leads/icp-quarantine')}>
            Ir para Quarentena
          </Button>
        </div>
      );
    }
    
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Erro ao carregar empresa</h2>
        <p className="text-muted-foreground">
          {errorMessage || 'Não foi possível carregar os dados da empresa.'}
        </p>
        <Button onClick={() => navigate('/companies')}>
          Voltar para Empresas
        </Button>
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
    // 🚨 MICROCICLO 2: VALIDAÇÃO DE CONTEXTO OBRIGATÓRIA
    const isSalesTarget = isInSalesTargetContext();
    if (!isSalesTarget) {
      toast.error('Enrichment Bloqueado', {
        description: 'Disponível apenas para Leads Aprovados (Sales Target)'
      });
      return;
    }

    setIsSmartRefreshing(true);
    try {
      toast.info('Executando atualização inteligente...');
      
      // ✅ UNIFICADO: Usar consultarReceitaFederal direto (mesmo do EM MASSA)
      if (company.cnpj) {
        const receitaResult = await consultarReceitaFederal(company.cnpj, {
          context: {
            entityType: 'lead',
            leadId: id,
            companyId: id,
          }
        });
        if (receitaResult.success && receitaResult.data) {
          const rawData = (company.raw_data && typeof company.raw_data === 'object') 
            ? company.raw_data as Record<string, any> 
            : {};
          
          await supabase
            .from('companies')
            .update({
              industry: receitaResult.data.atividade_principal?.[0]?.text || company.industry,
              raw_data: {
                ...rawData,
                receita_federal: receitaResult.data,
                receita_source: receitaResult.source,
              },
            })
            .eq('id', id!);
        }
      }

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
    // 🚨 MICROCICLO 2: VALIDAÇÃO DE CONTEXTO OBRIGATÓRIA
    const isSalesTarget = isInSalesTargetContext();
    if (!isSalesTarget) {
      toast.error('Enrichment Bloqueado', {
        description: 'Disponível apenas para Leads Aprovados (Sales Target)'
      });
      return;
    }

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
    // 🚨 MICROCICLO 2: VALIDAÇÃO DE CONTEXTO OBRIGATÓRIA
    const isSalesTarget = isInSalesTargetContext();
    if (!isSalesTarget) {
      toast.error('Enrichment Bloqueado', {
        description: 'Disponível apenas para Leads Aprovados (Sales Target)'
      });
      return;
    }

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

  // 💸 REVELAR CONTATO CORPORATIVO
  const handleRevealCorporateContact = async (decisor: any) => {
    const decisorId = decisor.id;
    setRevealingContacts(prev => new Set(prev).add(decisorId));
    
    try {
      toast.info('💸 Revelando contato corporativo...', {
        description: 'Custo: ~1 crédito'
      });
      
      const result = await revealCorporateContact(
        decisorId,
        decisor.linkedin_url,
        decisor.name,
        company.domain || company.website
      );
      
      if (result.success) {
        toast.success(`✅ Contato corporativo revelado!`, {
          description: `Email: ${result.email || 'N/A'} | Tel: ${result.phone || 'N/A'} | Custo: ${result.cost} crédito(s)`
        });
        
        // Recarregar lista de decisores
        queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      } else {
        toast.error('❌ Contato não disponível', {
          description: result.error
        });
      }
    } catch (error: any) {
      console.error('[REVEAL] ❌ Erro:', error);
      toast.error('Erro ao revelar contato', {
        description: error.message
      });
    } finally {
      setRevealingContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(decisorId);
        return newSet;
      });
    }
  };
  
  // 📱 REVELAR CONTATO PESSOAL
  const handleRevealPersonalContact = async (decisor: any) => {
    const decisorId = decisor.id;
    setRevealingContacts(prev => new Set(prev).add(decisorId));
    
    try {
      toast.info('📱 Revelando contatos pessoais...', {
        description: 'Mobile + Email pessoal | Custo: ~3 créditos'
      });
      
      const result = await revealPersonalContact(
        decisorId,
        decisor.linkedin_url,
        decisor.name,
        company.name
      );
      
      if (result.success) {
        toast.success(`✅ Contatos pessoais revelados!`, {
          description: `Mobile: ${result.mobile || 'N/A'} | Email pessoal: ${result.email || 'N/A'} | Custo: ${result.cost} créditos`
        });
        
        // Recarregar lista de decisores
        queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
      } else {
        toast.error('❌ Contatos pessoais não disponíveis', {
          description: result.error
        });
      }
    } catch (error: any) {
      console.error('[REVEAL-PESSOAL] ❌ Erro:', error);
      toast.error('Erro ao revelar contatos pessoais', {
        description: error.message
      });
    } finally {
      setRevealingContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(decisorId);
        return newSet;
      });
    }
  };

  const handleEnrichApollo = async (apolloOrgId?: string) => {
    setIsEnriching(true);
    try {
      console.log('[CompanyDetail] 🚀 Buscando decisores Apollo para:', company.name);
      console.log('[CompanyDetail] 📋 Apollo Org ID:', apolloOrgId || 'N/A');
      
      // 🔍 DEBUG: Ver dados disponíveis
      console.log('[APOLLO-DEBUG] 🔍 receitaData completo:', receitaData);
      console.log('[APOLLO-DEBUG] 🔍 rawData completo:', rawData);
      console.log('[APOLLO-DEBUG] 🔍 company.city:', company.city);
      console.log('[APOLLO-DEBUG] 🔍 company.state:', company.state);
      console.log('[APOLLO-DEBUG] 🔍 company.zip_code:', (company as any).zip_code);
      console.log('[APOLLO-DEBUG] 🔍 company.fantasy_name:', (company as any).fantasy_name);
      
      // Extrair dados com fallback completo
      const cityToSend = receitaData?.municipio || rawData?.receita_federal?.municipio || company.city;
      const stateToSend = receitaData?.uf || rawData?.receita_federal?.uf || company.state;
      const cepToSend = receitaData?.cep || rawData?.receita_federal?.cep || rawData?.cep || (company as any).zip_code;
      const fantasiaToSend = receitaData?.fantasia || rawData?.receita_federal?.fantasia || rawData?.nome_fantasia || (company as any).fantasy_name;
      
      console.log('[APOLLO-DEBUG] ✅ DADOS QUE SERÃO ENVIADOS:');
      console.log('[APOLLO-DEBUG]    city:', cityToSend);
      console.log('[APOLLO-DEBUG]    state:', stateToSend);
      console.log('[APOLLO-DEBUG]    cep:', cepToSend);
      console.log('[APOLLO-DEBUG]    fantasia:', fantasiaToSend);
      
      toast.info('Buscando decisores no Apollo.io...', {
        description: apolloOrgId ? 'Usando Organization ID manual' : 'Usando filtros inteligentes (CEP + Fantasia)'
      });
      
      // Salvar Apollo Org ID na empresa se fornecido
      if (apolloOrgId) {
        await supabase
          .from('companies')
          .update({ apollo_organization_id: apolloOrgId })
          .eq('id', id);
      }
      
      // Usar função simplificada enrich-apollo-decisores COM FILTROS INTELIGENTES
      const { data, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: id,
          company_name: company.name,
          domain: company.domain || company.website,
          apollo_org_id: apolloOrgId || company.apollo_organization_id,
          modes: ['people', 'company'],
          city: cityToSend,
          state: stateToSend,
          industry: company.industry,
          cep: cepToSend,
          fantasia: fantasiaToSend
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
    // 🚨 MICROCICLO 2: VALIDAÇÃO DE CONTEXTO OBRIGATÓRIA
    const isSalesTarget = isInSalesTargetContext();
    if (!isSalesTarget) {
      toast.error('Enrichment Bloqueado', {
        description: 'Disponível apenas para Leads Aprovados (Sales Target)'
      });
      return;
    }

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
          positions: ['CEO','CTO','CFO','Diretor','Gerente','VP'],
          city: receitaData?.municipio || company.city,
          state: receitaData?.uf || company.state,
          industry: company.industry,
          cep: receitaData?.cep || rawData?.cep,
          fantasia: receitaData?.fantasia || rawData?.nome_fantasia
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

  // ✅ UNIFICADO: Buscar receita_federal (padrão atual) OU receita (legado)
  const receitaData = (company as any)?.raw_data?.receita_federal || (company as any)?.raw_data?.receita;
  const decisors = (company as any)?.decision_makers || [];
  
  console.log('[CompanyDetail] 🏢 receitaData:', receitaData ? 'EXISTE' : 'NULL');
  console.log('[CompanyDetail] 📋 Campos Receita:', receitaData ? Object.keys(receitaData) : 'nenhum');
  console.log('[CompanyDetail] 📊 Decisores carregados:', decisors.length);
  console.log('[CompanyDetail] 📋 Todos decisores:', decisors);
  console.log('[CompanyDetail] 🏢 QSA (Sócios):', receitaData?.qsa || 'NULL');
  console.log('[CompanyDetail] 💼 CNAE:', {
    principal: receitaData?.atividade_principal,
    codigo: receitaData?.atividade_principal?.[0]?.code,
    texto: receitaData?.atividade_principal?.[0]?.text
  });
  const digitalPresence = (company as any)?.digital_presence;
  const rawData = (company as any)?.raw_data || {};
  // ✅ Buscar situação de múltiplos campos possíveis
  const situacaoReceita: string | undefined = receitaData?.situacao || receitaData?.descricao_situacao_cadastral || receitaData?.status;

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
                {/* 🚨 MICROCICLO 4: Badge de Estado Canônico */}
                {company && (
                  <CanonicalStateBadge 
                    state={companyState.currentState}
                    showTooltip={true}
                  />
                )}
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

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => id && company && orchestrateEnrichment({ companyId: id, cnpj: company?.cnpj ?? undefined })}
                          disabled={!id || !company || isEnriching || isOrchestrating}
                          className="relative"
                          title="Enriquecer Empresa (ordem recomendada)"
                        >
                          {isOrchestrating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Target className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enriquecer Empresa (ordem recomendada)</p>
                        <p className="text-xs text-muted-foreground">Lock → Apollo Company → Apollo People → Receita</p>
                      </TooltipContent>
                    </Tooltip>

                    <ApolloOrgIdDialog 
                      onEnrich={handleEnrichApollo}
                      disabled={isEnriching}
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
                    value="decisores" 
                    className="gap-2 data-[state=active]:glass-card data-[state=active]:text-primary"
                  >
                    <Users className="h-4 w-4" />
                    Decisores
                    {decisors.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {decisors.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Decisores e contatos da empresa. Busque e gerencie decisores via Apollo.io
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
                  <CheckCircle className={`h-4 w-4 ${
                    (receitaData?.descricao_situacao_cadastral === 'ATIVA' || 
                     receitaData?.situacao === 'ATIVA' || 
                     receitaData?.status === 'ATIVA') 
                    ? 'text-lime-500' 
                    : 'text-yellow-500'
                  }`} />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Situação</p>
                </div>
                <Badge 
                  variant={
                    (receitaData?.descricao_situacao_cadastral === 'ATIVA' || 
                     receitaData?.situacao === 'ATIVA' || 
                     receitaData?.status === 'ATIVA') 
                    ? 'default' 
                    : 'secondary'
                  } 
                  className={`text-sm px-3 py-1 ${
                    (receitaData?.descricao_situacao_cadastral === 'ATIVA' || 
                     receitaData?.situacao === 'ATIVA' || 
                     receitaData?.status === 'ATIVA')
                    ? 'bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:hover:bg-lime-600' 
                    : 'bg-yellow-600 text-white dark:bg-yellow-500'
                  }`}
                >
                  {receitaData?.descricao_situacao_cadastral || 
                   receitaData?.situacao || 
                   receitaData?.status || 
                   rawData?.situacao_cadastral || 
                   'Pendente'}
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
                  {receitaData?.abertura || receitaData?.data_inicio_atividade || rawData?.data_abertura
                    ? new Date(receitaData?.abertura || receitaData?.data_inicio_atividade || rawData?.data_abertura).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Nome Fantasia</p>
                </div>
                <p className="font-bold text-base">
                  {receitaData?.fantasia || rawData?.nome_fantasia || company.fantasia || 'N/A'}
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

          {/* ✅ CARD 1: Identificação Cadastral - COLAPSÁVEL */}
          <CollapsibleCard
            title="Identificação Cadastral"
            icon={Shield}
            defaultExpanded={true}
          >
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
          </CollapsibleCard>

          {/* Localização + Mapa - Grid 2 Colunas */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* ✅ CARD 2: Localização - COLAPSÁVEL */}
            <CollapsibleCard
              title="Localização Completa"
              icon={MapPin}
              defaultExpanded={true}
            >
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
            </CollapsibleCard>

            {/* ✅ CARD 3: Mapa - COLAPSÁVEL */}
            {receitaData?.cep && (
              <CollapsibleCard
                title="Visualização no Mapa"
                icon={MapPinned}
                defaultExpanded={false}
              >
                  <LocationMap
                    address={receitaData?.logradouro}
                    numero={receitaData?.numero}
                    municipio={receitaData?.municipio}
                    estado={receitaData?.uf}
                    cep={receitaData?.cep}
                  />
              </CollapsibleCard>
            )}
          </div>

          {/* ✅ CARD 4: Contatos - COLAPSÁVEL */}
          <CollapsibleCard
            title="Informações de Contato"
            icon={Phone}
            defaultExpanded={false}
          >
            <div className="space-y-4">
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
            </div>
          </CollapsibleCard>

          {/* ✅ CARD 5: Atividade Econômica - COLAPSÁVEL */}
          <CollapsibleCard
            title="Atividade Econômica"
            icon={Briefcase}
            defaultExpanded={false}
          >
            <div className="space-y-3">
              {/* Info Rápida - 4 Colunas Compactas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 border rounded bg-muted/10">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-1">Setor / Indústria</p>
                  <p className="text-xs font-semibold">
                    {rawData?.apollo_organization?.industry ?? company.industry ?? rawData?.setor_amigavel ?? 'N/A'}
                    {rawData?.apollo_organization?.industry && (
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Fonte: Apollo</span>
                    )}
                  </p>
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

              {/* Atividades Secundárias - Compacto (cnaes_secundarios ou atividades_secundarias da API Brasil/Receita) */}
              {(() => {
                const secundarios = receitaData?.cnaes_secundarios || receitaData?.atividades_secundarias || rawData?.receita_federal?.atividades_secundarias || rawData?.atividades_secundarias || [];
                const lista = Array.isArray(secundarios) ? secundarios : [];
                return (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-primary">Atividades Secundárias</p>
                    {lista.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {lista.map((ativ: any, i: number) => {
                          const codigo = ativ.codigo ?? ativ.code ?? 'N/A';
                          const descricao = ativ.descricao ?? ativ.text ?? 'Sem descrição';
                          return (
                            <div key={i} className="p-2 bg-muted/20 rounded border text-xs">
                              <span className="font-mono font-semibold text-primary">{codigo}</span> - <span className="text-muted-foreground">{descricao}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma atividade secundária cadastrada. Atualize pela Receita Federal para carregar.</p>
                    )}
                  </div>
                );
              })()}

              {/* NCM - Só mostra se tiver */}
              {rawData.cod_ncms_primarios && rawData.cod_ncms_primarios !== 'N/A' && (
                <div className="p-2 bg-muted/20 rounded border">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mb-0.5">Códigos NCM</p>
                  <p className="text-xs font-mono">{rawData.cod_ncms_primarios}</p>
                </div>
              )}
            </div>
          </CollapsibleCard>

          {/* Estrutura Organizacional - Grid 2 Colunas */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* ✅ CARD 6: Quadro Pessoal - COLAPSÁVEL */}
            <CollapsibleCard
              title="Quadro de Pessoal"
              icon={Users}
              defaultExpanded={false}
            >
              <div className="space-y-2">
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
                    <p className="text-sm font-semibold">
                      {(() => {
                        // ✅ Prioridade 1: Dados da Receita Federal (BrasilAPI retorna array de estabelecimentos)
                        const estabelecimentos = receitaData?.estabelecimentos || receitaData?.estabelecimento;
                        if (Array.isArray(estabelecimentos) && estabelecimentos.length > 0) {
                          // Filtrar apenas filiais (excluir a matriz, se presente)
                          const filiais = estabelecimentos.filter((est: any) => 
                            est.identificador_matriz_filial === 2 || // 2 = Filial
                            (est.tipo_unidade && est.tipo_unidade.toLowerCase() === 'filial') ||
                            (est.tipo && est.tipo.toLowerCase() === 'filial')
                          );
                          return filiais.length > 0 ? filiais.length.toString() : '0';
                        }
                        
                        // ✅ Prioridade 2: Campo direto qtd_filiais da Receita Federal
                        if (receitaData?.qtd_filiais || receitaData?.qtd_estabelecimentos) {
                          return (receitaData.qtd_filiais || receitaData.qtd_estabelecimentos).toString();
                        }
                        
                        // ✅ Prioridade 3: rawData (dados já processados)
                        if (rawData.qtd_filiais && rawData.qtd_filiais !== '0' && rawData.qtd_filiais !== 0) {
                          return rawData.qtd_filiais.toString();
                        }
                        
                        // ✅ Fallback: Se tem estabelecimentos mas não são filiais, mostrar total - 1 (matriz)
                        if (Array.isArray(estabelecimentos) && estabelecimentos.length > 1) {
                          return (estabelecimentos.length - 1).toString(); // Total - matriz
                        }
                        
                        return '0';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleCard>

            {/* ✅ CARD 7: Sócios - COLAPSÁVEL */}
            <CollapsibleCard
              title="Sócios e Administradores"
              icon={UserPlus}
              defaultExpanded={false}
            >
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
            </CollapsibleCard>
          </div>

          {/* ✅ CARD 8: Financeiro - COLAPSÁVEL */}
          <CollapsibleCard
            title="Informações Financeiras"
            icon={DollarSign}
            defaultExpanded={false}
          >
            <div className="space-y-3">
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
            </div>
          </CollapsibleCard>

          {/* ❌ REMOVIDO: Card "Decisores & Colaboradores" (redundante e inútil) */}

          {/* ✅ CARD 9: Decisores - COLAPSÁVEL */}
          {decisors.length > 0 && (
            <CollapsibleCard
              title={`Decisores Cadastrados (${decisors.length})`}
              icon={Target}
              defaultExpanded={true}
              className="border-2 border-blue-500/30"
            >
                {console.log('[CompanyDetail] 🎯 Renderizando', decisors.length, 'decisores')}
                
                {/* 🔍 FILTROS AVANÇADOS */}
                <div className="mb-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Filtro Senioridade */}
                    <div>
                      <Label className="text-xs text-slate-400 mb-1.5 block">Senioridade</Label>
                      <Select value={filterSeniority} onValueChange={setFilterSeniority}>
                        <SelectTrigger className="h-9 text-xs bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos ({decisors.length})</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="entry">Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Filtro Departamento */}
                    <div>
                      <Label className="text-xs text-slate-400 mb-1.5 block">Departamento</Label>
                      <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                        <SelectTrigger className="h-9 text-xs bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos ({decisors.length})</SelectItem>
                          <SelectItem value="sales">Vendas</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="engineering">Engenharia</SelectItem>
                          <SelectItem value="finance">Financeiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Filtro Localização */}
                    <div>
                      <Label className="text-xs text-slate-400 mb-1.5 block">Localização</Label>
                      <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger className="h-9 text-xs bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos ({decisors.length})</SelectItem>
                          {Array.from(new Set(decisors.map((d: any) => d.city).filter(Boolean))).map((city: any) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decisors
                    .filter((dec: any) => {
                      if (filterSeniority !== 'ALL' && dec.seniority_level !== filterSeniority) return false;
                      if (filterDepartment !== 'ALL' && !dec.departments?.includes(filterDepartment)) return false;
                      if (filterLocation !== 'ALL' && dec.city !== filterLocation) return false;
                      return true;
                    })
                    .map((dec: any, idx: number) => {
                    console.log('[CompanyDetail] 📋 Decisor', idx, ':', dec);
                    
                    // Gerar iniciais para avatar
                    const initials = (dec.full_name || dec.name || 'NN')
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    
                    return (
                      <div key={dec.id || idx} className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-blue-500/40 hover:border-blue-400/60 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                        {/* Foto + Nome */}
                        <div className="flex items-start gap-3 mb-3">
                          {dec.photo_url ? (
                            <img 
                              src={dec.photo_url} 
                              alt={dec.full_name || dec.name}
                              className="w-12 h-12 rounded-full border-2 border-blue-500/30 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm border-2 border-blue-500/30 ${dec.photo_url ? 'hidden' : ''}`}>
                            {initials}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-white leading-tight">{dec.full_name || dec.name || 'Sem nome'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{dec.position || dec.title || 'Cargo não informado'}</p>
                          </div>
                        </div>
                        
                        {/* Email Bloqueado */}
                        <div className="mb-2 p-2 bg-slate-900/60 rounded border border-slate-700/50">
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-500" />
                            {dec.email ? (
                              <a 
                                href={`mailto:${dec.email}`}
                                className="text-emerald-400 hover:underline"
                              >
                                {dec.email}
                              </a>
                            ) : (
                              <>
                                <span>💸 Email bloqueado</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-5 px-2 text-[10px] ml-auto text-blue-400 hover:text-blue-300 disabled:opacity-50"
                                  onClick={() => handleRevealCorporateContact(dec)}
                                  disabled={revealingContacts.has(dec.id)}
                                >
                                  {revealingContacts.has(dec.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Revelar (~1 💰)'
                                  )}
                                </Button>
                              </>
                            )}
                          </p>
                        </div>
                        
                        {/* Telefone Bloqueado */}
                        <div className="mb-2 p-2 bg-slate-900/60 rounded border border-slate-700/50">
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-500" />
                            {dec.phone ? (
                              <a 
                                href={`tel:${dec.phone}`}
                                className="text-blue-400 hover:underline"
                              >
                                {dec.phone}
                              </a>
                            ) : (
                              <>
                                <span>💸 Tel bloqueado</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-5 px-2 text-[10px] ml-auto text-blue-400 hover:text-blue-300 disabled:opacity-50"
                                  onClick={() => handleRevealCorporateContact(dec)}
                                  disabled={revealingContacts.has(dec.id)}
                                >
                                  {revealingContacts.has(dec.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Revelar (~1 💰)'
                                  )}
                                </Button>
                              </>
                            )}
                          </p>
                        </div>
                        
                        {/* 📱 BOTÃO CONTATOS PESSOAIS (sem revelar fonte) */}
                        <div className="mb-2 p-2 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded border border-cyan-600/50">
                          <p className="text-xs text-cyan-400 flex items-center gap-1.5">
                            <span className="flex-1">📱 Contatos Pessoais</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-5 px-2 text-[10px] text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                              onClick={() => handleRevealPersonalContact(dec)}
                              disabled={revealingContacts.has(dec.id)}
                              title="📱 Revelar mobile + email pessoal"
                            >
                              {revealingContacts.has(dec.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Revelar (~3 💰)'
                              )}
                            </Button>
                          </p>
                          <p className="text-[9px] text-cyan-500/70 mt-1">Mobile + Email pessoal</p>
                        </div>
                        
                        {/* LinkedIn */}
                        {dec.linkedin_url && (
                          <a 
                            href={dec.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                          >
                            🔗 LinkedIn →
                          </a>
                        )}
                       </div>
                     );
                   })}
                </div>
            </CollapsibleCard>
          )}
        </TabsContent>

        {/* TAB: Decisores */}
        <TabsContent value="decisores" className="space-y-4 animate-fade-in">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Decisores da Empresa
                  </CardTitle>
                  <CardDescription>
                    {decisors.length > 0 
                      ? `${decisors.length} decisor(es) cadastrado(s)`
                      : 'Busque decisores no Apollo.io para começar'
                    }
                  </CardDescription>
                </div>
                <DecisionMakerSearchDialog
                  companyId={id!}
                  companyName={company.name || company.razao_social || company.company_name}
                  companyDomain={company.domain || company.website || (rawData as any)?.melhor_site}
                  apolloOrganizationId={(company as any)?.apollo_organization_id || (company as any)?.apollo_id || (rawData as any)?.apollo_id}
                  city={receitaData?.municipio || company.city}
                  country={receitaData?.pais || company.country || 'Brazil'}
                  onPeopleFound={() => {
                    queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
                    queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
                  }}
                  trigger={
                    <Button variant="default" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Buscar Decisores no Apollo
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <DecisionMakersTab companyId={id!} />
            </CardContent>
          </Card>
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
                {/* 🚨 REMOVIDO: UnifiedEnrichButton - Enrichment só permitido em Leads Aprovados (ACTIVE) */}
                {/* Botão não existe se empresa não estiver em ACTIVE */}
                {companyState.isActionAllowed('enrich') ? (
                  <>
                    <UnifiedEnrichButton
                      onQuickRefresh={handleSmartRefresh}
                      onFullEnrich={handleFullEnrichment}
                      onReceita={() => handleEnrichReceita(id!)}
                      onApollo={handleTestApollo}
                      on360={handleFullEnrichment}
                      isProcessing={isSmartRefreshing || isEnriching || isEnrichingReceita || isTestingApollo}
                      hasCNPJ={!!company.cnpj}
                      hasApolloId={!!company.apollo_id}
                      variant="default"
                      size="default"
                    />
                    <Separator />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
                    <p className="font-medium mb-1">Enrichment não disponível</p>
                    <p className="text-xs">Enrichment só é permitido para empresas em ACTIVE (Leads Aprovados).</p>
                    <p className="text-xs mt-1">Estado atual: <strong>{companyState.currentState}</strong></p>
                  </div>
                )}

                {/* Botões de decisores mantidos abaixo */}
                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Ferramentas Adicionais</p>

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
                  {companyState.isActionAllowed('enrich') && (
                    <>
                      <UpdateNowButton
                        companyId={id!}
                        companyName={company.name}
                        companyDomain={company.domain || company.website}
                        apolloOrganizationId={company.apollo_organization_id}
                        city={receitaData?.municipio || rawData?.receita_federal?.municipio || company.city}
                        state={receitaData?.uf || rawData?.receita_federal?.uf || company.state}
                        cep={receitaData?.cep || rawData?.receita_federal?.cep || rawData?.cep || (company as any).zip_code}
                        fantasia={receitaData?.fantasia || rawData?.receita_federal?.fantasia || rawData?.nome_fantasia || (company as any).fantasy_name}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
                          queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
                        }}
                      />
                      <AutoEnrichButton />
                    </>
                  )}
                  {/* 🚨 REMOVIDO: AutoEnrichButton quando não estiver em ACTIVE */}
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
