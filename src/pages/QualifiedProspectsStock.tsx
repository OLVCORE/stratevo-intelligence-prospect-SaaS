/**
 * Estoque de Empresas Qualificadas
 * 
 * ✅ FLUXO OFICIAL: Buffer intermediário entre Motor de Qualificação e Banco de Empresas
 * - Mostra apenas empresas com pipeline_status = 'new'
 * - Única ação permitida: "Enviar para Banco de Empresas"
 * - Não permite ações diretas de quarentena/aprovação (isso é feito em Gerenciar Empresas)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Send,
  Eye,
  Loader2,
  Package,
  TrendingUp,
  Zap,
  Inbox,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QualifiedProspect {
  id: string;
  tenant_id: string;
  job_id: string;
  cnpj: string; // ✅ CNPJ normalizado (14 dígitos)
  cnpj_raw?: string; // ✅ CNPJ original (com máscara)
  razao_social: string;
  nome_fantasia?: string;
  cidade?: string;
  estado?: string;
  setor?: string;
  website?: string;
  fit_score: number;
  grade: string;
  pipeline_status: string;
  created_at: string;
  job?: {
    job_name: string;
    source_type: string;
  };
  icp?: {
    nome: string;
    description: string;
  };
  icp_id?: string;
  match_breakdown?: Array<{
    criteria: string;
    label: string;
    weight: number;
    matched: boolean;
    score: number;
  }>;
}

export default function QualifiedProspectsStock() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState<QualifiedProspect[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('new'); // ✅ FLUXO OFICIAL: apenas 'new' no Estoque
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [processing, setProcessing] = useState(false);
  const [previewProspect, setPreviewProspect] = useState<QualifiedProspect | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadProspects();
    }
  }, [tenantId, gradeFilter, sectorFilter, stateFilter, searchTerm]); // ✅ Removido statusFilter do useEffect (sempre 'new')

  const loadProspects = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // ✅ CORRIGIDO: Query simplificada sem join problemático com icp_profiles_metadata
      // O icp_id não tem FK, então buscamos ICP separadamente se necessário
      let query = ((supabase as any).from('qualified_prospects'))
        .select(`
          *,
          prospect_qualification_jobs (
            job_name,
            source_type
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('pipeline_status', 'new') // ✅ FLUXO OFICIAL: apenas empresas com status 'new'
        .order('fit_score', { ascending: false });

      // ✅ FLUXO OFICIAL: statusFilter sempre 'new' no Estoque (removido filtro de status)

      if (gradeFilter !== 'all') {
        query = query.eq('grade', gradeFilter);
      }

      if (sectorFilter !== 'all') {
        query = query.ilike('setor', `%${sectorFilter}%`);
      }

      if (stateFilter !== 'all') {
        query = query.eq('estado', stateFilter);
      }

      if (searchTerm) {
        query = query.or(
          `razao_social.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Estoque] Erro na query:', error);
        throw error;
      }

      // ✅ Buscar nomes dos ICPs separadamente (icp_id não tem FK)
      const prospectsData = (data || []) as any[];
      const icpIds = [...new Set(prospectsData.map(p => p.icp_id).filter(Boolean))];
      
      const icpMap: Record<string, { nome: string; description?: string }> = {};
      if (icpIds.length > 0) {
        const { data: icps } = await ((supabase as any).from('icp_profiles_metadata'))
          .select('id, nome, description')
          .in('id', icpIds);
        
        if (icps) {
          icps.forEach((icp: any) => {
            icpMap[icp.id] = { nome: icp.nome, description: icp.description };
          });
        }
      }

      // ✅ Enriquecer prospects com dados do ICP e parsear match_breakdown
      const enrichedProspects = prospectsData.map(p => {
        let matchBreakdown = null;
        if (p.match_breakdown) {
          try {
            matchBreakdown = typeof p.match_breakdown === 'string' 
              ? JSON.parse(p.match_breakdown) 
              : p.match_breakdown;
          } catch (e) {
            console.warn('[Estoque] Erro ao parsear match_breakdown:', e);
            matchBreakdown = null;
          }
        }
        
        return {
          ...p,
          icp: p.icp_id ? icpMap[p.icp_id] : undefined,
          match_breakdown: matchBreakdown,
        };
      });

      setProspects(enrichedProspects as any);
    } catch (error: any) {
      console.error('Erro ao carregar prospects:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar empresas qualificadas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(prospects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // ✅ FLUXO OFICIAL: Única ação permitida - "Enviar para Banco de Empresas"
  const handlePromoteToCompanies = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos uma empresa para enviar ao Banco de Empresas',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja enviar ${selectedIds.size} empresa(s) para o Banco de Empresas? Elas serão criadas/atualizadas na tabela companies.`)) {
      return;
    }

    if (!tenantId) {
      console.error('[Qualified → Companies] ❌ Tenant não definido');
      toast({
        title: 'Erro ao enviar',
        description: 'Tenant não definido. Recarregue a página e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const selectedProspects = prospects.filter(p => selectedIds.has(p.id));
      let promotedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      console.log('[Qualified → Companies] 📤 Iniciando envio de prospects para Banco de Empresas', {
        total: selectedProspects.length,
        tenant_id: tenantId,
      });

      for (const prospect of selectedProspects) {
        try {
          console.log('[Qualified → Companies] 🔍 Processando prospect', {
            prospect_id: prospect.id,
            cnpj: prospect.cnpj,
            razao_social: prospect.razao_social,
            tenant_id: tenantId,
          });

          // ✅ INTEGRAÇÃO: Chamar normalizador internacional (opcional, não trava o fluxo)
          let normalized = null;
          try {
            const { normalizeCompanyFromImport } = await import('@/services/internationalNormalizer');
            normalized = await normalizeCompanyFromImport({
              cnpj: prospect.cnpj,
              company_name: prospect.razao_social,
              fantasy_name: prospect.nome_fantasia,
              city: prospect.cidade,
              state: prospect.estado,
              sector: prospect.setor,
              website: prospect.website,
            });
            
            if (normalized) {
              console.log('[Qualified → Companies] ✅ Dados normalizados', normalized);
            }
          } catch (e) {
            console.warn('[Qualified → Companies] ⚠️ Falha no normalizador universal (continuando com dados originais)', e);
          }

          // ✅ MAPEAMENTO EXPLÍCITO: qualified_prospects → companies
          const companyName = normalized?.company_name ?? prospect.razao_social ?? prospect.nome_fantasia ?? null;
          const fantasyName = normalized?.fantasy_name ?? prospect.nome_fantasia ?? null;
          const city = normalized?.city ?? prospect.cidade ?? null;
          const state = normalized?.state ?? prospect.estado ?? null;
          const sector = normalized?.sector ?? prospect.setor ?? null;
          const website = normalized?.website ?? prospect.website ?? null;

          // ✅ VALIDAÇÃO: Se não houver nome, pular (não criar empresa inválida)
          if (!companyName) {
            console.warn('[Qualified → Companies] ⚠️ Prospect sem nome, pulando', {
              prospect_id: prospect.id,
              cnpj: prospect.cnpj,
            });
            errors.push(`CNPJ ${prospect.cnpj}: nome da empresa ausente`);
            continue;
          }

          // Buscar se já existe empresa com mesmo CNPJ
          const { data: existingCompany, error: existingError } = await ((supabase as any).from('companies'))
            .select('id, company_name')
            .eq('cnpj', prospect.cnpj)
            .eq('tenant_id', tenantId)
            .maybeSingle();

          if (existingError && existingError.code !== 'PGRST116') {
            console.error('[Qualified → Companies] ❌ Erro ao buscar empresa existente', {
              error: existingError,
              cnpj: prospect.cnpj,
            });
            errors.push(`CNPJ ${prospect.cnpj}: ${existingError.message}`);
            continue;
          }

          if (existingCompany?.id) {
            // ✅ Atualizar empresa existente
            console.log('[Qualified → Companies] 🔄 Atualizando empresa existente', {
              company_id: existingCompany.id,
              cnpj: prospect.cnpj,
            });

            const updatePayload: any = {
              company_name: companyName,
              name: companyName, // Campo obrigatório
              headquarters_city: city,
              headquarters_state: state,
              industry: sector,
              website: website,
              updated_at: new Date().toISOString(),
            };

            // Adicionar campos opcionais se existirem no schema
            if (prospect.fit_score !== undefined) {
              updatePayload.fit_score = prospect.fit_score;
            }
            if (prospect.grade) {
              updatePayload.grade = prospect.grade;
            }
            if (prospect.icp_id) {
              updatePayload.icp_id = prospect.icp_id;
            }

            const { error: updateError } = await ((supabase as any).from('companies'))
              .update(updatePayload)
              .eq('id', existingCompany.id);

            if (updateError) {
              console.error('[Qualified → Companies] ❌ Erro Supabase ao atualizar empresa', {
                error: updateError,
                payload: updatePayload,
                company_id: existingCompany.id,
              });
              errors.push(`CNPJ ${prospect.cnpj}: ${updateError.message}`);
              continue;
            }

            // Atualizar qualified_prospect com company_id e status
            const { error: prospectUpdateError } = await ((supabase as any).from('qualified_prospects'))
              .update({
                company_id: existingCompany.id,
                pipeline_status: 'sent_to_companies',
                updated_at: new Date().toISOString(),
              })
              .eq('id', prospect.id);

            if (prospectUpdateError) {
              console.warn('[Qualified → Companies] ⚠️ Erro ao atualizar qualified_prospect (empresa já atualizada)', prospectUpdateError);
            }

            console.log('[Qualified → Companies] ✅ Empresa atualizada em companies', {
              company_id: existingCompany.id,
              cnpj: prospect.cnpj,
            });

            updatedCount++;
          } else {
            // ✅ Criar nova empresa
            console.log('[Qualified → Companies] ➕ Criando nova empresa', {
              cnpj: prospect.cnpj,
              company_name: companyName,
            });

            const insertPayload: any = {
              tenant_id: tenantId,
              cnpj: prospect.cnpj,
              company_name: companyName,
              name: companyName, // Campo obrigatório
              headquarters_city: city,
              headquarters_state: state,
              industry: sector,
              website: website,
            };

            // Adicionar campos opcionais se existirem no schema
            if (prospect.fit_score !== undefined) {
              insertPayload.fit_score = prospect.fit_score;
            }
            if (prospect.grade) {
              insertPayload.grade = prospect.grade;
            }
            if (prospect.icp_id) {
              insertPayload.icp_id = prospect.icp_id;
            }
            if (prospect.job_id) {
              insertPayload.origem_job_id = prospect.job_id;
            }
            // Marcar origem
            insertPayload.origem = 'qualification_engine';

            const { data: newCompany, error: createError } = await ((supabase as any).from('companies'))
              .insert(insertPayload)
              .select('id, company_name, cnpj')
              .single();

            if (createError) {
              console.error('[Qualified → Companies] ❌ Erro Supabase ao inserir em companies', {
                error: createError,
                payload: insertPayload,
              });
              errors.push(`CNPJ ${prospect.cnpj}: ${createError.message}`);
              continue;
            }

            if (!newCompany?.id) {
              console.error('[Qualified → Companies] ❌ Insert retornou sem ID', {
                newCompany,
                cnpj: prospect.cnpj,
              });
              errors.push(`CNPJ ${prospect.cnpj}: empresa criada sem ID`);
              continue;
            }

            console.log('[Qualified → Companies] ✅ Empresa criada em companies', {
              company_id: newCompany.id,
              cnpj: newCompany.cnpj,
              company_name: newCompany.company_name,
            });

            // Atualizar qualified_prospect com company_id e status
            const { error: prospectUpdateError } = await ((supabase as any).from('qualified_prospects'))
              .update({
                company_id: newCompany.id,
                pipeline_status: 'sent_to_companies',
                updated_at: new Date().toISOString(),
              })
              .eq('id', prospect.id);

            if (prospectUpdateError) {
              console.warn('[Qualified → Companies] ⚠️ Erro ao atualizar qualified_prospect (empresa já criada)', prospectUpdateError);
            }

            promotedCount++;
          }
        } catch (err: any) {
          console.error('[Qualified → Companies] ❌ Erro inesperado ao processar prospect', {
            prospect_id: prospect.id,
            cnpj: prospect.cnpj,
            error: err,
          });
          errors.push(`CNPJ ${prospect.cnpj}: ${err?.message || 'Erro desconhecido'}`);
        }
      }

      // ✅ Toast com resultado detalhado
      if (errors.length > 0) {
        toast({
          title: '⚠️ Envio parcial',
          description: `${promotedCount} criada(s), ${updatedCount} atualizada(s). ${errors.length} erro(s).`,
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.error('[Qualified → Companies] 📋 Erros detalhados:', errors);
                alert(`Erros:\n${errors.join('\n')}`);
              }}
            >
              Ver Erros
            </Button>
          ),
        });
      } else {
        toast({
          title: '✅ Enviado para Banco de Empresas',
          description: `${promotedCount} empresa(s) criada(s), ${updatedCount} atualizada(s). Total: ${selectedIds.size}`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/companies')}
            >
              Ver Banco de Empresas
            </Button>
          ),
        });
      }

      console.log('[Qualified → Companies] ✅ Processamento concluído', {
        promotedCount,
        updatedCount,
        errors: errors.length,
      });

      setSelectedIds(new Set());
      loadProspects();
    } catch (error: any) {
      console.error('[Qualified → Companies] ❌ Erro inesperado ao enviar', error);
      toast({
        title: 'Erro inesperado',
        description: error?.message ?? 'Erro desconhecido ao enviar para Banco de Empresas.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getGradeBadge = (grade: string) => {
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
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'in_quarantine': 'bg-yellow-100 text-yellow-800',
      'in_base': 'bg-purple-100 text-purple-800',
      'discarded': 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      'new': 'Novo',
      'approved': 'Aprovado',
      'in_quarantine': 'Em Quarentena',
      'in_base': 'Na Base',
      'discarded': 'Descartado',
    };

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Estatísticas
  const stats = {
    total: prospects.length,
    new: prospects.filter(p => p.pipeline_status === 'new').length,
    approved: prospects.filter(p => p.pipeline_status === 'approved').length,
    inQuarantine: prospects.filter(p => p.pipeline_status === 'in_quarantine').length,
    avgFitScore: prospects.length > 0
      ? Math.round(prospects.reduce((sum, p) => sum + p.fit_score, 0) / prospects.length)
      : 0,
    gradeAplus: prospects.filter(p => p.grade === 'A+').length,
    gradeA: prospects.filter(p => p.grade === 'A').length,
    gradeB: prospects.filter(p => p.grade === 'B').length,
    gradeC: prospects.filter(p => p.grade === 'C').length,
    gradeD: prospects.filter(p => p.grade === 'D').length,
  };

  // Estados únicos para filtro
  const uniqueStates = Array.from(new Set(prospects.map(p => p.estado).filter(Boolean))).sort();
  const uniqueSectors = Array.from(new Set(prospects.map(p => p.setor).filter(Boolean))).sort();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Estoque de Empresas Qualificadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Empresas que passaram pelo motor de qualificação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProspects} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => navigate('/leads/qualification-engine')}>
            <Zap className="w-4 h-4 mr-2" />
            Motor de Qualificação
          </Button>
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <Database className="w-4 h-4 mr-2" />
            Banco de Empresas
          </Button>
          <Button onClick={() => navigate('/leads/prospecting-import')}>
            <Database className="w-4 h-4 mr-2" />
            Importar Empresas
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Novas</div>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Aprovadas</div>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Em Quarentena</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.inQuarantine}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Fit Score Médio</div>
              <div className="text-2xl font-bold text-purple-600">{stats.avgFitScore}%</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contadores por Grade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">A+</Badge>
                <div className="text-2xl font-bold mt-2">{stats.gradeAplus}</div>
              </div>
              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-800 text-lg px-3 py-1">A</Badge>
                <div className="text-2xl font-bold mt-2">{stats.gradeA}</div>
              </div>
              <div className="text-center">
                <Badge className="bg-yellow-100 text-yellow-800 text-lg px-3 py-1">B</Badge>
                <div className="text-2xl font-bold mt-2">{stats.gradeB}</div>
              </div>
              <div className="text-center">
                <Badge className="bg-orange-100 text-orange-800 text-lg px-3 py-1">C</Badge>
                <div className="text-2xl font-bold mt-2">{stats.gradeC}</div>
              </div>
              <div className="text-center">
                <Badge className="bg-red-100 text-red-800 text-lg px-3 py-1">D</Badge>
                <div className="text-2xl font-bold mt-2">{stats.gradeD}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Grades</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
            {/* ✅ FLUXO OFICIAL: Removido filtro de status - Estoque sempre mostra apenas 'new' */}
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                {uniqueSectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ações em lote */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedIds.size} empresa(s) selecionada(s)
              </span>
              <div className="flex gap-2">
                {/* ✅ FLUXO OFICIAL: Única ação permitida */}
                <Button
                  onClick={handlePromoteToCompanies}
                  disabled={processing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Enviar para Banco de Empresas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Qualificadas</CardTitle>
          <CardDescription>
            {prospects.length} empresa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma empresa encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === prospects.length && prospects.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>ICP</TableHead>
                    <TableHead>Fit Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(prospect.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(prospect.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {prospect.cnpj}
                      </TableCell>
                      <TableCell className="font-medium">
                        {prospect.razao_social}
                      </TableCell>
                      <TableCell>{prospect.nome_fantasia || '-'}</TableCell>
                      <TableCell>
                        {prospect.cidade && prospect.estado
                          ? `${prospect.cidade}/${prospect.estado}`
                          : prospect.estado || '-'}
                      </TableCell>
                      <TableCell>{prospect.setor || '-'}</TableCell>
                      <TableCell>
                        {prospect.icp?.nome ? (
                          <Badge variant="outline" className="text-xs">
                            {prospect.icp.nome}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{prospect.fit_score.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getGradeBadge(prospect.grade)}</TableCell>
                      <TableCell>
                        {prospect.job?.job_name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // ✅ FLUXO OFICIAL: Abrir modal de preview ao invés de navegar
                            setPreviewProspect(prospect);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ FLUXO OFICIAL: Modal de Preview da Empresa */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumo da Empresa Qualificada</DialogTitle>
            <DialogDescription>
              Detalhes da qualificação e critérios de matching
            </DialogDescription>
          </DialogHeader>
          {previewProspect && (
            <div className="space-y-4">
              {/* Cabeçalho */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">
                  {previewProspect.razao_social || previewProspect.nome_fantasia || 'Razão social não informada'}
                </h3>
                
                {/* ✅ CNPJ: Mostrar origem e normalizado */}
                <div className="mt-2 space-y-1">
                  {previewProspect.cnpj_raw ? (
                    <>
                      <p className="text-xs text-muted-foreground">CNPJ de origem (Excel):</p>
                      <p className="text-sm font-mono text-muted-foreground">{previewProspect.cnpj_raw}</p>
                      <p className="text-xs text-muted-foreground mt-1">CNPJ normalizado usado na análise:</p>
                      <p className="text-sm font-mono font-semibold">{previewProspect.cnpj}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">CNPJ normalizado:</p>
                      <p className="text-sm font-mono font-semibold">{previewProspect.cnpj}</p>
                    </>
                  )}
                </div>
                
                {previewProspect.nome_fantasia && (
                  <p className="text-sm text-muted-foreground mt-2">Nome Fantasia: {previewProspect.nome_fantasia}</p>
                )}
                
                {/* ✅ Mensagem sobre dados faltantes */}
                {(!previewProspect.razao_social && !previewProspect.nome_fantasia) && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                    ⚠️ Razão social não informada no lote e não encontrada nas fontes externas. Apenas CNPJ disponível.
                  </div>
                )}
              </div>

              {/* ICP e Grade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ICP Utilizado</p>
                  <p className="text-base">{previewProspect.icp?.nome || 'Não especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grade Final</p>
                  <div className="mt-1">{getGradeBadge(previewProspect.grade)}</div>
                </div>
              </div>

              {/* Fit Score */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fit Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{previewProspect.fit_score.toFixed(1)}%</span>
                </div>
              </div>

              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localização</p>
                  <p className="text-base">
                    {previewProspect.cidade && previewProspect.estado
                      ? `${previewProspect.cidade}/${previewProspect.estado}`
                      : previewProspect.estado || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Setor</p>
                  <p className="text-base">
                    {previewProspect.setor || (
                      <span className="text-muted-foreground italic">
                        Não informado no lote / não encontrado nas fontes externas
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* ✅ Mensagem sobre enrich (se dados faltarem) */}
              {(!previewProspect.setor || !previewProspect.cidade || !previewProspect.website) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                    ℹ️ Informação sobre dados faltantes
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Esta empresa não foi localizada nas bases externas para o CNPJ {previewProspect.cnpj}.
                    A qualificação foi feita apenas com os dados internos do lote de importação.
                  </p>
                </div>
              )}

              {/* Origem do Lote */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Origem do Lote</p>
                <p className="text-base">{previewProspect.job?.job_name || 'Não especificado'}</p>
                {previewProspect.job?.source_type && (
                  <Badge variant="outline" className="mt-1">
                    {previewProspect.job.source_type}
                  </Badge>
                )}
              </div>

              {/* ✅ Detalhamento de Matching com match_breakdown */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Detalhamento de Qualificação</p>
                {previewProspect.match_breakdown && Array.isArray(previewProspect.match_breakdown) && previewProspect.match_breakdown.length > 0 ? (
                  <div className="space-y-2">
                    {previewProspect.match_breakdown.map((item: any, idx: number) => (
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
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Este lote foi gerado antes da atualização do motor de qualificação. Os detalhes de matching não estão disponíveis para esta empresa.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Metodologia: classificação por Fit Score ponderado (Setor 30%, Localização 25%, Dados 20%, Website 15%, Contatos 10%).
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleSelectOne(previewProspect.id, true);
                  }}
                >
                  Selecionar Empresa
                </Button>
                <Button
                  onClick={async () => {
                    setIsPreviewOpen(false);
                    setSelectedIds(new Set([previewProspect.id]));
                    await handlePromoteToCompanies();
                  }}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Enviar para Banco de Empresas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


