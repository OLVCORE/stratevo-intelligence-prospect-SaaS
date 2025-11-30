import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    console.log('Checking for overdue proposals...');

    // Get proposals sent more than 3 days ago with status 'sent' (not responded)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: overdueProposals, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        leads (name, email, phone)
      `)
      .eq('status', 'sent')
      .lt('sent_at', threeDaysAgo.toISOString());

    if (proposalError) throw proposalError;

    if (!overdueProposals || overdueProposals.length === 0) {
      console.log('No overdue proposals found');
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No overdue proposals' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${overdueProposals.length} overdue proposals`);

    const results = await Promise.allSettled(
      overdueProposals.map(async (proposal: any) => {
        const lead = proposal.leads;
        if (!lead || !lead.email) {
          console.log(`No email for proposal ${proposal.proposal_number}`);
          return null;
        }

        const emailData = await resend.emails.send({
          from: 'Olinda Verde Luxo <noreply@espacoolinda.com.br>',
          to: lead.email,
          subject: `Lembrete: Proposta ${proposal.proposal_number} aguardando resposta`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Olá ${lead.name}!</h2>
              
              <p>Notamos que você ainda não respondeu à nossa proposta enviada há alguns dias.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Proposta: ${proposal.proposal_number}</h3>
                <p><strong>Evento:</strong> ${proposal.event_type}</p>
                <p><strong>Valor:</strong> R$ ${proposal.final_price.toLocaleString('pt-BR')}</p>
                <p><strong>Válida até:</strong> ${new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <p>Ficamos à disposição para esclarecer qualquer dúvida!</p>
              
              <p>Se já tomou uma decisão, por favor nos avise para que possamos prosseguir com o planejamento.</p>
              
              <p style="margin-top: 30px;">
                <strong>Atenciosamente,</strong><br>
                Equipe Olinda Verde Luxo<br>
                WhatsApp: (11) 99999-9999
              </p>
            </div>
          `,
        });

        console.log(`Reminder sent for proposal ${proposal.proposal_number} to ${lead.email}`);
        return emailData;
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value !== null).length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Overdue proposal reminders: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed, 
        total: overdueProposals.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending overdue proposal reminders:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
