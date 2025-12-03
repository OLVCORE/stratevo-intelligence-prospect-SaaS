/**
 * 🔥 Mapa de Calor de Produtos
 * Visualização de produtos por concorrente com intensidade de competição
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Flame, Package, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ProductHeatmapProps {
  tenantProducts: Array<{ nome: string; categoria?: string }>;
  competitorProducts: Array<{ 
    nome: string; 
    categoria?: string;
    competitor_name: string;
    matchScore?: number;
  }>;
  matches: Array<{
    tenantProduct: { nome: string; categoria?: string };
    competitorProducts: Array<{ 
      nome: string;
      competitor_name: string;
      matchScore: number;
    }>;
    bestScore: number;
  }>;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ProductHeatmap({ 
  tenantProducts, 
  competitorProducts,
  matches,
  isOpen = false,
  onToggle
}: ProductHeatmapProps) {
  
  // Agrupar concorrentes únicos
  const competitors = Array.from(
    new Set(competitorProducts.map(p => p.competitor_name))
  ).filter(Boolean);
  
  // Criar categorias únicas
  const categories = Array.from(
    new Set([
      ...tenantProducts.map(p => p.categoria).filter(Boolean),
      ...competitorProducts.map(p => p.categoria).filter(Boolean),
    ])
  ).filter(Boolean) as string[];
  
  // Calcular intensidade de competição por categoria
  const categoryIntensity = categories.map(cat => {
    const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
    const competitorCount = competitorProducts.filter(p => p.categoria === cat).length;
    const matchesInCategory = matches.filter(m => 
      m.tenantProduct.categoria === cat && m.bestScore >= 70
    ).length;
    
    const intensity = tenantCount > 0 
      ? (matchesInCategory / tenantCount) * 100 
      : 0;
    
    return {
      categoria: cat,
      tenantCount,
      competitorCount,
      matchesCount: matchesInCategory,
      intensity,
    };
  }).sort((a, b) => b.intensity - a.intensity);
  
  // Calcular intensidade por concorrente
  const competitorIntensity = competitors.map(comp => {
    const productsCount = competitorProducts.filter(p => p.competitor_name === comp).length;
    const matchesWithTenant = matches.filter(m => 
      m.competitorProducts.some(cp => cp.competitor_name === comp && cp.matchScore >= 70)
    ).length;
    
    const avgScore = matches
      .flatMap(m => m.competitorProducts.filter(cp => cp.competitor_name === comp))
      .reduce((sum, cp, _, arr) => sum + (cp.matchScore || 0) / arr.length, 0);
    
    return {
      competitor: comp,
      productsCount,
      matchesCount: matchesWithTenant,
      avgScore: Math.round(avgScore),
      intensity: productsCount > 0 ? (matchesWithTenant / productsCount) * 100 : 0,
    };
  }).sort((a, b) => b.intensity - a.intensity);
  
  // Função para determinar cor do heatmap
  const getHeatColor = (intensity: number) => {
    if (intensity >= 75) return 'bg-orange-600 dark:bg-orange-500';
    if (intensity >= 50) return 'bg-orange-500 dark:bg-orange-600';
    if (intensity >= 25) return 'bg-blue-500 dark:bg-blue-600';
    if (intensity > 0) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-slate-300 dark:bg-slate-700';
  };
  
  const getHeatBgColor = (intensity: number) => {
    if (intensity >= 75) return 'bg-orange-100 dark:bg-orange-950/30';
    if (intensity >= 50) return 'bg-orange-50 dark:bg-orange-950/20';
    if (intensity >= 25) return 'bg-blue-50 dark:bg-blue-950/20';
    if (intensity > 0) return 'bg-emerald-50 dark:bg-emerald-950/20';
    return 'bg-slate-50 dark:bg-slate-900/20';
  };

  // Preparar dados para o gráfico Recharts
  const chartData = categoryIntensity.map(cat => ({
    categoria: cat.categoria.length > 20 ? cat.categoria.substring(0, 17) + '...' : cat.categoria,
    categoriaFull: cat.categoria,
    seusProdutos: cat.tenantCount,
    concorrentes: cat.competitorCount,
    intensidade: Math.round(cat.intensity),
  }));

  return (
    <div className="space-y-6">
      {/* Mapa de Calor por Categoria - Com Gráfico */}
      <Card className="border-l-4 border-l-orange-600 shadow-lg">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 cursor-pointer hover:from-orange-50 hover:to-orange-100/50 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-600/10 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-slate-800 dark:text-slate-100">Mapa de Calor por Categoria</CardTitle>
                  <CardDescription>
                    Intensidade de competição em cada categoria de produto
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-orange-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-orange-600" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-6 space-y-6">
            {/* Gráfico de Barras Visual */}
            {categoryIntensity.length > 0 && (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="categoria" 
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar dataKey="seusProdutos" name="Seus Produtos" fill="#10b981" />
                    <Bar dataKey="concorrentes" name="Concorrentes" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Lista de categorias com barras */}
          {categoryIntensity.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Nenhuma categoria disponível. Adicione categorias aos produtos.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryIntensity.map((cat, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "p-4 rounded-lg transition-all cursor-help hover:scale-[1.02]",
                        getHeatBgColor(cat.intensity)
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{cat.categoria}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cat.tenantCount} seu{cat.tenantCount !== 1 ? 's' : ''} produto{cat.tenantCount !== 1 ? 's' : ''} • {cat.competitorCount} concorrente{cat.competitorCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge className={cn(
                            "text-white text-xs",
                            cat.intensity >= 75 ? "bg-orange-600 hover:bg-orange-700" :
                            cat.intensity >= 50 ? "bg-orange-500 hover:bg-orange-600" :
                            cat.intensity >= 25 ? "bg-blue-600 hover:bg-blue-700" :
                            cat.intensity > 0 ? "bg-emerald-600 hover:bg-emerald-700" :
                            "bg-slate-500 hover:bg-slate-600"
                          )}>
                            {Math.round(cat.intensity)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn("h-2 rounded-full transition-all", getHeatColor(cat.intensity))}
                              style={{ width: `${Math.min(100, cat.intensity)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">{cat.categoria}</p>
                        <div className="text-xs space-y-1">
                          <p>• <strong>Seus produtos:</strong> {cat.tenantCount}</p>
                          <p>• <strong>Produtos concorrentes:</strong> {cat.competitorCount}</p>
                          <p>• <strong>Matches identificados:</strong> {cat.matchesCount}</p>
                          <p>• <strong>Intensidade de competição:</strong> {Math.round(cat.intensity)}%</p>
                        </div>
                        <p className="text-xs mt-2 pt-2 border-t">
                          {cat.intensity >= 75 ? '🔥 Categoria com altíssima concorrência' :
                           cat.intensity >= 50 ? '⚠️ Categoria com concorrência moderada' :
                           cat.intensity >= 25 ? '✅ Categoria com concorrência baixa' :
                           cat.intensity > 0 ? '🎯 Categoria com poucos concorrentes' :
                           '✨ Categoria sem concorrência'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Mapa de Calor por Concorrente - Com Dropdown */}
      <Card className="border-l-4 border-l-indigo-600 shadow-lg">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 cursor-pointer hover:from-indigo-50 hover:to-indigo-100/50 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-slate-800 dark:text-slate-100">Intensidade por Concorrente</CardTitle>
                  <CardDescription>
                    Nível de sobreposição de portfólio com cada concorrente
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-indigo-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-indigo-600" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-6">
          {competitorIntensity.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Nenhum concorrente com produtos cadastrados.
            </p>
          ) : (
            <div className="space-y-3">
              {competitorIntensity.slice(0, 10).map((comp, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "p-4 rounded-lg transition-all cursor-help hover:scale-[1.02]",
                        getHeatBgColor(comp.intensity)
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{comp.competitor}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {comp.productsCount} produto{comp.productsCount !== 1 ? 's' : ''} • {comp.matchesCount} match{comp.matchesCount !== 1 ? 'es' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {comp.avgScore > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Avg: {comp.avgScore}%
                              </Badge>
                            )}
                            <Badge className={cn(
                              "text-white text-xs",
                              comp.intensity >= 75 ? "bg-orange-600" :
                              comp.intensity >= 50 ? "bg-orange-500" :
                              comp.intensity >= 25 ? "bg-blue-600" :
                              comp.intensity > 0 ? "bg-emerald-600" :
                              "bg-slate-500"
                            )}>
                              {Math.round(comp.intensity)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn("h-2 rounded-full transition-all", getHeatColor(comp.intensity))}
                              style={{ width: `${Math.min(100, comp.intensity)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">{comp.competitor}</p>
                        <div className="text-xs space-y-1">
                          <p>• <strong>Produtos cadastrados:</strong> {comp.productsCount}</p>
                          <p>• <strong>Matches com seu portfólio:</strong> {comp.matchesCount}</p>
                          <p>• <strong>Score médio de match:</strong> {comp.avgScore}%</p>
                          <p>• <strong>Taxa de sobreposição:</strong> {Math.round(comp.intensity)}%</p>
                        </div>
                        <p className="text-xs mt-2 pt-2 border-t">
                          {comp.intensity >= 75 ? '🔥 Concorrente direto com alta sobreposição de portfólio' :
                           comp.intensity >= 50 ? '⚠️ Concorrente com sobreposição moderada' :
                           comp.intensity >= 25 ? '✅ Concorrente com sobreposição baixa' :
                           comp.intensity > 0 ? '🎯 Concorrente com poucos produtos similares' :
                           '✨ Concorrente sem produtos similares'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {competitorIntensity.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{competitorIntensity.length - 10} outros concorrentes
                </p>
              )}
            </div>
          )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Legenda do Mapa de Calor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda de Intensidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-600" />
              <span className="text-xs">≥ 75% - Altíssima</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-xs">50-74% - Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600" />
              <span className="text-xs">25-49% - Moderada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-600" />
              <span className="text-xs">1-24% - Baixa</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

