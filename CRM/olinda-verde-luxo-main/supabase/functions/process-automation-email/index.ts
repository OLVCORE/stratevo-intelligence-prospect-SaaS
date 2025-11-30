import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutomationEmailRequest {
  leadId: string;
  templateId?: string;
  subject: string;
  body: string;
  variables?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { leadId, templateId, subject, body, variables = {} }: AutomationEmailRequest = await req.json();

    console.log("Processing automation email for lead:", leadId);

    // Buscar informações do lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      throw new Error("Lead não encontrado");
    }

    // Substituir variáveis no template
    let emailSubject = subject;
    let emailBody = body;

    const allVariables = {
      nome: lead.name,
      email: lead.email,
      telefone: lead.phone,
      evento: lead.event_type,
      empresa: lead.company_name || "",
      ...variables,
    };

    // Substituir variáveis usando {{variavel}}
    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      emailSubject = emailSubject.replace(regex, value);
      emailBody = emailBody.replace(regex, value);
    });

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "Espaço Olinda <onboarding@resend.dev>",
      to: [lead.email],
      subject: emailSubject,
      html: emailBody,
    });

    console.log("Email sent successfully:", emailResponse);

    // Registrar no histórico de emails
    await supabase.from("email_history").insert({
      lead_id: leadId,
      subject: emailSubject,
      body: emailBody,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: emailResponse.data,
        message: "Email enviado com sucesso" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in process-automation-email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
