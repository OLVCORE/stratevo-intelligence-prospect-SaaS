import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageSquare, Calendar, FileText, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface LeadActivityTimelineProps {
  leadId: string;
}

export const LeadActivityTimeline = ({ leadId }: LeadActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("[LeadActivityTimeline] Timeout ao carregar atividades");
        setIsLoading(false);
      }
    }, 15000);

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!isMounted) return;
        setActivities(data || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchActivities();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [leadId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5 text-blue-500" />;
      case "call":
        return <Phone className="h-5 w-5 text-green-500" />;
      case "whatsapp":
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case "meeting":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case "note":
        return <FileText className="h-5 w-5 text-yellow-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: "Email",
      call: "Ligação",
      whatsapp: "WhatsApp",
      meeting: "Reunião",
      note: "Nota",
      task: "Tarefa",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando atividades...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma atividade registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Card key={activity.id} className="relative">
          {index !== activities.length - 1 && (
            <div className="absolute left-6 top-14 bottom-0 w-px bg-border" />
          )}
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 relative z-10 bg-card">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {activity.subject}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.created_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
