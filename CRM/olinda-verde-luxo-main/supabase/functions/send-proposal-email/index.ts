import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId } = await req.json();
    
    if (!proposalId) {
      throw new Error("proposalId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch proposal with lead data
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select(`
        *,
        leads (
          name,
          email,
          phone
        )
      `)
      .eq("id", proposalId)
      .single();

    if (fetchError) throw fetchError;
    if (!proposal) throw new Error("Proposal not found");

    console.log("Sending proposal email for:", proposal.proposal_number);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Espaço Linda <noreply@espacoolinda.com.br>",
        to: [proposal.leads?.email],
        subject: `Proposta Comercial ${proposal.proposal_number} - Espaço Linda`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2c5f2d; color: white; padding: 20px; text-align: center;">
              <h1>Espaço Linda</h1>
              <p>Proposta Comercial Nº ${proposal.proposal_number}</p>
            </div>
            
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Olá ${proposal.leads?.name},</p>
              
              <p>É com grande prazer que apresentamos nossa proposta comercial para o seu evento especial!</p>
              
              <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2c5f2d; margin-top: 0;">Detalhes do Evento</h2>
                <p><strong>Tipo de Evento:</strong> ${proposal.event_type}</p>
                ${proposal.event_date ? `<p><strong>Data:</strong> ${new Date(proposal.event_date).toLocaleDateString("pt-BR")}</p>` : ""}
                ${proposal.guest_count ? `<p><strong>Convidados:</strong> ${proposal.guest_count} pessoas</p>` : ""}
              </div>
              
              <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2c5f2d; margin-top: 0;">Investimento</h2>
                <div style="font-size: 32px; color: #2c5f2d; font-weight: bold; text-align: center; padding: 20px;">
                  R$ ${proposal.final_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <p><strong>Proposta válida até:</strong> ${new Date(proposal.valid_until).toLocaleDateString("pt-BR")}</p>
              
              <p>Para visualizar os detalhes completos e assinar a proposta, acesse o link abaixo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl}/proposals/${proposal.id}" 
                   style="background: #2c5f2d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Ver Proposta Completa
                </a>
              </div>
              
              <p>Estamos à disposição para esclarecer qualquer dúvida!</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe Espaço Linda</strong></p>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
              <p>Espaço Linda - Eventos Inesquecíveis</p>
              <p>www.espacoolinda.com.br</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    // Update proposal status
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ 
        status: "sent",
        sent_at: new Date().toISOString()
      })
      .eq("id", proposalId);

    if (updateError) throw updateError;

    console.log("Proposal email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email enviado com sucesso" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending proposal email:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
