import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, ExternalLink, Clock, Send, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadWhatsAppProps {
  leadId: string;
  leadPhone: string;
}

export const LeadWhatsApp = ({ leadId, leadPhone }: LeadWhatsAppProps) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel(`whatsapp-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `lead_id=eq.${leadId}`
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching WhatsApp messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const handleWhatsAppWeb = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const cleanPhone = leadPhone.replace(/\D/g, "");
      const message = "Olá! Estou entrando em contato sobre seu evento no Espaço Olinda.";
      
      const { error: msgError } = await supabase.from("whatsapp_messages").insert({
        lead_id: leadId,
        message,
        direction: 'outbound',
        sent_by: user?.id,
      });

      if (msgError) throw msgError;

      const { error: activityError } = await supabase.from("activities").insert({
        lead_id: leadId,
        type: "whatsapp",
        subject: "Mensagem WhatsApp enviada",
        description: message,
        created_by: user?.id,
      });

      if (activityError) throw activityError;

      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    } catch (error) {
      console.error("Error registering WhatsApp message:", error);
      toast.error("Erro ao registrar mensagem");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">WhatsApp do Lead</p>
              <p className="text-lg font-semibold text-foreground mt-1">{leadPhone}</p>
            </div>
            <Button onClick={handleWhatsAppWeb} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Abrir WhatsApp
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma conversa registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {msg.direction === 'outbound' ? (
                      <Send className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {msg.direction === 'outbound' ? 'Enviada' : 'Recebida'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(msg.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
