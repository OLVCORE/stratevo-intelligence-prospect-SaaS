/**
 * 🔥 ANÁLISE SWOT AUTOMÁTICA
 * Gera SWOT baseado nos dados REAIS de produtos e concorrentes
 * 100% dinâmico - sem hardcode
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Lightbulb, Eye, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export default function AutoSWOTAnalysis({ 
  tenantProducts, 
  competitorProducts,
  matches
}: AutoSWOTProps) {
  
  // 🔥 FORÇAS: Produtos únicos (sem concorrência)
  const forcas = matches
    .filter(m => m.matchType === 'unique')
    .map(m => m.tenantProduct);
  
  // Agrupar por categoria
  const forcasPorCategoria = forcas.reduce((acc, prod) => {
    const cat = prod.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(prod.nome);
    return acc;
  }, {} as Record<string, string[]>);
  
  // 🔥 FRAQUEZAS: Categorias onde concorrentes são muito fortes
  const categoriasFortes = competitorProducts.reduce((acc, prod) => {
    const cat = prod.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = new Set<string>();
    acc[cat].add(prod.competitor_name);
    return acc;
  }, {} as Record<string, Set<string>>);
  
  const fraquezas = Object.entries(categoriasFortes)
    .filter(([cat]) => {
      // Fraqueza = categoria onde concorrentes têm muitos produtos e você tem poucos/nenhum
      const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
      const competitorCount = competitorProducts.filter(p => p.categoria === cat).length;
      return competitorCount > 10 && tenantCount < 5;
    })
    .map(([cat, empresas]) => ({
      categoria: cat,
      empresas: empresas.size,
      produtos: competitorProducts.filter(p => p.categoria === cat).length,
      tenantProdutos: tenantProducts.filter(p => p.categoria === cat).length
    }))
    .sort((a, b) => b.produtos - a.produtos);
  
  // 🔥 OPORTUNIDADES: Categorias que concorrentes exploram mas você não
  const categoriasConcorrentes = new Set(competitorProducts.map(p => p.categoria).filter(Boolean));
  const categoriasTenant = new Set(tenantProducts.map(p => p.categoria).filter(Boolean));
  
  const oportunidades = Array.from(categoriasConcorrentes)
    .filter(cat => !categoriasTenant.has(cat))
    .map(cat => {
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name));
      const produtos = competitorProducts.filter(p => p.categoria === cat).length;
      return {
        categoria: cat,
        empresas: empresas.size,
        produtos,
        potencial: empresas.size >= 3 ? 'ALTO' : empresas.size >= 2 ? 'MÉDIO' : 'BAIXO'
      };
    })
    .sort((a, b) => b.empresas - a.empresas);
  
  // 🔥 AMEAÇAS: Categorias com alta concorrência onde você atua
  const ameacas = Array.from(categoriasTenant)
    .map(cat => {
      const tenantCount = tenantProducts.filter(p => p.categoria === cat).length;
      const competitorCount = competitorProducts.filter(p => p.categoria === cat).length;
      const empresas = new Set(competitorProducts.filter(p => p.categoria === cat).map(p => p.competitor_name));
      const matchesNaCategoria = matches.filter(m => m.tenantProduct.categoria === cat && m.bestScore >= 60).length;
      
      return {
        categoria: cat,
        tenantProdutos: tenantCount,
        competitorProdutos: competitorCount,
        empresas: empresas.size,
        matchesCount: matchesNaCategoria,
        intensidade: tenantCount > 0 ? (matchesNaCategoria / tenantCount) * 100 : 0
      };
    })
    .filter(a => a.empresas >= 2 || a.competitorProdutos > a.tenantProdutos * 2)
    .sort((a, b) => b.intensidade - a.intensidade);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* ✅ FORÇAS */}
      <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Shield className="h-5 w-5" />
            Forças (Strengths)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(forcasPorCategoria).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nenhum produto único identificado. Todos têm concorrência.
            </p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(forcasPorCategoria).map(([cat, produtos], idx) => (
                <li key={idx} className="border-b border-green-200 dark:border-green-800 pb-2 last:border-0">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{cat}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {produtos.length} produto{produtos.length > 1 ? 's' : ''} sem concorrência: {produtos.slice(0, 2).join(', ')}
                        {produtos.length > 2 && ` +${produtos.length - 2} outros`}
                      </p>
                      <Badge className="mt-1 bg-green-600 text-white text-[10px]">DIFERENCIAL ÚNICO</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          {fraquezas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              ✅ Sem fraquezas críticas identificadas. Portfólio bem distribuído.
            </p>
          ) : (
            <ul className="space-y-3">
              {fraquezas.slice(0, 5).map((f, idx) => (
                <li key={idx} className="border-b border-red-200 dark:border-red-800 pb-2 last:border-0">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{f.categoria}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {f.empresas} concorrentes com {f.produtos} produtos vs seus {f.tenantProdutos}
                      </p>
                      <Badge className="mt-1 bg-red-600 text-white text-[10px]">
                        DESVANTAGEM NUMÉRICA
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          {oportunidades.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              ℹ️ Você já atua em todas as categorias dos concorrentes.
            </p>
          ) : (
            <ul className="space-y-3">
              {oportunidades.slice(0, 5).map((o, idx) => (
                <li key={idx} className="border-b border-blue-200 dark:border-blue-800 pb-2 last:border-0">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{o.categoria}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {o.empresas} concorrente{o.empresas > 1 ? 's' : ''} com {o.produtos} produto{o.produtos > 1 ? 's' : ''}
                      </p>
                      <Badge className={cn(
                        "mt-1 text-white text-[10px]",
                        o.potencial === 'ALTO' ? 'bg-blue-700' :
                        o.potencial === 'MÉDIO' ? 'bg-blue-500' :
                        'bg-blue-400'
                      )}>
                        POTENCIAL {o.potencial}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          {ameacas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              ✅ Nenhuma ameaça crítica identificada. Mercado favorável.
            </p>
          ) : (
            <ul className="space-y-3">
              {ameacas.slice(0, 5).map((a, idx) => (
                <li key={idx} className="border-b border-amber-200 dark:border-amber-800 pb-2 last:border-0">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{a.categoria}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.empresas} concorrentes • {a.competitorProdutos} produtos vs seus {a.tenantProdutos}
                        {a.matchesCount > 0 && ` • ${a.matchesCount} matches diretos`}
                      </p>
                      <Badge className={cn(
                        "mt-1 text-white text-[10px]",
                        a.intensidade >= 75 ? 'bg-red-600' :
                        a.intensidade >= 50 ? 'bg-orange-600' :
                        'bg-yellow-600'
                      )}>
                        INTENSIDADE {Math.round(a.intensidade)}%
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
  );
}

