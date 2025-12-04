/**
 * 🔥 ANÁLISE SWOT PROFISSIONAL
 * Baseada em critérios estratégicos reais de grandes empresas
 * Considera TODAS as dimensões competitivas
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Lightbulb, Eye, CheckCircle2, XCircle, TrendingUp, Target, ChevronDown, ChevronUp, Flame, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AutoSWOTProps {
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
    matchType: 'exact' | 'similar' | 'unique';
  }>;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function AutoSWOTAnalysis({ 
  tenantProducts, 
  competitorProducts,
  matches,
  isOpen = true,
  onToggle
}: AutoSWOTProps) {
  
  const categoriasTenant = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
  const categoriasConcorrentes = new Set(competitorProducts.map(p => p.categoria).filter(Boolean));
  const totalConcorrentes = Array.from(new Set(competitorProducts.map(p => p.competitor_name))).length;
  
  // ✅ FORÇAS: Nichos exclusivos + Vantagens competitivas
  const forcas = Array.from(categoriasTenant)
    .filter(cat => !categoriasConcorrentes.has(cat)) // Categorias SEM concorrentes
    .map(cat => {
      const produtos = tenantProducts.filter(p => p.categoria === cat);
      return {
        tipo: 'NICHO EXCLUSIVO',
        categoria: cat,
        quantidade: produtos.length,
        produtos: produtos.map(p => p.nome),
        impacto: 'ALTO'
      };
    })
    .sort((a, b) => b.quantidade - a.quantidade);
  
  // Adicionar força se tem boa diversificação
  if (categoriasTenant.size >= 3) {
    forcas.push({
      tipo: 'DIVERSIFICAÇÃO',
      categoria: `${categoriasTenant.size} categorias diferentes`,
      quantidade: tenantProducts.length,
      produtos: [],
      impacto: 'MÉDIO'
    });
  }
  
  // ❌ FRAQUEZAS: Gaps competitivos críticos
  const fraquezas: Array<{tipo: string; categoria: string; gap: number; empresas: number; produtos: number; severidade: string}> = [];
  
  // 1. Categorias grandes onde tenant NÃO atua
  Array.from(categoriasConcorrentes)
    .filter(cat => !categoriasTenant.has(cat))
    .forEach(cat => {
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size;
      const produtos = competitorProducts.filter(p => p.categoria === cat).length;
      
      if (produtos >= 20) { // Categorias grandes
        fraquezas.push({
          tipo: 'AUSÊNCIA CRÍTICA',
          categoria: cat,
          gap: produtos,
          empresas,
          produtos,
          severidade: empresas >= 5 ? 'CRÍTICA' : 'ALTA'
        });
      }
    });
  
  // 2. Volume total menor que concorrentes
  const mediaProdutosConcorrente = totalConcorrentes > 0 ? competitorProducts.length / totalConcorrentes : 0;
  if (tenantProducts.length < mediaProdutosConcorrente * 0.7) {
    fraquezas.push({
      tipo: 'ESCALA REDUZIDA',
      categoria: 'Portfólio geral',
      gap: Math.round(mediaProdutosConcorrente - tenantProducts.length),
      empresas: totalConcorrentes,
      produtos: tenantProducts.length,
      severidade: 'ALTA'
    });
  }
  
  // 💡 OPORTUNIDADES: Expansão para categorias com demanda comprovada
  const oportunidades = Array.from(categoriasConcorrentes)
    .filter(cat => !categoriasTenant.has(cat)) // Tenant NÃO atua
    .map(cat => {
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name));
      const produtos = competitorProducts.filter(p => p.categoria === cat).length;
      
      return {
        categoria: cat,
        empresas: empresas.size,
        produtos,
        potencial: empresas.size >= 5 ? 'ALTO' : empresas.size >= 3 ? 'MÉDIO' : 'BAIXO',
        razao: empresas.size >= 5 
          ? 'Mercado maduro com alta demanda'
          : empresas.size >= 3 
          ? 'Mercado em crescimento' 
          : 'Nicho emergente'
      };
    })
    .sort((a, b) => b.empresas - a.empresas)
    .slice(0, 5);
  
  // ⚠️ AMEAÇAS: TODAS as dimensões competitivas
  const ameacas: Array<{tipo: string; descricao: string; impacto: string; urgencia: string}> = [];
  
  // 1. AMEAÇA: Número de concorrentes (intensidade competitiva)
  if (totalConcorrentes >= 10) {
    ameacas.push({
      tipo: 'MERCADO SATURADO',
      descricao: `${totalConcorrentes} concorrentes ativos no mercado. Alta intensidade competitiva, pressão de preços e guerra por market share.`,
      impacto: 'ALTO',
      urgencia: 'CRÍTICA'
    });
  } else if (totalConcorrentes >= 5) {
    ameacas.push({
      tipo: 'COMPETIÇÃO INTENSA',
      descricao: `${totalConcorrentes} players disputando mercado. Risco de consolidação e agressividade comercial.`,
      impacto: 'MÉDIO',
      urgencia: 'ALTA'
    });
  }
  
  // 2. AMEAÇA: Concorrentes MUITO maiores (economias de escala)
  const concorrentesGrandes = Array.from(new Set(competitorProducts.map(p => p.competitor_name)))
    .map(comp => ({
      nome: comp,
      produtos: competitorProducts.filter(p => p.competitor_name === comp).length
    }))
    .filter(c => c.produtos > tenantProducts.length * 1.5) // 50% maiores
    .sort((a, b) => b.produtos - a.produtos);
  
  if (concorrentesGrandes.length > 0) {
    const top3 = concorrentesGrandes.slice(0, 3).map(c => `${c.nome.split(' ')[0]} (${c.produtos})`).join(', ');
    ameacas.push({
      tipo: 'PLAYERS DOMINANTES',
      descricao: `${concorrentesGrandes.length} concorrente(s) com portfólio superior: ${top3}. Vantagens em escala, barganha e recursos.`,
      impacto: 'ALTO',
      urgencia: 'ALTA'
    });
  }
  
  // 3. AMEAÇA: Competição direta em categorias estratégicas
  Array.from(categoriasTenant).forEach(cat => {
    const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
    const competitorCount = competitorProducts.filter(p => p.categoria === cat).length;
    const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size;
    
    if (competitorCount > 0 && empresas >= 1) {
      // Calcular intensidade de competição REAL
      const matchesNaCategoria = matches.filter(m => 
        m.tenantProduct.categoria === cat && 
        m.bestScore >= 60
      ).length;
      
      const intensidade = tenantCount > 0 ? (matchesNaCategoria / tenantCount) * 100 : 0;
      
      // Se concorrente tem MUITO mais produtos OU alta intensidade de match
      if (competitorCount > tenantCount * 2 || intensidade >= 50) {
        ameacas.push({
          tipo: `COMPETIÇÃO DIRETA - ${cat}`,
          descricao: `${empresas} concorrente(s) com ${competitorCount} produtos vs seus ${tenantCount}. ${matchesNaCategoria} matches diretos (${Math.round(intensidade)}% intensidade).`,
          impacto: competitorCount > tenantCount * 3 ? 'ALTO' : 'MÉDIO',
          urgencia: intensidade >= 75 ? 'CRÍTICA' : intensidade >= 50 ? 'ALTA' : 'MÉDIA'
        });
      }
    }
  });
  
  // 4. AMEAÇA: Ausência em categorias-chave = Perda de relevância
  const categoriasCriticas = Array.from(categoriasConcorrentes)
    .map(cat => ({
      categoria: cat,
      empresas: new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size,
      produtos: competitorProducts.filter(p => p.categoria === cat).length
    }))
    .filter(c => c.empresas >= 5) // Categorias com muitos players = importantes
    .filter(c => !categoriasTenant.has(c.categoria)); // Tenant NÃO atua
  
  if (categoriasCriticas.length > 0) {
    const top = categoriasCriticas[0];
    ameacas.push({
      tipo: 'PERDA DE RELEVÂNCIA',
      descricao: `Ausência em "${top.categoria}" (${top.empresas} concorrentes, ${top.produtos} produtos). Risco de marginalização no mercado principal.`,
      impacto: 'ALTO',
      urgencia: 'ALTA'
    });
  }
  
  // 5. AMEAÇA: Risco de commoditização
  const altaConcorrencia = matches.filter(m => m.bestScore >= 75).length;
  if (altaConcorrencia > tenantProducts.length * 0.3) {
    ameacas.push({
      tipo: 'COMMODITIZAÇÃO',
      descricao: `${altaConcorrencia} produtos (${Math.round((altaConcorrencia/tenantProducts.length)*100)}%) com concorrentes idênticos. Pressão de preços e erosão de margens.`,
      impacto: 'MÉDIO',
      urgencia: 'MÉDIA'
    });
  }
  
  // Ordenar ameaças por urgência
  const ordenacaoUrgencia: Record<string, number> = { 'CRÍTICA': 4, 'ALTA': 3, 'MÉDIA': 2, 'BAIXA': 1 };
  ameacas.sort((a, b) => (ordenacaoUrgencia[b.urgencia] || 0) - (ordenacaoUrgencia[a.urgencia] || 0));

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="border-l-4 border-l-purple-600/90 shadow-md">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 cursor-pointer hover:from-purple-50/60 hover:to-purple-100/40 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/10 rounded-lg">
                  <Target className="h-5 w-5 text-purple-700 dark:text-purple-500" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg text-purple-800 dark:text-purple-100 font-semibold">
                    Análise SWOT Profissional
                  </CardTitle>
                  <CardDescription>
                    Análise estratégica completa baseada em {tenantProducts.length} seus produtos vs {competitorProducts.length} de {totalConcorrentes} concorrentes
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-purple-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-purple-600" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* ✅ FORÇAS */}
              <Card className="border-emerald-200/40 bg-slate-50/30 dark:bg-slate-900/40 dark:border-emerald-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Forças (Strengths)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {forcas.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Todas as suas categorias enfrentam concorrência. Foque em diferenciação.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {forcas.map((f, idx) => (
                        <li key={idx} className="border-b border-green-200 dark:border-green-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold">{f.categoria}</p>
                                <Badge className="bg-emerald-600/90 text-white text-[10px]">
                                  {f.tipo}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {f.quantidade} produto{f.quantidade > 1 ? 's' : ''} SEM NENHUM concorrente direto
                              </p>
                              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                                <Award className="h-3 w-3 text-emerald-600" />
                                Posição de liderança exclusiva - Capacidade de pricing premium
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* ❌ FRAQUEZAS */}
              <Card className="border-rose-200/40 bg-slate-50/30 dark:bg-slate-900/40 dark:border-rose-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    Fraquezas (Weaknesses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fraquezas.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Portfólio competitivo sem gaps críticos identificados.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {fraquezas.slice(0, 5).map((f, idx) => (
                        <li key={idx} className="border-b border-red-200 dark:border-red-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold">{f.categoria}</p>
                                <Badge className={cn(
                                  "text-white text-[10px]",
                                  f.severidade === 'CRÍTICA' ? 'bg-rose-700/90' : 'bg-rose-600/90'
                                )}>
                                  {f.severidade}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {f.tipo === 'AUSÊNCIA CRÍTICA' 
                                  ? `${f.empresas} concorrentes com ${f.produtos} produtos. Você NÃO atua nesta categoria.`
                                  : `Portfólio de ${f.produtos} produtos vs média de ${Math.round(mediaProdutosConcorrente)} dos concorrentes.`
                                }
                              </p>
                              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 font-medium">
                                ⚠️ {f.tipo === 'AUSÊNCIA CRÍTICA' 
                                  ? 'Perda de receita potencial + risco de irrelevância'
                                  : 'Limitações em escala, barganha e investimento em P&D'
                                }
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* 💡 OPORTUNIDADES */}
              <Card className="border-sky-200/40 bg-slate-50/30 dark:bg-slate-900/40 dark:border-sky-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
                    <Lightbulb className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Oportunidades (Opportunities)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {oportunidades.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Você já cobre todas as categorias exploradas pelos concorrentes.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {oportunidades.map((o, idx) => (
                        <li key={idx} className="border-b border-blue-200 dark:border-blue-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold">{o.categoria}</p>
                                <Badge className={cn(
                                  "text-white text-[10px]",
                                  o.potencial === 'ALTO' ? 'bg-sky-700/90' :
                                  o.potencial === 'MÉDIO' ? 'bg-sky-600/90' :
                                  'bg-sky-500/90'
                                )}>
                                  {o.potencial}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {o.empresas} concorrente{o.empresas > 1 ? 's' : ''} com {o.produtos} produto{o.produtos > 1 ? 's' : ''} ativos
                              </p>
                              <p className="text-xs text-sky-700 dark:text-sky-400 mt-1 font-medium">
                                🎯 {o.razao} - Entrada estratégica recomendada
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* ⚠️ AMEAÇAS */}
              <Card className="border-orange-200/40 bg-slate-50/30 dark:bg-slate-900/40 dark:border-orange-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    Ameaças (Threats)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ameacas.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Mercado favorável sem ameaças imediatas identificadas.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {ameacas.map((a, idx) => (
                        <li key={idx} className="border-b border-amber-200 dark:border-amber-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold">{a.tipo}</p>
                                <Badge className={cn(
                                  "text-white text-[10px]",
                                  a.urgencia === 'CRÍTICA' ? 'bg-rose-700/90' :
                                  a.urgencia === 'ALTA' ? 'bg-orange-600/90' :
                                  a.urgencia === 'MÉDIA' ? 'bg-amber-600/90' :
                                  'bg-slate-500/90'
                                )}>
                                  {a.urgencia}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {a.descricao}
                              </p>
                              <Badge variant="outline" className="mt-2 text-[10px]">
                                Impacto: {a.impacto}
                              </Badge>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
