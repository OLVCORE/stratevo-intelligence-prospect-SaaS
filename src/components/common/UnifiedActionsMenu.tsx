/**
 * UnifiedActionsMenu - Componente Unificado de Ações
 * 
 * Padroniza todas as ações em massa e individuais em todas as páginas:
 * - Estoque Qualificado
 * - Base de Empresas
 * - Quarentena ICP
 * - Leads Aprovados
 */

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
  FileText,
  Loader2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Target,
  Building2,
  Sparkles,
  Search,
  CheckCircle,
  XCircle,
  Globe,
  Database,
  AlertTriangle,
} from 'lucide-react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { useState } from 'react';

export type ProspectStatus = 'new' | 'qualified' | 'in_quarantine' | 'approved' | 'pipeline' | 'closed';

interface UnifiedActionsMenuProps {
  // Context
  context: 'stock' | 'companies' | 'quarantine' | 'approved';
  selectedCount: number;
  totalCount?: number;
  
  // Primary Actions (sempre visíveis)
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onSendToQuarantine?: () => Promise<void>;
  onPromoteToCompanies?: () => Promise<void>;
  
  // Enrichment Actions
  onEnrichReceita?: () => Promise<void>;
  onEnrichApollo?: () => Promise<void>;
  onEnrich360?: () => Promise<void>;
  onEnrichWebsite?: () => Promise<void>;
  onDiscoverCNPJ?: () => Promise<void>;
  onVerification?: () => Promise<void>;
  onCalculatePurchaseIntent?: () => Promise<void>;
  
  // Export Actions
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onPreview?: () => void;
  
  // Delete Actions
  onDelete?: () => Promise<void>;
  onDeleteAll?: () => Promise<void>;
  
  // Status
  isProcessing?: boolean;
}

export function UnifiedActionsMenu({
  context,
  selectedCount,
  totalCount = 0,
  onApprove,
  onReject,
  onSendToQuarantine,
  onPromoteToCompanies,
  onEnrichReceita,
  onEnrichApollo,
  onEnrich360,
  onEnrichWebsite,
  onDiscoverCNPJ,
  onVerification,
  onCalculatePurchaseIntent,
  onExportCSV,
  onExportPDF,
  onPreview,
  onDelete,
  onDeleteAll,
  isProcessing = false,
}: UnifiedActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAll) return;
    try {
      setIsDeletingAll(true);
      await onDeleteAll();
    } catch (error) {
      console.error('Error deleting all:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const getContextLabel = () => {
    switch (context) {
      case 'stock': return 'Estoque Qualificado';
      case 'companies': return 'Base de Empresas';
      case 'quarantine': return 'Quarentena ICP';
      case 'approved': return 'Leads Aprovados';
      default: return 'Ações';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={isProcessing || isDeleting || isDeletingAll}
          className="gap-2"
        >
          {isProcessing || isDeleting || isDeletingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          Ações em Massa ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 z-[100] bg-popover">
        <DropdownMenuLabel className="text-sm font-semibold">
          {selectedCount > 0 ? `${selectedCount} empresa(s) selecionada(s)` : 'Nenhuma empresa selecionada'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* PRIMARY ACTIONS */}
        {(onApprove || onReject || onSendToQuarantine || onPromoteToCompanies) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-primary">
                Ações Principais
              </DropdownMenuLabel>
              
              {onApprove && (
                <DropdownMenuItem 
                  onClick={onApprove}
                  disabled={selectedCount === 0 || isProcessing}
                  className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {context === 'companies' ? 'Aprovar para Leads Aprovados' : 'Aprovar'}
                </DropdownMenuItem>
              )}

              {onReject && (
                <DropdownMenuItem 
                  onClick={onReject}
                  disabled={selectedCount === 0 || isProcessing}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </DropdownMenuItem>
              )}

              {onSendToQuarantine && (
                <DropdownMenuItem 
                  onClick={onSendToQuarantine}
                  disabled={selectedCount === 0 || isProcessing}
                  className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Enviar para Quarentena
                </DropdownMenuItem>
              )}

              {onPromoteToCompanies && (
                <DropdownMenuItem 
                  onClick={onPromoteToCompanies}
                  disabled={selectedCount === 0 || isProcessing}
                  className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Enviar para Base de Empresas
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* ENRICHMENT ACTIONS - ESTOQUE QUALIFICADO E LEADS APROVADOS */}
        {(context === 'approved' || context === 'stock') && (onEnrichReceita || onEnrichApollo || onEnrich360 || onEnrichWebsite || onDiscoverCNPJ || onVerification || onCalculatePurchaseIntent) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-primary">
                ⚡ Enriquecimento
              </DropdownMenuLabel>
              
              {onEnrichReceita && (
                <DropdownMenuItem 
                  onClick={onEnrichReceita}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Enriquecimento da Receita Federal
                </DropdownMenuItem>
              )}

              {onEnrichApollo && (
                <DropdownMenuItem 
                  onClick={onEnrichApollo}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
                  Apollo (Decisores)
                </DropdownMenuItem>
              )}

              {onEnrich360 && (
                <DropdownMenuItem 
                  onClick={onEnrich360}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  360° Completo
                </DropdownMenuItem>
              )}

              {onEnrichWebsite && (
                <DropdownMenuItem 
                  onClick={onEnrichWebsite}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Website & LinkedIn
                </DropdownMenuItem>
              )}

              {onDiscoverCNPJ && (
                <DropdownMenuItem 
                  onClick={onDiscoverCNPJ}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Descobrir CNPJ
                </DropdownMenuItem>
              )}

              {onVerification && (
                <DropdownMenuItem 
                  onClick={onVerification}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Verificação de Uso (STC)
                </DropdownMenuItem>
              )}

              {onCalculatePurchaseIntent && (
                <DropdownMenuItem 
                  onClick={onCalculatePurchaseIntent}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Calcular Purchase Intent
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* RECEITA FEDERAL EM MASSA - BASE DE EMPRESAS */}
        {context === 'companies' && onEnrichReceita && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-primary">
                Validação
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onEnrichReceita}
                disabled={selectedCount === 0 || isProcessing}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Consultar Receita Federal (em massa)
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* EXPORT ACTIONS */}
        {(onExportCSV || onExportPDF || onPreview) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold">
                Exportação
              </DropdownMenuLabel>
              
              {onPreview && (
                <DropdownMenuItem 
                  onClick={onPreview}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}

              {onExportCSV && (
                <DropdownMenuItem 
                  onClick={onExportCSV}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
              )}

              {onExportPDF && (
                <DropdownMenuItem 
                  onClick={onExportPDF}
                  disabled={selectedCount === 0 || isProcessing}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* DELETE ACTIONS */}
        {(onDelete || onDeleteAll) && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Ações Perigosas
            </DropdownMenuLabel>
            
            {onDelete && (
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={selectedCount === 0 || isDeleting}
                className="text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Deletar Selecionadas
              </DropdownMenuItem>
            )}

            {onDeleteAll && (
              <DropdownMenuItem 
                onClick={handleDeleteAll}
                disabled={totalCount === 0 || isDeletingAll}
                className="text-destructive"
              >
                {isDeletingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Deletar TODAS ({totalCount})
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

