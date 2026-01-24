// 🚨 MICROCICLO 2: Bloqueio global de enrichment fora de SALES TARGET
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { useAutoEnrich } from "@/hooks/useAutoEnrich";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isInSalesTargetContext } from '@/lib/utils/enrichmentContextValidator';

export function AutoEnrichButton() {
  const { mutate: autoEnrich, isPending } = useAutoEnrich();
  
  // 🚨 MICROCICLO 2: Verificar se está em SALES TARGET
  const isSalesTarget = isInSalesTargetContext();
  const enrichmentBlocked = !isSalesTarget;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => autoEnrich()}
            disabled={isPending || enrichmentBlocked}
            className="gap-2"
          >
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : enrichmentBlocked ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Bloqueado
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Auto-Enriquecer
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">
            {enrichmentBlocked 
              ? '🚫 Disponível apenas para Leads Aprovados (Sales Target)'
              : 'Enriquece automaticamente até 50 empresas que têm Apollo ID mas não foram atualizadas nos últimos 30 dias'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
