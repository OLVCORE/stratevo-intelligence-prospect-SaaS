// src/components/totvs/ProductFitScoreCard.tsx
// Componente de visualização do score de fit de produtos (world class)

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Target,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductFitScoreCardProps {
  fitScore: number; // 0-100
  fitLevel: 'high' | 'medium' | 'low';
  confidence: 'high' | 'medium' | 'low';
  overallJustification?: string;
  cnaeMatch?: boolean;
  sectorMatch?: boolean;
  className?: string;
}

export function ProductFitScoreCard({
  fitScore,
  fitLevel,
  confidence,
  overallJustification,
  cnaeMatch,
  sectorMatch,
  className
}: ProductFitScoreCardProps) {
  // Cores e configurações baseadas no nível
  const levelConfig = {
    high: {
      color: 'emerald',
      bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
      borderColor: 'border-emerald-500/50',
      icon: CheckCircle2,
      label: 'Alta Aderência',
      description: 'Excelente match! Empresa ideal para seus produtos.',
      badgeVariant: 'default' as const,
      badgeClass: 'bg-emerald-600 text-white'
    },
    medium: {
      color: 'orange',
      bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
      borderColor: 'border-orange-500/50',
      icon: Target,
      label: 'Boa Aderência',
      description: 'Bom potencial, com algumas ressalvas a considerar.',
      badgeVariant: 'default' as const,
      badgeClass: 'bg-orange-600 text-white'
    },
    low: {
      color: 'rose',
      bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
      borderColor: 'border-rose-500/50',
      icon: AlertCircle,
      label: 'Baixa Aderência',
      description: 'Match limitado, requer análise mais profunda.',
      badgeVariant: 'secondary' as const,
      badgeClass: 'bg-rose-600 text-white'
    }
  };

  const config = levelConfig[fitLevel];
  const Icon = config.icon;

  // Cor da barra de progresso baseada no score
  const progressColor = fitScore >= 70 ? 'bg-emerald-500' : fitScore >= 40 ? 'bg-orange-500' : 'bg-rose-500';

  return (
    <Card className={cn(
      'relative overflow-hidden border-l-4',
      `border-l-${config.color}-600/90`,
      'shadow-lg hover:shadow-xl transition-all duration-300',
      className
    )}>
      {/* Gradient Background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br',
        config.bgGradient,
        'opacity-50'
      )} />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-full',
              `bg-${config.color}-100 dark:bg-${config.color}-900/30`
            )}>
              <Icon className={cn(
                'h-6 w-6',
                `text-${config.color}-600 dark:text-${config.color}-400`
              )} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Score de Fit de Produtos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.description}
              </p>
            </div>
          </div>
          
          <Badge className={cn(config.badgeClass, 'text-sm font-bold px-3 py-1')}>
            {config.label}
          </Badge>
        </div>

        {/* Score Display - Destaque Principal */}
        <div className="mb-6">
          <div className="flex items-end gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {fitScore}%
                </span>
                {fitScore >= 70 && (
                  <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                )}
                {fitScore >= 40 && fitScore < 70 && (
                  <Target className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Confiança: {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3">
              {cnaeMatch !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                  cnaeMatch 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {cnaeMatch ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  CNAE
                </div>
              )}
              {sectorMatch !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                  sectorMatch 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {sectorMatch ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  Setor
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={fitScore} 
            className="h-3 bg-gray-200 dark:bg-gray-700"
          >
            <div 
              className={cn('h-full transition-all duration-1000', progressColor)}
              style={{ width: `${fitScore}%` }}
            />
          </Progress>
        </div>

        {/* Justification */}
        {overallJustification && (
          <div className={cn(
            'p-4 rounded-lg border',
            'bg-white/50 dark:bg-gray-900/50',
            'border-gray-200 dark:border-gray-700'
          )}>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {overallJustification}
            </p>
          </div>
        )}

        {/* Action Indicator */}
        {fitScore >= 70 && (
          <div className={cn(
            'mt-4 flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-emerald-100 dark:bg-emerald-900/30',
            'border border-emerald-200 dark:border-emerald-800'
          )}>
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Oportunidade Hot! Priorize esta empresa
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

