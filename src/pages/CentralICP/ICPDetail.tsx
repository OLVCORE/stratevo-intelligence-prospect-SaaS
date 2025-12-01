import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Search, BarChart3, Target, Calendar, CheckCircle2, Zap, RefreshCw, Loader2, Building2, TrendingUp, Users, DollarSign, MapPin, AlertTriangle, Lightbulb, TrendingDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ICPAnalysisCriteriaConfig from '@/components/icp/ICPAnalysisCriteriaConfig';
import BCGMatrix, { createBCGItemsFromICP } from '@/components/reports/BCGMatrix';
import CompetitiveAnalysis from '@/components/icp/CompetitiveAnalysis';

export default function ICPDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [icpData, setIcpData] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (tenantId && id) {
      loadProfile();
    }
  }, [tenantId, id]);

  const loadProfile = async () => {
    if (!tenantId || !id) return;
    
    setLoading(true);
    try {
      // Buscar metadata
      const { data: metadata, error: metaError } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (metaError) throw metaError;
      setProfile(metadata);

      // 🔥 Buscar dados completos do onboarding_sessions para obter benchmarking e clientes
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!sessionError && sessionData && sessionData.length > 0) {
        const session = sessionData[0];
        
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
          // Situação atual (Step 4)
          diferenciais: session.step4_data?.diferenciais || [],
          casos_de_uso: session.step4_data?.casosDeUso || [],
          concorrentes: session.step4_data?.concorrentesDiretos || [],
          tickets_ciclos: session.step4_data?.ticketsECiclos || [],
          // Histórico (Step 5)
          clientes_atuais: session.step5_data?.clientesAtuais || [],
          empresas_benchmarking: session.step5_data?.empresasBenchmarking || [],
          // Análise IA
          analise_detalhada: metadata?.icp_recommendation?.analise_detalhada || {},
          score_confianca: metadata?.icp_recommendation?.score_confianca || 0,
        };
        
        console.log('[ICPDetail] 📊 Dados enriquecidos:', {
          setores: enrichedIcpData.setores_alvo?.length,
          cnaes: enrichedIcpData.cnaes_alvo?.length,
          clientes: enrichedIcpData.clientes_atuais?.length,
          benchmarking: enrichedIcpData.empresas_benchmarking?.length,
        });
        
        setIcpData(enrichedIcpData);
      } else if (metadata?.icp_recommendation) {
        console.warn('[ICPDetail] ⚠️ Usando apenas metadata');
        setIcpData(metadata.icp_recommendation.icp_profile || {});
      }
    } catch (error: any) {
      console.error('Erro ao carregar ICP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do ICP.',
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

      // Chamar Edge Function para regenerar análise
      const { data, error } = await supabase.functions.invoke('analyze-onboarding-icp', {
        body: {
          tenant_id: tenantId,
          icp_id: id,
          regenerate: true, // Flag para indicar regeneração
        },
      });

      if (error) throw error;

      if (data?.recommendation) {
        // Atualizar metadata do ICP com a nova análise
        const { error: updateError } = await (supabase as any)
          .from('icp_profiles_metadata')
          .update({
            recommendation_data: data.recommendation,
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

      // Recarregar dados
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
        <div className="flex gap-2">
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

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="resumo">Resumo Estratégico</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="criterios">Critérios de Análise</TabsTrigger>
          <TabsTrigger value="analise">Análise 360°</TabsTrigger>
          <TabsTrigger value="competitiva" className="text-purple-600">🏆 Competitiva</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
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

                  {/* Clientes Atuais (Base de Análise) */}
                  {icpData.clientes_atuais && icpData.clientes_atuais.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ✅ Clientes Atuais (Base de Análise)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {icpData.clientes_atuais.slice(0, 5).map((cliente: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-green-50 dark:bg-green-950">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Nichos Alvo</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {(icpData.setores_alvo || icpData.nichos_alvo || []).length}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300">Clientes Base</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {(icpData.clientes_atuais || []).length}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Benchmarking</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                          {(icpData.empresas_benchmarking || []).length}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">CNAEs Alvo</p>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                          {(icpData.cnaes_alvo || []).length}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Matriz BCG */}
              <BCGMatrix 
                items={createBCGItemsFromICP(icpData)}
                title="Matriz BCG - Priorização de Nichos e Clientes"
                description="Análise estratégica de portfólio baseada em crescimento de mercado e participação"
              />

              {/* Grid de Análises */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Perfil Financeiro */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Perfil Financeiro Alvo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {icpData.faturamento_min || icpData.faturamento_max ? (
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Faixa de Faturamento</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          R$ {(icpData.faturamento_min || 0).toLocaleString('pt-BR')} - R$ {(icpData.faturamento_max || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ) : null}
                    {icpData.tickets_ciclos && icpData.tickets_ciclos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Tickets e Ciclos de Venda</p>
                        {icpData.tickets_ciclos.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm p-2 bg-muted rounded">
                            <span>{item.criterio || `Ticket ${idx + 1}`}</span>
                            <span className="font-medium">
                              R$ {(item.ticketMedio || item.ticketMedioMin || 0).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Localização Geográfica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      Cobertura Geográfica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {icpData.localizacao_alvo?.estados && icpData.localizacao_alvo.estados.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Estados Alvo</p>
                        <div className="flex flex-wrap gap-2">
                          {icpData.localizacao_alvo.estados.map((estado: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-blue-50 dark:bg-blue-950">
                              {estado}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {icpData.localizacao_alvo?.cidades && icpData.localizacao_alvo.cidades.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Cidades Prioritárias</p>
                        <div className="flex flex-wrap gap-2">
                          {icpData.localizacao_alvo.cidades.slice(0, 8).map((cidade: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{cidade}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Diferenciais Competitivos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Diferenciais Competitivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {icpData.diferenciais && icpData.diferenciais.length > 0 ? (
                      <ul className="space-y-2">
                        {icpData.diferenciais.slice(0, 5).map((dif: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{dif}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum diferencial registrado</p>
                    )}
                  </CardContent>
                </Card>

                {/* Concorrentes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Concorrentes Diretos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {icpData.concorrentes && icpData.concorrentes.length > 0 ? (
                      <div className="space-y-2">
                        {icpData.concorrentes.slice(0, 5).map((conc: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded">
                            <span className="text-sm font-medium">
                              {typeof conc === 'string' ? conc : conc.nome || conc.razaoSocial}
                            </span>
                            <Badge variant="destructive" className="text-xs">Monitorar</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhum concorrente registrado</p>
                    )}
                  </CardContent>
                </Card>
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

