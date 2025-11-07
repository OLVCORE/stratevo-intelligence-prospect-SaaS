// Barra fixa de ações críticas do relatório ICP
// Consolidação de: Status + Salvar + Aprovar + Exportar PDF
// Elimina botões redundantes espalhados pela UI

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, Loader2, Save, FileText, Send, Shield, History } from 'lucide-react';
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
  readOnly?: boolean;
  isSaving?: boolean;
}

export default function SaveBar({
  statuses,
  onSaveAll,
  onApprove,
  onExportPdf,
  onShowHistory,
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
        {/* 📊 PROGRESS BAR REAL (Heat Map: Frio → Quente) */}
        <div className="flex-1 max-w-md">
          {(() => {
            const totalTabs = 9; // FIXO: 9 abas no relatório TOTVS completo
            const completedTabs = Object.values(statuses).filter(s => s === 'completed').length;
            const progressPercent = Math.round((completedTabs / totalTabs) * 100);
            
            // Cores baseadas em progresso (Heat Map)
            let barColor = 'bg-blue-500'; // 0-33% = Frio (Azul)
            if (progressPercent >= 34 && progressPercent <= 66) barColor = 'bg-amber-500'; // 34-66% = Morno (Amarelo)
            if (progressPercent >= 67) barColor = 'bg-emerald-500'; // 67-100% = Quente (Verde)
            
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">Progresso do Relatório</span>
                  <span className="font-bold text-slate-300">{completedTabs}/{totalTabs} abas ({progressPercent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                  <div 
                    className={`h-full ${barColor} transition-all duration-500 ${progressPercent === 100 ? 'animate-pulse' : ''}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* 🎯 Ações Críticas */}
        <div className="flex items-center gap-3">
          {/* Indicador de mudanças não salvas */}
          {!readOnly && anyDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="font-semibold">Alterações não salvas</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Existem abas em rascunho. Clique em "Salvar Relatório".</p>
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

          {/* 📜 Botão Histórico (SECONDARY - opcional) */}
          {onShowHistory && (
            <Button
              onClick={onShowHistory}
              variant="outline"
              size="sm"
              className="gap-2 font-semibold"
              title="Ver histórico de relatórios salvos"
            >
              <History className="w-4 h-4" />
              Histórico
            </Button>
          )}

          {/* 📄 Botão Exportar PDF (SECONDARY - opcional) */}
          {onExportPdf && (
            <Button
              onClick={onExportPdf}
              disabled={!allCompleted || readOnly}
              variant="outline"
              size="sm"
              className="gap-2 font-semibold"
            >
              <FileText className="w-4 h-4" />
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

