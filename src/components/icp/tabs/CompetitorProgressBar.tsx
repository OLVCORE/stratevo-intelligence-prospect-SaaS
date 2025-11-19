import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CompetitorPhase {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'timeout' | 'error';
  estimatedTime?: number; // segundos
  elapsedTime?: number; // tempo decorrido nesta fase
}

interface CompetitorProgressBarProps {
  phases: CompetitorPhase[];
  currentPhase?: string;
  elapsedTime?: number; // segundos totais
  currentCompetitor?: string; // Nome do concorrente atual
  competitorIndex?: number; // Índice do concorrente (1-based)
  totalCompetitors?: number; // Total de concorrentes
  evidencesFound?: number; // Evidências encontradas para o concorrente atual
}

// 🎯 8 FASES REAIS DO BACKEND (conforme discover-all-technologies/index.ts)
const COMPETITOR_PHASES: CompetitorPhase[] = [
  { id: 'job_portals', name: 'Portais de Vagas', status: 'pending', estimatedTime: 15 },
  { id: 'competitor_cases', name: 'Cases Concorrentes', status: 'pending', estimatedTime: 8 },
  { id: 'official_sources', name: 'Fontes Oficiais', status: 'pending', estimatedTime: 10 },
  { id: 'premium_news', name: 'Notícias Premium', status: 'pending', estimatedTime: 12 },
  { id: 'tech_portals', name: 'Portais Tech', status: 'pending', estimatedTime: 8 },
  { id: 'video_content', name: 'Vídeos', status: 'pending', estimatedTime: 5 },
  { id: 'social_media', name: 'Redes Sociais', status: 'pending', estimatedTime: 5 },
  { id: 'google_news', name: 'Google News', status: 'pending', estimatedTime: 5 },
];

export function CompetitorProgressBar({ 
  phases = COMPETITOR_PHASES, 
  currentPhase,
  elapsedTime = 0,
  currentCompetitor,
  competitorIndex,
  totalCompetitors,
  evidencesFound = 0
}: CompetitorProgressBarProps) {
  // 🎯 Calcular status de cada fase baseado no currentPhase e elapsedTime
  const phasesWithStatus = phases.map((phase, index) => {
    const phaseIndex = phases.findIndex(p => p.id === currentPhase);
    
    if (phaseIndex === -1) {
      return { ...phase, status: 'pending' as const, elapsedTime: 0 };
    }
    
    if (index < phaseIndex) {
      return { ...phase, status: 'completed' as const, elapsedTime: phase.estimatedTime || 0 };
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
      
      return { ...phase, status, elapsedTime: phaseElapsed };
    } else {
      return { ...phase, status: 'pending' as const, elapsedTime: 0 };
    }
  });
  
  const totalPhases = phasesWithStatus.length;
  const completedPhases = phasesWithStatus.filter(p => p.status === 'completed').length;
  const inProgressPhase = phasesWithStatus.find(p => p.status === 'in_progress' || p.status === 'timeout' || p.status === 'error');
  
  // Calcular largura de cada segmento (baseado no tempo estimado)
  const totalEstimatedTime = phases.reduce((sum, p) => sum + (p.estimatedTime || 0), 0);
  
  const getPhaseColor = (phase: CompetitorPhase) => {
    if (phase.status === 'completed') return 'bg-green-500';
    if (phase.status === 'error') return 'bg-red-500';
    if (phase.status === 'timeout') return 'bg-yellow-500';
    if (phase.status === 'in_progress') return 'bg-blue-500 animate-pulse';
    return 'bg-gray-300';
  };
  
  const getPhaseWidth = (phase: CompetitorPhase) => {
    if (!phase.estimatedTime || totalEstimatedTime === 0) return 0;
    return (phase.estimatedTime / totalEstimatedTime) * 100;
  };

  return (
    <Card className="p-4 mt-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Progresso da Busca de Concorrentes</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currentCompetitor && competitorIndex && totalCompetitors ? (
                <>
                  Processando: <span className="font-medium text-blue-600 dark:text-blue-400">{currentCompetitor}</span> ({competitorIndex}/{totalCompetitors} concorrentes)
                  {evidencesFound > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                      • {evidencesFound} evidência{evidencesFound > 1 ? 's' : ''} encontrada{evidencesFound > 1 ? 's' : ''}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {completedPhases} de {totalPhases} fases concluídas
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {currentCompetitor && competitorIndex && totalCompetitors 
                ? Math.round((competitorIndex / totalCompetitors) * 100)
                : Math.round((completedPhases / totalPhases) * 100)
              }%
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
                      {phase.name}
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
                  Processando: {inProgressPhase.name}
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
      </div>
    </Card>
  );
}

