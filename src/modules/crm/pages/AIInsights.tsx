// src/modules/crm/pages/AIInsights.tsx
// Página completa de insights de IA

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Lightbulb, MessageSquare } from "lucide-react";
import { AILeadScoringDashboard } from "../components/ai/AILeadScoringDashboard";
import { AISuggestionsPanel } from "../components/ai/AISuggestionsPanel";
import { AIConversationSummaries } from "../components/ai/AIConversationSummaries";

export default function AIInsights() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Insights de IA
        </h1>
        <p className="text-muted-foreground">
          Análises inteligentes, scores de leads e recomendações automáticas de IA
        </p>
      </div>

      <Tabs defaultValue="scoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Lead Scoring
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="summaries" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Resumos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="mt-6">
          <AILeadScoringDashboard />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <AISuggestionsPanel />
        </TabsContent>

        <TabsContent value="summaries" className="mt-6">
          <AIConversationSummaries />
        </TabsContent>
      </Tabs>
    </div>
  );
}

