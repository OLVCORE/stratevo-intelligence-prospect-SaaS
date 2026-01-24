// 🚨 MICROCICLO 2: Bloqueio global de enrichment fora de SALES TARGET
// 🚨 MICROCICLO 4: Validação de estados canônicos
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Loader2, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Building2,
  Download,
  FileSpreadsheet,
  MoreHorizontal,
  Target,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { isInSalesTargetContext } from '@/lib/utils/enrichmentContextValidator';
import { useCanonicalState, getStateLabel } from '@/hooks/useCanonicalState';
import { CanonicalState } from '@/lib/utils/stateTransitionValidator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  selectedCompanies?: any[]; // 🚨 MICROCICLO 4: Empresas selecionadas para validação de estado
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkEnrichReceita: () => Promise<void>;
  onBulkEnrich360: () => Promise<void>;
  onBulkEnrichApollo: () => Promise<void>;
  onBulkEnrichTotvsCheck?: () => Promise<void>;
  onBulkDiscoverCNPJ?: () => Promise<void>;
  onBulkApprove?: () => Promise<void>;
  onBulkSendToQuarantine?: () => Promise<void>; // 🆕 NOVO
  onExportSelected: () => void;
  isProcessing?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  selectedCompanies = [], // 🚨 MICROCICLO 4: Empresas selecionadas
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkEnrichReceita,
  onBulkEnrich360,
  onBulkEnrichApollo,
  onBulkEnrichTotvsCheck,
  onBulkDiscoverCNPJ,
  onBulkApprove,
  onBulkSendToQuarantine, // 🆕 NOVO
  onExportSelected,
  isProcessing = false
}: BulkActionsToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🚨 MICROCICLO 2: Verificar se está em SALES TARGET
  const isSalesTarget = isInSalesTargetContext();
  const enrichmentBlocked = !isSalesTarget;

  // 🚨 MICROCICLO 4: Validar estados canônicos das empresas selecionadas
  // Helper para verificar se ação é permitida (sem usar hook dentro de função)
  const checkActionAllowed = (company: any, action: 'move_to_pool' | 'approve'): boolean => {
    if (!company) return false;
    const { getCanonicalState } = require('@/lib/utils/stateTransitionValidator');
    const currentState = getCanonicalState(company, 'company');
    
    if (action === 'move_to_pool') {
      // BASE → POOL
      return currentState === 'BASE';
    }
    if (action === 'approve') {
      // POOL → ACTIVE (mas isso é para quarentena, não companies)
      // Para companies, "aprovar" significa mover para POOL (BASE → POOL)
      return currentState === 'BASE';
    }
    return false;
  };

  const canMoveToPool = selectedCompanies.length > 0 && selectedCompanies.every((company: any) => 
    checkActionAllowed(company, 'move_to_pool')
  );

  const canApprove = selectedCompanies.length > 0 && selectedCompanies.every((company: any) => 
    checkActionAllowed(company, 'approve')
  );

  // Obter mensagens de erro para ações bloqueadas
  const getMoveToPoolError = (): string | null => {
    if (selectedCompanies.length === 0 || canMoveToPool) return null;
    const firstCompany = selectedCompanies[0];
    if (!firstCompany) return null;
    const { getCanonicalState } = require('@/lib/utils/stateTransitionValidator');
    const currentState = getCanonicalState(firstCompany, 'company');
    
    if (currentState !== 'BASE') {
      return `Ação não permitida. Empresas devem estar em BASE para mover para POOL. Estado atual: ${getStateLabel(currentState)}`;
    }
    return 'Ação não permitida neste estado.';
  };

  const getApproveError = (): string | null => {
    if (selectedCompanies.length === 0 || canApprove) return null;
    const firstCompany = selectedCompanies[0];
    if (!firstCompany) return null;
    const { getCanonicalState } = require('@/lib/utils/stateTransitionValidator');
    const currentState = getCanonicalState(firstCompany, 'company');
    
    if (currentState !== 'BASE') {
      return `Ação não permitida. Empresas devem estar em BASE para aprovar. Estado atual: ${getStateLabel(currentState)}`;
    }
    return 'Ação não permitida neste estado.';
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onBulkDelete();
      setDeleteDialogOpen(false);
      toast.success(`${selectedCount} empresa(s) excluída(s)`);
    } catch (error) {
      toast.error('Erro ao excluir empresas');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <div 
        className="flex items-center justify-between p-4 border-b bg-muted/30"
        data-testid="bulk-actions-toolbar"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={allSelected ? onClearSelection : onSelectAll}
            data-testid="toggle-select-all"
            aria-label={allSelected ? 'Limpar seleção' : 'Selecionar tudo'}
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {allSelected ? 'Limpar' : 'Selecionar tudo'}
          </Button>

          {hasSelection && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Badge variant="secondary" className="font-mono">
                {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 🚨 REMOVIDO: Enriquecer em Lote - Enrichment só permitido em Leads Aprovados (ACTIVE) */}
          {/* Botão não existe se não estiver em ACTIVE */}

          {/* Exportar Selecionadas */}
          {hasSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportSelected}
              disabled={isProcessing}
              data-testid="export-selected"
              aria-label="Exportar empresas selecionadas"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}

          {/* Ações em Massa */}
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing || isDeleting}
                  data-testid="bulk-actions-dropdown"
                  aria-label="Ações em Massa"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Ações em Massa
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onBulkSendToQuarantine && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DropdownMenuItem 
                            onClick={canMoveToPool ? onBulkSendToQuarantine : undefined} 
                            disabled={isProcessing || !canMoveToPool}
                            className={!canMoveToPool 
                              ? "opacity-50 cursor-not-allowed" 
                              : "text-blue-600 font-semibold hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            }
                          >
                            <Target className="h-4 w-4 mr-2" />
                            🎯 Integrar para ICP
                          </DropdownMenuItem>
                        </div>
                      </TooltipTrigger>
                      {!canMoveToPool && getMoveToPoolError() && (
                        <TooltipContent>
                          <p className="max-w-xs text-sm">{getMoveToPoolError()}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                {onBulkSendToQuarantine && canMoveToPool && <DropdownMenuSeparator />}
                {onBulkApprove && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DropdownMenuItem 
                            onClick={canApprove ? onBulkApprove : undefined} 
                            disabled={isProcessing || !canApprove}
                            className={!canApprove ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Aprovar e Mover para Pool
                          </DropdownMenuItem>
                        </div>
                      </TooltipTrigger>
                      {!canApprove && getApproveError() && (
                        <TooltipContent>
                          <p className="max-w-xs text-sm">{getApproveError()}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                {onBulkApprove && canApprove && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={onExportSelected} disabled={isProcessing}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} disabled={isProcessing || isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir em Massa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Deletar Selecionadas */}
          {hasSelection && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isProcessing || isDeleting}
              data-testid="bulk-delete"
              aria-label="Deletar empresas selecionadas"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Deletar
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{selectedCount}</strong> empresa{selectedCount !== 1 ? 's' : ''}.
              <br /><br />
              Esta ação <strong>não pode ser desfeita</strong> e todos os dados relacionados serão perdidos permanentemente.
              <br /><br />
              Digite <strong>CONFIRMAR</strong> para prosseguir:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            id="bulk-delete-confirm"
            className="w-full p-2 border rounded"
            placeholder="Digite CONFIRMAR"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById('bulk-delete-confirm') as HTMLInputElement;
                if (input?.value === 'CONFIRMAR') {
                  handleDelete();
                } else {
                  toast.error('Digite CONFIRMAR para prosseguir');
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
