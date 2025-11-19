// Barra fixa de ações críticas do relatório ICP
// Consolidação de: Status + Salvar + Aprovar + Exportar PDF
// Elimina botões redundantes espalhados pela UI

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, Loader2, Save, FileText, Send, Shield, History, FileDown, RefreshCw } from 'lucide-react';
import { TabIndicator } from '@/components/icp/tabs/TabIndicator';
import { isDiagEnabled, dlog, dgroup, dgroupEnd, dtable } from '@/lib/diag';
import { SAFE_MODE, BLOCK_WRITES } from '@/lib/flags';

type TabStatus = 'draft' | 'processing' | 'completed' | 'error';

interface SaveBarProps {
  statuses: Record<string, TabStatus>; // Status por aba (keywords, totvs, etc)
  onSaveAll: () => Promise<void>;
  onApprove: () => Promise<void>;
  onExportPdf?: () => void;
  onShowHistory?: () => void; // 📜 Callback para abrir modal de histórico
  onRefresh?: () => void; // 🔄 Callback para atualizar verificação TOTVS
  readOnly?: boolean;
  isSaving?: boolean;
}

export default function SaveBar({
  statuses,
  onSaveAll,
  onApprove,
  onExportPdf,
  onShowHistory,
  onRefresh,
  readOnly = false,
  isSaving = false,
}: SaveBarProps) {
  console.info('[SaveBar] ✅ SaveBar montada — exibindo ações unificadas');
  
  const diag = isDiagEnabled();
  const anyProcessing = Object.values(statuses).some(s => s === 'processing');
  const allCompleted = Object.values(statuses).every(s => s === 'completed');
  const anyDraft = Object.values(statuses).some(s => s === 'draft');
  const anyError = Object.values(statuses).some(s => s === 'error');

  // 🔍 SPEC #005.D.2: Padding-top no body durante diagnóstico (evita cobrir conteúdo)
  useEffect(() => {
    if (!diag) return;
    const prev = document.body.style.paddingTop;
    document.body.style.paddingTop = '80px'; // altura da SaveBar + margem
    dlog('SaveBar', '📐 Body padding-top aplicado: 80px');
    return () => { 
      document.body.style.paddingTop = prev;
      dlog('SaveBar', '📐 Body padding-top restaurado:', prev);
    };
  }, [diag]);

  // 🔍 SPEC #005.D.1: Diagnóstico ciclo de vida (telemetria centralizada)
  useEffect(() => {
    if (!diag) return;
    
    const entries = Object.entries(statuses || {});
    dgroup('SaveBar', 'mount/update');
    dlog('SaveBar', 'readOnly:', readOnly, '| isSaving:', isSaving);
    dtable(entries.map(([tab, st]) => ({ tab, status: st })));
    dlog('SaveBar', 'Agregados → anyProcessing:', anyProcessing, '| allCompleted:', allCompleted, '| anyDraft:', anyDraft, '| anyError:', anyError);
    dlog('SaveBar', 'DOM element:', document.querySelector('.sticky.top-0.z-40, .fixed.top-0.z-\\[9999\\]') ? '✅ Found' : '❌ Not found');
    dgroupEnd();
  }, [statuses, readOnly, isSaving, anyProcessing, allCompleted, anyDraft, anyError, diag]);

  // 🔍 SPEC #005.D.2: Fixed position durante diagnóstico (maior z-index para debug)
  const wrapperClass = diag
    ? "fixed inset-x-0 top-0 z-[9999] border-b-2 border-yellow-500/70 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-md shadow-2xl"
    : "sticky top-0 z-40 border-b-2 border-slate-700/70 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-lg";

  return (
    <div className={wrapperClass}>
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-6 py-3">
        {/* 📊 PROGRESS BAR REAL (Heat Map: Frio → Quente) + STATUS INDIVIDUAL DAS ABAS */}
        <div className="flex-1 max-w-2xl">
          {(() => {
            const totalTabs = 10; // FIXO: 10 abas no relatório TOTVS completo
            const registeredTabs = Object.keys(statuses).length;
            const completedTabs = Object.values(statuses).filter(s => s === 'completed').length;
            const draftTabs = Object.values(statuses).filter(s => s === 'draft').length;
            const progressPercent = Math.round((completedTabs / totalTabs) * 100);
            
            // 🔍 DEBUG: Log detalhado do estado
            console.log('[SaveBar] 📊 Progress Debug:', {
              totalTabs,
              registeredTabs,
              completedTabs,
              draftTabs,
              progressPercent,
              statuses,
              statusKeys: Object.keys(statuses),
            });
            
            // 🎨 GRADIENTE PROGRESSIVO INTELIGENTE
            let gradient = 'from-blue-300 via-blue-400 to-blue-500';
            let textColor = 'text-blue-600';
            let emoji = '🔵';
            
            if (progressPercent >= 34 && progressPercent <= 55) {
              gradient = 'from-blue-500 via-cyan-500 to-green-400';
              textColor = 'text-cyan-600';
              emoji = '🔄';
            } else if (progressPercent >= 56 && progressPercent <= 88) {
              gradient = 'from-green-400 via-green-500 to-green-600';
              textColor = 'text-green-600';
              emoji = '📈';
            } else if (progressPercent >= 89) {
              gradient = 'from-green-400 via-lime-400 to-lime-500';
              textColor = 'text-lime-500';
              emoji = '✅';
            }
            
            // 🎯 MAPA DE NOMES DAS ABAS
            const tabNames: Record<string, string> = {
              'detection': 'TOTVS',
              'decisors': 'Decisores',
              'digital': 'Digital',
              'competitors': 'Competitors',
              'similar': 'Similar',
              'clients': 'Clients',
              '360': '360°',
              'products': 'Products',
              'opportunities': 'Oportunidades',
              'executive': 'Executive',
            };
            
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <span>{emoji}</span>
                    <span>Completude da Análise</span>
                  </span>
                  <span className={`font-bold font-mono text-base ${textColor}`}>
                    {completedTabs}/{totalTabs} abas ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-5 bg-slate-800/80 rounded-full overflow-hidden border-2 border-slate-600/50 shadow-lg">
                  <div 
                    className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-in-out ${progressPercent === 100 ? 'animate-pulse shadow-2xl' : ''}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                
                {/* 🎯 STATUS INDIVIDUAL DAS ABAS (Tooltip com detalhes) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-wrap gap-1 text-xs cursor-help">
                        {Object.entries(statuses).map(([tabKey, status]) => {
                          const tabName = tabNames[tabKey] || tabKey;
                          const isCompleted = status === 'completed';
                          const isDraft = status === 'draft';
                          const isProcessing = status === 'processing';
                          const isError = status === 'error';
                          
                          return (
                            <span
                              key={tabKey}
                              className={`px-2 py-0.5 rounded border ${
                                isCompleted 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                                  : isDraft
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                  : isProcessing
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse'
                                  : isError
                                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                  : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                              }`}
                              title={`${tabName}: ${isCompleted ? 'Salvo' : isDraft ? 'Não salvo' : isProcessing ? 'Processando' : isError ? 'Erro' : 'Pendente'}`}
                            >
                              {isCompleted ? '✓' : isDraft ? '○' : isProcessing ? '⟳' : isError ? '✗' : '○'} {tabName}
                            </span>
                          );
                        })}
                        {/* Mostrar abas não registradas como pendentes */}
                        {registeredTabs < totalTabs && (
                          <span className="px-2 py-0.5 rounded border bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs">
                            +{totalTabs - registeredTabs} pendente(s)
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold mb-2">Status das Abas:</p>
                        {Object.entries(statuses).map(([tabKey, status]) => {
                          const tabName = tabNames[tabKey] || tabKey;
                          const isCompleted = status === 'completed';
                          return (
                            <div key={tabKey} className="flex items-center gap-2">
                              <span className={isCompleted ? 'text-green-400' : 'text-amber-400'}>
                                {isCompleted ? '✓' : '○'}
                              </span>
                              <span>{tabName}:</span>
                              <span className={isCompleted ? 'text-green-400 font-semibold' : 'text-amber-400'}>
                                {isCompleted ? 'Salvo' : 'Não salvo'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {progressPercent === 100 && (
                  <p className="text-xs text-lime-500 font-semibold text-center animate-pulse">
                    🎉 Análise 100% completa!
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* 🎯 Ações Críticas */}
        <div className="flex items-center gap-3">
          {/* Indicador de mudanças não salvas - MELHORADO */}
          {!readOnly && anyDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/20 px-4 py-2 rounded-lg border-2 border-amber-500/50 shadow-lg animate-pulse hover:animate-none hover:bg-amber-500/25 transition-all cursor-pointer">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    <span className="font-bold">⚠️ Alterações não salvas</span>
                    <span className="bg-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {Object.values(statuses).filter(s => s === 'draft').length} aba(s)
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs font-semibold mb-1">⚠️ Atenção: Alterações não salvas</p>
                  <p className="text-xs">
                    {Object.values(statuses).filter(s => s === 'draft').length === 1 
                      ? 'Existe 1 aba em rascunho. Clique em "Salvar Relatório" para salvar.'
                      : `Existem ${Object.values(statuses).filter(s => s === 'draft').length} abas em rascunho. Clique em "Salvar Relatório" para salvar todas.`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* 💾 Botão Salvar Relatório (PRIMARY - Cores Corporativas) */}
          <Button
            onClick={onSaveAll}
            disabled={readOnly || isSaving}
            size="sm"
            variant="default"
            className="gap-2 font-bold shadow-md"
          >
            {isSaving || anyProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {SAFE_MODE ? 'Simulando...' : 'Salvando...'}
              </>
            ) : (
              <>
                {SAFE_MODE && <Shield className="w-4 h-4" />}
                <Save className="w-4 h-4" />
                {SAFE_MODE ? 'Salvar (Dry-Run)' : 'Salvar Relatório'}
              </>
            )}
          </Button>
          
          {/* 🛡️ SPEC #SAFE-00: Aviso de Safe Mode */}
          {SAFE_MODE && (
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {BLOCK_WRITES ? 'writes bloqueadas' : 'modo seguro'}
            </span>
          )}

          {/* 🔄 Botão Atualizar Verificação */}
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              title="Atualizar verificação TOTVS"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          )}

          {/* 📜 Botão Histórico */}
          {onShowHistory && (
            <Button
              onClick={onShowHistory}
              variant="outline"
              size="sm"
              className="gap-2"
              title="Ver histórico de relatórios"
            >
              <History className="w-4 h-4" />
              Histórico
            </Button>
          )}

          {/* 📄 Botão Exportar PDF */}
          {onExportPdf && (
            <Button
              onClick={onExportPdf}
              disabled={!allCompleted || readOnly}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
          )}

          {/* ✅ Botão Marcar como Concluído (ACTION - Cores Corporativas) */}
          <Button
            onClick={onApprove}
            disabled={readOnly || !allCompleted || anyError}
            size="sm"
            variant="default"
            className="gap-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como Concluído
          </Button>
        </div>
      </div>
    </div>
  );
}

