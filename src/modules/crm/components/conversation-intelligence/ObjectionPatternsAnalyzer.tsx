// src/modules/crm/components/conversation-intelligence/ObjectionPatternsAnalyzer.tsx
// Componente para analisar padrões de objeções

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ObjectionPatternsAnalyzer() {
  const { tenant } = useTenant();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['objection-patterns-all', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data, error } = await supabase
        .from('objection_patterns')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('frequency', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPatterns = patterns?.length || 0;
  const totalFrequency = patterns?.reduce((acc, p) => acc + (p.frequency || 0), 0) || 0;
  const avgSuccessRate = patterns?.reduce((acc, p) => acc + (p.success_rate || 0), 0) / (totalPatterns || 1) || 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'price':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'timing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'authority':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'need':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'competitor':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Padrões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatterns}</div>
            <p className="text-xs text-muted-foreground">Objeções únicas detectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Frequência Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFrequency}</div>
            <p className="text-xs text-muted-foreground">Vezes que apareceram</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgSuccessRate)}%</div>
            <p className="text-xs text-muted-foreground">Resolução de objeções</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Padrões */}
      <Card>
        <CardHeader>
          <CardTitle>Padrões de Objeções</CardTitle>
          <CardDescription>Objeções mais frequentes e suas taxas de resolução</CardDescription>
        </CardHeader>
        <CardContent>
          {patterns && patterns.length > 0 ? (
            <div className="space-y-4">
              {patterns.map((pattern: any) => (
                <div
                  key={pattern.id}
                  className="p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <p className="font-semibold">{pattern.pattern_text}</p>
                        <Badge className={getCategoryColor(pattern.pattern_category || 'general')}>
                          {pattern.pattern_category || 'geral'}
                        </Badge>
                      </div>
                      {pattern.best_response && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-semibold">Melhor resposta:</span> {pattern.best_response}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{pattern.frequency}x</p>
                      <p className="text-xs text-muted-foreground">frequência</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Taxa de Sucesso</span>
                      <span className="font-semibold">{Math.round(pattern.success_rate || 0)}%</span>
                    </div>
                    <Progress value={pattern.success_rate || 0} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Resolvidas: {pattern.resolution_count || 0} / {pattern.total_count || 0}
                      </span>
                      <span>
                        Última: {format(new Date(pattern.last_detected_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhum padrão detectado ainda</p>
              <p className="text-sm text-muted-foreground text-center">
                Os padrões de objeções aparecerão aqui após analisar conversas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



