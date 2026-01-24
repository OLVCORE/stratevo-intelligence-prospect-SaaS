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
  Search,
  Loader2,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';

interface HeaderActionsMenuProps {
  onUploadClick: () => void;
  // 🚨 REMOVIDO: onBatchEnrichReceita, onBatchEnrich360, onBatchEnrichApollo, onBatchEnrichWebsite
  // Enrichment só permitido em Leads Aprovados (ACTIVE)
  // onSendToQuarantine?: () => Promise<void>; // 🚨 REMOVIDO: Quarentena não faz mais parte do fluxo
  onApolloImport: () => void;
  onSearchCompanies: () => void;
  onPartnerSearch?: () => void; // ✅ NOVO: Buscar por Sócios
  isProcessing?: boolean;
}

export function HeaderActionsMenu({
  onUploadClick,
  // 🚨 REMOVIDO: Todas as props de enrichment
  onApolloImport,
  onSearchCompanies,
  onPartnerSearch, // ✅ NOVO
  isProcessing = false
}: HeaderActionsMenuProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="default"
          disabled={isProcessing}
          data-testid="header-actions-menu"
          aria-label="Menu de ações em massa"
          className="gap-2"
        >
          {isProcessing ? (
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
            disabled={isProcessing}
            data-testid="action-upload-bulk"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload em Massa
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onApolloImport}
            disabled={isProcessing}
            data-testid="action-apollo-import"
            className="transition-all duration-200 cursor-pointer hover:bg-accent hover:shadow-md hover:border-l-2 hover:border-primary"
          >
            <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
            Importar do Apollo
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={onSearchCompanies}
            disabled={isProcessing}
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
              disabled={isProcessing}
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
        {/* 🚨 REMOVIDO: Seção completa de Enriquecimento em Lote */}
        {/* Enrichment só permitido em Leads Aprovados (ACTIVE) */}
        {/* 🚨 REMOVIDO: Ações de Fluxo ICP - Quarentena não faz mais parte do fluxo */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
