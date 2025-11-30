// src/modules/crm/pages/Performance.tsx
// Página de performance completa com Metas, KPIs, Gamificação e Coaching

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy, Brain, BarChart3 } from "lucide-react";
import { GoalsDashboard } from "../components/performance/GoalsDashboard";
import { GamificationLeaderboard } from "../components/performance/GamificationLeaderboard";
import { CoachingInsights } from "../components/performance/CoachingInsights";

export default function Performance() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance & Gestão de Equipe</h1>
        <p className="text-muted-foreground">
          Acompanhe métricas, metas, gamificação e insights de coaching da equipe
        </p>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas & KPIs
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Gamificação
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Coaching
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-6">
          <GoalsDashboard />
        </TabsContent>

        <TabsContent value="gamification" className="mt-6">
          <GamificationLeaderboard />
        </TabsContent>

        <TabsContent value="coaching" className="mt-6">
          <CoachingInsights />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Performance</CardTitle>
              <CardDescription>
                Análises detalhadas de performance da equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Componente de analytics será implementado aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

