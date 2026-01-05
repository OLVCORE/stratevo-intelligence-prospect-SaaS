// src/components/totvs/ProductRecommendationItem.tsx
// Item individual de recomendação de produto (world class)

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface ProductRecommendationItemProps {
  productId: string;
  productName: string;
  fitScore: number; // 0-100
  recommendation: 'high' | 'medium' | 'low';
  justification: string;
  strengths: string[];
  weaknesses: string[];
  onSelect?: (productId: string) => void;
  isSelected?: boolean;
  className?: string;
}

export function ProductRecommendationItem({
  productId,
  productName,
  fitScore,
  recommendation,
  justification,
  strengths,
  weaknesses,
  onSelect,
  isSelected = false,
  className
}: ProductRecommendationItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const recommendationConfig = {
    high: {
      color: 'emerald',
      label: 'Alta Recomendação',
      icon: CheckCircle2,
      badgeClass: 'bg-emerald-600 text-white',
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      borderClass: 'border-emerald-200 dark:border-emerald-800'
    },
    medium: {
      color: 'orange',
      label: 'Recomendação Média',
      icon: Target,
      badgeClass: 'bg-orange-600 text-white',
      bgClass: 'bg-orange-50/50 dark:bg-orange-950/20',
      borderClass: 'border-orange-200 dark:border-orange-800'
    },
    low: {
      color: 'rose',
      label: 'Recomendação Baixa',
      icon: AlertCircle,
      badgeClass: 'bg-rose-600 text-white',
      bgClass: 'bg-rose-50/50 dark:bg-rose-950/20',
      borderClass: 'border-rose-200 dark:border-rose-800'
    }
  };

  const config = recommendationConfig[recommendation];
  const Icon = config.icon;

  const progressColor = fitScore >= 70 ? 'bg-emerald-500' : fitScore >= 40 ? 'bg-orange-500' : 'bg-rose-500';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        'overflow-hidden transition-all duration-200',
        'border-l-4',
        recommendation === 'high' ? 'border-l-emerald-600/90' :
        recommendation === 'medium' ? 'border-l-orange-600/90' :
        'border-l-rose-600/90',
        'shadow-md hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        className
      )}>
        <CollapsibleTrigger className="w-full">
          <div className={cn(
            'p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/50',
            'transition-colors duration-150'
          )}>
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={cn(
                'p-2 rounded-lg flex-shrink-0',
                recommendation === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                recommendation === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30' :
                'bg-rose-100 dark:bg-rose-900/30'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  recommendation === 'high' ? 'text-emerald-600 dark:text-emerald-400' :
                  recommendation === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                  'text-rose-600 dark:text-rose-400'
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {productName}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn(config.badgeClass, 'text-xs')}>
                        {config.label}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {fitScore}%
                        </span>
                        {recommendation === 'high' && (
                          <Star className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {onSelect && recommendation === 'high' && (
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(productId);
                      }}
                      className="flex-shrink-0"
                    >
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Progress Bar */}
                <Progress 
                  value={fitScore} 
                  className="h-2 bg-gray-200 dark:bg-gray-700 mb-2"
                >
                  <div 
                    className={cn('h-full transition-all duration-500', progressColor)}
                    style={{ width: `${fitScore}%` }}
                  />
                </Progress>

                {/* Preview of justification */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {justification}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={cn(
            'px-4 pb-4 border-t',
            config.borderClass,
            config.bgClass
          )}>
            {/* Full Justification */}
            <div className="pt-4 mb-4">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Análise Detalhada
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {justification}
              </p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {strengths.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h6 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Pontos Fortes ({strengths.length})
                    </h6>
                  </div>
                  <ul className="space-y-1">
                    {strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {weaknesses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <h6 className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      Pontos de Atenção ({weaknesses.length})
                    </h6>
                  </div>
                  <ul className="space-y-1">
                    {weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Action */}
            {recommendation === 'high' && (
              <div className={cn(
                'mt-4 p-3 rounded-lg',
                'bg-emerald-100 dark:bg-emerald-900/30',
                'border border-emerald-200 dark:border-emerald-800'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Oportunidade prioritária
                    </span>
                  </div>
                  <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                    Criar Proposta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

