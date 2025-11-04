import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface TabSaveWrapperProps {
  children: React.ReactNode;
  tabId: string;
  tabName: string;
  hasUnsavedChanges: boolean;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  canSave?: boolean;
  saveDisabledReason?: string;
}

export function TabSaveWrapper({
  children,
  tabId,
  tabName,
  hasUnsavedChanges,
  onSave,
  isSaving = false,
  canSave = true,
  saveDisabledReason = 'Dados insuficientes para salvar'
}: TabSaveWrapperProps) {
  const [showAlert, setShowAlert] = useState(false);

  const handleSave = async () => {
    try {
      await onSave();
      toast.success(`✅ ${tabName} salva com sucesso!`, {
        description: 'Dados salvos no relatório final.',
      });
    } catch (error) {
      toast.error(`❌ Erro ao salvar ${tabName}`, {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* BOTÃO SALVAR FIXO NO TOPO */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{tabName}</h3>
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              Alterações não salvas
            </span>
          )}
        </div>
        
        <Button
          onClick={handleSave}
          disabled={!canSave || isSaving || !hasUnsavedChanges}
          size="sm"
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar {tabName}
            </>
          )}
        </Button>
      </div>

      {/* CONTEÚDO DA ABA */}
      <div className="flex-1 overflow-y-auto">
        {!canSave && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Aviso:</strong> {saveDisabledReason}
            </div>
          </div>
        )}
        {children}
      </div>

      {/* ALERT DIALOG - NÃO USADO AQUI, MAS NO PARENT */}
    </div>
  );
}

