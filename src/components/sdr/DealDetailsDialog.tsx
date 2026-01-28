import { useState, useEffect, useMemo, useCallback } from 'react';
import { DraggableDialog } from '@/components/ui/draggable-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Clock, User, MessageSquare, Save, Phone, Building2, Video, Mail, Target, CheckCircle, Brain, ExternalLink, Linkedin, Zap, Pencil, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Deal } from '@/hooks/useDeals';
import { useUpdateDeal, useDealActivities } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CallInterface } from '@/components/sdr/CallInterface';
import { DealQuickActions } from '@/components/sdr/DealQuickActions';
import { VideoCallInterface } from '@/components/sdr/VideoCallInterface';
import { CommunicationTimeline } from '@/components/sdr/CommunicationTimeline';
import { WhatsAppQuickSend } from '@/components/sdr/WhatsAppQuickSend';
import { EnhancedWhatsAppInterface } from '@/components/sdr/EnhancedWhatsAppInterface';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ImportPlaudRecording } from '@/components/plaud/ImportPlaudRecording';
import { CallRecordingsTab } from '@/components/plaud/CallRecordingsTab';
import { QuarantineReportModal } from '@/components/icp/QuarantineReportModal';
import { useTenant } from '@/contexts/TenantContext';
import { useLatestSTCReport } from '@/hooks/useSTCHistory';
import { useProductFit } from '@/hooks/useProductFit';
import { useDiscoveryEnrichmentPipeline } from '@/hooks/useDiscoveryEnrichmentPipeline';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

/** Fase 2 Discovery: Fit, Intenção, Risco e Comentário persistidos em tags do deal (sem alterar tabelas) */
const DISCOVERY_FIT_PREFIX = 'discovery_fit_';
const DISCOVERY_INTENCAO_PREFIX = 'discovery_intencao_';
const DISCOVERY_RISCO_PREFIX = 'discovery_risco_';
const DISCOVERY_COMENTARIO_PREFIX = 'discovery_comentario:';
const FIT_VALUES = ['baixo', 'medio', 'alto'] as const;
const INTENCAO_VALUES = ['exploratoria', 'ativa', 'estrategica'] as const;
const RISCO_VALUES = ['baixo', 'medio', 'alto'] as const;
type DiscoveryFit = typeof FIT_VALUES[number];
type DiscoveryIntencao = typeof INTENCAO_VALUES[number];
type DiscoveryRisco = typeof RISCO_VALUES[number];
const COMENTARIO_MAX_LEN = 200;

function getDiscoveryFit(deal: Deal & { tags?: string[] }): DiscoveryFit | '' {
  const tag = deal.tags?.find(t => t.startsWith(DISCOVERY_FIT_PREFIX));
  const v = tag?.replace(DISCOVERY_FIT_PREFIX, '');
  return v && FIT_VALUES.includes(v as DiscoveryFit) ? (v as DiscoveryFit) : '';
}
function getDiscoveryIntencao(deal: Deal & { tags?: string[] }): DiscoveryIntencao | '' {
  const tag = deal.tags?.find(t => t.startsWith(DISCOVERY_INTENCAO_PREFIX));
  const v = tag?.replace(DISCOVERY_INTENCAO_PREFIX, '');
  return v && INTENCAO_VALUES.includes(v as DiscoveryIntencao) ? (v as DiscoveryIntencao) : '';
}
function getDiscoveryRisco(deal: Deal & { tags?: string[] }): DiscoveryRisco | '' {
  const tag = deal.tags?.find(t => t.startsWith(DISCOVERY_RISCO_PREFIX));
  const v = tag?.replace(DISCOVERY_RISCO_PREFIX, '');
  return v && RISCO_VALUES.includes(v as DiscoveryRisco) ? (v as DiscoveryRisco) : '';
}
function getDiscoveryComentario(deal: Deal & { tags?: string[] }): string {
  const tag = deal.tags?.find(t => t.startsWith(DISCOVERY_COMENTARIO_PREFIX));
  return tag ? tag.slice(DISCOVERY_COMENTARIO_PREFIX.length) : '';
}
function buildDiscoveryTags(
  tags: string[] | undefined,
  fit: DiscoveryFit | '',
  intencao: DiscoveryIntencao | '',
  risco: DiscoveryRisco | '',
  comentario: string
): string[] {
  const others = (tags || []).filter(
    t => !t.startsWith(DISCOVERY_FIT_PREFIX) && !t.startsWith(DISCOVERY_INTENCAO_PREFIX) && !t.startsWith(DISCOVERY_RISCO_PREFIX) && !t.startsWith(DISCOVERY_COMENTARIO_PREFIX)
  );
  const next = [...others];
  if (fit) next.push(DISCOVERY_FIT_PREFIX + fit);
  if (intencao) next.push(DISCOVERY_INTENCAO_PREFIX + intencao);
  if (risco) next.push(DISCOVERY_RISCO_PREFIX + risco);
  if (comentario.trim()) next.push(DISCOVERY_COMENTARIO_PREFIX + comentario.slice(0, COMENTARIO_MAX_LEN));
  return next;
}

interface DealDetailsDialogProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mapeia fit_level do product-fit para valor do Bloco B Discovery */
function fitLevelToDiscovery(fitLevel: 'high' | 'medium' | 'low' | undefined): DiscoveryFit | '' {
  if (!fitLevel) return '';
  if (fitLevel === 'high') return 'alto';
  if (fitLevel === 'medium') return 'medio';
  return 'baixo';
}

/** Deriva sugestão de Intenção a partir de full_report */
function suggestIntencaoFromReport(fullReport: Record<string, unknown> | null | undefined): DiscoveryIntencao | '' {
  if (!fullReport?.decisors_report) return '';
  const dr = fullReport.decisors_report as { decisors?: unknown[] } | undefined;
  const n = Array.isArray(dr?.decisors) ? dr.decisors.length : 0;
  if (n >= 2) return 'ativa';
  if (n >= 1) return 'estrategica';
  return 'exploratoria';
}

/** Deriva sugestão de Risco a partir de full_report */
function suggestRiscoFromReport(fullReport: Record<string, unknown> | null | undefined): DiscoveryRisco | '' {
  if (!fullReport) return '';
  const dig = fullReport.digital_report as { website?: string; linkedin?: string } | undefined;
  const hasWeb = !!(dig?.website?.trim?.());
  const hasLi = !!(dig?.linkedin?.trim?.());
  if (hasWeb && hasLi) return 'baixo';
  if (hasWeb || hasLi) return 'medio';
  return 'alto';
}

/** Gera comentário executivo (máx. 200 caracteres) a partir de full_report e fit */
function buildComentarioFromReport(
  fullReport: Record<string, unknown> | null | undefined,
  fitLevel: 'high' | 'medium' | 'low' | undefined
): string {
  const parts: string[] = [];
  if (fitLevel === 'high') parts.push('Fit alto.');
  else if (fitLevel === 'medium') parts.push('Fit médio.');
  else if (fitLevel === 'low') parts.push('Fit baixo.');
  const dr = fullReport?.decisors_report as { decisors?: unknown[] } | undefined;
  const n = Array.isArray(dr?.decisors) ? dr.decisors.length : 0;
  if (n > 0) parts.push(`${n} decisor(es) mapeado(s).`);
  const dig = fullReport?.digital_report as { website?: string } | undefined;
  if (dig?.website) parts.push('Website presente.');
  const out = parts.join(' ').slice(0, COMENTARIO_MAX_LEN);
  return out;
}

type LinkEditField = 'website' | 'linkedin' | 'apollo' | 'lusha' | null;

export function DealDetailsDialog({ deal, open, onOpenChange }: DealDetailsDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateDeal = useUpdateDeal();
  const { data: activities } = useDealActivities(deal?.id || '');
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? null;
  const companyNameForReport = deal ? String((deal.companies as { company_name?: string; name?: string })?.company_name ?? (deal.companies as { company_name?: string; name?: string })?.name ?? '') : '';
  const { data: latestReport } = useLatestSTCReport(deal?.company_id ?? undefined, companyNameForReport || undefined);
  const { data: productFit } = useProductFit({
    companyId: deal?.company_id ?? undefined,
    tenantId: tenantId ?? undefined,
    enabled: !!(open && deal?.stage === 'discovery' && deal?.company_id && tenantId),
  });
  const { runPipeline, isRunning: pipelineRunning, progress: pipelineProgress } = useDiscoveryEnrichmentPipeline({
    companyId: deal?.company_id ?? undefined,
    tenantId: tenantId ?? undefined,
  });

  const [editedDeal, setEditedDeal] = useState<Partial<Deal & { tags?: string[] }>>({});
  const [linkEditField, setLinkEditField] = useState<LinkEditField>(null);
  const [linkEditValue, setLinkEditValue] = useState('');
  const [linkEditSaving, setLinkEditSaving] = useState(false);
  const [discoveryFit, setDiscoveryFit] = useState<DiscoveryFit | ''>('');
  const [discoveryIntencao, setDiscoveryIntencao] = useState<DiscoveryIntencao | ''>('');
  const [discoveryRisco, setDiscoveryRisco] = useState<DiscoveryRisco | ''>('');
  const [discoveryComentario, setDiscoveryComentario] = useState('');
  const [dossieOpen, setDossieOpen] = useState(false);
  const [note, setNote] = useState('');
  const [primaryContact, setPrimaryContact] = useState<{ id: string; name?: string; email?: string; phone?: string } | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showPlaudImport, setShowPlaudImport] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!deal?.company_id) {
      setPrimaryContact(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingContact(true);
      try {
        const { data } = await supabase
          .from('contacts')
          .select('id, name, email, phone')
          .eq('company_id', deal.company_id as string)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!cancelled) setPrimaryContact((data as any) || null);
      } finally {
        if (!cancelled) setLoadingContact(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deal?.company_id, open]);

  useEffect(() => {
    if (open && deal && deal.stage === 'discovery') {
      const d = deal as Deal & { tags?: string[] };
      setDiscoveryFit(getDiscoveryFit(d));
      setDiscoveryIntencao(getDiscoveryIntencao(d));
      setDiscoveryRisco(getDiscoveryRisco(d));
      setDiscoveryComentario(getDiscoveryComentario(d));
    }
  }, [open, deal?.id, deal?.stage]);

  // Pré-sugestões Bloco B a partir de product_fit e full_report (somente quando ainda vazio; não sobrescreve edição do usuário)
  useEffect(() => {
    if (!open || !deal || deal.stage !== 'discovery') return;
    const fr = latestReport?.full_report as Record<string, unknown> | undefined;
    if (productFit?.fit_level && discoveryFit === '') {
      setDiscoveryFit(fitLevelToDiscovery(productFit.fit_level));
    }
    if (fr && discoveryIntencao === '') {
      const sug = suggestIntencaoFromReport(fr);
      if (sug) setDiscoveryIntencao(sug);
    }
    if (fr && discoveryRisco === '') {
      const sug = suggestRiscoFromReport(fr);
      if (sug) setDiscoveryRisco(sug);
    }
    if (fr && !discoveryComentario.trim()) {
      const sug = buildComentarioFromReport(fr, productFit?.fit_level);
      if (sug) setDiscoveryComentario(sug);
    }
  }, [open, deal?.id, deal?.stage, latestReport, productFit?.fit_level, discoveryFit, discoveryIntencao, discoveryRisco, discoveryComentario]);

  const hasAtLeastOneEnrichedSource = useMemo(() => {
    const r = latestReport?.full_report as Record<string, unknown> | null | undefined;
    if (!r) return false;
    const hasFit = r.product_fit_report != null && typeof r.product_fit_report === 'object';
    const dr = r.decisors_report as { decisors?: unknown[] } | undefined;
    const hasDecisors = dr != null && (Array.isArray(dr.decisors) ? dr.decisors.length > 0 : typeof dr === 'object');
    const hasDigital = r.digital_report != null && typeof r.digital_report === 'object';
    return !!(hasFit || hasDecisors || hasDigital);
  }, [latestReport]);

  const handleExecuteSuggestion = useCallback((suggestion: { type?: string; action?: string }) => {
    if (suggestion.type === 'meeting' || (suggestion.action || '').toLowerCase().includes('demo')) {
      setActiveTab('details');
    }
  }, []);

  const linkEditLabel = linkEditField === 'website' ? 'Website' : linkEditField === 'linkedin' ? 'LinkedIn' : linkEditField === 'apollo' ? 'Apollo (ID ou URL)' : linkEditField === 'lusha' ? 'Lusha' : '';

  const handleSaveLinkEdit = useCallback(async () => {
    const companyId = deal?.company_id;
    if (!companyId || !linkEditField) return;
    const v = String(linkEditValue ?? '').trim();
    setLinkEditSaving(true);
    try {
      if (linkEditField === 'website') {
        let host = '';
        try {
          const u = v.startsWith('http') ? v : `https://${v}`;
          host = new URL(u).hostname || '';
        } catch {
          host = v.replace(/^https?:\/\//, '').split('/')[0] || '';
        }
        const { error } = await supabase.from('companies').update({ website: v, domain: host || undefined }).eq('id', companyId);
        if (error) throw error;
        toast.success('Website gravado. Kanban, Fit e Apollo Decisores usarão este valor.');
      } else if (linkEditField === 'linkedin') {
        const { error } = await supabase.from('companies').update({ linkedin_url: v || null }).eq('id', companyId);
        if (error) throw error;
        toast.success('LinkedIn gravado. Kanban e Apollo Decisores usarão este valor.');
      } else if (linkEditField === 'apollo') {
        let apolloId = v.trim();
        if (v.includes('/')) {
          const orgPrefix = 'organizations/';
          const idx = v.indexOf(orgPrefix);
          if (idx !== -1) {
            const after = v.slice(idx + orgPrefix.length);
            const match = after.match(/^([a-zA-Z0-9]+)/);
            apolloId = match ? match[1] : apolloId;
          } else {
            const parts = v.split('/').filter(Boolean);
            apolloId = parts[parts.length - 1] || apolloId;
          }
        }
        const apolloUrl = v.startsWith('http') ? v : (apolloId ? `https://app.apollo.io/#/organizations/${apolloId}` : null);
        const { error } = await supabase.from('companies').update({ apollo_organization_id: apolloId || null, apollo_url: apolloUrl || null }).eq('id', companyId);
        if (error) throw error;
        toast.success('Apollo gravado. Apollo Decisores e enriquecimento usarão este valor.');
      } else if (linkEditField === 'lusha') {
        const comp = deal?.companies as { raw_data?: Record<string, unknown> } | null | undefined;
        const raw = (comp?.raw_data && typeof comp.raw_data === 'object' && !Array.isArray(comp.raw_data)) ? comp.raw_data : {};
        const { error } = await supabase.from('companies').update({ raw_data: { ...raw, lusha_company_url: v || null } }).eq('id', companyId);
        if (error) throw error;
        toast.success('Lusha gravado. Enriquecimento alternativo usará este valor.');
      }
      queryClient.invalidateQueries({ queryKey: ['company-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sdr_deals'] });
      await queryClient.refetchQueries({ queryKey: ['sdr_deals'] });
      setLinkEditField(null);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Erro ao salvar');
    } finally {
      setLinkEditSaving(false);
    }
  }, [deal?.company_id, deal?.companies, linkEditField, linkEditValue, queryClient]);

  if (!deal) return null;

  const currentDeal = { ...deal, ...editedDeal } as Deal & { tags?: string[] };

  const handleSave = async () => {
    const updates = { ...editedDeal } as Record<string, unknown>;
    if (deal.stage === 'discovery') {
      updates.tags = buildDiscoveryTags(currentDeal.tags, discoveryFit, discoveryIntencao, discoveryRisco, discoveryComentario);
    }
    if (Object.keys(updates).length > 0) {
      await updateDeal.mutateAsync({ dealId: deal.id, updates });
      setEditedDeal({});
      if (deal.stage === 'discovery' && updates.tags) {
        const next = { ...deal, tags: updates.tags as string[] } as Deal & { tags?: string[] };
        setDiscoveryFit(getDiscoveryFit(next));
        setDiscoveryIntencao(getDiscoveryIntencao(next));
        setDiscoveryRisco(getDiscoveryRisco(next));
        setDiscoveryComentario(getDiscoveryComentario(next));
      }
      onOpenChange(false);
    }
  };
  const companyName = (deal.companies as { company_name?: string; name?: string } | undefined)?.company_name ?? (deal.companies as { company_name?: string; name?: string } | undefined)?.name ?? '';
  const companiesData = deal.companies as { sector_name?: string; website?: string; linkedin_url?: string; raw_data?: Record<string, unknown>; apollo_organization_id?: string | null; apollo_url?: string | null } | undefined;
  const lushaUrl = (companiesData?.raw_data && typeof companiesData.raw_data === 'object' && (companiesData.raw_data as Record<string, unknown>).lusha_company_url) ? String((companiesData.raw_data as Record<string, unknown>).lusha_company_url) : '';
  const desc = (deal.description || '') as string;
  const icpMatch = desc.match(/ICP Score:\s*(\d+)/i);
  const tempMatch = desc.match(/Temperatura:\s*(\w+)/i);
  const cnpjFromRaw = companiesData?.raw_data && typeof companiesData.raw_data === 'object' && companiesData.raw_data !== null ? (companiesData.raw_data as Record<string, unknown>).cnpj ?? (companiesData.raw_data as Record<string, unknown>).cnpj_raiz : null;
  const cnpjDisplay = typeof cnpjFromRaw === 'string' ? cnpjFromRaw : (deal as { cnpj?: string }).cnpj ?? (companiesData?.raw_data && (companiesData.raw_data as Record<string, unknown>).cnpj) ?? '—';
  const setDiscoveryTagsInEdited = (fit: DiscoveryFit | '', intencao: DiscoveryIntencao | '', risco: DiscoveryRisco | '', coment: string) => {
    setEditedDeal(prev => ({ ...prev, tags: buildDiscoveryTags(prev.tags ?? (deal as Deal & { tags?: string[] }).tags, fit, intencao, risco, coment) }));
  };

  return (
    <DraggableDialog open={open} onOpenChange={onOpenChange} title={currentDeal.title} className="max-w-4xl max-h-[90vh]">
        <div className="flex items-center justify-end mb-2">
          <Button onClick={handleSave} disabled={Object.keys(editedDeal).length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="ai">IA Sugestões</TabsTrigger>
            <TabsTrigger value="comms">Comunicação</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="activity">Atividades</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={currentDeal.title}
                    onChange={(e) => setEditedDeal({ ...editedDeal, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={currentDeal.description || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Value & Probability */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      value={currentDeal.value}
                      onChange={(e) => setEditedDeal({ ...editedDeal, value: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Probabilidade (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={currentDeal.probability}
                      onChange={(e) => setEditedDeal({ ...editedDeal, probability: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={currentDeal.priority}
                      onValueChange={(value) => setEditedDeal({ ...editedDeal, priority: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={currentDeal.status}
                      onValueChange={(value) => setEditedDeal({ ...editedDeal, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="won">Ganho</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                        <SelectItem value="abandoned">Abandonado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fase 2 Discovery — CENTRO ÚNICO: BLOCO A (contexto), BLOCO B (decisão), BLOCO C (dossiê), GO */}
                {deal.stage === 'discovery' && (
                  <>
                    {/* BLOCO A — CONTEXTO E LINKS OFICIAIS (fonte para Kanban, Fit, Apollo Decisores) */}
                    <Card className="p-4 border-muted bg-muted/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">Contexto e links oficiais</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Edite aqui para que Kanban, Fit de Produto e Apollo Decisores usem estes valores. Corrija website e LinkedIn quando estiverem errados.</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Empresa:</span> {companyName || '—'}</div>
                        <div><span className="text-muted-foreground">CNPJ:</span> {String(cnpjDisplay || '—')}</div>
                        <div><span className="text-muted-foreground">Setor / CNAE:</span> {(companiesData as { sector_name?: string; industry?: string })?.sector_name ?? (companiesData as { industry?: string })?.industry ?? '—'}</div>
                        <div><span className="text-muted-foreground">ICP Score:</span> {icpMatch?.[1] ?? '—'}</div>
                        <div><span className="text-muted-foreground">Temperatura:</span> {tempMatch?.[1] ?? '—'}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-muted-foreground">Website:</span>
                          {companiesData?.website ? (
                            <a href={companiesData.website.startsWith('http') ? companiesData.website : `https://${companiesData.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[200px]">{companiesData.website}</a>
                          ) : <span>—</span>}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setLinkEditField('website'); setLinkEditValue(companiesData?.website ?? ''); }} title="Editar website"><Pencil className="h-3 w-3" /></Button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-muted-foreground">LinkedIn:</span>
                          {companiesData?.linkedin_url ? (
                            <a href={String(companiesData.linkedin_url).startsWith('http') ? companiesData.linkedin_url : `https://linkedin.com/company/${String(companiesData.linkedin_url).replace(/^\/company\//, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[200px]"><Linkedin className="h-3 w-3" />Empresa</a>
                          ) : <span>—</span>}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setLinkEditField('linkedin'); setLinkEditValue(companiesData?.linkedin_url ?? ''); }} title="Editar LinkedIn"><Pencil className="h-3 w-3" /></Button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-muted-foreground">Apollo:</span>
                          {(companiesData as { apollo_url?: string | null; apollo_organization_id?: string | null })?.apollo_url || (companiesData as { apollo_organization_id?: string | null })?.apollo_organization_id ? (
                            <a href={(companiesData as { apollo_url?: string | null }).apollo_url || `https://app.apollo.io/#/organizations/${(companiesData as { apollo_organization_id?: string | null }).apollo_organization_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[200px]"><ExternalLink className="h-3 w-3" />ID/URL</a>
                          ) : <span>—</span>}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setLinkEditField('apollo'); setLinkEditValue((companiesData as { apollo_url?: string | null })?.apollo_url ?? (companiesData as { apollo_organization_id?: string | null })?.apollo_organization_id ?? ''); }} title="Editar Apollo (ID ou URL)"><Pencil className="h-3 w-3" /></Button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-muted-foreground">Lusha:</span>
                          {lushaUrl ? (
                            <a href={lushaUrl.startsWith('http') ? lushaUrl : `https://${lushaUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[200px]"><ExternalLink className="h-3 w-3" />Link</a>
                          ) : <span>—</span>}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setLinkEditField('lusha'); setLinkEditValue(lushaUrl); }} title="Editar Lusha"><Pencil className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </Card>

                    {/* Modal único: Editar Website / LinkedIn / Apollo / Lusha */}
                    <Dialog open={linkEditField !== null} onOpenChange={(o) => { if (!o) setLinkEditField(null); }}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Editar {linkEditLabel}</DialogTitle>
                          <DialogDescription>Este valor será a fonte oficial para Kanban, Fit de Produto e Apollo Decisores.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                          <div className="grid gap-2">
                            <Label htmlFor="link-edit-input">{linkEditLabel}</Label>
                            <Input id="link-edit-input" value={linkEditValue} onChange={(e) => setLinkEditValue(e.target.value)} placeholder={linkEditField === 'apollo' ? 'ID ou URL da organização Apollo' : linkEditField === 'lusha' ? 'URL Lusha da empresa' : linkEditField === 'website' ? 'https://...' : 'https://linkedin.com/company/...'} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setLinkEditField(null)} variant="outline">Cancelar</Button>
                          <Button onClick={handleSaveLinkEdit} disabled={linkEditSaving}>
                            {linkEditSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* BLOCO B — DECISÃO (DISCOVERY) */}
                    <Card className="p-4 border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Decisão Estratégica — Discovery</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Fit do Produto</Label>
                          <Select value={discoveryFit || '_'} onValueChange={(v) => { const fit = v === '_' ? '' : (v as DiscoveryFit); setDiscoveryFit(fit); setDiscoveryTagsInEdited(fit, discoveryIntencao, discoveryRisco, discoveryComentario); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              <SelectItem value="baixo">Baixo</SelectItem>
                              <SelectItem value="medio">Médio</SelectItem>
                              <SelectItem value="alto">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Intenção do Cliente</Label>
                          <Select value={discoveryIntencao || '_'} onValueChange={(v) => { const intencao = v === '_' ? '' : (v as DiscoveryIntencao); setDiscoveryIntencao(intencao); setDiscoveryTagsInEdited(discoveryFit, intencao, discoveryRisco, discoveryComentario); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              <SelectItem value="exploratoria">Exploratória</SelectItem>
                              <SelectItem value="ativa">Ativa</SelectItem>
                              <SelectItem value="estrategica">Estratégica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Risco Percebido</Label>
                          <Select value={discoveryRisco || '_'} onValueChange={(v) => { const risco = v === '_' ? '' : (v as DiscoveryRisco); setDiscoveryRisco(risco); setDiscoveryTagsInEdited(discoveryFit, discoveryIntencao, risco, discoveryComentario); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              <SelectItem value="baixo">Baixo</SelectItem>
                              <SelectItem value="medio">Médio</SelectItem>
                              <SelectItem value="alto">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Label>Comentário Executivo</Label>
                        <Textarea placeholder="Comentário curto para decisão GO/NO-GO..." value={discoveryComentario} onChange={(e) => { setDiscoveryComentario(e.target.value); setDiscoveryTagsInEdited(discoveryFit, discoveryIntencao, discoveryRisco, e.target.value); }} rows={2} className="resize-none" />
                      </div>
                    </Card>

                    {/* BLOCO C — DOSSÊ E INTELIGÊNCIA */}
                    <Card className="p-4 border-primary/20 bg-primary/5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Dossiê e Inteligência</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            disabled={!deal.company_id || !tenantId || pipelineRunning}
                            onClick={() => runPipeline()}
                          >
                            <Zap className="h-4 w-4" />
                            {pipelineRunning ? 'Executando...' : 'Executar Enriquecimento Estratégico (Discovery)'}
                          </Button>
                          <Button variant="default" size="sm" className="gap-2" onClick={() => setDossieOpen(true)}>
                            <Brain className="h-4 w-4" />
                            Abrir Dossiê Estratégico
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Fonte: stc_verification_history. Execute o enriquecimento para preencher website, decisores e fit; o GO exige Fit, Intenção, Comentário e ao menos uma fonte enriquecida.</p>
                      {/* Barra de progresso do enriquecimento: etapa atual + percentual */}
                      {(pipelineRunning || pipelineProgress) && (
                        <div className="mt-3 space-y-2 rounded-lg border border-primary/20 bg-background/50 p-3">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-foreground">
                              {pipelineProgress?.stepName ?? 'Iniciando...'}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {pipelineProgress?.percent ?? 0}%
                            </span>
                          </div>
                          <Progress value={pipelineProgress?.percent ?? 0} className="h-2" />
                        </div>
                      )}
                    </Card>

                    {/* SUGESTÕES IA — produto, abordagem, roteiro SDR (após enriquecimento) */}
                    {hasAtLeastOneEnrichedSource && (productFit?.products_recommendation?.length ?? 0) > 0 && (
                      <Card className="p-4 border-muted bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-muted-foreground">Sugestões para o SDR (após enriquecimento)</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground font-medium">Produto/serviço:</span>{' '}
                            {productFit?.products_recommendation?.[0]?.product_name ?? productFit?.products_recommendation?.[0]?.justification ?? '—'}
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Abordagem:</span>{' '}
                            {productFit?.fit_level === 'high'
                              ? 'Enfatizar alinhamento ao setor e fit; proposta de valor direta.'
                              : productFit?.fit_level === 'medium'
                              ? 'Abordar dores do setor e conectar com benefícios dos produtos.'
                              : 'Explorar necessidades antes de recomendar produto específico.'}
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Roteiro 1º contato:</span>{' '}
                            <span className="text-muted-foreground">
                              Abertura: contexto da empresa e setor. Gancho: dor comum do segmento. Proposta: valor em 1 frase (ex.: “ajudamos empresas como a sua a…”).
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* GO e Data de Fechamento ficam no Dossiê — após fit, decisores, contatos e sequências */}
                    <p className="text-xs text-muted-foreground text-center rounded-md border border-muted bg-muted/30 px-3 py-2">
                      Para avançar para Proposta e definir data de fechamento: use o <strong>Dossiê Estratégico</strong> (botão acima) após ver Fit de Produtos, marcar decisores corretos, alimentar o card de contatos, enviar as primeiras sequências (email, WhatsApp, msgs e calls). O GO será utilizado lá para seguir à próxima etapa.
                    </p>
                  </>
                )}

                {/* Data Esperada de Fechamento: só fora de Discovery; em Discovery fica no Dossiê */}
                {deal.stage !== 'discovery' && (
                  <div className="space-y-2">
                    <Label>Data Esperada de Fechamento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !currentDeal.expected_close_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentDeal.expected_close_date ? (
                            format(new Date(currentDeal.expected_close_date), "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={currentDeal.expected_close_date ? new Date(currentDeal.expected_close_date) : undefined}
                          onSelect={(date) => setEditedDeal({ ...editedDeal, expected_close_date: date?.toISOString() })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <DealQuickActions deal={currentDeal} onExecuteAction={handleExecuteSuggestion} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-3 pr-4">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                    <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "PPp", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activities || activities.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma atividade registrada
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Adicionar nota..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
              <Button onClick={() => setNote('')} disabled={!note}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Adicionar Nota
              </Button>
            </div>
            <ScrollArea className="h-[45vh]">
              <p className="text-sm text-muted-foreground text-center py-8">
                Sistema de notas em desenvolvimento
              </p>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Gravações de Calls</h3>
              <Button onClick={() => setShowPlaudImport(true)} size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Importar Call
              </Button>
            </div>
            <ScrollArea className="h-[55vh]">
              <CallRecordingsTab 
                dealId={deal?.id} 
                companyId={deal?.company_id} 
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comms" className="space-y-4">
            {showVideoCall ? (
              <VideoCallInterface
                roomName={`deal-${deal.id}`}
                displayName="SDR"
                onCallEnd={() => setShowVideoCall(false)}
              />
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="grid gap-4 pr-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      Telefonia
                    </h3>
                    {loadingContact ? (
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : primaryContact?.phone ? (
                      <CallInterface
                        phoneNumber={primaryContact.phone}
                        contactName={primaryContact.name}
                        companyId={currentDeal.company_id}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Adicione um telefone ao contato principal
                      </p>
                    )}
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Video className="h-5 w-5 text-purple-600" />
                      Videoconferência
                    </h3>
                    <Button 
                      onClick={() => setShowVideoCall(true)}
                      className="w-full gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Iniciar Videochamada Jitsi
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      📹 Sala segura e criptografada - Compartilhe o link com o cliente
                    </p>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                      WhatsApp Business
                    </h3>
                    <EnhancedWhatsAppInterface
                      contactPhone={primaryContact?.phone}
                      contactName={primaryContact?.name}
                      companyId={currentDeal.company_id}
                      dealId={deal.id}
                    />
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-600" />
                      Email
                    </h3>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => navigate('/sdr/inbox')}
                    >
                      <Mail className="h-4 w-4" />
                      Abrir Inbox de Email
                    </Button>
                  </Card>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <CommunicationTimeline 
              dealId={deal.id} 
              companyId={currentDeal.company_id} 
            />
          </TabsContent>
        </Tabs>

        {/* Plaud Import Dialog */}
        <ImportPlaudRecording
          open={showPlaudImport}
          onOpenChange={setShowPlaudImport}
          dealId={deal.id}
          companyId={deal.company_id}
          companyName={deal.title}
          onSuccess={() => {
            setShowPlaudImport(false);
            // Refresh the call recordings tab
          }}
        />

        {/* BLOCO C — Dossiê Estratégico (aberto a partir do DealDetailsDialog em Discovery) */}
        {deal.stage === 'discovery' && (
          <QuarantineReportModal
            open={dossieOpen}
            onOpenChange={setDossieOpen}
            analysisId=""
            companyName={companyName || deal.title}
            companyId={deal.company_id ?? undefined}
            domain={companiesData?.website ?? companiesData?.domain ?? ''}
            discoveryOnly
            dealId={deal.id}
            initialExpectedCloseDate={currentDeal.expected_close_date ?? null}
            onDealAdvanced={() => { setDossieOpen(false); /* parent invalida deals via useMoveDeal */ }}
          />
        )}
    </DraggableDialog>
  );
}
