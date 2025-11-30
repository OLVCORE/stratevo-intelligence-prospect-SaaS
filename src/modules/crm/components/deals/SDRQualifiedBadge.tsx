// src/modules/crm/components/deals/SDRQualifiedBadge.tsx
// Badge indicando que deal foi qualificado pelo SDR

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface SDRQualifiedBadgeProps {
  sdrDealId?: string;
  handoffDate?: string;
}

export function SDRQualifiedBadge({ sdrDealId, handoffDate }: SDRQualifiedBadgeProps) {
  if (!sdrDealId) return null;

  return (
    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Qualificado pelo SDR
      {handoffDate && (
        <span className="ml-2 text-xs opacity-75">
          {new Date(handoffDate).toLocaleDateString("pt-BR")}
        </span>
      )}
      {sdrDealId && (
        <Link
          to={`/sdr/workspace?deal=${sdrDealId}`}
          className="ml-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3 inline" />
        </Link>
      )}
    </Badge>
  );
}

