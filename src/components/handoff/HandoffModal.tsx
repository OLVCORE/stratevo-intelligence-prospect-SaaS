/**
 * Modal de Handoff - Exibe informações e histórico de handoffs de um deal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useDealHandoffHistory, 
  useCreateHandoff, 
  useApproveHandoff, 
  useRejectHandoff,
  useAvailableSalesReps 
} from '@/hooks/useHandoff';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Loader2,
  Users,
  Zap
} from 'lucide-react';

interface HandoffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
  dealTitle?: string;
  dealValue?: number;
  currentOwner?: string | null;
}

export function HandoffModal({
  open,
  onOpenChange,
  dealId,
  dealTitle,
  dealValue,
  currentOwner,
}: HandoffModalProps) {
  const { data: handoffHistory, isLoading: loadingHistory } = useDealHandoffHistory(dealId);
  const { data: salesReps } = useAvailableSalesReps();
  const createHandoff = useCreateHandoff();
  const approveHandoff = useApproveHandoff();
  const rejectHandoff = useRejectHandoff();

  const latestHandoff = handoffHistory?.[0];
  const hasPendingHandoff = latestHandoff?.status === 'pending';

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Aceito</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreateHandoff = async () => {
    if (!dealId) return;
    await createHandoff.mutateAsync({ dealId });
  };

  const handleApprove = async (handoffId: string) => {
    await approveHandoff.mutateAsync({ handoffId });
  };

  const handleReject = async (handoffId: string) => {
    if (confirm('Tem certeza que deseja rejeitar este handoff?')) {
      await rejectHandoff.mutateAsync({ handoffId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Handoff SDR → Vendedor
          </DialogTitle>
          <DialogDescription>
            {dealTitle && (
              <div className="mt-2">
                <p className="font-semibold">{dealTitle}</p>
                {dealValue && (
                  <p className="text-sm text-muted-foreground">Valor: {formatCurrency(dealValue)}</p>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Atual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor Atual</p>
                  <p className="font-semibold">
                    {currentOwner || 'Não atribuído'}
                  </p>
                </div>
                {hasPendingHandoff && (
                  <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Handoff Pendente
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleCreateHandoff}
                disabled={createHandoff.isPending || !dealId}
                className="w-full"
                variant="default"
              >
                {createHandoff.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando handoff...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Criar Handoff Manual
                  </>
                )}
              </Button>
              {salesReps && salesReps.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  {salesReps.length} vendedor(es) disponível(is)
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Histórico de Handoffs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Carregando histórico...</p>
                </div>
              ) : handoffHistory && handoffHistory.length > 0 ? (
                <div className="space-y-3">
                  {handoffHistory.map((handoff) => (
                    <div key={handoff.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(handoff.status)}
                            <Badge variant="outline" className="text-xs">
                              {handoff.handoff_type === 'auto' ? '🤖 Automático' : '👤 Manual'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-2">
                            {handoff.from_user_name && (
                              <>
                                <span className="text-muted-foreground">{handoff.from_user_name}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              </>
                            )}
                            <span className="font-semibold">{handoff.to_user_name || 'N/A'}</span>
                          </div>
                          {handoff.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{handoff.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(handoff.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {handoff.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(handoff.id)}
                              disabled={approveHandoff.isPending}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(handoff.id)}
                              disabled={rejectHandoff.isPending}
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Nenhum handoff registrado ainda
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

