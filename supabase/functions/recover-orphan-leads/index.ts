// =====================================================
// RECOVER ORPHAN LEADS - Sistema Anti-Perda de Leads
// =====================================================
// Recupera leads de conversas órfãs (sem lead_id vinculado)
// Extração ultra-agressiva de dados de mensagens

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔥 EXTRAÇÃO ULTRA-AGRESSIVA DE DADOS
 * Captura TODOS os padrões possíveis de nome, telefone, email, evento, data
 */
function extractLeadFromMessages(messages: any[]): any {
  const fullText = messages
    .filter(m => m.role === 'user' || m.role === 'assistant' || !m.role)
    .map(m => m.body || m.content || '')
    .join(' ');

  console.log('📝 Texto completo para extração:', fullText.substring(0, 200));

  // 🎯 EXTRAÇÃO DE NOME - ULTRA AGRESSIVO
  const namePatterns = [
    /(?:me chamo|meu nome é|sou (?:a |o )?|chamada? (?:de )?|eu sou (?:a |o )?)\s*([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+(?:\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+)*)/i,
    /nome[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+(?:\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+)*)/i,
    /^([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+(?:\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+)+)\s+(?:aqui|falando)/i,
  ];

  let name = null;
  for (const pattern of namePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1] && match[1].split(' ').length >= 2) {
      name = match[1].trim();
      console.log('✅ Nome encontrado:', name);
      break;
    }
  }

  // 📞 EXTRAÇÃO DE TELEFONE - TODOS OS FORMATOS
  const phonePatterns = [
    /(?:telefone|whatsapp|celular|fone|contato)[:\s]+(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/gi,
    /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]?)\d{4,5}[\s-]?\d{4}/g,
    /\d{2}[\s-]?\d{4,5}[\s-]?\d{4}/g,
    /(?:1[1-9]|[2-9]\d)\s?9?\d{4}[\s-]?\d{4}/g,
  ];

  let phone = null;
  for (const pattern of phonePatterns) {
    const matches = fullText.match(pattern);
    if (matches && matches[0]) {
      phone = matches[0].replace(/[^\d]/g, '');
      if (phone.length >= 10) {
        console.log('✅ Telefone encontrado:', phone);
        break;
      }
    }
  }

  // 📧 EXTRAÇÃO DE EMAIL - PERMISSIVO
  const emailPatterns = [
    /(?:e-?mail|email)[:\s]+([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /(?:e-?mail|email)[:\s]+([a-zA-Z0-9._+-]+(?:\s?arroba\s?|\s?@\s?)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    /([a-zA-Z0-9._+-]+\.(?:com|com\.br|net|org|edu)\.br)/gi,
  ];

  let email = null;
  for (const pattern of emailPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      email = (match[1] || match[0]).replace(/\s/g, '').toLowerCase();
      // Corrigir emails mal formatados
      if (!email.includes('@') && email.includes('.com')) {
        const parts = email.split('.');
        if (parts.length >= 2) {
          email = `${parts[0]}@gmail.com`;
        }
      }
      console.log('✅ Email encontrado:', email);
      break;
    }
  }

  // 🎉 EXTRAÇÃO DE TIPO DE EVENTO
  const eventTypes = ['casamento', 'aniversário', 'formatura', 'corporativo', 'festa', 'debutante', 'bodas', 'confraternização'];
  let eventType = null;
  for (const type of eventTypes) {
    if (fullText.toLowerCase().includes(type)) {
      eventType = type.charAt(0).toUpperCase() + type.slice(1);
      console.log('✅ Tipo de evento encontrado:', eventType);
      break;
    }
  }

  // 📅 EXTRAÇÃO DE DATA DO EVENTO
  const datePatterns = [
    /(?:data do evento|evento em|será em|marcado para|dia)\s+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g,
    /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i,
  ];

  let eventDate = null;
  for (const pattern of datePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      if (match.length === 4 && match[2] && !match[2].match(/\d/)) {
        // Formato "DD de mês de AAAA"
        const months: { [key: string]: string } = {
          'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
          'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
          'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
        };
        const month = months[match[2].toLowerCase()];
        if (month) {
          eventDate = `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
          break;
        }
      } else if (match.length >= 4) {
        // Formato DD/MM/AAAA
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) year = `20${year}`;
        eventDate = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  // 👥 EXTRAÇÃO DE NÚMERO DE CONVIDADOS
  const guestPatterns = [
    /(\d+)\s+(?:pessoas|convidados|pessoas|pax)/i,
    /(?:para|cerca de|aproximadamente)\s+(\d+)/i,
  ];

  let guestCount = null;
  for (const pattern of guestPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      guestCount = parseInt(match[1]);
      console.log('✅ Número de convidados encontrado:', guestCount);
      break;
    }
  }

  return {
    name,
    phone,
    email,
    eventType,
    eventDate,
    guestCount,
    hasMinimalData: !!(name || (phone && phone.length >= 10) || (email && email.includes('@')))
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Iniciando recuperação de leads órfãos...');

    // 🔥 BUSCAR TODAS AS CONVERSAS ÓRFÃS (sem lead_id)
    const { data: orphanConversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, created_at, status, channel, company_id, contact_id')
      .is('lead_id', null)
      .order('created_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas órfãs:', conversationsError);
      throw conversationsError;
    }

    console.log(`📊 Conversas órfãs encontradas: ${orphanConversations?.length || 0}`);

    let recovered = 0;
    let failed = 0;
    const recoveredDetails: any[] = [];
    const failedDetails: any[] = [];

    for (const conversation of orphanConversations || []) {
      try {
        // Buscar mensagens da conversa
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error(`❌ Erro ao buscar mensagens da conversa ${conversation.id}:`, messagesError);
          failed++;
          failedDetails.push({ conversationId: conversation.id, error: messagesError.message });
          continue;
        }

        // 🔥 ACEITAR CONVERSAS COM >= 1 MENSAGEM DO USUÁRIO
        const userMessages = messages?.filter(m => 
          m.direction === 'in' || m.role === 'user' || !m.role
        ) || [];

        if (userMessages.length === 0) {
          console.log(`⚠️ Conversa ${conversation.id} sem mensagens do usuário - pulando`);
          continue;
        }

        console.log(`📝 Processando conversa ${conversation.id} com ${messages?.length} mensagens (${userMessages.length} do usuário)`);

        // Extrair dados da conversa
        const leadData = extractLeadFromMessages(messages || []);

        // 🔥 SÓ CRIAR LEAD SE TIVER DADOS MÍNIMOS REAIS
        if (!leadData.hasMinimalData) {
          console.log(`⚠️ Conversa ${conversation.id} sem dados mínimos - pulando`);
          continue;
        }

        // Obter tenant_id da conversa (via company_id ou contact_id)
        let tenantId: string | null = null;
        if (conversation.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('tenant_id')
            .eq('id', conversation.company_id)
            .single();
          tenantId = company?.tenant_id || null;
        }

        if (!tenantId) {
          // Tentar via contact_id
          if (conversation.contact_id) {
            const { data: contact } = await supabase
              .from('contacts')
              .select('company_id')
              .eq('id', conversation.contact_id)
              .single();
            
            if (contact?.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('tenant_id')
                .eq('id', contact.company_id)
                .single();
              tenantId = company?.tenant_id || null;
            }
          }
        }

        if (!tenantId) {
          console.log(`⚠️ Conversa ${conversation.id} sem tenant_id - pulando`);
          failed++;
          failedDetails.push({ conversationId: conversation.id, error: 'Tenant ID não encontrado' });
          continue;
        }

        // Preparar dados do lead
        const fullTranscript = messages?.map(m => 
          `[${m.direction || m.role || 'user'}]: ${m.body || m.content || ''}`
        ).join('\n') || '';

        const newLead = {
          name: leadData.name || 'Lead Recuperado',
          email: leadData.email || `recuperado_${Date.now()}@lead.com`,
          phone: leadData.phone || 'Pendente',
          event_type: leadData.eventType || null,
          event_date: leadData.eventDate || null,
          guest_count: leadData.guestCount || null,
          conversation_summary: fullTranscript.substring(0, 500),
          source: 'chatbot_recuperado',
          source_metadata: {
            conversation_id: conversation.id,
            channel: conversation.channel,
            recovered_at: new Date().toISOString(),
          },
          status: 'novo',
          tenant_id: tenantId,
        };

        // Criar lead
        const { data: createdLead, error: leadError } = await supabase
          .from('leads_quarantine')
          .insert(newLead)
          .select()
          .single();

        if (leadError) {
          console.error(`❌ Erro ao criar lead para conversa ${conversation.id}:`, leadError);
          failed++;
          failedDetails.push({ conversationId: conversation.id, error: leadError.message });
          continue;
        }

        // Vincular lead à conversa
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ lead_id: createdLead.id })
          .eq('id', conversation.id);

        if (updateError) {
          console.error(`❌ Erro ao vincular lead à conversa ${conversation.id}:`, updateError);
          failed++;
          failedDetails.push({ conversationId: conversation.id, error: updateError.message });
          continue;
        }

        console.log(`✅ Lead ${createdLead.id} criado e vinculado à conversa ${conversation.id}`);
        recovered++;
        recoveredDetails.push({ 
          conversationId: conversation.id, 
          leadId: createdLead.id, 
          name: leadData.name 
        });

      } catch (error: any) {
        console.error(`❌ Erro ao processar conversa ${conversation.id}:`, error);
        failed++;
        failedDetails.push({ conversationId: conversation.id, error: error.message });
      }
    }

    console.log(`✅ Recuperação concluída: ${recovered} sucesso, ${failed} falhas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recovered, 
        failed,
        details: {
          recovered: recoveredDetails,
          failed: failedDetails
        },
        message: `${recovered} leads recuperados com sucesso` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

