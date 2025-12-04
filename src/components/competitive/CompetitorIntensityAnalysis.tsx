/**
 * 🔥 ANÁLISE REVOLUCIONÁRIA DE INTENSIDADE COMPETITIVA
 * Baseado em melhores práticas de Competitive Intelligence
 * 100% dinâmico - funciona para QUALQUER segmento
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Shield, Target, Flame, Award, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';

interface CompetitorIntensityProps {
  tenantProducts: Array<{ nome: string; categoria?: string }>;
  competitorProducts: Array<{ 
    nome: string; 
    categoria?: string;
    competitor_name: string;
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
}

export default function CompetitorIntensityAnalysis({ 
  tenantProducts, 
  competitorProducts,
  matches
}: CompetitorIntensityProps) {
  
  // Estados para dropdowns COM PERSISTÊNCIA
  const [radarOpen, setRadarOpen] = useState(() => {
    const saved = localStorage.getItem('competitorIntensity_radarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [rankingOpen, setRankingOpen] = useState(() => {
    const saved = localStorage.getItem('competitorIntensity_rankingOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [resumoOpen, setResumoOpen] = useState(() => {
    const saved = localStorage.getItem('competitorIntensity_resumoOpen');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Persistir estados no localStorage
  useEffect(() => {
    localStorage.setItem('competitorIntensity_radarOpen', JSON.stringify(radarOpen));
  }, [radarOpen]);
  
  useEffect(() => {
    localStorage.setItem('competitorIntensity_rankingOpen', JSON.stringify(rankingOpen));
  }, [rankingOpen]);
  
  useEffect(() => {
    localStorage.setItem('competitorIntensity_resumoOpen', JSON.stringify(resumoOpen));
  }, [resumoOpen]);
  
  // 🔥 NOVO: Calcular SCORE DE AMEAÇA COMPOSTO para cada concorrente
  const calculateThreatScore = (competitorName: string) => {
    const competitorProds = competitorProducts.filter(p => p.competitor_name === competitorName);
    const totalProducts = competitorProds.length;
    
    // 1. OVERLAP DE PORTFÓLIO (40%)
    const matchesWithTenant = matches.filter(m => 
      m.competitorProducts.some(cp => cp.competitor_name === competitorName && cp.matchScore >= 60)
    ).length;
    const overlapRate = tenantProducts.length > 0 ? (matchesWithTenant / tenantProducts.length) * 100 : 0;
    
    // 2. VOLUME/TAMANHO (20%) - normalizado por 100 produtos
    const volumeScore = Math.min(100, (totalProducts / 100) * 100);
    
    // 3. QUALIDADE DOS MATCHES (30%)
    const matchScores = matches
      .flatMap(m => m.competitorProducts.filter(cp => cp.competitor_name === competitorName))
      .map(cp => cp.matchScore);
    const avgMatchQuality = matchScores.length > 0 
      ? matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length 
      : 0;
    
    // 4. CATEGORIAS EM CONFLITO (10%)
    const tenantCategories = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
    const competitorCategories = new Set(competitorProds.map(p => p.categoria).filter(Boolean));
    const conflictingCategories = Array.from(tenantCategories).filter(cat => competitorCategories.has(cat)).length;
    const categoryConflictScore = tenantCategories.size > 0 ? (conflictingCategories / tenantCategories.size) * 100 : 0;
    
    // 🎯 FÓRMULA FINAL
    const threatScore = 
      (overlapRate * 0.4) + 
      (volumeScore * 0.2) + 
      (avgMatchQuality * 0.3) + 
      (categoryConflictScore * 0.1);
    
    return {
      totalScore: Math.round(threatScore),
      breakdown: {
        overlap: Math.round(overlapRate),
        volume: Math.round(volumeScore),
        quality: Math.round(avgMatchQuality),
        categoryConflict: Math.round(categoryConflictScore)
      },
      metrics: {
        totalProducts,
        matchesCount: matchesWithTenant,
        avgMatchScore: Math.round(avgMatchQuality),
        conflictingCategories
      }
    };
  };
  
  // Agrupar concorrentes únicos
  const competitors = Array.from(
    new Set(competitorProducts.map(p => p.competitor_name))
  ).filter(Boolean);
  
  // Calcular scores para todos
  const competitorAnalysis = competitors.map(comp => {
    const analysis = calculateThreatScore(comp);
    return {
      name: comp,
      shortName: comp.split(' ').slice(0, 2).join(' '),
      ...analysis
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
  
  // Classificar nível de ameaça
  const getThreatLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 80) return { level: 'CRÍTICA', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950/30' };
    if (score >= 60) return { level: 'ALTA', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-950/30' };
    if (score >= 40) return { level: 'MODERADA', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-950/30' };
    return { level: 'BAIXA', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-950/30' };
  };
  
  // Preparar dados para Radar Chart (Top 5 concorrentes)
  const radarData = [
    'Overlap Portfólio',
    'Volume Produtos',
    'Qualidade Matches',
    'Conflito Categorias',
    'Ameaça Total'
  ].map(metric => {
    const dataPoint: any = { metric };
    
    competitorAnalysis.slice(0, 5).forEach(comp => {
      switch(metric) {
        case 'Overlap Portfólio':
          dataPoint[comp.shortName] = comp.breakdown.overlap;
          break;
        case 'Volume Produtos':
          dataPoint[comp.shortName] = comp.breakdown.volume;
          break;
        case 'Qualidade Matches':
          dataPoint[comp.shortName] = comp.breakdown.quality;
          break;
        case 'Conflito Categorias':
          dataPoint[comp.shortName] = comp.breakdown.categoryConflict;
          break;
        case 'Ameaça Total':
          dataPoint[comp.shortName] = comp.totalScore;
          break;
      }
    });
    
    return dataPoint;
  });
  
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* 🔥 GRÁFICO RADAR - Comparação Visual */}
      {competitorAnalysis.length > 0 && (
        <Collapsible open={radarOpen} onOpenChange={setRadarOpen}>
          <Card className="border-purple-500/30">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-left">
                      <Target className="h-5 w-5 text-purple-500" />
                      Análise Multidimensional de Ameaça (Top 5)
                    </CardTitle>
                    <CardDescription className="text-left">
                      Comparação visual em 5 dimensões estratégicas
                    </CardDescription>
                  </div>
                  {radarOpen ? <ChevronUp className="h-5 w-5 text-purple-500" /> : <ChevronDown className="h-5 w-5 text-purple-500" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" className="opacity-30" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {competitorAnalysis.slice(0, 5).map((comp, idx) => (
                  <Radar
                    key={idx}
                    name={comp.shortName}
                    dataKey={comp.shortName}
                    stroke={colors[idx]}
                    fill={colors[idx]}
                    fillOpacity={0.3}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
      )}
      
      {/* 🔥 RANKING DE AMEAÇA COMPETITIVA */}
      <Collapsible open={rankingOpen} onOpenChange={setRankingOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-left">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Ranking de Ameaça Competitiva
                  </CardTitle>
                  <CardDescription className="text-left">
                    Score composto baseado em 4 dimensões estratégicas
                  </CardDescription>
                </div>
                {rankingOpen ? <ChevronUp className="h-5 w-5 text-orange-500" /> : <ChevronDown className="h-5 w-5 text-orange-500" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
          {competitorAnalysis.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Nenhum concorrente cadastrado.
            </p>
          ) : (
            competitorAnalysis.map((comp, idx) => {
              const threat = getThreatLevel(comp.totalScore);
              
              return (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "p-4 rounded-lg border-2 transition-all cursor-help hover:scale-[1.01]",
                        threat.bgColor,
                        idx === 0 && "border-red-500 shadow-lg"
                      )}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-sm">
                              #{idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{comp.shortName}</p>
                              <p className="text-xs text-muted-foreground">
                                {comp.metrics.totalProducts} produtos • {comp.metrics.matchesCount} matches
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-white", threat.color.replace('text-', 'bg-'))}>
                              {threat.level}
                            </Badge>
                            <span className="text-2xl font-bold">{comp.totalScore}%</span>
                          </div>
                        </div>
                        
                        {/* Breakdown Visual */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">Overlap (40%)</p>
                            <Progress value={comp.breakdown.overlap} className="h-2" />
                            <span className="text-xs font-semibold">{comp.breakdown.overlap}%</span>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Volume (20%)</p>
                            <Progress value={comp.breakdown.volume} className="h-2" />
                            <span className="text-xs font-semibold">{comp.breakdown.volume}%</span>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Qualidade (30%)</p>
                            <Progress value={comp.breakdown.quality} className="h-2" />
                            <span className="text-xs font-semibold">{comp.breakdown.quality}%</span>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Conflito (10%)</p>
                            <Progress value={comp.breakdown.categoryConflict} className="h-2" />
                            <span className="text-xs font-semibold">{comp.breakdown.categoryConflict}%</span>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <div className="space-y-3">
                        <div>
                          <p className="font-bold text-sm mb-1">{comp.name}</p>
                          <Badge className={threat.color.replace('text-', 'bg-').concat(' text-white')}>
                            Ameaça {threat.level} - {comp.totalScore}%
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <p><strong>📊 Breakdown do Score:</strong></p>
                          <ul className="space-y-1 ml-4">
                            <li>• <strong>Overlap:</strong> {comp.breakdown.overlap}% ({comp.metrics.matchesCount}/{tenantProducts.length} produtos similares)</li>
                            <li>• <strong>Volume:</strong> {comp.breakdown.volume}% ({comp.metrics.totalProducts} produtos totais)</li>
                            <li>• <strong>Qualidade:</strong> {comp.breakdown.quality}% (score médio de match)</li>
                            <li>• <strong>Conflito:</strong> {comp.breakdown.categoryConflict}% ({comp.metrics.conflictingCategories} categorias em comum)</li>
                          </ul>
                        </div>
                        
                        <div className="pt-2 border-t space-y-1">
                          <p className="text-xs"><strong>🎯 Recomendação Estratégica:</strong></p>
                          <p className="text-xs">
                            {comp.totalScore >= 80 ? (
                              <span className="text-red-600">🔥 AÇÃO URGENTE: Concorrente direto! Diferencie-se imediatamente ou considere parceria estratégica.</span>
                            ) : comp.totalScore >= 60 ? (
                              <span className="text-orange-600">⚠️ MONITORAR: Ameaça significativa. Fortaleça seus diferenciais nas categorias em conflito.</span>
                            ) : comp.totalScore >= 40 ? (
                              <span className="text-yellow-600">👀 OBSERVAR: Concorrente tangencial. Monitore movimentos em categorias estratégicas.</span>
                            ) : (
                              <span className="text-green-600">✅ BAIXA PRIORIDADE: Pouca sobreposição. Foque em concorrentes mais críticos.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })
          )}
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
      
      {/* 🔥 RESUMO EXECUTIVO */}
      <Collapsible open={resumoOpen} onOpenChange={setResumoOpen}>
        <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-left">
                  <Info className="h-5 w-5" />
                  Resumo Executivo - Análise de Intensidade
                </CardTitle>
                {resumoOpen ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
          <div className="space-y-3 text-sm">
            {(() => {
              const criticos = competitorAnalysis.filter(c => c.totalScore >= 80);
              const altos = competitorAnalysis.filter(c => c.totalScore >= 60 && c.totalScore < 80);
              const moderados = competitorAnalysis.filter(c => c.totalScore >= 40 && c.totalScore < 60);
              const baixos = competitorAnalysis.filter(c => c.totalScore < 40);
              
              return (
                <>
                  {criticos.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-950/30 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-700 dark:text-red-400">🔥 AMEAÇA CRÍTICA ({criticos.length})</p>
                        <p className="text-xs mt-1">
                          <strong>{criticos.map(c => c.shortName).join(', ')}</strong> representam ameaça direta.
                          Alto overlap de portfólio ({criticos[0].breakdown.overlap}% média) exige diferenciação urgente.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {altos.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
                      <Shield className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-orange-700 dark:text-orange-400">⚠️ AMEAÇA ALTA ({altos.length})</p>
                        <p className="text-xs mt-1">
                          {altos.map(c => c.shortName).join(', ')} exigem monitoramento próximo.
                          Fortaleça posicionamento em categorias estratégicas.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {moderados.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-700 dark:text-yellow-400">👀 AMEAÇA MODERADA ({moderados.length})</p>
                        <p className="text-xs mt-1">
                          Concorrentes tangenciais. Monitore movimentos, mas foque em ameaças críticas.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {baixos.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                      <Award className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-green-700 dark:text-green-400">✅ AMEAÇA BAIXA ({baixos.length})</p>
                        <p className="text-xs mt-1">
                          Pouca sobreposição de portfólio. Seus produtos têm posicionamento diferenciado.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
    </div>
  );
}

