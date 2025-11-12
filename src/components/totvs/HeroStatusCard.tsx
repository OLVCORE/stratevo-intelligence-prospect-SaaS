/**
 * 🎨 HERO STATUS CARD - Visual IMPACTANTE para Status TOTVS
 * 
 * Card grande no topo do relatório que mostra claramente:
 * - 🟢 CLIENTE TOTVS (vermelho/laranja)
 * - 🟢 NÃO CLIENTE (verde brilhante)
 * - ⚪ NÃO VERIFICADO (cinza)
 */

import { CheckCircle, XCircle, AlertTriangle, HelpCircle, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeroStatusCardProps {
  status?: 'go' | 'no-go' | 'revisar' | null;
  confidence?: 'high' | 'medium' | 'low';
  tripleMatches?: number;
  doubleMatches?: number;
  singleMatches?: number;
  totalScore?: number;
  sources?: number;
  className?: string;
}

export function HeroStatusCard({
  status,
  confidence,
  tripleMatches = 0,
  doubleMatches = 0,
  singleMatches = 0,
  totalScore = 0,
  sources = 0,
  className,
}: HeroStatusCardProps) {
  
  // 🎨 CONFIGURAÇÃO VISUAL POR STATUS
  const getStatusConfig = () => {
    if (!status) {
      return {
        icon: HelpCircle,
        iconColor: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        glowColor: 'shadow-gray-500/20',
        title: 'Não Verificado',
        subtitle: 'Execute a verificação TOTVS para obter o status',
        badgeVariant: 'outline' as const,
        badgeColor: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
    }
    
    if (status === 'no-go') {
      // ❌ CLIENTE TOTVS = Vermelho/Laranja (NÃO VENDA!)
      return {
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-gradient-to-br from-red-500/20 via-orange-500/15 to-red-500/10',
        borderColor: 'border-red-500/50',
        glowColor: 'shadow-red-500/30',
        title: '❌ CLIENTE TOTVS',
        subtitle: 'Empresa JÁ É CLIENTE - não abordar para venda!',
        badgeVariant: 'destructive' as const,
        badgeColor: 'bg-red-500 text-white',
      };
    }
    
    if (status === 'go') {
      // ✅ NÃO CLIENTE = Verde Brilhante (VENDA!)
      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-400/10',
        borderColor: 'border-green-500/50',
        glowColor: 'shadow-green-500/30',
        title: '✅ NÃO É CLIENTE',
        subtitle: 'Oportunidade de venda confirmada - pode abordar!',
        badgeVariant: 'default' as const,
        badgeColor: 'bg-green-500 text-white',
      };
    }
    
    // ⚠️ REVISAR = Amarelo
    return {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-yellow-400/10',
      borderColor: 'border-yellow-500/50',
      glowColor: 'shadow-yellow-500/30',
      title: '⚠️ REVISAR',
      subtitle: 'Evidências conflitantes - análise manual necessária',
      badgeVariant: 'secondary' as const,
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
  };
  
  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const totalMatches = tripleMatches + doubleMatches + singleMatches;
  
  return (
    <Card className={cn(
      'relative overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02]',
      config.borderColor,
      config.glowColor,
      'shadow-lg',
      className
    )}>
      {/* Background gradient overlay */}
      <div className={cn('absolute inset-0', config.bgColor)} />
      
      <CardContent className="relative p-4">
        <div className="flex items-center justify-between gap-4">
          {/* LEFT SIDE: Status Info */}
          <div className="flex items-center gap-4">
            {/* Icon Circle - MENOR */}
            <div className={cn(
              'flex items-center justify-center w-16 h-16 rounded-full border-4',
              config.borderColor,
              config.bgColor
            )}>
              <StatusIcon className={cn('w-8 h-8', config.iconColor)} strokeWidth={2.5} />
            </div>
            
            {/* Text Info - MAIS COMPACTO */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {config.title}
              </h2>
              <p className="text-sm text-gray-300 max-w-md">
                {config.subtitle}
              </p>
              
              {/* Confidence Badge */}
              {confidence && (
                <Badge variant="outline" className={cn(
                  'text-xs font-semibold mt-1',
                  confidence === 'high' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  confidence === 'medium' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  confidence === 'low' && 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                )}>
                  {confidence === 'high' && '🔥 Confiança Alta'}
                  {confidence === 'medium' && '⚠️ Confiança Média'}
                  {confidence === 'low' && '❄️ Confiança Baixa'}
                </Badge>
              )}
            </div>
          </div>
          
          {/* RIGHT SIDE: Metrics - EM LINHA */}
          {status && (
            <div className="flex items-center gap-3">
              {/* Evidências */}
              <div className="flex items-center gap-2 px-3 py-2 bg-background/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
                <Target className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500 font-bold">{tripleMatches}T</span>
                  <span className="text-blue-500 font-bold">{doubleMatches}D</span>
                  <span className="text-gray-500 font-medium">{singleMatches}S</span>
                </div>
              </div>
              
              {/* Inteligência */}
              <div className="flex items-center gap-2 px-3 py-2 bg-background/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
                <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-cyan-500 font-bold">{sources} fontes</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-white font-bold">{totalScore} pts</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

