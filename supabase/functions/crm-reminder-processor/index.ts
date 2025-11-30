// supabase/functions/crm-reminder-processor/index.ts
// Edge Function para processar lembretes agendados
// Trigger: Cron job (a cada hora)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[Reminder Processor] Starting execution...");

    const now = new Date();
    const nowISO = now.toISOString();

    // Buscar lembretes pendentes que devem ser processados
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .lte("reminder_date", nowISO)
      .order("reminder_date", { ascending: true })
      .limit(100); // Processar até 100 lembretes por execução

    if (remindersError) {
      throw new Error(`Error fetching reminders: ${remindersError.message}`);
    }

    if (!reminders || reminders.length === 0) {
      console.log("[Reminder Processor] No reminders to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`[Reminder Processor] Processing ${reminders.length} reminders`);

    let processedCount = 0;
    let errorCount = 0;

    for (const reminder of reminders) {
      try {
        // Executar ação do lembrete
        await executeReminderAction(supabase, reminder);

        // Marcar como enviado
        await supabase
          .from("reminders")
          .update({
            status: "sent",
            sent_at: nowISO,
          })
          .eq("id", reminder.id);

        processedCount++;
      } catch (error: any) {
        console.error(
          `[Reminder Processor] Error processing reminder ${reminder.id}:`,
          error
        );

        // Marcar como falha
        await supabase
          .from("reminders")
          .update({
            status: "failed",
            error_message: error.message,
            sent_at: nowISO,
          })
          .eq("id", reminder.id);

        errorCount++;
      }
    }

    console.log(
      `[Reminder Processor] Completed: ${processedCount} processed, ${errorCount} errors`
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
    console.error("[Reminder Processor] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Executar ação do lembrete
async function executeReminderAction(supabase: any, reminder: any) {
  const actionType = reminder.action_type;
  const config = reminder.action_config || {};

  switch (actionType) {
    case "create_task":
      await createTaskFromReminder(supabase, reminder, config);
      break;

    case "send_email":
      await sendEmailFromReminder(supabase, reminder, config);
      break;

    case "send_notification":
      await sendNotificationFromReminder(supabase, reminder, config);
      break;

    case "send_whatsapp":
      await sendWhatsAppFromReminder(supabase, reminder, config);
      break;

    default:
      console.warn(`[Reminder Processor] Unknown action type: ${actionType}`);
  }
}

// Criar tarefa a partir do lembrete
async function createTaskFromReminder(supabase: any, reminder: any, config: any) {
  const taskData: any = {
    tenant_id: reminder.tenant_id,
    type: config.task_type || "task",
    subject: config.subject || reminder.message,
    description: config.description || reminder.message,
    completed: false,
  };

  // Relacionar com entidade
  if (reminder.lead_id) {
    taskData.lead_id = reminder.lead_id;
  }
  if (reminder.deal_id) {
    taskData.deal_id = reminder.deal_id;
  }
  if (reminder.activity_id) {
    taskData.activity_id = reminder.activity_id;
  }

  // Data de vencimento (hoje ou configurada)
  taskData.due_date = config.due_date || new Date().toISOString();

  // Responsável
  if (config.assign_to) {
    taskData.created_by = config.assign_to;
  }

  const { error } = await supabase.from("activities").insert(taskData);

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log(`[Reminder Processor] Task created from reminder ${reminder.id}`);
}

// Enviar email a partir do lembrete
async function sendEmailFromReminder(supabase: any, reminder: any, config: any) {
  // Buscar dados da entidade relacionada
  let entityData: any = {};
  let recipientEmail: string | null = null;

  if (reminder.lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", reminder.lead_id)
      .single();
    if (lead) {
      entityData = lead;
      recipientEmail = lead.email;
    }
  }

  if (!recipientEmail && config.recipient_email) {
    recipientEmail = config.recipient_email;
  }

  if (!recipientEmail) {
    throw new Error("No recipient email found");
  }

  const subject = config.subject || "Lembrete";
  const body = config.body || reminder.message;

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

  console.log(`[Reminder Processor] Email sent from reminder ${reminder.id}`);
}

// Enviar notificação a partir do lembrete
async function sendNotificationFromReminder(supabase: any, reminder: any, config: any) {
  const notificationData = {
    tenant_id: reminder.tenant_id,
    user_id: config.user_id || reminder.created_by,
    title: config.title || "Lembrete",
    message: reminder.message,
    type: config.notification_type || "reminder",
    read: false,
  };

  if (reminder.lead_id) {
    notificationData.entity_type = "lead";
    notificationData.entity_id = reminder.lead_id;
  }
  if (reminder.deal_id) {
    notificationData.entity_type = "deal";
    notificationData.entity_id = reminder.deal_id;
  }

  const { error } = await supabase.from("notifications").insert(notificationData);

  if (error) {
    console.warn(`[Reminder Processor] Failed to create notification: ${error.message}`);
  } else {
    console.log(`[Reminder Processor] Notification sent from reminder ${reminder.id}`);
  }
}

// Enviar WhatsApp a partir do lembrete
async function sendWhatsAppFromReminder(supabase: any, reminder: any, config: any) {
  let recipientPhone: string | null = null;

  if (reminder.lead_id) {
    const { data: lead } = await supabase
      .from("leads")
      .select("phone")
      .eq("id", reminder.lead_id)
      .single();
    if (lead) {
      recipientPhone = lead.phone;
    }
  }

  if (!recipientPhone && config.recipient_phone) {
    recipientPhone = config.recipient_phone;
  }

  if (!recipientPhone) {
    throw new Error("No recipient phone found");
  }

  const message = config.message || reminder.message;

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

  console.log(`[Reminder Processor] WhatsApp sent from reminder ${reminder.id}`);
}

