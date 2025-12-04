/**
 * 🔥 ANÁLISE SWOT AUTOMÁTICA PROFISSIONAL
 * Baseada em melhores práticas de Competitive Intelligence e Análise Estratégica
 * 100% dinâmica - análise real do mercado
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Lightbulb, Eye, CheckCircle2, XCircle, TrendingUp, Target, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface AutoSWOTProps {
  tenantProducts: Array<{ nome: string; categoria?: string; descricao?: string }>;
  competitorProducts: Array<{ 
    nome: string; 
    categoria?: string;
    descricao?: string;
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
  
  // 🔥 FORÇAS: Análise estratégica profissional
  const calcularForcas = () => {
    const forcas: Array<{tipo: string; descricao: string; icon: any}> = [];
    
    // 1. Produtos com baixa concorrência (score < 60%)
    const produtosDiferenciados = matches.filter(m => m.bestScore < 60);
    if (produtosDiferenciados.length > 0) {
      const percent = Math.round((produtosDiferenciados.length / tenantProducts.length) * 100);
      forcas.push({
        tipo: 'PORTFÓLIO DIFERENCIADO',
        descricao: `${produtosDiferenciados.length} produtos (${percent}%) com baixa concorrência direta, permitindo pricing premium e maior margem de lucro.`,
        icon: Award
      });
    }
    
    // 2. Categorias exclusivas
    const categoriasTenant = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
    const categoriasCompetidores = new Set(competitorProducts.map(p => p.categoria).filter(Boolean));
    const categoriasExclusivas = Array.from(categoriasTenant).filter(cat => !categoriasCompetidores.has(cat));
    
    if (categoriasExclusivas.length > 0) {
      forcas.push({
        tipo: 'NICHO EXCLUSIVO',
        descricao: `Atuação exclusiva em ${categoriasExclusivas.length} categoria(s): ${categoriasExclusivas.slice(0, 2).join(', ')}${categoriasExclusivas.length > 2 ? '...' : ''}. Sem concorrência direta, posição de liderança garantida.`,
        icon: Target
      });
    }
    
    // 3. Diversificação de portfólio
    if (categoriasTenant.size >= 3) {
      forcas.push({
        tipo: 'DIVERSIFICAÇÃO ESTRATÉGICA',
        descricao: `Portfólio diversificado em ${categoriasTenant.size} categorias reduz dependência de único segmento e mitiga riscos de mercado.`,
        icon: Zap
      });
    }
    
    // 4. Volume de produtos
    if (tenantProducts.length > 20) {
      forcas.push({
        tipo: 'AMPLITUDE DE PORTFÓLIO',
        descricao: `${tenantProducts.length} produtos cadastrados demonstram capacidade produtiva robusta e expertise em múltiplas soluções.`,
        icon: CheckCircle2
      });
    }
    
    return forcas.length > 0 ? forcas : [{
      tipo: 'PRESENÇA NO MERCADO',
      descricao: `Atuação estabelecida com ${tenantProducts.length} produtos. Oportunidade de fortalecer posicionamento e diferenciais competitivos.`,
      icon: Shield
    }];
  };
  
  // 🔥 FRAQUEZAS: Análise crítica estratégica
  const calcularFraquezas = () => {
    const fraquezas: Array<{tipo: string; descricao: string; severidade: string; icon: any}> = [];
    
    // 1. Categorias com alta concorrência
    const categoriasTenant = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
    
    Array.from(categoriasTenant).forEach(cat => {
      const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
      const competitorCount = competitorProducts.filter(p => p.categoria === cat).length;
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size;
      
      if (competitorCount > tenantCount * 3 && empresas >= 3) {
        fraquezas.push({
          tipo: `DESVANTAGEM NUMÉRICA - ${cat}`,
          descricao: `${empresas} concorrentes com ${competitorCount} produtos vs seus ${tenantCount}. Risco de perda de market share por menor visibilidade e opções limitadas.`,
          severidade: 'ALTA',
          icon: AlertTriangle
        });
      }
    });
    
    // 2. Categorias de alto valor sem presença
    const categoriasGrandes = Array.from(
      new Set(competitorProducts.map(p => p.categoria).filter(Boolean))
    ).map(cat => ({
      categoria: cat,
      produtos: competitorProducts.filter(p => p.categoria === cat).length,
      empresas: new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size
    })).filter(c => c.empresas >= 5 && c.produtos >= 20);
    
    categoriasGrandes.forEach(c => {
      if (!categoriasTenant.has(c.categoria)) {
        fraquezas.push({
          tipo: `AUSÊNCIA EM CATEGORIA CHAVE - ${c.categoria}`,
          descricao: `${c.empresas} concorrentes investem pesadamente nesta categoria (${c.produtos} produtos). Sua ausência representa perda de receita potencial significativa.`,
          severidade: 'CRÍTICA',
          icon: XCircle
        });
      }
    });
    
    // 3. Produtos com alta concorrência direta
    const altaConcorrencia = matches.filter(m => m.bestScore >= 80);
    if (altaConcorrencia.length > tenantProducts.length * 0.3) {
      fraquezas.push({
        tipo: 'COMODITIZAÇÃO DE PORTFÓLIO',
        descricao: `${altaConcorrencia.length} produtos (${Math.round((altaConcorrencia.length/tenantProducts.length)*100)}%) com concorrentes idênticos. Dificulta diferenciação e pressiona margens de lucro.`,
        severidade: 'ALTA',
        icon: AlertTriangle
      });
    }
    
    return fraquezas.length > 0 ? fraquezas : [{
      tipo: 'MONITORAMENTO CONTÍNUO',
      descricao: 'Manter vigilância sobre movimentos competitivos e tendências de mercado para identificar gaps emergentes.',
      severidade: 'BAIXA',
      icon: Eye
    }];
  };
  
  // 🔥 OPORTUNIDADES: Análise estratégica de crescimento
  const calcularOportunidades = () => {
    const oportunidades: Array<{tipo: string; descricao: string; potencial: string; icon: any}> = [];
    
    // 1. Categorias com demanda comprovada (muitos concorrentes) mas baixa presença tenant
    const categoriasConcorrentes = new Set(competitorProducts.map(p => p.categoria).filter(Boolean));
    const categoriasTenant = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
    
    Array.from(categoriasConcorrentes).forEach(cat => {
      if (!categoriasTenant.has(cat)) {
        const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size;
        const produtos = competitorProducts.filter(p => p.categoria === cat).length;
        
        if (empresas >= 3) {
          oportunidades.push({
            tipo: `EXPANSÃO - ${cat}`,
            descricao: `${empresas} concorrentes atuantes com ${produtos} produtos. Demanda de mercado comprovada. Oportunidade de capturar share em segmento estabelecido.`,
            potencial: empresas >= 5 ? 'ALTO' : empresas >= 3 ? 'MÉDIO' : 'BAIXO',
            icon: TrendingUp
          });
        }
      }
    });
    
    // 2. Categorias com poucos players mas volume razoável
    Array.from(categoriasConcorrentes).forEach(cat => {
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size;
      const produtos = competitorProducts.filter(p => p.categoria === cat).length;
      const tenantNaCategoria = tenantProducts.filter(p => p.categoria === cat).length;
      
      if (empresas <= 2 && produtos >= 10 && tenantNaCategoria === 0) {
        oportunidades.push({
          tipo: `NICHO EMERGENTE - ${cat}`,
          descricao: `Apenas ${empresas} player(s) com ${produtos} produtos. Baixa competição + demanda = oportunidade de liderança rápida com investimento moderado.`,
          potencial: 'ALTO',
          icon: Lightbulb
        });
      }
    });
    
    // 3. Fortalecimento de categorias com vantagem
    const produtosDiferenciados = matches.filter(m => m.bestScore < 60);
    if (produtosDiferenciados.length > 0) {
      const categoriasFortes = new Set(produtosDiferenciados.map(m => m.tenantProduct.categoria).filter(Boolean));
      if (categoriasFortes.size > 0) {
        oportunidades.push({
          tipo: 'INTENSIFICAÇÃO DE VANTAGENS',
          descricao: `Expandir linha em ${Array.from(categoriasFortes).slice(0, 2).join(', ')} onde você já tem diferencial competitivo. Capitalizar posição forte para aumentar market share.`,
          potencial: 'ALTO',
          icon: Award
        });
      }
    }
    
    return oportunidades.slice(0, 5);
  };
  
  // 🔥 AMEAÇAS: Análise de riscos competitivos
  const calcularAmeacas = () => {
    const ameacas: Array<{tipo: string; descricao: string; urgencia: string; icon: any}> = [];
    
    // 1. Concorrentes com portfólio muito maior
    const concorrentesGrandes = Array.from(
      new Set(competitorProducts.map(p => p.competitor_name))
    ).map(comp => ({
      nome: comp,
      produtos: competitorProducts.filter(p => p.competitor_name === comp).length
    })).filter(c => c.produtos > tenantProducts.length * 2);
    
    if (concorrentesGrandes.length > 0) {
      concorrentesGrandes.forEach(c => {
        ameacas.push({
          tipo: `PLAYER DOMINANTE - ${c.nome.split(' ').slice(0, 2).join(' ')}`,
          descricao: `${c.produtos} produtos vs seus ${tenantProducts.length}. Maior visibilidade, poder de barganha com fornecedores e economias de escala. Risco de agressividade competitiva.`,
          urgencia: 'ALTA',
          icon: AlertTriangle
        });
      });
    }
    
    // 2. Alta sobreposição de produtos
    const matchesAltos = matches.filter(m => m.bestScore >= 75);
    if (matchesAltos.length > tenantProducts.length * 0.4) {
      ameacas.push({
        tipo: 'GUERRA DE PREÇOS IMINENTE',
        descricao: `${matchesAltos.length} produtos (${Math.round((matchesAltos.length/tenantProducts.length)*100)}%) com concorrentes diretos. Alta probabilidade de competição por preço, compressão de margens e necessidade de diferenciação urgente.`,
        urgencia: 'CRÍTICA',
        icon: AlertTriangle
      });
    }
    
    // 3. Concentração de concorrentes em categorias-chave
    const categoriasTenant = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
    
    Array.from(categoriasTenant).forEach(cat => {
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name)).size;
      const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
      
      if (empresas >= 5 && tenantCount < 5) {
        ameacas.push({
          tipo: `CERCO COMPETITIVO - ${cat}`,
          descricao: `${empresas} concorrentes disputam esta categoria onde você tem apenas ${tenantCount} produto(s). Risco de marginalização e perda de relevância se não expandir rapidamente.`,
          urgencia: 'ALTA',
          icon: Eye
        });
      }
    });
    
    // 4. Tendência de consolidação
    const totalConcorrentes = new Set(competitorProducts.map(p => p.competitor_name)).size;
    if (totalConcorrentes >= 10) {
      ameacas.push({
        tipo: 'CONSOLIDAÇÃO DE MERCADO',
        descricao: `${totalConcorrentes} players ativos indicam mercado fragmentado. Tendência de consolidação via M&A pode criar gigantes com recursos superiores e pressionar pequenos players.`,
        urgencia: 'MÉDIA',
        icon: AlertTriangle
      });
    }
    
    return ameacas.length > 0 ? ameacas : [{
      tipo: 'VIGILÂNCIA DE MERCADO',
      descricao: 'Manter monitoramento ativo de movimentos competitivos, lançamentos de produtos e mudanças estratégicas dos players.',
      urgencia: 'BAIXA',
      icon: Eye
    }];
  };
  
  const forcas = calcularForcas();
  const fraquezas = calcularFraquezas();
  const oportunidades = calcularOportunidades();
  const ameacas = calcularAmeacas();

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="border-purple-500/30">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 cursor-pointer hover:from-purple-100 hover:to-purple-200/50 dark:hover:from-purple-900/40 dark:hover:to-purple-800/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600/10 rounded-lg">
                  <Target className="h-5 w-5 text-purple-700 dark:text-purple-500" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg text-purple-800 dark:text-purple-100">
                    Análise SWOT Automática
                  </CardTitle>
                  <CardDescription>
                    Análise estratégica profissional baseada em inteligência competitiva
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
              <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Shield className="h-5 w-5" />
                    Forças (Strengths)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forcas.map((f, idx) => {
                      const Icon = f.icon;
                      return (
                        <div key={idx} className="border-b border-green-200 dark:border-green-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-800 dark:text-green-300">{f.tipo}</p>
                              <p className="text-xs text-muted-foreground mt-1">{f.descricao}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ❌ FRAQUEZAS */}
              <Card className="border-red-500/30 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Fraquezas (Weaknesses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fraquezas.map((f, idx) => {
                      const Icon = f.icon;
                      return (
                        <div key={idx} className="border-b border-red-200 dark:border-red-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-red-800 dark:text-red-300">{f.tipo}</p>
                                <Badge className={cn(
                                  "text-[10px] h-4",
                                  f.severidade === 'CRÍTICA' ? 'bg-red-600' :
                                  f.severidade === 'ALTA' ? 'bg-orange-600' :
                                  'bg-yellow-600'
                                )}>{f.severidade}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{f.descricao}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 💡 OPORTUNIDADES */}
              <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Lightbulb className="h-5 w-5" />
                    Oportunidades (Opportunities)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {oportunidades.length > 0 ? oportunidades.map((o, idx) => {
                      const Icon = o.icon;
                      return (
                        <div key={idx} className="border-b border-blue-200 dark:border-blue-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{o.tipo}</p>
                                <Badge className={cn(
                                  "text-[10px] h-4",
                                  o.potencial === 'ALTO' ? 'bg-blue-700' :
                                  o.potencial === 'MÉDIO' ? 'bg-blue-500' :
                                  'bg-blue-400'
                                )}>{o.potencial}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{o.descricao}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-sm text-muted-foreground italic">Expanda para novos mercados e categorias.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ⚠️ AMEAÇAS */}
              <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Eye className="h-5 w-5" />
                    Ameaças (Threats)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ameacas.map((a, idx) => {
                      const Icon = a.icon;
                      return (
                        <div key={idx} className="border-b border-amber-200 dark:border-amber-800 pb-3 last:border-0">
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{a.tipo}</p>
                                <Badge className={cn(
                                  "text-[10px] h-4",
                                  a.urgencia === 'CRÍTICA' ? 'bg-red-600' :
                                  a.urgencia === 'ALTA' ? 'bg-orange-600' :
                                  a.urgencia === 'MÉDIA' ? 'bg-yellow-600' :
                                  'bg-blue-500'
                                )}>{a.urgencia}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{a.descricao}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
