/**
 * Provider: SMTP (Envio de E-mail)
 * Se credenciais SMTP não existirem, retorna erro explícito
 * SEM MOCKS - usa Nodemailer com credenciais reais
 */
import nodemailer from 'nodemailer';

type EmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text } = options;

  // Validar ENV
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP não configurado. Verifique ENV: SMTP_HOST, SMTP_USER, SMTP_PASS');
  }

  const t0 = performance.now();

  try {
    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Enviar
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    const latency = Math.round(performance.now() - t0);

    return {
      success: true,
      messageId: info.messageId,
      latency,
      provider: 'smtp',
    };
  } catch (e: any) {
    const latency = Math.round(performance.now() - t0);
    throw {
      success: false,
      error: e.message,
      latency,
      provider: 'smtp',
    };
  }
}

