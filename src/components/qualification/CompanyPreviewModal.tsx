/**
 * ✅ MODAL UNIFICADO DE PREVIEW DE EMPRESA
 * 
 * Este componente é usado em TODAS as páginas:
 * - 2.2 Estoque Qualificado (QualifiedProspectsStock)
 * - 3. Base de Empresas (CompaniesManagementPage)
 * - 4. Quarentena ICP (ICPQuarantine)
 * - 5. Leads Aprovados (ApprovedLeads)
 * - 6. Pipeline de Vendas (Pipeline)
 * 
 * Garante consistência visual e funcional em todas as etapas.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Maximize, Minimize, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { WebsiteFitAnalysisCard } from '@/components/qualification/WebsiteFitAnalysisCard';
import { PurchaseIntentBadge } from '@/components/intelligence/PurchaseIntentBadge';

interface CompanyPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any; // Pode ser de qualquer tabela (qualified_prospects, companies, icp_analysis_results, etc.)
}

export function CompanyPreviewModal({ open, onOpenChange, company }: CompanyPreviewModalProps) {
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isModalFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-7xl max-h-[95vh]'} overflow-y-auto transition-all duration-300`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Resumo da Empresa
            </DialogTitle>
            <DialogDescription>
              Detalhes da qualificação e critérios de matching
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalFullscreen(!isModalFullscreen)}
              className="h-8 w-8 p-0"
              title={isModalFullscreen ? 'Minimizar' : 'Tela cheia'}
            >
              {isModalFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Cabeçalho */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold">
              {company.razao_social || company.name || (company as any).company_name || 'Razão social não informada'}
            </h3>
            
            {/* CNPJ */}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">CNPJ normalizado:</p>
              <p className="text-sm font-mono font-semibold">{company.cnpj || 'N/A'}</p>
            </div>
            
            {(company as any).nome_fantasia && (
              <p className="text-sm text-muted-foreground mt-2">Nome Fantasia: {(company as any).nome_fantasia}</p>
            )}
          </div>

          {/* ICP, Grade e Purchase Intent */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ICP Utilizado</p>
              <p className="text-base">{(company as any).icp?.nome || 'Não especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grade Final</p>
              <div className="mt-1">
                {(() => {
                  const grade = (company as any).grade || (company as any).raw_data?.grade;
                  if (!grade) return <Badge variant="outline">N/A</Badge>;
                  const colors: Record<string, string> = {
                    'A+': 'bg-emerald-600 text-white',
                    'A': 'bg-emerald-500 text-white',
                    'B': 'bg-sky-500 text-white',
                    'C': 'bg-orange-500 text-white',
                    'D': 'bg-rose-500 text-white',
                  };
                  return <Badge className={colors[grade] || 'bg-gray-500 text-white'}>{grade}</Badge>;
                })()}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Intenção de Compra</p>
              <div className="mt-1">
                <PurchaseIntentBadge 
                  score={company.purchase_intent_score} 
                  intentType={company.purchase_intent_type || 'potencial'}
                />
              </div>
            </div>
          </div>

          {/* Fit Score */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Fit Score</p>
            {(company as any).fit_score != null ? (
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{(company as any).fit_score.toFixed(1)}%</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mt-1">Não calculado</p>
            )}
          </div>

          {/* Dados Básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Localização</p>
              <p className="text-base">
                {((company as any).cidade && (company as any).estado)
                  ? `${(company as any).cidade}/${(company as any).estado}`
                  : (company as any).estado || (company as any).uf || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Setor</p>
              <p className="text-base">
                {company.setor || (company as any).industry || (
                  <span className="text-muted-foreground italic">
                    Não informado no lote / não encontrado nas fontes externas
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Mensagem sobre enrich (se dados faltarem) */}
          {(!company.setor && !(company as any).industry && !(company as any).cidade && !company.website) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                ℹ️ Informação sobre dados faltantes
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Esta empresa não foi localizada nas bases externas para o CNPJ {company.cnpj}.
                A qualificação foi feita apenas com os dados internos do lote de importação.
              </p>
            </div>
          )}

          {/* Origem do Lote */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Origem</p>
            <p className="text-base">{(company as any).source_name || (company as any).job?.job_name || 'Não especificado'}</p>
            {(company as any).job?.source_type && (
              <Badge variant="outline" className="mt-1">
                {(company as any).job.source_type}
              </Badge>
            )}
          </div>

          {/* ✅ Análise Estratégica de Fit - Website & Produtos */}
          <WebsiteFitAnalysisCard
            companyId={company.id}
            qualifiedProspectId={(company as any).qualified_prospect_id || undefined}
            companyCnpj={company.cnpj}
            websiteEncontrado={(company as any).website_encontrado || company.website}
            websiteFitScore={(company as any).website_fit_score}
            websiteProductsMatch={(company as any).website_products_match}
            linkedinUrl={(company as any).linkedin_url}
            isModalFullscreen={isModalFullscreen}
          />

          {/* ✅ Detalhamento de Matching com match_breakdown */}
          {(company as any).match_breakdown && Array.isArray((company as any).match_breakdown) && (company as any).match_breakdown.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Detalhamento de Qualificação</p>
              <div className="space-y-2">
                {(company as any).match_breakdown.map((item: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2 rounded ${
                      item.matched ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-50 dark:bg-gray-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">(peso {Math.round((item.weight || 0) * 100)}%)</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {item.matched ? (
                        <span className="text-green-600">+{item.score}%</span>
                      ) : (
                        <span className="text-gray-400">+{item.score}%</span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-3">
                  Metodologia: classificação por Fit Score ponderado (Setor 30%, Localização 25%, Dados 20%, Website 15%, Contatos 10%).
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

