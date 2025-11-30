// src/modules/sales-academy/pages/AcademyDashboard.tsx
// Dashboard principal da Academia de Vendas

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Award, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AcademyDashboard() {
  const { tenant } = useTenant();
  const { user } = useAuth();

  // Buscar progresso do usuário
  const { data: progress } = useQuery({
    queryKey: ["user-learning-progress", user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return null;

      const { data, error } = await supabase
        .from("user_learning_progress")
        .select(`
          *,
          learning_path:learning_path_id (
            id,
            title,
            total_modules
          )
        `)
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!tenant?.id,
  });

  // Buscar certificações do usuário
  const { data: certifications } = useQuery({
    queryKey: ["user-certifications", user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return [];

      const { data, error } = await supabase
        .from("user_certifications")
        .select(`
          *,
          certification:certification_id (
            id,
            name,
            description
          )
        `)
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .eq("status", "earned")
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!tenant?.id,
  });

  // Buscar trilhas disponíveis
  const { data: learningPaths } = useQuery({
    queryKey: ["learning-paths", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const totalProgress = progress?.reduce((acc: number, p: any) => {
    return acc + (p.completion_percentage || 0);
  }, 0) || 0;
  const averageProgress = progress && progress.length > 0 
    ? totalProgress / progress.length 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academia de Vendas</h1>
        <p className="text-muted-foreground">
          Desenvolva suas habilidades de vendas com trilhas personalizadas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trilhas Iniciadas</p>
                <p className="text-2xl font-bold">{progress?.length || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
                <p className="text-2xl font-bold">{Math.round(averageProgress)}%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificações</p>
                <p className="text-2xl font-bold">{certifications?.length || 0}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trilhas Disponíveis</p>
                <p className="text-2xl font-bold">{learningPaths?.length || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trilhas em Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Trilhas</CardTitle>
          <CardDescription>
            Continue de onde parou
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress && progress.length > 0 ? (
            <div className="space-y-4">
              {progress.map((p: any) => (
                <div key={p.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      {p.learning_path?.title || "Trilha"}
                    </h4>
                    <Badge variant={
                      p.status === "completed" ? "default" :
                      p.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {p.status === "completed" ? "Completa" :
                       p.status === "in_progress" ? "Em Progresso" : "Não Iniciada"}
                    </Badge>
                  </div>
                  <Progress value={p.completion_percentage || 0} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {p.completion_percentage || 0}% completo
                  </p>
                  <Link to={`/sales-academy/learning-paths/${p.learning_path_id}`}>
                    <Button variant="outline" size="sm" className="mt-2">
                      Continuar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma trilha iniciada ainda.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificações */}
      {certifications && certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Minhas Certificações</CardTitle>
            <CardDescription>
              Certificações conquistadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {certifications.map((cert: any) => (
                <div key={cert.id} className="p-4 border rounded-lg text-center">
                  <Award className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                  <h4 className="font-semibold">{cert.certification?.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conquistada em {new Date(cert.earned_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trilhas Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Trilhas Disponíveis</CardTitle>
          <CardDescription>
            Explore novas trilhas de aprendizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learningPaths && learningPaths.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPaths.map((path: any) => (
                <div key={path.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{path.title}</h4>
                    {path.is_featured && (
                      <Badge variant="default">Destaque</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {path.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>{path.total_modules} módulos</span>
                    <span>{path.estimated_hours}h estimadas</span>
                    <Badge variant="outline" className="capitalize">
                      {path.difficulty_level}
                    </Badge>
                  </div>
                  <Link to={`/sales-academy/learning-paths/${path.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Iniciar Trilha
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma trilha disponível no momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

