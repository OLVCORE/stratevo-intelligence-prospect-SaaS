// src/components/crm/multi-tenant/BusinessModelAdapter.tsx
// REESCRITO SEM ERRO DE HOOKS - Todos os hooks no topo, nenhum condicional

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type BusinessModelAdapterProps = {
  children: (config: any) => React.ReactNode;
  modelKey?: string; // default 'generic'
};

export function BusinessModelAdapter({ 
  children, 
  modelKey = "generic" 
}: BusinessModelAdapterProps) {
  // TODOS OS HOOKS NO TOPO - SEMPRE NA MESMA ORDEM
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // useEffect SEMPRE EXECUTA - NUNCA DENTRO DE CONDICIONAL
  useEffect(() => {
    const loadBusinessModelConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("business_model_templates")
          .select("crm_config")
          .eq("model_key", modelKey)
          .maybeSingle();

        if (fetchError) {
          console.error("Error loading business model config:", fetchError);
          setError("Erro ao carregar configuração de modelo de negócio.");
          setIsLoading(false);
          return;
        }

        if (!data?.crm_config) {
          // Fallback: usa uma config padrão genérica
          setConfig({
            leadFields: {
              name: { type: "text", label: "Nome", required: true },
              email: { type: "text", label: "Email", required: true },
              phone: { type: "text", label: "Telefone", required: true },
              opportunity_type: {
                type: "select",
                label: "Tipo de Oportunidade",
                options: ["projeto", "consultoria", "produto", "servico"],
                required: false
              },
              budget: { type: "number", label: "Orçamento", required: false }
            },
            pipelineStages: [
              { key: "novo", label: "Novo Lead", color: "#3b82f6" },
              { key: "qualificado", label: "Qualificado", color: "#8b5cf6" },
              { key: "proposta", label: "Proposta", color: "#f59e0b" },
              { key: "negociacao", label: "Negociação", color: "#10b981" },
              { key: "ganho", label: "Ganho", color: "#22c55e" },
              { key: "perdido", label: "Perdido", color: "#ef4444" }
            ],
            labels: {
              opportunity: "Oportunidade",
              lead: "Lead"
            }
          });
          setIsLoading(false);
          return;
        }

        setConfig(data.crm_config);
        setIsLoading(false);
      } catch (err) {
        console.error("Unexpected error loading business model config:", err);
        setError("Erro inesperado ao carregar configuração.");
        setIsLoading(false);
      }
    };

    loadBusinessModelConfig();
  }, [modelKey]);

  // RENDERIZAÇÃO CONDICIONAL APENAS NO JSX - NUNCA HOOKS DENTRO
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configuração de CRM...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
          <p className="text-destructive font-semibold mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">
            Verifique se a tabela business_model_templates existe e
            se há um registro com model_key = '{modelKey}'.
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-warning/10 rounded-lg">
          <p className="text-warning font-semibold mb-2">
            Nenhuma configuração CRM disponível.
          </p>
          <p className="text-sm text-muted-foreground">
            Contate o administrador para configurar o modelo de negócio.
          </p>
        </div>
      </div>
    );
  }

  return <>{children(config)}</>;
}
