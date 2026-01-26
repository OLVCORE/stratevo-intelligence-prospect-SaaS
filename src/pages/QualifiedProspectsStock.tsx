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
  Target,
  Linkedin,
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
import { PurchaseIntentBadge } from '@/components/intelligence/PurchaseIntentBadge';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { UnifiedActionsMenu } from '@/components/common/UnifiedActionsMenu';
import { ExplainabilityButton } from '@/components/common/ExplainabilityButton';
import LocationMap from '@/components/map/LocationMap';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { WebsiteFitAnalysisCard } from '@/components/qualification/WebsiteFitAnalysisCard';
import { CompanyPreviewModal } from '@/components/qualification/CompanyPreviewModal';
import { formatWebsiteUrl } from '@/lib/utils/urlHelpers';
import { getCNAEClassifications, type CNAEClassification } from '@/services/cnaeClassificationService';
import { resolveCompanyCNAE, formatCNAEForDisplay } from '@/lib/utils/cnaeResolver';
import { formatCNPJ } from '@/lib/utils/validators';

// 🎨 Função para gerar cores dinâmicas consistentes baseadas no nome do setor/segmento
// ✅ MELHORADO: Hash mais robusto para maior diferenciação entre setores diferentes
const getDynamicBadgeColors = (name: string | null | undefined, type: 'setor' | 'categoria'): string => {
  if (!name) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700';
  
  // Hash mais robusto usando múltiplos fatores para maior diferenciação
  const normalizedName = name.toLowerCase().trim();
  let hash = 0;
  
  // Hash primário: soma de caracteres com pesos diferentes
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Hash secundário: baseado nas primeiras letras (mais importante para diferenciação)
  let secondaryHash = 0;
  const firstChars = normalizedName.substring(0, Math.min(5, normalizedName.length));
  for (let i = 0; i < firstChars.length; i++) {
    secondaryHash = secondaryHash * 31 + firstChars.charCodeAt(i);
  }
  
  // Combinar hashes para maior diferenciação
  const combinedHash = Math.abs(hash * 17 + secondaryHash * 23);
  
  // Paleta expandida com cores mais distintas (16 cores diferentes)
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
    { bg: 'bg-slate-100', text: 'text-slate-800', darkBg: 'dark:bg-slate-900', darkText: 'dark:text-slate-200', border: 'border-slate-300', darkBorder: 'dark:border-slate-700' },
    { bg: 'bg-lime-100', text: 'text-lime-800', darkBg: 'dark:bg-lime-900', darkText: 'dark:text-lime-200', border: 'border-lime-300', darkBorder: 'dark:border-lime-700' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', darkBg: 'dark:bg-fuchsia-900', darkText: 'dark:text-fuchsia-200', border: 'border-fuchsia-300', darkBorder: 'dark:border-fuchsia-700' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200', border: 'border-yellow-300', darkBorder: 'dark:border-yellow-700' },
  ];
  
  // Para categorias, adiciona offset maior no hash para garantir cores diferentes do setor
  const hashOffset = type === 'categoria' ? 5000 : 0;
  const colorIndex = (combinedHash + hashOffset) % colorPalettes.length;
  const colors = colorPalettes[colorIndex];
  
  return `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} ${colors.border} ${colors.darkBorder}`;
};

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
  const [filterUF, setFilterUF] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState<string[]>([]);
  const [filterNomeFantasia, setFilterNomeFantasia] = useState<string[]>([]);
  const [filterCNAE, setFilterCNAE] = useState<string[]>([]); // ✅ NOVO: Filtro de CNAE
  const [cnaeClassifications, setCnaeClassifications] = useState<Record<string, CNAEClassification>>({});

  // 🔎 Helpers de CNAE e localização
  // ✅ USAR resolveCompanyCNAE para garantir resolução correta (igual ApprovedLeads)
  const extractProspectCNAE = (prospect: QualifiedProspect): string | null => {
    // ✅ USAR resolveCompanyCNAE que já faz toda a resolução correta
    const cnaeResolution = resolveCompanyCNAE(prospect);
    const cnaeCode = cnaeResolution.principal.code;
    if (!cnaeCode) return null;
    return String(cnaeCode).trim();
  };

  const getCNAEClassificationForProspect = (prospect: QualifiedProspect): CNAEClassification | null => {
    const cnae = extractProspectCNAE(prospect);
    if (!cnae) return null;
    const normalized = cnae.replace(/\./g, '').trim();
    return (
      cnaeClassifications[cnae] ||
      cnaeClassifications[normalized] ||
      null
    );
  };

  const getProspectUF = (prospect: QualifiedProspect): string | null => {
    const uf = prospect.estado || (prospect.enrichment?.raw as any)?.uf || null;
    return uf ? String(uf).toUpperCase().trim() : null;
  };

  const getProspectCity = (prospect: QualifiedProspect): string | null => {
    const raw = (prospect.enrichment?.raw as any) || {};
    const cidade =
      prospect.cidade ||
      raw.municipio ||
      raw.cidade ||
      null;
    return cidade ? String(cidade).trim() : null;
  };

  const getProspectOrigin = (prospect: QualifiedProspect): string | null => {
    // Prioridade: campanha > source_name > job.source_file_name > job.job_name > source_metadata
    const campaign = prospect.source_metadata?.campaign;
    if (campaign && String(campaign).trim() !== '') {
      return String(campaign).trim();
    }

    if (prospect.source_name && prospect.source_name.trim() !== '') {
      return prospect.source_name.trim();
    }

    const jobFile = prospect.job?.source_file_name;
    if (jobFile && jobFile.trim() !== '') {
      return jobFile.trim();
    }

    const jobName = prospect.job?.job_name;
    if (jobName && jobName.trim() !== '') {
      return jobName.trim();
    }

    if (prospect.source_metadata) {
      const metaName =
        (prospect.source_metadata as any).name ||
        (prospect.source_metadata as any).source_name;
      if (metaName && String(metaName).trim() !== '') {
        return String(metaName).trim();
      }
    }

    return null;
  };

  // ✅ Usar useCallback para evitar recriação da função
  const loadProspects = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // ✅ CORRIGIDO: Query simplificada (sem relacionamento que pode causar erro 400)
      // ✅ EXPLÍCITO: Selecionar campos de website e LinkedIn explicitamente
      let query = ((supabase as any).from('qualified_prospects'))
        .select('*, website_encontrado, website_fit_score, website_products_match, linkedin_url')
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

      // ✅ DEBUG: Verificar se os campos de website estão sendo retornados
      if (data && data.length > 0) {
        const firstProspect = data[0] as any;
        console.log('[Estoque] 🔍 DEBUG - Primeiro prospect carregado:', {
          id: firstProspect.id,
          razao_social: firstProspect.razao_social,
          website_encontrado: firstProspect.website_encontrado,
          website_fit_score: firstProspect.website_fit_score,
          linkedin_url: firstProspect.linkedin_url,
          has_website_encontrado: 'website_encontrado' in firstProspect,
          has_website_fit_score: 'website_fit_score' in firstProspect,
          has_linkedin_url: 'linkedin_url' in firstProspect,
        });
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
      // ✅ PRESERVAR TODOS OS DADOS usando o objeto original + dados enriquecidos
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
        
        // ✅ PRESERVAR TODOS OS DADOS: usar objeto original completo + dados enriquecidos
        const enriched = {
          ...p, // ✅ PRESERVAR TODOS OS CAMPOS ORIGINAIS
          // ✅ DADOS BÁSICOS (garantir que estejam presentes)
          cnpj: p.cnpj || '',
          razao_social: p.razao_social || 'N/A',
          nome_fantasia: enrichment?.fantasia || p.nome_fantasia || null,
          estado: p.estado || null,
          cidade: p.cidade || null,
          setor: p.setor || null,
          situacao_cnpj: p.situacao_cnpj || null,
          // ✅ SCORES (preservar todos)
          fit_score: enrichment?.fit_score ?? p.fit_score ?? null,
          grade: enrichment?.grade || p.grade || null,
          icp_score: p.icp_score || enrichment?.icp_score || 0,
          // ✅ DADOS DE WEBSITE E LINKEDIN (preservar explicitamente - CRÍTICO)
          website: p.website || null,
          website_encontrado: p.website_encontrado || p.website || null, // ✅ Fallback para website se website_encontrado não existir
          website_fit_score: p.website_fit_score ?? (p.website_fit_score === 0 ? 0 : null), // ✅ Preservar 0 como 0, não null
          website_products_match: p.website_products_match || null,
          linkedin_url: p.linkedin_url || null,
          // ✅ STATUS DO PIPELINE (garantir que esteja presente)
          pipeline_status: p.pipeline_status || 'new',
          // ✅ DADOS DE ENRIQUECIMENTO
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
          // ✅ PRESERVAR enrichment_data e ai_analysis se existirem
          enrichment_data: p.enrichment_data || null,
          ai_analysis: p.ai_analysis || null,
        };

        return enriched;
      });

      // ✅ APLICAR FILTROS LOCALMENTE (igual a Gerenciar Empresas)
      let filteredProspects = enrichedProspects;
      
      // Filtro por Origem
      if (filterOrigin.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const origem = getProspectOrigin(p) || 'Sem origem';
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
      
      // ✅ Filtro por UF (estado)
      if (filterUF.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const uf = getProspectUF(p);
          return uf ? filterUF.includes(uf) : false;
        });
      }

      // ✅ Filtro por Cidade (dependente de UF)
      if (filterCity.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const city = getProspectCity(p);
          return city ? filterCity.includes(city) : false;
        });
      }

      // ✅ Filtro por Nome Fantasia
      if (filterNomeFantasia.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const fantasia = p.enrichment?.fantasia || p.nome_fantasia || '';
          if (!fantasia || fantasia.trim() === '' || fantasia === '-') {
            return filterNomeFantasia.includes('Sem Nome Fantasia');
          }
          return filterNomeFantasia.includes(fantasia);
        });
      }

      // ✅ Filtro por CNAE (código)
      if (filterCNAE.length > 0) {
        filteredProspects = filteredProspects.filter(p => {
          const cnaeRes = resolveCompanyCNAE(p);
          const cnaeCode = cnaeRes.principal.code || 'Sem CNAE';
          return filterCNAE.includes(cnaeCode);
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
  }, [tenantId, gradeFilter, sectorFilter, stateFilter, searchTerm, filterOrigin, filterStatusCNPJ, filterICP, filterFitScore, filterGrade, filterUF, filterCity, filterNomeFantasia]); // ✅ Dependências do useCallback

  // 📊 Carregar classificações CNAE → Setor/Categoria para os prospects da página
  useEffect(() => {
    const codesSet = new Set<string>();

    prospects.forEach((prospect) => {
      const cnae = extractProspectCNAE(prospect);
      if (cnae) {
        codesSet.add(cnae);
      }
    });

    const codes = Array.from(codesSet);
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
        console.error('[QualifiedProspectsStock] Erro ao carregar classificações CNAE:', error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [prospects]);

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
      // ✅ PRIMEIRO: Buscar o prospect atual para usar seus dados de website_fit_score
      const currentProspect = prospects.find(p => p.cnpj === cnpj || p.cnpj_raw === cnpj);
      
      // Buscar dados completos da Receita Federal
      const result = await consultarReceitaFederal(cnpj);
      
      if (!result.success || !result.data) {
        throw new Error('Não foi possível buscar dados completos do CNPJ');
      }
      
      const empresaData = result.data as any;
      
      // ✅ Se houver prospect atual, usar seus dados de website_fit_score
      if (currentProspect) {
        setPreviewProspect(currentProspect);
      }
      
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
  
  const handleSort = (column: 'razao_social' | 'cnpj' | 'setor' | 'created_at' | 'name' | 'source_name' | 'cnpj_status') => {
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

        // ✅ BUSCAR DADOS DO JOB PARA PEGAR ORIGEM (nome do arquivo) - ANTES de criar companyData
        let jobData: any = null;
        if (prospect.job_id) {
          try {
            const { data: job } = await ((supabase as any).from('prospect_qualification_jobs'))
              .select('job_name, source_file_name, source_type')
              .eq('id', prospect.job_id)
              .maybeSingle();
            if (job) {
              jobData = job;
            }
          } catch (jobError) {
            console.warn('[Qualified → Companies] ⚠️ Erro ao buscar job:', jobError);
          }
        }

        // ✅ ORIGEM: Priorizar source_file_name (nome do arquivo), depois job_name, depois source_name, depois default
        const origem = jobData?.source_file_name || 
                       jobData?.job_name || 
                       prospect.source_name || 
                       (jobData?.source_type === 'upload_csv' ? 'CSV Upload' :
                        jobData?.source_type === 'upload_excel' ? 'Excel Upload' :
                        jobData?.source_type === 'google_sheets' ? 'Google Sheets' :
                        jobData?.source_type === 'api_empresas_aqui' ? 'API Empresas Aqui' :
                        'Qualification Engine');

        // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS
        const companyData: any = {
          tenant_id: tenantId,
          cnpj: normalizedCnpj,
          company_name: companyName,
          name: companyName, // Campo obrigatório
          industry: sector,
          website: website || null,
          location: city && state ? { city, state } : null,
          origem: origem, // ✅ PRESERVAR ORIGEM NO CAMPO DIRETO
          source_name: origem, // ✅ PRESERVAR source_name também
          updated_at: new Date().toISOString(),
        };

        // ✅ DADOS DE ENRIQUECIMENTO (Website, LinkedIn, Fit Score)
        // NOTA: Esses campos podem não existir na tabela companies, então salvamos apenas em raw_data
        // Se as colunas existirem, podem ser adicionadas aqui no futuro

        // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS EM raw_data
        const rawData: any = {
          qualified_prospect_id: prospect.id,
          promoted_from_qualified_stock: true,
          promoted_at: new Date().toISOString(),
          origem: origem, // ✅ PRESERVAR ORIGEM
          source_name: origem, // ✅ PRESERVAR source_name também
          source_file_name: jobData?.source_file_name || null,
          job_name: jobData?.job_name || null,
          source_type: jobData?.source_type || null,
        };
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
  // 🚨 MICROCICLO 4: Validar estados canônicos
  const handlePromoteToCompanies = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos uma empresa para enviar ao Banco de Empresas',
        variant: 'destructive',
      });
      return;
    }

    // 🚨 MICROCICLO 4: Validar que prospects estão em BASE
    const { getCanonicalState } = await import('@/lib/utils/stateTransitionValidator');
    const selectedProspects = prospects.filter(p => selectedIds.has(p.id));
    
    const invalidStates = selectedProspects.filter((prospect: any) => {
      const state = getCanonicalState(prospect, 'qualified_prospect');
      return state !== 'BASE';
    });

    if (invalidStates.length > 0) {
      toast.error('Ação não permitida', {
        description: `${invalidStates.length} prospect(s) não estão em BASE. Apenas prospects qualificados (BASE) podem ser enviados para Banco de Empresas.`
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
      
      // ✅ Declarar jobData fora do loop para reutilizar entre prospects do mesmo job
      let jobData: any = null;

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

            // ✅ BUSCAR DADOS DO JOB PARA PEGAR ORIGEM (nome do arquivo) - se ainda não foi buscado
            if (!jobData && prospect.job_id) {
              try {
                const { data: job } = await ((supabase as any).from('prospect_qualification_jobs'))
                  .select('job_name, source_file_name, source_type')
                  .eq('id', prospect.job_id)
                  .maybeSingle();
                if (job) {
                  jobData = job;
                }
              } catch (jobError) {
                console.warn('[Qualified → Companies] ⚠️ Erro ao buscar job:', jobError);
              }
            }

            // ✅ ORIGEM: Priorizar source_file_name (nome do arquivo), depois job_name, depois source_name, depois default
            const origemUpdate = jobData?.source_file_name || 
                                jobData?.job_name || 
                                prospect.source_name || 
                                (jobData?.source_type === 'upload_csv' ? 'CSV Upload' :
                                 jobData?.source_type === 'upload_excel' ? 'Excel Upload' :
                                 jobData?.source_type === 'google_sheets' ? 'Google Sheets' :
                                 jobData?.source_type === 'api_empresas_aqui' ? 'API Empresas Aqui' :
                                 'Qualification Engine');

            // ✅ Payload de update simplificado e seguro - apenas campos que EXISTEM na tabela
            const updatePayload: any = {
              company_name: companyName || existingCompany.company_name || 'Empresa Sem Nome',
              name: companyName || existingCompany.name || 'Empresa Sem Nome', // Campo obrigatório
              origem: origemUpdate, // ✅ PRESERVAR ORIGEM NO CAMPO DIRETO
              source_name: origemUpdate, // ✅ PRESERVAR source_name também
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
            
            // ✅ DADOS DE QUALIFICAÇÃO - USAR origemUpdate (já calculado acima)
            rawData.origem = origemUpdate; // ✅ PRESERVAR ORIGEM NO raw_data
            rawData.source_name = origemUpdate; // ✅ PRESERVAR source_name também
            rawData.source_file_name = jobData?.source_file_name || null;
            rawData.job_name = jobData?.job_name || null;
            rawData.source_type = jobData?.source_type || null;
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
            // ✅ CORRIGIDO: Salvar nas colunas diretas E em raw_data (colunas existem na tabela companies)
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

            // ✅ BUSCAR DADOS DO JOB PARA PEGAR ORIGEM (nome do arquivo) - se ainda não foi buscado
            // Buscar apenas se o job_id mudou ou se ainda não foi buscado
            if (prospect.job_id && (!jobData || jobData.id !== prospect.job_id)) {
              try {
                const { data: job } = await ((supabase as any).from('prospect_qualification_jobs'))
                  .select('id, job_name, source_file_name, source_type')
                  .eq('id', prospect.job_id)
                  .maybeSingle();
                if (job) {
                  jobData = job;
                  console.log('[Qualified → Companies] ✅ Job data carregado', {
                    job_id: prospect.job_id,
                    source_file_name: job.source_file_name,
                    job_name: job.job_name,
                  });
                }
              } catch (jobError) {
                console.warn('[Qualified → Companies] ⚠️ Erro ao buscar job:', jobError);
                // Continuar sem jobData, usar fallback
              }
            }

            // ✅ ORIGEM: Priorizar source_file_name (nome do arquivo), depois job_name, depois source_name, depois default
            const origemInsert = jobData?.source_file_name || 
                                jobData?.job_name || 
                                prospect.source_name || 
                                (jobData?.source_type === 'upload_csv' ? 'CSV Upload' :
                                 jobData?.source_type === 'upload_excel' ? 'Excel Upload' :
                                 jobData?.source_type === 'google_sheets' ? 'Google Sheets' :
                                 jobData?.source_type === 'api_empresas_aqui' ? 'API Empresas Aqui' :
                                 'Qualification Engine');

            // ✅ Payload simplificado e seguro - apenas campos que EXISTEM na tabela companies
            const insertPayload: any = {
              tenant_id: tenantId,
              cnpj: normalizedCnpj, // Usar CNPJ já normalizado
              company_name: companyName || 'Empresa Sem Nome', // Garantir que não seja null
              name: companyName || 'Empresa Sem Nome', // Campo obrigatório
              origem: origemInsert, // ✅ PRESERVAR ORIGEM NO CAMPO DIRETO
              source_name: origemInsert, // ✅ PRESERVAR source_name também
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
            const rawData: any = {
              origem: origemInsert, // ✅ PRESERVAR ORIGEM
              source_name: origemInsert, // ✅ PRESERVAR source_name também
              source_file_name: jobData?.source_file_name || null,
              job_name: jobData?.job_name || null,
              source_type: jobData?.source_type || null,
            };
            
            // ✅ DADOS DE QUALIFICAÇÃO
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
            // ✅ CORRIGIDO: Salvar nas colunas diretas E em raw_data (colunas existem na tabela companies)
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
              origem: insertPayload.origem, // ✅ CRÍTICO: Verificar origem
              source_name: insertPayload.source_name, // ✅ CRÍTICO: Verificar source_name
              has_city: !!insertPayload.headquarters_city,
              has_state: !!insertPayload.headquarters_state,
              has_industry: !!insertPayload.industry,
              has_website: !!insertPayload.website,
              has_origem: !!insertPayload.origem, // ✅ CRÍTICO
              has_source_name: !!insertPayload.source_name,
              has_fit_score: insertPayload.fit_score !== undefined,
              has_grade: !!insertPayload.grade,
              has_icp_id: !!insertPayload.icp_id,
              // ✅ CRÍTICO: Verificar campos de website
              has_website_encontrado: !!insertPayload.website_encontrado,
              has_website_fit_score: insertPayload.website_fit_score !== undefined,
              has_website_products_match: !!insertPayload.website_products_match,
              has_linkedin_url: !!insertPayload.linkedin_url,
              website_fit_score_value: insertPayload.website_fit_score,
              linkedin_url_value: insertPayload.linkedin_url,
              payload_keys: Object.keys(insertPayload),
            });

            const { data: newCompany, error: createError } = await ((supabase as any).from('companies'))
              .insert(insertPayload)
              .select('id, company_name, cnpj')
              .single();

            if (createError) {
              // ✅ Log detalhado do erro para debug
              const errorLog = {
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
                tenant_id_value: insertPayload.tenant_id,
                cnpj_value: insertPayload.cnpj,
                prospect_id: prospect.id,
                // ✅ CRÍTICO: Verificar se campos de website estão no payload
                has_website_encontrado: 'website_encontrado' in insertPayload,
                has_website_fit_score: 'website_fit_score' in insertPayload,
                has_website_products_match: 'website_products_match' in insertPayload,
                has_linkedin_url: 'linkedin_url' in insertPayload,
                website_fit_score_value: insertPayload.website_fit_score,
                linkedin_url_value: insertPayload.linkedin_url,
              };
              
              // ✅ ALERTA ESPECÍFICO: Se erro for PGRST204 (coluna não encontrada)
              if (createError.code === 'PGRST204' || createError.message?.includes('column') || createError.message?.includes('schema cache')) {
                console.error('[Qualified → Companies] ⚠️⚠️⚠️ ERRO DE SCHEMA: Coluna não encontrada na tabela companies!', {
                  error_message: createError.message,
                  error_hint: createError.hint,
                  campos_no_payload: Object.keys(insertPayload).filter(k => k.includes('website') || k.includes('linkedin')),
                  acao_necessaria: 'Aplicar migration 20250225000004_ensure_website_columns_all_tables.sql',
                });
              }
              
              console.error('[Qualified → Companies] ❌ Erro Supabase ao inserir em companies', errorLog);
              
              // ✅ Exibir erro detalhado para o usuário
              let errorMsg = createError.message || 'Erro desconhecido';
              if (createError.code) {
                errorMsg += ` (código: ${createError.code})`;
              }
              if (createError.details) {
                errorMsg += ` - Detalhes: ${createError.details}`;
              }
              if (createError.hint) {
                errorMsg += ` - Dica: ${createError.hint}`;
              }
              
              // ✅ Verificar se é erro de RLS/permissão
              if (createError.code === '42501' || createError.message?.includes('permission') || createError.message?.includes('policy')) {
                errorMsg += ' [ERRO DE PERMISSÃO RLS - Verifique as políticas de acesso]';
              }
              
              errors.push(`CNPJ ${prospect.cnpj}: ${errorMsg}`);
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
          // ✅ Log detalhado do erro para debug
          const errorDetails = {
            prospect_id: prospect.id,
            cnpj: prospect.cnpj,
            error_message: err?.message || 'Erro desconhecido',
            error_code: err?.code,
            error_details: err?.details,
            error_hint: err?.hint,
            error_stack: err?.stack,
            error_stringified: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          };
          
          console.error('[Qualified → Companies] ❌ Erro inesperado ao processar prospect', errorDetails);
          
          // ✅ Mensagem de erro mais informativa
          let errorMsg = err?.message || 'Erro desconhecido';
          if (err?.code) {
            errorMsg += ` (código: ${err.code})`;
          }
          if (err?.details) {
            errorMsg += ` - Detalhes: ${err.details}`;
          }
          if (err?.hint) {
            errorMsg += ` - Dica: ${err.hint}`;
          }
          
          errors.push(`CNPJ ${prospect.cnpj}: ${errorMsg}`);
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
          // ✅ CORRIGIDO: Usar supabase.functions.invoke() em vez de fetch() para evitar CORS
          const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-prospect-website', {
            body: {
              tenant_id: tenantId,
              qualified_prospect_id: prospectId,
              website_url: websiteData.website,
              razao_social: prospect.razao_social,
            }
          });

          if (scanError || !scanData || !scanData.success) continue;

          // ✅ REMOVIDO: A Edge Function scan-prospect-website JÁ atualiza a tabela
          // Não precisamos fazer atualização duplicada aqui
          // Apenas aguardar um momento para garantir sincronização
          await new Promise(resolve => setTimeout(resolve, 500));
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

  // ✅ Enriquecimento Receita Federal em massa
  const handleBulkEnrichReceita = async () => {
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
            
            // ✅ CRÍTICO: Buscar setor e categoria da tabela cnae_classifications baseado no CNAE
            let setorFormatted = prospect.setor; // Preservar setor existente
            const cnaeCode = data.atividade_principal?.[0]?.code || data.cnae_fiscal || null;
            
            if (cnaeCode) {
              try {
                // Normalizar código CNAE para buscar na tabela (formato: "6203-1/00" sem pontos)
                let normalizedCnae = cnaeCode.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
                
                // Se é apenas numérico (7 dígitos), formatar primeiro: "2833000" -> "28.33-0/00" -> "2833-0/00"
                const cleanCode = normalizedCnae.replace(/[^0-9]/g, '');
                if (cleanCode.length === 7 && /^[0-9]+$/.test(cleanCode)) {
                  const formatted = `${cleanCode.substring(0, 2)}.${cleanCode.substring(2, 4)}-${cleanCode.substring(4, 5)}/${cleanCode.substring(5, 7)}`;
                  normalizedCnae = formatted.replace(/\./g, ''); // Remover pontos para formato do banco
                }
                
            // Buscar setor e categoria da tabela cnae_classifications
            const { data: classification, error: classError } = await (supabase as any)
              .from('cnae_classifications')
              .select('setor_industria, categoria')
              .eq('cnae_code', normalizedCnae)
              .maybeSingle();
                
                if (!classError && classification) {
                  // Formatar como "Setor - Categoria" (igual outras tabelas)
                  if (classification.categoria) {
                    setorFormatted = `${classification.setor_industria} - ${classification.categoria}`;
                  } else {
                    setorFormatted = classification.setor_industria;
                  }
                } else {
                  // Fallback: usar descrição da Receita se não encontrar classificação
                  setorFormatted = data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor;
                }
              } catch (err) {
                console.warn('[Bulk Enrichment] Erro ao buscar classificação CNAE:', err);
                // Fallback: usar descrição da Receita se não encontrar classificação
                setorFormatted = data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor;
              }
            }
            
            // ✅ CRÍTICO: Preparar enrichment_data para trigger funcionar automaticamente
            const existingEnrichmentData = prospect.enrichment_data || {};
            const enrichmentData = {
              ...existingEnrichmentData,
              receita_federal: data,
              receita: data, // Compatibilidade
              atividade_principal: data.atividade_principal,
              cnae_fiscal: cnaeCode,
              enriched_at: new Date().toISOString(),
            };
            
            const updateData: any = {
              razao_social: data.nome || data.razao_social || prospect.razao_social,
              nome_fantasia: nomeFantasia || prospect.nome_fantasia,
              cidade: data.municipio || prospect.cidade,
              estado: data.uf || prospect.estado,
              setor: setorFormatted, // ✅ Setor formatado "Setor - Categoria" da tabela cnae_classifications
              cnae_principal: cnaeCode || prospect.cnae_principal, // ✅ Salvar código CNAE também
              website: data.website || prospect.website,
              enrichment_data: enrichmentData, // ✅ CRÍTICO: Salvar em enrichment_data para trigger funcionar
              updated_at: new Date().toISOString(),
            };

            // ✅ CRÍTICO: Atualizar qualified_prospects usando nome correto da tabela
            const { error } = await supabase
              .from('qualified_prospects')
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

  // ✅ NOVO: Enriquecimento Apollo (decisores)
  const handleBulkEnrichApollo = async () => {
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
        title: '🔍 Buscando decisores no Apollo...',
        description: `Processando ${idsToEnrich.length} empresa(s)`,
      });

      let enrichedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < idsToEnrich.length; i++) {
        const prospectId = idsToEnrich[i];
        try {
          const prospect = prospects.find(p => p.id === prospectId);
          if (!prospect || !tenantId) {
            setBulkProgress({ current: i + 1, total: idsToEnrich.length, currentItem: 'Pulando...' });
            continue;
          }

          setBulkProgress({ 
            current: i + 1, 
            total: idsToEnrich.length, 
            currentItem: prospect.razao_social || prospect.cnpj 
          });

          // ✅ Chamar Edge Function com qualified_prospect_id
          const { error } = await supabase.functions.invoke('enrich-apollo-decisores', {
            body: {
              qualified_prospect_id: prospectId, // ✅ NOVO: usar qualified_prospect_id
              company_name: prospect.razao_social || prospect.nome_fantasia,
              domain: prospect.website,
              modes: ['people', 'company'],
              city: prospect.cidade,
              state: prospect.estado,
              industry: prospect.setor,
              cep: prospect.cep,
              fantasia: prospect.nome_fantasia,
            }
          });

          if (error) throw error;
          enrichedCount++;
        } catch (error: any) {
          const prospect = prospects.find(p => p.id === prospectId);
          console.error(`[Bulk Apollo] Erro ao enriquecer prospect ${prospectId}:`, error);
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
          title: '✅ Decisores encontrados com sucesso!',
          description: `${enrichedCount} empresa(s) foram enriquecidas com dados do Apollo.`,
          duration: 6000,
        });
      }

      await loadProspects();
    } catch (error: any) {
      console.error('[Bulk Apollo] Erro:', error);
      toast({
        title: 'Erro ao enriquecer',
        description: error.message || 'Não foi possível enriquecer com Apollo',
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
          // ✅ CORRIGIDO: Usar supabase.functions.invoke() em vez de fetch() para evitar CORS
          const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-prospect-website', {
            body: {
              tenant_id: tenantId,
              qualified_prospect_id: prospectId,
              website_url: websiteData.website,
              razao_social: prospect.razao_social,
            }
          });

          if (scanError) {
            throw new Error(scanError.message || 'Erro ao escanear website');
          }

          if (!scanData || !scanData.success) {
            throw new Error(scanData?.error || 'Erro ao escanear website');
          }

      // ✅ CORRIGIDO: A Edge Function scan-prospect-website JÁ atualiza a tabela qualified_prospects
      // Não precisamos fazer uma atualização duplicada aqui, apenas aguardar um momento
      // e recarregar os dados para garantir que estão sincronizados
      
      console.log('[Enriquecimento Website] ✅ Edge Function concluída:', {
        prospect_id: prospectId,
        website_encontrado: websiteData.website,
        website_fit_score: scanData.website_fit_score || 0,
        linkedin_url: scanData.linkedin_url || null,
        linkedin_found: !!scanData.linkedin_url,
        products_found: scanData.products_found || 0,
        compatible_products: scanData.compatible_products?.length || 0,
      });

      // ✅ Aguardar um momento para garantir que a atualização da Edge Function foi concluída
      await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Aumentado para 1s para garantir sincronização

      // ✅ Verificar se os dados foram salvos corretamente
      const { data: updatedProspect, error: checkError } = await ((supabase as any).from('qualified_prospects'))
        .select('id, website_encontrado, linkedin_url, website_fit_score, website_products_match')
        .eq('id', prospectId)
        .single();

      if (checkError) {
        console.warn('[Enriquecimento Website] ⚠️ Erro ao verificar dados atualizados:', checkError);
      } else {
        console.log('[Enriquecimento Website] ✅ Dados confirmados no banco:', {
          website_encontrado: updatedProspect?.website_encontrado,
          linkedin_url: updatedProspect?.linkedin_url,
          linkedin_url_present: !!updatedProspect?.linkedin_url,
          website_fit_score: updatedProspect?.website_fit_score,
        });
        
        // ✅ ALERTA: Se LinkedIn foi encontrado mas não foi salvo
        if (scanData.linkedin_url && !updatedProspect?.linkedin_url) {
          console.error('[Enriquecimento Website] ⚠️⚠️⚠️ PROBLEMA: LinkedIn encontrado mas NÃO salvo no banco!', {
            linkedin_from_response: scanData.linkedin_url,
            linkedin_in_db: updatedProspect?.linkedin_url,
          });
        }
      }

      toast({
        title: '✅ Website enriquecido com sucesso!',
        description: `${scanData.products_found || 0} produtos encontrados, Fit Score: +${scanData.website_fit_score || 0} pontos${scanData.linkedin_url ? ', LinkedIn encontrado' : ''}`,
      });
      
      // ✅ Recarregar prospects para atualizar a tabela
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
        const nomeFantasia = data.fantasia || data.nome_fantasia || null;
        
        // ✅ CRÍTICO: Buscar setor e categoria da tabela cnae_classifications baseado no CNAE (MESMA LÓGICA DO BULK)
        let setorFormatted = prospect.setor; // Preservar setor existente
        const cnaeCode = data.atividade_principal?.[0]?.code || data.cnae_fiscal || null;
        
        if (cnaeCode) {
          try {
            // Normalizar código CNAE para buscar na tabela (formato: "6203-1/00" sem pontos)
            let normalizedCnae = cnaeCode.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
            
            // Se é apenas numérico (7 dígitos), formatar primeiro: "2833000" -> "28.33-0/00" -> "2833-0/00"
            const cleanCode = normalizedCnae.replace(/[^0-9]/g, '');
            if (cleanCode.length === 7 && /^[0-9]+$/.test(cleanCode)) {
              const formatted = `${cleanCode.substring(0, 2)}.${cleanCode.substring(2, 4)}-${cleanCode.substring(4, 5)}/${cleanCode.substring(5, 7)}`;
              normalizedCnae = formatted.replace(/\./g, ''); // Remover pontos para formato do banco
            }
            
            // Buscar setor e categoria da tabela cnae_classifications
            const { data: classification, error: classError } = await (supabase as any)
              .from('cnae_classifications')
              .select('setor_industria, categoria')
              .eq('cnae_code', normalizedCnae)
              .maybeSingle();
            
            if (!classError && classification) {
              // Formatar como "Setor - Categoria" (igual outras tabelas)
              if (classification.categoria) {
                setorFormatted = `${classification.setor_industria} - ${classification.categoria}`;
              } else {
                setorFormatted = classification.setor_industria;
              }
            } else {
              // Fallback: usar descrição da Receita se não encontrar classificação
              setorFormatted = data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor;
            }
          } catch (err) {
            console.warn('[Individual Enrichment] Erro ao buscar classificação CNAE:', err);
            // Fallback: usar descrição da Receita se não encontrar classificação
            setorFormatted = data.atividade_principal?.[0]?.text || data.cnae_fiscal_descricao || prospect.setor;
          }
        }
        
        // ✅ CRÍTICO: Preparar enrichment_data para trigger funcionar automaticamente
        const existingEnrichmentData = prospect.enrichment_data || {};
        const enrichmentData = {
          ...existingEnrichmentData,
          receita_federal: data,
          receita: data, // Compatibilidade
          atividade_principal: data.atividade_principal,
          cnae_fiscal: cnaeCode,
          enriched_at: new Date().toISOString(),
        };
        
        const updateData: any = {
          razao_social: data.nome || data.razao_social || prospect.razao_social,
          nome_fantasia: nomeFantasia || prospect.nome_fantasia,
          cidade: data.municipio || prospect.cidade,
          estado: data.uf || prospect.estado,
          setor: setorFormatted, // ✅ Setor formatado "Setor - Categoria" da tabela cnae_classifications
          cnae_principal: cnaeCode || prospect.cnae_principal, // ✅ Salvar código CNAE também
          website: data.website || prospect.website,
          enrichment_data: enrichmentData, // ✅ CRÍTICO: Salvar em enrichment_data para trigger funcionar
          updated_at: new Date().toISOString(),
        };

        // ✅ CRÍTICO: Atualizar qualified_prospects usando nome correto da tabela
        const { error } = await (supabase as any)
          .from('qualified_prospects')
          .update(updateData)
          .eq('id', prospectId);

        if (error) throw error;

        toast({
          title: '✅ Empresa enriquecida com sucesso!',
          description: 'Dados atualizados da Receita Federal. Setor identificado automaticamente.',
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

  // ✅ STRATEVO One - Purchase Intent RPC (robusto contra schema cache / nomes divergentes)
  async function fetchPurchaseIntentScore(p_qualified_prospect_id: string) {
    // 1) Nome esperado pelo app (wrapper na migration)
    let { data, error } = await supabase.rpc("calculate_purchase_intent_for_prospect", {
      p_qualified_prospect_id,
    });

    if (!error && data) {
      // Se retornar JSONB com success, extrair score
      if (typeof data === 'object' && data !== null) {
        const jsonData = data as any;
        if (jsonData.success && jsonData.purchase_intent_score !== undefined) {
          return { ok: true, data: jsonData.purchase_intent_score, raw: jsonData };
        }
        if (jsonData.purchase_intent_score !== undefined) {
          return { ok: true, data: jsonData.purchase_intent_score, raw: jsonData };
        }
      }
      // Se retornar número direto
      if (typeof data === 'number') {
        return { ok: true, data, raw: { purchase_intent_score: data } };
      }
      return { ok: true, data, raw: data };
    }

    // 2) Nome sugerido pelo Supabase (função real) - fallback
    const prospect = prospects.find(p => p.id === p_qualified_prospect_id);
    if (prospect?.cnpj && tenantId) {
      let r2 = await supabase.rpc("calculate_purchase_intent_score", {
        p_tenant_id: tenantId,
        p_cnpj: prospect.cnpj,
        p_company_id: null,
      });

      if (!r2.error && r2.data !== null && r2.data !== undefined) {
        const score = typeof r2.data === 'number' ? r2.data : 0;
        // Atualizar prospect manualmente
        await supabase
          .from('qualified_prospects')
          .update({ purchase_intent_score: score })
          .eq('id', p_qualified_prospect_id);
        return { ok: true, data: score, raw: { purchase_intent_score: score } };
      }
    }

    // 3) Falha controlada (não quebra fluxo)
    console.warn("[Purchase Intent] indisponível:", error);
    return { ok: false, data: null, error: error };
  }

  // ✅ NOVA FUNÇÃO: Calcular Purchase Intent Score individual
  const handleCalculatePurchaseIntent = async (prospectId: string) => {
    if (!tenantId) return;

    try {
      toast({
        title: '🎯 Calculando Purchase Intent Avançado...',
        description: 'Aguarde enquanto analisamos produtos, ICP, clientes similares e mercado'
      });

      // Buscar ICP ID se disponível
      const prospect = prospects.find(p => p.id === prospectId);
      const icpId = prospect?.icp_id || null;

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

      toast({
        title: '✅ Purchase Intent Avançado calculado!',
        description: `Score: ${response.analysis?.overall_fit_score || 0}/100 - Grade: ${response.analysis?.recommended_grade || 'N/A'}`,
        variant: 'default'
      });

      // Recarregar dados
      await loadProspects();
    } catch (error: any) {
      console.error('[Purchase Intent Avançado] Erro:', error);
      toast({
        title: 'Erro ao calcular Purchase Intent avançado',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCalculatePurchaseIntentOld = async (prospectId: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect || !tenantId) return;

    setEnrichingIds(prev => new Set(prev).add(prospectId));
    try {
      toast({
        title: '🎯 Calculando Intenção de Compra...',
        description: 'Analisando sinais de compra para esta empresa',
      });

      // ✅ Usar função robusta com fallback
      const r = await fetchPurchaseIntentScore(prospectId);
      const score = r?.ok ? (r.data ?? 0) : 0;

      if (score === 0) {
        toast({
          title: 'ℹ️ Intenção de Compra: 0/100',
          description: 'Nenhum sinal de compra detectado ainda. O score será atualizado automaticamente quando sinais forem detectados (expansão, vagas, notícias, funding, etc.)',
          duration: 5000,
        });
      } else {
        const leadType = score >= 70 ? '🔥 Hot Lead' : score >= 50 ? '🎯 Warm Lead' : '📋 Cold Lead';
        toast({
          title: `✅ Intenção de Compra: ${score}/100`,
          description: `${leadType} - ${score >= 70 ? 'Alta probabilidade de compra!' : score >= 50 ? 'Interesse moderado' : 'Baixo interesse no momento'}`,
        });
      }
      await loadProspects();
    } catch (error: any) {
      console.error('[Calculate Purchase Intent] Erro:', error);
      toast({
        title: 'Erro ao calcular intenção de compra',
        description: error.message || 'Não foi possível calcular o score',
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

  // ✅ NOVA FUNÇÃO: Calcular Purchase Intent Score em lote
  const handleBulkCalculatePurchaseIntent = async () => {
    const idsToProcess = selectedIds.size > 0 
      ? Array.from(selectedIds) 
      : prospects.map(p => p.id);

    if (idsToProcess.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Nenhuma empresa selecionada',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setBulkProgress({ current: 0, total: idsToProcess.length });
    try {
      toast({
        title: '🎯 Calculando Intenção de Compra...',
        description: `Processando ${idsToProcess.length} empresa(s)`,
      });

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < idsToProcess.length; i++) {
        const prospectId = idsToProcess[i];
        try {
          const prospect = prospects.find(p => p.id === prospectId);
          setBulkProgress({ 
            current: i + 1, 
            total: idsToProcess.length,
            currentItem: prospect?.razao_social || prospectId
          });

          // ✅ Usar função robusta com fallback
          const r = await fetchPurchaseIntentScore(prospectId);
          if (r?.ok) {
            successCount++;
          } else {
            errors.push(`${prospect?.razao_social || prospectId}: ${r?.error?.message || 'Erro desconhecido'}`);
          }
        } catch (error: any) {
          const prospect = prospects.find(p => p.id === prospectId);
          errors.push(`${prospect?.razao_social || prospectId}: ${error.message}`);
        }
      }

      toast({
        title: successCount > 0 ? '✅ Cálculo concluído!' : '⚠️ Nenhum score calculado',
        description: `${successCount} de ${idsToProcess.length} empresa(s) processada(s)${errors.length > 0 ? `. ${errors.length} erros.` : ''}`,
        variant: successCount === 0 ? 'destructive' : 'default',
      });
      await loadProspects();
    } catch (error: any) {
      console.error('[Bulk Calculate Purchase Intent] Erro:', error);
      toast({
        title: 'Erro ao calcular intenção de compra',
        description: error.message || 'Não foi possível processar',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setBulkProgress({ current: 0, total: 0 });
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
  const uniqueSectors = Array.from(
    new Set(
      prospects.map(p => {
        const classification = getCNAEClassificationForProspect(p);
        return classification?.setor_industria || 'Sem setor';
      })
    )
  ).sort();
  
  // ✅ Valores únicos para filtros de Nome Fantasia, UF e Cidade
  const uniqueNomeFantasia = Array.from(
    new Set(
      prospects.map(p => {
        const fantasia = p.enrichment?.fantasia || p.nome_fantasia || '';
        return fantasia && fantasia.trim() !== '' && fantasia !== '-' ? fantasia : 'Sem Nome Fantasia';
      })
    )
  ).sort();
  
  const uniqueUFs = Array.from(
    new Set(
      prospects.map(p => getProspectUF(p)).filter(Boolean)
    )
  ).sort();
  
  const uniqueCities = Array.from(
    new Set(
      prospects.map(p => getProspectCity(p)).filter(Boolean)
    )
  ).sort();

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
          {/* ✅ Contador de empresas no estoque */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="font-semibold text-foreground">
              {prospects.length} empresa(s) no estoque
            </span>
            {selectedIds.size > 0 && (
              <span className="text-muted-foreground">
                {selectedIds.size} selecionada(s) para envio
              </span>
            )}
          </div>
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
              <UnifiedActionsMenu
                context="stock"
                selectedCount={selectedIds.size}
                totalCount={prospects.length}
                onPromoteToCompanies={handlePromoteToCompanies}
                onEnrichReceita={handleBulkEnrichReceita}
                onExportCSV={handleExportSelected}
                onDelete={handleBulkDelete}
                onDeleteAll={handleDeleteAll}
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
            <Table className="w-full min-w-[1400px] table-auto">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 min-w-[48px]">
                      <Checkbox
                        checked={selectedIds.size === prospects.length && prospects.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(prospects.map(p => p.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px] flex-1">
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
                    <TableHead className="w-[140px] min-w-[120px]">
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
                    <TableHead className="w-[140px] min-w-[120px]">
                      <ColumnFilter
                        column="origem"
                        title="Origem"
                        values={Array.from(
                          new Set(
                            prospects
                              .map(p => getProspectOrigin(p) || 'Sem origem')
                              .filter(Boolean)
                          )
                        )}
                        selectedValues={filterOrigin}
                        onFilterChange={setFilterOrigin}
                        onSort={() => {}}
                      />
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[90px]">
                      <ColumnFilter
                        column="status_cnpj"
                        title="Status CNPJ"
                        values={['ATIVA', 'SUSPENSA', 'INAPTA', 'BAIXADA', 'NULA']}
                        selectedValues={filterStatusCNPJ}
                        onFilterChange={setFilterStatusCNPJ}
                        onSort={() => {}}
                      />
                    </TableHead>
                    {/* ✅ COLUNA CNAE (canônica) */}
                    <TableHead className="min-w-[300px] max-w-[420px] text-left">
                      <ColumnFilter
                        column="cnae"
                        title="CNAE"
                        values={Array.from(
                          new Set(
                            prospects.map(p => {
                              const cnaeRes = resolveCompanyCNAE(p);
                              return cnaeRes.principal.code || 'Sem CNAE';
                            }).filter(Boolean)
                          )
                        )}
                        selectedValues={filterCNAE}
                        onFilterChange={setFilterCNAE}
                        onSort={() => {}}
                      />
                    </TableHead>
                    <TableHead className="w-[150px] min-w-[150px]">
                      <ColumnFilter
                        column="nome_fantasia"
                        title="Nome Fantasia"
                        values={uniqueNomeFantasia}
                        selectedValues={filterNomeFantasia}
                        onFilterChange={setFilterNomeFantasia}
                        onSort={() => {}}
                      />
                    </TableHead>
                    <TableHead className="w-[80px] min-w-[70px]">
                      <ColumnFilter
                        column="uf"
                        title="UF"
                        values={uniqueUFs}
                        selectedValues={filterUF}
                        onFilterChange={setFilterUF}
                        onSort={() => {}}
                      />
                    </TableHead>
                    <TableHead className="w-[140px] min-w-[120px]">
                      <ColumnFilter
                        column="cidade"
                        title="Cidade"
                        values={uniqueCities}
                        selectedValues={filterCity}
                        onFilterChange={setFilterCity}
                        onSort={() => {}}
                      />
                    </TableHead>
                    <TableHead className="min-w-[180px] flex-[1.5]">
                      <ColumnFilter
                        column="setor"
                        title="Setor"
                        values={uniqueSectors}
                        selectedValues={sectorFilter !== 'all' ? [sectorFilter] : []}
                        onFilterChange={(values) => setSectorFilter(values.length > 0 ? values[0] : 'all')}
                        onSort={() => handleSort('setor')}
                      />
                    </TableHead>
                    <TableHead className="w-[120px] min-w-[100px]">
                      <ColumnFilter
                        column="icp"
                        title="ICP"
                        values={[...new Set(prospects.map(p => p.icp?.nome || 'Sem ICP').filter(Boolean))]}
                        selectedValues={filterICP}
                        onFilterChange={setFilterICP}
                      />
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[90px]">
                      <ColumnFilter
                        column="grade"
                        title="Grade"
                        values={['A+', 'A', 'B', 'C', 'D', 'Sem Grade']}
                        selectedValues={filterGrade}
                        onFilterChange={setFilterGrade}
                      />
                    </TableHead>
                    <TableHead className="w-20 min-w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selectedIds.has(prospect.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(prospect.id, checked as boolean)
                            }
                          />
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 1. Empresa (Razão Social) */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div>
                            <button
                              onClick={() => handleShowFullPreview(prospect.cnpj)}
                              className="font-medium hover:text-primary hover:underline"
                              title={prospect.razao_social || 'Sem nome'}
                            >
                              {prospect.razao_social || 'Sem nome'}
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 2. CNPJ (com badge verde se enriquecido) */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {(() => {
                            const hasReceita = !!(prospect.enrichment?.raw?.receita_federal || prospect.enrichment?.raw?.receita || prospect.enrichment?.raw?.situacao);
                            return (
                              <Badge 
                                variant={hasReceita ? "default" : "outline"}
                                className={`font-mono text-xs cursor-pointer hover:bg-primary/10 transition-colors ${
                                  hasReceita 
                                    ? "bg-emerald-600/10 text-emerald-600 border-emerald-600/30" 
                                    : ""
                                }`}
                                onClick={() => handleShowFullPreview(prospect.cnpj)}
                              >
                                {formatCNPJ(prospect.cnpj)}
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 3. Origem */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {(() => {
                            const origem = getProspectOrigin(prospect);
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
                                Sem origem
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 4. Status CNPJ */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
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
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 5. CNAE (canônico) */}
                      <TableCell className="text-left align-top">
                        {(() => {
                          const cnaeResolution = resolveCompanyCNAE(prospect);
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
                      {/* ✅ ORDEM CORRETA: 6. Nome Fantasia */}
                      <TableCell className="text-center">
                        {(() => {
                          const fantasia = prospect.enrichment?.fantasia || prospect.nome_fantasia;
                          if (fantasia && 
                              fantasia.trim() !== '' && 
                              fantasia.trim().toUpperCase() !== prospect.razao_social?.trim().toUpperCase()) {
                            return <span title={fantasia}>{fantasia}</span>;
                          }
                          return '-';
                        })()}
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 7. UF */}
                      <TableCell className="text-center">
                        <span>
                          {getProspectUF(prospect) || '-'}
                        </span>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 8. Cidade */}
                      <TableCell className="text-center">
                        <span>
                          {getProspectCity(prospect) || '-'}
                        </span>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 9. Setor (Setor + Categoria com BADGES) */}
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1 flex-wrap">
                          {(() => {
                            const classification = getCNAEClassificationForProspect(prospect);
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
                            
                            return (
                              <span className="text-xs text-muted-foreground" title="Sem setor">
                                Sem setor
                              </span>
                            );
                          })()}
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 9. ICP */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {prospect.icp?.nome ? (
                            <Badge variant="outline" className="text-xs">
                              {prospect.icp.nome}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      {/* ✅ ORDEM CORRETA: 10. Grade */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
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
                        </div>
                      </TableCell>
                      {/* ✅ NOVO: 11. Purchase Intent Score */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <PurchaseIntentBadge 
                          score={prospect.purchase_intent_score} 
                          intentType={(prospect as any).purchase_intent_type || 'potencial'}
                          size="sm"
                        />
                        </div>
                      </TableCell>
                      {/* ✅ NOVA COLUNA: Website */}
                      <TableCell className="text-center">
                        {(() => {
                          const websiteUrl = formatWebsiteUrl(prospect.website_encontrado || prospect.website);
                          if (!websiteUrl) {
                            return <span className="text-muted-foreground text-sm">-</span>;
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
                        {prospect.website_fit_score != null && prospect.website_fit_score >= 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center justify-center mx-auto text-green-600 cursor-help">
                                  <Target className="h-4 w-4" />
                                </div>
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
                      <TableCell className="text-center">
                        {(() => {
                          const linkedinUrl = formatWebsiteUrl(prospect.linkedin_url);
                          if (!linkedinUrl) {
                            return <span className="text-muted-foreground text-sm">-</span>;
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
                              {/* ✅ Consultar Receita Federal */}
                              <DropdownMenuItem
                                onClick={() => handleIndividualEnrich(prospect.id)}
                                disabled={enrichingIds.has(prospect.id)}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Consultar Receita Federal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* ✅ Enviar para Base de Empresas */}
                              <DropdownMenuItem
                                onClick={() => handlePromoteIndividualToCompanies(prospect.id)}
                                disabled={processing}
                              >
                                <Database className="w-4 h-4 mr-2" />
                                Enviar para Banco de Empresas
                              </DropdownMenuItem>
                              {/* ✅ Exportar registro */}
                              <DropdownMenuItem
                                onClick={() => {
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
                              {/* ✅ Excluir com proteção */}
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

      {/* ✅ MODAL UNIFICADO: Usar componente CompanyPreviewModal */}
      {previewProspect && (
        <CompanyPreviewModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          company={previewProspect}
        />
      )}
      
      {/* ✅ Modal de Preview Completo (compatibilidade com handleShowFullPreview) */}
      {fullPreviewData && previewProspect && (
        <CompanyPreviewModal
          open={showFullPreview}
          onOpenChange={setShowFullPreview}
          company={previewProspect}
        />
      )}
    </div>
  );
}


