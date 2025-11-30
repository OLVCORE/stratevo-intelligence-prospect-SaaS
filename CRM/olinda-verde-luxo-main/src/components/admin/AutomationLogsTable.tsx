import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const AutomationLogsTable = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["automation-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_logs")
        .select(`
          *,
          automation_rules (name),
          leads (name, email)
        `)
        .order("executed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: "default",
      failed: "destructive",
      partial: "secondary",
    };
    return variants[status] || "outline";
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Regra</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Ações</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {log.automation_rules?.name || "Regra excluída"}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{log.leads?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {log.leads?.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(log.actions_executed) && log.actions_executed.map((action: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {action.type}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <Badge variant={getStatusBadge(log.status)}>
                    {log.status}
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!logs || logs.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                Nenhuma automação executada ainda
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
