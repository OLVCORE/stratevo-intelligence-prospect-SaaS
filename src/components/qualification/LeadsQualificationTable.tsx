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
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, Search, Trash2, Loader2, Eye, ArrowUpDown, 
  CheckCircle, XCircle, Clock, RefreshCw, FileText, Download, 
  FileSpreadsheet, Image, Target, ChevronDown, ChevronUp,
  MoreHorizontal, Flame, Snowflake, ThermometerSun, 
  ArrowRight, Filter, Zap
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTenant } from '@/contexts/TenantContext';

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

  // Carregar dados
  const loadLeads = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      let leadsData: Lead[] = [];
      
      // Tentar leads_quarantine primeiro (pode não existir)
      try {
        const { data: quarantineData, error: qError } = await supabase
          .from('leads_quarantine')
          .select('*')
          .eq('tenant_id', tenantId)
          .order(sortBy === 'name' ? 'name' : sortBy, { ascending: sortOrder === 'asc' })
          .limit(500);
        
        if (!qError && quarantineData && quarantineData.length > 0) {
          leadsData = quarantineData.map((l: any) => ({
            id: l.id,
            cnpj: l.cnpj,
            name: l.name || l.razao_social,
            nome_fantasia: l.nome_fantasia,
            razao_social: l.razao_social,
            icp_score: l.icp_score || 50,
            temperatura: l.temperatura || (l.icp_score >= 70 ? 'hot' : l.icp_score >= 40 ? 'warm' : 'cold'),
            validation_status: l.validation_status || 'pending',
            captured_at: l.captured_at,
            uf: l.uf || l.raw_data?.uf,
            municipio: l.municipio || l.raw_data?.municipio,
            setor: l.setor || l.raw_data?.atividade_principal?.[0]?.text,
            capital_social: l.capital_social || l.raw_data?.capital_social,
            porte: l.porte || l.raw_data?.porte,
            cnae_principal: l.cnae_principal || l.raw_data?.cnae_fiscal,
            situacao_cadastral: l.situacao_cadastral || l.raw_data?.situacao,
            raw_data: l.raw_data
          }));
        }
      } catch (e) {
        console.log('[LeadsTable] leads_quarantine não disponível, usando companies');
      }
      
      // Fallback para companies se não tem dados
      if (leadsData.length === 0) {
        try {
          const { data: companiesData, error: cError } = await supabase
            .from('companies')
            .select('id, company_name, cnpj, industry, raw_data, created_at, location')
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (!cError && companiesData) {
            leadsData = companiesData.map((c: any) => ({
              id: c.id,
              cnpj: c.cnpj,
              name: c.company_name,
              nome_fantasia: c.raw_data?.fantasia || c.raw_data?.nome_fantasia,
              razao_social: c.company_name,
              icp_score: 50,
              temperatura: 'warm' as const,
              validation_status: 'pending',
              captured_at: c.created_at,
              uf: c.raw_data?.uf || (c.location as any)?.state,
              municipio: c.raw_data?.municipio || (c.location as any)?.city,
              setor: c.industry || c.raw_data?.atividade_principal?.[0]?.text,
              capital_social: c.raw_data?.capital_social,
              porte: c.raw_data?.porte,
              cnae_principal: c.raw_data?.cnae_fiscal,
              situacao_cadastral: c.raw_data?.situacao,
              raw_data: c.raw_data
            }));
          }
        } catch (e) {
          console.log('[LeadsTable] Erro ao buscar companies:', e);
        }
      }
      
      setLeads(leadsData);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
      // Silenciar erro - mostrar tabela vazia
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

  // Ações em lote
  const handleBulkApprove = async () => {
    if (selectedLeads.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Mover para pipeline (aprovados)
      const { error } = await supabase
        .from('leads_quarantine')
        .update({ validation_status: 'approved' })
        .in('id', selectedLeads);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('leads_quarantine')
        .update({ validation_status: 'rejected' })
        .in('id', selectedLeads);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('leads_quarantine')
        .update({ validation_status: 'quarantine' })
        .in('id', selectedLeads);
      
      if (error) throw error;
      
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
        .from('leads_quarantine')
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => onLeadSelect?.(lead)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalhes</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedLeads([lead.id]);
                                handleBulkApprove();
                              }}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedLeads([lead.id]);
                                handleBulkSendToQuarantine();
                              }}>
                                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                                Enviar p/ Quarentena
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedLeads([lead.id]);
                                handleBulkReject();
                              }}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Rejeitar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedLeads([lead.id]);
                                  handleBulkDelete();
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Linha expandida */}
                    {expandedRow === lead.id && (
                      <TableRow>
                        <TableCell colSpan={10} className="bg-muted/20 p-4">
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

