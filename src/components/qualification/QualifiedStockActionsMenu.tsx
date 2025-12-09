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
  Trash2,
  Download,
  Loader2,
  MoreHorizontal,
  Sparkles,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

interface QualifiedStockActionsMenuProps {
  selectedCount: number;
  totalCount: number;
  onBulkDelete: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onBulkEnrichment: () => Promise<void>;
  onPromoteToCompanies: () => Promise<void>;
  onExportSelected: () => void;
  isProcessing?: boolean;
}

export function QualifiedStockActionsMenu({
  selectedCount,
  totalCount,
  onBulkDelete,
  onDeleteAll,
  onBulkEnrichment,
  onPromoteToCompanies,
  onExportSelected,
  isProcessing = false,
}: QualifiedStockActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onBulkDelete();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      await onDeleteAll();
    } catch (error) {
      console.error('Error deleting all:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleEnrichment = async () => {
    try {
      setIsEnriching(true);
      await onBulkEnrichment();
    } catch (error) {
      console.error('Error enriching:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="default"
          disabled={isProcessing || isDeleting || isDeletingAll || isEnriching}
          className="gap-2 border border-primary shadow-md hover:shadow-lg"
        >
          {isProcessing || isDeleting || isDeletingAll || isEnriching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          Ações em Massa ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold">
          Ações Disponíveis
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Ações com Seleção */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Selecionadas ({selectedCount})
          </DropdownMenuLabel>

          <DropdownMenuItem 
            onClick={onPromoteToCompanies}
            disabled={selectedCount === 0 || isProcessing}
            className="cursor-pointer"
          >
            <Database className="h-4 w-4 mr-2" />
            Enviar para Banco de Empresas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleEnrichment}
            disabled={selectedCount === 0 || isEnriching}
            className="cursor-pointer"
          >
            {isEnriching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Enriquecer Selecionadas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onExportSelected}
            disabled={selectedCount === 0}
            className="cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Selecionadas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleDelete}
            disabled={selectedCount === 0 || isDeleting}
            className="cursor-pointer text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Deletar Selecionadas
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Ações Perigosas */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Ações Perigosas
          </DropdownMenuLabel>

          <DropdownMenuItem 
            onClick={handleDeleteAll}
            disabled={totalCount === 0 || isDeletingAll}
            className="cursor-pointer text-destructive"
          >
            {isDeletingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            Deletar TODAS ({totalCount})
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

