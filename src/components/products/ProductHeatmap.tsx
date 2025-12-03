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
  
  // 🔥 NOVO: Criar MATRIZ de intensidade (Categoria x Concorrente)
  const heatmapMatrix = categories.map(cat => {
    const row: any = {
      categoria: cat,
      tenantCount: tenantProducts.filter(p => p.categoria === cat).length,
    };
    
    // Para cada concorrente, calcular quantos produtos tem nesta categoria
    competitors.forEach(comp => {
      const produtosNaCategoria = competitorProducts.filter(p => 
        p.categoria === cat && p.competitor_name === comp
      ).length;
      
      row[comp] = produtosNaCategoria;
    });
    
    return row;
  }).filter(row => row.tenantCount > 0 || Object.values(row).some((v: any) => typeof v === 'number' && v > 0));
  
  // Calcular intensidade total por categoria (para ordenação)
  const categoryIntensity = categories.map(cat => {
    const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
    const competitorCount = competitorProducts.filter(p => p.categoria === cat).length;
    const matchesInCategory = matches.filter(m => 
      m.tenantProduct.categoria === cat && m.bestScore >= 60
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
  }).sort((a, b) => (b.tenantCount + b.competitorCount) - (a.tenantCount + a.competitorCount));
  
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
            {categoryIntensity.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">
                Nenhuma categoria disponível. Adicione produtos e concorrentes.
              </p>
            ) : (
              <>
                {/* 🔥 HEATMAP VISUAL - GRID DE CÉLULAS COLORIDAS */}
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header do Grid */}
                    <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `200px repeat(${competitors.length + 1}, 80px)` }}>
                      <div className="p-2 font-bold text-xs bg-slate-200 dark:bg-slate-800 rounded flex items-center">
                        Categoria
                      </div>
                      <div className="p-2 text-center font-bold text-xs bg-green-100 dark:bg-green-900/30 rounded">
                        VOCÊ
                      </div>
                      {competitors.map((comp, idx) => (
                        <TooltipProvider key={idx}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-2 text-center font-bold text-[10px] bg-orange-50 dark:bg-orange-900/20 rounded cursor-help truncate">
                                {comp.split(' ')[0]}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-[200px]">{comp}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    
                    {/* Grid de Células - HEATMAP REAL */}
                    {heatmapMatrix.map((row, rowIdx) => (
                      <div key={rowIdx} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `200px repeat(${competitors.length + 1}, 80px)` }}>
                        {/* Nome da Categoria */}
                        <div className="p-2 text-xs font-medium bg-slate-100 dark:bg-slate-800/50 rounded truncate">
                          {row.categoria}
                        </div>
                        
                        {/* Célula do Tenant */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "p-2 text-center text-xs font-bold rounded cursor-help transition-all hover:scale-105",
                                row.tenantCount > 0 
                                  ? "bg-green-500 text-white" 
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                              )}>
                                {row.tenantCount || '-'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                <strong>Seus produtos:</strong> {row.tenantCount}
                                {row.tenantCount > 0 ? ' ✅' : ' (Oportunidade de expansão!)'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* Células dos Concorrentes */}
                        {competitors.map((comp, compIdx) => {
                          const count = row[comp] || 0;
                          const maxCount = Math.max(...competitors.map(c => row[c] || 0));
                          const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          
                          return (
                            <TooltipProvider key={compIdx}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn(
                                    "p-2 text-center text-xs font-bold rounded cursor-help transition-all hover:scale-105",
                                    intensity >= 75 ? "bg-red-500 text-white" :
                                    intensity >= 50 ? "bg-orange-500 text-white" :
                                    intensity >= 25 ? "bg-yellow-500 text-black" :
                                    count > 0 ? "bg-green-400 text-black" :
                                    "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                  )}>
                                    {count || '-'}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold">{comp}</p>
                                    <p className="text-xs"><strong>Categoria:</strong> {row.categoria}</p>
                                    <p className="text-xs"><strong>Produtos:</strong> {count}</p>
                                    {count > 0 && row.tenantCount > 0 && (
                                      <p className="text-xs mt-2 pt-2 border-t text-orange-500">
                                        🔥 CONCORRÊNCIA DIRETA nesta categoria!
                                      </p>
                                    )}
                                    {count > 0 && row.tenantCount === 0 && (
                                      <p className="text-xs mt-2 pt-2 border-t text-blue-500">
                                        💡 OPORTUNIDADE: Eles têm {count} produto{count > 1 ? 's' : ''}, você não atua aqui
                                      </p>
                                    )}
                                    {count === 0 && row.tenantCount > 0 && (
                                      <p className="text-xs mt-2 pt-2 border-t text-green-500">
                                        ✅ DIFERENCIAL: Você atua, eles não!
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Legenda do Heatmap */}
                <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500" />
                    <span className="text-xs">Altíssima (líder)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-500" />
                    <span className="text-xs">Alta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-yellow-500" />
                    <span className="text-xs">Moderada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-400" />
                    <span className="text-xs">Baixa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-300 dark:bg-slate-700" />
                    <span className="text-xs">Nenhum produto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500" />
                    <span className="text-xs font-bold">VOCÊ (Tenant)</span>
                  </div>
                </div>
                
                {/* 🔥 ANÁLISE DE IA - Recomendações Estratégicas */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-600">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-blue-600" />
                    Análise Estratégica de IA
                  </h4>
                  <div className="space-y-2 text-xs">
                    {(() => {
                      const recomendacoes = [];
                      
                      // Categorias onde tenant lidera
                      const categoriasLideres = categoryIntensity.filter(c => 
                        c.tenantCount > 0 && c.competitorCount === 0
                      );
                      if (categoriasLideres.length > 0) {
                        recomendacoes.push(
                          <p key="lideres" className="flex items-start gap-2">
                            <span className="text-green-600">✅</span>
                            <span><strong>DIFERENCIAIS ÚNICOS:</strong> Você é único em {categoriasLideres.length} categoria{categoriasLideres.length > 1 ? 's' : ''}: {categoriasLideres.slice(0, 3).map(c => c.categoria).join(', ')}</span>
                          </p>
                        );
                      }
                      
                      // Categorias com alta concorrência
                      const altaConcorrencia = categoryIntensity.filter(c => 
                        c.tenantCount > 0 && c.competitorCount > 5
                      );
                      if (altaConcorrencia.length > 0) {
                        recomendacoes.push(
                          <p key="alta-conc" className="flex items-start gap-2">
                            <span className="text-red-600">🔥</span>
                            <span><strong>ALTA COMPETIÇÃO:</strong> {altaConcorrencia.length} categoria{altaConcorrencia.length > 1 ? 's' : ''} com muitos players. Foque em diferenciação!</span>
                          </p>
                        );
                      }
                      
                      // Oportunidades (concorrentes têm, tenant não)
                      const oportunidades = categoryIntensity.filter(c => 
                        c.tenantCount === 0 && c.competitorCount >= 2
                      );
                      if (oportunidades.length > 0) {
                        recomendacoes.push(
                          <p key="oport" className="flex items-start gap-2">
                            <span className="text-blue-600">💡</span>
                            <span><strong>OPORTUNIDADES:</strong> {oportunidades.length} categoria{oportunidades.length > 1 ? 's' : ''} explorada{oportunidades.length > 1 ? 's' : ''} por múltiplos concorrentes. Considere expandir!</span>
                          </p>
                        );
                      }
                      
                      // Nichos com poucos players
                      const nichos = categoryIntensity.filter(c => 
                        c.tenantCount > 0 && c.competitorCount >= 1 && c.competitorCount <= 3
                      );
                      if (nichos.length > 0) {
                        recomendacoes.push(
                          <p key="nichos" className="flex items-start gap-2">
                            <span className="text-yellow-600">⭐</span>
                            <span><strong>NICHOS PROMISSORES:</strong> {nichos.length} categoria{nichos.length > 1 ? 's' : ''} com baixa concorrência. Potencial de crescimento!</span>
                          </p>
                        );
                      }
                      
                      return recomendacoes.length > 0 ? recomendacoes : (
                        <p className="text-muted-foreground italic">Adicione produtos e concorrentes para ver análises estratégicas.</p>
                      );
                    })()}
                  </div>
                </div>
              </>
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
    </div>
  );
}

