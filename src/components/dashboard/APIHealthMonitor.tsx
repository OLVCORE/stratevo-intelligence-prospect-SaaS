import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function APIHealthMonitor({ open, onOpenChange, apiName = "Apollo.io" }: { open: boolean; onOpenChange: (v: boolean) => void; apiName?: string; }) {
  const [uptimeData, setUptimeData] = useState<Array<{ day: number; uptime: number }>>([]);
  const [apiLogs, setApiLogs] = useState<Array<{ timestamp: string; status: string; responseTime: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadAPIHealth();
    }
  }, [open]);

  const loadAPIHealth = async () => {
    setIsLoading(true);
    try {
      // 🔥 PROIBIDO: Dados mockados foram removidos
      // Buscar dados reais de monitoramento de API do banco
      // TODO: Implementar tabela de logs de API e métricas de uptime
      // Por enquanto, retornar vazio (não dados fake)
      
      // Se não houver dados reais, mostrar mensagem
      setUptimeData([]);
      setApiLogs([]);
    } catch (error) {
      console.error('Erro ao carregar dados de saúde da API:', error);
      setUptimeData([]);
      setApiLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Saúde da API • {apiName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uptime (últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-56 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : uptimeData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground">
                  <p>Dados de uptime não disponíveis</p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={uptimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[90, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="uptime" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : apiLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum log disponível</p>
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {apiLogs.map((log, i) => (
                    <li key={i} className="rounded-md border p-2 bg-card">
                      {log.timestamp} • {log.status} • {log.responseTime}ms
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default APIHealthMonitor;
