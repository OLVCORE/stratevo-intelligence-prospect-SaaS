// src/modules/sales-academy/pages/LearningPaths.tsx
// Página de trilhas de aprendizado

import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Play, Lock, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LearningPaths() {
  const { id } = useParams();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar trilha específica
  const { data: learningPath } = useQuery({
    queryKey: ["learning-path", id, tenant?.id],
    queryFn: async () => {
      if (!id || !tenant?.id) return null;

      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenant.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!tenant?.id,
  });

  // Buscar módulos da trilha
  const { data: modules } = useQuery({
    queryKey: ["learning-modules", id, tenant?.id],
    queryFn: async () => {
      if (!id || !tenant?.id) return [];

      const { data, error } = await supabase
        .from("learning_modules")
        .select("*")
        .eq("learning_path_id", id)
        .eq("tenant_id", tenant.id)
        .order("module_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!tenant?.id,
  });

  // Buscar progresso do usuário
  const { data: progress } = useQuery({
    queryKey: ["user-progress", id, user?.id, tenant?.id],
    queryFn: async () => {
      if (!id || !user?.id || !tenant?.id) return [];

      const { data, error } = await supabase
        .from("user_learning_progress")
        .select("*")
        .eq("learning_path_id", id)
        .eq("user_id", user.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user?.id && !!tenant?.id,
  });

  // Iniciar módulo
  const startModule = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!user?.id || !tenant?.id || !id) throw new Error("Dados incompletos");

      const { data, error } = await supabase
        .from("user_learning_progress")
        .upsert({
          tenant_id: tenant.id,
          user_id: user.id,
          learning_path_id: id,
          module_id: moduleId,
          status: "in_progress",
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,learning_path_id,module_id"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      toast({
        title: "Módulo iniciado!",
        description: "Continue aprendendo.",
      });
    },
  });

  const getModuleProgress = (moduleId: string) => {
    return progress?.find((p: any) => p.module_id === moduleId);
  };

  const isModuleUnlocked = (module: any, index: number) => {
    if (index === 0) return true;
    const previousModule = modules?.[index - 1];
    if (!previousModule) return true;
    const prevProgress = getModuleProgress(previousModule.id);
    return prevProgress?.status === "completed";
  };

  if (!learningPath) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Carregando trilha...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{learningPath.title}</h1>
        <p className="text-muted-foreground">{learningPath.description}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{learningPath.total_modules} módulos</Badge>
          <Badge variant="outline">{learningPath.estimated_hours}h estimadas</Badge>
          <Badge variant="outline" className="capitalize">
            {learningPath.difficulty_level}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {modules?.map((module: any, index: number) => {
          const moduleProgress = getModuleProgress(module.id);
          const unlocked = isModuleUnlocked(module, index);

          return (
            <Card key={module.id} className={!unlocked ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {moduleProgress?.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : !unlocked ? (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{module.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{module.estimated_minutes} min</span>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {module.content_type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {moduleProgress && (
                      <div className="mt-4">
                        <Progress value={moduleProgress.completion_percentage || 0} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {moduleProgress.completion_percentage || 0}% completo
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      {moduleProgress?.status === "completed" ? (
                        <Button variant="outline" disabled>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Completo
                        </Button>
                      ) : !unlocked ? (
                        <Button variant="outline" disabled>
                          <Lock className="h-4 w-4 mr-2" />
                          Bloqueado
                        </Button>
                      ) : (
                        <Button
                          onClick={() => startModule.mutate(module.id)}
                          disabled={startModule.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {moduleProgress ? "Continuar" : "Iniciar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

