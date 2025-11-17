import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Eye,
  Edit,
  Target,
  Search,
  Trash2,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExecutiveReportModal } from '@/components/reports/ExecutiveReportModal';

interface CompanyRowActionsProps {
  company: any;
  onDelete: () => void;
  onDiscoverCNPJ?: () => void;
}

export function CompanyRowActions({
  company,
  onDelete,
  onDiscoverCNPJ
}: CompanyRowActionsProps) {
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-testid="company-row-actions"
          aria-label="Ações da empresa"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover z-[100]">
        <DropdownMenuLabel className="text-sm font-semibold">Ações da Empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Visualizar */}
        <DropdownMenuItem 
          onClick={() => navigate(`/company/${company.id}`)}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </DropdownMenuItem>

        {/* Relatório Executivo */}
        <DropdownMenuItem 
          onClick={() => setShowReport(true)}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          Relatório Executivo
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate(`/search?companyId=${company.id}`)}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar/Salvar Dados
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Estratégia - só quando há CNPJ e dados básicos */}
        <DropdownMenuItem 
          onClick={() => navigate(`/account-strategy?company=${company.id}`)}
          disabled={!company.cnpj}
          className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
        >
          <Target className="h-4 w-4 mr-2" />
          {company.cnpj ? 'Criar Estratégia' : 'Criar Estratégia (requer CNPJ)'}
        </DropdownMenuItem>

        {/* Descobrir CNPJ - Mantido apenas se não tiver CNPJ (pré-requisito) */}
        {!company.cnpj && onDiscoverCNPJ && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold text-primary">🔍 Pré-Requisito</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={onDiscoverCNPJ}
            className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
          >
            <Search className="h-4 w-4 mr-2" />
            Descobrir CNPJ
          </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
          )}

        <DropdownMenuSeparator />

        {/* Links Externos */}
        {company.website && (
          <DropdownMenuItem asChild>
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Website
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Deletar */}
        <DropdownMenuItem 
          onClick={onDelete} 
          className="text-destructive focus:text-destructive hover:bg-destructive/10 hover:border-l-4 hover:border-destructive transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
      {/* Modal de Relatório Executivo */}
      <ExecutiveReportModal 
        open={showReport} 
        onOpenChange={setShowReport} 
        companyId={company.id}
      />
    </DropdownMenu>
  );
}
