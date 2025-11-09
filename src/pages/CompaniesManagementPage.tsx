import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/common/BackButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { logger } from '@/lib/utils/logger';
import { BulkUploadDialog } from '@/components/companies/BulkUploadDialog';
import { ApolloImportDialog } from '@/components/companies/ApolloImportDialog';
import { BulkActionsToolbar } from '@/components/companies/BulkActionsToolbar';
import { CompanyRowActions } from '@/components/companies/CompanyRowActions';
import { HeaderActionsMenu } from '@/components/companies/HeaderActionsMenu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EnrichmentStatusBadge } from '@/components/companies/EnrichmentStatusBadge';
import { SimpleTOTVSCheckDialog } from '@/components/intelligence/SimpleTOTVSCheckDialog';
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
import { Building2, Search, Edit, Trash2, Zap, Plus, Loader2, Eye, Sparkles, ArrowUpDown, CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw, FileText, Download, FileSpreadsheet, Image, Upload, Database, Target, Users, Globe } from 'lucide-react';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompanies, useDeleteCompany } from '@/hooks/useCompanies';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { CNPJDiscoveryDialog } from '@/components/companies/CNPJDiscoveryDialog';
import { formatWebsiteUrl, isValidUrl, extractDomain } from '@/lib/utils/urlHelpers';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';


export default function CompaniesManagementPage() {
  logger.info('CompaniesManagementPage mounted', 'CompaniesManagement');
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'cnpj' | 'industry' | 'created_at' | 'cnpj_status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 🔥 DEBOUNCE: Só busca após 500ms de inatividade
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const { data: companiesResult, isLoading: loading, refetch } = useCompanies({
    page,
    pageSize: 50,
    search: debouncedSearchTerm, // FIX: Usar debouncedSearchTerm
    sortBy,
    sortOrder,
  });
  
  const companies = companiesResult?.data || [];
  const totalCount = companiesResult?.count || 0;
  const totalPages = companiesResult?.totalPages || 0;
  
  const deleteCompany = useDeleteCompany();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [isBatchEnriching360, setIsBatchEnriching360] = useState(false);
  const [enrichingReceitaId, setEnrichingReceitaId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isBatchEnrichingEconodata, setIsBatchEnrichingEconodata] = useState(false);
  const [isApolloImportOpen, setIsApolloImportOpen] = useState(false);
  const hasSelection = selectedCompanies.length > 0;

  // Inline website editing state
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [websiteInput, setWebsiteInput] = useState<string>('');

  // CNPJ Discovery dialog state
  const [cnpjDialogOpen, setCnpjDialogOpen] = useState(false);
  const [cnpjCompany, setCnpjCompany] = useState<any | null>(null);

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

    try {
      setIsDeleting(true);
      await deleteCompany.mutateAsync(companyToDelete.id);
      toast.success('Empresa excluída com sucesso');
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

    try {
      setIsDeleting(true);
      
      // Delete all selected companies
      for (const companyId of selectedCompanies) {
        await deleteCompany.mutateAsync(companyId);
      }
      
      toast.success(`${selectedCompanies.length} empresa(s) excluída(s) com sucesso`);
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
    if (selectedCompanies.length === companies.length) {
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

  const handleBatchEnrichReceitaWS = async () => {
    try {
      setIsBatchEnriching(true);
      toast.info('Iniciando enriquecimento em lote com Receita Federal...', {
        description: 'Apenas empresas sem dados serão processadas'
      });

      const { data, error } = await supabase.functions.invoke('batch-enrich-receitaws', {
        body: { force_refresh: false }
      });

      if (error) throw error;

      const summary = data?.summary;
      if (summary) {
        toast.success(
          `Enriquecimento concluído! ${summary.enriched} empresas atualizadas, ${summary.skipped} já tinham dados, ${summary.errors} erros.`
        );
      } else {
        toast.success('Enriquecimento em lote concluído!');
      }

      refetch(); // Recarrega para ver os dados atualizados
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
      toast.info('Iniciando enriquecimento 360° completo...', {
        description: 'Apenas empresas sem análise completa serão processadas'
      });

      const { data, error } = await supabase.functions.invoke('batch-enrich-360', {
        body: { force_refresh: false }
      });

      if (error) throw error;

      const summary = data;
      if (summary) {
        toast.success(
          `Enriquecimento 360° concluído! ${summary.processed} empresas processadas, ${summary.skipped} já tinham análise, ${summary.failed} erros.`
        );
      } else {
        toast.success('Enriquecimento 360° concluído!');
      }

      refetch();
    } catch (error) {
      console.error('Error batch enriching 360:', error);
      toast.error('Erro ao executar enriquecimento 360°');
    } finally {
      setIsBatchEnriching360(false);
    }
  };

  const [isBatchEnrichingApollo, setIsBatchEnrichingApollo] = useState(false);

  const handleBatchEnrichApollo = async () => {
    try {
      setIsBatchEnrichingApollo(true);
      toast.info('Iniciando atualização Apollo...', {
        description: 'Buscando dados de decisores e contatos'
      });

      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: { 
          type: 'batch_enrich',
          company_ids: selectedCompanies.length > 0 ? selectedCompanies : undefined
        }
      });

      if (error) throw error;

      if (data?.processed) {
        toast.success(
          `Atualização Apollo concluída! ${data.processed} empresas processadas, ${data.failed || 0} erros.`
        );
      } else {
        toast.success('Atualização Apollo concluída!');
      }

      refetch();
    } catch (error) {
      console.error('Error batch enriching Apollo:', error);
      toast.error('Erro ao executar atualização Apollo');
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
            <HeaderActionsMenu
              onUploadClick={() => {
                const uploadBtn = document.getElementById('hidden-bulk-upload-trigger');
                uploadBtn?.click();
              }}
              onBatchEnrichReceita={handleBatchEnrichReceitaWS}
              onBatchEnrich360={handleBatchEnrich360}
              onBatchEnrichApollo={handleBatchEnrichApollo}
              onBatchEnrichEconodata={async () => {
                try {
                  setIsBatchEnrichingEconodata(true);
                  toast.info('Iniciando enriquecimento em lote com Eco-Booster...', {
                    description: 'Apenas empresas com CNPJ serão processadas'
                  });

                  const companiesWithCNPJ = companies.filter(c => c.cnpj);
                  let enriched = 0;
                  let errors = 0;

                  for (const company of companiesWithCNPJ) {
                    try {
                      const { error } = await supabase.functions.invoke('enrich-econodata', {
                        body: { companyId: company.id, cnpj: company.cnpj }
                      });
                      if (error) throw error;
                      enriched++;
                    } catch (e) {
                      console.error(`Error enriching ${company.name}:`, e);
                      errors++;
                    }
                  }

                  toast.success(
                    `Eco-Booster concluído! ${enriched} empresas atualizadas, ${errors} erros.`
                  );
                  refetch();
                } catch (error) {
                  console.error('Error batch enriching Econodata:', error);
                  toast.error('Erro ao executar Eco-Booster em lote');
                } finally {
                  setIsBatchEnrichingEconodata(false);
                }
              }}
              onApolloImport={() => setIsApolloImportOpen(true)}
              onSearchCompanies={() => navigate('/search')}
              isProcessing={isBatchEnriching || isBatchEnriching360 || isBatchEnrichingApollo || isBatchEnrichingEconodata}
            />
            
            {/* Hidden trigger for BulkUploadDialog */}
            <BulkUploadDialog>
              <button id="hidden-bulk-upload-trigger" className="hidden" aria-hidden="true" />
            </BulkUploadDialog>
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
            {/* Bulk Actions Toolbar */}
            {companies.length > 0 && (
              <BulkActionsToolbar
                selectedCount={selectedCompanies.length}
                totalCount={companies.length}
                onSelectAll={toggleSelectAll}
                onClearSelection={() => setSelectedCompanies([])}
                onBulkDelete={handleBulkDelete}
                onBulkEnrichReceita={handleBatchEnrichReceitaWS}
                onBulkEnrich360={handleBatchEnrich360}
                onBulkEnrichApollo={handleBatchEnrichApollo}
                onBulkEnrichEconodata={async () => {
                  try {
                    setIsBatchEnrichingEconodata(true);
                    toast.info('Iniciando enriquecimento em lote com Eco-Booster...');

                    const selectedComps = selectedCompanies.length > 0
                      ? companies.filter(c => selectedCompanies.includes(c.id) && c.cnpj)
                      : companies.filter(c => c.cnpj);
                      
                    let enriched = 0;
                    let errors = 0;

                    for (const company of selectedComps) {
                      try {
                        const { error } = await supabase.functions.invoke('enrich-econodata', {
                          body: { companyId: company.id, cnpj: company.cnpj }
                        });
                        if (error) throw error;
                        enriched++;
                      } catch (e) {
                        console.error(`Error enriching ${company.name}:`, e);
                        errors++;
                      }
                    }

                    toast.success(`Eco-Booster concluído! ${enriched} empresas atualizadas, ${errors} erros.`);
                    refetch();
                  } catch (error) {
                    console.error('Error batch enriching Econodata:', error);
                    toast.error('Erro ao executar Eco-Booster em lote');
                  } finally {
                    setIsBatchEnrichingEconodata(false);
                  }
                }}
                onExportSelected={handleExportCSV}
                isProcessing={isBatchEnriching || isBatchEnriching360 || isBatchEnrichingApollo || isBatchEnrichingEconodata}
              />
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('source_name')}
                        className="h-8 flex items-center gap-1"
                      >
                        Origem
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('cnpj_status')}
                        className="h-8 flex items-center gap-1"
                      >
                        Status CNPJ
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('industry')}
                        className="h-8 flex items-center gap-1"
                      >
                        Setor
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                     <TableHead>UF/Região</TableHead>
                     <TableHead>Score ICP</TableHead>
                     <TableHead>Status Análise</TableHead>
                     <TableHead>TOTVS Check</TableHead>
                     <TableHead>Website</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
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
                        {company.cnpj ? (
                          <Badge variant="outline">{company.cnpj}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
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
                          // VALIDAÇÃO RIGOROSA: Só verde se REALMENTE veio da ReceitaWS
                          const receitaData = (company as any).raw_data?.receita;
                          const enrichedFlag = (company as any).raw_data?.enriched_receita;
                          
                          // SÓ CONSIDERA ATIVO SE:
                          // 1. Flag enriched_receita = true
                          // 2. Objeto receita existe
                          // 3. Situacao = ATIVA
                          if (enrichedFlag === true && receitaData?.situacao === 'ATIVA') {
                            return (
                              <Badge className="gap-1 bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:hover:bg-lime-600">
                                <CheckCircle className="w-3 h-3" />
                                Ativo
                              </Badge>
                            );
                          }
                          
                          // Se enriquecido mas situação não é ATIVA
                          if (enrichedFlag === true && receitaData?.situacao) {
                            return (
                              <Badge variant="warning" className="gap-1 bg-red-600 text-white">
                                <AlertTriangle className="w-3 h-3" />
                                {receitaData.situacao}
                              </Badge>
                            );
                          }
                          
                          // Se não tem CNPJ
                          if (!company.cnpj) {
                            return (
                              <Badge variant="secondary" className="gap-1 bg-gray-500/10 text-gray-600 border-gray-500/20">
                                <Clock className="w-3 h-3" />
                                Sem CNPJ
                              </Badge>
                            );
                          }
                          
                          // PADRÃO: Pendente (aguardando enriquecimento)
                          return (
                            <Badge className="gap-1 bg-yellow-600 text-white dark:bg-yellow-500">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {company.industry || <span className="text-xs text-muted-foreground">N/A</span>}
                      </TableCell>
                       <TableCell>
                        <div className="flex flex-col gap-1">
                          {(company.location as any)?.state ? (
                            <>
                              <Badge variant="secondary" className="w-fit">
                                {(company.location as any).state}
                              </Badge>
                              {(company.location as any)?.city && (
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={(company.location as any).city}>
                                  {(company.location as any).city}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                          {(company as any).icp_score ? (
                            <Badge 
                              variant={(company as any).icp_score >= 70 ? 'success' : (company as any).icp_score >= 50 ? 'warning' : 'destructive'}
                              className="gap-1"
                            >
                              {(company as any).icp_score}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                       <TableCell>
                          <EnrichmentStatusBadge companyId={company.id} showProgress />
                        </TableCell>
                       <TableCell>
                       <Badge variant="secondary">
                         Verificar
                       </Badge>
                     </TableCell>
                        <TableCell>
                          {editingWebsiteId === company.id ? (
                            <div className="flex items-center gap-2 max-w-[180px]">
                              <Input
                                value={websiteInput}
                                onChange={(e) => setWebsiteInput(e.target.value)}
                                placeholder="empresa.com.br"
                                className="h-8 text-xs"
                              />
                              <Button size="sm" variant="secondary" className="h-8 px-2"
                                onClick={() => saveWebsite(company.id, websiteInput)}
                              >Salvar</Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2"
                                onClick={() => { setEditingWebsiteId(null); setWebsiteInput(''); }}
                              >Cancelar</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 max-w-[180px]">
                              {(() => {
                                const domain = sanitizeDomain(company.website || company.domain || null);
                                return domain ? (
                                  <a
                                    href={`https://${domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate"
                                    onClick={(e) => e.stopPropagation()}
                                    title={domain}
                                  >
                                    {domain}
                                    <Globe className="h-3 w-3 flex-shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground">N/A</span>
                                );
                              })()}
                              <Button size="sm" variant="ghost" className="h-7 px-2"
                                onClick={() => { 
                                  setEditingWebsiteId(company.id); 
                                  setWebsiteInput(sanitizeDomain(company.website || company.domain || null) || ''); 
                                }}
                              >Editar</Button>
                            </div>
                          )}
                       </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <STCAgent 
                            companyId={company.id}
                            companyName={company.name || 'Empresa'}
                            cnpj={company.cnpj}
                          />
                          <CompanyRowActions
                            company={company}
                            onDelete={() => {
                              setCompanyToDelete(company);
                              setDeleteDialogOpen(true);
                            }}
                          onEnrichReceita={() => handleEnrichReceita(company.id)}
                          onEnrich360={() => handleEnrich(company.id)}
                          onEnrichApollo={async () => {
                            try {
                              if (!company.name && !company.domain && !company.website) {
                                toast.error('Apollo requer nome ou domínio da empresa');
                                return;
                              }
                              
                              toast.info('Buscando decisores com Apollo...');
                              const { data, error } = await supabase.functions.invoke('enrich-apollo', {
                                body: { 
                                  organization_id: company.name,
                                  company_id: company.id,
                                  modes: ['people', 'company']
                                }
                              });
                              if (error) throw error;
                              toast.success('Dados Apollo atualizados!');
                              refetch();
                            } catch (error) {
                              console.error('Error enriching Apollo:', error);
                              toast.error('Erro ao buscar dados Apollo');
                            }
                          }}
                          onEnrichEconodata={async () => {
                            if (!company.cnpj) {
                              toast.error('CNPJ não disponível');
                              return;
                            }
                            try {
                              toast.info('Iniciando enriquecimento Eco-Booster...');
                              const { data, error } = await supabase.functions.invoke('enrich-econodata', {
                                body: { companyId: company.id, cnpj: company.cnpj }
                              });
                              if (error) throw error;
                              toast.success('Eco-Booster concluído!');
                              refetch();
                            } catch (error) {
                              console.error('Error enriching Econodata:', error);
                              toast.error('Erro no Eco-Booster');
                            }
                          }}
                          onDiscoverCNPJ={!company.cnpj ? () => { 
                            setCnpjCompany(company); 
                            setCnpjDialogOpen(true); 
                          } : undefined}
                        />
                        </div>
                      </TableCell>
                    </TableRow>
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
          <SimpleTOTVSCheckDialog
            open={stcDialogOpen}
            onOpenChange={setStcDialogOpen}
            companyId={stcCompany.id}
            companyName={(stcCompany as any).razao_social || stcCompany.name}
            cnpj={stcCompany.cnpj}
            domain={stcCompany.domain || stcCompany.website}
          />
        )}
      </AppLayout>
    </ErrorBoundary>
  );
}
