import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  RefreshCw,
  Zap,
  Loader2,
  Building2,
  Clock,
} from 'lucide-react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UnifiedEnrichButtonProps {
  // Callbacks para enriquecimento
  onQuickRefresh?: () => Promise<void>; // Smart Refresh (30s)
  onFullEnrich?: () => Promise<void>; // Enrich 360° completo (2min)
  onAutoEnrich?: () => Promise<void>; // Agendar automático
  
  // Enriquecimentos individuais (opcional - para dropdown expandido)
  onReceita?: () => Promise<void>;
  onApollo?: () => Promise<void>;
  on360?: () => Promise<void>;
  
  // Estados
  isProcessing?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  
  // Contexto
  hasCNPJ?: boolean;
  hasApolloId?: boolean;
}

export function UnifiedEnrichButton({
  onQuickRefresh,
  onFullEnrich,
  onAutoEnrich,
  onReceita,
  onApollo,
  on360,
  isProcessing = false,
  variant = 'default',
  size = 'sm',
  hasCNPJ = true,
  hasApolloId = false,
}: UnifiedEnrichButtonProps) {
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleAction = async (action: string, fn?: () => Promise<void>) => {
    if (!fn || isProcessing) return;
    
    try {
      setProcessingAction(action);
      await fn();
    } catch (error) {
      console.error(`Erro ao executar ${action}:`, error);
    } finally {
      setTimeout(() => setProcessingAction(null), 500);
    }
  };

  const isLoading = isProcessing || processingAction !== null;

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={variant}
                size={size}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Atualizar Dados
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">
              <strong>Fluxo de Enriquecimento:</strong> 1) Receita Federal (sempre) → 2) Relatório STC → Aba TOTVS → 3) Se GO → Apollo (Decisores)
            </p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-72 z-[100] bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Escolha o tipo de atualização
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Ações Principais */}
          <DropdownMenuGroup>
            {/* Quick Refresh */}
            {onQuickRefresh && (
              <DropdownMenuItem
                onClick={() => handleAction('Quick Refresh', onQuickRefresh)}
                disabled={isLoading}
                className="cursor-pointer hover:bg-accent hover:border-l-4 hover:border-blue-500 transition-all"
              >
                {processingAction === 'Quick Refresh' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2 text-blue-500" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">⚡ Atualização Rápida</div>
                  <div className="text-xs text-muted-foreground">
                    Apenas dados desatualizados · ~30s
                  </div>
                </div>
              </DropdownMenuItem>
            )}

            {/* Full Enrich */}
            {onFullEnrich && (
              <DropdownMenuItem
                onClick={() => handleAction('Full Enrich', onFullEnrich)}
                disabled={isLoading || !hasCNPJ}
                className="cursor-pointer hover:bg-accent hover:border-l-4 hover:border-primary transition-all"
              >
                {processingAction === 'Full Enrich' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">🔄 Atualização Completa</div>
                  <div className="text-xs text-muted-foreground">
                    Todas as fontes · ~2min
                  </div>
                </div>
              </DropdownMenuItem>
            )}

            {/* Auto-Enrich */}
            {onAutoEnrich && (
              <DropdownMenuItem
                onClick={() => handleAction('Auto-Enrich', onAutoEnrich)}
                disabled={isLoading}
                className="cursor-pointer hover:bg-accent hover:border-l-4 hover:border-green-500 transition-all"
              >
                {processingAction === 'Auto-Enrich' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-500" />
                ) : (
                  <Zap className="h-4 w-4 mr-2 text-green-500" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">🤖 Agendar Automático</div>
                  <div className="text-xs text-muted-foreground">
                    Todo dia às 3AM · Configurável
                  </div>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {/* Enriquecimentos Individuais (se fornecidos) */}
          {(onReceita || onApollo || on360) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Enriquecimentos Individuais
              </DropdownMenuLabel>
              
              <DropdownMenuGroup>
                {onReceita && (
                  <DropdownMenuItem
                    onClick={() => handleAction('Receita', onReceita)}
                    disabled={isLoading || !hasCNPJ}
                    className="cursor-pointer hover:bg-accent"
                  >
                    {processingAction === 'Receita' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Building2 className="h-4 w-4 mr-2" />
                    )}
                    Receita Federal
                    {!hasCNPJ && (
                      <span className="ml-auto text-xs text-muted-foreground">Requer CNPJ</span>
                    )}
                  </DropdownMenuItem>
                )}

                {onApollo && (
                  <DropdownMenuItem
                    onClick={() => handleAction('Apollo', onApollo)}
                    disabled={isLoading}
                    className="cursor-pointer hover:bg-accent"
                  >
                    {processingAction === 'Apollo' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
                    )}
                    Apollo (Decisores)
                  </DropdownMenuItem>
                )}

                {on360 && (
                  <DropdownMenuItem
                    onClick={() => handleAction('360°', on360)}
                    disabled={isLoading}
                    className="cursor-pointer hover:bg-accent"
                  >
                    {processingAction === '360°' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    360° Completo
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          {/* Dica */}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Fluxo Correto:</strong></p>
            <p>1️⃣ Receita Federal (sempre disponível)</p>
            <p>2️⃣ Relatório STC → Aba TOTVS define GO/NO-GO</p>
            <p>3️⃣ Apollo só se status for GO (economiza créditos)</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

