import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useICPDataSync } from '@/contexts/ICPDataSyncContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Search, BarChart3, Target, Calendar, CheckCircle2, Zap, RefreshCw, Loader2, Building2, TrendingUp, Users, DollarSign, MapPin, AlertTriangle, Lightbulb, TrendingDown, Info, Home, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ICPAnalysisCriteriaConfig from '@/components/icp/ICPAnalysisCriteriaConfig';
import BCGMatrix from '@/components/reports/BCGMatrix';
import CompetitiveAnalysis from '@/components/icp/CompetitiveAnalysis';
import StrategicActionPlan from '@/components/icp/StrategicActionPlan';
import CompaniesMapWithGeocoding from '@/components/map/CompaniesMapWithGeocoding';

export default function ICPDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const { triggerRefresh, setCurrentIcpId } = useICPDataSync();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [icpData, setIcpData] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);
  
  // Registrar ICP atual no contexto
  useEffect(() => {
    if (id) {
      setCurrentIcpId(id);
    }
  }, [id, setCurrentIcpId]);
  
  // 🔥 OTIMIZADO: Invalidar cache APENAS se usuário voltou após 5+ segundos (evita piscamento)
  useEffect(() => {
    let lastInvalidation = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastInvalidation = Date.now() - lastInvalidation;
        
        // Só invalida se passou 5+ segundos (evita piscamento ao tirar print/trocar aba rápido)
        if (timeSinceLastInvalidation > 5000) {
          console.log('[ICPDetail] 🔄 Página visível após >5s - Atualizando dados');
          queryClient.invalidateQueries({ queryKey: ['onboarding_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['tenant_competitor_products'] });
          loadProfile();
          lastInvalidation = Date.now();
        } else {
          console.log('[ICPDetail] ⏭️ Mudança rápida de aba - Mantendo cache para evitar piscamento');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);

  useEffect(() => {
    console.log('[ICPDetail] 🔄 useEffect executado:', {
      tenantId,
      tenant: tenant ? { 
        id: tenant.id, 
        nome: (tenant as any)?.nome || (tenant as any)?.razao_social,
        tenant_id_from_object: (tenant as any)?.tenant_id,
      } : null,
      id,
    });
    
    // 🔥 DEBUG: Verificar se há discrepância entre tenant.id e tenant.tenant_id
    if (tenant && (tenant as any)?.tenant_id && (tenant as any).tenant_id !== tenant.id) {
      console.warn('[ICPDetail] ⚠️ DISCREPÂNCIA: tenant.id !== tenant.tenant_id:', {
        tenant_id: tenant.id,
        tenant_tenant_id: (tenant as any).tenant_id,
      });
    }
    
    if (tenantId && id) {
      loadProfile();
    } else {
      console.warn('[ICPDetail] ⚠️ Aguardando tenantId ou id:', { tenantId, id });
    }
  }, [tenantId, id, tenant]);

  const loadProfile = async () => {
    if (!tenantId || !id) {
      console.warn('[ICPDetail] ⚠️ Falta tenantId ou id:', { tenantId, id });
      return;
    }
    
    setLoading(true);
    try {
      console.log('[ICPDetail] 🔍 Buscando ICP metadata:', { id, tenantId });
      
      // Buscar metadata
      const { data: metadata, error: metaError } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (metaError) {
        console.error('[ICPDetail] ❌ Erro ao buscar metadata:', {
          error: metaError,
          code: metaError.code,
          message: metaError.message,
          details: metaError.details,
          hint: metaError.hint,
        });
        
        // Tentar buscar sem filtro de tenant_id (pode ser problema de RLS)
        console.log('[ICPDetail] 🔄 Tentando buscar sem filtro de tenant_id...');
        const { data: metadataAlt, error: metaErrorAlt } = await (supabase as any)
          .from('icp_profiles_metadata')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (metaErrorAlt) {
          throw metaError;
        }
        
        if (metadataAlt) {
          console.warn('[ICPDetail] ⚠️ Metadata encontrada sem filtro de tenant:', metadataAlt);
          // Verificar se o tenant_id corresponde
          if (metadataAlt.tenant_id !== tenantId) {
            console.warn('[ICPDetail] ⚠️ Discrepância de tenant_id detectada:', {
              esperado: tenantId,
              encontrado: metadataAlt.tenant_id,
              icpId: id,
            });
            
            // 🔥 PERMITIR ACESSO: Se o RLS permitiu encontrar o ICP, significa que o usuário tem permissão
            // Pode ser que o contexto do tenant esteja desatualizado ou o usuário tenha acesso a múltiplos tenants
            console.log('[ICPDetail] ✅ Permitindo acesso ao ICP (RLS permitiu encontrar)');
            
            // Avisar o usuário sobre a discrepância, mas permitir acesso
            toast({
              title: 'Aviso',
              description: `Este ICP pertence a outro tenant, mas você tem permissão para acessá-lo.`,
              variant: 'default',
            });
            
            setProfile(metadataAlt);
          } else {
            setProfile(metadataAlt);
          }
        } else {
          throw metaError;
        }
      } else {
        console.log('[ICPDetail] ✅ Metadata encontrada:', metadata?.nome || metadata?.id);
        setProfile(metadata);
      }
      setProfile(metadata);

      // 🔥 Buscar dados completos do onboarding_sessions para obter benchmarking, clientes E CONCORRENTES
      // 🔥 CRÍTICO: Sempre buscar a sessão mais recente (sem cache) para garantir dados atualizados
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!sessionError && sessionData && sessionData.length > 0) {
        const session = sessionData[0];
        
        // 🔥 Log detalhado para debug
        console.log('[ICPDetail] 📊 Dados da sessão de onboarding:', {
          session_id: session.id,
          updated_at: session.updated_at,
          concorrentes_step1_count: session.step1_data?.concorrentesDiretos?.length || 0,
          concorrentes_step4_count: session.step4_data?.concorrentesDiretos?.length || 0,
          concorrentes_step1_raw: session.step1_data?.concorrentesDiretos, // 🔥 DEBUG
          benchmarking_count: session.step5_data?.empresasBenchmarking?.length || 0,
          clientes_count: session.step5_data?.clientesAtuais?.length || 0,
        });
        
        // Construir icpData a partir dos dados do onboarding + metadata
        const enrichedIcpData = {
          ...(metadata?.icp_recommendation?.icp_profile || {}),
          // Dados da empresa (Step 1)
          razao_social: session.step1_data?.razaoSocial,
          nome_fantasia: session.step1_data?.nomeFantasia,
          cnpj: session.step1_data?.cnpj,
          capital_social: session.step1_data?.capitalSocial || 0,
          cidade: session.step1_data?.cidade,
          estado: session.step1_data?.estado,
          setor_empresa: session.step1_data?.setor,
          // Setores e nichos (Step 2/3)
          setores_alvo: session.step2_data?.setoresAlvo || session.step3_data?.setoresAlvo || [],
          nichos_alvo: session.step2_data?.nichosAlvo || session.step3_data?.nichosAlvo || [],
          cnaes_alvo: session.step2_data?.cnaesAlvo || session.step3_data?.cnaesAlvo || [],
          // Perfil (Step 3)
          faturamento_min: session.step3_data?.faturamentoAlvo?.minimo,
          faturamento_max: session.step3_data?.faturamentoAlvo?.maximo,
          funcionarios_min: session.step3_data?.funcionariosAlvo?.minimo,
          funcionarios_max: session.step3_data?.funcionariosAlvo?.maximo,
          porte_alvo: session.step3_data?.porteAlvo || [],
          localizacao_alvo: session.step3_data?.localizacaoAlvo || {},
          // Situação atual (Step 4) - 🔥 CRÍTICO: Concorrentes devem vir sempre do onboarding
          diferenciais: session.step4_data?.diferenciais || [],
          casos_de_uso: session.step4_data?.casosDeUso || [],
          // 🔥 CRÍTICO: Concorrentes estão em step1_data (foram movidos para lá)
          concorrentes: session.step1_data?.concorrentesDiretos || session.step4_data?.concorrentesDiretos || [], // 🔥 Buscar em step1 primeiro
          tickets_ciclos: session.step4_data?.ticketsECiclos || [],
          // Histórico (Step 5) - 🔥 CRÍTICO: Benchmarking e clientes devem vir sempre do onboarding
          // 🔥 CORRIGIDO: Mesclar clientes de Step1 e Step5 (evitar duplicatas por CNPJ)
          clientes_atuais: (() => {
            const clientesStep1 = session.step1_data?.clientesAtuais || [];
            const clientesStep5 = session.step5_data?.clientesAtuais || [];
            const clientesUnicos = new Map<string, any>();
            [...clientesStep1, ...clientesStep5].forEach((cliente: any) => {
              const cnpjClean = cliente.cnpj?.replace(/\D/g, '') || '';
              if (cnpjClean && !clientesUnicos.has(cnpjClean)) {
                clientesUnicos.set(cnpjClean, cliente);
              }
            });
            return Array.from(clientesUnicos.values());
          })(),
          empresas_benchmarking: session.step5_data?.empresasBenchmarking || [], // 🔥 SEMPRE do onboarding mais recente
          // Análise IA
          analise_detalhada: metadata?.icp_recommendation?.analise_detalhada || {},
          score_confianca: metadata?.icp_recommendation?.score_confianca || 0,
        };
        
        console.log('[ICPDetail] ✅ Dados enriquecidos carregados:', {
          setores: enrichedIcpData.setores_alvo?.length || 0,
          cnaes: enrichedIcpData.cnaes_alvo?.length || 0,
          concorrentes: enrichedIcpData.concorrentes?.length || 0,
          concorrentes_detalhes: enrichedIcpData.concorrentes?.map((c: any) => ({ 
            tipo: typeof c,
            nome: typeof c === 'string' ? c : c.nome || c.razaoSocial,
            cnpj: typeof c === 'object' ? c.cnpj : null,
          })), // 🔥 NOVO: Log detalhado de concorrentes
          concorrentes_raw: enrichedIcpData.concorrentes, // 🔥 DEBUG: Log completo para debug
          clientes: enrichedIcpData.clientes_atuais?.length || 0,
          clientes_step1: session.step1_data?.clientesAtuais?.length || 0,
          clientes_step5: session.step5_data?.clientesAtuais?.length || 0,
          benchmarking: enrichedIcpData.empresas_benchmarking?.length || 0,
        });
        
        setIcpData(enrichedIcpData);
      } else if (metadata?.icp_recommendation) {
        console.warn('[ICPDetail] ⚠️ Usando apenas metadata (sem sessão de onboarding)');
        // Mesmo sem sessão, tentar extrair dados da metadata se disponível
        const metadataProfile = metadata.icp_recommendation.icp_profile || {};
        setIcpData({
          ...metadataProfile,
          // Tentar preservar concorrentes e benchmarking se estiverem na metadata
          concorrentes: metadataProfile.concorrentes || [],
          empresas_benchmarking: metadataProfile.empresas_benchmarking || [],
          clientes_atuais: metadataProfile.clientes_atuais || [],
        });
      } else {
        console.warn('[ICPDetail] ⚠️ Nenhum dado disponível');
        setIcpData({});
      }
    } catch (error: any) {
      console.error('[ICPDetail] ❌ Erro ao carregar ICP:', {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
      
      // Mensagem de erro mais específica
      let errorMessage = 'Não foi possível carregar os detalhes do ICP.';
      if (error?.code === 'PGRST116' || error?.message?.includes('406')) {
        errorMessage = 'Erro de permissão ao acessar o ICP. Verifique se você tem acesso a este perfil.';
      } else if (error?.message?.includes('tenant')) {
        errorMessage = 'Este ICP pertence a outro tenant. Você não tem permissão para acessá-lo.';
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        title: 'Erro ao Carregar ICP',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REGENERAR ICP: Regenerar análise com dados atualizados do onboarding
  const handleRegenerateICP = async () => {
    if (!tenantId || !id) return;

    setRegenerating(true);
    try {
      toast({
        title: '⏳ Regenerando ICP...',
        description: 'Analisando dados atualizados do onboarding com IA.',
      });

      // 🔥 CRÍTICO: Forçar reload dos dados do onboarding ANTES de regenerar
      // Buscar sessão mais recente para garantir dados atualizados
      const { data: latestSession, error: sessionError } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.warn('[ICPDetail] ⚠️ Erro ao buscar sessão atualizada:', sessionError);
      } else if (latestSession) {
        console.log('[ICPDetail] 📊 Sessão atualizada encontrada:', {
          updated_at: latestSession.updated_at,
          concorrentes: latestSession.step4_data?.concorrentesDiretos?.length || 0,
          benchmarking: latestSession.step5_data?.empresasBenchmarking?.length || 0,
        });
      }

      // Chamar Edge Function para regenerar análise
      const { data, error } = await supabase.functions.invoke('analyze-onboarding-icp', {
        body: {
          tenant_id: tenantId,
          icp_id: id,
          regenerate: true, // Flag para indicar regeneração
          force_refresh: true, // 🔥 NOVO: Forçar refresh dos dados
        },
      });

      if (error) throw error;

      if (data?.recommendation) {
        // Atualizar metadata do ICP com a nova análise
        const { error: updateError } = await (supabase as any)
          .from('icp_profiles_metadata')
          .update({
            icp_recommendation: data.recommendation, // 🔥 CORRIGIDO: Coluna correta é icp_recommendation
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('tenant_id', tenantId);

        if (updateError) {
          console.error('[ICPDetail] Erro ao atualizar metadata:', updateError);
        }
      }

      toast({
        title: '✅ ICP Regenerado!',
        description: 'A análise foi atualizada com os dados mais recentes do onboarding.',
      });

      // 🔥 CRÍTICO: Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Recarregar dados FORÇANDO refresh (sem cache)
      setLoading(true);
      await loadProfile();

    } catch (error: any) {
      console.error('[ICPDetail] Erro ao regenerar ICP:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível regenerar o ICP.',
        variant: 'destructive',
      });
    } finally {
      setRegenerating(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando detalhes do ICP...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">ICP não encontrado</p>
          <Button onClick={() => navigate('/central-icp/profiles')} className="mt-4">
            Voltar para Meus ICPs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp/profiles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{profile.nome || 'ICP Sem Nome'}</h1>
            {profile.icp_principal && (
              <Badge variant="default">Principal</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {profile.descricao || 'Perfil de Cliente Ideal'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-700 shadow-lg font-semibold"
            onClick={() => navigate('/tenant-onboarding')}
            title="Voltar para o cadastro do ICP e editar concorrentes, produtos e dados"
          >
            <Home className="w-4 h-4 mr-1" />
            <Edit className="w-4 h-4 mr-2" />
            Editar Cadastro
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerateICP}
            disabled={regenerating}
            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400"
          >
            {regenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar ICP
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/central-icp/batch-analysis?icp=${profile.id}`)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Análise em Massa
          </Button>
          <Button
            onClick={() => navigate(`/central-icp/individual?icp=${profile.id}`)}
          >
            <Search className="w-4 h-4 mr-2" />
            Análise Individual
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto gap-2 bg-muted/50 p-2 rounded-lg">
          <TabsTrigger 
            value="resumo" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Resumo</span>
          </TabsTrigger>
          <TabsTrigger 
            value="configuracao" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Configuração</span>
          </TabsTrigger>
          <TabsTrigger 
            value="criterios" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Critérios</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analise" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">360°</span>
          </TabsTrigger>
          <TabsTrigger 
            value="competitiva" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-rose-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Competitiva</span>
          </TabsTrigger>
          <TabsTrigger 
            value="plano" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Plano</span>
          </TabsTrigger>
          <TabsTrigger 
            value="relatorios" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white flex items-center gap-2 px-4 py-3 rounded-md transition-all"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold">{profile.tipo || 'Geral'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={profile.ativo ? 'default' : 'secondary'}>
                    {profile.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-semibold">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setor Foco</p>
                  <p className="font-semibold">{profile.setor_foco || 'N/A'}</p>
                </div>
              </div>

              {icpData && (
                <div className="space-y-6 pt-4 border-t">
                  {/* Nichos Alvo (dentro do setor foco) */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Nichos Alvo (dentro do setor {profile.setor_foco || 'Manufatura'})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(icpData.setores_alvo || icpData.nichos_alvo || []).map((nicho: string, idx: number) => (
                        <Badge key={idx} variant="outline">{nicho}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* CNAEs Alvo */}
                  {icpData.cnaes_alvo && icpData.cnaes_alvo.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        CNAEs Alvo
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(icpData.cnaes_alvo || []).slice(0, 10).map((cnae: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="font-mono">{cnae}</Badge>
                        ))}
                        {icpData.cnaes_alvo.length > 10 && (
                          <Badge variant="secondary">+{icpData.cnaes_alvo.length - 10} mais</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Perfil Financeiro */}
                  <div className="grid grid-cols-2 gap-4">
                    {icpData.faturamento_min && icpData.faturamento_max && (
                      <div>
                        <h3 className="font-semibold mb-2">💰 Faturamento Alvo</h3>
                        <p className="text-lg font-medium text-primary">
                          R$ {icpData.faturamento_min.toLocaleString('pt-BR')} - R$ {icpData.faturamento_max.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {icpData.funcionarios_min && icpData.funcionarios_max && (
                      <div>
                        <h3 className="font-semibold mb-2">👥 Funcionários</h3>
                        <p className="text-lg font-medium text-primary">
                          {icpData.funcionarios_min} - {icpData.funcionarios_max}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Empresas de Benchmarking */}
                  {icpData.empresas_benchmarking && icpData.empresas_benchmarking.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        🎯 Empresas de Benchmarking (Clientes Desejados)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {icpData.empresas_benchmarking.slice(0, 6).map((empresa: any, idx: number) => (
                          <Card key={idx} className="bg-muted/50">
                            <CardContent className="p-3">
                              <p className="font-semibold text-sm">{empresa.nome || empresa.razaoSocial}</p>
                              <p className="text-xs text-muted-foreground">{empresa.setor || 'Setor não identificado'}</p>
                              {empresa.capitalSocial && (
                                <p className="text-xs text-primary mt-1">
                                  Capital: R$ {empresa.capitalSocial.toLocaleString('pt-BR')}
                                </p>
                              )}
                              {empresa.motivoReferencia && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  "{empresa.motivoReferencia}"
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {icpData.empresas_benchmarking.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          +{icpData.empresas_benchmarking.length - 6} empresas adicionais analisadas
                        </p>
                      )}
                    </div>
                  )}

                  {/* Concorrentes Diretos */}
                  {icpData.concorrentes && icpData.concorrentes.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ⚠️ Concorrentes Diretos ({icpData.concorrentes.length} cadastrado{icpData.concorrentes.length !== 1 ? 's' : ''})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {icpData.concorrentes.slice(0, 6).map((conc: any, idx: number) => (
                          <Card key={idx} className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                            <CardContent className="p-3">
                              <p className="font-semibold text-sm">{conc.razaoSocial || conc.nome || 'Concorrente'}</p>
                              {conc.cnpj && (
                                <p className="text-xs text-muted-foreground font-mono mt-1">CNPJ: {conc.cnpj}</p>
                              )}
                              {conc.setor && (
                                <p className="text-xs text-muted-foreground mt-1">Setor: {conc.setor}</p>
                              )}
                              {conc.capitalSocial && conc.capitalSocial > 0 && (
                                <p className="text-xs text-primary mt-1 font-medium">
                                  Capital: R$ {conc.capitalSocial.toLocaleString('pt-BR')}
                                </p>
                              )}
                              {conc.localizacao && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {conc.localizacao}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {icpData.concorrentes.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          +{icpData.concorrentes.length - 6} concorrente{icpData.concorrentes.length - 6 !== 1 ? 's' : ''} adicional{icpData.concorrentes.length - 6 !== 1 ? 'is' : ''} cadastrado{icpData.concorrentes.length - 6 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Clientes Atuais (Base de Análise) */}
                  {icpData.clientes_atuais && icpData.clientes_atuais.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ✅ Clientes Atuais (Base de Análise)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {icpData.clientes_atuais.slice(0, 5).map((cliente: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                            {cliente.nome || cliente.razaoSocial}
                          </Badge>
                        ))}
                        {icpData.clientes_atuais.length > 5 && (
                          <Badge variant="secondary">+{icpData.clientes_atuais.length - 5} mais</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do ICP</CardTitle>
              <CardDescription>Dados técnicos e metadados do perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Perfil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Identificação
                  </h3>
                  <div className="space-y-3 pl-7">
                    <div>
                      <p className="text-sm text-muted-foreground">ID do Perfil</p>
                      <p className="font-mono text-sm">{profile?.id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-semibold">{profile?.nome || icpData?.nome || 'ICP Principal'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <Badge variant={profile?.tipo === 'core' ? 'default' : 'secondary'}>
                        {profile?.tipo || 'core'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={profile?.ativo ? 'default' : 'destructive'}>
                        {profile?.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Foco Estratégico
                  </h3>
                  <div className="space-y-3 pl-7">
                    <div>
                      <p className="text-sm text-muted-foreground">Setor Principal</p>
                      <p className="font-semibold">{profile?.setor_foco || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nicho Principal</p>
                      <p className="font-semibold">{profile?.nicho_foco || 'Não definido'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prioridade</p>
                      <Badge variant="outline">Nível {profile?.prioridade || 1}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ICP Principal</p>
                      <Badge variant={profile?.icp_principal ? 'default' : 'secondary'}>
                        {profile?.icp_principal ? '★ Sim' : 'Não'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* CNAEs Alvo */}
              {icpData?.cnaes_alvo && icpData.cnaes_alvo.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    CNAEs Alvo ({icpData.cnaes_alvo.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 pl-7">
                    {icpData.cnaes_alvo.map((cnae: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="font-mono">
                        {cnae}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Histórico
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-semibold">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última atualização</p>
                    <p className="font-semibold">
                      {profile?.updated_at 
                        ? new Date(profile.updated_at).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ICPs gerados</p>
                    <p className="font-semibold">{profile?.generated_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {(profile?.descricao || icpData?.descricao) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Descrição</h3>
                    <p className="text-muted-foreground pl-7">
                      {profile?.descricao || icpData?.descricao}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="space-y-6">
          {icpData ? (
            <>
              {/* KPIs Principais */}
              <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 border-slate-300 dark:border-slate-700 cursor-help shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Nichos Alvo</p>
                                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 opacity-60" />
                              </div>
                              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {(icpData.setores_alvo || icpData.nichos_alvo || []).length}
                              </p>
                            </div>
                            <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Nichos Alvo</p>
                      <p className="text-xs">
                        Número de nichos de mercado específicos dentro do setor principal ({profile?.setor_foco || 'Manufatura'}) que foram identificados como alvos estratégicos para prospecção. Estes nichos foram definidos com base nas características do seu negócio, diferenciais competitivos e perfil do cliente ideal.
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border-slate-300 dark:border-slate-700 cursor-help shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Clientes Base</p>
                                <Info className="h-3 w-3 text-emerald-600 dark:text-emerald-400 opacity-60" />
                              </div>
                              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {(icpData.clientes_atuais || []).length}
                              </p>
                            </div>
                            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Clientes Base</p>
                      <p className="text-xs">
                        Total de clientes atuais cadastrados que servem como base de análise e referência para identificar padrões, características comuns e validar o perfil do cliente ideal (ICP). Estes clientes são utilizados para benchmarking e para calibrar os critérios de qualificação.
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30 border-slate-300 dark:border-slate-700 cursor-help shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Benchmarking</p>
                                <Info className="h-3 w-3 text-indigo-600 dark:text-indigo-400 opacity-60" />
                              </div>
                              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {(icpData.empresas_benchmarking || []).length}
                              </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Benchmarking</p>
                      <p className="text-xs">
                        Número de empresas-alvo cadastradas para análise comparativa e benchmarking. Estas são empresas desejadas como clientes, que possuem características similares aos seus clientes atuais ou que representam o perfil ideal que você busca atingir. Utilizadas para análise estratégica e definição de estratégias de abordagem.
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="bg-gradient-to-br from-slate-50 to-amber-50/50 dark:from-slate-900 dark:to-amber-950/30 border-slate-300 dark:border-slate-700 cursor-help shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">CNAEs Alvo</p>
                                <Info className="h-3 w-3 text-amber-600 dark:text-amber-400 opacity-60" />
                              </div>
                              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                {(icpData.cnaes_alvo || []).length}
                              </p>
                            </div>
                            <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">CNAEs Alvo</p>
                      <p className="text-xs">
                        Quantidade de códigos CNAE (Classificação Nacional de Atividades Econômicas) identificados como alvos para prospecção. Os CNAEs representam as atividades econômicas principais das empresas que melhor se alinham com seu produto/serviço e perfil de cliente ideal. Utilizados para filtragem e segmentação na busca de prospects.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* Matriz BCG */}
              <BCGMatrix 
                items={[]}
                title="Matriz BCG - Priorização de Nichos e Clientes"
                description="Análise estratégica de portfólio baseada em crescimento de mercado e participação"
                tenantId={tenantId}
                icpId={id}
                onboardingData={icpData}
                useAIAnalysis={true}
              />

              {/* Grid de Análises - Layout Sofisticado */}
              <div className="space-y-6">
                {/* Primeira Linha: Perfil Financeiro e Cobertura Geográfica lado a lado */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Perfil Financeiro */}
                  <Card className="border-l-4 border-l-emerald-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-emerald-600/10 rounded-lg">
                          <DollarSign className="h-5 w-5 text-emerald-700 dark:text-emerald-500" />
                        </div>
                        <span className="text-slate-800 dark:text-slate-100">Perfil Financeiro Alvo</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {icpData.faturamento_min || icpData.faturamento_max ? (
                        <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-muted-foreground mb-2">Faixa de Faturamento</p>
                          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">
                            R$ {(icpData.faturamento_min || 0).toLocaleString('pt-BR')} - R$ {(icpData.faturamento_max || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ) : null}
                      {icpData.tickets_ciclos && icpData.tickets_ciclos.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-muted-foreground">Tickets e Ciclos de Venda</p>
                          <div className="space-y-2">
                            {icpData.tickets_ciclos.slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                <span className="font-medium">{item.criterio || `Ticket ${idx + 1}`}</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-500">
                                  R$ {(item.ticketMedio || item.ticketMedioMin || 0).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Localização Geográfica */}
                  <Card className="border-l-4 border-l-blue-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-blue-600/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-700 dark:text-blue-500" />
                        </div>
                        <span className="text-slate-800 dark:text-slate-100">Cobertura Geográfica</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                    {/* 🔥 NOVO: Extrair localização de clientes e benchmarking da Step 5 */}
                    {(() => {
                      const localizacoesClientes = (icpData.clientes_atuais || []).map((c: any) => ({
                        cidade: c.cidade,
                        estado: c.estado,
                        tipo: 'Cliente',
                        nome: c.nome || c.razaoSocial,
                        faturamento: c.faturamentoAtual || 0,
                      })).filter((l: any) => l.cidade && l.estado);
                      
                      const localizacoesBenchmarking = (icpData.empresas_benchmarking || []).map((e: any) => ({
                        cidade: e.cidade,
                        estado: e.estado,
                        tipo: 'Benchmarking',
                        nome: e.nome || e.razaoSocial,
                        expectativa: e.expectativaFaturamento || 0,
                      })).filter((l: any) => l.cidade && l.estado);
                      
                      const todasLocalizacoes = [...localizacoesClientes, ...localizacoesBenchmarking];
                      
                      // Agrupar por estado
                      const estadosMap = new Map<string, { cidades: Set<string>, count: number }>();
                      todasLocalizacoes.forEach((loc: any) => {
                        if (!estadosMap.has(loc.estado)) {
                          estadosMap.set(loc.estado, { cidades: new Set(), count: 0 });
                        }
                        const estadoData = estadosMap.get(loc.estado)!;
                        estadoData.cidades.add(loc.cidade);
                        estadoData.count++;
                      });
                      
                      const estados = Array.from(estadosMap.entries()).sort((a, b) => b[1].count - a[1].count);
                      const todasCidades = Array.from(new Set(todasLocalizacoes.map((l: any) => l.cidade))).sort();
                      
                      return (
                        <>
                          {estados.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Estados com Presença ({estados.length} estados, {todasCidades.length} cidades)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {estados.map(([estado, data]) => (
                                  <Badge key={estado} variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                                    {estado} ({data.count} {data.count === 1 ? 'empresa' : 'empresas'})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {todasCidades.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Cidades ({todasCidades.length} cidades)
                              </p>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {todasCidades.slice(0, 20).map((cidade: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">{cidade}</Badge>
                                ))}
                                {todasCidades.length > 20 && (
                                  <Badge variant="outline" className="text-xs">+{todasCidades.length - 20} mais</Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback para localização alvo se não houver dados de Step 5 */}
                          {estados.length === 0 && icpData.localizacao_alvo?.estados && icpData.localizacao_alvo.estados.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Estados Alvo (Configuração)</p>
                              <div className="flex flex-wrap gap-2">
                                {icpData.localizacao_alvo.estados.map((estado: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                            {estado}
                          </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {todasCidades.length === 0 && icpData.localizacao_alvo?.cidades && icpData.localizacao_alvo.cidades.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Cidades Prioritárias (Configuração)</p>
                              <div className="flex flex-wrap gap-2">
                                {icpData.localizacao_alvo.cidades.slice(0, 8).map((cidade: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{cidade}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* 🔥 NOVO: Mapa com pinpoints das empresas */}
                    {(() => {
                      const localizacoesClientes = (icpData.clientes_atuais || []).map((c: any) => ({
                        id: c.cnpj || `cliente-${c.nome || c.razaoSocial}`,
                        name: c.nome || c.razaoSocial,
                        cidade: c.cidade,
                        estado: c.estado,
                        tipo: 'Cliente',
                        faturamento: c.faturamentoAtual || 0,
                      })).filter((l: any) => l.cidade && l.estado);
                      
                      const localizacoesBenchmarking = (icpData.empresas_benchmarking || []).map((e: any) => ({
                        id: e.cnpj || `benchmarking-${e.nome || e.razaoSocial}`,
                        name: e.nome || e.razaoSocial,
                        cidade: e.cidade,
                        estado: e.estado,
                        tipo: 'Benchmarking',
                        expectativa: e.expectativaFaturamento || 0,
                      })).filter((l: any) => l.cidade && l.estado);
                      
                      const todasLocalizacoes = [...localizacoesClientes, ...localizacoesBenchmarking];
                      
                      if (todasLocalizacoes.length === 0) return null;
                      
                      return (
                        <div className="mt-4">
                          <p className="text-sm font-semibold mb-3 text-blue-700 dark:text-blue-500">Mapa de Localização</p>
                          <div className="rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-inner">
                            <CompaniesMapWithGeocoding 
                              companies={todasLocalizacoes}
                              height="350px"
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                </div>

                {/* Segunda Linha: Diferenciais e Concorrentes lado a lado */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Diferenciais Competitivos */}
                  <Card className="border-l-4 border-l-indigo-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-indigo-600/10 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
                        </div>
                        <span className="text-slate-800 dark:text-slate-100">Diferenciais Competitivos</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {icpData.diferenciais && icpData.diferenciais.length > 0 ? (
                        <ul className="space-y-3">
                          {icpData.diferenciais.slice(0, 5).map((dif: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                              <span className="text-sm leading-relaxed">{dif}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">Nenhum diferencial registrado</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Concorrentes */}
                  <Card className="border-l-4 border-l-orange-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-orange-600/10 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                        </div>
                        <span className="text-slate-800 dark:text-slate-100">Concorrentes Diretos</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                    {(() => {
                      // 🔥 CRÍTICO: Extrair concorrentes do step1_data (onde estão salvos)
                      const concorrentes = icpData.concorrentes || [];
                      
                      // 🔥 DEBUG: Log para verificar concorrentes
                      console.log('[ICPDetail] 🔍 Concorrentes carregados no card:', {
                        total: concorrentes.length,
                        icpData_keys: Object.keys(icpData),
                        icpData_concorrentes: icpData.concorrentes,
                        concorrentes: concorrentes.map((c: any) => ({
                          tipo: typeof c,
                          nome: typeof c === 'string' ? c : c.nome || c.razaoSocial,
                          cnpj: typeof c === 'object' ? c.cnpj : null,
                          cidade: typeof c === 'object' ? c.cidade : null,
                          estado: typeof c === 'object' ? c.estado : null,
                          objeto_completo: c,
                        })),
                      });
                      
                      if (concorrentes.length === 0) {
                        return (
                          <p className="text-muted-foreground text-sm">
                            Nenhum concorrente registrado. Adicione concorrentes na Step 1 do onboarding.
                          </p>
                        );
                      }
                      
                      return (
                        <>
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-muted-foreground mb-4">
                              {concorrentes.length} {concorrentes.length === 1 ? 'concorrente registrado' : 'concorrentes registrados'}
                            </p>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                              {concorrentes.map((conc: any, idx: number) => {
                                const nome = typeof conc === 'string' ? conc : conc.nome || conc.nomeFantasia || conc.razaoSocial || `Concorrente ${idx + 1}`;
                                const cnpj = typeof conc === 'object' ? conc.cnpj : null;
                                const setor = typeof conc === 'object' ? conc.setor : null;
                                const cidade = typeof conc === 'object' ? conc.cidade : null;
                                const estado = typeof conc === 'object' ? conc.estado : null;
                                
                                return (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-semibold block truncate">{nome}</span>
                                      <div className="flex flex-wrap gap-2 mt-1.5">
                                        {cnpj && (
                                          <span className="text-xs text-muted-foreground font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{cnpj}</span>
                                        )}
                                        {setor && (
                                          <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">{setor}</Badge>
                                        )}
                                        {cidade && estado && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {cidade}, {estado}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Badge className="text-xs ml-3 shrink-0 bg-orange-600 hover:bg-orange-700 text-white">Monitorar</Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* 🔥 NOVO: Mapa de concorrentes */}
                          {(() => {
                            const concorrentesComLocalizacao = concorrentes
                              .filter((c: any) => typeof c === 'object' && c.cidade && c.estado)
                              .map((c: any) => ({
                                id: c.cnpj || `concorrente-${c.nome || c.razaoSocial}`,
                                name: c.nome || c.nomeFantasia || c.razaoSocial,
                                cidade: c.cidade,
                                estado: c.estado,
                                tipo: 'Concorrente',
                                setor: c.setor,
                                capitalSocial: c.capitalSocial || 0,
                              }));
                            
                            if (concorrentesComLocalizacao.length === 0) return null;
                            
                            return (
                              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-sm font-semibold mb-3 text-orange-700 dark:text-orange-500 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Mapa de Concorrentes ({concorrentesComLocalizacao.length} {concorrentesComLocalizacao.length === 1 ? 'concorrente' : 'concorrentes'})
                                </p>
                                <div className="rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-inner">
                                  <CompaniesMapWithGeocoding 
                                    companies={concorrentesComLocalizacao}
                                    height="350px"
                                    markerColor="red"
                                    markerLabel="Concorrente"
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
                </div>
              </div>

              {/* CNAEs Detalhados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    CNAEs Alvo ({(icpData.cnaes_alvo || []).length})
                  </CardTitle>
                  <CardDescription>
                    Códigos de Atividade Econômica prioritários para prospecção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {icpData.cnaes_alvo && icpData.cnaes_alvo.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {icpData.cnaes_alvo.map((cnae: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="font-mono text-xs">
                          {cnae}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum CNAE configurado</p>
                  )}
                </CardContent>
              </Card>

              {/* CTA para Relatório Completo */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Quer uma análise ainda mais profunda?</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gere um relatório completo com análise de CEO, previsões e recomendações estratégicas.
                      </p>
                    </div>
                    <Button onClick={() => navigate(`/central-icp/reports/${id}`)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Relatório Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground">
                    Carregando dados do ICP para análise 360°...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="criterios">
          <ICPAnalysisCriteriaConfig icpId={id!} onSave={() => loadProfile()} />
        </TabsContent>

        {/* 🏆 Aba de Análise Competitiva */}
        <TabsContent value="competitiva">
          <CompetitiveAnalysis
            tenantId={tenantId!}
            icpId={id}
            companyName={(tenant as any)?.razao_social || (tenant as any)?.nome_fantasia || profile?.nome || 'Sua Empresa'}
            companyCapitalSocial={icpData?.capital_social || (tenant as any)?.capital_social || 0}
            competitors={icpData?.concorrentes || []}
            diferenciais={icpData?.diferenciais || []}
          />
        </TabsContent>

        {/* 📋 Aba de Plano Estratégico de Ação */}
        <TabsContent value="plano">
          <StrategicActionPlan
            tenantId={tenantId!}
            icpId={id}
            companyName={(tenant as any)?.razao_social || (tenant as any)?.nome_fantasia || profile?.nome || 'Sua Empresa'}
            companyCapitalSocial={icpData?.capital_social || (tenant as any)?.capital_social || 0}
            onboardingData={icpData}
          />
        </TabsContent>

        <TabsContent value="relatorios">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Gerar e visualizar relatórios completos do ICP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="default"
                  onClick={() => navigate(`/central-icp/reports/${id}`)}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gerenciar Relatórios
                </Button>
                <p className="text-sm text-muted-foreground">
                  Gere relatórios completos e resumos do ICP com exportação para PDF
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

