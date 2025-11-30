// src/modules/sales-academy/hooks/useSalesAcademy.ts
// Hook para gerenciar dados da Sales Academy

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export function useLearningPaths() {
  const { tenant } = useTenant();

  return useQuery({
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
}

export function useUserProgress(learningPathId?: string) {
  const { tenant } = useTenant();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-learning-progress", user?.id, learningPathId, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return [];
      
      let query = supabase
        .from("user_learning_progress")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id);

      if (learningPathId) {
        query = query.eq("learning_path_id", learningPathId);
      }

      const { data, error } = await query.order("last_accessed_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!tenant?.id,
  });
}

export function useUpdateProgress() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      learningPathId,
      moduleId,
      completionPercentage,
      status,
      score,
    }: {
      learningPathId: string;
      moduleId: string;
      completionPercentage: number;
      status: string;
      score?: number;
    }) => {
      if (!user?.id || !tenant?.id) throw new Error("Dados incompletos");

      const { data, error } = await supabase
        .from("user_learning_progress")
        .upsert({
          tenant_id: tenant.id,
          user_id: user.id,
          learning_path_id: learningPathId,
          module_id: moduleId,
          completion_percentage: completionPercentage,
          status,
          score,
          last_accessed_at: new Date().toISOString(),
          ...(status === "completed" && { completed_at: new Date().toISOString() }),
        }, {
          onConflict: "user_id,learning_path_id,module_id"
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-learning-progress"] });
    },
  });
}

