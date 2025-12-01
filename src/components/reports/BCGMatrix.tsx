/**
 * 📊 BCGMatrix - Matriz de Priorização BCG
 * Componente visual para análise de portfólio estratégico
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, TrendingUp, HelpCircle, Dog, Target } from 'lucide-react';

export interface BCGItem {
  name: string;
  growth: number; // 0-100 (alto = alto crescimento)
  marketShare: number; // 0-100 (alto = alta participação)
  revenue?: number;
  type?: 'sector' | 'niche' | 'product' | 'client';
}

interface BCGMatrixProps {
  items: BCGItem[];
  title?: string;
  description?: string;
  className?: string;
}

// Classificar item no quadrante BCG
function classifyBCG(growth: number, marketShare: number): 'star' | 'question' | 'cash' | 'dog' {
  const highGrowth = growth >= 50;
  const highShare = marketShare >= 50;

  if (highGrowth && highShare) return 'star';
  if (highGrowth && !highShare) return 'question';
  if (!highGrowth && highShare) return 'cash';
  return 'dog';
}

// Obter dados do quadrante
function getQuadrantInfo(type: 'star' | 'question' | 'cash' | 'dog') {
  const info = {
    star: {
      label: '⭐ Estrelas',
      description: 'Alto crescimento + Alta participação',
      color: 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      icon: Star,
      strategy: 'Investir para manter liderança'
    },
    question: {
      label: '❓ Interrogações',
      description: 'Alto crescimento + Baixa participação',
      color: 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      icon: HelpCircle,
      strategy: 'Analisar potencial e decidir investir ou abandonar'
    },
    cash: {
      label: '💰 Vacas Leiteiras',
      description: 'Baixo crescimento + Alta participação',
      color: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      icon: TrendingUp,
      strategy: 'Maximizar lucros e manter posição'
    },
    dog: {
      label: '🐕 Abacaxis',
      description: 'Baixo crescimento + Baixa participação',
      color: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      icon: Dog,
      strategy: 'Considerar desinvestimento ou reposicionamento'
    }
  };
  return info[type];
}

export default function BCGMatrix({ items, title = 'Matriz BCG - Priorização Estratégica', description, className }: BCGMatrixProps) {
  // Agrupar itens por quadrante
  const grouped = {
    star: items.filter(i => classifyBCG(i.growth, i.marketShare) === 'star'),
    question: items.filter(i => classifyBCG(i.growth, i.marketShare) === 'question'),
    cash: items.filter(i => classifyBCG(i.growth, i.marketShare) === 'cash'),
    dog: items.filter(i => classifyBCG(i.growth, i.marketShare) === 'dog'),
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Grid da Matriz 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Estrelas (top-left) */}
          <QuadrantCard type="star" items={grouped.star} />
          
          {/* Interrogações (top-right) */}
          <QuadrantCard type="question" items={grouped.question} />
          
          {/* Vacas Leiteiras (bottom-left) */}
          <QuadrantCard type="cash" items={grouped.cash} />
          
          {/* Abacaxis (bottom-right) */}
          <QuadrantCard type="dog" items={grouped.dog} />
        </div>

        {/* Eixos Labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>← Baixa Participação de Mercado</span>
          <span>Alta Participação de Mercado →</span>
        </div>
        <div className="flex justify-center mt-1">
          <span className="text-xs text-muted-foreground">↑ Alto Crescimento | ↓ Baixo Crescimento</span>
        </div>

        {/* Legenda de Estratégias */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-3">Recomendações por Quadrante:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {(['star', 'question', 'cash', 'dog'] as const).map(type => {
              const info = getQuadrantInfo(type);
              return (
                <div key={type} className={cn('p-3 rounded-lg', info.bgColor)}>
                  <p className="font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{info.strategy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente do quadrante individual
function QuadrantCard({ type, items }: { type: 'star' | 'question' | 'cash' | 'dog'; items: BCGItem[] }) {
  const info = getQuadrantInfo(type);
  const Icon = info.icon;

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 min-h-[140px] transition-all',
      info.color,
      items.length > 0 ? 'opacity-100' : 'opacity-60'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        <span className="font-semibold text-sm">{info.label}</span>
        <Badge variant="secondary" className="text-xs">{items.length}</Badge>
      </div>
      
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.slice(0, 4).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">{item.name}</span>
              {item.revenue && (
                <span className="text-xs ml-2 opacity-70">
                  R$ {(item.revenue / 1000).toFixed(0)}K
                </span>
              )}
            </div>
          ))}
          {items.length > 4 && (
            <p className="text-xs opacity-70">+{items.length - 4} mais</p>
          )}
        </div>
      ) : (
        <p className="text-xs opacity-50 italic">Nenhum item neste quadrante</p>
      )}
    </div>
  );
}

// Helper para criar BCGItems a partir de dados do ICP
export function createBCGItemsFromICP(icpData: any): BCGItem[] {
  const items: BCGItem[] = [];

  // Setores/Nichos como itens
  const setores = icpData?.setores_alvo || icpData?.nichos_alvo || [];
  setores.forEach((setor: string, idx: number) => {
    items.push({
      name: setor,
      // Simulação baseada em posição (em produção, usar dados reais de mercado)
      growth: Math.max(20, 80 - idx * 15),
      marketShare: Math.max(30, 70 - idx * 10),
      type: 'sector'
    });
  });

  // Clientes como itens
  const clientes = icpData?.clientes_atuais || [];
  clientes.forEach((cliente: any, idx: number) => {
    items.push({
      name: cliente.nome || cliente.razaoSocial || `Cliente ${idx + 1}`,
      growth: cliente.ticketMedio > 50000 ? 70 : 40,
      marketShare: cliente.capitalSocial > 1000000 ? 60 : 35,
      revenue: cliente.ticketMedio,
      type: 'client'
    });
  });

  return items;
}

