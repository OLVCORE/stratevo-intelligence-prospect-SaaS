import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  companyId?: string;
  onSelectReport?: (reportId: string) => void;
}

export function ReportHistoryModal({
  open,
  onOpenChange,
  companyName,
  companyId,
  onSelectReport,
}: ReportHistoryModalProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['report-history', companyName, companyId],
    queryFn: async () => {
      let query = supabase
        .from('stc_verification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.eq('company_name', companyName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[History] Erro ao buscar histórico:', error);
        return [];
      }

      return data;
    },
    enabled: open,
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Clock },
      processing: { label: 'Processando', variant: 'default' as const, icon: Clock },
      completed: { label: 'Completo', variant: 'default' as const, icon: CheckCircle },
      error: { label: 'Erro', variant: 'destructive' as const, icon: AlertTriangle },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getCompletedTabs = (fullReport: any) => {
    if (!fullReport?.__status) return 0;
    return Object.values(fullReport.__status).filter(
      (tab: any) => tab.status === 'completed'
    ).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Relatórios
          </DialogTitle>
          <DialogDescription>
            Todos os relatórios salvos para <strong>{companyName}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-6 h-6 animate-spin" />
              <span className="ml-2">Carregando histórico...</span>
            </div>
          )}

          {!isLoading && history && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhum relatório encontrado</p>
            </div>
          )}

          {!isLoading && history && history.length > 0 && (
            <div className="space-y-3">
              {history.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onSelectReport?.(report.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </h4>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ID: {report.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReport?.(report.id);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Confiança:</span>
                      <span className="ml-1 font-medium">{report.confidence}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Abas completas:</span>
                      <span className="ml-1 font-medium">
                        {getCompletedTabs(report.full_report)}/9
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Matches:</span>
                      <span className="ml-1 font-medium">
                        🟢 {report.triple_matches} | 🟡 {report.double_matches} | ⚪{' '}
                        {report.single_matches}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score:</span>
                      <span className="ml-1 font-medium">{report.total_score}</span>
                    </div>
                  </div>

                  {report.cnpj && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      CNPJ: {report.cnpj}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

