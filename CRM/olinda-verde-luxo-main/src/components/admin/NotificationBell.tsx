import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { triggerHaptic } from "@/services/capacitor";
import { ImpactStyle } from "@capacitor/haptics";

interface Notification {
  id: string;
  lead_name: string;
  lead_source: string;
  event_type: string;
  created_at: string;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();

    // Subscribe to new leads in realtime
    const channel = supabase
      .channel("new-leads")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const newLead = payload.new;
          const notification: Notification = {
            id: newLead.id,
            lead_name: newLead.name,
            lead_source: newLead.source || "website",
            event_type: newLead.event_type,
            created_at: newLead.created_at,
            read: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Trigger haptic feedback on mobile
          triggerHaptic(ImpactStyle.Medium);

          toast.success(`🎉 Novo Lead: ${newLead.name}`, {
            description: `${newLead.event_type} via ${newLead.source || "website"}`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      const notifs: Notification[] = data.map((lead) => ({
        id: lead.id,
        lead_name: lead.name,
        lead_source: lead.source || "website",
        event_type: lead.event_type,
        created_at: lead.created_at,
        read: true,
      }));
      setNotifications(notifs);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (leadId: string) => {
    markAllAsRead();
    navigate(`/admin/leads?highlight=${leadId}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma notificação
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {notification.lead_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.event_type} via {notification.lead_source}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.created_at), "PPp", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
