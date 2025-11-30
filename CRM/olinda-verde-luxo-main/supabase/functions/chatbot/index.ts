import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract lead information from conversation and create lead automatically
async function checkAndCreateLead(supabase: any, session: any, messages: any[]) {
  try {
    // Check if lead was already created for this session
    if (session.session_data?.lead_created) {
      return false;
    }

    // Extract information from conversation
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Check if we have enough information (name, phone/email, and event type)
    const nameMatch = conversationText.match(/meu nome (?:é|eh|e) ([a-záàâãéèêíïóôõöúçñ\s]+)/i);
    const phoneMatch = conversationText.match(/\(?(\d{2})\)?\s?9?\d{4}-?\d{4}/);
    const emailMatch = conversationText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const eventMatch = conversationText.match(/casamento|evento|festa|corporativo|aniversário|formatura|confraternização/i);

    const hasName = session.session_data?.leadName || nameMatch;
    const hasContact = session.session_data?.leadPhone || phoneMatch || emailMatch;
    const hasEventType = eventMatch;

    // Only create lead if we have minimum required information
    if (!hasName || !hasContact || !hasEventType) {
      console.log("Not enough information to create lead yet");
      return false;
    }

    // Extract the actual values
    const name = session.session_data?.leadName || nameMatch?.[1]?.trim() || "Lead WhatsApp";
    const phone = session.session_data?.leadPhone || phoneMatch?.[0] || "";
    const email = emailMatch?.[0] || "";
    const eventType = eventMatch?.[0]?.toLowerCase() || "consulta";

    // Check if lead already exists with this phone or email
    if (phone || email) {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .or(`phone.eq.${phone},email.eq.${email}`)
        .limit(1);

      if (existingLead && existingLead.length > 0) {
        console.log("Lead already exists with this contact");
        // Still mark session as processed
        await supabase
          .from('chat_sessions')
          .update({
            session_data: { ...session.session_data, lead_created: true },
            lead_id: existingLead[0].id
          })
          .eq('id', session.id);
        return false;
      }
    }

    // Create lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name,
        email: email || `whatsapp_${Date.now()}@temporario.com`,
        phone: phone || "Informado via chat",
        event_type: eventType,
        message: `Lead gerado automaticamente via WhatsApp Chatbot.\n\nConversa disponível na sessão: ${session.id}\n\nÚltimas mensagens: ${messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`,
        status: 'novo',
        source: 'whatsapp'
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return false;
    }

    // Update session to mark lead as created and link to lead
    await supabase
      .from('chat_sessions')
      .update({
        session_data: { ...session.session_data, lead_created: true },
        lead_id: newLead.id
      })
      .eq('id', session.id);

    console.log("Lead created successfully from WhatsApp conversation:", newLead.id);
    return true;
  } catch (error) {
    console.error("Error in checkAndCreateLead:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, leadName, leadPhone } = await req.json();
    console.log("Chatbot request:", { message, sessionId, leadName, leadPhone });

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create chat session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      // Create new session
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          status: 'active',
          session_data: { leadName, leadPhone }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      session = newSession;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      role: 'user',
      content: message
    });

    // Get conversation history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    // Prepare messages for AI
    const conversationMessages = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Call OpenAI GPT-4o-mini API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é Linda, a assistente virtual do Espaço Olinda - um espaço de eventos em meio à natureza.

Informações sobre o local:
- Nome: Espaço Olinda
- Serviços: Casamentos, eventos corporativos, festas, hospedagem
- Localização: Em meio à natureza
- Infraestrutura completa para eventos
- Gastronomia personalizada
- Hospedagem disponível

Sua função:
1. Responder perguntas sobre o espaço, serviços e disponibilidade de forma RÁPIDA e DIRETA
2. Coletar informações básicas: nome, tipo de evento, data desejada, número de convidados
3. Oferecer agendamento de visita quando apropriado
4. Ser cordial, prestativo e profissional
5. Responder em português brasileiro
6. Manter respostas CURTAS e OBJETIVAS (máximo 2-3 parágrafos)

Quando tiver as informações básicas (nome, tipo de evento, data, número de convidados), sugira agendar uma visita ou conversar com nossa equipe.`
          },
          ...conversationMessages
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Por favor, aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Save assistant message
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: assistantMessage
    });

    // Check if we should create a lead from this conversation
    const leadCreated = await checkAndCreateLead(supabase, session, messages || []);
    
    console.log("Chatbot response generated successfully", leadCreated ? "- Lead created" : "");

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        sessionId: session.id,
        leadCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chatbot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});