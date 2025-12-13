import { Settings, CheckCircle, XCircle, Eye, Trash2, RefreshCw, Target, Edit, Search, Building2, Sparkles, Zap, ExternalLink, Loader2, FileText, Undo2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { QuarantineReportModal } from '@/components/icp/QuarantineReportModal';
import { DiscardCompanyModal } from '@/components/icp/DiscardCompanyModal';

interface QuarantineRowActionsProps {
  company: any;
  onApprove: (id: string) => void;
  onReject: (id: string, motivo: string) => void;
  onDelete: (id: string) => void;
  onPreview: (company: any) => void;
  onRefresh?: (id: string) => void;
  onEnrichReceita?: (id: string) => Promise<void>;
  onEnrichApollo?: (id: string) => Promise<void>;
  onEnrichEconodata?: (id: string) => Promise<void>;
  onEnrich360?: (id: string) => Promise<void>;
  onEnrichVerification?: (id: string) => Promise<void>;
  onDiscoverCNPJ?: (id: string) => void;
  onOpenExecutiveReport?: () => void;
  onEnrichCompleto?: (id: string) => Promise<void>;
  onRestoreIndividual?: (cnpj: string) => Promise<void>;
  onEnrichWebsite?: (id: string) => Promise<void>;
  onCalculatePurchaseIntent?: (id: string) => Promise<void>;
}

export function QuarantineRowActions({
  company,
  onApprove,
  onReject,
  onDelete,
  onPreview,
  onRefresh,
  onEnrichReceita,
  onEnrichApollo,
  onEnrichEconodata,
  onEnrich360,
  onEnrichVerification,
  onDiscoverCNPJ,
  onOpenExecutiveReport,
  onEnrichCompleto,
  onRestoreIndividual,
  onEnrichWebsite,
  onCalculatePurchaseIntent,
}: QuarantineRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const navigate = useNavigate();

  const handleApprove = () => {
    onApprove(company.id);
    setIsOpen(false);
  };

  const handleReject = () => {
    setShowDiscardModal(true);
    setIsOpen(false);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja DELETAR permanentemente "${company.razao_social}"? Esta ação não pode ser desfeita.`
    );
    if (confirmed) {
      onDelete(company.id);
      setIsOpen(false);
    }
  };
  
  const handleRestore = async () => {
    if (!onRestoreIndividual || !company.cnpj) return;
    
    try {
      setIsRestoring(true);
      await onRestoreIndividual(company.cnpj);
      setIsOpen(false);
      toast.success(`✅ ${company.razao_social} restaurada para quarentena!`);
    } catch (error: any) {
      console.error('[ROW-ACTION] ❌ Erro ao restaurar:', error);
      toast.error('Erro ao restaurar empresa', { description: error.message });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePreview = () => {
    onPreview(company);
    setIsOpen(false);
  };

  const handleEnrich = async (action: string, fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    try {
      setIsEnriching(true);
      setEnrichingAction(action);
      setEnrichmentProgress(0);
      
      // Simular progress para "Análise Completa" (3 etapas)
      if (action === 'Análise Completa 360°') {
        // 1/3
        setTimeout(() => setEnrichmentProgress(33), 500);
        // 2/3
        setTimeout(() => setEnrichmentProgress(67), 3000);
      } else {
        // Enriquecimento individual
        setTimeout(() => setEnrichmentProgress(50), 500);
        setTimeout(() => setEnrichmentProgress(90), 2000);
      }
      
      await fn(company.id);
      setEnrichmentProgress(100);
    } catch (error) {
      toast.error(`Erro ao executar ${action}`);
    } finally {
      setTimeout(() => {
        setIsEnriching(false);
        setEnrichingAction(null);
        setEnrichmentProgress(0);
      }, 500);
    }
  };

  const isDisabled = (action: string) => {
    if (action === 'receita' && !company.cnpj) return true;
    if (action === 'econodata' && !company.cnpj) return true;
    return false;
  };

  const getTooltip = (action: string) => {
    if (action === 'receita' && !company.cnpj) return 'Requer CNPJ';
    if (action === 'econodata' && !company.cnpj) return 'Requer CNPJ';
    return '';
  };

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            data-testid="quarantine-row-actions"
            aria-label="Ações da empresa"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 bg-popover z-[100]">
          <DropdownMenuLabel className="text-sm font-semibold">Ações da Empresa</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Ver Detalhes (mesclado com Preview) */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={handlePreview}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Visualizar Análise Completa</p>
              <p className="text-xs text-muted-foreground mt-1">Abre modal com todos os dados ICP, scores, temperatura e análise detalhada da empresa</p>
            </TooltipContent>
          </Tooltip>

          {/* Editar/Salvar Dados */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  // Se já tem company_id vinculado, vai para edição
                  if (company.company_id) {
                    navigate(`/search?companyId=${company.company_id}`);
                  } else {
                    toast.info('Complete a aprovação para editar dados completos');
                  }
                  setIsOpen(false);
                }}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar/Salvar Dados
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Editar Cadastro da Empresa</p>
              <p className="text-xs text-muted-foreground mt-1">Abre tela de busca/edição para atualizar manualmente dados cadastrais, contatos e informações complementares</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />

          {/* Verificação de Uso - Abrir modal (origem única) */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  setShowReport(true);
                  setIsOpen(false);
                  toast.info('Use o botão "Verificar Agora" ou "Atualizar" dentro do relatório para executar a verificação.');
                }}
                disabled={isEnriching}
                className="relative animate-pulse bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 hover:from-primary/30 hover:via-primary/20 hover:to-primary/30 border-l-4 border-primary font-semibold cursor-pointer transition-all dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 dark:hover:from-primary/40 dark:hover:via-primary/30 dark:hover:to-primary/40"
              >
                {enrichingAction === 'Verificação de Uso' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                ) : (
                  <Target className="h-4 w-4 mr-2 text-primary" />
                )}
                <span className="text-primary">Verificação de Uso (STC)</span>
                <Sparkles className="h-3 w-3 ml-auto text-primary animate-pulse" />
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs bg-primary text-primary-foreground">
              <p className="font-semibold text-sm">⭐ STC - Verificação de Uso (Prioritário)</p>
              <p className="text-xs mt-1">Verifica em <strong>70 fontes premium</strong>: 30 portais vagas, 26 notícias/tech (Baguete, CIO, Exame), 6 vídeos/social (YouTube, Instagram), 1 parceiro (Fusion). Detecta triple/double/single match com highlight de termos encontrados</p>
            </TooltipContent>
          </Tooltip>

          {/* Ver Relatório de Verificação (Modal) */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (onOpenExecutiveReport) {
                    onOpenExecutiveReport();
                  }
                  setIsOpen(false);
                }}
                className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Relatório Executivo ICP</p>
              <p className="text-xs text-muted-foreground mt-1">Exibe análise completa consolidada: ICP score, temperatura, verificação de uso, maturidade digital, diagnóstico 360° e recomendações de abordagem</p>
            </TooltipContent>
          </Tooltip>

          {/* Atualizar relatório */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (onRefresh) onRefresh(company.id);
                }}
                className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar relatório
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Refresh Análise ICP</p>
              <p className="text-xs text-muted-foreground mt-1">Re-executa análise ICP completa com dados atualizados da empresa para refletir mudanças recentes no score e temperatura</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />

          {/* Criar Estratégia */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (company.company_id) {
                    navigate(`/account-strategy?company=${company.company_id}`);
                  } else {
                    toast.info('Aprove a empresa primeiro para criar estratégia');
                  }
                  setIsOpen(false);
                }}
                disabled={!company.cnpj}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Target className="h-4 w-4 mr-2" />
                {company.cnpj ? 'Criar Estratégia' : 'Criar Estratégia (requer CNPJ)'}
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">ROI-Labs: Estratégia de Conta</p>
              <p className="text-xs text-muted-foreground mt-1">Abre central estratégica com ROI Calculator, CPQ, análise de cenários best/expected/worst, propostas visuais e value realization</p>
            </TooltipContent>
          </Tooltip>

          {/* Descobrir CNPJ - Mantido pois é específico da linha e necessário antes do enriquecimento */}
          {!company.cnpj && onDiscoverCNPJ && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-semibold text-primary">🔍 Pré-Requisito</DropdownMenuLabel>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    onClick={() => {
                      onDiscoverCNPJ(company.id);
                      setIsOpen(false);
                    }}
                    className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Descobrir CNPJ
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-semibold text-sm">Busca Automática de CNPJ</p>
                  <p className="text-xs text-muted-foreground mt-1">Pesquisa CNPJ através de APIs públicas e motores de busca usando razão social e domínio da empresa. Necessário para enriquecimento.</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          <DropdownMenuSeparator />

          {/* ✅ NOVO: Enriquecer Website + Fit Score */}
          {onEnrichWebsite && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem 
                  onClick={() => {
                    if (onEnrichWebsite) onEnrichWebsite(company.id);
                    setIsOpen(false);
                  }}
                  className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Enriquecer Website + Fit Score
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Enriquecer Website & LinkedIn</p>
                <p className="text-xs text-muted-foreground mt-1">Escaneia website, extrai produtos, encontra LinkedIn e calcula Website Fit Score</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* ✅ NOVO: Calcular Intenção de Compra */}
          {onCalculatePurchaseIntent && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem 
                  onClick={() => {
                    if (onCalculatePurchaseIntent) onCalculatePurchaseIntent(company.id);
                    setIsOpen(false);
                  }}
                  className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Calcular Intenção de Compra
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Purchase Intent Score</p>
                <p className="text-xs text-muted-foreground mt-1">Calcula score de intenção de compra baseado em sinais de mercado e comportamentais</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Abrir Website */}
          {company.website && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Visitar Site da Empresa</p>
                <p className="text-xs text-muted-foreground mt-1">Abre o website oficial da empresa em nova aba para análise manual de produtos, serviços e presença digital</p>
              </TooltipContent>
            </Tooltip>
          )}

          {company.status === 'pendente' && (
            <>
              <DropdownMenuSeparator />
              
              {/* Aprovar */}
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem 
                    onClick={handleApprove}
                    className="hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-l-4 hover:border-green-500 transition-all cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Aprovar e Mover para Pool
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-semibold text-sm">Aprovar Lead Qualificado</p>
                  <p className="text-xs text-muted-foreground mt-1">Move empresa aprovada da quarentena para o pool ativo de leads, disponível para equipe de vendas trabalhar na prospecção</p>
                </TooltipContent>
              </Tooltip>

              {/* Descartar (só se NÃO está descartada) */}
              {company.status !== 'descartada' && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem 
                      onClick={handleReject}
                      className="hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-l-4 hover:border-orange-500 transition-all cursor-pointer"
                    >
                      <XCircle className="h-4 w-4 mr-2 text-orange-600" />
                      Descartar (Não qualificado)
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold text-sm">Descartar Lead</p>
                    <p className="text-xs text-muted-foreground mt-1">Remove empresa da quarentena por não atender critérios ICP. Move para histórico de descartados com motivo registrado para auditoria</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Restaurar (só se ESTÁ descartada) */}
              {company.status === 'descartada' && onRestoreIndividual && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem 
                      onClick={handleRestore}
                      disabled={isRestoring}
                      className="hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-l-4 hover:border-blue-500 transition-all cursor-pointer"
                    >
                      {isRestoring ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Undo2 className="h-4 w-4 mr-2 text-blue-600" />
                      )}
                      Restaurar para Quarentena
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold text-sm">Restaurar Empresa</p>
                    <p className="text-xs text-muted-foreground mt-1">Move empresa de volta para a quarentena (status pendente) para reanálise</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Ação Perigosa</DropdownMenuLabel>
          
          {/* Deletar */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 hover:border-l-4 hover:border-destructive transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Permanentemente
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm text-destructive">⚠️ Exclusão Permanente</p>
              <p className="text-xs text-muted-foreground mt-1">Remove definitivamente todos os dados da empresa do sistema. Esta ação é irreversível e não pode ser desfeita</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuContent>

        {/* Modal de Relatório (Quarentena) */}
        <QuarantineReportModal 
          open={showReport}
          onOpenChange={setShowReport}
          analysisId={company.id}
          companyId={company.company_id || undefined}
          companyName={company.razao_social || 'Empresa'}
          cnpj={company.cnpj}
          domain={company.domain || company.website}
        />

        {/* Modal de Descarte com motivos */}
        <DiscardCompanyModal
          open={showDiscardModal}
          onOpenChange={setShowDiscardModal}
          company={{
            id: company.company_id || company.id,
            name: company.razao_social || 'Empresa',
            cnpj: company.cnpj,
            icp_score: company.icp_score,
            icp_temperature: company.temperatura,
          }}
          analysisId={company.id}
          onSuccess={() => {
            onReject(company.id, 'Descartado via modal');
          }}
        />
      </DropdownMenu>
    </TooltipProvider>
  );
}
