/**
 * Estoque de Empresas Qualificadas
 * 
 * ✅ FLUXO OFICIAL: Buffer intermediário entre Motor de Qualificação e Banco de Empresas
 * - Mostra apenas empresas com pipeline_status = 'new'
 * - Única ação permitida: "Enviar para Banco de Empresas"
 * - Não permite ações diretas de quarentena/aprovação (isso é feito em Gerenciar Empresas)
 */

import { useState, useEffect, useCallback } from 'react';
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
  Info,
  HelpCircle,
  Building2,
  CheckCircle,
  MapPin,
  FileText,
  Briefcase,
  DollarSign,
  Scale,
  Users,
  Globe,
  Calendar,
  Activity,
  ArrowUpDown,
  Download,
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { QualifiedStockActionsMenu } from '@/components/qualification/QualifiedStockActionsMenu';
import { ExplainabilityButton } from '@/components/common/ExplainabilityButton';
import LocationMap from '@/components/map/LocationMap';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { WebsiteFitAnalysisCard } from '@/components/qualification/WebsiteFitAnalysisCard';

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
  website_encontrado?: string | null;
  website_fit_score?: number | null;
  website_products_match?: any[] | null;
  linkedin_url?: string | null;
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
    apollo?: any;
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
  const [fullPreviewData, setFullPreviewData] = useState<any>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [loadingExtractedProducts, setLoadingExtractedProducts] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [loadingFullPreview, setLoadingFullPreview] = useState(false);
  const [tenantProducts, setTenantProducts] = useState<any[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // ✅ Função para gerar recomendação IA
  const generateAIRecommendation = async (
    tenantProds: any[],
    prospectProds: any[],
    compatibleProducts: any[],
    websiteFitScore: number
  ): Promise<string> => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise estratégica de fit entre empresas. Analise produtos e forneça recomendações objetivas e acionáveis.'
            },
            {
              role: 'user',
              content: `Analise o fit entre duas empresas:

PRODUTOS DO TENANT (${tenantProds.length}):
${tenantProds.slice(0, 10).map(p => `- ${p.nome} (${p.categoria || 'Sem categoria'})`).join('\n')}

PRODUTOS DO PROSPECT (${prospectProds.length}):
${prospectProds.slice(0, 10).map(p => `- ${p.nome} (${p.categoria || 'Sem categoria'})`).join('\n')}

PRODUTOS COMPATÍVEIS: ${compatibleProducts.length}
WEBSITE FIT SCORE: ${websiteFitScore}/20

Forneça uma recomendação estratégica objetiva em 2-3 parágrafos sobre:
1. Oportunidades de fit identificadas
2. Pontos de atenção
3. Próximos passos recomendados`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) throw new Error('Erro na API OpenAI');
      const data = await response.json();
      return data.choices[0]?.message?.content || 'Análise em andamento...';
    } catch (error) {
      console.error('[AI Recommendation] Erro:', error);
      return 'Não foi possível gerar recomendação no momento.';
    }
  };
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    currentItem?: string;
  } | null>(null);
  
  // ✅ FILTROS (igual a Gerenciar Empresas)
  const [filterOrigin, setFilterOrigin] = useState<string[]>([]);
  const [filterStatusCNPJ, setFilterStatusCNPJ] = useState<string[]>([]);
  const [filterICP, setFilterICP] = useState<string[]>([]);
  const [filterFitScore, setFilterFitScore] = useState<string[]>([]);
  const [filterGrade, setFilterGrade] = useState<string[]>([]);

  // ✅ Usar useCallback para evitar recriação da função
  const loadProspects = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // ✅ CORRIGIDO: Query simplificada (JOIN será feito depois se a tabela existir)
      let query = ((supabase as any).from('qualified_prospects'))
        .select(`
          *,
          website_encontrado,
          website_fit_score,
          website_products_match,
          linkedin_url,
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

      // ✅ APLICAR FILTROS LOCALMENTE (igual a Gerenciar Empresas)
      let filteredProspects = enrichedProspects;
      
      // Filtro por Origem
      if (filterOrigin.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const origem = p.source_name || p.job?.source_file_name || '';
          return filterOrigin.includes(origem);
        });
      }
      
      // Filtro por Status CNPJ
      if (filterStatusCNPJ.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const receitaData = p.enrichment?.raw || {};
          let status = receitaData.situacao || receitaData.descricao_situacao_cadastral || 'PENDENTE';
          
          // Normalizar status
          if (status.toUpperCase().includes('ATIVA') || status === '02') status = 'ATIVA';
          else if (status.toUpperCase().includes('SUSPENSA') || status === '03') status = 'SUSPENSA';
          else if (status.toUpperCase().includes('INAPTA') || status === '04') status = 'INAPTA';
          else if (status.toUpperCase().includes('BAIXADA') || status === '08') status = 'BAIXADA';
          else if (status.toUpperCase().includes('NULA') || status === '01') status = 'NULA';
          
          return filterStatusCNPJ.includes(status);
        });
      }
      
      // ✅ Filtro por ICP
      if (filterICP.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const icpName = p.icp?.nome || 'Sem ICP';
          return filterICP.includes(icpName);
        });
      }
      
      // ✅ Filtro por Fit Score
      if (filterFitScore.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const fitScore = p.enrichment?.fit_score ?? p.fit_score ?? 0;
          if (fitScore >= 90) return filterFitScore.includes('90-100');
          if (fitScore >= 75) return filterFitScore.includes('75-89');
          if (fitScore >= 60) return filterFitScore.includes('60-74');
          if (fitScore >= 40) return filterFitScore.includes('40-59');
          return filterFitScore.includes('0-39');
        });
      }
      
      // ✅ Filtro por Grade
      if (filterGrade.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const grade = p.enrichment?.grade || p.grade || null;
          if (!grade || grade === '-' || grade === 'null') return filterGrade.includes('Sem Grade');
          return filterGrade.includes(grade);
        });
      }
      
      setProspects(filteredProspects as any);
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
  }, [tenantId, gradeFilter, sectorFilter, stateFilter, searchTerm, filterOrigin, filterStatusCNPJ, filterICP, filterFitScore, filterGrade]); // ✅ Dependências do useCallback

  // ✅ useEffect para carregar prospects quando dependências mudarem
  useEffect(() => {
    if (tenantId) {
      loadProspects();
    }
  }, [tenantId, loadProspects]);
  
  // ✅ CICLO 1: Função para mostrar preview completo ao clicar no CNPJ
  const handleShowFullPreview = async (cnpj: string) => {
    setLoadingFullPreview(true);
    setShowFullPreview(true);
    
    try {
      // Buscar dados completos da Receita Federal
      const result = await consultarReceitaFederal(cnpj);
      
      if (!result.success || !result.data) {
        throw new Error('Não foi possível buscar dados completos do CNPJ');
      }
      
      const empresaData = result.data as any;
      
      // Montar preview completo igual ao SearchPage
      const previewData = {
        success: true,
        company: {
          name: empresaData.nome || empresaData.razao_social || empresaData.fantasia,
          cnpj: cnpj,
          website: (empresaData.website || null) as string | null,
          domain: empresaData.website ? new URL(empresaData.website).hostname : null,
          industry: empresaData.cnae_fiscal_descricao || empresaData.atividade_principal?.[0]?.text,
          employees: empresaData.qsa?.length || null,
          location: {
            city: empresaData.municipio,
            state: empresaData.uf,
            country: 'Brasil',
            address: [
              empresaData.logradouro,
              empresaData.numero,
              empresaData.complemento,
              empresaData.bairro
            ].filter(Boolean).join(', '),
            cep: empresaData.cep
          },
          raw_data: {
            receita: {
              nome: empresaData.nome || empresaData.razao_social,
              fantasia: empresaData.fantasia || (empresaData as any).nome_fantasia,
              porte: empresaData.porte || 'N/A',
              tipo: empresaData.tipo || empresaData.natureza_juridica,
              abertura: empresaData.abertura || empresaData.data_inicio_atividade || empresaData.data_abertura,
              natureza_juridica: empresaData.natureza_juridica || empresaData.descricao_natureza_juridica,
              capital_social: empresaData.capital_social || '0.00',
              situacao: empresaData.situacao || empresaData.descricao_situacao_cadastral || 'ATIVA',
              data_situacao: empresaData.data_situacao || empresaData.data_situacao_cadastral || new Date().toISOString().split('T')[0],
              motivo_situacao: empresaData.motivo_situacao || empresaData.descricao_motivo_situacao_cadastral || 'SEM MOTIVO',
              situacao_especial: empresaData.situacao_especial || 'N/A',
              data_situacao_especial: empresaData.data_situacao_especial || null,
              simples: {
                optante: empresaData.simples?.optante || empresaData.opcao_pelo_simples === 'Sim' || false,
                data_opcao: empresaData.simples?.data_opcao || empresaData.data_opcao_pelo_simples || null,
                data_exclusao: empresaData.simples?.data_exclusao || empresaData.data_exclusao_do_simples || null,
              },
              simei: {
                optante: empresaData.simei?.optante || empresaData.opcao_pelo_mei === 'Sim' || false,
                data_opcao: empresaData.simei?.data_opcao || empresaData.data_opcao_pelo_mei || null,
              },
              efr: empresaData.efr || empresaData.ente_federativo_responsavel || 'N/A',
              email: empresaData.email || empresaData.correio_eletronico || 'N/A',
              telefone: empresaData.telefone || empresaData.ddd_telefone_1 || empresaData.telefone_1 || 'N/A',
              telefone_2: empresaData.telefone_2 || empresaData.ddd_telefone_2 || null,
              cnae_principal: empresaData.cnae_fiscal || empresaData.atividade_principal?.[0]?.code,
              cnae_principal_descricao: empresaData.cnae_fiscal_descricao || empresaData.atividade_principal?.[0]?.text,
              cnaes_secundarios: empresaData.atividades_secundarias || empresaData.cnaes_secundarios || [],
              qsa: empresaData.qsa || empresaData.socios || [],
              logradouro: empresaData.logradouro,
              numero: empresaData.numero,
              complemento: empresaData.complemento,
              bairro: empresaData.bairro,
              municipio: empresaData.municipio,
              uf: empresaData.uf,
              cep: empresaData.cep,
              ...empresaData
            }
          }
        },
        cnpj_status: empresaData.situacao === 'ATIVA' ? 'ativo' : 'inativo',
        cnpj_status_message: empresaData.situacao || empresaData.descricao_situacao_cadastral,
        decision_makers: [],
        digital_maturity: null
      };
      
      setFullPreviewData(previewData);
    } catch (error: any) {
      console.error('[Full Preview] Erro:', error);
      toast({
        title: 'Erro ao buscar dados completos',
        description: error.message || 'Não foi possível carregar o preview completo',
        variant: 'destructive',
      });
      setShowFullPreview(false);
    } finally {
      setLoadingFullPreview(false);
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

  // ✅ Função de ordenação (igual a Gerenciar Empresas)
  const [sortBy, setSortBy] = useState<'razao_social' | 'cnpj' | 'setor' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const handleSort = (column: 'razao_social' | 'cnpj' | 'setor' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // ✅ NOVO: Enviar empresa individual para Banco de Empresas
  const handlePromoteIndividualToCompanies = async (prospectId: string) => {
    if (!confirm(`Tem certeza que deseja enviar esta empresa para o Banco de Empresas? Ela será criada/atualizada na tabela companies.`)) {
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
      const prospect = prospects.find(p => p.id === prospectId);
      if (!prospect) {
        toast({
          title: 'Erro',
          description: 'Empresa não encontrada',
          variant: 'destructive',
        });
        return;
      }

      // Usar a mesma lógica de handlePromoteToCompanies, mas para uma empresa apenas
      let promotedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      console.log('[Qualified → Companies] 📤 Enviando prospect individual para Banco de Empresas', {
        prospect_id: prospectId,
        cnpj: prospect.cnpj,
        razao_social: prospect.razao_social,
        tenant_id: tenantId,
      });

      try {
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
          return;
        }

        // ✅ Normalizar CNPJ antes de buscar (apenas dígitos)
        const normalizedCnpj = prospect.cnpj?.replace(/\D/g, '') || null;
        
        if (!normalizedCnpj || normalizedCnpj.length !== 14) {
          console.warn('[Qualified → Companies] ⚠️ CNPJ inválido, pulando', {
            prospect_id: prospect.id,
            cnpj: prospect.cnpj,
            normalized: normalizedCnpj,
          });
          errors.push(`CNPJ ${prospect.cnpj}: formato inválido`);
          return;
        }

        // Buscar se já existe empresa com mesmo CNPJ (usando CNPJ normalizado)
        const { data: existingCompany, error: existingError } = await ((supabase as any).from('companies'))
          .select('id, company_name')
          .eq('tenant_id', tenantId)
          .eq('cnpj', normalizedCnpj)
          .maybeSingle();

        if (existingError && existingError.code !== 'PGRST116') {
          throw existingError;
        }

        // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS
        const companyData: any = {
          tenant_id: tenantId,
          cnpj: normalizedCnpj,
          company_name: companyName,
          name: companyName, // Campo obrigatório
          industry: sector,
          website: website || prospect.website_encontrado || null,
          location: city && state ? { city, state } : null,
          updated_at: new Date().toISOString(),
        };

        // ✅ DADOS DE ENRIQUECIMENTO (Website, LinkedIn, Fit Score)
        if (prospect.website_encontrado) {
          companyData.website_encontrado = prospect.website_encontrado;
        }
        if (prospect.website_fit_score !== undefined && prospect.website_fit_score !== null) {
          companyData.website_fit_score = Number(prospect.website_fit_score);
        }
        if (prospect.website_products_match) {
          companyData.website_products_match = prospect.website_products_match;
        }
        if (prospect.linkedin_url) {
          companyData.linkedin_url = prospect.linkedin_url;
        }

        // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS EM raw_data
        const rawData: any = {
          qualified_prospect_id: prospect.id,
          promoted_from_qualified_stock: true,
          promoted_at: new Date().toISOString(),
        };

        // Dados de qualificação
        const sourceName = prospect.source_name || prospect.job?.source_file_name || 'Qualification Engine';
        if (sourceName) {
          rawData.source_name = sourceName;
        }
        if (prospect.fit_score !== undefined && prospect.fit_score !== null) {
          rawData.fit_score = Number(prospect.fit_score);
        }
        if (prospect.grade && prospect.grade !== '-' && prospect.grade !== 'null') {
          rawData.grade = String(prospect.grade);
        }
        if (prospect.icp_id) {
          rawData.icp_id = prospect.icp_id;
        }

        // Dados de enriquecimento da Receita Federal
        if (prospect.enrichment?.raw) {
          rawData.receita_federal = prospect.enrichment.raw;
        }
        if (prospect.enrichment?.fantasia) {
          rawData.nome_fantasia = prospect.enrichment.fantasia;
        }
        if (fantasyName) {
          rawData.nome_fantasia = fantasyName;
        }

        // Dados de enriquecimento do Apollo
        if (prospect.enrichment?.apollo) {
          rawData.apollo = prospect.enrichment.apollo;
        }

        // Dados de website
        if (prospect.website_encontrado) {
          rawData.website_encontrado = prospect.website_encontrado;
        }
        if (prospect.website_fit_score !== undefined && prospect.website_fit_score !== null) {
          rawData.website_fit_score = Number(prospect.website_fit_score);
        }
        if (prospect.website_products_match) {
          rawData.website_products_match = prospect.website_products_match;
        }
        if (prospect.linkedin_url) {
          rawData.linkedin_url = prospect.linkedin_url;
        }

        companyData.raw_data = rawData;

        if (existingCompany) {
          // Atualizar empresa existente
          const { error: updateError } = await ((supabase as any).from('companies'))
            .update(companyData)
            .eq('id', existingCompany.id);

          if (updateError) throw updateError;
          updatedCount++;
          console.log('[Qualified → Companies] ✅ Empresa atualizada', existingCompany.id);
        } else {
          // Criar nova empresa
          const { data: newCompany, error: insertError } = await ((supabase as any).from('companies'))
            .insert(companyData)
            .select('id')
            .single();

          if (insertError) throw insertError;
          promotedCount++;
          console.log('[Qualified → Companies] ✅ Nova empresa criada', newCompany.id);
        }

        // Atualizar pipeline_status do prospect para 'promoted'
        const { error: updateStatusError } = await ((supabase as any).from('qualified_prospects'))
          .update({ pipeline_status: 'promoted', updated_at: new Date().toISOString() })
          .eq('id', prospectId);

        if (updateStatusError) {
          console.warn('[Qualified → Companies] ⚠️ Erro ao atualizar pipeline_status', updateStatusError);
        }

      } catch (error: any) {
        console.error('[Qualified → Companies] ❌ Erro ao processar prospect', error);
        errors.push(`CNPJ ${prospect.cnpj}: ${error.message || 'Erro desconhecido'}`);
      }

      if (errors.length > 0) {
        toast({
          title: '⚠️ Envio parcial',
          description: `${promotedCount + updatedCount} empresa(s) processada(s). ${errors.length} erro(s).`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Empresa enviada com sucesso!',
          description: `A empresa foi ${promotedCount > 0 ? 'criada' : 'atualizada'} no Banco de Empresas.`,
        });
      }

      await loadProspects();
    } catch (error: any) {
      console.error('[Qualified → Companies] ❌ Erro geral:', error);
      toast({
        title: 'Erro ao enviar empresa',
        description: error.message || 'Não foi possível enviar a empresa para o Banco de Empresas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
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

          // ✅ Normalizar CNPJ antes de buscar (apenas dígitos)
          const normalizedCnpj = prospect.cnpj?.replace(/\D/g, '') || null;
          
          if (!normalizedCnpj || normalizedCnpj.length !== 14) {
            console.warn('[Qualified → Companies] ⚠️ CNPJ inválido, pulando', {
              prospect_id: prospect.id,
              cnpj: prospect.cnpj,
              normalized: normalizedCnpj,
            });
            errors.push(`CNPJ ${prospect.cnpj}: formato inválido`);
            continue;
          }

          // Buscar se já existe empresa com mesmo CNPJ (usando CNPJ normalizado)
          const { data: existingCompany, error: existingError } = await ((supabase as any).from('companies'))
            .select('id, company_name, cnpj')
            .eq('cnpj', normalizedCnpj)
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

            // ✅ Payload de update simplificado e seguro - apenas campos que EXISTEM na tabela
            const updatePayload: any = {
              company_name: companyName || existingCompany.company_name || 'Empresa Sem Nome',
              name: companyName || existingCompany.name || 'Empresa Sem Nome', // Campo obrigatório
              updated_at: new Date().toISOString(),
            };

            // Adicionar campos opcionais apenas se tiverem valores válidos
            if (city) {
              updatePayload.headquarters_city = city;
            }
            if (state) {
              updatePayload.headquarters_state = state;
            }
            if (sector) {
              updatePayload.industry = sector;
            }
            if (website && website.trim() && !website.includes('exemplo.com')) {
              updatePayload.website = website;
            }
            
            // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS: Copiar dados de qualified_prospects para companies
            const existingRawData = (existingCompany as any).raw_data || {};
            const parsedExisting = typeof existingRawData === 'string' 
              ? JSON.parse(existingRawData) 
              : existingRawData;
            
            const rawData: any = { ...parsedExisting };
            
            // ✅ DADOS DE QUALIFICAÇÃO
            const sourceName = prospect.source_name || prospect.job?.source_file_name || 'Qualification Engine';
            if (sourceName) {
              rawData.source_name = sourceName;
            }
            if (prospect.fit_score !== undefined && prospect.fit_score !== null) {
              rawData.fit_score = Number(prospect.fit_score);
            }
            if (prospect.grade && prospect.grade !== '-' && prospect.grade !== 'null') {
              rawData.grade = String(prospect.grade);
            }
            if (prospect.icp_id) {
              rawData.icp_id = prospect.icp_id;
            }
            
            // ✅ DADOS DE ENRIQUECIMENTO (Website, LinkedIn, Fit Score)
            if (prospect.website_encontrado) {
              updatePayload.website_encontrado = prospect.website_encontrado;
              rawData.website_encontrado = prospect.website_encontrado;
            }
            if (prospect.website_fit_score !== undefined && prospect.website_fit_score !== null) {
              updatePayload.website_fit_score = Number(prospect.website_fit_score);
              rawData.website_fit_score = Number(prospect.website_fit_score);
            }
            if (prospect.website_products_match) {
              updatePayload.website_products_match = prospect.website_products_match;
              rawData.website_products_match = prospect.website_products_match;
            }
            if (prospect.linkedin_url) {
              updatePayload.linkedin_url = prospect.linkedin_url;
              rawData.linkedin_url = prospect.linkedin_url;
            }
            
            // ✅ DADOS DE ENRIQUECIMENTO DA RECEITA FEDERAL (preservar se já existir, adicionar se vier do prospect)
            if (prospect.enrichment?.raw) {
              rawData.receita_federal = prospect.enrichment.raw;
            }
            if (prospect.enrichment?.fantasia) {
              rawData.nome_fantasia = prospect.enrichment.fantasia;
            }
            
            // ✅ DADOS DE ENRIQUECIMENTO DO APOLLO (preservar se já existir)
            if (prospect.enrichment?.apollo) {
              rawData.apollo = prospect.enrichment.apollo;
            }
            
            // ✅ Garantir que raw_data seja um objeto válido
            if (Object.keys(rawData).length > 0) {
              updatePayload.raw_data = JSON.parse(JSON.stringify(rawData));
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

            console.log('[Qualified → Companies] ✅ Empresa atualizada em companies', {
              company_id: existingCompany.id,
              cnpj: prospect.cnpj,
            });

            // ✅ DELETAR de qualified_prospects (não apenas atualizar status)
            const { error: deleteErrorUpdate } = await ((supabase as any).from('qualified_prospects'))
              .delete()
              .eq('id', prospect.id);

            if (deleteErrorUpdate) {
              console.error('[Qualified → Companies] ❌ Erro ao deletar de qualified_prospects', {
                error: deleteErrorUpdate,
                prospect_id: prospect.id,
              });
            } else {
              console.log('[Qualified → Companies] ✅ Removido de qualified_prospects', {
                prospect_id: prospect.id,
                cnpj: prospect.cnpj,
              });
            }

            updatedCount++;
          } else {
            // ✅ Criar nova empresa
            console.log('[Qualified → Companies] ➕ Criando nova empresa', {
              cnpj: prospect.cnpj,
              company_name: companyName,
            });

            // ✅ Payload simplificado e seguro - apenas campos que EXISTEM na tabela companies
            const insertPayload: any = {
              tenant_id: tenantId,
              cnpj: normalizedCnpj, // Usar CNPJ já normalizado
              company_name: companyName || 'Empresa Sem Nome', // Garantir que não seja null
              name: companyName || 'Empresa Sem Nome', // Campo obrigatório
            };

            // Adicionar campos opcionais apenas se tiverem valores válidos
            if (city) {
              insertPayload.headquarters_city = city;
            }
            if (state) {
              insertPayload.headquarters_state = state;
            }
            if (sector) {
              insertPayload.industry = sector;
            }
            if (website && website.trim() && !website.includes('exemplo.com')) {
              insertPayload.website = website;
            }
            
            // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS: Copiar dados de qualified_prospects para companies
            const rawData: any = {};
            
            // ✅ DADOS DE QUALIFICAÇÃO
            const sourceName = prospect.source_name || prospect.job?.source_file_name || 'Qualification Engine';
            if (sourceName) {
              rawData.source_name = sourceName;
            }
            if (prospect.fit_score !== undefined && prospect.fit_score !== null) {
              rawData.fit_score = Number(prospect.fit_score);
            }
            if (prospect.grade && prospect.grade !== '-' && prospect.grade !== 'null') {
              rawData.grade = String(prospect.grade);
            }
            if (prospect.icp_id) {
              rawData.icp_id = prospect.icp_id;
            }
            
            // ✅ DADOS DE ENRIQUECIMENTO (Website, LinkedIn, Fit Score)
            if (prospect.website_encontrado) {
              insertPayload.website_encontrado = prospect.website_encontrado;
              rawData.website_encontrado = prospect.website_encontrado;
            }
            if (prospect.website_fit_score !== undefined && prospect.website_fit_score !== null) {
              insertPayload.website_fit_score = Number(prospect.website_fit_score);
              rawData.website_fit_score = Number(prospect.website_fit_score);
            }
            if (prospect.website_products_match) {
              insertPayload.website_products_match = prospect.website_products_match;
              rawData.website_products_match = prospect.website_products_match;
            }
            if (prospect.linkedin_url) {
              insertPayload.linkedin_url = prospect.linkedin_url;
              rawData.linkedin_url = prospect.linkedin_url;
            }
            
            // ✅ DADOS DE ENRIQUECIMENTO DA RECEITA FEDERAL
            if (prospect.enrichment?.raw) {
              rawData.receita_federal = prospect.enrichment.raw;
            }
            if (prospect.enrichment?.fantasia) {
              rawData.nome_fantasia = prospect.enrichment.fantasia;
            }
            
            // ✅ DADOS DE ENRIQUECIMENTO DO APOLLO
            if (prospect.enrichment?.apollo) {
              rawData.apollo = prospect.enrichment.apollo;
            }
            
            // ✅ Garantir que raw_data seja um objeto válido
            if (Object.keys(rawData).length > 0) {
              insertPayload.raw_data = JSON.parse(JSON.stringify(rawData));
            }

            // ✅ Log detalhado do payload antes de inserir
            console.log('[Qualified → Companies] 📦 Payload de inserção:', {
              tenant_id: insertPayload.tenant_id,
              cnpj: insertPayload.cnpj,
              company_name: insertPayload.company_name,
              name: insertPayload.name,
              has_city: !!insertPayload.headquarters_city,
              has_state: !!insertPayload.headquarters_state,
              has_industry: !!insertPayload.industry,
              has_website: !!insertPayload.website,
              has_source_name: !!insertPayload.source_name,
              has_fit_score: insertPayload.fit_score !== undefined,
              has_grade: !!insertPayload.grade,
              has_icp_id: !!insertPayload.icp_id,
              payload_keys: Object.keys(insertPayload),
            });

            const { data: newCompany, error: createError } = await ((supabase as any).from('companies'))
              .insert(insertPayload)
              .select('id, company_name, cnpj')
              .single();

            if (createError) {
              console.error('[Qualified → Companies] ❌ Erro Supabase ao inserir em companies', {
                error: createError,
                error_code: createError.code,
                error_message: createError.message,
                error_details: createError.details,
                error_hint: createError.hint,
                payload: insertPayload,
                payload_stringified: JSON.stringify(insertPayload, null, 2),
                raw_data_type: typeof insertPayload.raw_data,
                raw_data_keys: insertPayload.raw_data ? Object.keys(insertPayload.raw_data) : null,
                has_name: !!insertPayload.name,
                has_company_name: !!insertPayload.company_name,
                has_tenant_id: !!insertPayload.tenant_id,
              });
              
              // ✅ Exibir erro detalhado para o usuário
              const errorMsg = createError.message || 'Erro desconhecido';
              const errorDetails = createError.details || createError.hint || '';
              errors.push(`CNPJ ${prospect.cnpj}: ${errorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
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

            // ✅ DELETAR de qualified_prospects (não apenas atualizar status)
            // Isso garante que a empresa saia do estoque de qualificadas
            const { error: deleteErrorCreate } = await ((supabase as any).from('qualified_prospects'))
              .delete()
              .eq('id', prospect.id);

            if (deleteErrorCreate) {
              console.error('[Qualified → Companies] ❌ Erro ao deletar de qualified_prospects', {
                error: deleteErrorCreate,
                prospect_id: prospect.id,
              });
              // Não falhar o processo, apenas logar o erro
            } else {
              console.log('[Qualified → Companies] ✅ Removido de qualified_prospects', {
                prospect_id: prospect.id,
                cnpj: prospect.cnpj,
              });
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

  // ✅ NOVA FUNÇÃO: Enriquecimento de Website em Massa
  const handleBulkEnrichWebsite = async () => {
    const idsToEnrich = selectedIds.size > 0 
      ? Array.from(selectedIds) 
      : prospects.map(p => p.id);

    if (idsToEnrich.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Nenhuma empresa selecionada para enriquecer',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setBulkProgress({ current: 0, total: idsToEnrich.length });
    try {
      toast({
        title: '🌐 Enriquecendo websites...',
        description: `Processando ${idsToEnrich.length} empresa(s)`,
      });

      const supabaseUrl = (supabase as any).supabaseUrl || (window as any).__SUPABASE_URL__;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

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

          // 1. Buscar website
          const findWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/find-prospect-website`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razao_social: prospect.razao_social,
              cnpj: prospect.cnpj,
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
              qualified_prospect_id: prospectId,
              website_url: websiteData.website,
              razao_social: prospect.razao_social,
            }),
          });

          if (!scanWebsiteResponse.ok) continue;
          const scanData = await scanWebsiteResponse.json();
          if (!scanData.success) continue;

          // 3. Atualizar
          const { error } = await ((supabase as any).from('qualified_prospects'))
            .update({
              website_encontrado: websiteData.website,
              website_fit_score: scanData.website_fit_score || 0,
              website_products_match: scanData.compatible_products_count > 0 ? scanData.compatible_products : [],
              linkedin_url: scanData.linkedin_url || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', prospectId);

          if (error) throw error;
          enrichedCount++;
        } catch (error: any) {
          const prospectData = prospects.find(p => p.id === prospectId);
          errors.push(`${prospectData?.razao_social || prospectId}: ${error.message}`);
        }
      }

      toast({
        title: enrichedCount > 0 ? '✅ Enriquecimento concluído!' : '⚠️ Nenhuma empresa enriquecida',
        description: `${enrichedCount} de ${idsToEnrich.length} empresas enriquecidas${errors.length > 0 ? `. ${errors.length} erros.` : ''}`,
        variant: enrichedCount === 0 ? 'destructive' : 'default',
      });
      await loadProspects();
    } catch (error: any) {
      console.error('[Enriquecimento Website Massa] Erro:', error);
      toast({
        title: 'Erro ao enriquecer websites',
        description: error.message || 'Não foi possível enriquecer os websites',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkEnrichment = async () => {
    const idsToEnrich = selectedIds.size > 0 
      ? Array.from(selectedIds) 
      : prospects.map(p => p.id);

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

          const enriched = await consultarReceitaFederal(prospect.cnpj, {
            stockId: prospectId,
            tenantId: tenantId!,
            saveEnrichment: true, // ✅ PERSISTIR automaticamente
          });
          
          if (enriched && enriched.success && enriched.data) {
            const data = enriched.data as any;
            const nomeFantasia = data.fantasia || data.nome_fantasia || null;
            
            const updateData: any = {
              razao_social: data.nome || data.razao_social || prospect.razao_social,
              nome_fantasia: nomeFantasia || prospect.nome_fantasia,
              cidade: data.municipio || prospect.cidade,
              estado: data.uf || prospect.estado,
              setor: data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor,
              website: data.website || prospect.website,
              updated_at: new Date().toISOString(),
            };

            const { error } = await ((supabase as any).from('qualified_prospects'))
              .update(updateData)
              .eq('id', prospectId);

            if (error) throw error;
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
  // ✅ NOVA FUNÇÃO: Enriquecimento de Website (buscar + escanear + calcular fit)
  const handleEnrichWebsite = async (prospectId: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect || !tenantId) return;

    setEnrichingIds(prev => new Set(prev).add(prospectId));
    try {
      toast({
        title: '🌐 Buscando website da empresa...',
        description: 'Usando SERPER para encontrar website oficial',
      });

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
          razao_social: prospect.razao_social,
          cnpj: prospect.cnpj,
          tenant_id: tenantId,
        }),
      });

      if (!findWebsiteResponse.ok) {
        throw new Error('Erro ao buscar website');
      }

      const websiteData = await findWebsiteResponse.json();
      if (!websiteData.success || !websiteData.website) {
        toast({
          title: '⚠️ Website não encontrado',
          description: 'Não foi possível encontrar o website oficial desta empresa',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '✅ Website encontrado!',
        description: 'Escaneando produtos e calculando fit score...',
      });

      // 2. Escanear website e calcular fit score
      const scanWebsiteResponse = await fetch(`${supabaseUrl}/functions/v1/scan-prospect-website`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          qualified_prospect_id: prospectId,
          website_url: websiteData.website,
          razao_social: prospect.razao_social,
        }),
      });

      if (!scanWebsiteResponse.ok) {
        throw new Error('Erro ao escanear website');
      }

      const scanData = await scanWebsiteResponse.json();
      if (!scanData.success) {
        throw new Error(scanData.error || 'Erro ao escanear website');
      }

      // 3. Atualizar qualified_prospects com os dados
      const { error: updateError } = await ((supabase as any).from('qualified_prospects'))
        .update({
          website_encontrado: websiteData.website,
          website_fit_score: scanData.website_fit_score || 0,
          website_products_match: scanData.compatible_products_count > 0 ? scanData.compatible_products : [],
          linkedin_url: scanData.linkedin_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId);

      if (updateError) throw updateError;

      toast({
        title: '✅ Website enriquecido com sucesso!',
        description: `${scanData.products_found} produtos encontrados, Fit Score: +${scanData.website_fit_score} pontos`,
      });
      await loadProspects();
    } catch (error: any) {
      console.error('[Enriquecimento Website] Erro:', error);
      toast({
        title: 'Erro ao enriquecer website',
        description: error.message || 'Não foi possível enriquecer o website da empresa',
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
        const data = enriched.data as any;
        // ✅ CRITÉRIO IGUAL AO INLINESEARCH: usar fantasia da Receita Federal
        const nomeFantasia = data.fantasia || data.nome_fantasia || null;
        
        const updateData: any = {
          razao_social: data.nome || data.razao_social || prospect.razao_social,
          nome_fantasia: nomeFantasia || prospect.nome_fantasia, // ✅ Usar fantasia da Receita Federal
          cidade: data.municipio || prospect.cidade,
          estado: data.uf || prospect.estado,
          setor: data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor,
          website: data.website || prospect.website,
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
    <div className="p-8 space-y-6">
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
          <ExplainabilityButton
            title="Metodologia de Qualificação"
            description="Entenda como as empresas são classificadas e qualificadas no sistema"
            analysisType="Qualificação de Empresas"
            dataSources={[
              { name: "Receita Federal", description: "Dados cadastrais, CNAE, localização, porte" },
              { name: "BrasilAPI", description: "Enriquecimento de dados públicos e complementares" },
              { name: "ICP (Ideal Customer Profile)", description: "Perfil do cliente ideal configurado pelo usuário" }
            ]}
            criteria={[
              { name: "Fit Score", description: "Pontuação de 0-100 baseada em 5 critérios ponderados: Setor (40%), Localização (30%), Dados completos (20%), Website (5%), Contato (5%)" },
              { name: "Grade", description: "Classificação de A+ a D baseada no Fit Score: A+ (90-100), A (75-89), B (60-74), C (40-59), D (0-39)" },
              { name: "Data Quality", description: "Avaliação da completude dos dados: COMPLETO (≥8 pontos), PARCIAL (5-7 pontos), RUIM (<5 pontos)" }
            ]}
            methodology="O Fit Score é calculado através de uma fórmula ponderada que avalia 5 dimensões principais da empresa em relação ao ICP configurado. Cada dimensão recebe um peso específico e o resultado final é uma pontuação de 0 a 100. A Grade é atribuída automaticamente baseada no Fit Score calculado. Empresas com Fit Score > 0 e data_quality_status = 'ok' são inseridas na tabela qualified_prospects."
            interpretation="Use o Fit Score e Grade para priorizar empresas com maior potencial de conversão. Empresas com Grade A+ ou A devem ser priorizadas no processo de qualificação. O enriquecimento automático via BrasilAPI melhora a qualidade dos dados e aumenta o Fit Score."
            buttonText="Ver Metodologia"
            variant="outline"
            size="default"
          />
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
                onBulkEnrichWebsite={handleBulkEnrichWebsite}
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
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma empresa encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === prospects.length && prospects.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('razao_social')}
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
                      column="origem"
                      title="Origem"
                      values={[...new Set(prospects.map(p => p.source_name || p.job?.source_file_name || '').filter(Boolean))]}
                      selectedValues={filterOrigin}
                      onFilterChange={setFilterOrigin}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter
                      column="status_cnpj"
                      title="Status CNPJ"
                      values={['ATIVA', 'SUSPENSA', 'INAPTA', 'BAIXADA', 'NULA']}
                      selectedValues={filterStatusCNPJ}
                      onFilterChange={setFilterStatusCNPJ}
                    />
                  </TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>
                    <ColumnFilter
                      column="setor"
                      title="Setor"
                      values={uniqueSectors}
                      selectedValues={sectorFilter !== 'all' ? [sectorFilter] : []}
                      onFilterChange={(values) => setSectorFilter(values.length > 0 ? values[0] : 'all')}
                    />
                  </TableHead>
                  <TableHead>
                    <ColumnFilter
                      column="icp"
                      title="ICP"
                      values={[...new Set(prospects.map(p => p.icp?.nome || 'Sem ICP').filter(Boolean))]}
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
                  <TableHead>Website</TableHead>
                  <TableHead>Website Fit</TableHead>
                  <TableHead>LinkedIn</TableHead>
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
                      {/* ✅ ORDEM CORRETA: 1. Empresa (Razão Social) */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div>
                            <button
                              onClick={() => handleShowFullPreview(prospect.cnpj)}
                              className="font-medium hover:text-primary hover:underline text-left"
                            >
                              {prospect.razao_social || 'Sem nome'}
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 2. CNPJ */}
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs cursor-pointer hover:bg-primary/10 transition-colors whitespace-nowrap"
                          onClick={() => handleShowFullPreview(prospect.cnpj)}
                        >
                          {prospect.cnpj}
                        </Badge>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 3. Origem */}
                      <TableCell>
                        {(() => {
                          const origem = prospect.source_name || prospect.job?.source_file_name || '';
                          if (origem) {
                            return (
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs"
                              >
                                {origem}
                              </Badge>
                            );
                          }
                          return (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Legacy
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 4. Status CNPJ */}
                      <TableCell>
                        {(() => {
                          const receitaData = prospect.enrichment?.raw || {};
                          const situacao = receitaData.situacao || receitaData.descricao_situacao_cadastral || '';
                          
                          // Normalizar status para o componente
                          let cnpjStatus = 'pendente';
                          if (situacao) {
                            const sitUpper = situacao.toUpperCase();
                            if (sitUpper.includes('ATIVA')) cnpjStatus = 'ativa';
                            else if (sitUpper.includes('INAPTA') || sitUpper.includes('SUSPENSA') || sitUpper.includes('BAIXADA')) cnpjStatus = 'inativo';
                            else if (sitUpper.includes('NULA')) cnpjStatus = 'inexistente';
                          }
                          
                          return <QuarantineCNPJStatusBadge cnpj={prospect.cnpj || undefined} cnpjStatus={cnpjStatus} />;
                        })()}
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 5. Nome Fantasia */}
                      <TableCell>
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
                      {/* ✅ ORDEM CORRETA: 6. Cidade/UF */}
                      <TableCell>
                        {prospect.cidade && prospect.estado
                          ? `${prospect.cidade}/${prospect.estado}`
                          : prospect.estado || '-'}
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 7. Setor */}
                      <TableCell>{prospect.setor || '-'}</TableCell>
                      {/* ✅ ORDEM CORRETA: 8. ICP */}
                      <TableCell>
                        {prospect.icp?.nome ? (
                          <Badge variant="outline" className="text-xs">
                            {prospect.icp.nome}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 9. Fit Score */}
                      <TableCell>
                        {(() => {
                          const fitScore = prospect.enrichment?.fit_score ?? prospect.fit_score;
                          const matchBreakdown = prospect.match_breakdown;
                          
                          if (fitScore != null && fitScore > 0) {
                            let breakdownText = '';
                            if (matchBreakdown && Array.isArray(matchBreakdown)) {
                              const breakdown = matchBreakdown.map((item: any) => 
                                `${item.label}: ${item.score.toFixed(1)}% (peso ${item.weight}%)`
                              ).join('\n');
                              breakdownText = `Breakdown do Fit Score:\n${breakdown}\n\nTotal: ${fitScore.toFixed(1)}%`;
                            } else {
                              breakdownText = `Fit Score: ${fitScore.toFixed(1)}%\n\nCálculo baseado em:\n• Setor (40%): Match com ICP\n• Localização (30%): UF/Cidade\n• Dados completos (20%): Qualidade dos dados\n• Website (5%): Presença digital\n• Contato (5%): Email/Telefone`;
                            }
                            
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
                                        Por que esta empresa tem Fit Score {fitScore.toFixed(1)}%?
                                      </p>
                                      <div className="text-xs space-y-1.5 whitespace-pre-line">
                                        {breakdownText}
                                      </div>
                                      {prospect.enrichment?.data_quality && (
                                        <div className="pt-2 border-t mt-2">
                                          <p className="text-xs font-medium">Qualidade dos Dados: {prospect.enrichment.data_quality}</p>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-muted-foreground text-sm cursor-help">
                                    Não calculado
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <p className="text-sm">
                                    O Fit Score será calculado quando você executar o Motor de Qualificação para esta empresa.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 10. Grade */}
                      <TableCell>
                        {(() => {
                          const fitScore = prospect.enrichment?.fit_score ?? prospect.fit_score;
                          
                          // ✅ CORRIGIDO: Calcular grade baseada no fit_score se não existir ou estiver inconsistente
                          let grade = prospect.enrichment?.grade || prospect.grade;
                          
                          // Se não tiver grade OU se a grade não corresponder ao fit_score, recalcular
                          if (!grade || (fitScore != null && fitScore > 0)) {
                            if (fitScore >= 90) grade = 'A+';
                            else if (fitScore >= 75) grade = 'A';
                            else if (fitScore >= 60) grade = 'B';
                            else if (fitScore >= 40) grade = 'C';
                            else if (fitScore >= 0) grade = 'D';
                          }
                          
                          if (grade) {
                            const gradeRanges: Record<string, string> = {
                              'A+': '90-100%: Excelente fit com ICP. Prioridade máxima.',
                              'A': '75-89%: Bom fit com ICP. Alta prioridade.',
                              'B': '60-74%: Fit moderado. Considerar qualificação adicional.',
                              'C': '40-59%: Fit baixo. Requer análise manual.',
                              'D': '0-39%: Fit muito baixo. Não recomendado para abordagem imediata.'
                            };
                            
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help inline-block">
                                      {getGradeBadge(grade)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-xs p-4">
                                    <div className="space-y-2">
                                      <p className="font-semibold text-sm border-b pb-2">
                                        Grade {grade} - O que significa?
                                      </p>
                                      <div className="text-xs space-y-1.5">
                                        <p>{gradeRanges[grade]}</p>
                                        {fitScore != null && (
                                          <p className="pt-2 border-t mt-2 text-muted-foreground">
                                            Fit Score: {fitScore.toFixed(1)}%
                                          </p>
                                        )}
                                        <p className="pt-2 border-t mt-2 font-medium">
                                          A Grade é atribuída automaticamente baseada no Fit Score calculado.
                                        </p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="cursor-help">
                                    -
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <p className="text-sm">
                                    A Grade será atribuída quando o Fit Score for calculado pelo Motor de Qualificação.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                      </TableCell>
                      {/* ✅ NOVA COLUNA: Website */}
                      <TableCell>
                        {prospect.website_encontrado ? (
                          <a
                            href={prospect.website_encontrado}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[150px]">{prospect.website_encontrado}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      {/* ✅ NOVA COLUNA: Website Fit Score */}
                      <TableCell>
                        {prospect.website_fit_score != null && prospect.website_fit_score >= 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="bg-green-600/10 text-green-600 border-green-600/30">
                                  +{prospect.website_fit_score}pts
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-semibold">Website Fit Score: +{prospect.website_fit_score} pontos</p>
                                  {prospect.website_products_match && Array.isArray(prospect.website_products_match) && prospect.website_products_match.length > 0 && (
                                    <div className="text-xs mt-2">
                                      <p className="font-medium">Produtos compatíveis encontrados:</p>
                                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                                        {prospect.website_products_match.slice(0, 3).map((match: any, idx: number) => (
                                          <li key={idx}>
                                            {match.tenant_product} ↔ {match.prospect_product}
                                          </li>
                                        ))}
                                        {prospect.website_products_match.length > 3 && (
                                          <li className="text-muted-foreground">+{prospect.website_products_match.length - 3} mais...</li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      {/* ✅ NOVA COLUNA: LinkedIn */}
                      <TableCell>
                        {prospect.linkedin_url ? (
                          <a
                            href={prospect.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <span className="truncate max-w-[120px]">LinkedIn</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
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
                            onClick={async () => {
                              setPreviewProspect(prospect);
                              setIsPreviewOpen(true);
                              // ✅ Buscar produtos extraídos do website e produtos do tenant
                              if (prospect.id && tenantId) {
                                setLoadingExtractedProducts(true);
                                setExtractedProducts([]);
                                setTenantProducts([]);
                                setAiRecommendation(null);
                                
                                try {
                                  // 1. Buscar produtos extraídos do prospect
                                  const { data: products, error } = await (supabase as any)
                                    .from('prospect_extracted_products')
                                    .select('*')
                                    .eq('qualified_prospect_id', prospect.id)
                                    .order('confianca_extracao', { ascending: false });
                                  
                                  if (error && error.code !== 'PGRST116') {
                                    console.error('[Preview] Erro ao buscar produtos extraídos:', error);
                                  } else {
                                    setExtractedProducts(products || []);
                                  }
                                  
                                  // 2. Buscar produtos do tenant para comparação
                                  const { data: tenantProds, error: tenantError } = await (supabase as any)
                                    .from('tenant_products')
                                    .select('id, nome, descricao, categoria, subcategoria')
                                    .eq('tenant_id', tenantId)
                                    .eq('ativo', true)
                                    .order('nome');
                                  
                                  if (tenantError) {
                                    console.error('[Preview] Erro ao buscar produtos do tenant:', tenantError);
                                  } else {
                                    setTenantProducts(tenantProds || []);
                                  }
                                  
                                  // 3. Gerar recomendação IA se houver produtos
                                  if ((products || []).length > 0 && (tenantProds || []).length > 0) {
                                    setLoadingRecommendation(true);
                                    try {
                                      const compatibleProducts = prospect.website_products_match || [];
                                      const recommendation = await generateAIRecommendation(
                                        tenantProds || [],
                                        products || [],
                                        compatibleProducts,
                                        prospect.website_fit_score || 0
                                      );
                                      setAiRecommendation(recommendation);
                                    } catch (recErr) {
                                      console.error('[Preview] Erro ao gerar recomendação IA:', recErr);
                                    } finally {
                                      setLoadingRecommendation(false);
                                    }
                                  }
                                } catch (err) {
                                  console.error('[Preview] Erro ao buscar produtos:', err);
                                } finally {
                                  setLoadingExtractedProducts(false);
                                }
                              }
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
                                Enriquecer Receita Federal
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEnrichWebsite(prospect.id)}
                                disabled={enrichingIds.has(prospect.id)}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Enriquecer Website + Fit Score
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateReceitaFederal(prospect.id)}
                                disabled={enrichingIds.has(prospect.id)}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Atualizar Receita Federal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePromoteIndividualToCompanies(prospect.id)}
                                disabled={processing}
                              >
                                <Database className="w-4 h-4 mr-2" />
                                Enviar para Banco de Empresas
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  // Exportar apenas esta empresa
                                  const previousSelected = new Set(selectedIds);
                                  setSelectedIds(new Set([prospect.id]));
                                  handleExportSelected();
                                  setSelectedIds(previousSelected);
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
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
          )}
        </CardContent>
      </Card>

      {/* ✅ CICLO 1: Modal de Preview Completo (igual a SearchPage) */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Preview Completo dos Dados
              {fullPreviewData?.cnpj_status === 'ativo' && (
                <Badge className="ml-2 bg-green-500 hover:bg-green-600 text-white border-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  CNPJ ATIVO
                </Badge>
              )}
              {fullPreviewData?.cnpj_status === 'inativo' && (
                <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  CNPJ INATIVO
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Revise as informações completas antes de confirmar o cadastro no funil de vendas
            </DialogDescription>
          </DialogHeader>
          
          {loadingFullPreview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : fullPreviewData ? (
            <div className="space-y-6">
              {/* Header com dados principais */}
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{fullPreviewData.company.name}</CardTitle>
                    {fullPreviewData.company.raw_data?.receita?.fantasia && (
                      <p className="text-sm text-muted-foreground">Nome Fantasia: {fullPreviewData.company.raw_data.receita.fantasia}</p>
                    )}
                  </div>
                  {/* ✅ CORRIGIDO: Usar div em vez de CardDescription para evitar warning de DOM nesting (div dentro de p) */}
                  <div className="text-sm text-muted-foreground space-y-2 pt-2">
                    {fullPreviewData.company.cnpj && (
                      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground">CNPJ:</span>
                        <span className="text-xl font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {fullPreviewData.company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Grid com 3 colunas - Simplificado para não sobrecarregar */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Coluna 1 - Dados Cadastrais */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Dados Cadastrais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Porte:</span>
                        <p className="font-medium">{fullPreviewData.company.raw_data?.receita?.porte || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Abertura:</span>
                        <p className="font-medium">{fullPreviewData.company.raw_data?.receita?.abertura || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capital Social:</span>
                        <p className="font-medium">
                          {fullPreviewData.company.raw_data?.receita?.capital_social 
                            ? `R$ ${Number(fullPreviewData.company.raw_data.receita.capital_social).toLocaleString('pt-BR')}` 
                            : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Situação Cadastral */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Situação Cadastral
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge 
                          className={`ml-2 ${
                            fullPreviewData.company.raw_data?.receita?.situacao === 'ATIVA' 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {fullPreviewData.company.raw_data?.receita?.situacao || 'N/A'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna 2 - Localização */}
                <div className="space-y-4">
                  {fullPreviewData.company.location && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          Localização
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs space-y-1">
                          {fullPreviewData.company.raw_data?.receita?.logradouro && (
                            <p>{fullPreviewData.company.raw_data.receita.logradouro}, {fullPreviewData.company.raw_data.receita.numero || 'S/N'}</p>
                          )}
                          <p className="font-semibold">
                            {fullPreviewData.company.raw_data?.receita?.municipio || fullPreviewData.company.location.city}/
                            {fullPreviewData.company.raw_data?.receita?.uf || fullPreviewData.company.location.state}
                          </p>
                          {fullPreviewData.company.raw_data?.receita?.cep && (
                            <p className="text-muted-foreground">CEP: {fullPreviewData.company.raw_data.receita.cep}</p>
                          )}
                        </div>
                        
                        {/* Mapa */}
                        {(fullPreviewData.company.location.cep || fullPreviewData.company.location.city) && (
                          <div className="h-[180px] rounded-lg overflow-hidden">
                            <LocationMap
                              address={fullPreviewData.company.raw_data?.receita?.logradouro}
                              municipio={fullPreviewData.company.location.city}
                              estado={fullPreviewData.company.location.state}
                              cep={fullPreviewData.company.location.cep}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Coluna 3 - Atividades */}
                <div className="space-y-4">
                  {fullPreviewData.company.raw_data?.receita?.atividade_principal && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4" />
                          Atividade Principal
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {fullPreviewData.company.raw_data.receita.atividade_principal.map((ativ: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <Badge variant="outline" className="text-[10px] mb-1">{ativ.code}</Badge>
                              <p className="text-[10px] leading-relaxed">{ativ.text}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ✅ FLUXO OFICIAL: Modal de Preview da Empresa (mantido para compatibilidade) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className={`${isModalFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-2xl max-h-[80vh]'} overflow-y-auto transition-all duration-300`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex-1">
              <DialogTitle>Resumo da Empresa Qualificada</DialogTitle>
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

              {/* ✅ Análise Estratégica de Fit - Website & Produtos */}
              <WebsiteFitAnalysisCard
                companyId={previewProspect.id}
                qualifiedProspectId={previewProspect.id}
                websiteEncontrado={previewProspect.website_encontrado}
                websiteFitScore={previewProspect.website_fit_score}
                websiteProductsMatch={previewProspect.website_products_match}
                linkedinUrl={previewProspect.linkedin_url}
                isModalFullscreen={isModalFullscreen}
              />

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


