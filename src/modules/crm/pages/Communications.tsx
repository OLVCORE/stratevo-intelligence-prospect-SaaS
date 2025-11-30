// src/modules/crm/pages/Communications.tsx
// Página completa de comunicações (Email Tracking, WhatsApp, Call Recording)

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTrackingView } from "@/modules/crm/components/email/EmailTrackingView";
import { WhatsAppTemplatesPanel } from "@/modules/crm/components/communications/WhatsAppTemplatesPanel";
import { CallRecordingsPanel } from "@/modules/crm/components/communications/CallRecordingsPanel";
import { WhatsAppStatusView } from "@/modules/crm/components/communications/WhatsAppStatusView";
import { ConversationDashboard } from "@/modules/crm/components/conversation-intelligence/ConversationDashboard";
import { CoachingCards } from "@/modules/crm/components/conversation-intelligence/CoachingCards";
import { ObjectionPatternsAnalyzer } from "@/modules/crm/components/conversation-intelligence/ObjectionPatternsAnalyzer";
import { CallTranscriptionViewer } from "@/modules/crm/components/conversation-intelligence/CallTranscriptionViewer";
import { Mail, MessageSquare, Phone, CheckCircle2, Brain } from "lucide-react";

export default function Communications() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comunicações</h1>
        <p className="text-muted-foreground">
          Centralize todas as comunicações: email tracking, WhatsApp e gravações de chamadas
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Tracking
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp Business
          </TabsTrigger>
          <TabsTrigger value="whatsapp-status" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Status WhatsApp
          </TabsTrigger>
          <TabsTrigger value="calls" className="gap-2">
            <Phone className="h-4 w-4" />
            Gravações de Chamadas
          </TabsTrigger>
          <TabsTrigger value="conversation-intelligence" className="gap-2">
            <Brain className="h-4 w-4" />
            Conversation Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <EmailTrackingView />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppTemplatesPanel />
        </TabsContent>

        <TabsContent value="whatsapp-status" className="space-y-6">
          <WhatsAppStatusView />
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          <CallRecordingsPanel />
        </TabsContent>

        <TabsContent value="conversation-intelligence" className="space-y-6">
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="transcriptions">Transcrições</TabsTrigger>
              <TabsTrigger value="coaching">Coaching Cards</TabsTrigger>
              <TabsTrigger value="objections">Padrões de Objeções</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <ConversationDashboard />
            </TabsContent>

            <TabsContent value="transcriptions">
              <CallTranscriptionViewer />
            </TabsContent>

            <TabsContent value="coaching">
              <CoachingCards />
            </TabsContent>

            <TabsContent value="objections">
              <ObjectionPatternsAnalyzer />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

