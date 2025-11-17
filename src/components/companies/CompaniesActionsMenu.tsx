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
  Target,
  Building2
} from 'lucide-react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useState } from 'react';

interface CompaniesActionsMenuProps {
  selectedCount: number;
  onBulkDelete: () => Promise<void>;
  onExport: () => void;
  onBulkEnrichReceita?: () => Promise<void>;
  onBulkEnrichApollo?: () => Promise<void>;
  onBulkEnrich360?: () => Promise<void>;
  onBulkSendToQuarantine?: () => Promise<void>;
  isProcessing?: boolean;
}

export function CompaniesActionsMenu({
  selectedCount,
  onBulkDelete,
  onExport,
  onBulkEnrichReceita,
  onBulkEnrichApollo,
  onBulkEnrich360,
  onBulkSendToQuarantine,
  isProcessing = false,
}: CompaniesActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={isProcessing || isDeleting}
          className="gap-2 h-8"
        >
          {isProcessing || isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MoreHorizontal className="h-3.5 w-3.5" />
          )}
          Ações em Massa ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 z-[100] bg-popover"
      >
        <DropdownMenuLabel className="text-sm font-semibold">
          {selectedCount > 0 ? `${selectedCount} empresa(s) selecionada(s)` : 'Nenhuma empresa selecionada'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* ENRIQUECIMENTOS */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold text-primary">
            ⚡ Enriquecimento em Massa
          </DropdownMenuLabel>
          
          {onBulkEnrichReceita && (
            <DropdownMenuItem 
              onClick={onBulkEnrichReceita}
              disabled={selectedCount === 0 || isDeleting}
              className="cursor-pointer hover:bg-accent"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Receita Federal em Lote
            </DropdownMenuItem>
          )}

          {onBulkEnrichApollo && (
            <DropdownMenuItem 
              onClick={onBulkEnrichApollo}
              disabled={selectedCount === 0 || isDeleting}
              className="cursor-pointer hover:bg-accent"
            >
              <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
              Apollo em Lote
            </DropdownMenuItem>
          )}

          {onBulkEnrich360 && (
            <DropdownMenuItem 
              onClick={onBulkEnrich360}
              disabled={selectedCount === 0 || isDeleting}
              className="cursor-pointer hover:bg-accent"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              360° em Lote
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* AÇÕES */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold">
            Ações
          </DropdownMenuLabel>

          <DropdownMenuItem 
            onClick={onExport}
            disabled={selectedCount === 0 || isDeleting}
            className="cursor-pointer hover:bg-accent"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Selecionadas
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleDelete}
            disabled={selectedCount === 0 || isDeleting}
            className="cursor-pointer hover:bg-accent text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Deletar Selecionadas
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

