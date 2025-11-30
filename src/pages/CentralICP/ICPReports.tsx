/**
 * 📄 Página de Relatórios ICP
 * Exibe relatórios completos e resumos do ICP com preview e exportação PDF
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Eye, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ICPReports() {
  const navigate = useNavigate();
  const { icpId } = useParams<{ icpId: string }>();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('gerar');
  
  // Determinar tab inicial baseado na URL
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'completo') {
      setActiveTab('completo');
    } else if (type === 'resumo') {
      setActiveTab('resumo');
    } else {
      setActiveTab('gerar');
    }
  }, [searchParams]);

  useEffect(() => {
    if (tenantId && icpId) {
      loadData();
    }
  }, [tenantId, icpId]);

  const loadData = async () => {
    if (!tenantId || !icpId) return;

    setLoading(true);
    try {
      // Buscar perfil do ICP
      const { data: metadata, error: metaError } = await supabase
        .from('icp_profiles_metadata')
        .select('*')
        .eq('id', icpId)
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
            // Armazenar dados do ICP para uso na geração de relatórios
            setProfile({ ...metadata, icp_profile_data: icpData });
          }
        } catch (err) {
          console.warn('[ICPReports] Erro ao buscar icp_profile via RPC:', err);
        }
      }

      // Buscar relatórios existentes
      const { data: reportsData, error: reportsError } = await supabase
        .from('icp_reports')
        .select('*')
        .eq('icp_profile_metadata_id', icpId)
        .eq('tenant_id', tenantId)
        .order('generated_at', { ascending: false });

      if (reportsError && reportsError.code !== 'PGRST116') throw reportsError;
      setReports(reportsData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type: 'completo' | 'resumo') => {
    if (!tenantId || !icpId) return;

    setGenerating(type);
    try {
      toast({
        title: 'Gerando relatório...',
        description: `Criando ${type === 'completo' ? 'relatório completo' : 'resumo executivo'} com análise IA.`,
      });

      // Chamar Edge Function para gerar relatório com análise IA
      const { data, error } = await supabase.functions.invoke('generate-icp-report', {
        body: {
          icp_metadata_id: icpId,
          tenant_id: tenantId,
          report_type: type,
        },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Relatório ${type === 'completo' ? 'Completo' : 'Resumo'} gerado com sucesso!`,
      });

      await loadData();
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: error.message || `Não foi possível gerar o relatório ${type === 'completo' ? 'completo' : 'resumo'}.`,
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleExportPDF = async (reportId: string) => {
    // Implementar exportação PDF
    toast({
      title: 'Em desenvolvimento',
      description: 'A exportação para PDF será implementada em breve.',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  const completeReport = reports.find((r) => r.report_type === 'completo' && r.status === 'completed');
  const summaryReport = reports.find((r) => r.report_type === 'resumo' && r.status === 'completed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/central-icp/profile/${icpId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Relatórios ICP</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.nome || 'ICP'} - Gerar e visualizar relatórios completos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gerar">Gerar Relatórios</TabsTrigger>
          <TabsTrigger value="completo">Relatório Completo</TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatório Completo
                </CardTitle>
                <CardDescription>
                  Relatório detalhado com todas as análises e dados do ICP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completeReport ? (
                  <div className="space-y-2">
                    <Badge variant="default">Gerado</Badge>
                    <p className="text-sm text-muted-foreground">
                      Gerado em {new Date(completeReport.generated_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => {
                          setActiveTab('completo');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" onClick={() => handleExportPDF(completeReport.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleGenerateReport('completo')}
                    disabled={generating === 'completo'}
                    className="w-full"
                  >
                    {generating === 'completo' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Relatório Completo
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo
                </CardTitle>
                <CardDescription>
                  Resumo executivo com principais insights e recomendações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryReport ? (
                  <div className="space-y-2">
                    <Badge variant="default">Gerado</Badge>
                    <p className="text-sm text-muted-foreground">
                      Gerado em {new Date(summaryReport.generated_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => {
                          setActiveTab('resumo');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" onClick={() => handleExportPDF(summaryReport.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleGenerateReport('resumo')}
                    disabled={generating === 'resumo'}
                    className="w-full"
                  >
                    {generating === 'resumo' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Resumo
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="completo" className="space-y-4">
          {completeReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Relatório Completo</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportPDF(completeReport.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none dark:prose-invert">
                  {(() => {
                    // 🔥 CRÍTICO: A estrutura correta é report_data.analysis
                    // report_data é um JSONB que contém: { analysis: string, icp_metadata: {}, ... }
                    const reportData = completeReport.report_data || {};
                    const analysis = typeof reportData === 'object' 
                      ? (reportData.analysis || reportData.report_data?.analysis)
                      : (typeof reportData === 'string' ? reportData : null);
                    
                    console.log('[ICPReports] Relatório Completo:', {
                      hasReportData: !!completeReport.report_data,
                      reportDataType: typeof completeReport.report_data,
                      hasAnalysis: !!analysis,
                      analysisType: typeof analysis,
                      analysisLength: typeof analysis === 'string' ? analysis.length : 0,
                    });
                    
                    if (analysis && typeof analysis === 'string' && analysis.trim().length > 0) {
                      return (
                        <div className="prose max-w-none dark:prose-invert">
                          <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                      );
                    } else {
                      // Se não encontrar análise, mostrar mensagem útil
                      return (
                        <div className="space-y-4">
                          <Alert>
                            <AlertDescription>
                              O relatório ainda não possui análise gerada. Os dados técnicos estão abaixo.
                            </AlertDescription>
                          </Alert>
                          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-[600px]">
                            {JSON.stringify(completeReport.report_data || completeReport, null, 2)}
                          </pre>
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum relatório completo gerado ainda. Gere um relatório na aba "Gerar Relatórios".
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          {summaryReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resumo</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportPDF(summaryReport.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none dark:prose-invert">
                  {(() => {
                    // 🔥 CRÍTICO: A estrutura correta é report_data.analysis
                    const reportData = summaryReport.report_data || {};
                    const analysis = typeof reportData === 'object' 
                      ? (reportData.analysis || reportData.report_data?.analysis)
                      : (typeof reportData === 'string' ? reportData : null);
                    
                    console.log('[ICPReports] Resumo:', {
                      hasReportData: !!summaryReport.report_data,
                      hasAnalysis: !!analysis,
                      analysisType: typeof analysis,
                    });
                    
                    if (analysis && typeof analysis === 'string' && analysis.trim().length > 0) {
                      return (
                        <div className="prose max-w-none dark:prose-invert">
                          <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-4">
                          <Alert>
                            <AlertDescription>
                              O resumo ainda não possui análise gerada. Os dados técnicos estão abaixo.
                            </AlertDescription>
                          </Alert>
                          <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-[600px]">
                            {JSON.stringify(summaryReport.report_data || summaryReport, null, 2)}
                          </pre>
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum resumo gerado ainda. Gere um resumo na aba "Gerar Relatórios".
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

