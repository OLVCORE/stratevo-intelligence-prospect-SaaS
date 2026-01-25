import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, StopCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface EnrichmentProgress {
  companyId: string;
  companyName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

interface EnrichmentProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  companies: EnrichmentProgress[];
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function EnrichmentProgressModal({
  open,
  onOpenChange,
  title,
  companies,
  onCancel,
  isCancelling = false
}: EnrichmentProgressModalProps) {
  const completed = companies.filter(c => c.status === 'success' || c.status === 'error').length;
  const total = companies.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const success = companies.filter(c => c.status === 'success').length;
  const errors = companies.filter(c => c.status === 'error').length;
  const processing = companies.find(c => c.status === 'processing');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Progress Summary */}
        <div className="space-y-4 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {completed} de {total} empresas ({percentage}%)
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{success} sucesso</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>{errors} erros</span>
            </div>
            {processing && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="truncate max-w-[300px]">Processando: {processing.companyName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Company List - ScrollArea com altura fixa e overflow controlado */}
        <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {companies.map((company) => (
                <div
                  key={company.companyId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    company.status === 'processing' ? 'bg-blue-500/10 border-blue-500/20' :
                    company.status === 'success' ? 'bg-green-500/10 border-green-500/20' :
                    company.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                    'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {company.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    {company.status === 'processing' && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    )}
                    {company.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    {company.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{company.companyName}</p>
                      {company.message && (
                        <p className="text-xs text-muted-foreground truncate">{company.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Cancel/Close Buttons - fixo no rodapé */}
        <div className="flex justify-end gap-2 pt-2 flex-shrink-0 border-t">
          {onCancel && completed < total && (
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Cancelar Processo
                </>
              )}
            </Button>
          )}
          {completed === total && (
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}

