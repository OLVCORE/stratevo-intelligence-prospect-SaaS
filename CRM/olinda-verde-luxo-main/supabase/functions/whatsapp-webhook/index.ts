import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  from: string;
  body: string;
  name?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle Meta webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
      console.log('Meta webhook verified');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('WhatsApp webhook received:', JSON.stringify(payload));

    let message: WhatsAppMessage;

    // Detect format: Meta vs Twilio
    if (payload.object === 'whatsapp_business_account' && payload.entry) {
      // Meta WhatsApp Business format
      console.log('Processing Meta WhatsApp format');
      const entry = payload.entry[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const metaMessage = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      if (!metaMessage) {
        console.log('No message in Meta payload');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      message = {
        from: metaMessage.from,
        body: metaMessage.text?.body || metaMessage.caption || '',
        name: contact?.profile?.name || 'Visitante',
      };
    } else if (payload.From && payload.Body) {
      // Twilio WhatsApp format
      console.log('Processing Twilio WhatsApp format');
      message = {
        from: payload.From.replace('whatsapp:', ''),
        body: payload.Body,
        name: payload.ProfileName || 'Visitante',
      };
    } else {
      console.error('Unrecognized webhook format:', payload);
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!message.from || !message.body) {
      return new Response(
        JSON.stringify({ error: 'Invalid message data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processed message:', message);

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', message.from)
      .single();

    let leadId = existingLead?.id;

    // If no existing lead, create one
    if (!leadId) {
      console.log('Creating new lead from WhatsApp message');
      
      // Extract email if present in message (simple regex)
      const emailMatch = message.body.match(/[\w.-]+@[\w.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : `whatsapp_${message.from}@placeholder.com`;

      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: message.name,
          email: email,
          phone: message.from,
          event_type: 'casamento', // Default, user can update later
          message: message.body,
          source: 'whatsapp',
          status: 'new',
        })
        .select()
        .single();

      if (leadError) {
        console.error('Error creating lead:', leadError);
      } else {
        leadId = newLead.id;
        console.log('New lead created:', leadId);
      }
    }

    // Store WhatsApp message
    if (leadId) {
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          lead_id: leadId,
          message: message.body,
          direction: 'inbound',
          status: 'received',
        });

      if (messageError) {
        console.error('Error storing WhatsApp message:', messageError);
      }
    }

    // Send to AI assistant for response
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é Linda, assistente virtual do Olinda Verde Luxo, um espaço de eventos sofisticado.
            
INFORMAÇÕES DO ESPAÇO:
- Capacidade: até 200 pessoas
- Tipos de eventos: casamentos, corporativos, festas
- Localização: São Paulo, zona sul
- Incluso: decoração básica, som ambiente
- Valores: a partir de R$ 15.000

SUAS FUNÇÕES:
1. Responder perguntas sobre o espaço
2. Qualificar leads (nome, data do evento, tipo, número de convidados)
3. Oferecer agendamento de visita
4. Ser cordial, elegante e profissional

Responda de forma natural via WhatsApp (mensagens curtas).`,
          },
          {
            role: 'user',
            content: message.body,
          },
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 'Desculpe, houve um erro. Entre em contato pelo telefone.';

    // Store outbound message
    if (leadId) {
      await supabase
        .from('whatsapp_messages')
        .insert({
          lead_id: leadId,
          message: assistantMessage,
          direction: 'outbound',
          status: 'pending',
        });
    }

    // Send response via Meta or Twilio
    const metaToken = Deno.env.get('META_WHATSAPP_TOKEN');
    const metaPhoneId = Deno.env.get('META_PHONE_NUMBER_ID');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (metaToken && metaPhoneId) {
      // Send via Meta WhatsApp API
      const metaUrl = `https://graph.facebook.com/v17.0/${metaPhoneId}/messages`;
      
      const metaResponse = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.from,
          type: 'text',
          text: { body: assistantMessage },
        }),
      });

      if (metaResponse.ok) {
        console.log('WhatsApp response sent via Meta');
      } else {
        const errorText = await metaResponse.text();
        console.error('Meta send error:', errorText);
      }
    } else if (twilioAccountSid && twilioAuthToken && twilioPhone) {
      // Send via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${twilioPhone}`,
          To: `whatsapp:${message.from}`,
          Body: assistantMessage,
        }),
      });

      console.log('WhatsApp response sent via Twilio');
    } else {
      console.log('WhatsApp credentials not configured, response saved to database only');
    }

    return new Response(
      JSON.stringify({ success: true, leadId, response: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
