/**
 * Provider: WhatsApp (Twilio)
 * Se credenciais WA não existirem, retorna erro explícito
 * SEM MOCKS - usa API real do Twilio
 */

type WhatsAppOptions = {
  to: string; // formato: +5511999999999
  content: string;
};

export async function sendWhatsApp(options: WhatsAppOptions) {
  const { to, content } = options;

  // Validar ENV
  const provider = process.env.WA_PROVIDER || 'twilio';

  if (provider === 'twilio') {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
      throw new Error('WhatsApp (Twilio) não configurado. Verifique ENV: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM');
    }

    const t0 = performance.now();

    try {
      // Twilio WhatsApp API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;

      const body = new URLSearchParams({
        From: process.env.TWILIO_WHATSAPP_FROM,
        To: `whatsapp:${to}`,
        Body: content,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const latency = Math.round(performance.now() - t0);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Twilio error: ${res.status}`);
      }

      const json = await res.json();

      return {
        success: true,
        messageId: json.sid,
        latency,
        provider: 'twilio',
      };
    } catch (e: any) {
      const latency = Math.round(performance.now() - t0);
      throw {
        success: false,
        error: e.message,
        latency,
        provider: 'twilio',
      };
    }
  }

  throw new Error(`Provider WhatsApp '${provider}' não suportado`);
}

