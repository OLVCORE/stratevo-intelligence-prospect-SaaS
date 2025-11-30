import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initializePushNotifications } from "@/services/pushNotifications";

export const NotificationSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      setHasToken((tokens?.length || 0) > 0);
      setIsEnabled((tokens?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking notification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isEnabled) {
      // Enable notifications
      setIsLoading(true);
      try {
        await initializePushNotifications();
        setIsEnabled(true);
        setHasToken(true);
        toast.success("Notificações ativadas com sucesso!");
      } catch (error) {
        console.error('Error enabling notifications:', error);
        toast.error("Não foi possível ativar as notificações. Verifique as permissões do navegador.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Disable notifications
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('push_tokens')
          .update({ active: false })
          .eq('user_id', user.id);

        setIsEnabled(false);
        toast.success("Notificações desativadas");
      } catch (error) {
        console.error('Error disabling notifications:', error);
        toast.error("Erro ao desativar notificações");
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          Carregando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba alertas em tempo real sobre novos leads e agendamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Atual */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isEnabled ? "Notificações Ativadas" : "Notificações Desativadas"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? "Você receberá alertas push neste dispositivo"
                  : "Ative para receber alertas em tempo real"}
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {/* Tipos de Notificações */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Você receberá notificações para:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">🎯 Novos Leads</Badge>
              <span className="text-muted-foreground">Quando um lead entra via site ou WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">📅 Agendamentos Próximos</Badge>
              <span className="text-muted-foreground">24h antes de uma visita agendada</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">💼 Mudança de Estágio</Badge>
              <span className="text-muted-foreground">Quando um deal avança no pipeline</span>
            </div>
          </div>
        </div>

        {/* Info sobre Mobile */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Notificações Mobile</span>
          </div>
          <p className="text-xs text-muted-foreground">
            As notificações funcionam tanto no navegador quanto no aplicativo mobile.
            Para melhor experiência, instale o app na tela inicial do seu dispositivo.
          </p>
        </div>

        {!hasToken && !isEnabled && (
          <Button onClick={handleToggle} className="w-full" disabled={isLoading}>
            <Bell className="h-4 w-4 mr-2" />
            Ativar Notificações Push
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
