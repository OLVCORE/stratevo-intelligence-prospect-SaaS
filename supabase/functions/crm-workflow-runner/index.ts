// supabase/functions/crm-workflow-runner/index.ts
// Edge Function para executar workflows visuais com integração completa

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getTenantContext } from "../_shared/tenant-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const tenantContext = await getTenantContext(req);
    const { tenantId, userId, supabase } = tenantContext;

    const { executionId, nodeId, context } = await req.json();

    if (!executionId || !nodeId) {
      return new Response(
        JSON.stringify({ error: "executionId and nodeId are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar execução
    const { data: execution, error: execError } = await supabase
      .from("workflow_executions")
      .select("*, workflows(*)")
      .eq("id", executionId)
      .eq("tenant_id", tenantId)
      .single();

    if (execError || !execution) {
      throw new Error("Workflow execution not found");
    }

    const workflow = execution.workflows;

    // Executar node via função SQL
    const { data: result, error: nodeError } = await supabase.rpc(
      "execute_workflow_node",
      {
        p_workflow_id: workflow.id,
        p_node_id: nodeId,
        p_execution_id: executionId,
        p_context: context || {},
      }
    );

    if (nodeError) {
      // Atualizar execução com erro
      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          error_message: nodeError.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId);

      throw nodeError;
    }

    // Determinar próximo node baseado nas edges
    const workflowData = workflow.workflow_data;
    const edges = workflowData.edges || [];
    const nextEdges = edges.filter((e: any) => e.source === nodeId);

    let nextNodeId: string | null = null;
    if (nextEdges.length > 0) {
      // Se há condições, avaliar
      const edge = nextEdges[0]; // Simplificado: pegar primeiro edge
      if (!edge.condition || evaluateCondition(edge.condition, result)) {
        nextNodeId = edge.target;
      }
    }

    // Atualizar execução
    const updateData: any = {
      current_node_id: nextNodeId,
      results: {
        ...(execution.results || {}),
        [nodeId]: result,
      },
    };

    if (!nextNodeId) {
      // Workflow completo
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
      updateData.execution_time_ms =
        new Date(updateData.completed_at).getTime() -
        new Date(execution.started_at).getTime();

      // Atualizar estatísticas do workflow
      await supabase
        .from("workflows")
        .update({
          success_count: (workflow.success_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        })
        .eq("id", workflow.id);
    }

    await supabase
      .from("workflow_executions")
      .update(updateData)
      .eq("id", executionId);

    // Se há próximo node, executar recursivamente
    if (nextNodeId) {
      // Chamar novamente para próximo node
      const nextResult = await supabase.rpc("execute_workflow_node", {
        p_workflow_id: workflow.id,
        p_node_id: nextNodeId,
        p_execution_id: executionId,
        p_context: context || {},
      });

      return new Response(
        JSON.stringify({
          success: true,
          current_node: nodeId,
          next_node: nextNodeId,
          result,
          next_result: nextResult.data,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        completed: true,
        result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[Workflow Runner] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Função auxiliar para avaliar condições
function evaluateCondition(condition: any, result: any): boolean {
  if (!condition) return true;

  // Simplificado: avaliar condições básicas
  // Exemplo: { field: "success", operator: "equals", value: true }
  if (condition.field && condition.operator && condition.value !== undefined) {
    const fieldValue = result[condition.field];
    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "not_equals":
        return fieldValue !== condition.value;
      case "greater_than":
        return fieldValue > condition.value;
      case "less_than":
        return fieldValue < condition.value;
      default:
        return true;
    }
  }

  return true;
}
