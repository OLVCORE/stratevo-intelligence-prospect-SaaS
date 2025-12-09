/**
 * MC8 V1: Badge de Fit Estratégico para Carteira Atual
 * 
 * Exibe o nível de fit MC8 ou botão para rodar avaliação
 * UX: Agora mostra explicitamente qual ICP está sendo usado
 * Visual: Pill premium enterprise
 */

import { Target } from 'lucide-react';
import type { MC8MatchAssessment } from '@/types/icp';

interface MC8BadgeProps {
  mc8?: MC8MatchAssessment;
  onRunMC8?: () => void;
  icpName?: string; // Nome amigável do ICP usado para a avaliação
  className?: string;
}

const labelMap = {
  ALTA: 'ALTO',
  MEDIA: 'MÉDIO',
  BAIXA: 'BAIXO',
  DESCARTAR: 'DESC.',
} as const;

export function MC8Badge({ mc8, onRunMC8, icpName, className }: MC8BadgeProps) {
  // Se não houver MC8, mostrar botão para rodar
  if (!mc8) {
    const label = 'MC8';
    const tooltip = icpName
      ? `Analisar o fit desta empresa com o ICP "${icpName}". Análise interna, não envia nada para o cliente.`
      : onRunMC8
      ? 'Analisar o fit desta empresa com o ICP selecionado. Análise interna, não envia nada para o cliente.'
      : 'Selecione um ICP para poder rodar o MC8 para esta empresa.';

    return (
      <button
        type="button"
        onClick={onRunMC8}
        disabled={!onRunMC8}
        className={`inline-flex items-center gap-1 rounded-full border border-slate-600/70 bg-slate-900/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${
          onRunMC8
            ? 'hover:bg-slate-800 cursor-pointer'
            : 'cursor-not-allowed opacity-50'
        } ${className || ''}`}
        title={tooltip}
      >
        <Target className="h-3 w-3" />
        {label}
      </button>
    );
  }

  // Formatar confiança como porcentagem
  const confidencePercent = Math.round(mc8.confidence * 100);

  // Tooltip com contexto do ICP
  const baseTooltip = icpName
    ? `Fit desta empresa com o ICP "${icpName}".`
    : 'Fit desta empresa com o ICP selecionado.';
  
  const tooltipText = mc8.rationale
    ? `${baseTooltip} Motivo principal: ${mc8.rationale}`
    : baseTooltip;

  // Variantes de cor baseadas no nível
  const variantClass =
    mc8.level === 'ALTA'
      ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-300'
      : mc8.level === 'MEDIA'
      ? 'border-sky-500/70 bg-sky-500/10 text-sky-300'
      : mc8.level === 'BAIXA'
      ? 'border-amber-500/70 bg-amber-500/10 text-amber-300'
      : 'border-rose-500/70 bg-rose-500/10 text-rose-300';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${variantClass} ${className || ''}`}
      title={tooltipText}
    >
      <Target className="h-3 w-3" />
      <span>MC8</span>
      <span>· {labelMap[mc8.level]}</span>
    </div>
  );
}

