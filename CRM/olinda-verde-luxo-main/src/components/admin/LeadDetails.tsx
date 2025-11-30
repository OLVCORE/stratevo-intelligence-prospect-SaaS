import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Activity,
  Edit,
  Trash,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Shield,
  Sparkles
} from "lucide-react";
import { LeadActivityTimeline } from "./LeadActivityTimeline";
import { LeadNotes } from "./LeadNotes";
import { LeadTasks } from "./LeadTasks";
import { LeadEmails } from "./LeadEmails";
import { LeadCalls } from "./LeadCalls";
import { LeadWhatsApp } from "./LeadWhatsApp";
import { LeadSocialMedia } from "./LeadSocialMedia";
import { LeadFiles } from "./LeadFiles";
import { LeadPriorityBadge } from "./LeadPriorityBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { LeadTagsManager } from "./LeadTagsManager";
import { LeadContacts } from "./LeadContacts";
import { LeadHistory } from "./LeadHistory";
import { LeadQualification } from "./LeadQualification";
import { AILeadInsights } from "./AILeadInsights";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
  priority: "low" | "medium" | "high" | "urgent";
  lead_score: number;
  tags: string[];
  company_name: string | null;
  position: string | null;
}

interface LeadDetailsProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
}

export const LeadDetails = ({ leadId, open, onOpenChange, onLeadUpdated }: LeadDetailsProps) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (leadId && open) {
      fetchLeadDetails();
    }
  }, [leadId, open]);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (error) throw error;
      setLead(data as Lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      toast.error("Erro ao carregar detalhes do lead");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirmed = () => {
    onOpenChange(false);
    onLeadUpdated?.();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {lead.name}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {lead.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline">{lead.event_type}</Badge>
                <Badge>{lead.status}</Badge>
                <LeadPriorityBadge priority={lead.priority} />
                <LeadScoreBadge score={lead.lead_score} />
                {lead.event_date && (
                  <span className="text-sm text-muted-foreground">
                    Evento: {format(new Date(lead.event_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
              {lead.company_name && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {lead.company_name} {lead.position && `• ${lead.position}`}
                </div>
              )}
              <div className="mt-3">
                <LeadTagsManager 
                  leadId={lead.id} 
                  tags={lead.tags || []} 
                  onTagsUpdate={(tags) => setLead({ ...lead, tags })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="mt-6">
          <TabsList className="grid w-full grid-cols-11 h-auto">
            <TabsTrigger value="timeline" className="gap-2">
              <Activity className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="qualification" className="gap-2">
              <Shield className="h-4 w-4" />
              Qualificação
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Shield className="h-4 w-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="calls" className="gap-2">
              <Phone className="h-4 w-4" />
              Ligações
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Facebook className="h-4 w-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Calendar className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="h-4 w-4" />
              Arquivos
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <LeadActivityTimeline leadId={leadId!} />
          </TabsContent>

          <TabsContent value="qualification" className="mt-6">
            <LeadQualification leadId={leadId!} />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <AILeadInsights leadId={leadId!} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <LeadContacts leadId={leadId!} />
          </TabsContent>

          <TabsContent value="emails" className="mt-6">
            <LeadEmails leadId={leadId!} leadEmail={lead.email} />
          </TabsContent>

          <TabsContent value="calls" className="mt-6">
            <LeadCalls leadId={leadId!} leadPhone={lead.phone} />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <LeadWhatsApp leadId={leadId!} leadPhone={lead.phone} />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <LeadSocialMedia leadId={leadId!} leadName={lead.name} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <LeadTasks leadId={leadId!} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <LeadNotes leadId={leadId!} />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <LeadFiles leadId={leadId!} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <LeadHistory leadId={leadId!} />
          </TabsContent>
        </Tabs>

        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          entityType="lead"
          entityName={lead.name}
          entityId={leadId!}
          entityData={lead}
          onConfirm={handleDeleteConfirmed}
        />
      </DialogContent>
    </Dialog>
  );
};
