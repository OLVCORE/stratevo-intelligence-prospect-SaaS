import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Search, Trash2, Loader2, Eye, ArrowUpDown, 
  CheckCircle, XCircle, Clock, RefreshCw, FileText, Download, 
  FileSpreadsheet, Image, Target, ChevronDown, ChevronUp,
  MoreHorizontal, Flame, Snowflake, ThermometerSun, 
  ArrowRight, Filter, Zap, Database, Sparkles, Settings,
  Users, Globe, Upload, Bot, ExternalLink, Edit, FileBarChart,
  Lightbulb, AlertTriangle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTenant } from '@/contexts/TenantContext';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { createQualificationEngine } from '@/services/icpQualificationEngine';

interface Lead {
  id: string;
  cnpj: string;
  name: string;
  nome_fantasia?: string;
  razao_social?: string;
  icp_score?: number;
  temperatura?: 'hot' | 'warm' | 'cold';
  validation_status?: string;
  captured_at?: string;
  uf?: string;
  municipio?: string;
  setor?: string;
  capital_social?: number;
  porte?: string;
  cnae_principal?: string;
  situacao_cadastral?: string;
  best_icp_name?: string;
  decision_reason?: string;
  qualification_breakdown?: any;
  raw_data?: any;
}

interface LeadsQualificationTableProps {
  onLeadSelect?: (lead: Lead) => void;
  onRefresh?: () => void;
}

export function LeadsQualificationTable({ onLeadSelect, onRefresh }: LeadsQualificationTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  
  // Filtros
  const [filterTemperatura, setFilterTemperatura] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUF, setFilterUF] = useState<string>('all');
  
  // Ordenação
  const [sortBy, setSortBy] = useState<'icp_score' | 'name' | 'captured_at'>('icp_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Carregar dados diretamente de companies
  const loadLeads = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const { data: companiesData, error: cError } = await supabase
        .from('companies')
        .select('id, company_name, cnpj, industry, raw_data, created_at, headquarters_state, headquarters_city, tenant_id')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (!cError && companiesData) {
        const leadsData: Lead[] = companiesData.map((c: any) => {
          // Extrair dados de qualificação de raw_data
          const icpScore = c.raw_data?.icp_score ?? 30;
          const temperatura = c.raw_data?.temperatura || 
            (icpScore >= 70 ? 'hot' : icpScore >= 40 ? 'warm' : 'cold');
          
          return {
            id: c.id,
            cnpj: c.cnpj,
            name: c.company_name,
            nome_fantasia: c.raw_data?.fantasia || c.raw_data?.nome_fantasia,
            razao_social: c.company_name,
            icp_score: icpScore,
            temperatura: temperatura as 'hot' | 'warm' | 'cold',
            validation_status: c.raw_data?.decision || 'pending',
            captured_at: c.created_at,
            uf: c.headquarters_state || c.raw_data?.uf,
            municipio: c.headquarters_city || c.raw_data?.municipio,
            setor: c.industry || c.raw_data?.atividade_principal?.[0]?.text || c.raw_data?.cnae_descricao,
            capital_social: c.raw_data?.capital_social,
            porte: c.raw_data?.porte,
            cnae_principal: c.raw_data?.cnae_fiscal || c.raw_data?.cnae_principal,
            situacao_cadastral: c.raw_data?.situacao || c.raw_data?.situacao_cadastral,
            best_icp_name: c.raw_data?.best_icp_name,
            decision_reason: c.raw_data?.decision_reason,
            qualification_breakdown: c.raw_data?.qualification_breakdown,
            raw_data: c.raw_data
          };
        });
        
        console.log('[LeadsTable] ✅ Carregado:', leadsData.length, 'leads do tenant');
        setLeads(leadsData);
      } else if (cError) {
        console.error('[LeadsTable] ❌ Erro:', cError);
        setLeads([]);
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [tenantId, sortBy, sortOrder]);

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];
    
    // Busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.name?.toLowerCase().includes(term) ||
        l.cnpj?.includes(term) ||
        l.nome_fantasia?.toLowerCase().includes(term)
      );
    }
    
    // Filtro por temperatura
    if (filterTemperatura !== 'all') {
      filtered = filtered.filter(l => l.temperatura === filterTemperatura);
    }
    
    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(l => l.validation_status === filterStatus);
    }
    
    // Filtro por UF
    if (filterUF !== 'all') {
      filtered = filtered.filter(l => l.uf === filterUF);
    }
    
    return filtered;
  }, [leads, searchTerm, filterTemperatura, filterStatus, filterUF]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: filteredLeads.length,
    hot: filteredLeads.filter(l => l.temperatura === 'hot').length,
    warm: filteredLeads.filter(l => l.temperatura === 'warm').length,
    cold: filteredLeads.filter(l => l.temperatura === 'cold').length,
    approved: filteredLeads.filter(l => l.validation_status === 'approved').length,
    pending: filteredLeads.filter(l => l.validation_status === 'pending').length,
    avgScore: filteredLeads.length > 0 
      ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.icp_score || 0), 0) / filteredLeads.length)
      : 0
  }), [filteredLeads]);

  // UFs únicas para filtro
  const uniqueUFs = useMemo(() => {
    const ufs = new Set(leads.map(l => l.uf).filter(Boolean));
    return Array.from(ufs).sort();
  }, [leads]);

  // Seleção
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Helper para atualizar status em raw_data
  const updateLeadStatus = async (leadIds: string[], newStatus: string) => {
    // Para cada lead, atualizar o raw_data com o novo status
    for (const leadId of leadIds) {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) continue;
      
      const updatedRawData = {
        ...(lead.raw_data || {}),
        decision: newStatus,
        decision_updated_at: new Date().toISOString()
      };
      
      await supabase
        .from('companies')
        .update({ raw_data: updatedRawData })
        .eq('id', leadId);
    }
  };

  // Ações em lote
  const handleBulkApprove = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsProcessing(true);
    try {
      await updateLeadStatus(selectedLeads, 'approved');
      
      toast.success(`✅ ${selectedLeads.length} lead(s) aprovado(s)!`);
      setSelectedLeads([]);
      loadLeads();
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      toast.error('Erro ao aprovar leads');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsProcessing(true);
    try {
      await updateLeadStatus(selectedLeads, 'rejected');
      
      toast.success(`❌ ${selectedLeads.length} lead(s) rejeitado(s)`);
      setSelectedLeads([]);
      loadLeads();
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      toast.error('Erro ao rejeitar leads');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSendToQuarantine = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsProcessing(true);
    try {
      await updateLeadStatus(selectedLeads, 'quarantine');
      
      toast.success(`🔄 ${selectedLeads.length} lead(s) enviado(s) para quarentena`);
      setSelectedLeads([]);
      loadLeads();
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao enviar para quarentena');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedLeads.length} lead(s)?`)) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .in('id', selectedLeads);
      
      if (error) throw error;
      
      toast.success(`🗑️ ${selectedLeads.length} lead(s) excluído(s)`);
      setSelectedLeads([]);
      loadLeads();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao excluir leads');
    } finally {
      setIsProcessing(false);
    }
  };

  // Estado de enriquecimento
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [qualifyingId, setQualifyingId] = useState<string | null>(null);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);

  // Enriquecer com Receita Federal
  const handleEnrichReceita = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead?.cnpj) {
      toast.error('CNPJ não disponível');
      return;
    }

    setEnrichingId(leadId);
    try {
      const clean = lead.cnpj.replace(/\D/g, '');
      
      // Tentar API Brasil primeiro
      let receita: any = null;
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
        if (response.ok) {
          receita = await response.json();
        }
      } catch (e) {
        // Fallback para ReceitaWS
        try {
          const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${clean}`);
          if (response.ok) {
            receita = await response.json();
          }
        } catch (e2) {
          throw new Error('Todas as APIs falharam');
        }
      }

      if (receita) {
        const updatedRawData = {
          ...(lead.raw_data || {}),
          receita_federal: receita,
          enriched_receita: true,
          situacao: receita.situacao,
          capital_social: receita.capital_social,
          porte: receita.porte,
          nome_fantasia: receita.fantasia || receita.nome_fantasia,
          uf: receita.uf,
          municipio: receita.municipio,
          cnae_fiscal: receita.atividade_principal?.[0]?.code,
          cnae_descricao: receita.atividade_principal?.[0]?.text,
          enriched_at: new Date().toISOString()
        };

        await supabase
          .from('companies')
          .update({ 
            raw_data: updatedRawData,
            industry: receita.atividade_principal?.[0]?.text,
            headquarters_city: receita.municipio,
            headquarters_state: receita.uf
          })
          .eq('id', leadId);

        toast.success('✅ Dados da Receita Federal atualizados!');
        loadLeads();
      }
    } catch (error: any) {
      toast.error('Erro ao buscar Receita Federal', { description: error.message });
    } finally {
      setEnrichingId(null);
    }
  };

  // Enriquecimento 360° via Edge Function
  const handleEnrich360 = async (leadId: string) => {
    setEnrichingId(leadId);
    try {
      toast.info('🚀 Iniciando análise 360°...');
      
      const { data, error } = await supabase.functions.invoke('enrich-company-360', {
        body: { company_id: leadId }
      });

      if (error) throw error;

      toast.success('✅ Análise 360° concluída!');
      loadLeads();
    } catch (error: any) {
      toast.error('Erro na análise 360°', { description: error.message });
    } finally {
      setEnrichingId(null);
    }
  };

  // Requalificar com motor ICP
  const handleRequalify = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !tenantId) return;

    setQualifyingId(leadId);
    try {
      toast.info('🎯 Requalificando lead...');
      
      const engine = await createQualificationEngine(tenantId);
      const result = await engine.qualifyCompany({
        cnpj: lead.cnpj,
        razao_social: lead.name,
        nome_fantasia: lead.nome_fantasia,
        cnae_principal: lead.cnae_principal,
        capital_social: lead.capital_social,
        porte: lead.porte,
        uf: lead.uf,
        cidade: lead.municipio,
        situacao_cadastral: lead.situacao_cadastral
      });

      const updatedRawData = {
        ...(lead.raw_data || {}),
        icp_score: result.best_icp_score,
        temperatura: result.best_temperatura,
        decision: result.decision,
        decision_reason: result.decision_reason,
        best_icp_name: result.best_icp_name,
        qualification_breakdown: result.icp_scores?.[0]?.breakdown,
        requalified_at: new Date().toISOString()
      };

      await supabase
        .from('companies')
        .update({ raw_data: updatedRawData })
        .eq('id', leadId);

      const tempEmoji = result.best_temperatura === 'hot' ? '🔥' : 
                        result.best_temperatura === 'warm' ? '🌡️' : '❄️';
      
      toast.success(`${tempEmoji} Requalificado: Score ${result.best_icp_score}`, {
        description: result.decision_reason
      });
      loadLeads();
    } catch (error: any) {
      toast.error('Erro ao requalificar', { description: error.message });
    } finally {
      setQualifyingId(null);
    }
  };

  // Enviar para quarentena ICP (página de quarentena)
  const handleSendToICPQuarantine = async (leadIds: string[]) => {
    try {
      toast.info(`🎯 Enviando ${leadIds.length} lead(s) para Quarentena ICP...`);
      
      for (const leadId of leadIds) {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) continue;

        const updatedRawData = {
          ...(lead.raw_data || {}),
          sent_to_icp_quarantine: true,
          icp_quarantine_date: new Date().toISOString()
        };

        await supabase
          .from('companies')
          .update({ 
            raw_data: updatedRawData,
            pipeline_status: 'icp_quarantine'
          })
          .eq('id', leadId);
      }

      toast.success(`✅ ${leadIds.length} lead(s) enviado(s) para Quarentena ICP!`);
      setSelectedLeads([]);
      loadLeads();
    } catch (error: any) {
      toast.error('Erro ao enviar para quarentena', { description: error.message });
    }
  };

  // Enriquecimento em lote
  const handleBatchEnrichReceita = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsBatchEnriching(true);
    toast.info(`📡 Enriquecendo ${selectedLeads.length} empresas com Receita Federal...`);

    let success = 0;
    let errors = 0;

    for (const leadId of selectedLeads) {
      try {
        await handleEnrichReceita(leadId);
        success++;
      } catch (e) {
        errors++;
      }
    }

    setIsBatchEnriching(false);
    toast.success(`✅ Concluído: ${success} sucesso, ${errors} erros`);
  };

  const handleBatchRequalify = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsBatchEnriching(true);
    toast.info(`🎯 Requalificando ${selectedLeads.length} empresas...`);

    let success = 0;
    for (const leadId of selectedLeads) {
      try {
        await handleRequalify(leadId);
        success++;
      } catch (e) {
        // Continue
      }
    }

    setIsBatchEnriching(false);
    toast.success(`✅ ${success} empresas requalificadas!`);
  };

  // Exportação
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const leadsToExport = selectedLeads.length > 0 
      ? filteredLeads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;
    
    const headers = ['CNPJ', 'Razão Social', 'Nome Fantasia', 'Score ICP', 'Temperatura', 'Status', 'UF', 'Município', 'Setor', 'Capital Social', 'Porte', 'CNAE', 'Situação'];
    
    const rows = leadsToExport.map(l => [
      l.cnpj,
      l.razao_social || l.name,
      l.nome_fantasia || '',
      l.icp_score,
      l.temperatura,
      l.validation_status,
      l.uf || '',
      l.municipio || '',
      l.setor || '',
      l.capital_social || '',
      l.porte || '',
      l.cnae_principal || '',
      l.situacao_cadastral || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_qualificacao_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`CSV exportado: ${leadsToExport.length} leads`);
  };

  const handleExportXLS = () => {
    const leadsToExport = selectedLeads.length > 0 
      ? filteredLeads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;
    
    const data = leadsToExport.map(l => ({
      'CNPJ': l.cnpj,
      'Razão Social': l.razao_social || l.name,
      'Nome Fantasia': l.nome_fantasia || '',
      'Score ICP': l.icp_score,
      'Temperatura': l.temperatura,
      'Status': l.validation_status,
      'UF': l.uf || '',
      'Município': l.municipio || '',
      'Setor': l.setor || '',
      'Capital Social': l.capital_social || '',
      'Porte': l.porte || '',
      'CNAE': l.cnae_principal || '',
      'Situação Cadastral': l.situacao_cadastral || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, `leads_qualificacao_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(`Excel exportado: ${leadsToExport.length} leads`);
  };

  const handleExportPDF = () => {
    const leadsToExport = selectedLeads.length > 0 
      ? filteredLeads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Qualificação ICP', 14, 20);
    doc.setFontSize(11);
    doc.text(`Total: ${leadsToExport.length} leads`, 14, 28);
    doc.text(`HOT: ${stats.hot} | WARM: ${stats.warm} | COLD: ${stats.cold}`, 14, 34);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 40);

    const tableData = leadsToExport.map(l => [
      l.razao_social || l.name,
      l.cnpj,
      `${l.icp_score || 0}`,
      l.temperatura?.toUpperCase() || 'N/A',
      l.uf || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Empresa', 'CNPJ', 'Score', 'Temp', 'UF']],
      body: tableData,
      startY: 46,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`leads_qualificacao_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado!');
  };

  // Ordenação
  const handleSort = (column: 'icp_score' | 'name' | 'captured_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Componente de badge de temperatura
  const TemperatureBadge = ({ temp, score }: { temp?: string; score?: number }) => {
    const config = {
      hot: { icon: Flame, color: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'HOT' },
      warm: { icon: ThermometerSun, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'WARM' },
      cold: { icon: Snowflake, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', label: 'COLD' }
    };
    
    const t = temp || (score && score >= 70 ? 'hot' : score && score >= 40 ? 'warm' : 'cold');
    const { icon: Icon, color, label } = config[t as keyof typeof config] || config.cold;
    
    return (
      <Badge variant="outline" className={`${color} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou fantasia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filterTemperatura} onValueChange={setFilterTemperatura}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Temperatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="hot">🔥 HOT</SelectItem>
                  <SelectItem value="warm">🌡️ WARM</SelectItem>
                  <SelectItem value="cold">❄️ COLD</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="quarantine">Quarentena</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterUF} onValueChange={setFilterUF}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueUFs.map(uf => (
                    <SelectItem key={uf} value={uf!}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => { loadLeads(); onRefresh?.(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Menu de Ações em Massa */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Ações em Massa
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Enriquecimento em Lote</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={handleBatchEnrichReceita}
                      disabled={selectedLeads.length === 0 || isBatchEnriching}
                    >
                      <Database className="h-4 w-4 mr-2 text-blue-500" />
                      <div className="flex flex-col">
                        <span>Receita Federal (Lote)</span>
                        <span className="text-xs text-muted-foreground">Dados cadastrais oficiais</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleBatchRequalify}
                      disabled={selectedLeads.length === 0 || isBatchEnriching}
                    >
                      <Target className="h-4 w-4 mr-2 text-purple-500" />
                      <div className="flex flex-col">
                        <span>Requalificar ICP (Lote)</span>
                        <span className="text-xs text-muted-foreground">Recalcular score de todos</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Fluxo ICP</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => handleSendToICPQuarantine(selectedLeads)}
                      disabled={selectedLeads.length === 0}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                      <div className="flex flex-col">
                        <span>Enviar para Quarentena ICP</span>
                        <span className="text-xs text-muted-foreground">Análise manual detalhada</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        handleBulkApprove();
                      }}
                      disabled={selectedLeads.length === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <div className="flex flex-col">
                        <span>Aprovar e Integrar</span>
                        <span className="text-xs text-muted-foreground">Mover para Pipeline</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Exportação</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportXLS}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Exportar Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Relatório PDF
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {/* Barra de Ações */}
          {filteredLeads.length > 0 && (
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {filteredLeads.length} lead(s)
                  {selectedLeads.length > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      · {selectedLeads.length} selecionado(s)
                    </span>
                  )}
                </span>
                
                {/* Mini stats */}
                <div className="hidden md:flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                    🔥 {stats.hot}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    🌡️ {stats.warm}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    ❄️ {stats.cold}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Ações em lote */}
                {selectedLeads.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleBulkApprove}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar ({selectedLeads.length})
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkSendToQuarantine}
                      disabled={isProcessing}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Quarentena
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkReject}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleExportCSV}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportXLS}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Selecionados
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
                
                {/* Exportação rápida */}
                {selectedLeads.length === 0 && (
                  <div className="flex gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={handleExportCSV}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar CSV</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={handleExportXLS}>
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar Excel</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={handleExportPDF}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar PDF</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                
                {/* Paginação */}
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum lead encontrado' : 'Nenhum lead para qualificar'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Use a aba "Upload" para adicionar empresas
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedRow(null)}>
                      {expandedRow ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 gap-1">
                      Empresa <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('icp_score')} className="h-8 gap-1">
                      Score <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.slice(0, pageSize).map((lead) => (
                  <>
                    <TableRow 
                      key={lead.id} 
                      className={`${expandedRow === lead.id ? 'bg-muted/30' : ''} ${selectedLeads.includes(lead.id) ? 'bg-primary/5' : ''}`}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                        >
                          {expandedRow === lead.id ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleSelectLead(lead.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium truncate max-w-[200px]" title={lead.name}>
                              {lead.name}
                            </p>
                            {lead.nome_fantasia && lead.nome_fantasia !== lead.name && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {lead.nome_fantasia}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {lead.cnpj || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${lead.icp_score && lead.icp_score >= 70 ? 'bg-green-500' : lead.icp_score && lead.icp_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${lead.icp_score || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{lead.icp_score || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TemperatureBadge temp={lead.temperatura} score={lead.icp_score} />
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={lead.validation_status === 'approved' ? 'default' : lead.validation_status === 'rejected' ? 'destructive' : 'secondary'}
                        >
                          {lead.validation_status === 'approved' ? '✓ Aprovado' : 
                           lead.validation_status === 'rejected' ? '✗ Rejeitado' : 
                           lead.validation_status === 'quarantine' ? '⏳ Quarentena' : '• Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.uf ? (
                          <Badge variant="outline">{lead.uf}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs truncate max-w-[150px] block" title={lead.setor}>
                          {lead.setor || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Barra de Score Visual */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`w-10 h-6 rounded flex items-center justify-center text-xs font-bold cursor-help ${
                                  lead.icp_score && lead.icp_score >= 70 ? 'bg-green-500/20 text-green-600' :
                                  lead.icp_score && lead.icp_score >= 40 ? 'bg-amber-500/20 text-amber-600' :
                                  'bg-red-500/20 text-red-600'
                                }`}>
                                  {lead.icp_score || 0}%
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-bold">Score ICP: {lead.icp_score || 0}</p>
                                  {lead.best_icp_name && <p>ICP: {lead.best_icp_name}</p>}
                                  {lead.decision_reason && <p>{lead.decision_reason}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Botão Requalificar */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleRequalify(lead.id)}
                                  disabled={qualifyingId === lead.id || enrichingId === lead.id}
                                >
                                  {qualifyingId === lead.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Target className="h-4 w-4 text-purple-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Requalificar ICP</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* STC Agent Bot */}
                          <STCAgent
                            companyId={lead.id}
                            companyName={lead.name || 'Empresa'}
                            cnpj={lead.cnpj}
                          />
                          
                          {/* Menu de Ações */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Ações da Empresa</DropdownMenuLabel>
                              
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => onLeadSelect?.(lead)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/companies/${lead.id}`)}>
                                  <FileBarChart className="h-4 w-4 mr-2" />
                                  Relatório Executivo
                                </DropdownMenuItem>
                              </DropdownMenuGroup>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Enriquecimento</DropdownMenuLabel>
                              
                              <DropdownMenuGroup>
                                <DropdownMenuItem 
                                  onClick={() => handleEnrichReceita(lead.id)}
                                  disabled={enrichingId === lead.id}
                                >
                                  <Database className="h-4 w-4 mr-2 text-blue-500" />
                                  Receita Federal
                                  {enrichingId === lead.id && <Loader2 className="h-3 w-3 ml-auto animate-spin" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleEnrich360(lead.id)}
                                  disabled={enrichingId === lead.id}
                                >
                                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                                  360° Completo + IA
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRequalify(lead.id)}>
                                  <Target className="h-4 w-4 mr-2 text-amber-500" />
                                  Requalificar ICP
                                </DropdownMenuItem>
                              </DropdownMenuGroup>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Decisão</DropdownMenuLabel>
                              
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedLeads([lead.id]);
                                  handleBulkApprove();
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Aprovar para Pipeline
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendToICPQuarantine([lead.id])}>
                                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                                  Enviar p/ Quarentena ICP
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedLeads([lead.id]);
                                  handleBulkReject();
                                }}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Rejeitar / Descartar
                                </DropdownMenuItem>
                              </DropdownMenuGroup>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedLeads([lead.id]);
                                  handleBulkDelete();
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Permanentemente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Linha expandida */}
                    {expandedRow === lead.id && (
                      <TableRow key={`${lead.id}-expanded`}>
                        <TableCell colSpan={10} className="bg-muted/20 p-4">
                          <div className="space-y-4">
                            {/* Seção ICP Score */}
                            {(lead.best_icp_name || lead.decision_reason || lead.qualification_breakdown) && (
                              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
                                <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Análise ICP
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">ICP Match</p>
                                    <p className="font-medium text-purple-300">{lead.best_icp_name || 'Não qualificado'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Decisão</p>
                                    <Badge variant={
                                      lead.validation_status === 'approved' ? 'default' :
                                      lead.validation_status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                      {lead.validation_status === 'approved' ? '✓ Aprovado' :
                                       lead.validation_status === 'rejected' ? '✗ Rejeitado' :
                                       '⏳ Pendente'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Motivo</p>
                                    <p className="text-sm">{lead.decision_reason || 'Aguardando qualificação'}</p>
                                  </div>
                                </div>
                                
                                {/* Breakdown de Score */}
                                {lead.qualification_breakdown && (
                                  <div className="mt-3 pt-3 border-t border-purple-500/20">
                                    <p className="text-xs text-muted-foreground mb-2">Breakdown do Score</p>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(lead.qualification_breakdown as Record<string, number>).map(([key, value]) => (
                                        <Badge key={key} variant="outline" className="text-xs">
                                          {key}: {value}pts
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Dados Cadastrais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Município</p>
                                <p className="font-medium">{lead.municipio || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Capital Social</p>
                                <p className="font-medium">
                                  {lead.capital_social 
                                    ? `R$ ${Number(lead.capital_social).toLocaleString('pt-BR')}`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Porte</p>
                                <p className="font-medium">{lead.porte || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">CNAE Principal</p>
                                <p className="font-medium text-xs">{lead.cnae_principal || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Situação Cadastral</p>
                                <Badge variant={lead.situacao_cadastral?.toUpperCase().includes('ATIVA') ? 'default' : 'destructive'}>
                                  {lead.situacao_cadastral || 'N/A'}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Capturado em</p>
                                <p className="font-medium">
                                  {lead.captured_at 
                                    ? new Date(lead.captured_at).toLocaleDateString('pt-BR')
                                    : 'N/A'}
                                </p>
                              </div>
                              {lead.setor && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">Atividade Econômica</p>
                                  <p className="font-medium text-sm">{lead.setor}</p>
                                </div>
                              )}
                            </div>

                            {/* Ações Rápidas */}
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnrichReceita(lead.id)}
                                disabled={enrichingId === lead.id}
                                className="gap-2"
                              >
                                <Database className="h-4 w-4 text-blue-500" />
                                Receita Federal
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnrich360(lead.id)}
                                disabled={enrichingId === lead.id}
                                className="gap-2"
                              >
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                360° + IA
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequalify(lead.id)}
                                disabled={qualifyingId === lead.id}
                                className="gap-2"
                              >
                                <Target className="h-4 w-4 text-amber-500" />
                                Requalificar
                              </Button>
                              <STCAgent
                                companyId={lead.id}
                                companyName={lead.name || 'Empresa'}
                                cnpj={lead.cnpj}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

