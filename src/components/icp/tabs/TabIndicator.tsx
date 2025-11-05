// Indicador visual de status para cada aba do relatório ICP
// Verde = Salvo | Amarelo = Não salvo | Azul = Processando | Vermelho = Erro

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface TabIndicatorProps {
  status?: 'draft' | 'processing' | 'completed' | 'error';
}

export function TabIndicator({ status = 'draft' }: TabIndicatorProps) {
  const config = {
    completed: { 
      color: 'bg-emerald-500', 
      label: '✅ Relatório salvo',
      ring: 'ring-2 ring-emerald-500/20'
    },
    processing: { 
      color: 'bg-blue-500 animate-pulse', 
      label: '🔵 Processando…',
      ring: 'ring-2 ring-blue-500/20'
    },
    draft: { 
      color: 'bg-amber-500', 
      label: '🟡 Relatório não salvo',
      ring: 'ring-2 ring-amber-500/20'
    },
    error: { 
      color: 'bg-rose-500', 
      label: '❌ Erro ao salvar',
      ring: 'ring-2 ring-rose-500/20'
    },
  }[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`inline-block h-2.5 w-2.5 rounded-full ${config.color} ${config.ring} transition-all duration-300`}
            aria-label={config.label}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 text-white border-slate-700">
          <p className="text-sm font-medium">{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Badge visual para exibir no topo das abas (alternativa mais visível)
interface TabStatusBadgeProps {
  status?: 'draft' | 'processing' | 'completed' | 'error';
}

export function TabStatusBadge({ status = 'draft' }: TabStatusBadgeProps) {
  const config = {
    completed: { 
      className: 'bg-emerald-600 text-white', 
      icon: '✅',
      label: 'Salvo'
    },
    processing: { 
      className: 'bg-blue-600 text-white animate-pulse', 
      icon: '⏳',
      label: 'Processando…'
    },
    draft: { 
      className: 'bg-amber-600 text-white', 
      icon: '⚠️',
      label: 'Não salvo'
    },
    error: { 
      className: 'bg-rose-600 text-white', 
      icon: '❌',
      label: 'Erro'
    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.className} transition-all duration-300`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

