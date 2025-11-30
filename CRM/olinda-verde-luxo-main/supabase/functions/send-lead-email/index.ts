import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  leadId: string;
  to: string;
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter usuário autenticado
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { leadId, to, subject, body }: EmailRequest = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Enviando email para:", to);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Salvar no histórico de emails (obter o ID gerado)
    const { data: emailHistoryData, error: historyError } = await supabase
      .from("email_history")
      .insert({
        lead_id: leadId,
        subject: subject,
        body: body,
        sent_by: userId,
        status: "sent",
      })
      .select()
      .single();

    if (historyError) {
      console.error("Erro ao salvar histórico:", historyError);
    }

    const emailHistoryId = emailHistoryData?.id;

    // Adicionar pixel de tracking e modificar links no body
    let trackedBody = body.replace(/\n/g, "<br>");
    
    if (emailHistoryId) {
      // Adicionar pixel de tracking de abertura
      const trackingPixel = `<img src="${supabaseUrl}/functions/v1/track-email?id=${emailHistoryId}&action=open" width="1" height="1" alt="" style="display:none" />`;
      trackedBody += trackingPixel;

      // Modificar links para tracking de cliques
      trackedBody = trackedBody.replace(
        /<a href="([^"]+)"/g,
        `<a href="${supabaseUrl}/functions/v1/track-email?id=${emailHistoryId}&action=click&url=$1"`
      );
    }

    // Enviar email via Resend API com tracking
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "EspaçoOlinda <onboarding@resend.dev>", // Temporário até verificar updates.espacoolinda.com.br
        to: [to],
        subject: subject,
        html: trackedBody,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Erro ao enviar email:", emailData);
      throw new Error(emailData.message || "Erro ao enviar email");
    }

    console.log("Email enviado com sucesso:", emailData);

    // Criar atividade
    const { error: activityError } = await supabase
      .from("activities")
      .insert({
        lead_id: leadId,
        type: "email",
        subject: `Email: ${subject}`,
        description: body,
        created_by: userId,
      });

    if (activityError) {
      console.error("Erro ao criar atividade:", activityError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado com sucesso",
        emailId: emailData.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no send-lead-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
