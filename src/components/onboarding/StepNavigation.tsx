// Componente de navegação reutilizável para steps do onboarding
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';

interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void | Promise<void>;
  showBack?: boolean;
  showSave?: boolean;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  isSubmit?: boolean;
  hasUnsavedChanges?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  onSave,
  showBack = true,
  showSave = true,
  nextLabel = 'Próximo',
  backLabel = 'Voltar',
  nextDisabled = false,
  nextLoading = false,
  saveLoading = false,
  saveDisabled = false,
  isSubmit = false,
  hasUnsavedChanges = false,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-border mt-8 gap-4">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      ) : (
        <div /> // Espaçador para manter alinhamento
      )}
      
      <div className="flex items-center gap-2 ml-auto">
        {/* Botão Salvar - SEMPRE VISÍVEL se onSave fornecido */}
        {onSave && (
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={saveDisabled || saveLoading}
            className={`flex items-center gap-2 ${hasUnsavedChanges ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
            title={hasUnsavedChanges ? 'Você tem alterações não salvas' : 'Salvar dados'}
          >
            {saveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar
                {hasUnsavedChanges && <span className="ml-1 text-xs">*</span>}
              </>
            )}
          </Button>
        )}
        
        {onNext && (
          <Button
            type={isSubmit ? "submit" : "button"}
            onClick={
              !isSubmit
                ? async () => {
                    console.log('[StepNavigation] 🔘 Botão "Finalizar" clicado, chamando onNext...');
                    if (typeof onNext === 'function') {
                      await onNext();
                    }
                  }
                : undefined
            }
            disabled={nextDisabled || nextLoading}
            className="flex items-center gap-2"
          >
            {nextLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

