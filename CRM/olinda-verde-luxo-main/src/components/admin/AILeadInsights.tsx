import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, AlertTriangle, Target, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface AILeadInsightsProps {
  leadId: string;
}

export const AILeadInsights = ({ leadId }: AILeadInsightsProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['ai-lead-analysis', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_lead_analysis')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const analyzeNow = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lead-scoring', {
        body: { leadId, action: 'analyze' }
      });

      if (error) throw error;

      toast({
        title: "Análise concluída",
        description: "O lead foi analisado com sucesso pela IA",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise 360º de IA
          </CardTitle>
          <CardDescription>
            Análise completa incluindo conversas, emails, ligações, WhatsApp, tarefas, notas e histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={analyzeNow} disabled={isAnalyzing} className="w-full">
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analisar Lead com IA 360º
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise 360º de IA
            </CardTitle>
            <CardDescription>
              Última análise: {new Date(analysis.created_at).toLocaleString('pt-BR')}
            </CardDescription>
          </div>
          <Button onClick={analyzeNow} disabled={isAnalyzing} variant="outline" size="sm">
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reanalisar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Probabilidade de Fechamento */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Probabilidade de Fechamento
            </span>
            <span className="text-2xl font-bold text-primary">
              {analysis.predicted_probability}%
            </span>
          </div>
          <Progress value={analysis.predicted_probability} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Confiança: {analysis.confidence_level}%
          </p>
        </div>

        {/* Risco de Churn */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risco de Perda
            </span>
            <Badge className={getRiskColor(analysis.churn_risk)}>
              {analysis.churn_risk === 'low' ? 'Baixo' : 
               analysis.churn_risk === 'medium' ? 'Médio' : 'Alto'}
            </Badge>
          </div>
        </div>

        {/* Data Prevista */}
        {analysis.predicted_close_date && (
          <div>
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data Prevista de Fechamento
            </span>
            <p className="text-lg font-semibold mt-1">
              {new Date(analysis.predicted_close_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Ações Recomendadas */}
        <div>
          <h4 className="text-sm font-medium mb-3">Ações Recomendadas:</h4>
          <div className="space-y-2">
            {(analysis.recommended_actions as any[])?.map((action, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{action.reason}</p>
                  </div>
                  <Badge variant={
                    action.priority === 'urgent' ? 'destructive' :
                    action.priority === 'high' ? 'default' : 'secondary'
                  }>
                    {action.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
