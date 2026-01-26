import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Flame, Thermometer, Snowflake, Download, Filter, Search, RefreshCw, FileText, Globe, ArrowUpDown, Loader2, AlertCircle, ChevronDown, ChevronUp, Rocket, TrendingUp, HelpCircle, CheckCircle2, Building2, Maximize, Minimize, ChevronLeft, ChevronRight, Target, Linkedin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DraggableDialog } from "@/components/ui/draggable-dialog";
import { useNavigate } from 'react-router-dom';
import { useApprovedCompanies } from '@/hooks/useApprovedCompanies';
import { useRejectQuarantine } from '@/hooks/useICPQuarantine';
import { useDeleteQuarantineBatch } from '@/hooks/useDeleteQuarantineBatch';
import { useRefreshQuarantineBatch } from '@/hooks/useRefreshQuarantineBatch';
import { useReverifyAllCompanies } from '@/hooks/useReverifyAllCompanies';
import { useRestoreAllBatchDiscarded } from '@/hooks/useRestoreDiscarded';
import { QuarantineActionsMenu } from '@/components/icp/QuarantineActionsMenu';
import { QuarantineRowActions } from '@/components/icp/QuarantineRowActions';
import { DiscardedCompaniesModal } from '@/components/icp/DiscardedCompaniesModal';
import UsageVerificationCard from '@/components/totvs/TOTVSCheckCard';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { ICPScoreTooltip } from '@/components/icp/ICPScoreTooltip';
import { VerificationStatusBadge } from '@/components/totvs/TOTVSStatusBadge';
import { EnrichmentProgressModal, type EnrichmentProgress } from '@/components/companies/EnrichmentProgressModal';
import { ExpandedCompanyCard } from '@/components/companies/ExpandedCompanyCard';
import { toast } from 'sonner';
import * as Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExecutiveReportModal } from '@/components/reports/ExecutiveReportModal';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { enrichment360Simplificado } from '@/services/enrichment360';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { UnifiedEnrichButton } from '@/components/companies/UnifiedEnrichButton';
import { PurchaseIntentBadge } from '@/components/intelligence/PurchaseIntentBadge';
import { CompanyPreviewModal } from '@/components/qualification/CompanyPreviewModal';
import { WebsiteFitAnalysisCard } from '@/components/qualification/WebsiteFitAnalysisCard';
import { useTenant } from '@/contexts/TenantContext';
import { formatWebsiteUrl } from '@/lib/utils/urlHelpers';
import { formatCNPJ } from '@/lib/utils/validators';
import { getCNAEClassifications, type CNAEClassification } from '@/services/cnaeClassificationService';
import { resolveCompanyCNAE, formatCNAEForDisplay } from '@/lib/utils/cnaeResolver';
import { getCompanyOrigin, getCompanyOriginString } from '@/lib/utils/originResolver';

// 🎨 Função para gerar cores dinâmicas consistentes baseadas no nome do setor/segmento
const getDynamicBadgeColors = (name: string | null | undefined, type: 'setor' | 'categoria'): string => {
  if (!name) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700';
  
  // Hash simples para garantir consistência (mesmo nome = mesma cor)
  let hash = 0;
  const normalizedName = name.toLowerCase().trim();
  for (let i = 0; i < normalizedName.length; i++) {
    hash = normalizedName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Paleta de cores do Tailwind (12 cores diferentes)
  const colorPalettes = [
    { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200', border: 'border-blue-300', darkBorder: 'dark:border-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-200', border: 'border-purple-300', darkBorder: 'dark:border-purple-700' },
    { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200', border: 'border-green-300', darkBorder: 'dark:border-green-700' },
    { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'dark:bg-orange-900', darkText: 'dark:text-orange-200', border: 'border-orange-300', darkBorder: 'dark:border-orange-700' },
    { bg: 'bg-pink-100', text: 'text-pink-800', darkBg: 'dark:bg-pink-900', darkText: 'dark:text-pink-200', border: 'border-pink-300', darkBorder: 'dark:border-pink-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', darkBg: 'dark:bg-indigo-900', darkText: 'dark:text-indigo-200', border: 'border-indigo-300', darkBorder: 'dark:border-indigo-700' },
    { bg: 'bg-teal-100', text: 'text-teal-800', darkBg: 'dark:bg-teal-900', darkText: 'dark:text-teal-200', border: 'border-teal-300', darkBorder: 'dark:border-teal-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', darkBg: 'dark:bg-cyan-900', darkText: 'dark:text-cyan-200', border: 'border-cyan-300', darkBorder: 'dark:border-cyan-700' },
    { bg: 'bg-amber-100', text: 'text-amber-800', darkBg: 'dark:bg-amber-900', darkText: 'dark:text-amber-200', border: 'border-amber-300', darkBorder: 'dark:border-amber-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', darkBg: 'dark:bg-emerald-900', darkText: 'dark:text-emerald-200', border: 'border-emerald-300', darkBorder: 'dark:border-emerald-700' },
    { bg: 'bg-rose-100', text: 'text-rose-800', darkBg: 'dark:bg-rose-900', darkText: 'dark:text-rose-200', border: 'border-rose-300', darkBorder: 'dark:border-rose-700' },
    { bg: 'bg-violet-100', text: 'text-violet-800', darkBg: 'dark:bg-violet-900', darkText: 'dark:text-violet-200', border: 'border-violet-300', darkBorder: 'dark:border-violet-700' },
  ];
  
  // Para categorias, adiciona offset no hash para garantir cores diferentes do setor
  const hashOffset = type === 'categoria' ? 1000 : 0;
  const colorIndex = Math.abs(hash + hashOffset) % colorPalettes.length;
  const colors = colorPalettes[colorIndex];
  
  return `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} ${colors.border} ${colors.darkBorder}`;
};

// Helper para normalizar source_name removendo referências a TOTVS/TVS
const normalizeSourceName = (sourceName: string | null | undefined): string => {
  if (!sourceName) return 'Sem origem';
  
  // Remove referências a TOTVS/TVS
  return sourceName
    .replace(/[-_]?TVS/gi, '')
    .replace(/[-_]?TOTVS/gi, '')
    .replace(/Web Search\s*-?\s*/gi, 'Web Search')
    .replace(/\s+/g, ' ')
    .trim() || 'Sem origem';
};

export default function ApprovedLeads() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(50); // 🔢 Paginação configurável
  
  // 🔍 FILTROS POR COLUNA (tipo Excel)
  const [filterOrigin, setFilterOrigin] = useState<string[]>([]);
  const [filterCNPJStatus, setFilterCNPJStatus] = useState<string[]>([]);
  const [filterSector, setFilterSector] = useState<string[]>([]);
  const [filterUF, setFilterUF] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState<string[]>([]);
  const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]);
  const [filterVerificationStatus, setFilterVerificationStatus] = useState<string[]>([]); // 🆕 FILTRO STATUS VERIFICAÇÃO
  const [filterICP, setFilterICP] = useState<string[]>([]);
  const [filterFitScore, setFilterFitScore] = useState<string[]>([]);
  const [filterGrade, setFilterGrade] = useState<string[]>([]);
  const [filterCNAE, setFilterCNAE] = useState<string[]>([]); // ✅ NOVO: Filtro por CNAE
  const [cnaeClassifications, setCnaeClassifications] = useState<Record<string, CNAEClassification>>({});
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCompany, setPreviewCompany] = useState<any>(null);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [websiteInput, setWebsiteInput] = useState<string>('');
  const [executiveReportOpen, setExecutiveReportOpen] = useState(false);
  const [executiveReportCompanyId, setExecutiveReportCompanyId] = useState<string | undefined>();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectCompanyData, setRejectCompanyData] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectCustomReason, setRejectCustomReason] = useState<string>('');
  const [showDiscardedModal, setShowDiscardedModal] = useState(false);

  // 🔎 Helpers de CNAE, origem e localização
  // ✅ USAR resolveCompanyCNAE em vez de extractCompanyCNAE para garantir formato correto
  const extractCompanyCNAE = (company: any): string | null => {
    // ✅ USAR resolveCompanyCNAE que já faz toda a resolução correta
    const cnaeResolution = resolveCompanyCNAE(company);
    const cnaeCode = cnaeResolution.principal.code;
    if (!cnaeCode) return null;
    return String(cnaeCode).trim();
  };

  const getCNAEClassificationForCompany = (company: any): CNAEClassification | null => {
    const cnae = extractCompanyCNAE(company);
    if (!cnae) return null;
    const normalized = cnae.replace(/\./g, '').trim();
    return (
      cnaeClassifications[cnae] ||
      cnaeClassifications[normalized] ||
      null
    );
  };

  const getCompanyUF = (company: any): string | null => {
    const rawData = (company as any).raw_data || {};
    const uf =
      (company as any).uf ||
      rawData.receita_federal?.uf ||
      rawData.receita?.uf ||
      rawData.uf ||
      null;
    return uf ? String(uf).toUpperCase().trim() : null;
  };

  const getCompanyCity = (company: any): string | null => {
    const rawData = (company as any).raw_data || {};
    const cidade =
      rawData.receita_federal?.municipio ||
      rawData.receita?.municipio ||
      rawData.municipio ||
      rawData.cidade ||
      null;
    return cidade ? String(cidade).trim() : null;
  };

  const getCompanyOrigin = (company: any): string => {
    const rawData = (company as any).raw_data || {};
    const rawAnalysis = (company as any).raw_analysis || {};

    const campaign =
      rawAnalysis.source_metadata?.campaign ||
      rawData.source_metadata?.campaign;
    if (campaign && String(campaign).trim() !== '') {
      return normalizeSourceName(String(campaign));
    }

    const directSource =
      company.source_name ||
      rawAnalysis.source_name ||
      rawAnalysis.origem_original ||
      rawData.source_name;
    if (directSource && String(directSource).trim() !== '') {
      return normalizeSourceName(String(directSource));
    }

    const fileName =
      rawAnalysis.source_file_name ||
      rawData.source_file_name;
    if (fileName && String(fileName).trim() !== '') {
      return normalizeSourceName(String(fileName));
    }

    const jobName =
      (rawAnalysis as any).job_name ||
      (rawData as any).job_name;
    if (jobName && String(jobName).trim() !== '') {
      return normalizeSourceName(String(jobName));
    }

    return 'Sem origem';
  };
  
  // ✅ MODAL DE PROGRESSO EM TEMPO REAL
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress[]>([]);
  const [cancelEnrichment, setCancelEnrichment] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // 🆕 EXPANSÃO DE LINHAS

  // 🎯 USAR HOOK DE APPROVED COMPANIES (status='aprovada')
  const { data: companies = [], isLoading, refetch } = useApprovedCompanies({
    temperatura: tempFilter === 'all' ? undefined : (tempFilter as any),
  });

  // 📊 Carregar classificações CNAE para as empresas aprovadas
  useEffect(() => {
    const codes = Array.from(
      new Set(
        companies
          .map(c => extractCompanyCNAE(c))
          .filter((code): code is string => !!code)
      )
    );

    if (codes.length === 0) {
      setCnaeClassifications({});
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        const map = await getCNAEClassifications(codes);
        if (!map || isCancelled) return;

        const result: Record<string, CNAEClassification> = {};
        map.forEach((value, key) => {
          result[key] = value;
        });

        setCnaeClassifications(result);
      } catch (error) {
        console.error('[ApprovedLeads] Erro ao carregar classificações CNAE:', error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [companies]);

  const { mutate: rejectCompany } = useRejectQuarantine();
  const { mutate: deleteBatch, isPending: isDeleting } = useDeleteQuarantineBatch();
  const { mutate: refreshBatch, isPending: isRefreshing } = useRefreshQuarantineBatch();
  const { mutate: reverifyAll, isPending: isReverifying } = useReverifyAllCompanies();
  const { mutate: restoreAllDiscarded, isPending: isRestoring } = useRestoreAllBatchDiscarded();

  const queryClient = useQueryClient();

  // 🚀 NOVA FUNÇÃO: Enviar para Pipeline (em vez de Aprovar)
  // 🚨 MICROCICLO 4: Validação de estados canônicos
  const [isSendingToPipeline, setIsSendingToPipeline] = useState(false);
  
  const handleSendToPipeline = async (analysisIds: string[]) => {
    if (analysisIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }

    // 🚨 MICROCICLO 4: Validar que empresas estão em ACTIVE antes de criar deal
    const { getCanonicalState } = await import('@/lib/utils/stateTransitionValidator');
    const selectedCompanies = companies.filter(c => analysisIds.includes(c.id));
    
    const invalidStates = selectedCompanies.filter((company: any) => {
      // Verificar se company tem canonical_status ou determinar pelo contexto
      const state = company.canonical_status 
        ? company.canonical_status 
        : getCanonicalState(company, 'company');
      return state !== 'ACTIVE';
    });

    if (invalidStates.length > 0) {
      toast.error('Ação não permitida', {
        description: `${invalidStates.length} empresa(s) não estão em ACTIVE (Sales Target). Apenas leads aprovados podem criar deals.`
      });
      return;
    }

    const confirmMessage = `🚀 Enviar ${analysisIds.length} empresas para o Pipeline de Vendas?\n\nIsso criará ${analysisIds.length} deal(s) no estágio "Discovery".`;
    
    if (!confirm(confirmMessage)) {
      toast.info('Envio cancelado');
      return;
    }

    setIsSendingToPipeline(true);

    try {
      // 1. Buscar dados das empresas aprovadas
      const { data: approvedData, error: fetchError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .in('id', analysisIds);

      if (fetchError) throw fetchError;
      if (!approvedData || approvedData.length === 0) throw new Error('Nenhuma empresa encontrada');

      // 2. Validar dados obrigatórios
      const validCompanies = approvedData.filter(q => 
        q.cnpj && 
        q.cnpj.trim() !== '' && 
        q.razao_social && 
        q.razao_social.trim() !== ''
      );

      if (validCompanies.length === 0) {
        throw new Error('Nenhuma empresa com dados válidos (CNPJ e Razão Social obrigatórios)');
      }

      // 3. CRIAR DEALS (transferência para pipeline)
      const { data: { user } } = await supabase.auth.getUser();
      
      // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS ao criar deals
      const dealsToCreate = validCompanies.map(q => {
        const rawData: any = {
          ...(q.raw_data || {}),
          ...(q.raw_analysis || {}),
          // Preservar dados de enriquecimento de website
          website_enrichment: q.website_encontrado ? {
            website_encontrado: q.website_encontrado,
            website_fit_score: q.website_fit_score,
            website_products_match: q.website_products_match,
            linkedin_url: q.linkedin_url,
          } : undefined,
          // Preservar fit_score e grade se existirem
          fit_score: (q.raw_data as any)?.fit_score || (q.raw_analysis as any)?.fit_score,
          grade: (q.raw_data as any)?.grade || (q.raw_analysis as any)?.grade,
          icp_id: (q.raw_data as any)?.icp_id || (q.raw_analysis as any)?.icp_id,
          // Preservar dados de enriquecimento da Receita Federal
          receita_federal: (q.raw_data as any)?.receita_federal || (q.raw_analysis as any)?.receita_federal,
          // Preservar dados de enriquecimento do Apollo
          apollo: (q.raw_data as any)?.apollo || (q.raw_analysis as any)?.apollo,
          // Metadados adicionais
          icp_score: q.icp_score || 0,
          temperatura: q.temperatura || 'cold',
        };

        // ✅ CORRIGIDO: Usar campos corretos do schema sdr_deals
        return {
          title: `Prospecção - ${q.razao_social}`, // ✅ title (não deal_title)
          description: `Empresa aprovada com ICP Score: ${q.icp_score || 0}. Temperatura: ${q.temperatura || 'cold'}. Website: ${q.website_encontrado || 'N/A'}. LinkedIn: ${q.linkedin_url || 'N/A'}.`,
          company_id: q.company_id,
          value: 0, // ✅ value (não deal_value)
          probability: Math.min(Math.round((q.icp_score || 0) / 100 * 50), 50),
          priority: (q.icp_score || 0) >= 75 ? 'high' : 'medium',
          stage: 'discovery', // ✅ stage (não deal_stage)
          assigned_to: user?.id || null, // ✅ assigned_to (UUID, não email)
          source: 'approved_to_pipeline',
          bitrix24_data: rawData, // ✅ bitrix24_data (não raw_data)
          status: 'open', // ✅ status obrigatório
        };
      });

      const { error: insertError } = await supabase
        .from('sdr_deals')
        .insert(dealsToCreate);

      if (insertError) throw insertError;

      // 4. Atualizar status para 'pipeline' (TRANSFERÊNCIA!)
      const validIds = validCompanies.map(q => q.id);
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ 
          status: 'pipeline', // ✅ NOVO STATUS!
          pipeline_sent_at: new Date().toISOString()
        })
        .in('id', validIds);

      if (updateError) throw updateError;

      toast.success(`✅ ${validCompanies.length} empresas enviadas para o Pipeline!`, {
        description: `${validCompanies.length} deals criados no estágio Discovery`,
        action: {
          label: 'Ver Pipeline →',
          onClick: () => navigate('/leads/pipeline')
        },
        duration: 6000
      });

      // Limpar seleção e recarregar
      setSelectedIds([]);
      await refetch();

    } catch (error: any) {
      console.error('Erro ao enviar para pipeline:', error);
      toast.error('Erro ao enviar para pipeline', {
        description: error.message
      });
    } finally {
      setIsSendingToPipeline(false);
    }
  };

  const sanitizeDomain = (value?: string | null): string | null => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v || /\s/.test(v)) return null;
    try {
      const url = v.startsWith('http') ? new URL(v) : new URL(`https://${v}`);
      const host = url.hostname.replace(/^www\./, '');
      const domainRegex = /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i;
      return domainRegex.test(host) ? host : null;
    } catch {
      const cleaned = v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const domainRegex = /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i;
      return domainRegex.test(cleaned) ? cleaned : null;
    }
  };

  const saveWebsite = async (analysisId: string, value: string) => {
    const sanitized = sanitizeDomain(value);
    if (!sanitized) {
      toast.error('Website inválido', { description: 'Informe um domínio válido, ex: empresa.com.br' });
      return;
    }
    const { error } = await supabase
      .from('icp_analysis_results')
      .update({ website: sanitized })
      .eq('id', analysisId);
    if (error) {
      toast.error('Erro ao salvar website', { description: error.message });
      return;
    }
    toast.success('Website atualizado');
    setEditingWebsiteId(null);
    setWebsiteInput('');
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
  };

  // ✅ NOVA VERSÃO: Mutations para enriquecimento DIRETO (sem Edge Functions)
  const enrichReceitaMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis?.cnpj) throw new Error('CNPJ não disponível');

      // ✅ CHAMAR API DIRETAMENTE (sem Edge Function)
      const result = await consultarReceitaFederal(analysis.cnpj);

      if (!result.success) throw new Error(result.error || 'Erro ao consultar Receita Federal');

      // Atualizar dados na quarentena
      const rawData = (analysis.raw_data && typeof analysis.raw_data === 'object' && !Array.isArray(analysis.raw_data)) 
        ? analysis.raw_data as Record<string, any>
        : {};

      // ✅ CRÍTICO: PRESERVAR CÓDIGO CNAE FORMATADO E DESCRIÇÃO JUNTOS
      // 1. Preservar código formatado existente (ex: "28.33-0/00") se já existir
      // 2. Se não existir, usar código da Receita Federal
      // 3. SEMPRE preservar/atualizar a descrição em raw_analysis.cnae_descricao
      const existingCnae = analysis.cnae_principal;
      const receitaCnaeCode = result.data?.atividade_principal?.[0]?.code;
      const receitaCnaeDescription = result.data?.atividade_principal?.[0]?.text;
      
      // Preservar código formatado existente (com pontos), senão formatar código da Receita
      let finalCnaePrincipal = existingCnae;
      if (!finalCnaePrincipal || !finalCnaePrincipal.includes('.')) {
        // Se não tem código formatado, usar código da Receita e formatar se necessário
        if (receitaCnaeCode) {
          // Se código da Receita já está formatado, usar direto
          if (receitaCnaeCode.includes('.')) {
            finalCnaePrincipal = receitaCnaeCode;
          } else {
            // Formatar código numérico para formato IBGE: "2833000" -> "28.33-0/00"
            const cleanCode = receitaCnaeCode.replace(/[^0-9]/g, '');
            if (cleanCode.length === 7) {
              finalCnaePrincipal = `${cleanCode.substring(0, 2)}.${cleanCode.substring(2, 4)}-${cleanCode.substring(4, 5)}/${cleanCode.substring(5, 7)}`;
            } else {
              finalCnaePrincipal = receitaCnaeCode;
            }
          }
        }
      }
      
      // Atualizar raw_analysis preservando descrição existente OU usando nova da Receita
      const existingRawAnalysis = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis))
        ? analysis.raw_analysis as Record<string, any>
        : {};
      
      // ✅ PRESERVAR descrição existente OU usar nova da Receita Federal
      const finalCnaeDescription = receitaCnaeDescription || existingRawAnalysis.cnae_descricao || null;
      
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          uf: result.data?.uf || analysis.uf,
          municipio: result.data?.municipio || analysis.municipio,
          porte: result.data?.porte || analysis.porte,
          cnae_principal: finalCnaePrincipal, // ✅ CÓDIGO FORMATADO PRESERVADO
          raw_data: {
            ...rawData,
            receita_federal: result.data,
            receita_source: result.source,
          },
          raw_analysis: {
            ...existingRawAnalysis,
            cnae_descricao: finalCnaeDescription, // ✅ DESCRIÇÃO PRESERVADA/ATUALIZADA
            enriched_receita_at: new Date().toISOString(),
          },
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Função calculate_icp_score_quarantine não existe - score será calculado manualmente se necessário
      console.log('[Receita] ✅ Dados salvos, score será atualizado na próxima análise');

      // Se tem company_id, atualizar cnpj_status baseado na situação
      if (analysis.company_id && result.data?.situacao) {
        const cnpjStatus = result.data.situacao.toLowerCase().includes('ativa') 
          ? 'ativa' 
          : result.data.situacao.toLowerCase().includes('inapta') 
          ? 'inativo' 
          : 'pendente';

        await supabase
          .from('companies')
          .update({ cnpj_status: cnpjStatus })
          .eq('id', analysis.company_id);
      }

      return result;
    },
    onSuccess: () => {
      toast.success('✅ Receita Federal atualizada!', {
        description: 'Campos UF, Município e Porte atualizados via BrasilAPI'
      });
      // Forçar atualização IMEDIATA dos dados
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      refetch(); // Refetch manual para atualizar cards
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Receita Federal', {
        description: error.message,
      });
    },
  });

  // ⚡ NOVO: ANÁLISE COMPLETA 360° - TUDO EM 1 CLIQUE!
  const enrichCompletoMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const results = {
        receita: null as any,
        apollo: null as any,
        enrich360: null as any,
        errors: [] as string[],
      };

      // 1️⃣ RECEITA FEDERAL
      toast.loading('⚡ 1/3: Consultando Receita Federal...', { id: 'completo' });
      try {
        await enrichReceitaMutation.mutateAsync(analysisId);
        results.receita = 'success';
      } catch (error: any) {
        results.errors.push(`Receita: ${error.message}`);
        console.error('[COMPLETO] Receita falhou:', error);
      }

      // Delay entre chamadas
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2️⃣ APOLLO DECISORES (SKIP - CORS bloqueado)
      toast.loading('⚡ 2/3: Apollo (indisponível - CORS)...', { id: 'completo' });
      results.errors.push('Apollo: Requer Edge Function (CORS)');
      console.warn('[COMPLETO] Apollo pulado (CORS bloqueado no frontend)');
      
      // Delay antes do próximo
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3️⃣ INTELLIGENCE 360°
      toast.loading('⚡ 3/3: Executando Intelligence 360°...', { id: 'completo' });
      try {
        await enrich360Mutation.mutateAsync(analysisId);
        results.enrich360 = 'success';
      } catch (error: any) {
        results.errors.push(`360°: ${error.message}`);
        console.error('[COMPLETO] 360° falhou:', error);
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = [results.receita, results.apollo, results.enrich360].filter(r => r === 'success').length;
      
      toast.dismiss('completo');
      
      if (successCount === 2) {
        // Sucesso parcial (Receita + 360°)
        toast.success('✅ Análise Completa 2/3 concluída!', {
          description: '✅ Receita (BrasilAPI) | ✅ Scores 360° | ⚠️ Apollo (CORS)',
          duration: 5000,
        });
      } else if (successCount > 0) {
        toast.warning(`⚠️ Análise parcial (${successCount}/3)`, {
          description: 'Alguns enriquecimentos falharam - veja logs',
          duration: 7000,
        });
      } else {
        toast.error('❌ Análise falhou', {
          description: 'Todos enriquecimentos falharam - veja console',
          duration: 10000,
        });
      }
      
      // Forçar atualização IMEDIATA e AGRESSIVA
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      setTimeout(() => refetch(), 500); // Refetch com delay para garantir
    },
    onError: (error: any) => {
      toast.dismiss('completo');
      toast.error('Erro na Análise Completa', {
        description: error.message,
      });
    },
  });

  const enrichApolloMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');

      // 🔍 Buscar company_id
      let targetCompanyId = analysis.company_id;
      
      if (!targetCompanyId) {
        const { data: lead } = await supabase
          .from('leads_pool')
          .select('company_id')
          .eq('cnpj', analysis.cnpj)
          .single();
        
        targetCompanyId = lead?.company_id;
      }

      if (!targetCompanyId) {
        throw new Error('company_id não encontrado');
      }

      // 🔥 EDGE FUNCTION Apollo com FILTROS INTELIGENTES
      const { error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: targetCompanyId,
          company_name: analysis.company_name || analysis.name,
          domain: analysis.website || analysis.domain,
          modes: ['people', 'company'],
          city: analysis.city || analysis.municipio,
          state: analysis.state || analysis.uf,
          industry: analysis.industry || analysis.setor,
          cep: analysis.cep || (analysis.raw_data as any)?.receita_federal?.cep,
          fantasia: analysis.fantasia || (analysis.raw_data as any)?.receita_federal?.fantasia
        }
      });
      
      if (error) throw error;
      
      console.log('[QUARANTINE] ✅ Apollo enrichment concluído');
    },
    onSuccess: () => {
      toast.success('✅ Apollo atualizado - Website e decisores adicionados');
      // ✅ INVALIDAR TODAS AS QUERIES RELEVANTES
      queryClient.invalidateQueries({ queryKey: ['approved-companies'] });
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Apollo', {
        description: error.message,
      });
    },
  });

  // ECONODATA: Desabilitado temporariamente - será usado na fase 2
  // Mantendo estrutura intacta para uso futuro
  /* const enrichEconodataMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis?.cnpj) throw new Error('CNPJ não disponível');

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Enviar apenas CNPJ
      const { data, error } = await supabase.functions.invoke('enrich-econodata', {
        body: { cnpj: analysis.cnpj },
      });

      if (error) throw error;

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_analysis: {
            ...rawData,
            econodata: data,
          },
        })
        .eq('id', analysisId);

      return data;
    },
    onSuccess: () => {
      toast.success('Dados da Econodata atualizados');
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao enriquecer com Econodata', {
        description: error.message,
      });
    },
  }); */

  // FASE 3: Verificação de Uso Mutation
  const enrichVerificationMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');
      if (!analysis.uf) throw new Error('UF não disponível. Execute enriquecimento Receita Federal primeiro.');

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Executar apenas Verificação de Uso (unificado)
      const simpleDomain = sanitizeDomain(rawData.domain || analysis.website || null);
      const { data, error } = await supabase.functions.invoke('usage-verification', {
        body: {
          company_id: analysis.company_id || analysis.id,
          company_name: analysis.razao_social,
          cnpj: analysis.cnpj,
          domain: simpleDomain || undefined
        },
      });

      if (error) throw error;

      // Atualizar campos na quarentena
      await supabase
        .from('icp_analysis_results')
        .update({
          is_cliente_totvs: data?.status === 'no-go',
          totvs_check_date: new Date().toISOString(),
          totvs_evidences: (data?.evidences_by_category ? Object.values(data.evidences_by_category).flat() : []) as any,
          raw_analysis: {
            ...rawData,
            simple_totvs_check: data,
          },
        })
        .eq('id', analysisId);

      // Recalcular score após verificação
      await supabase.rpc('calculate_icp_score_quarantine', {
        p_analysis_id: analysisId
      });

      return data;
    },
    onSuccess: (data) => {
      const status = data?.found ? '⚠️ Cliente identificado' : '✅ Não é cliente identificado';
      toast.success(`Verificação concluída - ${status}`);
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro na verificação', {
        description: error.message,
      });
    },
  });

  const enrich360Mutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');

      const rawData = (analysis.raw_data && typeof analysis.raw_data === 'object' && !Array.isArray(analysis.raw_data)) 
        ? analysis.raw_data as Record<string, any>
        : {};

      // ✅ ENRIQUECIMENTO SIMPLIFICADO (sem Edge Function)
      toast.loading('Calculando scores 360°...', { id: '360-progress' });

      const result = await enrichment360Simplificado({
        razao_social: analysis.razao_social,
        website: analysis.website,
        domain: analysis.domain,
        uf: analysis.uf,
        porte: analysis.porte,
        cnae: analysis.cnae_principal,
        raw_data: rawData,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao calcular 360°');

      // Salvar scores
      toast.loading('Salvando scores...', { id: '360-progress' });

      await supabase
        .from('icp_analysis_results')
        .update({
          raw_data: {
            ...rawData,
            enrichment_360: {
              scores: result.scores,
              analysis: result.analysis,
              calculated_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', analysisId);

      // Scores já foram salvos no raw_data, não precisa recalcular
      console.log('[360°] ✅ Scores salvos em raw_data.enrichment_360');

      toast.dismiss('360-progress');

      return result;
    },
    onSuccess: () => {
      toast.success('✅ Enriquecimento 360° concluído!', {
        description: 'Scores calculados: Presença Digital, Maturidade e Saúde'
      });
      // Forçar atualização IMEDIATA dos dados
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      refetch(); // Refetch manual para atualizar cards
    },
    onError: (error: any) => {
      toast.dismiss('360-progress');
      toast.error('Erro no enriquecimento 360°', {
        description: error.message,
      });
    },
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredCompanies = companies
    .filter(c => {
      // 🔍 BUSCA GERAL: nome e CNPJ (PRESERVADA)
      if (searchQuery) {
        const matchesSearch = c.razao_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.cnpj?.includes(searchQuery);
        
        if (!matchesSearch) return false;
      }
      
      // 🔍 FILTRO POR STATUS
      if (statusFilter !== 'all') {
        const companyStatus = c.status || 'pendente';
        if (statusFilter !== companyStatus) return false;
      }
      
      // 🔍 FILTROS INTELIGENTES POR COLUNA
      
      // Filtro por Origem (normalizado)
      if (filterOrigin.length > 0) {
        const normalizedOrigin = getCompanyOriginString(c);
        if (!filterOrigin.includes(normalizedOrigin)) {
          return false;
        }
      }
      
      // Filtro por Status CNPJ
      if (filterCNPJStatus.length > 0) {
        const rawData = (c as any).raw_data?.receita_federal || (c as any).raw_data || {};
        let status = 'PENDENTE';
        
        if (rawData.situacao || rawData.status) {
          status = rawData.situacao || rawData.status;
          
          if (status.toUpperCase().includes('ATIVA') || status === '02') {
            status = 'ATIVA';
          } else if (status.toUpperCase().includes('SUSPENSA') || status === '03') {
            status = 'SUSPENSA';
          } else if (status.toUpperCase().includes('INAPTA') || status === '04') {
            status = 'INAPTA';
          } else if (status.toUpperCase().includes('BAIXADA') || status === '08') {
            status = 'BAIXADA';
          } else if (status.toUpperCase().includes('NULA') || status === '01') {
            status = 'NULA';
          }
        }
        
        if (!filterCNPJStatus.includes(status)) return false;
      }
      
      // Filtro por Setor
      if (filterSector.length > 0) {
        const classification = getCNAEClassificationForCompany(c);
        const sector = classification?.setor_industria || 'Sem setor';
        if (!filterSector.includes(sector)) return false;
      }
      
      // Filtro por UF (apenas empresas COM UF válido)
      if (filterUF.length > 0) {
        const uf = getCompanyUF(c) || '';
        // ❌ Se UF está vazio/N/A, não incluir quando há filtro ativo
        if (!uf || uf === 'N/A' || uf === '') return false;
        if (!filterUF.includes(uf)) return false;
      }

      // Filtro por Cidade (dependente de UF)
      if (filterCity.length > 0) {
        const city = getCompanyCity(c);
        if (!city || !filterCity.includes(city)) return false;
      }
      
      // Filtro por Status Análise
      if (filterAnalysisStatus.length > 0) {
        const rawData = (c as any).raw_data || {};
        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj);
        const hasDecisionMakers = ((c as any).decision_makers_count || 0) > 0;
        const hasDigitalPresence = !!(rawData.digital_intelligence);
        const hasLegalData = !!(rawData.totvs_report);
        
        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
        
        let statusLabel = '0-25%';
        if (percentage > 75) statusLabel = '76-100%';
        else if (percentage > 50) statusLabel = '51-75%';
        else if (percentage > 25) statusLabel = '26-50%';
        
        if (!filterAnalysisStatus.includes(statusLabel)) return false;
      }
      
      // 🆕 FILTRO STATUS VERIFICAÇÃO
      if (filterVerificationStatus.length > 0) {
        const verificationStatus = c.totvs_status || 'nao-verificado';
        // Mapear para label legível
        let verificationLabel = 'Não Verificado';
        if (verificationStatus === 'go') verificationLabel = 'GO - Não é Cliente';
        if (verificationStatus === 'no-go') verificationLabel = 'NO-GO - É Cliente';
        
        if (!filterVerificationStatus.includes(verificationLabel)) return false;
      }
      
      // ✅ Filtro por ICP
      if (filterICP.length > 0) {
        const rawData = (c as any).raw_data || {};
        const icpName = rawData.best_icp_name || rawData.icp_name || 'Sem ICP';
        if (!filterICP.includes(icpName)) return false;
      }
      
      // ✅ Filtro por Fit Score
      if (filterFitScore.length > 0) {
        const rawData = (c as any).raw_data || {};
        const fitScore = rawData.fit_score ?? (c as any).fit_score ?? c.icp_score ?? 0;
        let scoreRange = '0-39';
        if (fitScore >= 90) scoreRange = '90-100';
        else if (fitScore >= 75) scoreRange = '75-89';
        else if (fitScore >= 60) scoreRange = '60-74';
        else if (fitScore >= 40) scoreRange = '40-59';
        if (!filterFitScore.includes(scoreRange)) return false;
      }
      
      // ✅ Filtro por Grade
      if (filterGrade.length > 0) {
        const rawData = (c as any).raw_data || {};
        const grade = rawData.grade || (c as any).grade || null;
        if (!grade || grade === '-' || grade === 'null') {
          if (!filterGrade.includes('Sem Grade')) return false;
        } else {
          if (!filterGrade.includes(grade)) return false;
        }
      }

      // ✅ Filtro por CNAE (código)
      if (filterCNAE.length > 0) {
        const cnaeRes = resolveCompanyCNAE(c);
        const cnaeCode = cnaeRes.principal.code || 'Sem CNAE';
        if (!filterCNAE.includes(cnaeCode)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      
      let aVal: any = '';
      let bVal: any = '';
      
      const aRaw = (a.raw_analysis && typeof a.raw_analysis === 'object' && !Array.isArray(a.raw_analysis)) 
        ? a.raw_analysis as Record<string, any>
        : {};
      const bRaw = (b.raw_analysis && typeof b.raw_analysis === 'object' && !Array.isArray(b.raw_analysis)) 
        ? b.raw_analysis as Record<string, any>
        : {};
      
      switch (sortColumn) {
        case 'empresa':
          aVal = a.razao_social || '';
          bVal = b.razao_social || '';
          break;
        case 'cnpj':
          aVal = a.cnpj || '';
          bVal = b.cnpj || '';
          break;
        case 'cnpj_status':
          aVal = (a as any).cnpj_status || '';
          bVal = (b as any).cnpj_status || '';
          break;
        case 'setor':
          aVal = a.setor || '';
          bVal = b.setor || '';
          break;
        case 'uf':
          aVal = a.uf || '';
          bVal = b.uf || '';
          break;
        case 'score':
          aVal = a.icp_score || 0;
          bVal = b.icp_score || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

  // 🔄 SINCRONIZAR: Desmarcar empresas que não estão mais visíveis após filtro
  useEffect(() => {
    const visibleIds = filteredCompanies.map(c => c.id);
    const currentSelected = selectedIds.filter(id => visibleIds.includes(id));
    
    if (currentSelected.length !== selectedIds.length) {
      setSelectedIds(currentSelected);
    }
  }, [filteredCompanies, selectedIds]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCompanies.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (analysisId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, analysisId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== analysisId));
    }
  };

  const handleSendToPipelineBatch = () => {
    handleSendToPipeline(selectedIds);
  };

  // ❌ REMOVIDO: handleApproveBatch (já estão aprovadas!)
  const handleApproveBatch_OBSOLETO = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    // approveBatch(selectedIds, {
    //   onSuccess: () => setSelectedIds([]),
    // });
  };

  const handleAutoApprove = () => {
    autoApprove({
      minScore: 70,
      temperatura: 'hot',
      autoCreateDeals: true,
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar ${selectedIds.length} empresa(s)? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    deleteBatch(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }

    const selectedCompanies = filteredCompanies.filter(c => selectedIds.includes(c.id));
    
    const csvData = selectedCompanies.map(c => ({
      'Empresa': c.razao_social,
      'CNPJ': c.cnpj,
      'Score ICP': c.icp_score,
      'Temperatura': c.temperatura,
      'Status': c.status,
      'Motivo Qualificação': (c as any).motivo_qualificacao || '',
      'Motivo Descarte': (c as any).motivo_descarte || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quarentena-icp-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${selectedIds.length} empresa(s) exportada(s)`);
  };

  const handlePreviewSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    setPreviewCompany(null);
    setPreviewOpen(true);
  };

  const handleRefreshSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    const items = filteredCompanies
      .filter(c => selectedIds.includes(c.id))
      .map(c => ({ id: c.id, razao_social: c.razao_social, cnpj: c.cnpj }));
    refreshBatch(items);
  };

  const handlePreviewSingle = (company: any) => {
    setPreviewCompany(company);
    setPreviewOpen(true);
  };

  const handleSendToPipelineSingle = (id: string) => {
    handleSendToPipeline([id]);
  };

  const handleRejectSingle = (id: string, motivo: string) => {
    const company = filteredCompanies.find(c => c.id === id);
    if (!company) return;
    
    setRejectCompanyData({ id, name: company.razao_social || 'Empresa' });
    setRejectReason('');
    setRejectCustomReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (!rejectCompanyData) return;
    
    const finalReason = rejectReason === 'outro' 
      ? rejectCustomReason.trim() 
      : rejectReason;
    
    if (!finalReason) {
      toast.error('Por favor, selecione ou digite um motivo de descarte');
      return;
    }
    
    rejectCompany({ 
      analysisId: rejectCompanyData.id, 
      motivo: finalReason 
    });
    
    setRejectModalOpen(false);
    setRejectCompanyData(null);
    setRejectReason('');
    setRejectCustomReason('');
  };

  const handleDeleteSingle = (id: string) => {
    deleteBatch([id]);
  };

  const handleRefreshSingle = (id: string) => {
    const company = filteredCompanies.find(c => c.id === id);
    if (!company) return;
    refreshBatch([{ id, razao_social: company.razao_social, cnpj: company.cnpj }]);
  };

  // ✅ NOVA FUNÇÃO: Enriquecer Website + Fit Score
  const handleEnrichWebsite = async (analysisId: string) => {
    const company = filteredCompanies.find(c => c.id === analysisId);
    if (!company || !tenantId) return;

    try {
      toast.info('🌐 Buscando e escaneando website da empresa...');

      const supabaseUrl = (supabase as any).supabaseUrl || (window as any).__SUPABASE_URL__;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      // 1. Buscar website oficial
      const findWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/find-prospect-website`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razao_social: company.razao_social,
          cnpj: company.cnpj,
          tenant_id: tenantId,
        }),
      });

      if (!findWebsiteResponse.ok) {
        throw new Error('Erro ao buscar website');
      }

      const websiteData = await findWebsiteResponse.json();
      if (!websiteData.success || !websiteData.website) {
        toast.error('⚠️ Website não encontrado');
        return;
      }

      // 2. Escanear website e calcular fit score
      // ✅ CORRIGIDO: Usar supabase.functions.invoke() em vez de fetch() para evitar CORS
      const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-prospect-website', {
        body: {
          tenant_id: tenantId,
          company_id: company.company_id,
          cnpj: company.cnpj,
          website_url: websiteData.website,
          razao_social: company.razao_social,
        }
      });

      if (scanError) {
        throw new Error(scanError.message || 'Erro ao escanear website');
      }

      if (!scanData || !scanData.success) {
        throw new Error(scanData?.error || 'Erro ao escanear website');
      }
      
      // 3. Atualizar icp_analysis_results
      if (scanData.success) {
        await supabase
          .from('icp_analysis_results')
          .update({
            website_encontrado: websiteData.website,
            website_fit_score: scanData.website_fit_score || 0,
            website_products_match: scanData.website_products_match || [],
            linkedin_url: scanData.linkedin_url || null,
          })
          .eq('id', analysisId);

        toast.success('✅ Website enriquecido com sucesso!');
        refetch();
      }
    } catch (error: any) {
      console.error('[Enriquecimento Website] Erro:', error);
      toast.error('Erro ao enriquecer website', { description: error.message });
    }
  };

  // ✅ NOVA FUNÇÃO: Calcular Purchase Intent Score
  const handleCalculatePurchaseIntent = async (analysisId: string) => {
    const company = filteredCompanies.find(c => c.id === analysisId);
    if (!company || !tenantId) return;

    try {
      toast.info('🎯 Calculando Purchase Intent Avançado...');

      // Buscar prospect_id (pode estar em qualified_prospect_id ou company_id)
      let prospectId = (company as any).qualified_prospect_id || company.id;
      
      // Se não tem prospect_id direto, buscar em qualified_prospects pelo CNPJ
      if (!prospectId && company.cnpj) {
        const { data: prospect } = await supabase
          .from('qualified_prospects')
          .select('id')
          .eq('cnpj', company.cnpj)
          .eq('tenant_id', tenantId)
          .single();
        
        if (prospect) {
          prospectId = prospect.id;
        }
      }

      if (!prospectId) {
        throw new Error('Prospect não encontrado. A empresa precisa estar no estoque qualificado.');
      }

      // Buscar ICP ID se disponível
      const icpId = (company as any).icp_id || (company as any).icp?.id || null;

      // Chamar Edge Function de análise avançada
      const { data, error } = await supabase.functions.invoke(
        'calculate-enhanced-purchase-intent',
        {
          body: {
            tenant_id: tenantId,
            prospect_id: prospectId,
            icp_id: icpId
          }
        }
      );

      if (error) throw error;

      const response = data as any;
      if (!response.success) {
        throw new Error(response.error || 'Erro ao calcular Purchase Intent avançado');
      }

      // Atualizar icp_analysis_results com score e análise
      await supabase
        .from('icp_analysis_results')
        .update({ 
          purchase_intent_score: response.analysis?.overall_fit_score || 0,
          purchase_intent_analysis: response.analysis,
          purchase_intent_calculated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      toast.success('✅ Purchase Intent Avançado calculado com sucesso!', {
        description: `Score: ${response.analysis?.overall_fit_score || 0}/100 - Grade: ${response.analysis?.recommended_grade || 'N/A'}`
      });
      
      refetch();
    } catch (error: any) {
      console.error('[Purchase Intent Avançado] Erro:', error);
      toast.error('Erro ao calcular Purchase Intent avançado', { description: error.message });
    }
  };

  // Handlers para enriquecimento
  const handleEnrichReceita = async (id: string) => {
    return enrichReceitaMutation.mutateAsync(id);
  };

  const handleEnrichApollo = async (id: string) => {
    return enrichApolloMutation.mutateAsync(id);
  };

  const handleEnrichVerification = async (id: string) => {
    return enrichVerificationMutation.mutateAsync(id);
  };

  // ECONODATA: Desabilitado - fase 2
  /* const handleEnrichEconodata = async (id: string) => {
    return enrichEconodataMutation.mutateAsync(id);
  }; */

  const handleEnrich360 = async (id: string) => {
    return enrich360Mutation.mutateAsync(id);
  };

  // ⚡ NOVO: Handler para Análise Completa (3 em 1)
  const handleEnrichCompleto = async (id: string) => {
    return enrichCompletoMutation.mutateAsync(id);
  };

  const discoverCNPJMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!analysis) throw new Error('Empresa não encontrada');
      if (analysis.cnpj) throw new Error('CNPJ já cadastrado');

      const rawData = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis)) 
        ? analysis.raw_analysis as Record<string, any>
        : {};

      // Chamar edge function de descoberta de CNPJ
      const { data, error } = await supabase.functions.invoke('discover-cnpj', {
        body: { 
          company_name: analysis.razao_social,
          domain: rawData.domain || analysis.website,
        },
      });

      if (error) throw error;
      if (!data?.cnpj) throw new Error('CNPJ não encontrado');

      // Atualizar com CNPJ descoberto
      await supabase
        .from('icp_analysis_results')
        .update({
          cnpj: data.cnpj,
          raw_analysis: {
            ...rawData,
            cnpj_discovery: data,
          },
        })
        .eq('id', analysisId);

      return data;
    },
    onSuccess: (data) => {
      toast.success(`✅ CNPJ descoberto: ${data.cnpj}`);
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao descobrir CNPJ', {
        description: error.message,
      });
    },
  });

  const handleDiscoverCNPJ = async (id: string) => {
    return discoverCNPJMutation.mutateAsync(id);
  };

  // Handlers de bulk enrichment
  const handleBulkEnrichReceita = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    toast.loading(`Enriquecendo ${selectedIds.length} empresa(s) com Receita Federal...`, { id: 'bulk-receita' });
    
    let success = 0;
    let errors = 0;
    
    for (const id of selectedIds) {
      try {
        await enrichReceitaMutation.mutateAsync(id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${id}:`, error);
      }
    }
    
    toast.dismiss('bulk-receita');
    if (errors === 0) {
      toast.success(`✅ ${success} empresa(s) enriquecida(s) com sucesso!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
  };

  const handleBulkEnrichApollo = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    setCancelEnrichment(false);
    
    const selectedCompanies = companies.filter(c => selectedIds.includes(c.id));
    
    // ✅ INICIALIZAR MODAL DE PROGRESSO
    const initialProgress: EnrichmentProgress[] = selectedCompanies.map(c => ({
      companyId: c.id,
      companyName: c.razao_social,
      status: 'pending',
    }));
    
    setEnrichmentProgress(initialProgress);
    setEnrichmentModalOpen(true);
    
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < selectedCompanies.length; i++) {
      // ✅ VERIFICAR CANCELAMENTO
      if (cancelEnrichment) {
        toast.info('❌ Processo cancelado pelo usuário');
        break;
      }
      
      const company = selectedCompanies[i];
      
      try {
        // ✅ ATUALIZAR STATUS: PROCESSANDO
        setEnrichmentProgress(prev => prev.map(p => 
          p.companyId === company.id 
            ? { ...p, status: 'processing', message: 'Buscando decisores no Apollo...' }
            : p
        ));
        
        await enrichApolloMutation.mutateAsync(company.id);
        
        // ✅ ATUALIZAR STATUS: SUCESSO
        setEnrichmentProgress(prev => prev.map(p => 
          p.companyId === company.id 
            ? { ...p, status: 'success', message: 'Decisores identificados!' }
            : p
        ));
        
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${company.razao_social}:`, error);
        
        // ✅ ATUALIZAR STATUS: ERRO
        setEnrichmentProgress(prev => prev.map(p => 
          p.companyId === company.id 
            ? { ...p, status: 'error', message: 'Falha ao buscar decisores' }
            : p
        ));
      }
      
      // Delay entre empresas (evitar rate limit)
      if (i < selectedCompanies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    toast.success(`✅ Enriquecimento concluído!`, {
      description: `${success} sucesso, ${errors} erro(s)`
    });
    
    // ✅ FORÇAR ATUALIZAÇÃO DOS DADOS
    queryClient.invalidateQueries({ queryKey: ['approved-companies'] });
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
    refetch(); // Refetch manual para atualizar cards
  };

  // ✅ NOVO: Enriquecer Website & LinkedIn em massa
  const handleBulkEnrichWebsite = async () => {
    if (selectedIds.length === 0) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }

    const companiesToEnrich = filteredCompanies.filter(c => selectedIds.includes(c.id));
    if (companiesToEnrich.length === 0) {
      toast.error('Nenhuma empresa válida para enriquecer');
      return;
    }

    toast.info(`🌐 Enriquecendo ${companiesToEnrich.length} empresa(s)...`);
    
    let enrichedCount = 0;
    const errors: string[] = [];

    for (const company of companiesToEnrich) {
      try {
        await handleEnrichWebsite(company.id);
        enrichedCount++;
      } catch (error: any) {
        console.error(`[Bulk Enrich Website] Erro ao enriquecer ${company.razao_social}:`, error);
        errors.push(`${company.razao_social}: ${error.message || 'Erro desconhecido'}`);
      }
    }

    if (enrichedCount > 0) {
      toast.success(`✅ ${enrichedCount} empresa(s) enriquecida(s) com sucesso!`);
    }
    if (errors.length > 0) {
      toast.error(`⚠️ ${errors.length} erro(s) ao enriquecer`, {
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
        duration: 8000
      });
    }

    refetch();
  };

  const handleBulkEnrich360 = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    toast.loading(`Enriquecimento 360° em ${selectedIds.length} empresa(s)...`, { id: 'bulk-360' });
    
    let success = 0;
    let errors = 0;
    
    for (const id of selectedIds) {
      try {
        await enrich360Mutation.mutateAsync(id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao enriquecer ${id}:`, error);
      }
    }
    
    toast.dismiss('bulk-360');
    if (errors === 0) {
      toast.success(`✅ ${success} empresa(s) enriquecidas 360°!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
  };

  const handleBulkVerification = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    const selectedCompanies = companies.filter(c => selectedIds.includes(c.id));
    
    const confirmacao = window.confirm(
      `🎯 PROCESSAMENTO EM LOTE\n\n` +
      `Empresas selecionadas: ${selectedIds.length}\n\n` +
      `O que será processado:\n` +
      `✅ Verificação de Uso (GO/NO-GO)\n` +
      `✅ Decisores (se GO)\n` +
      `✅ Digital (se GO)\n` +
      `✅ Relatório completo salvo automaticamente\n\n` +
      `Custo estimado:\n` +
      `- Créditos: ~${selectedIds.length * 150}\n` +
      `- Valor: ~R$ ${selectedIds.length}\n` +
      `- Tempo: ~${Math.round(selectedIds.length * 35 / 60)} minutos\n\n` +
      `Continuar?`
    );
    
    if (!confirmacao) return;
    
    toast.loading(`🔄 Processando empresa 0/${selectedIds.length}...`, { 
      id: 'bulk-verification',
      duration: Infinity,
    });
    
    let noGo = 0;
    let go = 0;
    let errors = 0;
    
    for (let i = 0; i < selectedCompanies.length; i++) {
      const company = selectedCompanies[i];
      
      try {
        toast.loading(
          `🔄 ${i + 1}/${selectedIds.length}: ${company.razao_social}`, 
          { id: 'bulk-verification' }
        );
        
        console.log(`[BATCH] 📊 Processando ${i + 1}/${selectedIds.length}: ${company.razao_social}`);
        
        // 1. Verificação de Uso
        const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('usage-verification', {
          body: {
            company_name: company.razao_social,
            cnpj: company.cnpj,
            domain: company.domain || company.website,
            company_id: company.company_id || company.id,
          },
        });
        
        if (verificationError) throw verificationError;
        
        const isNoGo = verificationResult?.status === 'no-go';
        const isGo = verificationResult?.status === 'go';
        
        // 2. Decisores (SEMPRE - GO ou NO-GO)
        // Custo baixo e pode ser útil no futuro mesmo se NO-GO
        let decisors = null;
        try {
          const receitaData = company.raw_data?.receita_federal || {};
          
          const { data: decisorsData } = await supabase.functions.invoke('enrich-apollo-decisores', {
            body: {
              companyName: company.razao_social,
              company_id: company.company_id,
              linkedinUrl: company.linkedin_url || '',
              modes: ['people', 'company'],
              domain: company.website || company.domain,
              city: receitaData?.municipio || company.city || company.municipio,
              state: receitaData?.uf || company.state || company.uf,
              cep: receitaData?.cep || company.raw_data?.cep || company.zip_code,
              fantasia: receitaData?.fantasia || company.raw_data?.fantasia || company.fantasy_name
            },
          });
          decisors = decisorsData;
          console.log(`[BATCH] ✅ Decisores extraídos: ${decisorsData?.decisores?.length || 0}`);
        } catch (err) {
          console.warn(`[BATCH] ⚠️ Decisores falhou (continuando):`, err);
        }
        
        // 3. Digital (SEMPRE - se tem website dos decisores)
        let digital = null;
        if (decisors?.companyData?.website) {
          digital = {
            website: decisors.companyData.website,
            linkedin: decisors.companyData.linkedinUrl,
            discovered_at: new Date().toISOString(),
          };
          console.log(`[BATCH] ✅ Digital descoberto: ${digital.website}`);
        }
        
        // 4. Salvar relatório completo
        const fullReport = {
          detection_report: verificationResult,
          decisors_report: decisors,
          keywords_seo_report: digital,
          __status: {
            detection: { status: 'completed' },
            decisors: { status: decisors ? 'completed' : 'skipped' },
            keywords: { status: digital ? 'completed' : 'skipped' },
          },
          __meta: {
            saved_at: new Date().toISOString(),
            batch_processing: true,
            version: '2.0',
            company: company.razao_social,
          },
        };
        
        console.log(`[BATCH] 💾 Salvando full_report:`, {
          hasDetection: !!verificationResult,
          hasDecisors: !!decisors,
          hasDigital: !!digital,
          evidencesCount: verificationResult?.evidences?.length || 0,
          decisorsCount: decisors?.decisores?.length || 0,
        });
        
        const { data: savedReport, error: saveError} = await supabase
          .from('stc_verification_history')
          .insert({
            company_id: company.company_id || company.id,
            company_name: company.razao_social,
            cnpj: company.cnpj,
            status: verificationResult.status,
            confidence: verificationResult.confidence || 'medium',
            triple_matches: verificationResult.triple_matches || 0,
            double_matches: verificationResult.double_matches || 0,
            single_matches: verificationResult.single_matches || 0,
            total_score: verificationResult.total_weight || 0,
            evidences: verificationResult.evidences || [],
            sources_consulted: verificationResult.methodology?.searched_sources || 0,
            queries_executed: verificationResult.methodology?.total_queries || 0,
            full_report: fullReport,
          })
          .select()
          .single();
        
        if (saveError) {
          console.error(`[BATCH] ❌ Erro ao salvar relatório:`, saveError);
          throw saveError;
        }
        
        console.log(`[BATCH] ✅ Relatório salvo:`, {
          id: savedReport.id,
          hasFullReport: !!savedReport.full_report,
          fullReportKeys: savedReport.full_report ? Object.keys(savedReport.full_report) : [],
        });
        
        // 5. Contabilizar GO/NO-GO (SEM auto-descartar!)
        // ✅ MUDANÇA: Empresas NO-GO ficam na quarentena para revisão manual
        // Usuario decide se descarta ou não (pode haver falsos positivos)
        if (isNoGo) {
          noGo++;
          console.log(`[BATCH] ⚠️ ${company.razao_social}: NO-GO detectado (permanece na quarentena para revisão)`);
        } else {
          go++;
          console.log(`[BATCH] ✅ ${company.razao_social}: GO confirmado`);
        }
        
        console.log(`[BATCH] ✅ ${company.razao_social}: ${verificationResult.status} (${verificationResult.evidences?.length || 0} evidências)`);
        
      } catch (error: any) {
        errors++;
        console.error(`[BATCH] ❌ Erro em ${company.razao_social}:`, error);
      }
      
      // Delay entre empresas (evitar rate limit)
      if (i < selectedCompanies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    toast.dismiss('bulk-verification');
    toast.success(`🎉 Processamento em lote concluído!`, {
      description: `✅ ${go} GO (prospects prontos) | ❌ ${noGo} NO-GO (auto-descartados) | ⚠️ ${errors} erros`,
      duration: 10000,
    });
    
    // Recarregar lista
    queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
  };

  const handleBulkDiscoverCNPJ = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    // Filtrar apenas empresas sem CNPJ
    const companiesWithoutCNPJ = companies.filter(c => 
      selectedIds.includes(c.id) && !c.cnpj
    );
    
    if (companiesWithoutCNPJ.length === 0) {
      toast.info('Todas as empresas selecionadas já possuem CNPJ');
      return;
    }
    
    toast.loading(`Descobrindo CNPJ de ${companiesWithoutCNPJ.length} empresa(s)...`, { id: 'bulk-cnpj' });
    
    let success = 0;
    let errors = 0;
    
    for (const company of companiesWithoutCNPJ) {
      try {
        await discoverCNPJMutation.mutateAsync(company.id);
        success++;
      } catch (error) {
        errors++;
        console.error(`Erro ao descobrir CNPJ de ${company.razao_social}:`, error);
      }
    }
    
    toast.dismiss('bulk-cnpj');
    if (errors === 0) {
      toast.success(`✅ CNPJ descoberto para ${success} empresa(s)!`);
    } else {
      toast.warning(`Concluído: ${success} sucesso, ${errors} erro(s)`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa');
      return;
    }
    
    const confirmed = window.confirm(
      `Tem certeza que deseja aprovar ${selectedIds.length} empresa(s) e criar deals no Pipeline (Discovery)?`
    );
    
    if (!confirmed) return;
    
    approveBatch(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleOpenVerification = (company: any) => {
    if (!company?.id) {
      toast.error('ID da empresa não encontrado');
      return;
    }
    const name = encodeURIComponent(company.razao_social || 'Empresa');
    const cnpj = encodeURIComponent(company.cnpj || '');
    const domain = encodeURIComponent(company.domain || '');
    navigate(`/leads/icp-quarantine/report/${company.id}?name=${name}&cnpj=${cnpj}&domain=${domain}`);
  };

  // 🔢 APLICAR PAGINAÇÃO
  const paginatedCompanies = pageSize === 9999 
    ? filteredCompanies 
    : filteredCompanies.slice(0, pageSize);
  
  // 🐛 DEBUG
  console.log('[APPROVED] Total do banco:', companies.length);
  console.log('[APPROVED] Após filtros:', filteredCompanies.length);
  console.log('[APPROVED] Paginação ativa:', pageSize);
  console.log('[APPROVED] Exibindo:', paginatedCompanies.length);
  
  const selectedCompanies = filteredCompanies.filter(c => selectedIds.includes(c.id));
  const displayCompanies = previewCompany ? [previewCompany] : selectedCompanies;

  // Funções de UI helpers para preview dialog
  const getTempIcon = (temp: string) => {
    switch (temp) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />;
      case 'warm': return <Thermometer className="h-4 w-4 text-orange-500" />;
      case 'cold': return <Snowflake className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getTempBadge = (temp: string) => {
    const variants: Record<string, any> = {
      hot: 'destructive',
      warm: 'default',
      cold: 'secondary',
    };
    return variants[temp] || 'secondary';
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">{/* ✅ COM AppLayout para menu lateral */}
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              Leads Aprovados
            </h1>
            <p className="text-muted-foreground">
              Empresas 100% enriquecidas, prontas para enviar ao Pipeline de Vendas
            </p>
          </div>
        </div>

      {/* Stats Cards - CLICÁVEIS PARA FILTRAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setStatusFilter('pendente')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{companies.filter(c => c.status === 'pendente').length}</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setTempFilter('hot')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500 flex items-center gap-2">
              <Flame className="w-6 h-6" />
              {companies.filter(c => c.temperatura === 'hot').length}
            </div>
            <p className="text-sm text-muted-foreground">Hot Leads</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setStatusFilter('aprovada')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              {companies.filter(c => c.status === 'aprovada').length}
            </div>
            <p className="text-sm text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg hover:scale-105"
          onClick={() => setStatusFilter('descartada')}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              {companies.filter(c => c.status === 'descartada').length}
            </div>
            <p className="text-sm text-muted-foreground">Descartadas</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ BARRA DE AÇÕES WORLD-CLASS - ELEGANTE E PROFISSIONAL */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* LEFT: Info + Contador */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  {paginatedCompanies.length} de {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium">
                    {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: Ações Principais */}
            <div className="flex items-center gap-2">
              {/* UnifiedEnrichButton - Visível quando 1 empresa selecionada */}
              {selectedIds.length === 1 && (() => {
                const selectedCompany = filteredCompanies.find(c => selectedIds.includes(c.id));
                if (!selectedCompany) return null;
                
                const totvsStatus = (selectedCompany as any)?.totvs_status;
                const isGO = totvsStatus === 'go' || totvsStatus === 'GO';
                
                return (
                  <UnifiedEnrichButton
                    onQuickRefresh={async () => {
                      const id = selectedIds[0];
                      await handleEnrichReceita(id);
                    }}
                    onFullEnrich={async () => {
                      const id = selectedIds[0];
                      // ✅ FLUXO CORRETO: Sempre enriquecer Receita primeiro (sem verificar GO/NO-GO)
                      // Depois o usuário vai para Relatório STC → Aba Verificação → Define GO/NO-GO
                      // Só então pode enriquecer Apollo se for GO
                      await handleEnrichReceita(id);
                      toast.info('✅ Receita Federal atualizada! Agora abra o Relatório STC → Aba Verificação para verificar GO/NO-GO. Se GO, você poderá enriquecer Apollo.');
                    }}
                    onReceita={async () => {
                      const id = selectedIds[0];
                      await handleEnrichReceita(id).catch(() => {});
                    }}
                    onApollo={isGO ? async () => {
                      const id = selectedIds[0];
                      await handleEnrichApollo(id).catch(() => {});
                    } : undefined}
                    on360={async () => {
                      const id = selectedIds[0];
                      const result = await handleEnrich360(id);
                      // Ignorar retorno
                    }}
                    isProcessing={enrichReceitaMutation.isPending || enrichApolloMutation.isPending || enrich360Mutation.isPending || enrichCompletoMutation.isPending}
                    hasCNPJ={!!selectedCompany?.cnpj}
                    hasApolloId={!!(selectedCompany as any)?.apollo_organization_id}
                    variant="default"
                    size="sm"
                  />
                );
              })()}
              
              {/* Enviar para Pipeline (apenas se tiver seleção) - BOTÃO PRINCIPAL DESTACADO */}
              {selectedIds.length > 0 && (
                <>
                  <Button
                    onClick={handleSendToPipelineBatch}
                    disabled={isSendingToPipeline}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSendingToPipeline ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    Enviar para Pipeline ({selectedIds.length})
                  </Button>
                  
                  {/* Menu de Ações em Massa (dropdown) - SÓ APARECE COM SELEÇÃO */}
                  <QuarantineActionsMenu
                selectedCount={selectedIds.length}
                onDeleteSelected={handleDeleteSelected}
                onExportSelected={handleExportSelected}
                onPreviewSelected={handlePreviewSelected}
                onRefreshSelected={handleRefreshSelected}
                onBulkEnrichReceita={handleBulkEnrichReceita}
                onBulkEnrichApollo={handleBulkEnrichApollo}
                onBulkEnrich360={handleBulkEnrich360}
                onBulkEnrichWebsite={handleBulkEnrichWebsite}
                onBulkVerification={handleBulkVerification}
                onBulkDiscoverCNPJ={handleBulkDiscoverCNPJ}
                onBulkApprove={handleSendToPipelineBatch}
                onRestoreDiscarded={() => restoreAllDiscarded()}
                onReverifyAllV2={() => reverifyAll(filteredCompanies.map(c => ({
                  id: c.company_id || c.id,
                  razao_social: c.razao_social,
                  cnpj: c.cnpj,
                  website: c.website
                })))}
                isProcessing={isSendingToPipeline || isDeleting || isRefreshing}
                isReverifying={isReverifying}
                selectedItems={companies.filter(c => selectedIds.includes(c.id))}
                totalCompanies={filteredCompanies}
              />
                </>
              )}
              
              {/* Descartadas - SEMPRE VISÍVEL */}
              <Button
                onClick={() => setShowDiscardedModal(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Descartadas
              </Button>
              
              {/* Relatórios */}
              <Button
                onClick={() => navigate('/leads/stc-history')}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Relatórios
              </Button>
              
              {/* Paginação */}
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="150">150</SelectItem>
                  <SelectItem value="9999">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovada">Aprovadas</SelectItem>
                <SelectItem value="descartada">Descartadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tempFilter} onValueChange={setTempFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Temperaturas</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
            <Table className="w-full min-w-[1400px] table-auto">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-10 min-w-[40px] text-center"></TableHead>
                    <TableHead className="w-12 min-w-[48px] text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[320px] max-w-[420px] text-left">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('empresa')}
                          className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                        >
                          <span className="font-semibold">Empresa</span>
                          <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'empresa' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] min-w-[120px] text-center">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('cnpj')}
                          className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                        >
                          <span className="font-semibold">CNPJ</span>
                          <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'cnpj' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] min-w-[120px] text-center">
                      <div className="flex justify-center">
                        <ColumnFilter
                          column="source_name"
                          title="Origem"
                          values={Array.from(
                            new Set(
                              companies
                                .map(c => getCompanyOrigin(c))
                                .filter(Boolean)
                            )
                          )}
                          selectedValues={filterOrigin}
                          onFilterChange={setFilterOrigin}
                          onSort={() => handleSort('source_name')}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[96px] min-w-[80px]">
                      <ColumnFilter
                        column="cnpj_status"
                        title="Status CNPJ"
                      values={companies.map(c => {
                        const rawData = (c as any).raw_data?.receita_federal || (c as any).raw_data || {};
                        
                        // ✅ Buscar status em MÚLTIPLOS CAMPOS
                        let status = rawData.situacao || rawData.status || (c as any).cnpj_status || '';
                        
                        // ✅ Se tem CNPJ mas sem status = assumir ATIVA
                        if (c.cnpj && !status) {
                          status = 'ATIVA';
                        }
                        
                        if (!status) {
                          return 'PENDENTE';
                        }
                        
                        // Normalizar
                        const statusUpper = String(status).toUpperCase();
                        if (statusUpper.includes('ATIVA') || status === '02') return 'ATIVA';
                        if (statusUpper.includes('SUSPENSA') || status === '03') return 'SUSPENSA';
                        if (statusUpper.includes('INAPTA') || status === '04') return 'INAPTA';
                        if (statusUpper.includes('BAIXADA') || status === '08') return 'BAIXADA';
                        if (statusUpper.includes('NULA') || status === '01') return 'NULA';
                        
                        return status;
                      })}
                      selectedValues={filterCNPJStatus}
                      onFilterChange={setFilterCNPJStatus}
                      onSort={() => handleSort('cnpj_status')}
                    />
                  </TableHead>
                    <TableHead className="min-w-[300px] max-w-[420px] text-left">
                      <ColumnFilter
                        column="cnae"
                        title="CNAE"
                        values={Array.from(
                          new Set(
                            companies.map(c => {
                              const cnaeRes = resolveCompanyCNAE(c);
                              return cnaeRes.principal.code || 'Sem CNAE';
                            }).filter(Boolean)
                          )
                        )}
                        selectedValues={filterCNAE}
                        onFilterChange={setFilterCNAE}
                        onSort={() => {}}
                      />
                    </TableHead>
                      <TableHead className="min-w-[180px] flex-[1.5]">
                        <ColumnFilter
                          column="setor"
                          title="Setor"
                      values={Array.from(
                        new Set(
                          companies.map(c => {
                            const classification = getCNAEClassificationForCompany(c);
                            return classification?.setor_industria || 'Sem setor';
                          })
                        )
                      )}
                      selectedValues={filterSector}
                      onFilterChange={setFilterSector}
                      onSort={() => handleSort('setor')}
                    />
                  </TableHead>
                          <TableHead className="w-[60px] min-w-[50px]">
                            <ColumnFilter
                              column="uf"
                              title="UF"
                      values={Array.from(
                        new Set(
                          companies
                            .map(c => getCompanyUF(c))
                            .filter((uf): uf is string => !!uf)
                        )
                      )}
                      selectedValues={filterUF}
                      onFilterChange={setFilterUF}
                      onSort={() => handleSort('uf')}
                    />
                  </TableHead>
                              <TableHead className="w-[140px] min-w-[120px]">
                                <ColumnFilter
                                  column="cidade"
                                  title="Cidade"
                      values={Array.from(
                        new Set(
                          (filterUF.length > 0
                            ? companies.filter(c => {
                                const uf = getCompanyUF(c);
                                return uf ? filterUF.includes(uf) : false;
                              })
                            : companies
                          )
                            .map(c => getCompanyCity(c))
                            .filter((city): city is string => !!city)
                        )
                      )}
                      selectedValues={filterCity}
                      onFilterChange={setFilterCity}
                    />
                  </TableHead>
                              <TableHead className="w-[80px] min-w-[72px] text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSort('score')}
                                  className="h-8 flex items-center gap-1 px-1 hover:bg-primary/10 transition-colors group"
                                >
                                  <span className="font-semibold text-sm">Score</span>
                                  <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'score' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                                </Button>
                              </TableHead>
                              <TableHead className="w-[96px] min-w-[80px]">
                                <ColumnFilter
                                  column="analysis_status"
                                  title="Status Análise"
                      values={companies.map(c => {
                        const rawData = (c as any).raw_data || {};
                        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj);
                        const hasDecisionMakers = ((c as any).decision_makers_count || 0) > 0;
                        const hasDigitalPresence = !!(rawData.digital_intelligence);
                        const hasLegalData = !!(rawData.totvs_report);
                        
                        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
                        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
                        
                        if (percentage > 75) return '76-100%';
                        if (percentage > 50) return '51-75%';
                        if (percentage > 25) return '26-50%';
                        return '0-25%';
                      })}
                      selectedValues={filterAnalysisStatus}
                      onFilterChange={setFilterAnalysisStatus}
                    />
                  </TableHead>
                                  <TableHead className="w-[96px] min-w-[80px]">
                                    <ColumnFilter
                                      column="icp"
                                      title="ICP"
                      values={[...new Set(companies.map(c => {
                        const rawData = (c as any).raw_data || {};
                        return rawData.best_icp_name || rawData.icp_name || 'Sem ICP';
                      }).filter(Boolean))]}
                      selectedValues={filterICP}
                      onFilterChange={setFilterICP}
                    />
                  </TableHead>
                                      <TableHead className="w-[80px] min-w-[72px]">
                                        <ColumnFilter
                                          column="fit_score"
                                          title="Fit Score"
                      values={['90-100', '75-89', '60-74', '40-59', '0-39']}
                      selectedValues={filterFitScore}
                      onFilterChange={setFilterFitScore}
                    />
                  </TableHead>
                                          <TableHead className="w-[60px] min-w-[50px]">
                                            <ColumnFilter
                                              column="grade"
                                              title="Grade"
                      values={['A+', 'A', 'B', 'C', 'D', 'Sem Grade']}
                      selectedValues={filterGrade}
                      onFilterChange={setFilterGrade}
                    />
                  </TableHead>
                                              <TableHead className="w-[160px] min-w-[140px]">Intenção de Compra</TableHead>
                                              <TableHead className="min-w-[180px] flex-1">Website</TableHead>
                                              <TableHead className="w-[100px] min-w-[90px]">Website Fit</TableHead>
                                              <TableHead className="w-[100px] min-w-[90px]">LinkedIn</TableHead>
                                              <TableHead className="w-20 min-w-[80px] text-right">Ações</TableHead>
                                            </TableRow>
                                          </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((company) => {
                  // ✅ USAR raw_data (campo correto onde salvamos os enriquecimentos)
                  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data)) 
                    ? company.raw_data as Record<string, any>
                    : {};
                  
                  return (
                    <React.Fragment key={company.id}>
                  <TableRow className={expandedRow === company.id ? 'min-h-[56px] bg-muted/30' : 'min-h-[56px]'}>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(expandedRow === company.id ? null : company.id);
                          }}
                        >
                          {expandedRow === company.id ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedIds.includes(company.id)}
                          onCheckedChange={(checked) => 
                            handleSelectOne(company.id, checked as boolean)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <button 
                        className="flex items-start gap-2 min-w-[320px] max-w-[420px] mx-auto cursor-pointer hover:text-primary transition-colors text-left"
                        onClick={() => {
                          // 🎯 NAVEGAR PARA RELATÓRIO COMPLETO (9 ABAS) DA EMPRESA
                          if (company.company_id) {
                            navigate(`/company/${company.company_id}`);
                          } else {
                            toast.error('Empresa sem ID vinculado', {
                              description: 'Não foi possível localizar o ID da empresa'
                            });
                          }
                        }}
                      >
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex flex-col">
                          <span
                            className="text-sm font-semibold leading-snug break-words whitespace-normal"
                            title={company.razao_social}
                          >
                            {company.razao_social}
                          </span>
                          {company.cnpj && (
                            <span className="text-xs font-mono text-muted-foreground mt-0.5">
                              {formatCNPJ(company.cnpj)}
                            </span>
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {company.cnpj ? (
                          <Badge 
                            variant="secondary" 
                            className="bg-emerald-600/10 text-emerald-600 border-emerald-600/30 font-mono text-sm cursor-pointer hover:bg-emerald-600/20 transition-colors whitespace-nowrap px-3 py-1"
                            onClick={() => {
                              if (company.company_id) {
                                setExecutiveReportCompanyId(company.company_id);
                                setExecutiveReportOpen(true);
                              } else {
                                toast.info('Empresa ainda não possui relatório completo', {
                                  description: 'Aprove a empresa primeiro para gerar o relatório executivo'
                                });
                              }
                            }}
                          >
                            {formatCNPJ(company.cnpj)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center max-w-[220px] mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
                        {(() => {
                          // ✅ PADRONIZADO: Usar mesma lógica da tabela Estoque de Empresas Qualificadas
                          const origem = getCompanyOriginString(company);
                          
                          if (origem) {
                            return (
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs max-w-full"
                              >
                                <span className="truncate max-w-full">
                                  {origem}
                                </span>
                              </Badge>
                            );
                          }
                          
                          return (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Sem origem
                            </Badge>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <QuarantineCNPJStatusBadge 
                          cnpj={company.cnpj} 
                          cnpjStatus={(() => {
                            const receitaData = rawData?.receita_federal || rawData || {};
                            let status = receitaData.situacao || receitaData.status || company.cnpj_status || '';
                            
                            // Normalizar para lowercase
                            if (status.toUpperCase().includes('ATIVA') || status === '02') return 'ativa';
                            if (status.toUpperCase().includes('SUSPENSA') || status === '03') return 'inativo';
                            if (status.toUpperCase().includes('INAPTA') || status === '04') return 'inativo';
                            if (status.toUpperCase().includes('BAIXADA') || status === '08') return 'inexistente';
                            if (status.toUpperCase().includes('NULA') || status === '01') return 'inexistente';
                            
                            return status.toLowerCase();
                          })()}
                        />
                      </div>
                    </TableCell>
                    {/* CNAE Principal */}
                    <TableCell className="text-left align-top">
                      {(() => {
                        const cnaeResolution = resolveCompanyCNAE(company);
                        const displayLabel = formatCNAEForDisplay(cnaeResolution);

                        if (!displayLabel) {
                          return (
                            <span className="text-xs text-muted-foreground">
                              Sem CNAE
                            </span>
                          );
                        }

                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="min-w-[300px] max-w-[420px] mx-auto cursor-help">
                                  <span className="text-xs leading-snug line-clamp-3">
                                    {displayLabel}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-md">
                                <div className="space-y-2">
                                  <div>
                                    <p className="font-semibold text-sm">CNAE Principal:</p>
                                    <p className="text-xs">
                                      {cnaeResolution.principal.code || 'N/A'} - {cnaeResolution.principal.description || 'Sem descrição'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      Fonte: {cnaeResolution.fonte === 'icp_analysis' ? 'ICP (Análise)' : cnaeResolution.fonte === 'receita_federal' ? 'Receita Federal' : cnaeResolution.fonte === 'companies' ? 'Empresa' : 'N/A'}
                                    </p>
                                  </div>
                                  {cnaeResolution.secundarios.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-xs">CNAEs Secundários:</p>
                                      <ul className="text-xs space-y-1 mt-1">
                                        {cnaeResolution.secundarios.map((sec, idx) => (
                                          <li key={idx}>
                                            {sec.code} - {sec.description || 'Sem descrição'}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center max-w-[260px] px-2 overflow-hidden">
                      <div className="flex justify-center items-center gap-1 flex-wrap">
                        {(() => {
                          const cnaeResolution = resolveCompanyCNAE(company);
                          const cnaeCode = cnaeResolution.principal.code;
                          const classification = cnaeCode ? getCNAEClassificationForCompany({ ...company, cnae_principal: cnaeCode }) : null;
                          const setor = classification?.setor_industria;
                          const categoria = classification?.categoria;

                          if (setor) {
                            return (
                              <>
                                {/* 🎨 Badge de Setor com cores dinâmicas - cada setor tem cor única e consistente */}
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 py-0.5 ${getDynamicBadgeColors(setor, 'setor')}`}
                                  title={setor}
                                >
                                  {setor}
                                </Badge>
                                {/* 🎨 Badge de Categoria/Segmento com cores dinâmicas - cada segmento tem cor única baseada no nome */}
                                {categoria && (
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0.5 ${getDynamicBadgeColors(categoria, 'categoria')}`}
                                    title={categoria}
                                  >
                                    {categoria}
                                  </Badge>
                                )}
                              </>
                            );
                          }

                          if (cnaeCode) {
                            return (
                              <span className="text-xs text-muted-foreground" title="Sem classificação CNAE">
                                Sem classificação CNAE
                              </span>
                            );
                          }

                          return (
                            <span className="text-xs text-muted-foreground" title="Sem CNAE">
                              Sem CNAE
                            </span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    {/* UF */}
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        {(() => {
                          const uf = getCompanyUF(company);
                          return uf ? (
                            <Badge variant="secondary" className="w-fit">
                              {uf}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    {/* Cidade */}
                    <TableCell className="text-center max-w-[200px] px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      <div className="flex justify-center max-w-full">
                        {(() => {
                          const city = getCompanyCity(company);
                          return city ? (
                            <span className="text-xs text-muted-foreground truncate" title={city}>
                              {city}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <ICPScoreTooltip
                          score={company.icp_score || 0}
                          porte={company.porte}
                          setor={getCNAEClassificationForCompany(company)?.setor_industria || company.setor}
                          uf={getCompanyUF(company) || company.uf}
                          is_cliente_totvs={company.is_cliente_totvs}
                          hasReceitaData={!!rawData?.receita_federal}
                          hasApolloData={!!rawData?.apollo || !!rawData?.enrichment_360}
                          hasWebsite={!!company.website}
                          hasContact={!!company.email || !!company.telefone}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <QuarantineEnrichmentStatusBadge 
                          rawAnalysis={rawData}
                          totvsStatus={company.totvs_status}
                          showProgress
                        />
                      </div>
                    </TableCell>
                    {/* ✅ COLUNA ICP */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {(() => {
                          const companyRawData = (company as any).raw_data || {};
                          // ✅ LER icp_id de raw_data (onde foi salvo durante a migração)
                          const icpId = companyRawData?.icp_id || rawData?.icp_id || (company as any).icp_id;
                          const icpName = companyRawData?.best_icp_name || companyRawData?.icp_name || rawData?.best_icp_name || rawData?.icp_name;
                          
                          // Se tiver icp_id mas não tiver nome, usar fallback
                          if (icpId && !icpName) {
                            return (
                              <Badge variant="outline" className="text-xs">
                                ICP Principal
                              </Badge>
                            );
                          }
                          
                          if (icpName) {
                            return (
                              <Badge variant="outline" className="text-xs">
                                {icpName}
                              </Badge>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">-</span>;
                        })()}
                      </div>
                    </TableCell>
                    {/* ✅ COLUNA FIT SCORE */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {(() => {
                          const companyRawData = (company as any).raw_data || {};
                          // ✅ LER fit_score de raw_data (onde foi salvo durante a migração)
                          const fitScore = companyRawData?.fit_score ?? rawData?.fit_score ?? (company as any).fit_score ?? company.icp_score;
                          
                          if (fitScore != null && fitScore > 0) {
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center gap-2 cursor-help group">
                                      <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                      <span className="font-medium">{fitScore.toFixed(1)}%</span>
                                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-sm p-4">
                                    <div className="space-y-2">
                                      <p className="font-semibold text-sm border-b pb-2">
                                        Fit Score: {fitScore.toFixed(1)}%
                                      </p>
                                      <div className="text-xs space-y-1.5">
                                        <p>Cálculo baseado em:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                          <li>Setor (40%): Match com ICP</li>
                                          <li>Localização (30%): UF/Cidade</li>
                                          <li>Dados completos (20%): Qualidade dos dados</li>
                                          <li>Website (5%): Presença digital</li>
                                          <li>Contato (5%): Email/Telefone</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">N/A</span>;
                        })()}
                      </div>
                    </TableCell>
                    {/* ✅ COLUNA GRADE */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                      {(() => {
                        const companyRawData = (company as any).raw_data || {};
                        // ✅ LER grade de raw_data (onde foi salvo durante a migração)
                        const grade = companyRawData?.grade || rawData?.grade || (company as any).grade;
                        
                        if (!grade || grade === '-' || grade === 'null') {
                          return <Badge variant="outline">-</Badge>;
                        }
                        
                        const colors: Record<string, string> = {
                          'A+': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                          'A': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                          'B': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                          'C': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                          'D': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                        };
                        
                        return (
                          <Badge className={colors[grade] || 'bg-gray-100 text-gray-800'}>
                            {grade}
                          </Badge>
                        );
                      })()}
                      </div>
                    </TableCell>
                    {/* ✅ NOVA COLUNA: Purchase Intent Score */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <PurchaseIntentBadge 
                          score={(company as any).purchase_intent_score || 0}
                          intentType={(company as any).purchase_intent_type || 'potencial'}
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    {/* ✅ NOVA COLUNA: Website */}
                    <TableCell className="text-center">
                      {(() => {
                        const websiteUrl = formatWebsiteUrl(company.website_encontrado || company.website);
                        if (!websiteUrl) {
                          return <span className="text-muted-foreground text-xs">-</span>;
                        }
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center mx-auto text-primary hover:text-primary/80 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Globe className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">{websiteUrl}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </TableCell>
                    {/* ✅ NOVA COLUNA: Website Fit Score */}
                    <TableCell className="text-center">
                      {company.website_fit_score != null && company.website_fit_score > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center justify-center mx-auto text-green-600 cursor-help">
                                <Target className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-semibold">Website Fit Score: +{company.website_fit_score} pontos</p>
                                {company.website_products_match && Array.isArray(company.website_products_match) && company.website_products_match.length > 0 && (
                                  <div className="text-xs mt-2">
                                    <p className="font-medium">Produtos compatíveis:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                                      {company.website_products_match.slice(0, 3).map((match: any, idx: number) => (
                                        <li key={`${company.id}-match-${idx}-${match.tenant_product || ''}-${match.prospect_product || ''}`}>
                                          {match.tenant_product} ↔ {match.prospect_product}
                                        </li>
                                      ))}
                                      {company.website_products_match.length > 3 && (
                                        <li className="text-muted-foreground">+{company.website_products_match.length - 3} mais...</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    {/* ✅ NOVA COLUNA: LinkedIn */}
                    <TableCell className="text-center">
                      {(() => {
                        const linkedinUrl = formatWebsiteUrl(company.linkedin_url);
                        if (!linkedinUrl) {
                          return <span className="text-muted-foreground text-xs">-</span>;
                        }
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center mx-auto text-[#0077B5] hover:text-[#0077B5]/80 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">{linkedinUrl}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* STC */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <STCAgent
                                  companyId={company.company_id || company.id}
                                  companyName={company.razao_social}
                                  cnpj={company.cnpj}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="font-semibold">STC Agent</p>
                              <p className="text-xs">Assistente de vendas e análise</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* Menu de Ações */}
                        <QuarantineRowActions
                        company={company}
                        onApprove={handleSendToPipelineSingle}
                        onReject={handleRejectSingle}
                        onDelete={handleDeleteSingle}
                        onPreview={handlePreviewSingle}
                        onRefresh={handleRefreshSingle}
                        onEnrichReceita={handleEnrichReceita}
                        onEnrichApollo={handleEnrichApollo}
                        onEnrich360={handleEnrich360}
                        onEnrichCompleto={handleEnrichCompleto}
                        onEnrichVerification={handleEnrichVerification}
                        onDiscoverCNPJ={handleDiscoverCNPJ}
                        onRestoreIndividual={async (cnpj) => {
                          // Restaurar empresa individual
                          try {
                            // 1. Buscar empresa descartada
                            const { data: discarded } = await supabase
                              .from('discarded_companies')
                              .select('*')
                              .eq('cnpj', cnpj)
                              .single();
                            
                            if (!discarded) {
                              toast.error('Empresa não encontrada em descartadas');
                              return;
                            }
                            
                            // 2. Verificar se já existe na quarentena
                            const { data: existing } = await supabase
                              .from('icp_analysis_results')
                              .select('id')
                              .eq('cnpj', cnpj)
                              .maybeSingle();
                            
                            if (existing) {
                              // Atualizar status
                              await supabase
                                .from('icp_analysis_results')
                                .update({ status: 'pendente' })
                                .eq('id', existing.id);
                            }
                            
                            // 3. Remover de descartadas
                            await supabase
                              .from('discarded_companies')
                              .delete()
                              .eq('cnpj', cnpj);
                            
                            toast.success('✅ Empresa restaurada!');
                            refetch();
                          } catch (error: any) {
                            console.error('[RESTORE] Erro:', error);
                            toast.error('Erro ao restaurar', { description: error.message });
                          }
                        }}
                        onOpenExecutiveReport={() => {
                          if (company.company_id) {
                            setExecutiveReportCompanyId(company.company_id);
                            setExecutiveReportOpen(true);
                          } else {
                            toast.info('Empresa ainda não possui relatório completo', {
                              description: 'Aprove a empresa primeiro para gerar o relatório executivo'
                            });
                          }
                        }}
                        onEnrichWebsite={handleEnrichWebsite}
                        onCalculatePurchaseIntent={handleCalculatePurchaseIntent}
                      />
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* 🎨 LINHA EXPANDIDA COM CARD COMPLETO */}
                  {expandedRow === company.id && (
                    <TableRow key={`${company.id}-expanded`}>
                      <TableCell colSpan={15} className="bg-muted/20 p-0 border-t-0">
                        <ExpandedCompanyCard company={company} />
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                );
                })
              )}
            </TableBody>
              </Table>
        </CardContent>
      </Card>

      {/* ✅ MODAL UNIFICADO: Usar CompanyPreviewModal quando há apenas uma empresa */}
      {previewCompany && (
        <CompanyPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          company={previewCompany}
        />
      )}

      {/* Preview Dialog para múltiplas empresas (mantido para compatibilidade) */}
      {!previewCompany && displayCompanies.length > 1 && (
        <DraggableDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title="Preview das Empresas Selecionadas"
          description={`${displayCompanies.length} empresa(s) selecionada(s)`}
          className="max-w-6xl"
          maxWidth="max-h-[90vh]"
        >
          <div className="space-y-6">
            {displayCompanies.map((company) => (
            <Card key={company.id} className="border-2">
              <CardContent className="pt-6">
                {/* Header Section */}
                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Empresa</p>
                    <p className="text-xl font-bold">{company.razao_social}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">CNPJ</p>
                    <p className="font-mono text-lg">{company.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Score ICP</p>
                    <Badge variant={company.icp_score >= 70 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                      {company.icp_score} pontos
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Temperatura</p>
                    <div className="flex items-center gap-2">
                      {getTempIcon(company.temperatura)}
                      <Badge variant={getTempBadge(company.temperatura)} className="text-lg px-4 py-1">
                        {company.temperatura?.toUpperCase() || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                {company.status === 'descartada' && company.motivo_descarte && (
                  <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-destructive mb-1">Empresa Descartada</p>
                        <p className="text-sm">{company.motivo_descarte}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualification Reason */}
                {(company as any).motivo_qualificacao && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <p className="text-lg font-semibold">Resumo da Qualificação</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-sm leading-relaxed">{(company as any).motivo_qualificacao}</p>
                    </div>
                  </div>
                )}

                {/* Analysis Criteria */}
                {(() => {
                  const motivos: string[] = (company as any).motivos || [];
                  const breakdown = (company as any).breakdown || {};
                  const labelMap: Record<string, string> = {
                    web_presence: 'Presença web detectada',
                    news: 'Notícias recentes',
                    tecnologia: 'Tecnologia',
                    cnae: 'CNAE',
                    porte: 'Porte',
                    situacao: 'Situação',
                    localizacao: 'Localização',
                  };
                  const criteriosRaw: string[] = motivos.length > 0
                    ? motivos
                    : Object.keys(breakdown).map(k => labelMap[k] || k);
                  const criterios = Array.from(new Set(criteriosRaw)).filter(Boolean);
                  if (!criterios || criterios.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">Critérios de Análise Aplicados</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {criterios.map((criterio: string, idx: number) => (
                          <div key={`${company.id}-criterio-${idx}-${criterio}`} className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{criterio}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Buying Intent Signals */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const sinais = (company as any).sinais_intencao_compra 
                    || ra.intencao_compra?.sinais 
                    || ra.signals 
                    || [];
                  if (!sinais || sinais.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <p className="text-lg font-semibold">Sinais de Intenção de Compra</p>
                      </div>
                      <div className="space-y-3">
                        {sinais.map((sinal: any, idx: number) => (
                          <div key={`${company.id}-sinal-${idx}-${sinal?.tipo || ''}-${sinal?.descricao || ''}`} className="bg-orange-500/5 border-l-4 border-orange-500 p-4 rounded">
                            <p className="font-medium text-sm mb-1">{sinal?.tipo || 'Sinal Identificado'}</p>
                            <p className="text-sm text-muted-foreground">{sinal?.descricao || sinal?.texto || sinal}</p>
                            {sinal?.fonte && (
                              <a 
                                href={sinal.fonte} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-2 inline-block"
                              >
                                Ver fonte →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Evidence Section */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const evidencias = (company as any).evidencias 
                    || (company as any).evidencias_totvs 
                    || ra.evidencias 
                    || [];
                  if (!evidencias || evidencias.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">
                          Evidências Coletadas ({evidencias.length})
                        </p>
                      </div>
                      <div className="space-y-3">
                        {evidencias.map((ev: any, idx: number) => (
                          <div key={`${company.id}-evidencia-${idx}-${ev?.criterio || ''}-${ev?.fonte_nome || ''}`} className="bg-muted/30 p-4 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-sm">{ev?.criterio || ev?.fonte_nome || 'Evidência'}</p>
                              {ev?.relevancia && (
                                <Badge variant="outline" className="text-xs">
                                  Relevância: {ev.relevancia}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{ev?.evidencia || ev?.motivo || ev?.descricao || ev}</p>
                            {ev?.fonte_url && (
                              <a 
                                href={ev.fonte_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <span>Ver fonte completa</span>
                                <span>→</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Verificação de Uso removida do Preview: Preview deve exibir apenas o rosto/Resumo cadastral da empresa */}

                {/* Competitor Intelligence */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const tecnologias = (company as any).tecnologias_detectadas || ra.tecnologias || ra.stacks || [];
                  if (!tecnologias || tecnologias.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">Tecnologias e Ferramentas Detectadas</p>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {tecnologias.map((tech: string, idx: number) => (
                            <Badge key={`${company.id}-tech-${idx}-${tech}`} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          💡 Oportunidade: Estas tecnologias podem indicar concorrentes diretos ou parceiros potenciais
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Data Sources */}
                {(() => {
                  const ra = (company as any).raw_analysis || {};
                  const fontes = (company as any).fontes_consultadas || ra.fontes || ra.sources || [];
                  if (!fontes || fontes.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Download className="h-5 w-5 text-primary" />
                        <p className="text-lg font-semibold">Fontes Consultadas</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fontes.map((fonte: string, idx: number) => (
                          <Badge key={`${company.id}-fonte-${idx}-${fonte}`} variant="outline" className="text-xs">
                            {fonte}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {/* ✅ SEÇÕES ADICIONAIS DO MODAL COMPLETO */}
                <div className="space-y-4 mt-4 border-t pt-4">
                  {/* ICP e Grade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ICP Utilizado</p>
                      <p className="text-base">{(company as any).icp?.nome || 'Não especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grade Final</p>
                      <div className="mt-1">
                        {(() => {
                          const grade = company.grade || (company as any).raw_analysis?.grade;
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
                  </div>

                  {/* Fit Score */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fit Score / ICP Score</p>
                    {company.icp_score != null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold">{company.icp_score.toFixed(1)}%</span>
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
                          <span className="text-muted-foreground italic">Não informado</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✅ Análise Estratégica de Fit - Website & Produtos */}
                {company && (
                  <WebsiteFitAnalysisCard
                    companyId={company.company_id || company.id}
                    qualifiedProspectId={undefined}
                    companyCnpj={company.cnpj}
                    websiteEncontrado={company.website_encontrado || company.website}
                    websiteFitScore={company.website_fit_score}
                    websiteProductsMatch={company.website_products_match}
                    linkedinUrl={company.linkedin_url}
                    isModalFullscreen={false}
                  />
                )}

                {/* ✅ Detalhamento de Matching com match_breakdown */}
                {(company as any).match_breakdown && Array.isArray((company as any).match_breakdown) && (company as any).match_breakdown.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Detalhamento de Qualificação</p>
                    <div className="space-y-2">
                      {(company as any).match_breakdown.map((item: any, idx: number) => (
                        <div 
                          key={`${company.id}-match-breakdown-${idx}-${item?.criterio || ''}-${item?.matched ? 'matched' : 'unmatched'}`} 
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
              </CardContent>
            </Card>
          ))}
        </div>
      </DraggableDialog>
      )}

      {/* Reject/Discard Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Descartar Empresa
            </DialogTitle>
            <DialogDescription>
              Você está descartando: <strong>{rejectCompanyData?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Selecione o motivo do descarte:</Label>
              <RadioGroup value={rejectReason} onValueChange={setRejectReason}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="ja_cliente_totvs" id="ja_cliente" />
                  <Label htmlFor="ja_cliente" className="flex-1 cursor-pointer">
                    ⚠️ Já é cliente identificado
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="fora_perfil_icp" id="fora_perfil" />
                  <Label htmlFor="fora_perfil" className="flex-1 cursor-pointer">
                    ❌ Fora do perfil ICP
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="porte_inadequado" id="porte" />
                  <Label htmlFor="porte" className="flex-1 cursor-pointer">
                    📊 Porte inadequado
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="setor_nao_atendido" id="setor" />
                  <Label htmlFor="setor" className="flex-1 cursor-pointer">
                    🏭 Setor não atendido
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="regiao_nao_coberta" id="regiao" />
                  <Label htmlFor="regiao" className="flex-1 cursor-pointer">
                    🗺️ Região não coberta
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="dados_insuficientes" id="dados" />
                  <Label htmlFor="dados" className="flex-1 cursor-pointer">
                    📋 Dados insuficientes
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="outro" id="outro" />
                  <Label htmlFor="outro" className="flex-1 cursor-pointer">
                    ✏️ Outro motivo (especificar)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {rejectReason === 'outro' && (
              <div className="space-y-2 animate-in fade-in-50 duration-200">
                <Label htmlFor="custom-reason" className="text-sm font-semibold">
                  Descreva o motivo:
                </Label>
                <Textarea
                  id="custom-reason"
                  placeholder="Digite o motivo do descarte..."
                  value={rejectCustomReason}
                  onChange={(e) => setRejectCustomReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {rejectCustomReason.length}/500 caracteres
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectModalOpen(false);
                setRejectReason('');
                setRejectCustomReason('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason || (rejectReason === 'outro' && !rejectCustomReason.trim())}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Descarte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Executive Report Modal */}
      <ExecutiveReportModal 
        open={executiveReportOpen}
        onOpenChange={setExecutiveReportOpen}
        companyId={executiveReportCompanyId}
      />
      
      {/* Discarded Companies Modal */}
      <DiscardedCompaniesModal
        open={showDiscardedModal}
        onOpenChange={setShowDiscardedModal}
      />
      
      {/* ✅ MODAL DE PROGRESSO EM TEMPO REAL */}
      <EnrichmentProgressModal
        open={enrichmentModalOpen}
        onOpenChange={setEnrichmentModalOpen}
        title="Enriquecimento Apollo - Decisores"
        companies={enrichmentProgress}
        onCancel={() => setCancelEnrichment(true)}
        isCancelling={cancelEnrichment}
      />
      
      </div>
    </AppLayout>
  );
}
