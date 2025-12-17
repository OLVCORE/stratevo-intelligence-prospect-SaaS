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
  Upload,
  Building2,
  Sparkles,
  Search,
  Database,
  Loader2,
  MoreHorizontal,
  Target,
  Users
} from 'lucide-react';
import { useState } from 'react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface HeaderActionsMenuProps {
  onUploadClick: () => void;
  onBatchEnrichReceita: () => Promise<void>;
  onBatchEnrich360: () => Promise<void>;
  onBatchEnrichApollo: () => Promise<void>;
  onSendToQuarantine?: () => Promise<void>; // 🆕 NOVO
  onApolloImport: () => void;
  onSearchCompanies: () => void;
  onPartnerSearch?: () => void; // ✅ NOVO: Buscar por Sócios
  isProcessing?: boolean;
}

export function HeaderActionsMenu({
  onUploadClick,
  onBatchEnrichReceita,
  onBatchEnrich360,
  onBatchEnrichApollo,
  onSendToQuarantine, // 🆕 NOVO
  onApolloImport,
  onSearchCompanies,
  onPartnerSearch, // ✅ NOVO
  isProcessing = false
}: HeaderActionsMenuProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);

  const handleEnrich = async (action: string, fn: () => Promise<void>) => {
    try {
      setIsEnriching(true);
      setEnrichingAction(action);
      await fn();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setIsEnriching(false);
      setEnrichingAction(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="default"
          disabled={isProcessing || isEnriching}
          data-testid="header-actions-menu"
          aria-label="Menu de ações em massa"
          className="gap-2"
        >
          {isProcessing || isEnriching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          Ações em Massa
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 z-[100] bg-popover"
        data-testid="header-actions-dropdown"
      >
        <DropdownMenuLabel>Importar & Adicionar</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={onUploadClick}
            disabled={isEnriching}
            data-testid="action-upload-bulk"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload em Massa
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onApolloImport}
            disabled={isEnriching}
            data-testid="action-apollo-import"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
            Importar do Apollo
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onSearchCompanies}
            disabled={isEnriching}
            data-testid="action-search-companies"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Empresas
          </DropdownMenuItem>

          {/* ✅ BUSCAR POR SÓCIOS - Descobrir empresas via proprietários */}
          {onPartnerSearch && (
            <DropdownMenuItem 
              onClick={onPartnerSearch}
              disabled={isEnriching}
              className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
            >
              <Users className="h-4 w-4 mr-2 text-purple-600" />
              <div className="flex flex-col">
                <span>Buscar por Sócios</span>
                <span className="text-[10px] text-muted-foreground">Descobrir empresas via proprietários</span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Enriquecimento em Lote</DropdownMenuLabel>
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleEnrich('Receita Federal', onBatchEnrichReceita)}
            disabled={isEnriching}
            data-testid="action-batch-receita"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            {enrichingAction === 'Receita Federal' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            Receita Federal (Lote)
            <span className="ml-auto text-xs text-muted-foreground">Apenas sem dados</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleEnrich('Apollo', onBatchEnrichApollo)}
            disabled={isEnriching}
            data-testid="action-batch-apollo"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            {enrichingAction === 'Apollo' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
            )}
            Apollo (Decisores & Contatos)
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleEnrich('360° Completo', onBatchEnrich360)}
            disabled={isEnriching}
            data-testid="action-batch-360"
            className="font-medium transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            {enrichingAction === '360° Completo' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            360° Completo + IA
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* 🆕 AÇÕES DE FLUXO ICP */}
        {onSendToQuarantine && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Fluxo ICP
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onSendToQuarantine}
                disabled={isEnriching}
                className="text-blue-600 font-bold hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 cursor-pointer hover:bg-blue-500/10 hover:shadow-md hover:border-l-4 hover:border-blue-600"
              >
                <Target className="h-4 w-4 mr-2" />
                🎯 Mover para Quarentena ICP
                <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  FLUXO
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
