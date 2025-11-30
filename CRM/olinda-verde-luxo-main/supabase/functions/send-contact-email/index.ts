import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SMTP_HOST = "mail.espacoolinda.com.br";
const SMTP_PORT = 465;
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";

interface ContactPayload {
  to?: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  date?: string;
  message: string;
  website?: string; // Honeypot field
  attachments?: Array<{
    name: string;
    type: string;
    data: string; // base64
  }>;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(text: string) {
  return String(text).replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error("Método não permitido:", req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    console.log("Recebendo requisição de contato...");
    const body: ContactPayload = await req.json();
    console.log("Dados recebidos:", { name: body.name, email: body.email, eventType: body.eventType });

    // Honeypot check - bots typically fill hidden fields
    if (body.website) {
      console.warn("Bot detected via honeypot field");
      return new Response(JSON.stringify({ ok: true, emailSent: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Spam pattern detection
    const spamPatterns = /\b(viagra|cialis|casino|lottery|crypto|bitcoin|forex|pills|porn)\b/i;
    if (spamPatterns.test(body.message) || spamPatterns.test(body.name)) {
      console.warn("Spam pattern detected in submission");
      return new Response(JSON.stringify({ error: "Conteúdo suspeito detectado" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate input lengths
    if (!body.name || body.name.trim().length < 2 || body.name.length > 100) {
      return new Response(JSON.stringify({ error: "Nome deve ter entre 2 e 100 caracteres" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!body.message || body.message.trim().length < 3 || body.message.length > 2000) {
      return new Response(JSON.stringify({ error: "Mensagem deve ter entre 3 e 2000 caracteres" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (body.phone && body.phone.length > 30) {
      return new Response(JSON.stringify({ error: "Telefone inválido (máximo 30 caracteres)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const DESTINATION = "consultores@espacoolinda.com.br";
    if (body.to && body.to.toLowerCase() !== DESTINATION.toLowerCase()) {
      console.warn("Ignorando 'to' fornecido pelo cliente; usando destinatário fixo.");
    }

    if (!isValidEmail(body.email)) {
      console.error("E-mail do remetente inválido:", body.email);
      return new Response(JSON.stringify({ error: "E-mail do remetente inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error("Credenciais SMTP não configuradas!");
      return new Response(JSON.stringify({ error: "Configuração de e-mail ausente. Entre em contato por WhatsApp." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Inicializando cliente SMTP...");

    const attachmentsList = body.attachments && body.attachments.length > 0
      ? `<p><strong>Arquivos anexados (${body.attachments.length}):</strong></p><ul>${body.attachments.map(a => `<li>${sanitize(a.name)}</li>`).join('')}</ul>`
      : '';

    const html = `
      <h2>Novo contato via site - Espaço Olinda</h2>
      <p><strong>Nome:</strong> ${sanitize(body.name)}</p>
      <p><strong>E-mail:</strong> ${sanitize(body.email)}</p>
      <p><strong>Telefone:</strong> ${sanitize(body.phone)}</p>
      <p><strong>Tipo de evento:</strong> ${sanitize(body.eventType)}</p>
      ${body.date ? `<p><strong>Data:</strong> ${sanitize(body.date)}</p>` : ""}
      <p><strong>Mensagem:</strong></p>
      <p>${sanitize(body.message).replace(/\n/g, "<br/>")}</p>
      ${attachmentsList}
    `;

    const subject = `Novo contato: ${sanitize(body.name)} • ${sanitize(body.eventType)}`;

    // Salva o lead no banco (best-effort)
    try {
      let eventDate: string | null = null;
      if (body.date) {
        const d = new Date(body.date);
        if (!isNaN(d.getTime())) {
          eventDate = d.toISOString().slice(0, 10);
        }
      }
      const leadInsert = {
        name: String(body.name ?? '').slice(0, 100),
        email: String(body.email ?? '').slice(0, 255),
        phone: String(body.phone ?? '').slice(0, 50),
        event_type: String(body.eventType ?? '').slice(0, 100),
        event_date: eventDate,
        message: String(body.message ?? '').slice(0, 1000),
        status: 'novo',
        source: 'website',
      };
      const { error: dbError } = await supabase.from('leads').insert(leadInsert);
      if (dbError) {
        console.error('Erro ao salvar lead:', dbError);
      } else {
        console.log('✅ Lead salvo com sucesso');
      }
    } catch (dbEx) {
      console.error('Exceção ao salvar lead:', dbEx);
    }

    console.log("Enviando email para:", DESTINATION);

    try {
      const client = new SMTPClient({
        connection: {
          hostname: SMTP_HOST,
          port: SMTP_PORT,
          tls: true,
          auth: {
            username: SMTP_USER,
            password: SMTP_PASSWORD,
          },
        },
      });

      const emailConfig: any = {
        from: SMTP_USER,
        to: DESTINATION,
        subject,
        html,
        headers: {
          "Reply-To": body.email,
        },
      };

      // Add attachments if present
      if (body.attachments && body.attachments.length > 0) {
        emailConfig.attachments = body.attachments.map(att => ({
          filename: att.name,
          content: att.data,
          encoding: 'base64',
          contentType: att.type,
        }));
      }

      await client.send(emailConfig);

      await client.close();

      console.log("✅ Email enviado com sucesso via SMTP!");
      return new Response(JSON.stringify({ ok: true, emailSent: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (emailError) {
      console.error("❌ Erro ao enviar email via SMTP:", emailError);
      console.warn("Lead foi salvo, mas email não foi enviado.");
      return new Response(JSON.stringify({ ok: true, emailSent: false, error: "Serviço de email temporariamente indisponível" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (err) {
    console.error("❌ Exceção em send-contact-email:", err);
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação. Por favor, tente novamente ou entre em contato via WhatsApp." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
