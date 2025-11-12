/**
 * SALES COACHING DASHBOARD
 * 
 * Advanced analytics and coaching insights from call recordings
 * Win/loss analysis, performance trends, AI recommendations
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, Target, Lightbulb, AlertCircle, 
  CheckCircle2, Award, MessageSquare, BarChart3, Users,
  Clock, Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachingRecommendation {
  id: string;
  recommendation_type: string;
  severity: string;
  title: string;
  description: string;
  suggested_improvement: string;
  acknowledged: boolean;
  call_recording_id: string;
  created_at: string;
}

interface PerformanceSummary {
  total_calls: number;
  avg_duration_minutes: number;
  avg_sentiment: number;
  avg_talk_ratio: number;
  avg_questions: number;
  avg_objection_handling: number;
  positive_calls: number;
  negative_calls: number;
  calls_with_buying_signals: number;
}

export default function SalesCoachingDashboard() {
  const [recommendations, setRecommendations] = useState<CoachingRecommendation[]>([]);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  
  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Load recommendations
      const { data: recsData } = await supabase
        .from('sales_coaching_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setRecommendations(recsData || []);
      
      // Load performance summary from view
      const { data: perfData } = await supabase
        .from('call_performance_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setPerformance(perfData || null);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const acknowledgeRecommendation = async (id: string) => {
    try {
      await supabase
        .from('sales_coaching_recommendations')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', id);
      
      setRecommendations(prev =>
        prev.map(rec => rec.id === id ? { ...rec, acknowledged: true } : rec)
      );
    } catch (error) {
      console.error('Error acknowledging recommendation:', error);
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'talk_time':
        return <Clock className="h-4 w-4" />;
      case 'discovery_questions':
        return <MessageSquare className="h-4 w-4" />;
      case 'objection_handling':
        return <AlertCircle className="h-4 w-4" />;
      case 'closing_technique':
        return <Target className="h-4 w-4" />;
      case 'active_listening':
        return <Users className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Award className="h-8 w-8 text-cyan-500" />
              Sales Coaching
            </h1>
            <p className="text-gray-400 mt-1">
              Análise de performance e recomendações de IA
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={timeframe === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('7d')}
            >
              7 dias
            </Button>
            <Button
              variant={timeframe === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('30d')}
            >
              30 dias
            </Button>
            <Button
              variant={timeframe === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('90d')}
            >
              90 dias
            </Button>
          </div>
        </div>
        
        {/* Performance Metrics */}
        {performance && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-white">
                    {performance.total_calls}
                  </p>
                  <Mic className="h-5 w-5 text-cyan-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(performance.avg_duration_minutes)} min média
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Sentimento Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className={cn(
                    "text-3xl font-bold",
                    performance.avg_sentiment > 0.3 ? "text-green-400" : 
                    performance.avg_sentiment < -0.3 ? "text-red-400" : "text-gray-400"
                  )}>
                    {(performance.avg_sentiment * 100).toFixed(0)}%
                  </p>
                  {performance.avg_sentiment > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {performance.positive_calls} positivas, {performance.negative_calls} negativas
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Perguntas / Call</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className={cn(
                    "text-3xl font-bold",
                    performance.avg_questions >= 10 ? "text-green-400" : 
                    performance.avg_questions >= 5 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {performance.avg_questions?.toFixed(1)}
                  </p>
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ideal: 10-15 perguntas
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Talk Time Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className={cn(
                    "text-3xl font-bold",
                    performance.avg_talk_ratio >= 0.3 && performance.avg_talk_ratio <= 0.4 ? "text-green-400" : "text-yellow-400"
                  )}>
                    {(performance.avg_talk_ratio * 100).toFixed(0)}%
                  </p>
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ideal: 30-40%
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Tabs */}
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="recommendations">
              <Lightbulb className="h-4 w-4 mr-2" />
              Recomendações
            </TabsTrigger>
            <TabsTrigger value="strengths">
              <Award className="h-4 w-4 mr-2" />
              Pontos Fortes
            </TabsTrigger>
            <TabsTrigger value="improvement">
              <Target className="h-4 w-4 mr-2" />
              Áreas de Melhoria
            </TabsTrigger>
          </TabsList>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    Nenhuma recomendação ainda. Faça mais calls para receber insights personalizados!
                  </p>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((rec) => (
                <Card key={rec.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg border", getSeverityColor(rec.severity))}>
                          {getTypeIcon(rec.recommendation_type)}
                        </div>
                        
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white mb-1">
                            {rec.title}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {rec.description}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className={getSeverityColor(rec.severity)}>
                        {rec.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 mb-3">
                      <p className="text-sm text-blue-300 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Sugestão:</strong> {rec.suggested_improvement}</span>
                      </p>
                    </div>
                    
                    {!rec.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeRecommendation(rec.id)}
                        className="w-full"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marcar como Lida
                      </Button>
                    )}
                    
                    {rec.acknowledged && (
                      <div className="flex items-center gap-2 text-green-500 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Recomendação reconhecida</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Strengths Tab */}
          <TabsContent value="strengths" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
                  Seus Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {performance && performance.avg_objection_handling > 0.7 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-medium text-green-400 mb-1">
                      ✅ Excelente tratamento de objeções
                    </p>
                    <p className="text-xs text-green-300">
                      Você está com {(performance.avg_objection_handling * 100).toFixed(0)}% de efetividade
                    </p>
                  </div>
                )}
                
                {performance && performance.avg_questions >= 10 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-medium text-green-400 mb-1">
                      ✅ Ótimas perguntas de descoberta
                    </p>
                    <p className="text-xs text-green-300">
                      Média de {performance.avg_questions.toFixed(1)} perguntas por call
                    </p>
                  </div>
                )}
                
                {performance && performance.calls_with_buying_signals > performance.total_calls * 0.5 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-medium text-green-400 mb-1">
                      ✅ Alta taxa de sinais de compra
                    </p>
                    <p className="text-xs text-green-300">
                      {performance.calls_with_buying_signals} de {performance.total_calls} calls com sinais positivos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Improvement Tab */}
          <TabsContent value="improvement" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Áreas para Desenvolver
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations
                  .filter(rec => rec.severity === 'critical' || rec.severity === 'warning')
                  .slice(0, 5)
                  .map(rec => (
                    <div key={rec.id} className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <p className="text-sm font-medium text-orange-400 mb-1">
                        {rec.title}
                      </p>
                      <p className="text-xs text-orange-300">
                        {rec.suggested_improvement}
                      </p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

