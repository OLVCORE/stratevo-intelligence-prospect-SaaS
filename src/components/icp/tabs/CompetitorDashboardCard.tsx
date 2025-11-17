/**
 * 🎨 COMPETITOR DASHBOARD CARD - Resumo Estatístico de Concorrentes
 * 
 * Card de dashboard que mostra:
 * - Total de concorrentes detectados
 * - Estatísticas por concorrente (quantas evidências)
 * - Estatísticas por produto (quantas evidências)
 * - Estatísticas por tipo de match (triple, double, single)
 * - Score médio de confiança
 */

import { Building2, Target, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CompetitorProductDetection {
  competitor_name: string;
  product_name: string;
  confidence: 'high' | 'medium' | 'low';
  evidences: Array<{
    url: string;
    title: string;
    snippet: string;
    source: string;
    matchType: 'single' | 'double' | 'triple';
    excerpt: string;
    weight: number;
  }>;
  total_weight: number;
  match_summary: {
    single_matches: number;
    double_matches: number;
    triple_matches: number;
  };
  total_score: number;
}

interface CompetitorDashboardCardProps {
  competitors: CompetitorProductDetection[];
  className?: string;
}

export function CompetitorDashboardCard({
  competitors,
  className,
}: CompetitorDashboardCardProps) {
  
  if (!competitors || competitors.length === 0) {
    return null;
  }
  
  // 📊 CALCULAR ESTATÍSTICAS AGRREGADAS
  
  // Por concorrente
  const byCompetitor = competitors.reduce((acc, comp) => {
    if (!acc[comp.competitor_name]) {
      acc[comp.competitor_name] = {
        count: 0,
        totalEvidences: 0,
        totalScore: 0,
        tripleMatches: 0,
        doubleMatches: 0,
        singleMatches: 0,
      };
    }
    acc[comp.competitor_name].count += 1;
    acc[comp.competitor_name].totalEvidences += comp.evidences.length;
    acc[comp.competitor_name].totalScore += comp.total_score;
    acc[comp.competitor_name].tripleMatches += comp.match_summary.triple_matches;
    acc[comp.competitor_name].doubleMatches += comp.match_summary.double_matches;
    acc[comp.competitor_name].singleMatches += comp.match_summary.single_matches;
    return acc;
  }, {} as Record<string, {
    count: number;
    totalEvidences: number;
    totalScore: number;
    tripleMatches: number;
    doubleMatches: number;
    singleMatches: number;
  }>);
  
  // Por produto
  const byProduct = competitors.reduce((acc, comp) => {
    if (!acc[comp.product_name]) {
      acc[comp.product_name] = {
        count: 0,
        totalEvidences: 0,
        totalScore: 0,
        tripleMatches: 0,
        doubleMatches: 0,
        singleMatches: 0,
      };
    }
    acc[comp.product_name].count += 1;
    acc[comp.product_name].totalEvidences += comp.evidences.length;
    acc[comp.product_name].totalScore += comp.total_score;
    acc[comp.product_name].tripleMatches += comp.match_summary.triple_matches;
    acc[comp.product_name].doubleMatches += comp.match_summary.double_matches;
    acc[comp.product_name].singleMatches += comp.match_summary.single_matches;
    return acc;
  }, {} as Record<string, {
    count: number;
    totalEvidences: number;
    totalScore: number;
    tripleMatches: number;
    doubleMatches: number;
    singleMatches: number;
  }>);
  
  // Totais gerais
  const totalEvidences = competitors.reduce((sum, comp) => sum + comp.evidences.length, 0);
  const totalTripleMatches = competitors.reduce((sum, comp) => sum + comp.match_summary.triple_matches, 0);
  const totalDoubleMatches = competitors.reduce((sum, comp) => sum + comp.match_summary.double_matches, 0);
  const totalSingleMatches = competitors.reduce((sum, comp) => sum + comp.match_summary.single_matches, 0);
  const avgScore = competitors.length > 0 
    ? Math.round(competitors.reduce((sum, comp) => sum + comp.total_score, 0) / competitors.length)
    : 0;
  
  // 🔥 PRODUTOS RELACIONADOS (agregar todos os produtos detectados das evidências)
  const relatedProducts = competitors.reduce((acc, comp) => {
    comp.evidences.forEach(evidence => {
      if (evidence.detected_products && evidence.detected_products.length > 0) {
        evidence.detected_products.forEach((product: string) => {
          if (!acc[product]) {
            acc[product] = {
              count: 0,
              tripleMatches: 0,
              doubleMatches: 0,
              singleMatches: 0,
            };
          }
          acc[product].count += 1;
          if (evidence.matchType === 'triple') acc[product].tripleMatches += 1;
          else if (evidence.matchType === 'double') acc[product].doubleMatches += 1;
          else if (evidence.matchType === 'single') acc[product].singleMatches += 1;
        });
      }
    });
    return acc;
  }, {} as Record<string, {
    count: number;
    tripleMatches: number;
    doubleMatches: number;
    singleMatches: number;
  }>);
  
  const relatedProductsSorted = Object.entries(relatedProducts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10); // Top 10 produtos relacionados
  
  // Ordenar por evidências (maior primeiro)
  const competitorsSorted = Object.entries(byCompetitor)
    .sort(([, a], [, b]) => b.totalEvidences - a.totalEvidences)
    .slice(0, 5); // Top 5
  
  const productsSorted = Object.entries(byProduct)
    .sort(([, a], [, b]) => b.totalEvidences - a.totalEvidences)
    .slice(0, 5); // Top 5
  
  return (
    <Card className={cn(
      'relative overflow-hidden border-2 border-orange-500/50 shadow-lg',
      'bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="w-6 h-6 text-orange-600" />
          Dashboard de Concorrentes
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 📊 MÉTRICAS GERAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-muted-foreground">Concorrentes</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {competitors.length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">Evidências</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {totalEvidences}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Score Médio</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {avgScore}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground">Triple Match</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {totalTripleMatches}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 📋 TOP CONCORRENTES */}
        {competitorsSorted.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              Top Concorrentes por Evidências
            </h3>
            <div className="space-y-2">
              {competitorsSorted.map(([competitorName, stats]) => (
                <Card key={competitorName} className="bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{competitorName}</span>
                          <Badge variant="outline" className="text-xs">
                            {stats.count} produto{stats.count > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{stats.totalEvidences} evidências</span>
                          {stats.tripleMatches > 0 && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              {stats.tripleMatches} triple
                            </Badge>
                          )}
                          {stats.doubleMatches > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {stats.doubleMatches} double
                            </Badge>
                          )}
                          <span>Score: {Math.round(stats.totalScore / stats.count)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* 📦 TOP PRODUTOS */}
        {productsSorted.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Top Produtos por Evidências
            </h3>
            <div className="space-y-2">
              {productsSorted.map(([productName, stats]) => (
                <Card key={productName} className="bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{productName}</span>
                          <Badge variant="outline" className="text-xs">
                            {stats.totalEvidences} evidência{stats.totalEvidences > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {stats.tripleMatches > 0 && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              {stats.tripleMatches} triple
                            </Badge>
                          )}
                          {stats.doubleMatches > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {stats.doubleMatches} double
                            </Badge>
                          )}
                          {stats.singleMatches > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {stats.singleMatches} single
                            </Badge>
                          )}
                          <span>Score: {Math.round(stats.totalScore / stats.count)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* 🔥 PRODUTOS RELACIONADOS (como no TOTVS Check) */}
        {relatedProductsSorted.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              Produtos Relacionados Detectados
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedProductsSorted.map(([productName, stats]) => (
                <Card key={productName} className="bg-purple-500/10 border-purple-500/30">
                  <CardContent className="p-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{productName}</span>
                      <Badge variant="default" className="text-xs bg-purple-600">
                        {stats.count}x
                      </Badge>
                      {stats.tripleMatches > 0 && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          {stats.tripleMatches} triple
                        </Badge>
                      )}
                      {stats.doubleMatches > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {stats.doubleMatches} double
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* 📊 RESUMO DE MATCHES */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            Resumo de Matches
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{totalTripleMatches}</div>
                <div className="text-xs text-muted-foreground mt-1">Triple Match</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalDoubleMatches}</div>
                <div className="text-xs text-muted-foreground mt-1">Double Match</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-500/10 border-gray-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-600">{totalSingleMatches}</div>
                <div className="text-xs text-muted-foreground mt-1">Single Match</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

