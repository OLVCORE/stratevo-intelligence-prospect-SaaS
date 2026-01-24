/**
 * 🚨 MICROCICLO 4 — Badge de Estado Canônico
 * 
 * Exibe o estado canônico atual de uma entidade
 */

import { Badge } from '@/components/ui/badge';
import { CanonicalState, getStateBadgeVariant, getStateLabel } from '@/hooks/useCanonicalState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CanonicalStateBadgeProps {
  state: CanonicalState;
  showTooltip?: boolean;
  className?: string;
}

export function CanonicalStateBadge({ 
  state, 
  showTooltip = true,
  className = '' 
}: CanonicalStateBadgeProps) {
  const variant = getStateBadgeVariant(state);
  const label = getStateLabel(state);

  const stateDescriptions: Record<CanonicalState, string> = {
    RAW: 'Entrada inicial (lista/busca)',
    BASE: 'Empresa qualificada na Base de Empresas',
    POOL: 'Governança comercial (Quarentena ICP)',
    ACTIVE: 'Sales Target (Lead aprovado) - Enrichment permitido',
    PIPELINE: 'Oportunidade ativa (Deal criado)',
    DISCARDED: 'Empresa descartada',
  };

  const badge = (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">
            <strong>Estado Canônico:</strong> {stateDescriptions[state]}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
