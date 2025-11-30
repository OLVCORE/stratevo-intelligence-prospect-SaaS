// src/components/companies/CompanySectorNicheBadges.tsx
// Badges para mostrar Setor, Nicho e Aderência ao ICP

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanySectorNicheBadgesProps {
  sectorCode?: string;
  sectorName?: string;
  nicheCode?: string;
  nicheName?: string;
  icpMatchScore?: number;
  icpMatchTier?: 'excellent' | 'premium' | 'qualified' | 'potential' | 'low';
  className?: string;
}

const SECTOR_COLORS: Record<string, string> = {
  'agro': 'bg-green-100 text-green-800 border-green-300',
  'construcao': 'bg-orange-100 text-orange-800 border-orange-300',
  'distribuicao': 'bg-blue-100 text-blue-800 border-blue-300',
  'educacional': 'bg-purple-100 text-purple-800 border-purple-300',
  'financial_services': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'hotelaria': 'bg-pink-100 text-pink-800 border-pink-300',
  'juridico': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'logistica': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'manufatura': 'bg-red-100 text-red-800 border-red-300',
  'servicos': 'bg-gray-100 text-gray-800 border-gray-300',
  'saude': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'varejo': 'bg-rose-100 text-rose-800 border-rose-300',
};

const ICP_TIER_COLORS: Record<string, string> = {
  'excellent': 'bg-green-100 text-green-800 border-green-300',
  'premium': 'bg-blue-100 text-blue-800 border-blue-300',
  'qualified': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'potential': 'bg-orange-100 text-orange-800 border-orange-300',
  'low': 'bg-gray-100 text-gray-800 border-gray-300',
};

const ICP_TIER_ICONS: Record<string, typeof CheckCircle2> = {
  'excellent': CheckCircle2,
  'premium': CheckCircle2,
  'qualified': AlertCircle,
  'potential': AlertCircle,
  'low': XCircle,
};

export function CompanySectorNicheBadges({
  sectorCode,
  sectorName,
  nicheCode,
  nicheName,
  icpMatchScore,
  icpMatchTier,
  className,
}: CompanySectorNicheBadgesProps) {
  const sectorColor = sectorCode ? SECTOR_COLORS[sectorCode] || 'bg-gray-100 text-gray-800 border-gray-300' : '';
  const icpColor = icpMatchTier ? ICP_TIER_COLORS[icpMatchTier] : '';
  const ICPIcon = icpMatchTier ? ICP_TIER_ICONS[icpMatchTier] : null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Badge de Setor */}
      {sectorName && (
        <Badge
          variant="outline"
          className={cn('font-medium', sectorColor)}
        >
          {sectorName}
        </Badge>
      )}

      {/* Badge de Nicho */}
      {nicheName && (
        <Badge
          variant="outline"
          className="bg-purple-100 text-purple-800 border-purple-300 font-medium"
        >
          {nicheName}
        </Badge>
      )}

      {/* Badge de Aderência ICP */}
      {icpMatchTier && icpMatchScore !== undefined && (
        <Badge
          variant="outline"
          className={cn('font-medium flex items-center gap-1', icpColor)}
        >
          {ICPIcon && <ICPIcon className="h-3 w-3" />}
          {icpMatchTier === 'excellent' && 'Match ICP'}
          {icpMatchTier === 'premium' && 'Match ICP'}
          {icpMatchTier === 'qualified' && 'Potencial'}
          {icpMatchTier === 'potential' && 'Potencial'}
          {icpMatchTier === 'low' && 'Fora do ICP'}
          {icpMatchScore > 0 && ` (${icpMatchScore}%)`}
        </Badge>
      )}
    </div>
  );
}

