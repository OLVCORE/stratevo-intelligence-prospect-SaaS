/**
 * ARR EDITOR
 * Componente para editar valores ARR (Annual Recurring Revenue) com tooltips explicativos
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit2, Info, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { EditedARR, ContractPeriod } from '@/types/productOpportunities';
import { formatCurrency, formatARR, ARR_TOOLTIP, PROBABILITY_TOOLTIP, TIMELINE_TOOLTIP } from '@/lib/utils/productOpportunities';

interface ARREditorProps {
  productName: string;
  initialARR?: EditedARR;
  onSave: (arr: EditedARR) => void;
  probability?: number;
  timeline?: string;
  size?: 'MICRO' | 'PEQUENA' | 'MÉDIA' | 'GRANDE' | 'DEMAIS';
  productCount?: number;
  digitalMaturity?: number;
}

export function ARREditor({
  productName,
  initialARR,
  onSave,
  probability: initialProbability,
  timeline: initialTimeline,
  size,
  productCount,
  digitalMaturity,
}: ARREditorProps) {
  const [open, setOpen] = useState(false);
  const [arr, setArr] = useState<EditedARR>(() => {
    if (initialARR) {
      return { ...initialARR };
    }
    // Default values
    return {
      arrMin: 30000,
      arrMax: 50000,
      contractPeriod: 3 as ContractPeriod,
      probability: initialProbability || 70,
      roiMonths: 12,
      timeline: initialTimeline || '3-6 meses',
      source: 'estimated',
      editedAt: new Date().toISOString(),
    };
  });

  const handleSave = () => {
    onSave({
      ...arr,
      editedAt: new Date().toISOString(),
    });
    setOpen(false);
    toast.success('✅ Valores ARR salvos com sucesso!');
  };

  // Calcular valor total do contrato
  const contractTotalMin = arr.arrMin * arr.contractPeriod;
  const contractTotalMax = arr.arrMax * arr.contractPeriod;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">Editar valores ARR</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Editar Valores ARR - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ========================================
              ARR (RECURRENCE) - O MAIS IMPORTANTE
          ======================================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">ARR (Annual Recurring Revenue)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                    {ARR_TOOLTIP}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrMin">
                  ARR Mínimo (R$/ano) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="arrMin"
                  type="number"
                  value={arr.arrMin || ''}
                  onChange={(e) => setArr({ ...arr, arrMin: parseFloat(e.target.value) || 0 })}
                  placeholder="30000"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor recorrente anual mínimo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrMax">
                  ARR Máximo (R$/ano) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="arrMax"
                  type="number"
                  value={arr.arrMax || ''}
                  onChange={(e) => setArr({ ...arr, arrMax: parseFloat(e.target.value) || 0 })}
                  placeholder="50000"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor recorrente anual máximo
                </p>
              </div>
            </div>

            {/* Período de Contrato */}
            <div className="space-y-2">
              <Label htmlFor="contractPeriod">
                Período de Contrato (anos) <span className="text-red-500">*</span>
              </Label>
              <Select
                value={arr.contractPeriod?.toString() || '3'}
                onValueChange={(value) => setArr({ ...arr, contractPeriod: parseInt(value) as ContractPeriod })}
              >
                <SelectTrigger id="contractPeriod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ano</SelectItem>
                  <SelectItem value="3">3 anos</SelectItem>
                  <SelectItem value="5">5 anos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Valor total: {formatCurrency(contractTotalMin)} - {formatCurrency(contractTotalMax)}
              </p>
            </div>
          </div>

          <Separator />

          {/* ========================================
              ONE-TIME (Opcional)
          ======================================== */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Valores One-Time (Opcional)</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialSoftware">Software Inicial (R$)</Label>
                <Input
                  id="initialSoftware"
                  type="number"
                  value={arr.initialSoftware || ''}
                  onChange={(e) => setArr({ ...arr, initialSoftware: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor one-time do software (se houver)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementation">Implementação (R$)</Label>
                <Input
                  id="implementation"
                  type="number"
                  value={arr.implementation || ''}
                  onChange={(e) => setArr({ ...arr, implementation: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor one-time de implementação
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* ========================================
              RECURRENCE ADICIONAL
          ======================================== */}
          <div className="space-y-2">
            <Label htmlFor="annualMaintenance">Manutenção Anual (R$/ano)</Label>
            <Input
              id="annualMaintenance"
              type="number"
              value={arr.annualMaintenance || ''}
              onChange={(e) => setArr({ ...arr, annualMaintenance: parseFloat(e.target.value) || undefined })}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Valor recorrente anual de manutenção (adicional ao ARR)
            </p>
          </div>

          <Separator />

          {/* ========================================
              METADADOS DE ANÁLISE
          ======================================== */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Metadados de Análise</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="probability">
                    Probabilidade de Fechamento (%)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                        {PROBABILITY_TOOLTIP}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="probability"
                  type="number"
                  value={arr.probability || ''}
                  onChange={(e) => setArr({ ...arr, probability: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                  placeholder="70"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="timeline">
                    Timeline de Implementação
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-md whitespace-pre-line">
                        {TIMELINE_TOOLTIP}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="timeline"
                  type="text"
                  value={arr.timeline || ''}
                  onChange={(e) => setArr({ ...arr, timeline: e.target.value })}
                  placeholder="3-6 meses"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roiMonths">ROI Esperado (meses)</Label>
              <Input
                id="roiMonths"
                type="number"
                value={arr.roiMonths || ''}
                onChange={(e) => setArr({ ...arr, roiMonths: parseFloat(e.target.value) || 0 })}
                placeholder="12"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Fonte do Valor</Label>
              <Select
                value={arr.source || 'estimated'}
                onValueChange={(value: any) => setArr({ ...arr, source: value })}
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estimated">Estimado</SelectItem>
                  <SelectItem value="totvs">TOTVS</SelectItem>
                  <SelectItem value="market">Mercado</SelectItem>
                  <SelectItem value="edited">Editado Manualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <Label className="text-sm font-semibold">Resumo</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">ARR Anual:</span>
                <p className="font-semibold">{formatARR(arr.arrMin)} - {formatARR(arr.arrMax)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contrato {arr.contractPeriod} anos:</span>
                <p className="font-semibold">
                  {formatCurrency(contractTotalMin)} - {formatCurrency(contractTotalMax)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Valores
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

