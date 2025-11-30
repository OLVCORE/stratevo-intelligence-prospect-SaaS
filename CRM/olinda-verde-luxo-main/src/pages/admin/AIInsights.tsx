import { AdminLayout } from '@/components/admin/AdminLayout';
import { AIAssistantPanel } from '@/components/admin/AIAssistantPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Sparkles, TrendingUp, Brain, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const AIInsights = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: stats, refetch } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [analyses, transcriptions, insights] = await Promise.all([
        supabase.from('ai_lead_analysis').select('id', { count: 'exact', head: true }),
        supabase.from('call_transcriptions').select('id', { count: 'exact', head: true }),
        supabase.from('ai_insights').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
      ]);

      return {
        totalAnalyses: analyses.count || 0,
        totalTranscriptions: transcriptions.count || 0,
        pendingInsights: insights.count || 0
      };
    },
  });

  const generateDailyInsights = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { action: 'daily_insights' }
      });

      if (error) throw error;

      toast({
        title: "Insights gerados",
        description: `${data.insights?.length || 0} novos insights criados`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar insights",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const batchAnalyzeLeads = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lead-scoring', {
        body: { action: 'batch' }
      });

      if (error) throw error;

      toast({
        title: "Análise em lote concluída",
        description: `${data.processed || 0} leads analisados`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro na análise em lote",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Insights de IA</h1>
            <p className="text-muted-foreground mt-1">
              Análise preditiva 360º completa: conversas, emails, ligações, WhatsApp, tarefas, notas, arquivos e histórico
            </p>
          </div>
        </div>

        {/* Guia de Uso */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Como Funciona o Sistema de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-semibold mb-1">Análise Individual</h4>
                    <p className="text-sm text-muted-foreground">
                      Vá em <strong>Leads</strong> → selecione lead → aba <strong>"IA"</strong> → clique <strong>"Analisar com IA"</strong>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-semibold mb-1">Análise em Lote</h4>
                    <p className="text-sm text-muted-foreground">
                      Use o botão abaixo para analisar até 10 leads de uma vez
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-semibold mb-1">Insights Diários</h4>
                    <p className="text-sm text-muted-foreground">
                      Gere recomendações do dia sobre toda a base de leads
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                  <div>
                    <h4 className="font-semibold mb-1">Insights Automáticos</h4>
                    <p className="text-sm text-muted-foreground">
                      A IA cria insights automaticamente após análises e eles aparecem abaixo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Análises de Leads
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAnalyses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de análises realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transcrições
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTranscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Chamadas transcritas e analisadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Insights Pendentes
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingInsights || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ações sugeridas pela IA
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de IA</CardTitle>
            <CardDescription>
              Gere insights e análises automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Gerar Insights Diários</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Analisa toda a base de leads e gera recomendações prioritárias para hoje. 
                    Identifica leads que precisam de atenção urgente.
                  </p>
                  <Button 
                    onClick={generateDailyInsights} 
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Sparkles className="h-4 w-4" />
                    Gerar Insights
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Analisar Leads em Lote</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Análise 360º completa de até 10 leads: examina conversas, emails, ligações, WhatsApp, tarefas, 
                    notas, arquivos e histórico para calcular score preditivo, risco de perda e próximas ações.
                  </p>
                  <Button 
                    onClick={batchAnalyzeLeads} 
                    disabled={isGenerating}
                    variant="secondary"
                    className="gap-2"
                  >
                    {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <TrendingUp className="h-4 w-4" />
                    Analisar em Lote
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
              <p className="text-sm font-medium mb-2">💡 Como ver análises individuais:</p>
              <p className="text-sm text-muted-foreground">
                Vá em <strong>Leads</strong> → selecione um lead → aba <strong>"IA"</strong> → clique em <strong>"Analisar com IA"</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Painel Principal */}
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights">Insights Ativos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="mt-6">
            <div className="mb-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold mb-2">📌 Sobre os Insights Ativos</h3>
              <p className="text-sm text-muted-foreground">
                Os insights aparecem aqui <strong>automaticamente</strong> quando a IA identifica ações importantes 
                após analisar leads. Use os botões acima para gerar análises e insights, ou analise leads 
                individualmente na página de cada lead.
              </p>
            </div>
            <AIAssistantPanel />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Insights</CardTitle>
                <CardDescription>
                  Insights já lidos e executados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AIInsights;
