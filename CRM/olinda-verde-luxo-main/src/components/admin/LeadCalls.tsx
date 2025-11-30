import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, PhoneCall, Clock, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CallRecordingPlayer } from "./CallRecordingPlayer";

interface LeadCallsProps {
  leadId: string;
  leadPhone: string;
}

export const LeadCalls = ({ leadId, leadPhone }: LeadCallsProps) => {
  const [callHistory, setCallHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchCallHistory();
    
    const channel = supabase
      .channel(`call-history-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_history',
          filter: `lead_id=eq.${leadId}`
        },
        () => fetchCallHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchCallHistory = async () => {
    const { data, error } = await supabase
      .from("call_history")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching call history:", error);
    } else {
      setCallHistory(data || []);
    }
  };

  const handleCall = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      toast.loading("Iniciando chamada...");

      const { data, error } = await supabase.functions.invoke("twilio-start-call", {
        body: {
          leadId: leadId,
          phoneNumber: leadPhone,
        },
      });

      if (error) throw error;

      toast.success("Chamada iniciada via Twilio com sucesso!");
      toast.info("A gravação será salva automaticamente quando a chamada terminar.");
      
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Erro ao iniciar chamada");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Telefone do Lead</p>
              <p className="text-lg font-semibold text-foreground mt-1">{leadPhone}</p>
            </div>
            <Button onClick={handleCall} className="gap-2">
              <PhoneCall className="h-4 w-4" />
              Ligar Agora
            </Button>
          </div>
        </CardContent>
      </Card>

      {callHistory.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma chamada registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {callHistory.map((call) => (
            <div key={call.id} className="space-y-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {call.direction === 'outbound' ? (
                        <PhoneOutgoing className="h-5 w-5 text-blue-500" />
                      ) : (
                        <PhoneIncoming className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {call.direction === 'outbound' ? 'Chamada realizada' : 'Chamada recebida'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Duração: {call.duration ? `${call.duration}s` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(call.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  {call.notes && !call.recording_url && (
                    <p className="text-sm text-muted-foreground mt-3">{call.notes}</p>
                  )}
                </CardContent>
              </Card>
              
              {call.recording_url && (
                <CallRecordingPlayer
                  recordingUrl={call.recording_url}
                  transcription={call.notes}
                  duration={call.duration}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
