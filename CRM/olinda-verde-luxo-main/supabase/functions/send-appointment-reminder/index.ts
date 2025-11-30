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

    // Get appointments happening in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'agendado')
      .gte('appointment_date', tomorrowStart.toISOString())
      .lte('appointment_date', tomorrowEnd.toISOString());

    if (error) throw error;

    if (!appointments || appointments.length === 0) {
      console.log('No appointments to remind for tomorrow');
      return new Response(
        JSON.stringify({ message: 'No reminders to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // Send reminder emails
    for (const appointment of appointments) {
      const appointmentDate = new Date(appointment.appointment_date);
      const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const emailBody = `
        <h2>Lembrete: Sua Visita ao Espaço Olinda</h2>
        <p>Olá ${appointment.name},</p>
        <p>Este é um lembrete de que você tem uma <strong>${appointment.appointment_type === 'degustacao' ? 'degustação' : 'visita'}</strong> agendada para:</p>
        <ul>
          <li><strong>Data:</strong> ${formattedDate}</li>
          <li><strong>Horário:</strong> ${formattedTime}</li>
          <li><strong>Tipo de Evento:</strong> ${appointment.event_type}</li>
        </ul>
        <p>Estamos ansiosos para recebê-lo(a)!</p>
        <p>Em caso de necessidade de reagendamento, entre em contato conosco.</p>
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
            subject: `Lembrete: Visita Agendada para Amanhã - ${formattedDate}`,
            html: emailBody,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        } else {
          console.log(`Reminder sent to ${appointment.email}`);
        }
      } catch (emailError) {
        console.error('Error sending reminder email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Reminders sent successfully',
        count: appointments.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-appointment-reminder:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
