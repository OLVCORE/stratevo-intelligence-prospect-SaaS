// supabase/functions/crm-automation-runner/index.ts
// Edge Function para executar automações do CRM em background
// Trigger: Cron job (a cada 5 minutos)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  trigger_type: string;
  trigger_condition: any;
  actions: any[];
  is_active: boolean;
}

interface AutomationEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  event_data: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[Automation Runner] Starting execution...");

    // 1. Buscar eventos pendentes
    const { data: events, error: eventsError } = await supabase
      .from("automation_events")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50); // Processar até 50 eventos por execução

    if (eventsError) {
      throw new Error(`Error fetching events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      console.log("[Automation Runner] No pending events");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`[Automation Runner] Processing ${events.length} events`);

    let processedCount = 0;
    let errorCount = 0;

    // 2. Processar cada evento
    for (const event of events as AutomationEvent[]) {
      try {
        // Marcar como processando
        await supabase
          .from("automation_events")
          .update({ status: "processing" })
          .eq("id", event.id);

        // Buscar regras de automação ativas para este tenant e tipo de evento
        const { data: rules, error: rulesError } = await supabase
          .from("automation_rules")
          .select("*")
          .eq("tenant_id", event.tenant_id)
          .eq("is_active", true)
          .eq("trigger_type", event.event_type);

        if (rulesError) {
          throw new Error(`Error fetching rules: ${rulesError.message}`);
        }

        if (!rules || rules.length === 0) {
          // Nenhuma regra encontrada, marcar como processado
          await supabase
            .from("automation_events")
            .update({
              status: "processed",
              processed_at: new Date().toISOString(),
            })
            .eq("id", event.id);
          continue;
        }

        // 3. Verificar condições e executar ações para cada regra
        for (const rule of rules as AutomationRule[]) {
          const shouldExecute = checkRuleConditions(rule, event);

          if (shouldExecute) {
            console.log(
              `[Automation Runner] Executing rule: ${rule.name} for event ${event.id}`
            );

            // Executar ações
            for (const action of rule.actions || []) {
              await executeAction(
                supabase,
                event.tenant_id,
                event.entity_type,
                event.entity_id,
                action,
                event.event_data
              );
            }

            // Registrar log de execução
            await supabase.from("automation_logs").insert({
              tenant_id: event.tenant_id,
              automation_rule_id: rule.id,
              entity_type: event.entity_type,
              entity_id: event.entity_id,
              trigger_type: event.event_type,
              trigger_data: event.event_data,
              executed_at: new Date().toISOString(),
              status: "success",
            });
          }
        }

        // Marcar evento como processado
        await supabase
          .from("automation_events")
          .update({
            status: "processed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", event.id);

        processedCount++;
      } catch (error: any) {
        console.error(
          `[Automation Runner] Error processing event ${event.id}:`,
          error
        );

        // Marcar evento como falha
        await supabase
          .from("automation_events")
          .update({
            status: "failed",
            error_message: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", event.id);

        errorCount++;
      }
    }

    console.log(
      `[Automation Runner] Completed: ${processedCount} processed, ${errorCount} errors`
    );

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[Automation Runner] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Verificar se a regra deve ser executada baseado nas condições
function checkRuleConditions(
  rule: AutomationRule,
  event: AutomationEvent
): boolean {
  const condition = rule.trigger_condition || {};

  // Para stage_change, verificar se from/to correspondem
  if (event.event_type === "stage_change") {
    const oldStatus = event.event_data?.old_status || event.event_data?.old_stage;
    const newStatus = event.event_data?.new_status || event.event_data?.new_stage;

    if (condition.from && oldStatus !== condition.from) {
      return false;
    }

    if (condition.to && newStatus !== condition.to) {
      return false;
    }
  }

  // Adicionar outras verificações de condição aqui
  // (field_update, time_based, etc.)

  return true;
}

// Executar ação da automação
async function executeAction(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: any,
  eventData: any
) {
  const actionType = action.type;

  switch (actionType) {
    case "send_email":
      await executeSendEmail(supabase, tenantId, entityType, entityId, action, eventData);
      break;

    case "create_task":
      await executeCreateTask(supabase, tenantId, entityType, entityId, action, eventData);
      break;

    case "send_notification":
      await executeSendNotification(supabase, tenantId, entityType, entityId, action, eventData);
      break;

    case "send_whatsapp":
      await executeSendWhatsApp(supabase, tenantId, entityType, entityId, action, eventData);
      break;

    case "update_field":
      await executeUpdateField(supabase, tenantId, entityType, entityId, action, eventData);
      break;

    default:
      console.warn(`[Automation Runner] Unknown action type: ${actionType}`);
  }
}

// Enviar email
async function executeSendEmail(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: any,
  eventData: any
) {
  // Buscar template de email
  const { data: template } = await supabase
    .from("email_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", action.template_id)
    .single();

  if (!template) {
    throw new Error(`Email template not found: ${action.template_id}`);
  }

  // Buscar dados da entidade
  const entityData = await fetchEntityData(supabase, tenantId, entityType, entityId);

  // Substituir variáveis no template
  let subject = replaceVariables(template.subject, entityData, eventData);
  let body = replaceVariables(template.body, entityData, eventData);

  // Buscar destinatário
  const recipientEmail = getRecipientEmail(entityType, entityData, action);

  if (!recipientEmail) {
    throw new Error("No recipient email found");
  }

  // Chamar Edge Function de envio de email
  const { data: { user } } = await supabase.auth.getUser();
  
  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/sdr-send-message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        channel: "email",
        to: recipientEmail,
        subject: subject,
        body: body,
        userId: user?.id,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }

  console.log(`[Automation Runner] Email sent to ${recipientEmail}`);
}

// Criar tarefa
async function executeCreateTask(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: any,
  eventData: any
) {
  const entityData = await fetchEntityData(supabase, tenantId, entityType, entityId);

  const taskData: any = {
    tenant_id: tenantId,
    type: action.task_type || "task",
    subject: replaceVariables(action.subject || "Nova tarefa", entityData, eventData),
    description: replaceVariables(action.description || "", entityData, eventData),
    completed: false,
  };

  // Relacionar com entidade
  if (entityType === "lead") {
    taskData.lead_id = entityId;
  } else if (entityType === "deal") {
    taskData.deal_id = entityId;
  }

  // Data de vencimento
  if (action.due_days) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + action.due_days);
    taskData.due_date = dueDate.toISOString();
  }

  // Responsável
  if (action.assign_to === "lead_owner" && entityData.assigned_to) {
    taskData.created_by = entityData.assigned_to;
  } else if (action.assign_to) {
    taskData.created_by = action.assign_to;
  }

  const { error } = await supabase.from("activities").insert(taskData);

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log(`[Automation Runner] Task created for ${entityType} ${entityId}`);
}

// Enviar notificação
async function executeSendNotification(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: any,
  eventData: any
) {
  const entityData = await fetchEntityData(supabase, tenantId, entityType, entityId);

  const notificationData = {
    tenant_id: tenantId,
    user_id: action.user_id || entityData.assigned_to,
    title: replaceVariables(action.title || "Notificação", entityData, eventData),
    message: replaceVariables(action.message || "", entityData, eventData),
    type: action.notification_type || "info",
    entity_type: entityType,
    entity_id: entityId,
    read: false,
  };

  // Inserir na tabela de notificações (ajustar nome da tabela conforme necessário)
  const { error } = await supabase
    .from("notifications")
    .insert(notificationData);

  if (error) {
    console.warn(`[Automation Runner] Failed to create notification: ${error.message}`);
    // Não falhar a automação se notificação falhar
  } else {
    console.log(`[Automation Runner] Notification sent`);
  }
}

// Enviar WhatsApp
async function executeSendWhatsApp(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: any,
  eventData: any
) {
  const entityData = await fetchEntityData(supabase, tenantId, entityType, entityId);

  const recipientPhone = getRecipientPhone(entityType, entityData, action);

  if (!recipientPhone) {
    throw new Error("No recipient phone found");
  }

  let message = action.message || "";

  // Se for quick reply, buscar da tabela
  if (action.quick_reply_id) {
    const { data: quickReply } = await supabase
      .from("whatsapp_quick_replies")
      .select("*")
      .eq("id", action.quick_reply_id)
      .single();

    if (quickReply) {
      message = replaceVariables(quickReply.message, entityData, eventData);
    }
  } else {
    message = replaceVariables(message, entityData, eventData);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/sdr-send-message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        channel: "whatsapp",
        to: recipientPhone,
        body: message,
        userId: user?.id,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send WhatsApp: ${response.statusText}`);
  }

  console.log(`[Automation Runner] WhatsApp sent to ${recipientPhone}`);
}

// Atualizar campo
async function executeUpdateField(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: any,
  eventData: any
) {
  const tableName = entityType === "lead" ? "leads" : entityType === "deal" ? "deals" : null;

  if (!tableName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const updateData: any = {};
  updateData[action.field] = action.value;

  const { error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", entityId)
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(`Failed to update field: ${error.message}`);
  }

  console.log(`[Automation Runner] Field ${action.field} updated`);
}

// Buscar dados da entidade
async function fetchEntityData(
  supabase: any,
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<any> {
  const tableName = entityType === "lead" ? "leads" : entityType === "deal" ? "deals" : null;

  if (!tableName) {
    return {};
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    console.warn(`[Automation Runner] Error fetching entity: ${error.message}`);
    return {};
  }

  return data || {};
}

// Substituir variáveis no template
function replaceVariables(template: string, entityData: any, eventData: any): string {
  let result = template;

  // Variáveis da entidade
  if (entityData) {
    Object.keys(entityData).forEach((key) => {
      const value = entityData[key];
      if (typeof value === "string" || typeof value === "number") {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        result = result.replace(new RegExp(`{{entity.${key}}}`, "g"), String(value));
      }
    });

    // Variáveis específicas de lead
    if (entityData.name) {
      result = result.replace(/{{lead.name}}/g, entityData.name);
    }
    if (entityData.email) {
      result = result.replace(/{{lead.email}}/g, entityData.email);
    }
    if (entityData.company_name) {
      result = result.replace(/{{lead.company_name}}/g, entityData.company_name);
    }
  }

  // Variáveis de evento
  if (eventData) {
    Object.keys(eventData).forEach((key) => {
      const value = eventData[key];
      if (typeof value === "string" || typeof value === "number") {
        result = result.replace(new RegExp(`{{event.${key}}}`, "g"), String(value));
      }
    });
  }

  // Variáveis de data
  const today = new Date();
  result = result.replace(/{{today}}/g, today.toLocaleDateString("pt-BR"));

  return result;
}

// Obter email do destinatário
function getRecipientEmail(entityType: string, entityData: any, action: any): string | null {
  if (action.recipient === "lead_email" && entityData.email) {
    return entityData.email;
  }
  if (action.recipient_email) {
    return action.recipient_email;
  }
  return entityData.email || null;
}

// Obter telefone do destinatário
function getRecipientPhone(entityType: string, entityData: any, action: any): string | null {
  if (action.recipient === "lead_phone" && entityData.phone) {
    return entityData.phone;
  }
  if (action.recipient_phone) {
    return action.recipient_phone;
  }
  return entityData.phone || null;
}

