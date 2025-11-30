import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Send, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadEmailsProps {
  leadId: string;
  leadEmail: string;
}

export const LeadEmails = ({ leadId, leadEmail }: LeadEmailsProps) => {
  const [showCompose, setShowCompose] = useState(false);
  const [email, setEmail] = useState({ subject: "", body: "" });
  const [isSending, setIsSending] = useState(false);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchEmailHistory();
    
    const channel = supabase
      .channel(`email-history-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_history',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          console.log('Email history updated via realtime');
          fetchEmailHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchEmailHistory = async () => {
    const { data, error } = await supabase
      .from("email_history")
      .select("*")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching email history:", error);
    } else {
      setEmailHistory(data || []);
    }
  };

  const handleSendEmail = async () => {
    console.log("[LeadEmails] handleSendEmail called", { leadId, leadEmail, email });

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    console.log("[LeadEmails] User session:", session ? "authenticated" : "NOT authenticated");
    
    if (!session) {
      toast.error("Você precisa estar logado para enviar emails");
      return;
    }

    if (!email.subject.trim() || !email.body.trim()) {
      toast.error("Preencha o assunto e o corpo do email");
      return;
    }

    setIsSending(true);
    try {
      console.log("[LeadEmails] invoking send-lead-email function");
      const response = await supabase.functions.invoke("send-lead-email", {
        body: {
          leadId,
          to: leadEmail,
          subject: email.subject,
          body: email.body,
        },
      });
      console.log("[LeadEmails] send-lead-email response", response);

      if (response.error) {
        console.error("[LeadEmails] error from function", response.error);
        
        // Mensagem mais clara para erro de domínio não verificado
        if (response.error.message?.includes("not verified")) {
          throw new Error(
            "O domínio espacoolinda.com.br não está verificado no Resend. " +
            "Verifique o domínio em resend.com/domains para enviar emails."
          );
        }
        
        throw new Error(response.error.message || "Erro ao enviar email");
      }

      if (!response.data || !response.data.success) {
        console.error("[LeadEmails] unexpected response", response);
        throw new Error("Resposta inesperada do servidor");
      }

      toast.success("Email enviado com sucesso!");
      setEmail({ subject: "", body: "" });
      setShowCompose(false);

      // Forçar atualização da lista
      await fetchEmailHistory();
    } catch (error: any) {
      console.error("[LeadEmails] Error sending email:", error);
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {!showCompose ? (
        <Button onClick={() => setShowCompose(true)} className="gap-2">
          <Send className="h-4 w-4" />
          Enviar Email
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Novo Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Para:</label>
              <Input value={leadEmail} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Assunto:</label>
              <Input
                placeholder="Assunto do email"
                value={email.subject}
                onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mensagem:</label>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={email.body}
                onChange={(e) => setEmail({ ...email, body: e.target.value })}
                rows={10}
                className="mt-1 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendEmail} disabled={isSending} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar
              </Button>
              <Button variant="outline" onClick={() => { setShowCompose(false); setEmail({ subject: "", body: "" }); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {emailHistory.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum email enviado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emailHistory.map((emailItem) => (
            <Card key={emailItem.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{emailItem.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(emailItem.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {emailItem.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
