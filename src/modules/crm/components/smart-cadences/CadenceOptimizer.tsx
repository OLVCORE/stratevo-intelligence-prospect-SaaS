// src/modules/crm/components/smart-cadences/CadenceOptimizer.tsx
// Otimizador de timing de cadências usando IA

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Loader2, TrendingUp, Clock, Target } from "lucide-react";

export function CadenceOptimizer() {
  const { tenant } = useTenant();
  const [selectedCadence, setSelectedCadence] = useState<string | null>(null);

  // Buscar cadências
  const { data: cadences } = useQuery({
    queryKey: ["smart-cadences", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("smart_cadences")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Buscar otimizações sugeridas
  const { data: optimizations, isLoading } = useQuery({
    queryKey: ["cadence-optimizations", selectedCadence],
    queryFn: async () => {
      if (!selectedCadence || !tenant?.id) return null;

      // Chamar Edge Function para otimização
      const { data, error } = await supabase.functions.invoke(
        "crm-optimize-cadence-timing",
        {
          body: {
            cadence_id: selectedCadence,
            tenant_id: tenant.id,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCadence && !!tenant?.id,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Otimizador de Timing</CardTitle>
          <CardDescription>
            Use IA para otimizar o timing dos seus passos de cadência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione uma Cadência</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedCadence || ""}
              onChange={(e) => setSelectedCadence(e.target.value || null)}
            >
              <option value="">Selecione...</option>
              {cadences?.map((cadence: any) => (
                <option key={cadence.id} value={cadence.id}>
                  {cadence.name}
                </option>
              ))}
            </select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Analisando e otimizando...</span>
            </div>
          )}

          {optimizations && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Otimizações Sugeridas
                </h4>
                <p className="text-sm text-muted-foreground">
                  {optimizations.summary || "Análise completa realizada."}
                </p>
              </div>

              {optimizations.suggestions?.map((suggestion: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <Badge variant="outline">{suggestion.step_number}</Badge>
                    <div className="flex-1">
                      <h5 className="font-semibold">{suggestion.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>Timing atual: {suggestion.current_timing}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4" />
                          <span>Timing otimizado: {suggestion.optimized_timing}</span>
                        </div>
                      </div>
                      {suggestion.expected_improvement && (
                        <div className="mt-2">
                          <Badge variant="default" className="bg-green-500">
                            +{suggestion.expected_improvement}% melhoria esperada
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!selectedCadence && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Selecione uma cadência para ver otimizações
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

