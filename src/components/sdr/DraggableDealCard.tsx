import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Building2, Calendar, TrendingUp, Clock, AlertCircle, User, Phone, ExternalLink, Linkedin, UserPlus } from 'lucide-react';
import type { Deal } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { DealCardActions } from './DealCardActions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveCompanyCNAE } from '@/lib/utils/cnaeResolver';
import { getSectorBadgeColors } from '@/lib/utils/sectorBadgeColors';
import { getCNAEClassification } from '@/services/cnaeClassificationService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DraggableDealCardProps {
  deal: Deal;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (dealId: string, selected: boolean) => void;
  onClick?: (deal: Deal) => void;
}

function usePrimaryContact(companyId: string | undefined) {
  return useQuery({
    queryKey: ['primary-contact', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('contacts')
        .select('id, name, email, phone')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data as { id: string; name?: string; email?: string; phone?: string } | null;
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });
}

export function DraggableDealCard({ deal, isDragging, isSelected, onSelect, onClick }: DraggableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const { data: primaryContact } = usePrimaryContact(deal.company_id ?? undefined);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: (isDragging || isSortableDragging) ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
  };

  const daysInStage = differenceInDays(new Date(), new Date(deal.created_at));
  const isStale = daysInStage > 7;

  const displayTitle = (deal as { deal_title?: string }).deal_title ?? deal.title ?? '';
  const companyName = deal.companies?.company_name ?? deal.companies?.name ?? '';
  const companiesData = deal.companies as { sector_name?: string; raw_data?: Record<string, unknown> } | null | undefined;
  // Badges da coluna Setor (setor_industria, categoria) — NÃO a descrição completa do CNAE
  const sectorName = companiesData?.sector_name ?? '';
  const sectorBadgesFromName = sectorName ? sectorName.split(/\s*-\s*/).map(s => s.trim()).filter(Boolean) : [];
  // Fallback: quando sector_name vem vazio, obter setor/categoria via CNAE (raw_data)
  const cnaeResolution = resolveCompanyCNAE(companiesData ?? {});
  const cnaeCode = cnaeResolution?.principal?.code ?? null;
  const { data: cnaeClassification } = useQuery({
    queryKey: ['cnae-classification-badges', cnaeCode],
    queryFn: () => (cnaeCode ? getCNAEClassification(cnaeCode) : Promise.resolve(null)),
    enabled: sectorBadgesFromName.length === 0 && !!cnaeCode,
    staleTime: 5 * 60 * 1000,
  });
  const sectorBadges =
    sectorBadgesFromName.length > 0
      ? sectorBadgesFromName
      : cnaeClassification
        ? [cnaeClassification.setor_industria, cnaeClassification.categoria].filter(Boolean)
        : [];
  // Website oficial: só companies.website e companies.domain (fonte = modal do deal; nunca raw_data/discovered)
  const comp = deal.companies as { website?: string; domain?: string } | null | undefined;
  const websiteOfficial = comp?.website || comp?.domain || '';

  // LinkedIn página da empresa: se já temos linkedin_url, usar; senão buscar com fórmula "primeiro nome + segundo nome + cidade + estado + país"
  const raw = comp?.raw_data || {};
  const city = (raw.city ?? raw.cidade ?? raw.municipio) as string | undefined;
  const state = (raw.state ?? raw.estado ?? raw.uf) as string | undefined;
  const country = (raw.country ?? raw.pais ?? 'Brasil') as string;
  const words = (companyName || '').trim().split(/\s+/).filter(w => w.length > 1);
  const primeiroNome = words[0] || '';
  const segundoNome = words[1] || '';
  const keywordsLinkedIn = [primeiroNome, segundoNome, city, state, country].filter(Boolean).join(' ');
  const linkedInCompanyUrl = (() => {
    const url = deal.companies?.linkedin_url;
    if (url && String(url).trim()) {
      return String(url).startsWith('http') ? url : `https://linkedin.com/company/${url.replace(/^\/company\//, '')}`;
    }
    if (companyName && keywordsLinkedIn) {
      return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(keywordsLinkedIn)}`;
    }
    if (companyName) {
      return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
    }
    return null;
  })();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-default hover:shadow-md transition-all",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(deal.id, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}
          <div className="mt-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} aria-label="Arrastar deal">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div
            className="flex-1 min-w-0 space-y-2 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onClick?.(deal); }}
            onDoubleClick={(e) => { e.stopPropagation(); onClick?.(deal); }}
          >
            {/* Título do deal */}
            <h4 className="font-medium text-sm leading-tight truncate" title={displayTitle}>{displayTitle}</h4>

            {/* Empresa */}
            {companyName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-medium text-foreground/90">{companyName}</span>
              </div>
            )}

            {/* Website oficial do prospect — na frente do card, mesmo valor gravado em companies */}
            {websiteOfficial && (
              <div className="flex items-center gap-1.5 text-xs">
                <a
                  href={websiteOfficial.startsWith('http') ? websiteOfficial : `https://${websiteOfficial}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-full"
                  title="Site oficial da empresa"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{websiteOfficial.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </a>
              </div>
            )}

            {/* Setor: badges com cores canônicas; tooltip ao passar o mouse mostra CNAE principal + todos secundários */}
            {sectorBadges.length > 0 && (() => {
              const tooltipPrincipal = cnaeResolution.principal.code || cnaeResolution.principal.description
                ? `${cnaeResolution.principal.code || 'N/A'} - ${cnaeResolution.principal.description || 'Sem descrição'}`
                : null;
              const tooltipSecundarios = cnaeResolution.secundarios.length > 0
                ? cnaeResolution.secundarios.map(s => `${s.code} - ${s.description || 'Sem descrição'}`).join('\n')
                : null;
              const tooltipText = [tooltipPrincipal ? `CNAE Principal:\n${tooltipPrincipal}` : null, tooltipSecundarios ? `CNAEs Secundários:\n${tooltipSecundarios}` : null].filter(Boolean).join('\n\n');
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-wrap items-center gap-1 cursor-help">
                        {sectorBadges.map((label, index) => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className={cn('text-[10px] px-1.5 py-0 h-5 border', getSectorBadgeColors(label, index === 0 ? 'setor' : 'categoria'))}
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm whitespace-pre-wrap p-3">
                      {tooltipText || sectorBadges.join(' - ')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}

            {/* Contato principal + telefone */}
            {(primaryContact?.name || primaryContact?.phone) && (
              <div className="space-y-0.5 text-xs text-muted-foreground">
                {primaryContact?.name && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">{primaryContact.name}</span>
                  </div>
                )}
                {primaryContact?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    <a href={`tel:${primaryContact.phone}`} onClick={(e) => e.stopPropagation()} className="truncate hover:underline text-primary">
                      {primaryContact.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Links: Site (website oficial) primeiro, depois LinkedIn página da empresa, LinkedIn contato, Mais contatos */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {websiteOfficial && (
                <a
                  href={websiteOfficial.startsWith('http') ? websiteOfficial : `https://${websiteOfficial}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  title="Website oficial da empresa"
                >
                  <ExternalLink className="h-3 w-3" />
                  Site
                </a>
              )}
              {linkedInCompanyUrl && (
                <a
                  href={linkedInCompanyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  title="LinkedIn – página da empresa"
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
              {primaryContact?.name && (
                <a
                  href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(primaryContact.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  title="Buscar contato no LinkedIn"
                >
                  <Linkedin className="h-3 w-3" />
                  Contato
                </a>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick?.(deal); }}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary hover:underline"
                title="Ver e adicionar mais contatos e telefones"
              >
                <UserPlus className="h-3 w-3" />
                {primaryContact ? 'Mais contatos' : 'Contatos'}
              </button>
            </div>

            {/* Lead Source */}
            {(deal as { lead_source?: string }).lead_source && (
              <Badge variant="secondary" className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-[10px] px-1.5 py-0 h-5">
                {(deal as { lead_source: string }).lead_source}
              </Badge>
            )}

            {/* Valor e probabilidade */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                R$ {((deal.value || 0) / 1000).toFixed(1)}k
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {deal.probability ?? 0}%
              </div>
            </div>

            {/* Data e dias no estágio */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              {deal.expected_close_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                </div>
              )}
              <div className={cn("flex items-center gap-1 text-xs", isStale ? "text-orange-600" : "text-muted-foreground")}>
                <Clock className="h-3 w-3" />
                {daysInStage}d no estágio
                {isStale && <AlertCircle className="h-3 w-3" />}
              </div>
            </div>

            {/* Prioridade */}
            <Badge variant="secondary" className={cn("text-xs", priorityColors[deal.priority || 'medium'])}>
              {(deal.priority || 'medium') === 'urgent' && '🔥 '}
              {(deal.priority || 'medium').toUpperCase()}
            </Badge>
          </div>

          <DealCardActions
            dealId={deal.id}
            dealTitle={displayTitle}
            companyId={deal.company_id}
          />
        </div>
      </CardContent>
    </Card>
  );
}
