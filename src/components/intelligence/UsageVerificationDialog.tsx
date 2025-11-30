// src/components/intelligence/UsageVerificationDialog.tsx
// Dialog para verificação de uso (genérico, multi-tenant)

import { useState } from 'react';
import { DraggableDialog } from '@/components/ui/draggable-dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Printer, UserPlus } from 'lucide-react';
import UsageVerificationCard from '@/components/totvs/TOTVSCheckCard';
import { toast } from 'sonner';

interface UsageVerificationDialogProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsageVerificationDialog({
  companyId,
  companyName,
  cnpj,
  domain,
  open,
  onOpenChange,
}: UsageVerificationDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handlePrint = () => {
    window.print();
    toast.success("Preparando relatório para impressão...");
  };

  const handleAssign = () => {
    toast.info("Funcionalidade de atribuição em breve!");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      onOpenChange(false);
    }
  };

  const reportContent = (
    <UsageVerificationCard
      companyId={companyId}
      companyName={companyName}
      cnpj={cnpj}
      domain={domain}
      autoVerify={true}
    />
  );

  // Modo Minimizado (botão flutuante)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <Button 
          variant="default" 
          onClick={() => {
            setIsMinimized(false);
            onOpenChange(true);
          }}
          className="shadow-xl hover-scale"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          {companyName || 'Verificação de Uso'}
        </Button>
      </div>
    );
  }

  // Modo Fullscreen
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-auto animate-fade-in">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Verificação de Uso - {companyName}</h1>
              <p className="text-muted-foreground">Relatório completo de verificação de uso</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleAssign}>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Minimize2 className="h-4 w-4 mr-2" />
                Sair Fullscreen
              </Button>
              <Button variant="outline" size="sm" onClick={toggleMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            {reportContent}
          </div>
        </div>
      </div>
    );
  }

  // Modo Normal (Dialog Arrastável)
  return (
    <DraggableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Verificação de Uso - ${companyName || 'Empresa'}`}
      description="Análise de verificação de uso em 70 fontes premium (vagas, tech, vídeos, social)"
      className="max-w-4xl"
      maxWidth="max-h-[85vh]"
    >
      <div className="space-y-4">
        {/* Barra de Ações */}
        <div className="flex items-center justify-end gap-2 pb-4 border-b">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            Atribuir
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMinimize}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo do Relatório */}
        {reportContent}
      </div>
    </DraggableDialog>
  );
}

// Alias para compatibilidade (deprecado)
/** @deprecated Use UsageVerificationDialog instead */
export const SimpleTOTVSCheckDialog = UsageVerificationDialog;

