import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/common/BackButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { logger } from '@/lib/utils/logger';
// ❌ REMOVIDO: Upload agora é APENAS no Motor de Qualificação (SearchPage)
// import { BulkUploadDialog } from '@/components/companies/BulkUploadDialog';
import { ApolloImportDialog } from '@/components/companies/ApolloImportDialog';
import { BulkActionsToolbar } from '@/components/companies/BulkActionsToolbar';
import { CompanyRowActions } from '@/components/companies/CompanyRowActions';
import { HeaderActionsMenu } from '@/components/companies/HeaderActionsMenu';
import { CompaniesActionsMenu } from '@/components/companies/CompaniesActionsMenu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnrichmentStatusBadge } from '@/components/companies/EnrichmentStatusBadge';
import { UsageVerificationDialog } from '@/components/intelligence/UsageVerificationDialog';
import { STCAgent } from '@/components/intelligence/STCAgent';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { supabase } from '@/integrations/supabase/client';
import { Building2, Search, Edit, Trash2, Zap, Plus, Loader2, Eye, Sparkles, ArrowUpDown, CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw, FileText, Download, FileSpreadsheet, Image, Upload, Database, Target, Users, Globe, ChevronDown, ChevronUp, TrendingUp, HelpCircle, CheckCircle2, MapPin, Briefcase, Activity, Maximize, Minimize } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeletons';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompanies, useDeleteCompany } from '@/hooks/useCompanies';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { CNPJDiscoveryDialog } from '@/components/companies/CNPJDiscoveryDialog';
import { formatWebsiteUrl, isValidUrl, extractDomain } from '@/lib/utils/urlHelpers';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { EnrichmentProgressModal, type EnrichmentProgress } from '@/components/companies/EnrichmentProgressModal';
import { PartnerSearchModal } from '@/components/companies/PartnerSearchModal';
import { ExpandedCompanyCard } from '@/components/companies/ExpandedCompanyCard';
import { UnifiedEnrichButton } from '@/components/companies/UnifiedEnrichButton';
import { WebsiteFitAnalysisCard } from '@/components/qualification/WebsiteFitAnalysisCard';
import { CompanyPreviewModal } from '@/components/qualification/CompanyPreviewModal';
import { PurchaseIntentBadge } from '@/components/intelligence/PurchaseIntentBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import LocationMap from '@/components/map/LocationMap';
import { normalizeFromCompanies, prepareForICPInsertion } from '@/lib/utils/companyDataNormalizer';


export default function CompaniesManagementPage() {
  // 🔥 VERSÃO WORLD-CLASS - 100% IDÊNTICA À QUARENTENA
  logger.info('CompaniesManagementPage mounted - v2.0 WORLD-CLASS', 'CompaniesManagement');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50); // 🔢 Tamanho da página configurável
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'cnpj' | 'industry' | 'created_at' | 'cnpj_status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 🔍 FILTROS POR COLUNA (tipo Excel)
  const [filterOrigin, setFilterOrigin] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSector, setFilterSector] = useState<string[]>([]);
  const [filterRegion, setFilterRegion] = useState<string[]>([]);
  const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]);
  const [filterEnrichment, setFilterEnrichment] = useState<string[]>([]); // ✅ NOVO: Filtro por enriquecimento
  const [filterICP, setFilterICP] = useState<string[]>([]);
  const [filterFitScore, setFilterFitScore] = useState<string[]>([]);
  const [filterGrade, setFilterGrade] = useState<string[]>([]);
  
  // 🔥 DEBOUNCE: Só busca após 500ms de inatividade
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const { data: companiesResult, isLoading: loading, refetch } = useCompanies({
    page,
    pageSize: pageSize === 9999 ? 9999 : pageSize, // 9999 = "Mostrar Todos"
    search: debouncedSearchTerm, // FIX: Usar debouncedSearchTerm
    sortBy,
    sortOrder,
  });
  
  const allCompanies = companiesResult?.data || [];
  
  // 🔍 APLICAR FILTROS LOCALMENTE
  const companies = useMemo(() => {
    let filtered = [...allCompanies];
    
    // Filtro por Origem
    if (filterOrigin.length > 0) {
      filtered = filtered.filter(c => filterOrigin.includes(c.source_name || ''));
    }
    
    // Filtro por Status CNPJ
    if (filterStatus.length > 0) {
      filtered = filtered.filter(c => {
        // Buscar status da Receita Federal no raw_data
        const receitaData = (c as any).raw_data?.receita_federal || (c as any).raw_data;
        let status = 'PENDENTE'; // Default
        
        if (receitaData) {
          // Normalizar status (API Brasil vs ReceitaWS)
          status = receitaData.situacao || receitaData.status || 'PENDENTE';
          
          // Normalizar valores variados para padrão
          if (status.toUpperCase().includes('ATIVA') || status === '02' || status === 'ATIVA') {
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
        
        return filterStatus.includes(status);
      });
    }
    
    // Filtro por Setor
    if (filterSector.length > 0) {
      filtered = filtered.filter(c => {
        const sector = c.industry || (c as any).raw_data?.setor_amigavel || (c as any).raw_data?.atividade_economica || 'N/A';
        return filterSector.includes(sector);
      });
    }
    
    // Filtro por UF (apenas estado, sem cidade)
    if (filterRegion.length > 0) {
      filtered = filtered.filter(c => {
        const uf = (c as any).raw_data?.uf || '';
        return filterRegion.includes(uf);
      });
    }
    
    // Filtro por Status Análise (percentual de completude)
    if (filterAnalysisStatus.length > 0) {
      filtered = filtered.filter(c => {
        // Calcular percentual baseado em 4 itens críticos
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
        
        return filterAnalysisStatus.includes(statusLabel);
      });
    }
    
    // ✅ NOVO: Filtro por tipo de enriquecimento
    if (filterEnrichment.length > 0) {
      filtered = filtered.filter(c => {
        const rawData = (c as any).raw_data || {};
        const hasReceita = !!(rawData.receita_federal || rawData.receita);
        const hasApollo = !!(rawData.apollo_organization || rawData.apollo);
        const has360 = !!(rawData.digital_intelligence || rawData.enrichment_360);
        const hasTOTVS = !!(rawData.totvs_report);
        
        // Verificar se empresa tem os enriquecimentos filtrados
        const enrichments: Record<string, boolean> = {
          'Receita Federal': hasReceita,
          'Apollo': hasApollo,
          '360° Digital': has360,
          'TOTVS Check': hasTOTVS,
        };
        
        return filterEnrichment.some(e => enrichments[e]);
      });
    }
    
    // ✅ Filtro por ICP
    if (filterICP.length > 0) {
      filtered = filtered.filter(c => {
        const rawData = (c as any).raw_data || {};
        const icpName = rawData.best_icp_name || rawData.icp_name || 'Sem ICP';
        return filterICP.includes(icpName);
      });
    }
    
    // ✅ Filtro por Fit Score
    if (filterFitScore.length > 0) {
      filtered = filtered.filter(c => {
        const rawData = (c as any).raw_data || {};
        const fitScore = rawData.fit_score ?? (c as any).fit_score ?? (c as any).icp_score ?? 0;
        if (fitScore >= 90) return filterFitScore.includes('90-100');
        if (fitScore >= 75) return filterFitScore.includes('75-89');
        if (fitScore >= 60) return filterFitScore.includes('60-74');
        if (fitScore >= 40) return filterFitScore.includes('40-59');
        return filterFitScore.includes('0-39');
      });
    }
    
    // ✅ Filtro por Grade
    if (filterGrade.length > 0) {
      filtered = filtered.filter(c => {
        const rawData = (c as any).raw_data || {};
        const grade = rawData.grade || (c as any).grade || null;
        if (!grade || grade === '-' || grade === 'null') return filterGrade.includes('Sem Grade');
        return filterGrade.includes(grade);
      });
    }
    
    return filtered;
  }, [allCompanies, filterOrigin, filterStatus, filterSector, filterRegion, filterAnalysisStatus, filterEnrichment, filterICP, filterFitScore, filterGrade]);
  
  // 🔢 ALIASES PARA COMPATIBILIDADE COM QUARENTENA
  const filteredCompanies = companies;
  
  // 🔢 APLICAR PAGINAÇÃO LOCALMENTE
  const paginatedCompanies = pageSize === 9999 
    ? filteredCompanies 
    : filteredCompanies.slice(0, pageSize);
  
  const totalCount = companiesResult?.count || 0;
  const totalPages = companiesResult?.totalPages || 0;
  
  const deleteCompany = useDeleteCompany();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // 🆕 EXPANSÃO DE LINHAS
  const [isBatchEnriching360, setIsBatchEnriching360] = useState(false);
  const [enrichingReceitaId, setEnrichingReceitaId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isEnrichingWebsite, setIsEnrichingWebsite] = useState(false);
  const [websiteEnrichmentProgress, setWebsiteEnrichmentProgress] = useState<{ current: number; total: number; currentItem?: string }>({ current: 0, total: 0 });
  
  const [isApolloImportOpen, setIsApolloImportOpen] = useState(false);
  const hasSelection = selectedCompanies.length > 0;
  
  // ✅ Modal de Preview com Website Fit Analysis
  const [previewCompany, setPreviewCompany] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);

  // Inline website editing state
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [websiteInput, setWebsiteInput] = useState<string>('');
  
  // ✅ NOVO: Inline CNPJ editing state
  const [editingCnpjId, setEditingCnpjId] = useState<string | null>(null);
  const [cnpjInput, setCnpjInput] = useState<string>('');

  // CNPJ Discovery dialog state
  const [cnpjDialogOpen, setCnpjDialogOpen] = useState(false);
  const [cnpjCompany, setCnpjCompany] = useState<any | null>(null);

  // ✅ FUNÇÃO PARA SALVAR CNPJ EDITADO
  const saveCnpj = async (companyId: string, newCnpj: string) => {
    // Validar formato CNPJ (apenas números, 14 dígitos)
    const cleanCnpj = newCnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido', { 
        description: 'O CNPJ deve ter 14 dígitos' 
      });
      return;
    }

    try {
      // ✅ VERIFICAR SE CNPJ JÁ EXISTE EM OUTRA EMPRESA
      const { data: existing, error: checkError } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('cnpj', cleanCnpj)
        .neq('id', companyId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast.error('❌ CNPJ duplicado!', {
          description: `Este CNPJ já pertence a: ${existing.company_name}`
        });
        return;
      }

      // ✅ SALVAR CNPJ
      const { error } = await supabase
        .from('companies')
        .update({ cnpj: cleanCnpj })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('✅ CNPJ atualizado!', {
        description: 'Agora você pode enriquecer a empresa com dados da Receita Federal'
      });
      
      setEditingCnpjId(null);
      setCnpjInput('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (error: any) {
      const message = error.message || '';
      if (message.includes('duplicate') || message.includes('unique')) {
        toast.error('❌ CNPJ duplicado!', {
          description: 'Este CNPJ já existe em outra empresa'
        });
      } else {
        toast.error('Erro ao salvar CNPJ', { 
          description: message 
        });
      }
    }
  };

  // Helper functions for inline website editing
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

  const saveWebsite = async (companyId: string, value: string) => {
    const sanitized = sanitizeDomain(value);
    if (!sanitized) {
      toast.error('Website inválido', { description: 'Informe um domínio válido, ex: empresa.com.br' });
      return;
    }
    const { error } = await supabase
      .from('companies')
      .update({ website: sanitized, domain: sanitized })
      .eq('id', companyId);
    if (error) {
      toast.error('Erro ao salvar website', { description: error.message });
      return;
    }
    toast.success('Website atualizado');
    setEditingWebsiteId(null);
    setWebsiteInput('');
    refetch();
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;

    // 🔐 PROTEÇÃO: Requer senha de gestor para deletar da Base Permanente
    const adminPassword = prompt(
      `⚠️ ATENÇÃO: Deletar da Base de Empresas é PERMANENTE!\n\n` +
      `A empresa "${companyToDelete.name}" será DELETADA do histórico.\n\n` +
      `Digite sua senha de login para confirmar:`
    );
    
    if (!adminPassword) {
      toast.info('Exclusão cancelada');
      return;
    }
    
    // ✅ VALIDAR SENHA REAL DO USUÁRIO
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validar senha tentando fazer login
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: adminPassword,
    });

    if (authError) {
      toast.error('❌ Senha de gestor incorreta!', {
        description: 'Exclusão bloqueada por segurança'
      });
      return;
    }

    try {
      setIsDeleting(true);
      await deleteCompany.mutateAsync(companyToDelete.id);
      toast.success('Empresa excluída com sucesso', {
        description: '🔒 Ação protegida por senha de gestor'
      });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      await refetch();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Erro ao excluir empresa');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;

    // 🔐 PROTEÇÃO: Requer senha de gestor para deletar da Base Permanente
    const adminPassword = prompt(
      `⚠️ ATENÇÃO: Deletar da Base de Empresas é PERMANENTE!\n\n` +
      `${selectedCompanies.length} empresas serão DELETADAS do histórico.\n\n` +
      `Digite sua senha de login para confirmar:`
    );
    
    if (!adminPassword) {
      toast.info('Exclusão cancelada');
      return;
    }
    
    // ✅ VALIDAR SENHA REAL DO USUÁRIO
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validar senha tentando fazer login
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: adminPassword,
    });

    if (authError) {
      toast.error('❌ Senha de gestor incorreta!', {
        description: 'Exclusão bloqueada por segurança'
      });
      return;
    }

    // ✅ SEGUNDA CONFIRMAÇÃO
    const finalConfirm = confirm(
      `ÚLTIMA CONFIRMAÇÃO:\n\n` +
      `Deletar ${selectedCompanies.length} empresas PERMANENTEMENTE da Base?\n\n` +
      `Esta ação NÃO PODE ser desfeita!`
    );
    
    if (!finalConfirm) {
      toast.info('Exclusão cancelada');
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete all selected companies
      const count = selectedCompanies.length;
      for (const companyId of selectedCompanies) {
        await deleteCompany.mutateAsync(companyId);
      }
      
      toast.success(`✅ ${count} empresas deletadas da Base`, {
        description: '🔒 Ação protegida por senha de gestor'
      });
      setSelectedCompanies([]);
      await refetch();
    } catch (error) {
      console.error('Error deleting companies:', error);
      toast.error('Erro ao excluir empresas');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    // Selecionar/desmarcar apenas empresas FILTRADAS (não todas)
    if (selectedCompanies.length === companies.length && companies.length > 0) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
    }
  };

  const toggleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleEnrich = async (companyId: string) => {
    try {
      setEnrichingId(companyId);
      toast.info('Iniciando análise 360°...');

      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: companyId }
      });

      if (error) throw error;

      toast.success('Análise 360° concluída!');
      refetch(); // Recarrega para pegar dados atualizados
    } catch (error) {
      console.error('Error enriching company:', error);
      toast.error('Erro ao executar análise 360°');
    } finally {
      setEnrichingId(null);
    }
  };

  const handleEnrichReceita = async (companyId: string) => {
    try {
      setEnrichingReceitaId(companyId);
      toast.info('Buscando dados da Receita Federal...');

      // Buscar CNPJ da empresa selecionada
      const company = companies.find((c: any) => c.id === companyId);
      if (!company?.cnpj) {
        toast.error('CNPJ não disponível', { description: 'Não é possível atualizar dados sem CNPJ' });
        return;
      }

      const clean = company.cnpj.replace(/\D/g, '');
      let receita: any = null;

      // 🔥 TRIPLE FALLBACK: API Brasil → ReceitaWS → Manual
      try {
        console.log('📡 Tentando API Brasil...');
        const apiBrasilResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
        if (apiBrasilResponse.ok) {
          receita = await apiBrasilResponse.json();
          console.log('✅ API Brasil: Sucesso!');
        } else {
          throw new Error('API Brasil falhou');
        }
      } catch (apiBrasilError) {
        console.warn('⚠️ API Brasil falhou, tentando ReceitaWS...');
        try {
          const receitawsResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${clean}`);
          if (receitawsResponse.ok) {
            const data = await receitawsResponse.json();
            if (data.status !== 'ERROR') {
              receita = data;
              console.log('✅ ReceitaWS: Sucesso!');
            } else {
              throw new Error('ReceitaWS retornou erro');
            }
          } else {
            throw new Error('ReceitaWS falhou');
          }
        } catch (receitawsError) {
          console.error('❌ Todas as APIs falharam');
          toast.error('Erro ao buscar dados da Receita Federal', {
            description: 'Tente novamente mais tarde'
          });
          setEnrichingReceitaId(null);
          return;
        }
      }
      if (receita) {
        // Merge seguro preservando dados já existentes em raw_data
        const existingRaw = (company.raw_data && typeof company.raw_data === 'object') ? (company.raw_data as any) : {};
        const mergedRaw = {
          ...existingRaw,
          enriched_receita: true, // FLAG CRÍTICA DE GOVERNANÇA
          receita,
          situacao_cadastral: receita.situacao || null,
          data_abertura: receita.abertura || null,
          porte_estimado: receita.porte || null,
          natureza_juridica: receita.natureza_juridica || null,
          cod_atividade_economica: receita.atividade_principal?.[0]?.code || null,
          atividade_economica: receita.atividade_principal?.[0]?.text || null,
          atividades_secundarias: receita.atividades_secundarias || null,
          telefones_matriz: receita.telefone || null,
          email_receita_federal: receita.email || null,
          capital_social: receita.capital_social || null,
          socios_administradores: receita.qsa || null,
          ...(existingRaw.apollo && { apollo: existingRaw.apollo }),
          ...(existingRaw.segment && { segment: existingRaw.segment }),
          ...(existingRaw.refinamentos && { refinamentos: existingRaw.refinamentos })
        };

        const industryFromReceita = (receita as any)?.atividade_principal?.[0]?.text as string | undefined;
        const { error: updError } = await supabase
          .from('companies')
          .update({ 
            raw_data: mergedRaw,
            company_name: receita.nome || company.name,
            ...(industryFromReceita ? { industry: industryFromReceita } : {})
          })
          .eq('id', companyId);
        if (updError) throw updError;

        toast.success('Dados da Receita Federal atualizados!');
        
        // DESABILITADO: Edge Functions com CORS bloqueado
        // TODO: Corrigir CORS em calculate-maturity-score e generate-company-report
        
        await refetch();
      } else {
        toast.error('Nenhum dado retornado', { description: 'Verifique o CNPJ' });
      }
    } catch (error) {
      console.error('Error enriching ReceitaWS:', error);
      toast.error('Erro ao enriquecer com Receita Federal', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setEnrichingReceitaId(null);
    }
  };

  // ✅ NOVO: Enriquecimento de Website & LinkedIn (individual)
  const handleEnrichWebsite = async (companyId: string) => {
    try {
      setIsEnrichingWebsite(true);
      const company = companies.find((c: any) => c.id === companyId);
      if (!company) {
        toast.error('Empresa não encontrada');
        return;
      }

      const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const tenantId = tenant?.id;
      if (!tenantId) {
        toast.error('Tenant não encontrado');
        return;
      }

      toast.info('🌐 Buscando website oficial...');

      // 1. Buscar website
      const findWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/find-prospect-website`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razao_social: company.company_name || (company as any).razao_social,
          cnpj: company.cnpj,
          tenant_id: tenantId,
        }),
      });

      if (!findWebsiteResponse.ok) {
        throw new Error('Erro ao buscar website');
      }

      const websiteData = await findWebsiteResponse.json();
      if (!websiteData.success || !websiteData.website) {
        toast.warning('Website não encontrado');
        return;
      }

      toast.info('🔍 Escaneando website para produtos...');

      // 2. Buscar ou criar qualified_prospect_id correspondente
      let qualifiedProspectId: string | null = null;
      
      // Tentar encontrar qualified_prospect existente pelo CNPJ
      if (company.cnpj) {
        const normalizedCnpj = company.cnpj.replace(/\D/g, '');
        // ✅ CORRIGIDO: Usar cast para any para evitar erro de tipo
        const { data: existingProspect } = await ((supabase as any)
          .from('qualified_prospects'))
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('cnpj', normalizedCnpj)
          .limit(1)
          .maybeSingle();
        
        if (existingProspect) {
          qualifiedProspectId = existingProspect.id;
        }
      }

      // Se não encontrou, criar um registro temporário em qualified_prospects
      if (!qualifiedProspectId) {
        const normalizedCnpj = company.cnpj?.replace(/\D/g, '');
        if (!normalizedCnpj || normalizedCnpj.length !== 14) {
          console.warn('[Enriquecimento Website] CNPJ inválido, pulando criação de qualified_prospect');
        } else {
          // ✅ Campos obrigatórios: tenant_id, cnpj, fit_score, grade
          // ✅ CORRIGIDO: Usar cast para any para evitar erro de tipo
          const { data: newProspect, error: createError } = await ((supabase as any)
            .from('qualified_prospects'))
            .insert({
              tenant_id: tenantId,
              cnpj: normalizedCnpj,
              razao_social: company.company_name || (company as any).razao_social || 'Empresa Sem Nome',
              nome_fantasia: (company as any).raw_data?.nome_fantasia || null,
              cidade: (company.location as any)?.city || null,
              estado: (company.location as any)?.state || null,
              setor: company.industry || null,
              website: company.website || websiteData.website || null,
              pipeline_status: 'promoted', // Já está no banco de empresas
              source_name: 'Enriquecimento Website',
              // ✅ Campos obrigatórios com valores padrão
              fit_score: (company.raw_data as any)?.fit_score || 0,
              grade: (company.raw_data as any)?.grade || 'D',
              // ✅ Usar enrichment_data em vez de raw_data (qualified_prospects não tem raw_data)
              enrichment_data: company.raw_data || {},
            })
            .select('id')
            .single();

          if (createError) {
            console.error('[Enriquecimento Website] Erro ao criar qualified_prospect:', createError);
            // Continuar mesmo sem qualified_prospect_id - vamos atualizar apenas companies
          } else {
            qualifiedProspectId = newProspect.id;
          }
        }
      }

      // 3. Escanear website (se tiver qualified_prospect_id)
      let scanData: any = null;
      if (qualifiedProspectId) {
        const scanWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/scan-prospect-website`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            qualified_prospect_id: qualifiedProspectId,
            website_url: websiteData.website,
            razao_social: company.company_name || (company as any).razao_social,
          }),
        });

        if (scanWebsiteResponse.ok) {
          scanData = await scanWebsiteResponse.json();
        } else {
          console.warn('[Enriquecimento Website] Erro ao escanear website:', await scanWebsiteResponse.text());
        }
      }

      // 4. Atualizar companies com os dados do website
      // ✅ Preservar dados existentes em raw_data
      const existingRawData = (company.raw_data && typeof company.raw_data === 'object') ? (company.raw_data as any) : {};
      const enrichedRawData = {
        ...existingRawData,
        website_enrichment: {
          website_encontrado: websiteData.website,
          website_fit_score: scanData?.website_fit_score || 0,
          website_products_match: scanData?.compatible_products || [],
          linkedin_url: scanData?.linkedin_url || null,
          enriched_at: new Date().toISOString(),
        },
      };

      // ✅ Atualizar sempre com campos básicos (que sempre existem)
      const baseUpdateData: any = {
        website: websiteData.website,
        raw_data: enrichedRawData,
        updated_at: new Date().toISOString(),
      };

      // ✅ Tentar adicionar campos novos (se migration foi aplicada)
      // Se falhar, continuar apenas com campos básicos
      const { error: updateError } = await supabase
        .from('companies')
        .update(baseUpdateData)
        .eq('id', companyId);

      if (updateError) {
        console.error('[Enriquecimento Website] Erro ao atualizar companies:', updateError);
        // Tentar apenas com website (sem raw_data)
        const { error: basicError } = await supabase
          .from('companies')
          .update({
            website: websiteData.website,
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId);
        
        if (basicError) {
          throw basicError;
        }
      } else {
        // Se atualização básica funcionou, tentar atualizar campos novos (opcional)
        if (scanData && scanData.success) {
          // Tentar atualizar campos novos (pode falhar se migration não foi aplicada)
          await supabase
            .from('companies')
            .update({
              website_encontrado: websiteData.website,
              website_fit_score: scanData.website_fit_score || 0,
              website_products_match: scanData.compatible_products_count > 0 ? scanData.compatible_products : [],
              linkedin_url: scanData.linkedin_url || null,
            })
            .eq('id', companyId);
          // Ignorar erro se colunas não existirem - dados já estão em raw_data
        }
      }

      // 5. Se tiver qualified_prospect_id, atualizar também
      if (qualifiedProspectId && scanData && scanData.success) {
        // ✅ CORRIGIDO: Usar cast para any para evitar erro de tipo
        await ((supabase as any)
          .from('qualified_prospects'))
          .update({
            website_encontrado: websiteData.website,
            website_fit_score: scanData.website_fit_score || 0,
            website_products_match: scanData.compatible_products_count > 0 ? scanData.compatible_products : [],
            linkedin_url: scanData.linkedin_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', qualifiedProspectId);
      }

      toast.success('✅ Website enriquecido com sucesso!', {
        description: scanData?.success 
          ? `Fit Score: +${scanData.website_fit_score || 0} pontos. ${scanData.products_found || 0} produtos encontrados.`
          : `Website encontrado: ${websiteData.website}`,
      });

      await refetch();
    } catch (error: any) {
      console.error('[Enriquecimento Website] Erro:', error);
      toast.error('Erro ao enriquecer website', {
        description: error.message || 'Não foi possível enriquecer o website',
      });
    } finally {
      setIsEnrichingWebsite(false);
    }
  };

  // ✅ NOVO: Enriquecimento de Website & LinkedIn (em massa)
  const handleBulkEnrichWebsite = async () => {
    const idsToEnrich = selectedCompanies.length > 0 
      ? selectedCompanies 
      : companies.map(c => c.id);

    if (idsToEnrich.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Nenhuma empresa selecionada para enriquecer',
        variant: 'destructive',
      });
      return;
    }

    setIsEnrichingWebsite(true);
    setWebsiteEnrichmentProgress({ current: 0, total: idsToEnrich.length });
    try {
      toast({
        title: '🌐 Enriquecendo websites...',
        description: `Processando ${idsToEnrich.length} empresa(s)`,
      });

      const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const tenantId = tenant?.id;
      if (!tenantId) {
        toast.error('Tenant não encontrado');
        return;
      }

      let enrichedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < idsToEnrich.length; i++) {
        const companyId = idsToEnrich[i];
        try {
          const company = companies.find((c: any) => c.id === companyId);
          if (!company) {
            setWebsiteEnrichmentProgress({ current: i + 1, total: idsToEnrich.length, currentItem: 'Pulando...' });
            continue;
          }

          setWebsiteEnrichmentProgress({ 
            current: i + 1, 
            total: idsToEnrich.length, 
            currentItem: company.company_name || company.cnpj 
          });

          // 1. Buscar website
          const findWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/find-prospect-website`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razao_social: company.company_name || (company as any).razao_social,
              cnpj: company.cnpj,
              tenant_id: tenantId,
            }),
          });

          if (!findWebsiteResponse.ok) continue;
          const websiteData = await findWebsiteResponse.json();
          if (!websiteData.success || !websiteData.website) continue;

          // 2. Escanear website
          const scanWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/scan-prospect-website`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              qualified_prospect_id: companyId,
              website_url: websiteData.website,
              razao_social: company.company_name || (company as any).razao_social,
            }),
          });

          if (!scanWebsiteResponse.ok) continue;
          const scanData = await scanWebsiteResponse.json();
          if (!scanData.success) continue;

          // 3. Atualizar
          const { error } = await supabase
            .from('companies')
            .update({
              website_encontrado: websiteData.website,
              website_fit_score: scanData.website_fit_score || 0,
              website_products_match: scanData.compatible_products_count > 0 ? scanData.compatible_products : [],
              linkedin_url: scanData.linkedin_url || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', companyId);

          if (error) throw error;
          enrichedCount++;
        } catch (error: any) {
          const company = companies.find((c: any) => c.id === companyId);
          errors.push(`${company?.company_name || companyId}: ${error.message}`);
        }
      }

      toast({
        title: enrichedCount > 0 ? '✅ Enriquecimento concluído!' : '⚠️ Nenhuma empresa enriquecida',
        description: `${enrichedCount} de ${idsToEnrich.length} empresas enriquecidas${errors.length > 0 ? `. ${errors.length} erros.` : ''}`,
        variant: enrichedCount === 0 ? 'destructive' : 'default',
      });
      await refetch();
    } catch (error: any) {
      console.error('[Enriquecimento Website Massa] Erro:', error);
      toast({
        title: 'Erro ao enriquecer websites',
        description: error.message || 'Não foi possível enriquecer os websites',
        variant: 'destructive',
      });
    } finally {
      setIsEnrichingWebsite(false);
      setWebsiteEnrichmentProgress({ current: 0, total: 0 });
    }
  };

  const handleBatchEnrichReceitaWS = async () => {
    try {
      setIsBatchEnriching(true);
      
      // ✅ VERSÃO IDÊNTICA À QUARENTENA: Enriquecimento DIRETO no frontend
      const companiesToEnrich = selectedCompanies.length > 0
        ? companies.filter(c => selectedCompanies.includes(c.id) && c.cnpj)
        : companies.filter(c => c.cnpj);

      if (companiesToEnrich.length === 0) {
        toast.error('Nenhuma empresa com CNPJ para enriquecer');
        return;
      }

      toast.info(`⚡ Enriquecendo ${companiesToEnrich.length} empresas...`, {
        description: 'Consultando Receita Federal via BrasilAPI',
        id: 'batch-receita'
      });

      let enriched = 0;
      let skipped = 0;
      let errors = 0;

      for (const company of companiesToEnrich) {
        try {
          // Verificar se já tem dados (COMENTADO TEMPORARIAMENTE PARA TESTAR)
          // const hasReceitaData = (company as any).raw_data?.receita_federal || (company as any).raw_data?.receita;
          
          console.log(`[BATCH] ${company.company_name}:`, {
            cnpj: company.cnpj,
            raw_data: (company as any).raw_data ? Object.keys((company as any).raw_data) : 'undefined'
          });
          
          // ✅ FORÇAR RE-ENRIQUECIMENTO (para testar)
          // if (hasReceitaData) {
          //   console.log(`[BATCH] ⏭️ Pulando ${company.company_name} (já tem dados)`);
          //   skipped++;
          //   continue;
          // }

          // ✅ CHAMAR API DIRETAMENTE (como Quarentena)
          console.log(`[BATCH] 🔍 Enriquecendo ${company.company_name}...`);
          const result = await consultarReceitaFederal(company.cnpj!);

          if (!result.success) {
            console.error(`[BATCH] ❌ Falhou: ${company.company_name}`);
            errors++;
            continue;
          }

          // Atualizar dados
          const rawData = ((company as any).raw_data && typeof (company as any).raw_data === 'object' && !Array.isArray((company as any).raw_data)) 
            ? (company as any).raw_data as Record<string, any>
            : {};

          console.log(`[BATCH] 💾 Salvando dados de ${company.company_name}...`);
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              industry: result.data?.atividade_principal?.[0]?.text || (company as any).industry,
              raw_data: {
                ...rawData,
                receita_federal: result.data,
                receita_source: result.source,
              },
            })
            .eq('id', company.id);

          if (updateError) {
            console.error(`[BATCH] ❌ Erro ao salvar ${company.company_name}:`, updateError);
            throw updateError;
          }

          console.log(`[BATCH] ✅ ${company.company_name} enriquecida com sucesso!`);
          enriched++;
          
          // Delay para não sobrecarregar API
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`[BATCH] ❌ Exceção em ${company.company_name}:`, error);
          errors++;
        }
      }

      toast.dismiss('batch-receita');
      toast.success(
        `✅ Enriquecimento concluído! ${enriched} empresas atualizadas`,
        { description: `${skipped} já tinham dados · ${errors} erros` }
      );

      // ✅ FORÇAR ATUALIZAÇÃO IMEDIATA (como Quarentena)
      queryClient.invalidateQueries({ queryKey: ['enrichment-status'] });
      queryClient.invalidateQueries({ queryKey: ['all-enrichment-status'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      // Refetch manual
      await refetch();
    } catch (error) {
      console.error('Error batch enriching:', error);
      toast.error('Erro ao executar enriquecimento em lote');
    } finally {
      setIsBatchEnriching(false);
    }
  };

  const handleBatchEnrich360 = async () => {
    try {
      setIsBatchEnriching360(true);
      
      // ✅ OTIMIZAÇÃO: Apenas empresas SELECIONADAS ou com ICP Score alto
      const companiesToEnrich = selectedCompanies.length > 0
        ? companies.filter(c => selectedCompanies.includes(c.id))
        : companies; // Se nenhuma selecionada, faz todas (comportamento antigo)

      if (companiesToEnrich.length === 0) {
        toast.error('Nenhuma empresa para enriquecer');
        return;
      }

      // ⚠️ AVISO DE CUSTO
      const estimatedCost = companiesToEnrich.length * 1.5; // ~1-2 créditos/empresa
      
      toast.info(`⚡ Enriquecendo ${companiesToEnrich.length} empresas...`, {
        description: `Custo estimado: ${Math.round(estimatedCost)} créditos Serper`,
        duration: 5000
      });

      const { data, error } = await supabase.functions.invoke('batch-enrich-360', {
        body: { 
          force_refresh: false,
          company_ids: companiesToEnrich.map(c => c.id) // ✅ Enviar IDs específicos
        }
      });

      if (error) throw error;

      const summary = data;
      if (summary) {
        toast.success(
          `✅ Enriquecimento 360° concluído! ${summary.processed} empresas processadas`,
          { description: `${summary.skipped} puladas · ${summary.failed} erros · ~${Math.round(summary.processed * 1.5)} créditos usados` }
        );
      } else {
        toast.success('Enriquecimento 360° concluído!');
      }

      refetch();
      queryClient.invalidateQueries({ queryKey: ['enrichment-status'] });
      queryClient.invalidateQueries({ queryKey: ['all-enrichment-status'] });
    } catch (error) {
      console.error('Error batch enriching 360:', error);
      toast.error('Erro ao executar enriquecimento 360°');
    } finally {
      setIsBatchEnriching360(false);
    }
  };

  const [isBatchEnrichingApollo, setIsBatchEnrichingApollo] = useState(false);
  
  // ✅ MODAL DE PROGRESSO EM TEMPO REAL
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress[]>([]);
  const [cancelEnrichment, setCancelEnrichment] = useState(false);
  
  // ✅ MODAL DE BUSCA POR SÓCIOS
  const [partnerSearchOpen, setPartnerSearchOpen] = useState(false);

  const handleBatchEnrichApollo = async () => {
    try {
      setIsBatchEnrichingApollo(true);
      setCancelEnrichment(false);

      const companiesWithDomain = selectedCompanies.length > 0
        ? companies.filter(c => selectedCompanies.includes(c.id) && (c.website || c.domain))
        : companies.filter(c => c.website || c.domain);
      
      if (companiesWithDomain.length === 0) {
        toast.error('Nenhuma empresa com domínio disponível', {
          description: 'Adicione websites às empresas antes de enriquecer'
        });
        return;
      }

      // ✅ INICIALIZAR MODAL DE PROGRESSO
      const initialProgress: EnrichmentProgress[] = companiesWithDomain.map(c => ({
        companyId: c.id,
        companyName: c.company_name || c.name,
        status: 'pending',
      }));
      
      setEnrichmentProgress(initialProgress);
      setEnrichmentModalOpen(true);

      let enriched = 0;
      let errors = 0;

      for (let i = 0; i < companiesWithDomain.length; i++) {
        // ✅ VERIFICAR CANCELAMENTO
        if (cancelEnrichment) {
          toast.info('❌ Processo cancelado pelo usuário');
          break;
        }

        const company = companiesWithDomain[i];
        
        try {
          // ✅ ATUALIZAR STATUS: PROCESSANDO
          setEnrichmentProgress(prev => prev.map(p => 
            p.companyId === company.id 
              ? { ...p, status: 'processing', message: 'Buscando decisores no Apollo...' }
              : p
          ));

          const domain = sanitizeDomain(company.website || company.domain || null);
          if (!domain) {
            throw new Error('Domínio inválido');
          }

          // 🔥 EDGE FUNCTION Apollo com FILTROS INTELIGENTES
          const { error } = await supabase.functions.invoke('enrich-apollo-decisores', {
            body: { 
              company_id: company.id,
              company_name: company.company_name || company.name,
              domain: domain,
              modes: ['people', 'company'],
              city: (company as any).raw_data?.receita_federal?.municipio || (company as any).city,
              state: (company as any).raw_data?.receita_federal?.uf || (company as any).state,
              industry: company.industry,
              cep: (company as any).raw_data?.receita_federal?.cep || (company as any).raw_data?.cep,
              fantasia: (company as any).raw_data?.receita_federal?.fantasia || (company as any).raw_data?.nome_fantasia
            }
          });
          
          if (error) throw error;
          
          // ✅ ATUALIZAR STATUS: SUCESSO
          setEnrichmentProgress(prev => prev.map(p => 
            p.companyId === company.id 
              ? { ...p, status: 'success', message: 'Decisores identificados!' }
              : p
          ));
          
          enriched++;
        } catch (e: any) {
          console.error(`Error enriching ${company.company_name}:`, e);
          
          // ✅ ATUALIZAR STATUS: ERRO
          setEnrichmentProgress(prev => prev.map(p => 
            p.companyId === company.id 
              ? { ...p, status: 'error', message: e.message || 'Erro desconhecido' }
              : p
          ));
          
          errors++;
        }
      }

      if (!cancelEnrichment) {
        toast.success(
          `✅ Enriquecimento concluído! ${enriched} empresas processadas`,
          { description: `${errors} erros · 0 créditos consumidos` }
        );
      }
      
      refetch();
      queryClient.invalidateQueries({ queryKey: ['enrichment-status'] });
      queryClient.invalidateQueries({ queryKey: ['all-enrichment-status'] });
    } catch (error) {
      console.error('Error batch enriching:', error);
      toast.error('Erro ao executar enriquecimento em lote');
    } finally {
      setIsBatchEnrichingApollo(false);
    }
  };

  const handleSort = (field: 'name' | 'cnpj' | 'industry' | 'created_at' | 'cnpj_status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page when sorting
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const BOM = '\uFEFF';
      
      // Exportar apenas selecionadas, ou todas se nenhuma seleção
      const companiesToExport = selectedCompanies.length > 0
        ? companies.filter(c => selectedCompanies.includes(c.id))
        : companies;
      
      // 87 colunas completas
      const headers = [
        'CNPJ', 'Nome da Empresa', 'Nome Fantasia', 'Razão Social', 'Website', 'Domínio',
        'Instagram', 'LinkedIn', 'Facebook', 'Twitter', 'YouTube',
        'Setor', 'Porte', 'Natureza Jurídica', 'Funcionários', 'Faturamento Estimado',
        'Capital Social', 'Data de Abertura', 'Situação Cadastral', 'Data Situação',
        'Motivo Situação', 'Situação Especial', 'Data Situação Especial',
        'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 
        'Município', 'UF', 'País', 'Latitude', 'Longitude',
        'Telefone', 'Email', 'Email Verificado',
        'CNAE Principal Código', 'CNAE Principal Descrição',
        'CNAEs Secundários Quantidade', 'CNAEs Secundários',
        'Quadro Societário Quantidade', 'Sócios',
        'Score Maturidade Digital', 'Score Fit TOTVS', 'Score Análise',
        'Tech Stack', 'ERP Atual', 'CRM Atual',
        'Produto Principal', 'Marca', 'Link Produto/Marketplace', 'Categoria',
        'Decisores Quantidade', 'Decisor 1 Nome', 'Decisor 1 Cargo', 'Decisor 1 Email', 
        'Decisor 1 Telefone', 'Decisor 1 LinkedIn',
        'Decisor 2 Nome', 'Decisor 2 Cargo', 'Decisor 2 Email', 
        'Decisor 2 Telefone', 'Decisor 2 LinkedIn',
        'Decisor 3 Nome', 'Decisor 3 Cargo', 'Decisor 3 Email', 
        'Decisor 3 Telefone', 'Decisor 3 LinkedIn',
        'Enriquecido Receita', 'Enriquecido 360', 'Enriquecido Apollo', 'Enriquecido Phantom',
        'Data Criação', 'Data Última Atualização', 'Data Último Enriquecimento',
        'Status Enriquecimento', 'Fonte Enriquecimento',
        'Observações', 'Tags', 'Prioridade',
        'Último Contato', 'Próximo Contato', 'Status Pipeline',
        'Valor Oportunidade', 'Probabilidade Fechamento', 'Data Fechamento Esperada'
      ];
      
      const rows = companiesToExport.map(company => {
        const receitaData = (company as any)?.raw_data?.receita;
        const digitalPresence = (company as any)?.digital_presence;
        const decisors = (company as any)?.decision_makers || [];
        
        return [
          company.cnpj || '',
          company.name || '',
          receitaData?.fantasia || '',
          receitaData?.razao_social || company.name || '',
          company.website || '',
          company.domain || '',
          digitalPresence?.instagram || '',
          digitalPresence?.linkedin || '',
          digitalPresence?.facebook || '',
          digitalPresence?.twitter || '',
          digitalPresence?.youtube || '',
          company.industry || '',
          receitaData?.porte || '',
          receitaData?.natureza_juridica || '',
          company.employees || '',
          company.revenue || '',
          receitaData?.capital_social || '',
          receitaData?.abertura ? new Date(receitaData.abertura).toLocaleDateString('pt-BR') : '',
          receitaData?.situacao || '',
          receitaData?.data_situacao || '',
          receitaData?.motivo_situacao || '',
          receitaData?.situacao_especial || '',
          receitaData?.data_situacao_especial || '',
          receitaData?.cep || '',
          receitaData?.logradouro || '',
          receitaData?.numero || '',
          receitaData?.complemento || '',
          receitaData?.bairro || '',
          receitaData?.municipio || (company.location as any)?.city || '',
          receitaData?.uf || (company.location as any)?.state || '',
          receitaData?.pais || 'Brasil',
          (company.location as any)?.coordinates?.lat || '',
          (company.location as any)?.coordinates?.lng || '',
          receitaData?.telefone || '',
          receitaData?.email || '',
          receitaData?.email_status === 'verified' ? 'Sim' : 'Não',
          receitaData?.atividade_principal?.[0]?.code || '',
          receitaData?.atividade_principal?.[0]?.text || '',
          receitaData?.atividades_secundarias?.length || 0,
          receitaData?.atividades_secundarias?.map((a: any) => `${a.code} - ${a.text}`).join('; ') || '',
          receitaData?.qsa?.length || 0,
          receitaData?.qsa?.map((s: any) => `${s.nome} (${s.qual})`).join('; ') || '',
          company.digital_maturity_score || '',
          (company as any)?.fit_score || '',
          (company as any)?.analysis_score || '',
          (company as any)?.tech_stack?.join(', ') || '',
          (company as any)?.current_erp || '',
          (company as any)?.current_crm || '',
          (company as any)?.main_product || '',
          (company as any)?.brand || '',
          (company as any)?.product_link || '',
          (company as any)?.category || '',
          decisors.length || 0,
          decisors[0]?.name || '',
          decisors[0]?.title || '',
          decisors[0]?.email || '',
          decisors[0]?.phone || '',
          decisors[0]?.linkedin_url || '',
          decisors[1]?.name || '',
          decisors[1]?.title || '',
          decisors[1]?.email || '',
          decisors[1]?.phone || '',
          decisors[1]?.linkedin_url || '',
          decisors[2]?.name || '',
          decisors[2]?.title || '',
          decisors[2]?.email || '',
          decisors[2]?.phone || '',
          decisors[2]?.linkedin_url || '',
          (company as any)?.enriched_receita ? 'Sim' : 'Não',
          (company as any)?.enriched_360 ? 'Sim' : 'Não',
          (company as any)?.enriched_apollo ? 'Sim' : 'Não',
          (company as any)?.enriched_phantom ? 'Sim' : 'Não',
          company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : '',
          company.updated_at ? new Date(company.updated_at).toLocaleDateString('pt-BR') : '',
          (company as any)?.last_enrichment_at ? new Date((company as any).last_enrichment_at).toLocaleDateString('pt-BR') : '',
          (company as any)?.enrichment_status || '',
          (company as any)?.enrichment_source || '',
          (company as any)?.notes || '',
          (company as any)?.tags?.join(', ') || '',
          (company as any)?.priority || '',
          (company as any)?.last_contact_at ? new Date((company as any).last_contact_at).toLocaleDateString('pt-BR') : '',
          (company as any)?.next_contact_at ? new Date((company as any).next_contact_at).toLocaleDateString('pt-BR') : '',
          (company as any)?.pipeline_status || '',
          (company as any)?.opportunity_value || '',
          (company as any)?.close_probability || '',
          (company as any)?.expected_close_date ? new Date((company as any).expected_close_date).toLocaleDateString('pt-BR') : ''
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `empresas_completo_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      const count = companiesToExport.length;
      toast.success(selectedCompanies.length > 0 
        ? `CSV exportado: ${count} empresa(s) selecionada(s)!`
        : `CSV completo exportado: ${count} empresa(s)!`
      );
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLS = () => {
    try {
      setIsExporting(true);
      
      const data = companies.map(company => {
        const receitaData = (company as any)?.raw_data?.receita;
        const digitalPresence = (company as any)?.digital_presence;
        const decisors = (company as any)?.decision_makers || [];
        
        return {
          'CNPJ': company.cnpj || '',
          'Nome da Empresa': company.name || '',
          'Nome Fantasia': receitaData?.fantasia || '',
          'Razão Social': receitaData?.razao_social || company.name || '',
          'Website': company.website || '',
          'Domínio': company.domain || '',
          'Instagram': digitalPresence?.instagram || '',
          'LinkedIn': digitalPresence?.linkedin || '',
          'Facebook': digitalPresence?.facebook || '',
          'Twitter': digitalPresence?.twitter || '',
          'YouTube': digitalPresence?.youtube || '',
          'Setor': company.industry || '',
          'Porte': receitaData?.porte || '',
          'Natureza Jurídica': receitaData?.natureza_juridica || '',
          'Funcionários': company.employees || '',
          'Faturamento Estimado': company.revenue || '',
          'Capital Social': receitaData?.capital_social || '',
          'Data de Abertura': receitaData?.abertura ? new Date(receitaData.abertura).toLocaleDateString('pt-BR') : '',
          'Situação Cadastral': receitaData?.situacao || '',
          'Data Situação': receitaData?.data_situacao || '',
          'Motivo Situação': receitaData?.motivo_situacao || '',
          'Situação Especial': receitaData?.situacao_especial || '',
          'Data Situação Especial': receitaData?.data_situacao_especial || '',
          'CEP': receitaData?.cep || '',
          'Logradouro': receitaData?.logradouro || '',
          'Número': receitaData?.numero || '',
          'Complemento': receitaData?.complemento || '',
          'Bairro': receitaData?.bairro || '',
          'Município': receitaData?.municipio || (company.location as any)?.city || '',
          'UF': receitaData?.uf || (company.location as any)?.state || '',
          'País': receitaData?.pais || 'Brasil',
          'Latitude': (company.location as any)?.coordinates?.lat || '',
          'Longitude': (company.location as any)?.coordinates?.lng || '',
          'Telefone': receitaData?.telefone || '',
          'Email': receitaData?.email || '',
          'Email Verificado': receitaData?.email_status === 'verified' ? 'Sim' : 'Não',
          'CNAE Principal Código': receitaData?.atividade_principal?.[0]?.code || '',
          'CNAE Principal Descrição': receitaData?.atividade_principal?.[0]?.text || '',
          'CNAEs Secundários Quantidade': receitaData?.atividades_secundarias?.length || 0,
          'CNAEs Secundários': receitaData?.atividades_secundarias?.map((a: any) => `${a.code} - ${a.text}`).join('; ') || '',
          'Quadro Societário Quantidade': receitaData?.qsa?.length || 0,
          'Sócios': receitaData?.qsa?.map((s: any) => `${s.nome} (${s.qual})`).join('; ') || '',
          'Score Maturidade Digital': company.digital_maturity_score || '',
          'Score Fit TOTVS': (company as any)?.fit_score || '',
          'Score Análise': (company as any)?.analysis_score || '',
          'Tech Stack': (company as any)?.tech_stack?.join(', ') || '',
          'ERP Atual': (company as any)?.current_erp || '',
          'CRM Atual': (company as any)?.current_crm || '',
          'Produto Principal': (company as any)?.main_product || '',
          'Marca': (company as any)?.brand || '',
          'Link Produto/Marketplace': (company as any)?.product_link || '',
          'Categoria': (company as any)?.category || '',
          'Decisores Quantidade': decisors.length || 0,
          'Decisor 1 Nome': decisors[0]?.name || '',
          'Decisor 1 Cargo': decisors[0]?.title || '',
          'Decisor 1 Email': decisors[0]?.email || '',
          'Decisor 1 Telefone': decisors[0]?.phone || '',
          'Decisor 1 LinkedIn': decisors[0]?.linkedin_url || '',
          'Decisor 2 Nome': decisors[1]?.name || '',
          'Decisor 2 Cargo': decisors[1]?.title || '',
          'Decisor 2 Email': decisors[1]?.email || '',
          'Decisor 2 Telefone': decisors[1]?.phone || '',
          'Decisor 2 LinkedIn': decisors[1]?.linkedin_url || '',
          'Decisor 3 Nome': decisors[2]?.name || '',
          'Decisor 3 Cargo': decisors[2]?.title || '',
          'Decisor 3 Email': decisors[2]?.email || '',
          'Decisor 3 Telefone': decisors[2]?.phone || '',
          'Decisor 3 LinkedIn': decisors[2]?.linkedin_url || '',
          'Enriquecido Receita': (company as any)?.enriched_receita ? 'Sim' : 'Não',
          'Enriquecido 360': (company as any)?.enriched_360 ? 'Sim' : 'Não',
          'Enriquecido Apollo': (company as any)?.enriched_apollo ? 'Sim' : 'Não',
          'Enriquecido Phantom': (company as any)?.enriched_phantom ? 'Sim' : 'Não',
          'Data Criação': company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : '',
          'Data Última Atualização': company.updated_at ? new Date(company.updated_at).toLocaleDateString('pt-BR') : '',
          'Data Último Enriquecimento': (company as any)?.last_enrichment_at ? new Date((company as any).last_enrichment_at).toLocaleDateString('pt-BR') : '',
          'Status Enriquecimento': (company as any)?.enrichment_status || '',
          'Fonte Enriquecimento': (company as any)?.enrichment_source || '',
          'Observações': (company as any)?.notes || '',
          'Tags': (company as any)?.tags?.join(', ') || '',
          'Prioridade': (company as any)?.priority || '',
          'Último Contato': (company as any)?.last_contact_at ? new Date((company as any).last_contact_at).toLocaleDateString('pt-BR') : '',
          'Próximo Contato': (company as any)?.next_contact_at ? new Date((company as any).next_contact_at).toLocaleDateString('pt-BR') : '',
          'Status Pipeline': (company as any)?.pipeline_status || '',
          'Valor Oportunidade': (company as any)?.opportunity_value || '',
          'Probabilidade Fechamento': (company as any)?.close_probability || '',
          'Data Fechamento Esperada': (company as any)?.expected_close_date ? new Date((company as any).expected_close_date).toLocaleDateString('pt-BR') : ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
      
      // Auto-ajustar largura das colunas
      const maxWidth = 50;
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, 10))
      }));
      ws['!cols'] = colWidths;
      
      XLSX.writeFile(wb, `empresas_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel completo exportado com 87 colunas!');
    } catch (error) {
      console.error('Error exporting XLS:', error);
      toast.error('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório de Empresas', 14, 20);
      doc.setFontSize(11);
      doc.text(`Total: ${totalCount} empresas`, 14, 28);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

      const tableData = companies.map(company => [
        company.name,
        company.cnpj || 'N/A',
        (company as any).cnpj_status || 'pendente',
        company.industry || 'N/A',
        (company.location as any)?.state || 'N/A',
        company.digital_maturity_score ? `${company.digital_maturity_score}%` : 'N/A'
      ]);

      autoTable(doc, {
        head: [['Empresa', 'CNPJ', 'Status', 'Setor', 'UF', 'Score']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] }
      });

      doc.save(`empresas_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    try {
      setIsExporting(true);
      toast.info('Gerando imagem...', { description: 'Aguarde um momento' });
      
      const tableElement = document.querySelector('[data-testid="companies-table"]') as HTMLElement;
      if (!tableElement) {
        toast.error('Tabela não encontrada');
        return;
      }

      const canvas = await html2canvas(tableElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `empresas_${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          toast.success('Imagem exportada com sucesso!');
        }
      });
    } catch (error) {
      console.error('Error exporting PNG:', error);
      toast.error('Erro ao exportar imagem');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    toast.info('Atualizando dados...');
    await refetch();
    toast.success('Dados atualizados!');
  };

  const [stcDialogOpen, setStcDialogOpen] = useState(false);
  const [stcCompany, setStcCompany] = useState<any | null>(null);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <ErrorBoundary context="CompaniesManagement" onReset={() => window.location.reload()}>
      <AppLayout>
        <div className="p-8 space-y-6" data-testid="companies-table">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <BackButton className="mb-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gerenciar Empresas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, edite, exclua e enriqueça empresas cadastradas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* UnifiedEnrichButton - Visível para enriquecimento */}
            {selectedCompanies.length === 1 && (() => {
              const selectedCompany = companies.find(c => c.id === selectedCompanies[0]);
              if (!selectedCompany) return null;
              
              const totvsStatus = (selectedCompany as any)?.totvs_status;
              const isGO = totvsStatus === 'go' || totvsStatus === 'GO';
              
              return (
                <UnifiedEnrichButton
                  onQuickRefresh={async () => {
                    const companyId = selectedCompanies[0];
                    await handleEnrichReceita(companyId);
                  }}
                  onFullEnrich={async () => {
                    const companyId = selectedCompanies[0];
                    // ✅ FLUXO CORRETO: Sempre enriquecer Receita primeiro (sem verificar GO/NO-GO)
                    // Depois o usuário vai para Relatório STC → Aba TOTVS → Define GO/NO-GO
                    // Só então pode enriquecer Apollo se for GO
                    await handleEnrichReceita(companyId);
                    toast.info('✅ Receita Federal atualizada! Agora abra o Relatório STC → Aba TOTVS para verificar GO/NO-GO. Se GO, você poderá enriquecer Apollo.');
                  }}
                  onReceita={async () => {
                    const companyId = selectedCompanies[0];
                    await handleEnrichReceita(companyId);
                  }}
                  onApollo={isGO ? async () => {
                    // Apollo enriquecimento individual (só se GO)
                    // handleBatchEnrichApollo já usa selectedCompanies, que tem apenas 1 empresa aqui
                    await handleBatchEnrichApollo();
                  } : undefined}
                  on360={async () => {
                    const companyId = selectedCompanies[0];
                    await handleEnrich(companyId);
                  }}
                  isProcessing={isBatchEnriching || isBatchEnriching360 || !!enrichingReceitaId}
                  hasCNPJ={!!selectedCompany?.cnpj}
                  hasApolloId={!!(selectedCompany as any)?.apollo_organization_id}
                  variant="default"
                  size="sm"
                />
              );
            })()}
            
            <HeaderActionsMenu
              onUploadClick={() => {
                // ❌ REMOVIDO: Upload agora é APENAS no Motor de Qualificação
                toast.info('Upload movido para Motor de Qualificação', {
                  description: 'Vá para "Motor de Qualificação" → Upload CSV para importar empresas',
                  action: {
                    label: 'Ir Agora →',
                    onClick: () => navigate('/search')
                  },
                  duration: 6000
                });
              }}
              onBatchEnrichReceita={handleBatchEnrichReceitaWS}
              onBatchEnrich360={handleBatchEnrich360}
              onBatchEnrichApollo={handleBatchEnrichApollo}
              onSendToQuarantine={async () => {
                try {
                  // 🎯 USAR EMPRESAS SELECIONADAS OU FILTRADAS
                  const companiesToSend = selectedCompanies.length > 0
                    ? companies.filter(c => selectedCompanies.includes(c.id))
                    : companies; // Se nenhuma selecionada, usar todas as filtradas
                  
                  // ✅ CONFIRMAÇÃO ANTES DE ENVIAR
                  const confirmMessage = selectedCompanies.length > 0
                    ? `Enviar ${selectedCompanies.length} empresas SELECIONADAS para Quarentena ICP?`
                    : `Enviar TODAS as ${companiesToSend.length} empresas FILTRADAS para Quarentena ICP?\n\nFiltros ativos:\n${filterOrigin.length > 0 ? `• Origem: ${filterOrigin.join(', ')}\n` : ''}${filterStatus.length > 0 ? `• Status: ${filterStatus.join(', ')}\n` : ''}${filterSector.length > 0 ? `• Setor: ${filterSector.join(', ')}\n` : ''}${filterRegion.length > 0 ? `• UF: ${filterRegion.join(', ')}` : ''}`;
                  
                  if (!confirm(confirmMessage)) {
                    toast.info('Envio cancelado pelo usuário');
                    return;
                  }
                  
                  toast.info(`🎯 Movendo ${companiesToSend.length} empresas para Quarentena ICP...`, {
                    description: 'Todos os dados enriquecidos serão mantidos · Powered by OLV Internacional'
                  });

                  let sent = 0;
                  let skipped = 0;
                  let errors = 0;

                  for (const company of companiesToSend) {
                      try {
                        // 🔧 BUSCAR DADOS COMPLETOS DA EMPRESA (com CNPJ)
                        const { data: fullCompany, error: fetchError } = await supabase
                          .from('companies')
                          .select('*')
                          .eq('id', company.id)
                          .single();

                        if (fetchError || !fullCompany) {
                          console.error(`❌ Erro ao buscar empresa completa:`, fetchError);
                          errors++;
                          continue;
                        }

                        if (!fullCompany.cnpj) {
                          console.warn(`⚠️ Empresa ${fullCompany.company_name} sem CNPJ - pulando`);
                          skipped++;
                          continue;
                        }

                        // ✅ Verifica se já existe no ICP usando CNPJ (constraint UNIQUE)
                        const { data: existing, error: checkError } = await supabase
                          .from('icp_analysis_results')
                          .select('id, cnpj')
                          .eq('cnpj', fullCompany.cnpj)
                          .maybeSingle();

                        if (checkError) {
                          console.error(`❌ Erro ao verificar empresa ${fullCompany.company_name}:`, checkError);
                          errors++;
                          continue;
                        }

                        if (existing) {
                          console.log(`✓ Empresa ${fullCompany.company_name} (CNPJ: ${fullCompany.cnpj}) já está no ICP`);
                          skipped++;
                          continue;
                        }

                        // ✅ NORMALIZAR DADOS USANDO O NORMALIZADOR UNIVERSAL (garante preservação de TODOS os dados enriquecidos)
                        const normalized = normalizeFromCompanies(fullCompany);
                        
                        // ✅ PREPARAR DADOS PARA INSERÇÃO usando o normalizador (preserva TODOS os enriquecimentos)
                        const insertData = prepareForICPInsertion(normalized, tenant?.id || fullCompany.tenant_id);
                        
                        // ✅ ORIGEM: Priorizar origem do fullCompany, depois source_name, depois raw_data, depois default
                        // ⚠️ IMPORTANTE: icp_analysis_results.origem tem CHECK constraint que só permite:
                        // 'upload_massa', 'icp_individual', 'icp_massa'
                        // Se vier nome de arquivo ou outro valor, usar 'upload_massa'
                        const origemRaw = fullCompany.origem || 
                                         fullCompany.source_name || 
                                         (fullCompany.raw_data as any)?.origem || 
                                         (fullCompany.raw_data as any)?.source_name || 
                                         'upload_massa';
                        // Mapear para valores permitidos no CHECK constraint
                        const origem = (origemRaw === 'icp_individual' || origemRaw === 'icp_massa') 
                          ? origemRaw 
                          : 'upload_massa'; // Qualquer outro valor (incluindo nomes de arquivo) → 'upload_massa'
                        
                        // ✅ ADICIONAR METADADOS DE MIGRAÇÃO ao raw_analysis (PRESERVAR TUDO)
                        insertData.raw_analysis = {
                          ...insertData.raw_analysis,
                          // ✅ PRESERVAR ORIGEM ORIGINAL (nome do arquivo/API/Legacy) em raw_analysis
                          // ⚠️ NOTA: origem no campo direto deve ser 'upload_massa' (CHECK constraint)
                          // Mas preservamos a origem REAL em raw_analysis para exibição
                          origem_original: origemRaw, // ✅ ORIGEM REAL (nome do arquivo, etc.)
                          origem: origemRaw, // ✅ ORIGEM REAL também aqui para compatibilidade
                          source_name: origemRaw, // ✅ Nome do arquivo/API/Legacy
                          source_type: fullCompany.source_type || 'manual',
                          source_file_name: (fullCompany.raw_data as any)?.source_file_name || null,
                          job_name: (fullCompany.raw_data as any)?.job_name || null,
                          import_batch_id: fullCompany.import_batch_id || null,
                          migrated_from_companies: true,
                          migrated_at: new Date().toISOString(),
                          // ✅ PRESERVAR TODOS OS DADOS DE ENRIQUECIMENTO
                          website_enrichment: normalized.website_encontrado ? {
                            website_encontrado: normalized.website_encontrado,
                            website_fit_score: normalized.website_fit_score,
                            website_products_match: normalized.website_products_match,
                            linkedin_url: normalized.linkedin_url,
                          } : undefined,
                        };
                        
                        // ✅ GARANTIR QUE ORIGEM ESTEJA NO CAMPO DIRETO (valor permitido pelo CHECK constraint)
                        insertData.origem = origem; // 'upload_massa' ou 'icp_individual' ou 'icp_massa'
                        
                        // 🔥 DEBUG: Log do payload antes de inserir
                        console.log(`[ICP Integration] 📦 Inserindo ${normalized.razao_social}:`, {
                          cnpj: insertData.cnpj,
                          company_id: insertData.company_id,
                          tenant_id: insertData.tenant_id,
                          website_encontrado: insertData.website_encontrado,
                          website_fit_score: insertData.website_fit_score,
                          website_products_match: insertData.website_products_match?.length || 0,
                          linkedin_url: insertData.linkedin_url,
                          purchase_intent_score: insertData.purchase_intent_score,
                          fit_score: insertData.fit_score,
                          grade: insertData.raw_analysis?.grade,
                          status: insertData.status,
                          origem: insertData.origem,
                          has_raw_data: !!insertData.raw_data,
                          has_raw_analysis: !!insertData.raw_analysis
                        });

                        // Integra ao ICP com TODOS os campos necessários (incluindo TODOS os dados enriquecidos)
                        const { error: insertError } = await supabase
                          .from('icp_analysis_results')
                          .insert(insertData);

                        if (insertError) {
                          console.error(`❌ Erro ao inserir ${fullCompany.company_name} no ICP:`, insertError);
                          console.error(`   Detalhes do erro:`, {
                            message: insertError.message,
                            details: insertError.details,
                            hint: insertError.hint,
                            code: insertError.code
                          });
                          errors++;
                          continue; // ✅ Continuar com próxima empresa ao invés de quebrar tudo
                        }
                        
                        console.log(`✅ ${fullCompany.company_name} integrada ao ICP!`);
                        sent++;
                      } catch (e: any) {
                        console.error(`❌ Error integrating to ICP:`, e);
                        console.error(`   Stack trace:`, e.stack);
                        errors++;
                      }
                  }

                  toast.success(
                    `✅ ${sent} empresas movidas para Quarentena ICP!`,
                    { 
                      description: `${skipped} já estavam na quarentena · ${errors} erros · Acesse "4. Quarentena ICP" para revisar`,
                      action: {
                        label: 'Ver Quarentena →',
                        onClick: () => navigate('/leads/icp-quarantine')
                      },
                      duration: 6000
                    }
                  );

                  // Limpar seleção após enviar
                  if (selectedCompanies.length > 0) {
                    setSelectedCompanies([]);
                  }

                  refetch();
                } catch (error) {
                  console.error('Error integrating to ICP:', error);
                  toast.error('Erro ao integrar ao ICP');
                }
              }}
              onApolloImport={() => setIsApolloImportOpen(true)}
              onSearchCompanies={() => navigate('/search')}
              onPartnerSearch={() => setPartnerSearchOpen(true)}
              isProcessing={isBatchEnriching || isBatchEnriching360 || isBatchEnrichingApollo}
            />
            
            {/* ❌ REMOVIDO: Upload agora é APENAS no Motor de Qualificação (SearchPage) */}
          </div>
        </div>

        {/* Google Sheets Sync Config removido desta página (agora na tela de Busca) */}

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Empresas
            </CardTitle>
            <CardDescription>
              {totalCount} {totalCount === 1 ? 'empresa cadastrada' : 'empresas cadastradas'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por nome, CNPJ ou domínio..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0); // Reset to first page when searching
              }}
              className="max-w-md"
            />
            
            {/* Export Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || companies.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting || companies.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportXLS}
                disabled={isExporting || companies.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                XLS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPNG}
                disabled={isExporting || companies.length === 0}
              >
                <Image className="h-4 w-4 mr-2" />
                PNG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {/* ✅ BARRA DE AÇÕES WORLD-CLASS - PADRÃO QUARENTENA */}
            {companies.length > 0 && (
              <div className="flex items-center justify-between p-4 border-b">
                {/* LEFT: Contador + Estatísticas de Enriquecimento */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {paginatedCompanies.length} de {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
                  </span>
                  {selectedCompanies.length > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {selectedCompanies.length} selecionada{selectedCompanies.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {/* ✅ NOVO: Estatísticas de Enriquecimento */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const stats = filteredCompanies.reduce((acc, c) => {
                        const rawData = (c as any).raw_data || {};
                        if (rawData.receita_federal || rawData.receita) acc.receita++;
                        if (rawData.apollo_organization || rawData.apollo) acc.apollo++;
                        if (rawData.digital_intelligence || rawData.enrichment_360) acc.digital360++;
                        if (rawData.totvs_report) acc.totvs++;
                        return acc;
                      }, { receita: 0, apollo: 0, digital360: 0, totvs: 0 });
                      
                      return (
                        <>
                          {stats.receita > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/20">
                              🟢 {stats.receita} Receita
                            </span>
                          )}
                          {stats.apollo > 0 && (
                            <button
                              onClick={() => {
                                // Filtrar para mostrar apenas empresas com Apollo
                                const apolloFilter = filterEnrichment.includes('Apollo') ? [] : ['Apollo'];
                                setFilterEnrichment(apolloFilter);
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20 cursor-pointer transition-colors"
                            >
                              🟡 {stats.apollo} Apollo {filterEnrichment.includes('Apollo') && '✓'}
                            </button>
                          )}
                          {stats.digital360 > 0 && (
                            <button
                              onClick={() => {
                                const filter360 = filterEnrichment.includes('360° Digital') ? [] : ['360° Digital'];
                                setFilterEnrichment(filter360);
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer transition-colors"
                            >
                              🔵 {stats.digital360} 360° {filterEnrichment.includes('360° Digital') && '✓'}
                            </button>
                          )}
                          {stats.totvs > 0 && (
                            <button
                              onClick={() => {
                                const totvsFilter = filterEnrichment.includes('TOTVS Check') ? [] : ['TOTVS Check'];
                                setFilterEnrichment(totvsFilter);
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer transition-colors"
                            >
                              🟣 {stats.totvs} TOTVS {filterEnrichment.includes('TOTVS Check') && '✓'}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* RIGHT: Ações */}
                <div className="flex items-center gap-2">
                  {/* 🎯 Mover para Quarentena ICP (apenas se tiver seleção) */}
                  {selectedCompanies.length > 0 && (
                    <Button
                      onClick={async () => {
                  try {
                    toast.info('🎯 Movendo empresas para Quarentena ICP...', {
                      description: 'Todos os dados enriquecidos serão mantidos · Powered by OLV Internacional'
                    });

                    const selectedComps = selectedCompanies.length > 0
                      ? companies.filter(c => selectedCompanies.includes(c.id))
                      : companies;

                    if (selectedComps.length === 0) {
                      toast.error('Nenhuma empresa selecionada');
                      return;
                    }

                    let sent = 0;
                    let skipped = 0;
                    let errors = 0;

                    for (const company of selectedComps) {
                      try {
                        // 🔧 BUSCAR DADOS COMPLETOS DA EMPRESA (necessário para ter CNPJ)
                        const { data: fullCompany, error: fetchError } = await supabase
                          .from('companies')
                          .select('*')
                          .eq('id', company.id)
                          .single();

                        if (fetchError || !fullCompany) {
                          console.error(`❌ Erro ao buscar empresa completa:`, fetchError);
                          errors++;
                          continue;
                        }

                        if (!fullCompany.cnpj) {
                          console.warn(`⚠️ Empresa ${fullCompany.company_name} sem CNPJ - pulando`);
                          skipped++;
                          continue;
                        }

                        // ✅ Verifica se já existe no ICP usando CNPJ (constraint UNIQUE)
                        const { data: existing, error: checkError } = await supabase
                          .from('icp_analysis_results')
                          .select('id, cnpj')
                          .eq('cnpj', fullCompany.cnpj)
                          .maybeSingle();

                        if (checkError) {
                          console.error(`❌ Erro ao verificar empresa ${fullCompany.company_name}:`, checkError);
                          errors++;
                          continue;
                        }

                        if (existing) {
                          console.log(`✓ Empresa ${fullCompany.company_name} (CNPJ: ${fullCompany.cnpj}) já está no ICP`);
                          skipped++;
                          continue;
                        }

                        // 🔧 NORMALIZAR DADOS USANDO NORMALIZADOR UNIVERSAL
                        const normalized = normalizeFromCompanies(fullCompany);
                        const insertPayload = prepareForICPInsertion(normalized, tenant?.id || fullCompany.tenant_id);
                        
                        // 🔥 REMOVER raw_analysis se a coluna não existir (será detectado pelo erro)
                        // Por enquanto, vamos tentar inserir. Se falhar, vamos remover e tentar novamente
                        
                        // 🔥 DEBUG: Log do payload antes de inserir
                        console.log(`[ICP Integration] 📦 Inserindo ${fullCompany.company_name}:`, {
                          cnpj: insertPayload.cnpj,
                          company_id: insertPayload.company_id,
                          status: insertPayload.status,
                          origem: insertPayload.origem,
                          has_raw_data: !!insertPayload.raw_data,
                          has_raw_analysis: !!insertPayload.raw_analysis
                        });
                        
                        // 🔥 DEBUG: Log completo do payload
                        console.log(`[ICP Integration] 🔍 PAYLOAD COMPLETO:`, {
                          tenant_id: insertPayload.tenant_id,
                          company_id: insertPayload.company_id,
                          cnpj: insertPayload.cnpj,
                          razao_social: insertPayload.razao_social,
                          status: insertPayload.status,
                          origem: insertPayload.origem,
                          has_tenant_id: !!insertPayload.tenant_id,
                          tenant_id_type: typeof insertPayload.tenant_id
                        });
                        
                        // 🔥 TENTAR INSERIR COM raw_analysis
                        let { error: insertError } = await supabase
                          .from('icp_analysis_results')
                          .insert(insertPayload);

                        // 🔥 SE ERRO FOR POR COLUNA raw_analysis NÃO EXISTIR OU icp_id NO TRIGGER, REMOVER E TENTAR NOVAMENTE
                        if (insertError && (insertError.message?.includes('raw_analysis') || insertError.message?.includes('icp_id'))) {
                          console.warn(`⚠️ Coluna raw_analysis não existe. Removendo do payload e tentando novamente...`);
                          const { raw_analysis, ...payloadWithoutRawAnalysis } = insertPayload;
                          // Usar analysis_data como alternativa (se existir)
                          const fallbackPayload = {
                            ...payloadWithoutRawAnalysis,
                            analysis_data: rawAnalysis // Usar analysis_data ao invés de raw_analysis
                          };
                          
                          const { error: retryError } = await supabase
                            .from('icp_analysis_results')
                            .insert(fallbackPayload);
                          
                          if (retryError) {
                            insertError = retryError;
                          } else {
                            insertError = null; // Sucesso na segunda tentativa
                            console.log(`✅ Inserido com sucesso usando analysis_data ao invés de raw_analysis`);
                          }
                        }

                        if (insertError) {
                          console.error(`❌ Erro ao inserir ${fullCompany.company_name} no ICP:`, insertError);
                          console.error(`   Detalhes do erro:`, {
                            message: insertError.message,
                            details: insertError.details,
                            hint: insertError.hint,
                            code: insertError.code
                          });
                          console.error(`   🔍 PAYLOAD ENVIADO:`, JSON.stringify(insertPayload, null, 2));
                          console.error(`   🔍 TENANT_ID:`, insertPayload.tenant_id, `(tipo: ${typeof insertPayload.tenant_id})`);
                          console.error(`   🔍 TENANT DO CONTEXTO:`, tenant?.id);
                          console.error(`   🔍 TENANT_ID DA COMPANY:`, fullCompany.tenant_id);
                          
                          // 🚨 ERRO CRÍTICO: Mostrar toast com detalhes
                          toast.error(`Erro ao mover ${fullCompany.company_name} para Quarentena`, {
                            description: insertError.message || insertError.details || 'Erro desconhecido. Verifique o console para detalhes.',
                            duration: 10000
                          });
                          
                          errors++;
                          continue; // ✅ Continuar com próxima empresa ao invés de quebrar tudo
                        }
                        
                        console.log(`✅ ${fullCompany.company_name} integrada ao ICP!`);
                        sent++;
                      } catch (e: any) {
                        console.error(`❌ Error integrating to ICP:`, e);
                        console.error(`   Stack trace:`, e.stack);
                        errors++;
                      }
                    }

                    toast.success(
                      `✅ ${sent} empresas movidas para Quarentena ICP!`,
                      { 
                        description: `${skipped} já estavam na quarentena · ${errors} erros · Acesse "4. Quarentena ICP" para revisar`,
                        action: {
                          label: 'Ver Quarentena →',
                          onClick: () => navigate('/leads/icp-quarantine')
                        },
                        duration: 6000
                      }
                    );

                    refetch();
                    setSelectedCompanies([]);
                  } catch (error) {
                    console.error('Error integrating to ICP:', error);
                    toast.error('Erro ao integrar empresas ao ICP');
                  }
                      }}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                    >
                      <Target className="h-3.5 w-3.5 mr-1.5" />
                      🎯 Mover para Quarentena ICP ({selectedCompanies.length})
                    </Button>
                  )}

                  {/* Dropdown de Ações em Massa - SÓ APARECE COM SELEÇÃO */}
                  {selectedCompanies.length > 0 && (
                    <CompaniesActionsMenu
                      selectedCount={selectedCompanies.length}
                      onBulkDelete={handleBulkDelete}
                      onExport={handleExportCSV}
                      onBulkEnrichReceita={handleBatchEnrichReceitaWS}
                      onBulkEnrichApollo={handleBatchEnrichApollo}
                      onBulkEnrich360={handleBatchEnrich360}
                      isProcessing={isBatchEnriching || isBatchEnriching360 || isBatchEnrichingApollo}
                    />
                  )}

                  {/* Paginação */}
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(0);
                    }}
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
            )}

            {companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/search')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Empresa
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCompanies.length === companies.length && companies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-8 flex items-center gap-1"
                      >
                        Empresa
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('cnpj')}
                        className="h-8 flex items-center gap-1"
                      >
                        CNPJ
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <ColumnFilter
                        column="source_name"
                        title="Origem"
                        values={allCompanies.map(c => c.source_name)}
                        selectedValues={filterOrigin}
                        onFilterChange={setFilterOrigin}
                        onSort={() => handleSort('source_name')}
                      />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter
                        column="cnpj_status"
                        title="Status CNPJ"
                        values={allCompanies.map(c => {
                          const receitaData = (c as any).raw_data?.receita_federal || (c as any).raw_data;
                          let status = 'PENDENTE';
                          
                          if (receitaData) {
                            status = receitaData.situacao || receitaData.status || 'PENDENTE';
                            
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
                          
                          return status;
                        })}
                        selectedValues={filterStatus}
                        onFilterChange={setFilterStatus}
                        onSort={() => handleSort('cnpj_status')}
                      />
                    </TableHead>
                    <TableHead>
                      <ColumnFilter
                        column="industry"
                        title="Setor"
                        values={allCompanies.map(c => c.industry || (c as any).raw_data?.setor_amigavel || (c as any).raw_data?.atividade_economica || 'N/A')}
                        selectedValues={filterSector}
                        onFilterChange={setFilterSector}
                        onSort={() => handleSort('industry')}
                      />
                    </TableHead>
                     <TableHead>
                      <ColumnFilter
                        column="region"
                        title="UF"
                        values={allCompanies.map(c => (c as any).raw_data?.uf || '')}
                        selectedValues={filterRegion}
                        onFilterChange={setFilterRegion}
                      />
                     </TableHead>
                     <TableHead>
                      <ColumnFilter
                        column="icp"
                        title="ICP"
                        values={[...new Set(allCompanies.map(c => {
                          const rawData = (c as any).raw_data || {};
                          return rawData.best_icp_name || rawData.icp_name || 'Sem ICP';
                        }).filter(Boolean))]}
                        selectedValues={filterICP}
                        onFilterChange={setFilterICP}
                      />
                     </TableHead>
                     <TableHead>
                      <ColumnFilter
                        column="fit_score"
                        title="Fit Score"
                        values={['90-100', '75-89', '60-74', '40-59', '0-39']}
                        selectedValues={filterFitScore}
                        onFilterChange={setFilterFitScore}
                      />
                     </TableHead>
                     <TableHead>
                      <ColumnFilter
                        column="grade"
                        title="Grade"
                        values={['A+', 'A', 'B', 'C', 'D', 'Sem Grade']}
                        selectedValues={filterGrade}
                        onFilterChange={setFilterGrade}
                      />
                     </TableHead>
                    <TableHead>Intenção de Compra</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Website Fit</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.map((company) => (
                    <React.Fragment key={company.id}>
                    <TableRow className={expandedRow === company.id ? 'bg-muted/30' : ''}>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={() => toggleSelectCompany(company.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div>
                            <button
                              onClick={() => navigate(`/company/${company.id}`)}
                              className="font-medium hover:text-primary hover:underline text-left"
                            >
                              {(company as any).razao_social || company.name || (company as any).nome_fantasia || 'Sem nome'}
                            </button>
                            {company.domain && (
                              <p className="text-xs text-muted-foreground">{company.domain}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingCnpjId === company.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={cnpjInput}
                              onChange={(e) => setCnpjInput(e.target.value)}
                              placeholder="00000000000000"
                              className="h-7 w-[140px] text-xs"
                              maxLength={14}
                            />
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="h-7 px-2"
                              onClick={() => saveCnpj(company.id, cnpjInput)}
                            >
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2"
                              onClick={() => { 
                                setEditingCnpjId(null); 
                                setCnpjInput(''); 
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {company.cnpj ? (
                              <Badge variant="outline">{company.cnpj}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2"
                              onClick={() => { 
                                setEditingCnpjId(company.id); 
                                setCnpjInput(company.cnpj || ''); 
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(company as any).source_name ? (
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs"
                          >
                            {(company as any).source_name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Legacy
                          </Badge>
                        )}
                      </TableCell>
                       <TableCell>
                        {(() => {
                          // ✅ USAR COMPONENTE IDÊNTICO À QUARENTENA
                          const receitaData = (company as any).raw_data?.receita_federal || (company as any).raw_data?.receita;
                          const situacao = receitaData?.situacao || 
                                         receitaData?.descricao_situacao_cadastral || 
                                         receitaData?.situacao_cadastral;
                          
                          // Normalizar status para o componente
                          let cnpjStatus = 'pendente';
                          if (situacao) {
                            const sitUpper = situacao.toUpperCase();
                            if (sitUpper.includes('ATIVA')) cnpjStatus = 'ativa';
                            else if (sitUpper.includes('INAPTA') || sitUpper.includes('SUSPENSA') || sitUpper.includes('BAIXADA')) cnpjStatus = 'inativo';
                            else if (sitUpper.includes('NULA')) cnpjStatus = 'inexistente';
                          }
                          
                          return <QuarantineCNPJStatusBadge cnpj={company.cnpj || undefined} cnpjStatus={cnpjStatus} />;
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          // ✅ PRIORIZAR APOLLO INDUSTRY > RECEITA FEDERAL
                          const setor = (company as any).raw_data?.apollo_organization?.industry ||
                                       company.industry || 
                                       (company as any).raw_data?.receita_federal?.atividade_principal?.[0]?.text ||
                                       (company as any).raw_data?.receita?.atividade_principal?.[0]?.text ||
                                       (company as any).raw_data?.atividade_economica ||
                                       (company as any).raw_data?.setor_amigavel;
                          return setor ? (
                            <span className="text-xs">{setor}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Não identificado</span>
                          );
                        })()}
                      </TableCell>
                       <TableCell>
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const uf = (company.location as any)?.state || 
                                      (company as any).raw_data?.receita?.uf ||
                                      (company as any).raw_data?.uf;
                            const city = (company.location as any)?.city || 
                                        (company as any).raw_data?.receita?.municipio ||
                                        (company as any).raw_data?.municipio;
                            
                            if (uf) {
                              return (
                                <>
                                  <Badge variant="secondary" className="w-fit">
                                    {uf}
                                  </Badge>
                                  {city && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={city}>
                                      {city}
                                    </span>
                                  )}
                                </>
                              );
                            }
                            return <span className="text-xs text-muted-foreground">N/A</span>;
                          })()}
                        </div>
                      </TableCell>
                       {/* ✅ COLUNA ICP */}
                       <TableCell>
                         {(() => {
                           const rawData = (company as any).raw_data || {};
                           // ✅ LER icp_id de raw_data (onde foi salvo durante a migração)
                           const icpId = rawData.icp_id || (company as any).icp_id;
                           const icpName = rawData.best_icp_name || rawData.icp_name;
                           
                           // Se tiver icp_id mas não tiver nome, buscar do metadata
                           if (icpId && !icpName) {
                             // Tentar buscar do contexto ou usar fallback
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
                           
                           return <span className="text-xs text-muted-foreground">N/A</span>;
                         })()}
                       </TableCell>
                       {/* ✅ COLUNA FIT SCORE */}
                       <TableCell>
                         {(() => {
                           const rawData = (company as any).raw_data || {};
                           // ✅ LER fit_score de raw_data (onde foi salvo durante a migração)
                           const fitScore = rawData.fit_score ?? (company as any).fit_score ?? (company as any).icp_score ?? 0;
                           
                           if (fitScore != null && fitScore > 0) {
                             return (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <div className="flex items-center gap-2 cursor-help group">
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
                       </TableCell>
                       {/* ✅ COLUNA GRADE */}
                       <TableCell>
                         {(() => {
                           const rawData = (company as any).raw_data || {};
                           // ✅ LER grade de raw_data (onde foi salvo durante a migração)
                           const grade = rawData.grade || (company as any).grade;
                           
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
                       </TableCell>
                       {/* ✅ NOVA COLUNA: Purchase Intent */}
                       <TableCell>
                         <PurchaseIntentBadge 
                           score={(company as any).purchase_intent_score} 
                           intentType={(company as any).purchase_intent_type || 'potencial'}
                           size="sm"
                         />
                       </TableCell>
                       {/* ✅ NOVA COLUNA: Website */}
                       <TableCell>
                         {company.website_encontrado || company.website ? (
                           <a
                             href={company.website_encontrado || company.website}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-primary hover:underline flex items-center gap-1 text-xs"
                           >
                             <Globe className="h-3.5 w-3.5" />
                             <span className="truncate max-w-[120px]">{company.website_encontrado || company.website}</span>
                           </a>
                         ) : (
                           <span className="text-muted-foreground text-xs">-</span>
                         )}
                       </TableCell>
                       {/* ✅ NOVA COLUNA: Website Fit Score */}
                       <TableCell>
                         {company.website_fit_score != null && company.website_fit_score > 0 ? (
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Badge variant="secondary" className="bg-green-600/10 text-green-600 border-green-600/30 text-xs">
                                   +{company.website_fit_score}pts
                                 </Badge>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <div className="space-y-1">
                                   <p className="font-semibold">Website Fit Score: +{company.website_fit_score} pontos</p>
                                   {company.website_products_match && Array.isArray(company.website_products_match) && company.website_products_match.length > 0 && (
                                     <div className="text-xs mt-2">
                                       <p className="font-medium">Produtos compatíveis:</p>
                                       <ul className="list-disc list-inside mt-1 space-y-0.5">
                                         {company.website_products_match.slice(0, 3).map((match: any, idx: number) => (
                                           <li key={idx}>
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
                       <TableCell>
                         {company.linkedin_url ? (
                           <a
                             href={company.linkedin_url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-primary hover:underline flex items-center gap-1 text-xs"
                           >
                             <span className="truncate max-w-[100px]">LinkedIn</span>
                           </a>
                         ) : (
                           <span className="text-muted-foreground text-xs">-</span>
                         )}
                       </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <STCAgent 
                            companyId={company.id}
                            companyName={company.name || 'Empresa'}
                            cnpj={company.cnpj}
                          />
                          {/* ✅ Botão Eye para Modal de Preview com Website Fit Analysis */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setPreviewCompany(company);
                              setIsPreviewOpen(true);
                            }}
                            title="Ver Análise Estratégica de Fit"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <CompanyRowActions 
                            company={company}
                            onDelete={() => {
                              setCompanyToDelete(company);
                              setDeleteDialogOpen(true);
                            }}
                            onDiscoverCNPJ={!company.cnpj ? () => { 
                              setCnpjCompany(company); 
                              setCnpjDialogOpen(true); 
                            } : undefined}
                            onEnrichWebsite={() => handleEnrichWebsite(company.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* 🎨 LINHA EXPANDIDA COM CARD COMPLETO */}
                    {expandedRow === company.id && (
                      <TableRow>
                        <TableCell colSpan={11} className="bg-muted/20 p-0 border-t-0">
                          <ExpandedCompanyCard company={company} />
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {/* Paginação */}
            {companies.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {page * 50 + 1} - {Math.min((page + 1) * 50, totalCount)} de {totalCount}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm">
                      Página {page + 1} de {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ApolloImportDialog
          open={isApolloImportOpen}
          onOpenChange={setIsApolloImportOpen}
          onImportComplete={() => {
            setIsApolloImportOpen(false);
            refetch();
          }}
        />

        {cnpjCompany && (
          <CNPJDiscoveryDialog
            open={cnpjDialogOpen}
            onOpenChange={(open) => {
              setCnpjDialogOpen(open);
              if (!open) setCnpjCompany(null);
            }}
            company={cnpjCompany}
            onCNPJApplied={() => {
              setCnpjDialogOpen(false);
              setCnpjCompany(null);
              refetch();
            }}
          />
        )}


        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{companyToDelete?.name}</strong>?
                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Excluir
              </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>

          
        </div>

        {stcCompany && (
          <UsageVerificationDialog
            open={stcDialogOpen}
            onOpenChange={setStcDialogOpen}
            companyId={stcCompany.id}
            companyName={(stcCompany as any).razao_social || stcCompany.name}
            cnpj={stcCompany.cnpj}
            domain={stcCompany.domain || stcCompany.website}
          />
        )}
        
        {/* ✅ MODAL DE PROGRESSO EM TEMPO REAL */}
        <EnrichmentProgressModal
          open={enrichmentModalOpen}
          onOpenChange={setEnrichmentModalOpen}
          title="Enriquecimento Apollo - Decisores"
          companies={enrichmentProgress}
          onCancel={() => setCancelEnrichment(true)}
          isCancelling={cancelEnrichment}
        />
        
        {/* ✅ MODAL UNIFICADO: Usar componente CompanyPreviewModal */}
        {previewCompany && (
          <CompanyPreviewModal
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            company={previewCompany}
          />
        )}

        {/* ✅ MODAL DE BUSCA POR SÓCIOS */}
        <PartnerSearchModal
          open={partnerSearchOpen}
          onOpenChange={setPartnerSearchOpen}
          onImportCompanies={(companies) => {
            if (companies && companies.length > 0) {
              toast.success(`✅ ${companies.length} empresa(s) importada(s)!`, {
                description: 'Empresas adicionadas à base com sucesso'
              });
              refetch();
            }
          }}
        />
      </AppLayout>
    </ErrorBoundary>
  );
}
