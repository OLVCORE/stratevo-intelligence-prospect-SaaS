import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface VerificationPhase {
  id: string;
  name: string;
  count: number; // número de fontes
  status: 'pending' | 'in_progress' | 'completed' | 'timeout' | 'error';
  estimatedTime?: number; // segundos
  elapsedTime?: number; // tempo decorrido nesta fase
  evidencesFound?: number; // número de evidências encontradas nesta fase
  evidences?: Array<{ // detalhes das evidências
    url: string;
    title: string;
    snippet: string;
    match_type: 'single' | 'double' | 'triple';
    validation_method?: string;
  }>;
}

interface VerificationProgressBarProps {
  phases?: VerificationPhase[];
  currentPhase?: string;
  elapsedTime?: number; // segundos
  evidences?: Array<{ // evidências completas do backend
    url: string;
    title: string;
    snippet: string;
    match_type: 'single' | 'double' | 'triple';
    source: string; // sourceType (job_portals, totvs_cases, etc.)
    validation_method?: string;
  }>;
}

// 🎯 9 FASES REAIS DO BACKEND (conforme usage-verification/index.ts)
const PHASES: VerificationPhase[] = [
  { id: 'job_portals', name: 'Portais de Vagas', count: 4, status: 'pending', estimatedTime: 15 }, // LinkedIn, Indeed, Gupy, LinkedIn Posts
  { id: 'product_cases', name: 'Cases Oficiais', count: 3, status: 'pending', estimatedTime: 8 }, // Cases e notícias oficiais
  { id: 'official_sources', name: 'Fontes Oficiais', count: 10, status: 'pending', estimatedTime: 10 }, // CVM, B3, TJSP, etc.
  { id: 'premium_news', name: 'Notícias Premium', count: 29, status: 'pending', estimatedTime: 12 }, // Valor, Exame, InfoMoney, etc.
  { id: 'tech_portals', name: 'Portais Tech', count: 7, status: 'pending', estimatedTime: 8 }, // Baguete, CIO, TI Inside, etc.
  { id: 'video_content', name: 'Vídeos', count: 2, status: 'pending', estimatedTime: 5 }, // YouTube, Vimeo
  { id: 'social_media', name: 'Redes Sociais', count: 3, status: 'pending', estimatedTime: 5 }, // Instagram, Facebook, LinkedIn Posts
  { id: 'product_partners', name: 'Parceiros', count: 1, status: 'pending', estimatedTime: 3 }, // Parceiros oficiais
  { id: 'google_news', name: 'Google News', count: 1, status: 'pending', estimatedTime: 5 },
];

// 🗺️ Mapear sourceType do backend para phaseId
const SOURCE_TO_PHASE: Record<string, string> = {
  'job_portals': 'job_portals',
  'product_cases': 'product_cases',
  'totvs_cases': 'product_cases', // Compatibilidade com backend
  'official_docs': 'official_sources',
  'premium_news': 'premium_news',
  'tech_portals': 'tech_portals',
  'video_content': 'video_content',
  'social_media': 'social_media',
  'product_partners': 'product_partners',
  'totvs_partners': 'product_partners', // Compatibilidade com backend
  // Google News não tem sourceType específico, mas é identificado por URL
};

export function VerificationProgressBar({ 
  phases = PHASES, 
  currentPhase,
  elapsedTime = 0,
  evidences = []
}: VerificationProgressBarProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [previousPhase, setPreviousPhase] = useState<string | null>(null);
  
  // 🎯 Agrupar evidências por fase (sourceType → phaseId)
  const evidencesByPhase = evidences.reduce((acc, evidence) => {
    // Mapear source para phaseId
    let phaseId = SOURCE_TO_PHASE[evidence.source] || null;
    
    // Google News não tem sourceType, identificar por URL
    if (!phaseId && evidence.url && (evidence.url.includes('news.google.com') || evidence.url.includes('google.com/news'))) {
      phaseId = 'google_news';
    }
    
    if (phaseId) {
      if (!acc[phaseId]) {
        acc[phaseId] = [];
      }
      acc[phaseId].push({
        url: evidence.url,
        title: evidence.title,
        snippet: evidence.snippet,
        match_type: evidence.match_type,
        validation_method: evidence.validation_method
      });
    }
    
    return acc;
  }, {} as Record<string, Array<{url: string; title: string; snippet: string; match_type: 'single' | 'double' | 'triple'; validation_method?: string}>>);
  
  // 🎯 POPUP: Detectar quando uma fase é concluída
  useEffect(() => {
    if (currentPhase && currentPhase !== previousPhase && previousPhase) {
      const completedPhase = phases.find(p => p.id === previousPhase);
      const phaseEvidences = evidencesByPhase[previousPhase] || [];
      
      if (completedPhase && phaseEvidences.length > 0) {
        toast.success(
          `✅ ${completedPhase.name} concluída!`,
          {
            description: `${phaseEvidences.length} evidência${phaseEvidences.length > 1 ? 's' : ''} encontrada${phaseEvidences.length > 1 ? 's' : ''}`,
            duration: 4000,
            action: {
              label: 'Ver detalhes',
              onClick: () => setExpandedPhase(previousPhase)
            }
          }
        );
      }
    }
    setPreviousPhase(currentPhase || null);
  }, [currentPhase, previousPhase, phases, evidencesByPhase]);
  
  // 🎯 Calcular status de cada fase baseado no currentPhase e elapsedTime
  const phasesWithStatus = phases.map((phase, index) => {
    const phaseIndex = phases.findIndex(p => p.id === currentPhase);
    const phaseEvidences = evidencesByPhase[phase.id] || [];
    
    if (phaseIndex === -1) {
      return { 
        ...phase, 
        status: 'pending' as const, 
        elapsedTime: 0,
        evidencesFound: phaseEvidences.length,
        evidences: phaseEvidences
      };
    }
    
    if (index < phaseIndex) {
      return { 
        ...phase, 
        status: 'completed' as const, 
        elapsedTime: phase.estimatedTime || 0,
        evidencesFound: phaseEvidences.length,
        evidences: phaseEvidences
      };
    } else if (index === phaseIndex) {
      // Calcular tempo decorrido na fase atual
      const phaseStartTime = phases
        .slice(0, index)
        .reduce((sum, p) => sum + (p.estimatedTime || 0), 0);
      const phaseElapsed = Math.max(0, elapsedTime - phaseStartTime);
      
      // 🎯 Detectar timeout (>60s) ou erro
      let status: 'in_progress' | 'timeout' | 'error' = 'in_progress';
      if (phaseElapsed > 60) {
        status = 'timeout';
      }
      
      return { 
        ...phase, 
        status, 
        elapsedTime: phaseElapsed,
        evidencesFound: phaseEvidences.length,
        evidences: phaseEvidences
      };
    } else {
      return { 
        ...phase, 
        status: 'pending' as const, 
        elapsedTime: 0,
        evidencesFound: phaseEvidences.length,
        evidences: phaseEvidences
      };
    }
  });
  
  // 🎯 Total de evidências encontradas
  const totalEvidences = evidences.length;
  
  const totalPhases = phasesWithStatus.length;
  const completedPhases = phasesWithStatus.filter(p => p.status === 'completed').length;
  const inProgressPhase = phasesWithStatus.find(p => p.status === 'in_progress' || p.status === 'timeout' || p.status === 'error');
  
  // Calcular largura de cada segmento (baseado no tempo estimado)
  const totalEstimatedTime = phases.reduce((sum, p) => sum + (p.estimatedTime || 0), 0);
  
  const getPhaseColor = (phase: VerificationPhase) => {
    if (phase.status === 'completed') return 'bg-green-500';
    if (phase.status === 'error') return 'bg-red-500';
    if (phase.status === 'timeout') return 'bg-yellow-500';
    if (phase.status === 'in_progress') return 'bg-blue-500 animate-pulse';
    return 'bg-gray-300';
  };
  
  const getPhaseWidth = (phase: VerificationPhase) => {
    if (!phase.estimatedTime || totalEstimatedTime === 0) return 0;
    return (phase.estimatedTime / totalEstimatedTime) * 100;
  };

  return (
    <Card className="p-4 mt-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Progresso da Verificação</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {completedPhases} de {totalPhases} fases concluídas
              {totalEvidences > 0 && (
                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                  • {totalEvidences} evidência{totalEvidences > 1 ? 's' : ''} encontrada{totalEvidences > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {Math.round((completedPhases / totalPhases) * 100)}%
            </div>
          </div>
        </div>

        {/* 🎯 BARRA ÚNICA COM SEGMENTOS */}
        <div className="relative">
          <div className="flex h-8 rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
            {phasesWithStatus.map((phase, index) => {
              const width = getPhaseWidth(phase);
              const color = getPhaseColor(phase);
              
              return (
                <div
                  key={phase.id}
                  className={`${color} transition-all duration-300 flex items-center justify-center relative group`}
                  style={{ width: `${width}%` }}
                  title={`${phase.name}: ${phase.status === 'completed' ? 'Concluído' : phase.status === 'timeout' ? 'Timeout' : phase.status === 'error' ? 'Erro' : phase.status === 'in_progress' ? 'Em andamento' : 'Aguardando'}`}
                >
                  {/* Label apenas se houver espaço */}
                  {width > 8 && (
                    <span className="text-xs font-medium text-white px-1 truncate">
                      {phase.name.split(' ')[0]}
                    </span>
                  )}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {phase.name} ({phase.count} fontes)
                      {phase.evidencesFound !== undefined && phase.evidencesFound > 0 && (
                        <span> • {phase.evidencesFound} evidência{phase.evidencesFound > 1 ? 's' : ''}</span>
                      )}
                      {phase.status === 'in_progress' && phase.elapsedTime && (
                        <span> • {Math.round(phase.elapsedTime)}s</span>
                      )}
                      {phase.status === 'timeout' && (
                        <span> • Timeout ({Math.round(phase.elapsedTime || 0)}s)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legenda de cores */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Em andamento</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Timeout</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Erro</span>
            </div>
          </div>
        </div>

        {/* 🎯 FASE ATUAL EM DESTAQUE */}
        {inProgressPhase && (
          <div className={`mt-2 p-3 rounded-md ${
            inProgressPhase.status === 'timeout' 
              ? 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700'
              : inProgressPhase.status === 'error'
              ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700'
              : 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              {inProgressPhase.status === 'timeout' && (
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              )}
              {inProgressPhase.status === 'error' && (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              {inProgressPhase.status === 'in_progress' && (
                <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  inProgressPhase.status === 'timeout' 
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : inProgressPhase.status === 'error'
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-blue-900 dark:text-blue-100'
                }`}>
                  {inProgressPhase.status === 'timeout' && '⚠️ '}
                  {inProgressPhase.status === 'error' && '❌ '}
                  {inProgressPhase.status === 'in_progress' && '🔄 '}
                  Processando: {inProgressPhase.name} ({inProgressPhase.count} {inProgressPhase.count === 1 ? 'fonte' : 'fontes'})
                  {inProgressPhase.evidencesFound !== undefined && inProgressPhase.evidencesFound > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      • {inProgressPhase.evidencesFound} evidência{inProgressPhase.evidencesFound > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
                {inProgressPhase.elapsedTime && (
                  <p className={`text-xs mt-1 ${
                    inProgressPhase.status === 'timeout' 
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : inProgressPhase.status === 'error'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    Tempo decorrido: {Math.round(inProgressPhase.elapsedTime)}s
                    {inProgressPhase.estimatedTime && ` / ~${inProgressPhase.estimatedTime}s estimado`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 🎯 DROPDOWN CLICÁVEL: Detalhes de cada fase */}
        <div className="mt-4 space-y-2">
          {phasesWithStatus.map((phase) => {
            if (phase.status === 'pending' && (!phase.evidences || phase.evidences.length === 0)) {
              return null; // Não mostrar fases pendentes sem evidências
            }
            
            return (
              <Collapsible
                key={phase.id}
                open={expandedPhase === phase.id}
                onOpenChange={(open) => setExpandedPhase(open ? phase.id : null)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2">
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {phase.status === 'in_progress' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {phase.status === 'pending' && phase.evidencesFound && phase.evidencesFound > 0 && (
                      <div className="w-4 h-4 rounded-full bg-gray-400" />
                    )}
                    <span className="text-sm font-medium">{phase.name}</span>
                    <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                      {phase.evidencesFound || 0} evidência{phase.evidencesFound !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {phase.evidences && phase.evidences.length > 0 && (
                    expandedPhase === phase.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 pl-6">
                    {phase.evidences && phase.evidences.length > 0 ? (
                      phase.evidences.map((evidence, idx) => (
                        <div key={idx} className="p-3 border rounded-md bg-white dark:bg-gray-900">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <a
                                href={evidence.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                {evidence.title || 'Sem título'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {evidence.snippet}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={evidence.match_type === 'triple' ? 'default' : 'secondary'}>
                                  {evidence.match_type === 'triple' ? 'Triple Match' : evidence.match_type === 'double' ? 'Double Match' : 'Single Match'}
                                </Badge>
                                {evidence.validation_method === 'ai' && (
                                  <Badge variant="outline" className="text-xs">
                                    🤖 IA Validada
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nenhuma evidência encontrada nesta fase</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

