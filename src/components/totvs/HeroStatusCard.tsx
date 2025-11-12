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
      
      <CardContent className="relative p-8">
        <div className="flex items-center justify-between">
          {/* LEFT SIDE: Status Info */}
          <div className="flex items-center gap-6">
            {/* Icon Circle */}
            <div className={cn(
              'flex items-center justify-center w-24 h-24 rounded-full border-4',
              config.borderColor,
              config.bgColor,
              'animate-pulse-slow'
            )}>
              <StatusIcon className={cn('w-12 h-12', config.iconColor)} strokeWidth={2.5} />
            </div>
            
            {/* Text Info */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {config.title}
              </h2>
              <p className="text-base text-gray-300 max-w-md">
                {config.subtitle}
              </p>
              
              {/* Confidence Badge */}
              {confidence && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className={cn(
                    'text-sm font-semibold',
                    confidence === 'high' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    confidence === 'medium' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                    confidence === 'low' && 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  )}>
                    {confidence === 'high' && '🔥 Confiança Alta'}
                    {confidence === 'medium' && '⚠️ Confiança Média'}
                    {confidence === 'low' && '❄️ Confiança Baixa'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT SIDE: Metrics */}
          {status && (
            <div className="grid grid-cols-2 gap-4">
              {/* Matches Card */}
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 min-w-[160px]">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-gray-400">Evidências</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Triple:</span>
                    <span className="text-lg font-bold text-emerald-500">{tripleMatches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Double:</span>
                    <span className="text-lg font-bold text-blue-500">{doubleMatches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Single:</span>
                    <span className="text-sm font-medium text-gray-500">{singleMatches}</span>
                  </div>
                </div>
              </div>
              
              {/* Intelligence Card */}
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 min-w-[160px]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-medium text-gray-400">Inteligência</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Fontes:</span>
                    <span className="text-xl font-bold text-cyan-500">{sources}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Score:</span>
                    <span className="text-lg font-bold text-white">{totalScore} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Total:</span>
                    <span className="text-sm font-medium text-gray-300">{totalMatches} matches</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

