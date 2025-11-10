import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuarantineEnrichmentStatusBadgeProps {
  rawAnalysis: any;
  showProgress?: boolean;
}

export function QuarantineEnrichmentStatusBadge({ 
  rawAnalysis, 
  showProgress = false 
}: QuarantineEnrichmentStatusBadgeProps) {
  // ✅ VERIFICAR 4 ENRIQUECIMENTOS (NÃO 3!)
  const hasReceitaFederal = !!rawAnalysis?.receita_federal || !!rawAnalysis?.receita;
  const hasApollo = !!rawAnalysis?.apollo_organization || !!rawAnalysis?.apollo || !!rawAnalysis?.enriched_apollo;
  const hasEnrichment360 = !!rawAnalysis?.digital_intelligence || !!rawAnalysis?.enrichment_360;
  const hasTOTVS = !!rawAnalysis?.totvs_report;
  
  // 🐛 DEBUG
  if (rawAnalysis && Object.keys(rawAnalysis).length > 0) {
    console.log('[BADGE] raw_data keys:', Object.keys(rawAnalysis));
    console.log('[BADGE] hasReceita:', hasReceitaFederal);
    console.log('[BADGE] hasApollo:', hasApollo);
    console.log('[BADGE] has360:', hasEnrichment360);
    console.log('[BADGE] hasTOTVS:', hasTOTVS);
  }
  
  // Calcular porcentagem de completude (4 checks)
  const totalChecks = 4;
  const completedChecks = [hasReceitaFederal, hasApollo, hasEnrichment360, hasTOTVS].filter(Boolean).length;
  const completionPercentage = Math.round((completedChecks / totalChecks) * 100);
  
  // 🐛 DEBUG CÁLCULO
  console.log('[BADGE] Cálculo:', {
    checks: [hasReceitaFederal, hasApollo, hasEnrichment360, hasTOTVS],
    completed: completedChecks,
    total: totalChecks,
    percentage: completionPercentage
  });
  
  const isFullyEnriched = completionPercentage === 100;
  const hasAnyEnrichment = completionPercentage > 0;

  const getStatusInfo = () => {
    // >= 70%: verde limão sólido
    if (completionPercentage >= 70) {
      return {
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: `${completionPercentage}%`,
        variant: "success" as const,
        className: "",
      };
    }
    
    // 50-65%: amarelo
    if (completionPercentage >= 50 && completionPercentage < 70) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        label: `${completionPercentage}%`,
        variant: "warning" as const,
        className: "",
      };
    }

    // < 30%: vermelho
    if (completionPercentage < 30) {
      return {
        icon: <XCircle className="h-3 w-3" />,
        label: `${completionPercentage}%`,
        variant: "destructive" as const,
        className: "",
      };
    }

    // 30-49%: laranja (fallback)
    return {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: `${completionPercentage}%`,
      variant: "outline" as const,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
  };

  const info = getStatusInfo();

  const tooltipContent = (
    <div className="space-y-2 text-xs">
      <p className="font-semibold">Status de Enriquecimento</p>
      <div className="space-y-1.5">
        {/* 🟢 LUZ 1: RECEITA FEDERAL (25%) */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasReceitaFederal ? 'bg-green-500' : 'bg-gray-500'}`} />
          <p className={hasReceitaFederal ? "text-green-600 font-medium" : "text-muted-foreground"}>
            {hasReceitaFederal ? "✓" : "○"} Receita Federal <span className="text-xs opacity-70">(25%)</span>
          </p>
        </div>
        
        {/* 🟡 LUZ 2: APOLLO (50%) */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasApollo ? 'bg-yellow-500' : 'bg-gray-500'}`} />
          <p className={hasApollo ? "text-yellow-600 font-medium" : "text-muted-foreground"}>
            {hasApollo ? "✓" : "○"} Apollo (Decisores) <span className="text-xs opacity-70">(50%)</span>
          </p>
        </div>
        
        {/* 🔵 LUZ 3: 360° DIGITAL (75%) */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasEnrichment360 ? 'bg-blue-500' : 'bg-gray-500'}`} />
          <p className={hasEnrichment360 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
            {hasEnrichment360 ? "✓" : "○"} 360° Digital <span className="text-xs opacity-70">(75%)</span>
          </p>
        </div>
        
        {/* 🟣 LUZ 4: TOTVS CHECK (100%) */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasTOTVS ? 'bg-purple-500' : 'bg-gray-500'}`} />
          <p className={hasTOTVS ? "text-purple-600 font-medium" : "text-muted-foreground"}>
            {hasTOTVS ? "✓" : "○"} TOTVS Check <span className="text-xs opacity-70">(100%)</span>
          </p>
        </div>
      </div>
      <div className="pt-2 border-t">
        <p className="text-muted-foreground">
          {completedChecks} de {totalChecks} enriquecimentos completos
        </p>
        <Progress value={completionPercentage} className="h-2 mt-2" />
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex flex-col gap-2">
            <Badge variant={info.variant} className={`gap-1 ${info.className}`}>
              {info.icon}
              {info.label}
            </Badge>
            {showProgress && (
              <Progress value={completionPercentage} className="h-1 w-20" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-60">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
