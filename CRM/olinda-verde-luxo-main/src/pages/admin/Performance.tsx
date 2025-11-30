import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalsDashboard } from "@/components/admin/GoalsDashboard";
import { GamificationLeaderboard } from "@/components/admin/GamificationLeaderboard";
import { CoachingInsights } from "@/components/admin/CoachingInsights";
import { GoalsHierarchyExplainer } from "@/components/admin/GoalsHierarchyExplainer";
import { Target, Trophy, Brain } from "lucide-react";

const Performance = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Performance & Gamificação</h1>
            <p className="text-muted-foreground">
              Acompanhe metas, conquistas e receba insights personalizados
            </p>
          </div>
        </div>

        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              Metas & KPIs
            </TabsTrigger>
            <TabsTrigger value="gamification" className="gap-2">
              <Trophy className="h-4 w-4" />
              Gamificação
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Brain className="h-4 w-4" />
              Coaching
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-6">
            <GoalsHierarchyExplainer />
            
            <Card>
              <CardHeader>
                <CardTitle>Metas & KPIs</CardTitle>
                <CardDescription>
                  Acompanhe o progresso das suas metas individuais e da equipe em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoalsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gamification">
            <Card>
              <CardHeader>
                <CardTitle>Gamificação & Leaderboard</CardTitle>
                <CardDescription>
                  Compete com a equipe, ganhe pontos e desbloqueie conquistas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GamificationLeaderboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Coaching Insights</CardTitle>
                <CardDescription>
                  Receba sugestões personalizadas e identifique oportunidades de melhoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoachingInsights />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Performance;