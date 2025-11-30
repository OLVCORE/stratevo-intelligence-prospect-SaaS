import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Search, BarChart3, Target, Calendar, CheckCircle2, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ICPAnalysisCriteriaConfig from '@/components/icp/ICPAnalysisCriteriaConfig';

export default function ICPDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [icpData, setIcpData] = useState<any>(null);

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

      // Buscar dados completos do ICP no schema do tenant via RPC
      if (metadata?.schema_name && metadata?.icp_profile_id) {
        try {
          const { data: icpData, error: icpError } = await supabase
            .rpc('get_icp_profile_from_tenant', {
              p_schema_name: metadata.schema_name,
              p_icp_profile_id: metadata.icp_profile_id
            });

          if (!icpError && icpData) {
            setIcpData(icpData);
          } else if (icpError) {
            console.warn('[ICPDetail] Erro ao buscar icp_profile via RPC:', icpError);
          }
        } catch (err) {
          console.error('[ICPDetail] Erro ao buscar icp_profile:', err);
        }
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
        <TabsList>
          <TabsTrigger value="resumo">Resumo Estratégico</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="analise">Análise 360°</TabsTrigger>
          <TabsTrigger value="criterios">Critérios de Análise</TabsTrigger>
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
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h3 className="font-semibold mb-2">Setores Alvo</h3>
                    <div className="flex flex-wrap gap-2">
                      {(icpData.setores_alvo || []).map((setor: string, idx: number) => (
                        <Badge key={idx} variant="outline">{setor}</Badge>
                      ))}
                    </div>
                  </div>

                  {icpData.cnaes_alvo && icpData.cnaes_alvo.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">CNAEs Alvo</h3>
                      <div className="flex flex-wrap gap-2">
                        {(icpData.cnaes_alvo || []).slice(0, 10).map((cnae: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{cnae}</Badge>
                        ))}
                        {icpData.cnaes_alvo.length > 10 && (
                          <Badge variant="secondary">+{icpData.cnaes_alvo.length - 10} mais</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {icpData.faturamento_min && icpData.faturamento_max && (
                      <div>
                        <h3 className="font-semibold mb-2">Faturamento</h3>
                        <p className="text-muted-foreground">
                          R$ {icpData.faturamento_min.toLocaleString('pt-BR')} - R$ {icpData.faturamento_max.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {icpData.funcionarios_min && icpData.funcionarios_max && (
                      <div>
                        <h3 className="font-semibold mb-2">Funcionários</h3>
                        <p className="text-muted-foreground">
                          {icpData.funcionarios_min} - {icpData.funcionarios_max}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracao">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Completa</CardTitle>
              <CardDescription>Detalhes técnicos do ICP</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify({ profile, icpData }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise">
          <Card>
            <CardHeader>
              <CardTitle>Análise 360° Estratégica</CardTitle>
              <CardDescription>Análise completa baseada nos dados do ICP</CardDescription>
            </CardHeader>
            <CardContent>
              {icpData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Setores e Nichos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Setores Alvo</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(icpData.setores_alvo || []).map((setor: string, idx: number) => (
                                <Badge key={idx} variant="outline">{setor}</Badge>
                              ))}
                            </div>
                          </div>
                          {icpData.nichos_alvo && icpData.nichos_alvo.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">Nichos Alvo</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(icpData.nichos_alvo || []).map((nicho: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{nicho}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Perfil Demográfico</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {icpData.porte_alvo && icpData.porte_alvo.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">Porte</p>
                              <p className="font-semibold">
                                {icpData.porte_alvo.map((p: any) => 
                                  `${p.minimo || 'N/A'} - ${p.maximo || 'N/A'} funcionários`
                                ).join(', ')}
                              </p>
                            </div>
                          )}
                          {icpData.localizacao_alvo && (
                            <div>
                              <p className="text-sm text-muted-foreground">Localização</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(icpData.localizacao_alvo.estados || []).map((estado: string, idx: number) => (
                                  <Badge key={idx} variant="outline">{estado}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">CNAEs Alvo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {icpData.cnaes_alvo && icpData.cnaes_alvo.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {icpData.cnaes_alvo.slice(0, 20).map((cnae: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="font-mono text-xs">{cnae}</Badge>
                          ))}
                          {icpData.cnaes_alvo.length > 20 && (
                            <Badge variant="secondary">+{icpData.cnaes_alvo.length - 20} mais</Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Nenhum CNAE configurado</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análise Estratégica</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Para gerar uma análise 360° completa com insights e recomendações baseadas em IA,
                        acesse a aba "Relatórios" e gere um relatório completo do ICP.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate(`/central-icp/reports/${id}`)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar Relatório Completo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Carregando dados do ICP para análise 360°...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criterios">
          <ICPAnalysisCriteriaConfig icpId={id!} onSave={() => loadProfile()} />
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

