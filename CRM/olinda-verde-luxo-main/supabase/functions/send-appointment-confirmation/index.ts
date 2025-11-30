import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentConfirmationRequest {
  name: string;
  email: string;
  appointmentDate: string;
  eventType: string;
  eventDate?: string;
  isConfirmation?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, appointmentDate, eventType, eventDate, isConfirmation }: AppointmentConfirmationRequest = await req.json();

    console.log("Sending appointment email to:", email, "- isConfirmation:", isConfirmation);

    const formattedAppointmentDate = new Date(appointmentDate).toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const formattedEventDate = eventDate ? new Date(eventDate).toLocaleDateString('pt-BR', {
      dateStyle: 'long'
    }) : 'A definir';

    const subject = isConfirmation 
      ? "✅ Visita Confirmada - Espaço Olinda"
      : "Solicitação de Visita Recebida - Aguardando Confirmação";

    const htmlContent = isConfirmation ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2E7D32; margin-bottom: 20px;">🎉 Visita Confirmada!</h1>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
            Olá, <strong>${name}</strong>!
          </p>

          <div style="background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #065F46; margin: 0; font-weight: bold;">
              ✅ Sua visita ao Espaço Olinda foi CONFIRMADA!
            </p>
            <p style="color: #065F46; margin: 8px 0 0 0; font-size: 14px;">
              Estamos ansiosos para recebê-lo(a) e mostrar todo o nosso espaço!
            </p>
          </div>

          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 6px; margin: 24px 0;">
            <h3 style="color: #1F2937; margin-top: 0;">📋 Detalhes da Visita Confirmada:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; color: #4B5563;">
                <strong>Data e Horário:</strong> ${formattedAppointmentDate}
              </li>
              <li style="padding: 8px 0; color: #4B5563;">
                <strong>Tipo de Evento:</strong> ${eventType}
              </li>
              <li style="padding: 8px 0; color: #4B5563;">
                <strong>Data Prevista do Evento:</strong> ${formattedEventDate}
              </li>
            </ul>
          </div>

          <div style="background-color: #FEF3C7; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <h3 style="color: #92400E; margin-top: 0;">📍 Como Chegar:</h3>
            <p style="color: #92400E; margin: 8px 0;">
              <strong>Endereço:</strong> Estrada Mun. Manoel Gomes da Silva, 1130 - Santa Isabel, SP
            </p>
            <p style="color: #92400E; margin: 8px 0; font-size: 14px;">
              💡 Dica: Como estamos em área rural, recomendamos usar GPS. Chegando mais cedo, teremos mais tempo para o tour completo!
            </p>
          </div>

          <div style="background-color: #ECFDF5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <h3 style="color: #065F46; margin-top: 0;">📞 Contatos para Dúvidas:</h3>
            <p style="margin: 8px 0; color: #065F46;">
              <strong>Telefone/WhatsApp:</strong> (11) 97430-4343
            </p>
            <p style="margin: 8px 0; color: #065F46;">
              <strong>Email:</strong> consultores@espacoolinda.com.br
            </p>
          </div>

          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
            Caso precise reagendar ou tenha qualquer imprevisto, por favor nos avise com antecedência.
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
            Até breve!<br>
            <strong style="color: #2E7D32;">Equipe Espaço Olinda</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 20px;">
          Este é um email automático, por favor não responda.
        </p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2E7D32; margin-bottom: 20px;">Olá, ${name}!</h1>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
            Recebemos sua solicitação de visita ao <strong>Espaço Olinda</strong> e estamos muito felizes com seu interesse!
          </p>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #92400E; margin: 0; font-weight: bold;">
              ⚠️ IMPORTANTE: Sua visita ainda não está confirmada
            </p>
            <p style="color: #92400E; margin: 8px 0 0 0; font-size: 14px;">
              Nossa equipe irá verificar a disponibilidade e entrar em contato com você em breve para confirmar o agendamento.
            </p>
          </div>

          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 6px; margin: 24px 0;">
            <h3 style="color: #1F2937; margin-top: 0;">📋 Detalhes da Solicitação:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; color: #4B5563;">
                <strong>Data da Visita Solicitada:</strong> ${formattedAppointmentDate}
              </li>
              <li style="padding: 8px 0; color: #4B5563;">
                <strong>Tipo de Evento:</strong> ${eventType}
              </li>
              <li style="padding: 8px 0; color: #4B5563;">
                <strong>Data do Evento:</strong> ${formattedEventDate}
              </li>
            </ul>
          </div>

          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">
            O Espaço Olinda está localizado em uma área rural de Santa Isabel, e precisamos coordenar nossa equipe para garantir que você tenha a melhor experiência durante a visita.
          </p>

          <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
            <strong>Aguarde nosso contato</strong> para a confirmação definitiva do agendamento. Caso tenha alguma dúvida, entre em contato conosco:
          </p>

          <div style="background-color: #ECFDF5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 8px 0; color: #065F46;">
              📞 <strong>Telefone:</strong> (11) 97430-4343
            </p>
            <p style="margin: 8px 0; color: #065F46;">
              📧 <strong>Email:</strong> consultores@espacoolinda.com.br
            </p>
            <p style="margin: 8px 0; color: #065F46;">
              📍 <strong>Endereço:</strong> Estrada Mun. Manoel Gomes da Silva, 1130 - Santa Isabel, SP
            </p>
          </div>

          <p style="color: #6B7280; font-size: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
            Atenciosamente,<br>
            <strong style="color: #2E7D32;">Equipe Espaço Olinda</strong>
          </p>
        </div>
        
        <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 20px;">
          Este é um email automático, por favor não responda.
        </p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Espaço Olinda <consultores@espacoolinda.com.br>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    console.log("Appointment confirmation email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
