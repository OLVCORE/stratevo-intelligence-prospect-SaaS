import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get appointments that happened yesterday and are marked as "realizado"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, leads:lead_id(id, status)')
      .eq('status', 'realizado')
      .gte('appointment_date', yesterdayStart.toISOString())
      .lte('appointment_date', yesterdayEnd.toISOString());

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      console.log('No completed appointments to follow up');
      return new Response(
        JSON.stringify({ message: 'No follow-ups to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // Send follow-up emails
    for (const appointment of appointments) {
      const emailBody = `
        <h2>Obrigado pela Visita ao Espaço Olinda!</h2>
        <p>Olá ${appointment.name},</p>
        <p>Foi um prazer recebê-lo(a) ontem no Espaço Olinda!</p>
        <p>Esperamos que tenha gostado do nosso espaço e dos serviços que oferecemos para o seu <strong>${appointment.event_type}</strong>.</p>
        
        <h3>Próximos Passos:</h3>
        <ul>
          <li>Podemos preparar uma proposta personalizada para você</li>
          <li>Agendar uma degustação do menu</li>
          <li>Esclarecer quaisquer dúvidas sobre valores e disponibilidade</li>
        </ul>

        <p>Entre em contato conosco para darmos continuidade ao planejamento do seu evento!</p>
        <p><strong>WhatsApp:</strong> (11) 99999-9999</p>
        <p><strong>Email:</strong> contato@espacoolinda.com.br</p>
        
        <br>
        <p>Atenciosamente,<br>Equipe Espaço Olinda</p>
      `;

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Espaço Olinda <contato@espacoolinda.com.br>',
            to: [appointment.email],
            subject: 'Obrigado pela Visita! Vamos dar continuidade ao seu evento?',
            html: emailBody,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send follow-up email:', await emailResponse.text());
        } else {
          console.log(`Follow-up sent to ${appointment.email}`);

          // Update lead status to "contatado" if it's still "novo"
          if (appointment.leads && appointment.leads.status === 'novo') {
            await supabase
              .from('leads')
              .update({ status: 'contatado' })
              .eq('id', appointment.leads.id);
          }
        }
      } catch (emailError) {
        console.error('Error sending follow-up email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Follow-ups sent successfully',
        count: appointments.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-visit-followup:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
