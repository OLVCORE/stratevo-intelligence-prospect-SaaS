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
  Settings,
  MoreVertical,
  Trash2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { QualifiedStockActionsMenu } from '@/components/qualification/QualifiedStockActionsMenu';

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
  fit_score: number | null;
  grade: string | null;
  pipeline_status: string;
  created_at: string;
  source_name?: string; // ✅ Nome da Fonte
  source_metadata?: {
    campaign?: string; // ✅ Campanha
    [key: string]: any;
  };
  job?: {
    job_name: string;
    source_type: string;
    source_file_name?: string;
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
  enrichment?: {
    fantasia?: string | null;
    cnae_principal?: string | null;
    cnae_tipo?: string | null;
    data_quality?: string | null;
    fit_score?: number | null;
    grade?: string | null;
    origem?: string | null;
    raw?: any;
  } | null;
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
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [previewProspect, setPreviewProspect] = useState<QualifiedProspect | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    currentItem?: string;
  } | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadProspects();
    }
  }, [tenantId, gradeFilter, sectorFilter, stateFilter, searchTerm]); // ✅ Removido statusFilter do useEffect (sempre 'new')

  const loadProspects = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // ✅ CORRIGIDO: Query simplificada (JOIN será feito depois se a tabela existir)
      let query = ((supabase as any).from('qualified_prospects'))
        .select(`
          *,
          prospect_qualification_jobs (
            job_name,
            source_type,
            source_file_name
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
      if (icpIds.length > 0 && tenantId) {
        try {
          // ✅ CORRIGIDO: Filtrar por tenant_id para evitar erro 400 e garantir RLS
          const { data: icps, error: icpError } = await ((supabase as any).from('icp_profiles_metadata'))
            .select('id, nome, descricao')
            .eq('tenant_id', tenantId)
            .in('id', icpIds);
          
          if (icpError) {
            console.warn('[Estoque] Erro ao buscar ICPs (continuando sem ICP):', icpError);
          } else if (icps) {
            icps.forEach((icp: any) => {
              icpMap[icp.id] = { nome: icp.nome, description: icp.descricao };
            });
          }
        } catch (icpErr: any) {
          console.warn('[Estoque] Erro ao buscar ICPs (continuando sem ICP):', icpErr);
        }
      }

      // ✅ Buscar dados de enriquecimento separadamente (tabela pode não existir ainda)
      const prospectsDataWithIds = prospectsData.map(p => p.id);
      const enrichmentMap: Record<string, any> = {};
      
      if (prospectsDataWithIds.length > 0 && tenantId) {
        try {
          const { data: enrichments, error: enrichError } = await ((supabase as any)
            .from('qualified_stock_enrichment'))
            .select('*')
            .eq('tenant_id', tenantId)
            .in('stock_id', prospectsDataWithIds);
          
          if (!enrichError && enrichments) {
            enrichments.forEach((e: any) => {
              enrichmentMap[e.stock_id] = e;
            });
          } else if (enrichError && enrichError.code !== 'PGRST116') {
            // PGRST116 = tabela não existe (OK, migration não aplicada ainda)
            console.warn('[Estoque] Tabela qualified_stock_enrichment não encontrada (aplicar migration):', enrichError);
          }
        } catch (enrichErr: any) {
          console.warn('[Estoque] Erro ao buscar enriquecimentos (continuando sem):', enrichErr);
        }
      }

      // ✅ Enriquecer prospects com dados do ICP, enriquecimento e parsear match_breakdown
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
        
        // ✅ Buscar dados de enriquecimento do mapa
        const enrichment = enrichmentMap[p.id] || null;
        
        return {
          ...p,
          icp: p.icp_id ? icpMap[p.icp_id] : undefined,
          match_breakdown: matchBreakdown,
          enrichment: enrichment ? {
            fantasia: enrichment.fantasia,
            cnae_principal: enrichment.cnae_principal,
            cnae_tipo: enrichment.cnae_tipo,
            data_quality: enrichment.data_quality,
            fit_score: enrichment.fit_score,
            grade: enrichment.grade,
            origem: enrichment.origem,
            raw: enrichment.raw,
          } : null,
          // ✅ Usar fantasia do enriquecimento se disponível
          nome_fantasia: enrichment?.fantasia || p.nome_fantasia || null,
          // ✅ Usar fit_score e grade do enriquecimento se disponível
          fit_score: enrichment?.fit_score ?? p.fit_score ?? null,
          grade: enrichment?.grade || p.grade || null,
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

  // ✅ Ações em massa
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos uma empresa para deletar',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar ${selectedIds.size} empresa(s) selecionada(s)?`)) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await ((supabase as any).from('qualified_prospects'))
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: '✅ Empresas deletadas com sucesso!',
        description: `${selectedIds.size} empresa(s) foram removidas do estoque qualificado`,
      });

      setSelectedIds(new Set());
      await loadProspects();
    } catch (error: any) {
      console.error('[Bulk Delete] Erro:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message || 'Não foi possível deletar as empresas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (prospects.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Não há empresas para deletar',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nVocê está prestes a deletar TODAS as ${prospects.length} empresas do estoque qualificado.\n\nIsso também deletará:\n- Todos os candidatos relacionados\n- Todos os jobs de qualificação\n\nTem CERTEZA ABSOLUTA que deseja continuar?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Confirmação dupla
    if (!confirm('⚠️ ÚLTIMA CONFIRMAÇÃO: Você realmente deseja deletar TUDO? Esta ação não pode ser desfeita!')) {
      return;
    }

    setProcessing(true);
    try {
      // Deletar todos os prospects
      const { error: prospectsError } = await ((supabase as any).from('qualified_prospects'))
        .delete()
        .eq('tenant_id', tenantId)
        .eq('pipeline_status', 'new');

      if (prospectsError) throw prospectsError;

      // Deletar todos os candidatos relacionados
      const { error: candidatesError } = await ((supabase as any).from('prospecting_candidates'))
        .delete()
        .eq('tenant_id', tenantId);

      if (candidatesError) {
        console.warn('[Delete All] Erro ao deletar candidatos:', candidatesError);
      }

      // Deletar todos os jobs
      const { error: jobsError } = await ((supabase as any).from('prospect_qualification_jobs'))
        .delete()
        .eq('tenant_id', tenantId);

      if (jobsError) {
        console.warn('[Delete All] Erro ao deletar jobs:', jobsError);
      }

      toast({
        title: '✅ Todas as empresas foram deletadas!',
        description: `${prospects.length} empresa(s), candidatos e jobs foram removidos`,
        variant: 'destructive',
      });

      setSelectedIds(new Set());
      await loadProspects();
    } catch (error: any) {
      console.error('[Delete All] Erro:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message || 'Não foi possível deletar todas as empresas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkEnrichment = async () => {
    const idsToEnrich = selectedIds.size > 0 
      ? Array.from(selectedIds) 
      : prospects.filter(p => p.data_quality_status !== 'ok').map(p => p.id);

    if (idsToEnrich.length === 0) {
      toast({
        title: 'Atenção',
        description: selectedIds.size > 0 
          ? 'Nenhuma empresa selecionada para enriquecer'
          : 'Todas as empresas já estão enriquecidas',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setBulkProgress({ current: 0, total: idsToEnrich.length });
    try {
      toast({
        title: 'Enriquecendo empresas...',
        description: `Processando ${idsToEnrich.length} empresa(s)`,
      });

      let enrichedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < idsToEnrich.length; i++) {
        const prospectId = idsToEnrich[i];
        try {
          const prospect = prospects.find(p => p.id === prospectId);
          if (!prospect) {
            setBulkProgress({ current: i + 1, total: idsToEnrich.length, currentItem: 'Pulando...' });
            continue;
          }

          setBulkProgress({ 
            current: i + 1, 
            total: idsToEnrich.length, 
            currentItem: prospect.razao_social || prospect.cnpj 
          });

          const enriched = await consultarReceitaFederal(prospect.cnpj);
          
          if (enriched && enriched.success && enriched.data) {
            const data = enriched.data;
            const nomeFantasia = data.fantasia || data.nome_fantasia || null;
            
            const updateData: any = {
              razao_social: data.nome || data.razao_social || prospect.razao_social,
              nome_fantasia: nomeFantasia || prospect.nome_fantasia,
              cidade: data.municipio || prospect.cidade,
              estado: data.uf || prospect.estado,
              setor: data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor,
              website: data.website || prospect.website,
              data_quality_status: 'ok',
              updated_at: new Date().toISOString(),
            };

            const { error } = await ((supabase as any).from('qualified_prospects'))
              .update(updateData)
              .eq('id', prospectId);

            if (error) throw error;

            // ✅ RECALCULAR FIT_SCORE E GRADE após enriquecimento
            // Nota: O recálculo completo requer process_qualification_job, mas podemos atualizar dados básicos
            // O usuário deve rodar o motor de qualificação novamente para recalcular fit_score/grade completo
            
            enrichedCount++;
          }
        } catch (error: any) {
          const prospect = prospects.find(p => p.id === prospectId);
          console.error(`[Bulk Enrichment] Erro ao enriquecer prospect ${prospectId}:`, error);
          errors.push(`CNPJ ${prospect?.cnpj || prospectId}: ${error.message || 'Erro desconhecido'}`);
        }
      }

      if (errors.length > 0) {
        toast({
          title: '⚠️ Enriquecimento parcial',
          description: `${enrichedCount} empresa(s) enriquecida(s). ${errors.length} erro(s).`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Empresas enriquecidas com sucesso!',
          description: `${enrichedCount} empresa(s) foram atualizadas da Receita Federal. Para recalcular Fit Score e Grade, execute o Motor de Qualificação novamente.`,
          duration: 6000,
        });
      }

      await loadProspects();
    } catch (error: any) {
      console.error('[Bulk Enrichment] Erro:', error);
      toast({
        title: 'Erro ao enriquecer',
        description: error.message || 'Não foi possível enriquecer as empresas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setBulkProgress(null);
    }
  };

  const handleExportSelected = () => {
    const dataToExport = selectedIds.size > 0
      ? prospects.filter(p => selectedIds.has(p.id))
      : prospects;

    if (dataToExport.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Não há dados para exportar',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'CNPJ',
      'Razão Social',
      'Nome Fantasia',
      'Cidade',
      'Estado',
      'Setor',
      'Website',
      'Fit Score',
      'Grade',
      'ICP',
      'Origem',
      'Campanha',
    ];

    const rows = dataToExport.map(p => [
      p.cnpj || '',
      p.razao_social || '',
      p.nome_fantasia || '',
      p.cidade || '',
      p.estado || '',
      p.setor || '',
      p.website || '',
      p.fit_score?.toFixed(2) || 'Não calculado',
      p.grade || '-',
      p.icp?.nome || '-',
      p.source_name || p.job?.job_name || '-',
      p.source_metadata?.campaign || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas-qualificadas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '✅ Exportação concluída!',
      description: `${dataToExport.length} empresa(s) exportada(s)`,
    });
  };

  const getGradeBadge = (grade: string | null | undefined) => {
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
  };

  // ✅ Ações individuais
  const handleIndividualEnrich = async (prospectId: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect || !tenantId) return;

    setEnrichingIds(prev => new Set(prev).add(prospectId));
    try {
      toast({
        title: 'Enriquecendo empresa...',
        description: 'Buscando dados atualizados da Receita Federal',
      });
      
      const enriched = await consultarReceitaFederal(prospect.cnpj, {
        stockId: prospectId,
        tenantId: tenantId!,
        saveEnrichment: true, // ✅ PERSISTIR automaticamente
      });
      
      if (enriched && enriched.success && enriched.data) {
        const data = enriched.data;
        // ✅ CRITÉRIO IGUAL AO INLINESEARCH: usar fantasia da Receita Federal
        const nomeFantasia = data.fantasia || data.nome_fantasia || null;
        
        const updateData: any = {
          razao_social: data.nome || data.razao_social || prospect.razao_social,
          nome_fantasia: nomeFantasia || prospect.nome_fantasia, // ✅ Usar fantasia da Receita Federal
          cidade: data.municipio || prospect.cidade,
          estado: data.uf || prospect.estado,
          setor: data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor,
          website: data.website || prospect.website,
          data_quality_status: 'ok',
          updated_at: new Date().toISOString(),
        };

        const { error } = await ((supabase as any).from('qualified_prospects'))
          .update(updateData)
          .eq('id', prospectId);

        if (error) throw error;

        toast({
          title: '✅ Empresa enriquecida com sucesso!',
          description: 'Dados atualizados da Receita Federal',
        });
        await loadProspects();
      }
    } catch (error: any) {
      console.error('[Enriquecimento Individual] Erro:', error);
      toast({
        title: 'Erro ao enriquecer',
        description: error.message || 'Não foi possível enriquecer a empresa',
        variant: 'destructive',
      });
    } finally {
      setEnrichingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(prospectId);
        return newSet;
      });
    }
  };

  const handleUpdateReceitaFederal = async (prospectId: string) => {
    await handleIndividualEnrich(prospectId);
  };

  const handleDeleteIndividual = async (prospectId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta empresa do estoque qualificado?')) {
      return;
    }

    try {
      const { error } = await ((supabase as any).from('qualified_prospects'))
        .delete()
        .eq('id', prospectId);

      if (error) throw error;

      toast({
        title: '✅ Empresa deletada com sucesso!',
        description: 'A empresa foi removida do estoque qualificado',
      });
      await loadProspects();
    } catch (error: any) {
      console.error('[Delete Individual] Erro:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message || 'Não foi possível deletar a empresa',
        variant: 'destructive',
      });
    }
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
          <Button onClick={() => navigate('/leads/qualification-engine')}>
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
              <QualifiedStockActionsMenu
                selectedCount={selectedIds.size}
                totalCount={prospects.length}
                onBulkDelete={handleBulkDelete}
                onDeleteAll={handleDeleteAll}
                onBulkEnrichment={handleBulkEnrichment}
                onPromoteToCompanies={handlePromoteToCompanies}
                onExportSelected={handleExportSelected}
                isProcessing={processing}
              />
            </div>
            {/* Barra de Progresso para Ações em Massa */}
            {bulkProgress && bulkProgress.total > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {bulkProgress.currentItem && (
                      <span className="font-medium">Processando: {bulkProgress.currentItem}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {bulkProgress.current} / {bulkProgress.total}
                  </span>
                </div>
                <Progress 
                  value={(bulkProgress.current / bulkProgress.total) * 100} 
                  className="h-2"
                />
              </div>
            )}
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
                      <TableCell>
                        {/* ✅ Usar fantasia do enriquecimento ou do prospect */}
                        {(() => {
                          const fantasia = prospect.enrichment?.fantasia || prospect.nome_fantasia;
                          if (fantasia && 
                              fantasia.trim() !== '' && 
                              fantasia.trim().toUpperCase() !== prospect.razao_social?.trim().toUpperCase()) {
                            return fantasia;
                          }
                          return '-';
                        })()}
                      </TableCell>
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
                        {/* ✅ Usar fit_score do enriquecimento ou do prospect */}
                        {(() => {
                          const fitScore = prospect.enrichment?.fit_score ?? prospect.fit_score;
                          if (fitScore != null && fitScore > 0) {
                            return (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{fitScore.toFixed(1)}%</span>
                              </div>
                            );
                          }
                          return <span className="text-muted-foreground text-sm">Não calculado</span>;
                        })()}
                      </TableCell>
                      <TableCell>
                        {/* ✅ Usar grade do enriquecimento ou do prospect */}
                        {(() => {
                          const grade = prospect.enrichment?.grade || prospect.grade;
                          return grade ? getGradeBadge(grade) : <Badge variant="outline">-</Badge>;
                        })()}
                      </TableCell>
                      <TableCell>
                        {/* ✅ Usar origem do enriquecimento ou source_name/job */}
                        {(() => {
                          const origem = prospect.enrichment?.origem;
                          if (origem) {
                            return <Badge variant="outline" className="text-xs">{origem}</Badge>;
                          }
                          
                          return (
                            <div className="flex flex-col gap-1">
                              {prospect.source_name && (
                                <span className="text-sm font-medium">{prospect.source_name}</span>
                              )}
                              {prospect.source_metadata?.campaign && (
                                <Badge variant="outline" className="text-xs w-fit">
                                  {prospect.source_metadata.campaign}
                                </Badge>
                              )}
                              {!prospect.source_name && !prospect.source_metadata?.campaign && (
                                <span className="text-sm text-muted-foreground">
                                  {prospect.job?.job_name || '-'}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* ✅ Botão STC */}
                          <STCAgent
                            companyId={prospect.id}
                            companyName={prospect.razao_social || prospect.nome_fantasia || 'Empresa'}
                            cnpj={prospect.cnpj}
                          />
                          
                          {/* ✅ Botão Eye (Preview) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewProspect(prospect);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* ✅ Gear Icon com Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={enrichingIds.has(prospect.id)}
                              >
                                {enrichingIds.has(prospect.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Settings className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleIndividualEnrich(prospect.id)}
                                disabled={enrichingIds.has(prospect.id)}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Enriquecer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateReceitaFederal(prospect.id)}
                                disabled={enrichingIds.has(prospect.id)}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Atualizar Receita Federal
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteIndividual(prospect.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Deletar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                {previewProspect.fit_score != null ? (
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{previewProspect.fit_score.toFixed(1)}%</span>
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


