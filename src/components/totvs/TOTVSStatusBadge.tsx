/**
 * 🏷️ TOTVS STATUS BADGE - Badge visual para tabelas
 * 
 * Badge compacto para mostrar status TOTVS em tabelas (Quarentena/Aprovadas)
 * - ✅ Cliente TOTVS (vermelho)
 * - ✅ Não Cliente (verde)
 * - ⚪ Não Verificado (cinza)
 */

import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TOTVSStatusBadgeProps {
  status?: 'go' | 'no-go' | 'revisar' | null;
  confidence?: 'high' | 'medium' | 'low';
  tripleMatches?: number;
  doubleMatches?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TOTVSStatusBadge({
  status,
  confidence,
  tripleMatches = 0,
  doubleMatches = 0,
  showDetails = true,
  size = 'sm',
  className,
}: TOTVSStatusBadgeProps) {
  
  // 🎨 CONFIGURAÇÃO VISUAL POR STATUS
  const getConfig = () => {
    if (!status) {
      return {
        icon: HelpCircle,
        iconColor: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-500/30',
        label: 'Não Verificado',
        description: 'Status TOTVS ainda não foi verificado',
      };
    }
    
    if (status === 'no-go') {
      // ❌ CLIENTE TOTVS
      return {
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/40',
        label: 'Cliente',
        description: 'JÁ É CLIENTE TOTVS - não abordar',
      };
    }
    
    if (status === 'go') {
      // ✅ NÃO CLIENTE
      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/40',
        label: 'Não Cliente',
        description: 'NÃO É CLIENTE - pode abordar',
      };
    }
    
    // ⚠️ REVISAR
    return {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/40',
      label: 'Revisar',
      description: 'Requer análise manual',
    };
  };
  
  const config = getConfig();
  const Icon = config.icon;
  
  // 📏 TAMANHO
  const sizeConfig = {
    sm: {
      iconSize: 'w-3 h-3',
      textSize: 'text-xs',
      padding: 'px-2 py-0.5',
    },
    md: {
      iconSize: 'w-4 h-4',
      textSize: 'text-sm',
      padding: 'px-3 py-1',
    },
    lg: {
      iconSize: 'w-5 h-5',
      textSize: 'text-base',
      padding: 'px-4 py-1.5',
    },
  };
  
  const sizeClasses = sizeConfig[size];
  
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold border transition-all duration-200 hover:scale-105',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses.padding,
        sizeClasses.textSize,
        className
      )}
    >
      <Icon className={cn(sizeClasses.iconSize, config.iconColor, 'mr-1.5')} />
      {config.label}
    </Badge>
  );
  
  // 💡 COM TOOLTIP (se showDetails)
  if (showDetails && status) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{config.description}</p>
              {confidence && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Confiança:</span>
                  <span className={cn(
                    'font-medium',
                    confidence === 'high' && 'text-green-400',
                    confidence === 'medium' && 'text-yellow-400',
                    confidence === 'low' && 'text-gray-400'
                  )}>
                    {confidence === 'high' ? '🔥 Alta' : confidence === 'medium' ? '⚠️ Média' : '❄️ Baixa'}
                  </span>
                </div>
              )}
              {(tripleMatches > 0 || doubleMatches > 0) && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-400 font-medium">
                    {tripleMatches} Triple
                  </span>
                  <span className="text-blue-400 font-medium">
                    {doubleMatches} Double
                  </span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // ✅ SEM TOOLTIP
  return badge;
}

