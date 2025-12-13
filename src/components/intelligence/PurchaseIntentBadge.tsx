/**
 * Purchase Intent Badge
 * 
 * Exibe badge visual indicando score de intenção de compra
 * - 🔥 Hot Lead: score >= 70
 * - ⚡ Warm Lead: score >= 40
 * - ❄️ Cold Lead: score < 40
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, Zap, Snowflake } from 'lucide-react';

interface PurchaseIntentBadgeProps {
  score: number | null | undefined;
  intentType?: 'potencial' | 'real' | null; // ✅ NOVO: Tipo de Purchase Intent
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PurchaseIntentBadge({ 
  score = 0,
  intentType = null, // ✅ NOVO: Tipo de Purchase Intent
  showIcon = true,
  size = 'md'
}: PurchaseIntentBadgeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score || 0));
  
  // Determinar categoria
  const isHot = normalizedScore >= 70;
  const isWarm = normalizedScore >= 40 && normalizedScore < 70;
  const isCold = normalizedScore < 40;
  
  // ✅ NOVO: Determinar se é Potencial ou Real
  const isReal = intentType === 'real';
  const isPotencial = intentType === 'potencial' || (intentType === null && normalizedScore > 0);

  // Cores e estilos
  const getVariant = () => {
    if (isHot) return 'destructive'; // Vermelho = Hot
    if (isWarm) return 'warning'; // Laranja = Warm
    return 'secondary'; // Cinza = Cold
  };

  const getIcon = () => {
    if (isHot) return <Flame className="h-3 w-3 mr-1" />;
    if (isWarm) return <Zap className="h-3 w-3 mr-1" />;
    return <Snowflake className="h-3 w-3 mr-1" />;
  };

  const getLabel = () => {
    const baseLabel = isHot ? 'Hot Lead' : isWarm ? 'Warm Lead' : 'Cold Lead';
    // ✅ NOVO: Adicionar tipo (Potencial/Real) ao label
    if (isReal) return `${baseLabel} (Real)`;
    if (isPotencial) return `${baseLabel} (Potencial)`;
    return baseLabel;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-[10px] px-1.5 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2 py-0.5';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getVariant()}
            className={`${getSizeClasses()} font-semibold cursor-help`}
          >
            {showIcon && getIcon()}
            {getLabel()} ({normalizedScore})
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Score de Intenção: {normalizedScore}/100</p>
            {isReal && (
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                ✅ Purchase Intent REAL - Baseado em sinais comportamentais (visitas, downloads, emails, demos)
              </p>
            )}
            {isPotencial && !isReal && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                🔮 Purchase Intent POTENCIAL - Baseado em sinais de mercado (expansão, funding, notícias)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {isHot && '🔥 Lead quente! Alta probabilidade de compra. Priorizar contato imediato.'}
              {isWarm && '⚡ Lead morno. Interesse moderado. Contatar em breve.'}
              {isCold && '❄️ Lead frio. Baixa intenção de compra no momento.'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {isReal 
                ? 'Sinais comportamentais: visitas ao site, downloads, emails abertos, demos agendadas'
                : 'Sinais de mercado: expansão, contratações, funding, mudanças, concorrentes'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

